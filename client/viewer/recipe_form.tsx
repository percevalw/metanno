import React, { useEffect, useMemo, useRef, useState } from "react";
import AutoSuggest from "react-autosuggest";
import { ExplorerKernelConnection, KernelClient, RecipeFormData, RecipeParameter, TablePick } from "./kernel_client";
import { tableLabel } from "./source_view";

// A table the pickers can offer, listed by the sidebar, in the annotation files, or in the sources of picked tables
type Candidate = TablePick & { key: string };

const candidateKey = (pick: TablePick) => `${pick.source}\n${pick.table}`;

// Folder of a table of a file source, eg runs for runs/notes, empty for a catalogue table
const folderOf = (table: string) => table.split("/").slice(0, -1).join("/");

// Score a table for a Store key of the recipe, higher first in its picker. A table whose name matches the keywords
// of the key, or the key itself, scores 4, 5 when the last word of the name matches, as in the tnm of note_tnm, and 1
// when only its source matches. A table close to the tables picked for the other keys scores 3 more for the same
// source and 1 for each folder they share, so picking xxx.note brings xxx.note_tnm before the tnm tables of other
// databases
function scoreCandidate(candidate: TablePick, key: string, keywords: string[], picked: TablePick[]): number {
  const name = candidate.table.split("/").pop()!;
  const full = tableLabel(candidate.source, candidate.table);
  const patterns = [...keywords, key, key.replace(/s$/, "")].flatMap((keyword) => {
    try {
      return [new RegExp(keyword, "i")];
    } catch {
      return [];
    }
  });
  const last = name.split(/[_\-.]/).pop()!;
  let score = patterns.some((pattern) => pattern.test(name))
    ? patterns.some((pattern) => pattern.test(last))
      ? 5
      : 4
    : patterns.some((pattern) => pattern.test(full))
    ? 1
    : 0;
  for (const other of picked) {
    if (other.source !== candidate.source) continue;
    if (other.table === candidate.table) return score - 10;
    score += 3;
    const shared = folderOf(other.table).split("/");
    const folders = folderOf(candidate.table).split("/");
    for (let idx = 0; idx < shared.length && shared[idx] && shared[idx] === folders[idx]; idx++) score += 1;
  }
  return score;
}

// The tables already in the view fill the keys of the same name, then the keys whose keywords match their name, the
// best matching pairs first, e.g. a note_tnm table tab switched to a recipe reading notes and entities fills entities
// through its tnm keyword rather than notes
function prefill(form: RecipeFormData): Record<string, TablePick | null> {
  const picks: Record<string, TablePick | null> = {};
  for (const key of Object.keys(form.tables)) picks[key] = form.current[key] ?? null;
  const unused = Object.entries(form.current)
    .filter(([key]) => !(key in form.tables))
    .map(([, pick]) => pick);
  const pairs = Object.entries(form.tables)
    .filter(([key]) => !picks[key])
    .flatMap(([key, declared]) =>
      unused.map((pick) => ({
        key,
        pick,
        score: scoreCandidate(pick, key, declared.keywords, []),
      }))
    )
    .filter((pair) => pair.score >= 4)
    .sort((a, b) => b.score - a.score);
  const used = new Set<TablePick>();
  for (const pair of pairs) {
    if (picks[pair.key] || used.has(pair.pick)) continue;
    picks[pair.key] = pair.pick;
    used.add(pair.pick);
  }
  return picks;
}

// Declaration shown by the form of a recipe that does not say which tables it reads
const TABLES_EXAMPLE = [
  "class Tables(TypedDict):",
  '    notes: Annotated[DataFrame, RecipeTable("Clinical notes", keywords=["note", "doc"])]',
  "    entities: DataFrame",
  "",
  "",
  "def main(store: Tables):",
].join("\n");

// An option of an autocomplete field, its key identifies the table or value it picks
type Suggestion = { key: string; text: string };

// Autocomplete field of the table pickers and of the parameters with choices or columns: it shows the chosen text,
// typing filters the suggestions with the typed text in bold, and clicking or Enter on a suggestion picks it.
// Suggestions are null while they load, so the placeholder says why instead
function SuggestField({
  label,
  value,
  suggestions,
  placeholder,
  onPick,
}: {
  label: string;
  value: string;
  suggestions: Suggestion[] | null;
  placeholder: string;
  onPick(key: string): void;
}) {
  // Text typed since the field took the focus, null while it shows the chosen text
  const [typed, setTyped] = useState<string | null>(null);
  // Set by a pick until the next typing or focus: a pick changes the suggestions, e.g. the other pickers fill in, and
  // AutoSuggest would open them again in the still focused field
  const picked = useRef(false);
  const search = (typed ?? "").toLowerCase();
  const shown = (suggestions ?? []).filter((suggestion) => suggestion.text.toLowerCase().includes(search));
  return (
    <AutoSuggest
      suggestions={shown}
      onSuggestionsFetchRequested={() => {}}
      onSuggestionsClearRequested={() => {}}
      shouldRenderSuggestions={(_, reason) => !(picked.current && reason === "suggestions-updated")}
      highlightFirstSuggestion
      getSuggestionValue={(suggestion) => suggestion.text}
      renderSuggestion={(suggestion) => {
        const at = search ? suggestion.text.toLowerCase().indexOf(search) : -1;
        return at < 0 ? (
          <span>{suggestion.text}</span>
        ) : (
          <span>
            {suggestion.text.slice(0, at)}
            <strong>{suggestion.text.slice(at, at + search.length)}</strong>
            {suggestion.text.slice(at + search.length)}
          </span>
        );
      }}
      onSuggestionSelected={(_, { suggestion }) => {
        picked.current = true;
        onPick(suggestion.key);
        setTyped(null);
      }}
      inputProps={{
        "aria-label": label,
        placeholder,
        value: typed ?? value,
        onChange: (_, { newValue, method }) => {
          if (method !== "type") return;
          picked.current = false;
          setTyped(newValue);
        },
        onFocus: (event) => {
          picked.current = false;
          event.target.select();
        },
        onBlur: () => setTyped(null),
      }}
    />
  );
}

// Text of the field of a parameter, from the value the view already has or the default of the recipe: a checkbox
// state for a boolean, the position of the value for choices, JSON for other types
function parameterInput(parameter: RecipeParameter, value: unknown): string | boolean {
  if (parameter.kind === "boolean") return Boolean(value);
  if (value === undefined || value === null) return "";
  if (parameter.kind === "choice")
    return String(parameter.choices!.findIndex((choice) => JSON.stringify(choice) === JSON.stringify(value)));
  return parameter.kind === "json" ? JSON.stringify(value) : String(value);
}

// Value of a parameter from its field, undefined when left empty so the recipe default applies, or the message of
// a number or JSON text that does not parse
function parameterValue(parameter: RecipeParameter, input: string | boolean): { value?: unknown; error?: string } {
  if (parameter.kind === "boolean") return { value: input };
  if (input === "" || input === "-1") return {};
  if (parameter.kind === "integer" || parameter.kind === "number")
    return isNaN(Number(input)) ? { error: "Not a number" } : { value: Number(input) };
  if (parameter.kind === "choice") return { value: parameter.choices![Number(input)] };
  if (parameter.kind === "json") {
    try {
      return { value: JSON.parse(input as string) };
    } catch {
      return { error: 'Not valid JSON, e.g. ["a", "b"] or {"key": 1}' };
    }
  }
  return { value: input };
}

// Field of a recipe parameter, a list of the columns of its table for a Column parameter
function ParameterField({
  parameter,
  input,
  columns,
  error,
  onChange,
}: {
  parameter: RecipeParameter;
  input: string | boolean;
  columns: string[] | null;
  error: string | null;
  onChange(input: string | boolean): void;
}) {
  const label = `Parameter ${parameter.name}`;
  let field: JSX.Element;
  if (parameter.kind === "boolean")
    field = (
      <input
        type="checkbox"
        aria-label={label}
        checked={input as boolean}
        onChange={(event) => onChange(event.target.checked)}
      />
    );
  else if (parameter.kind === "choice" || parameter.kind === "column") {
    // We keep a Column value even when its table lacks it (e.g. before the table is picked), and since an optional
    // parameter can go back to its default, we offer Default first
    const options =
      parameter.kind === "choice"
        ? parameter.choices!.map((choice, idx) => ({ key: String(idx), text: String(choice) }))
        : columns && columns.map((name) => ({ key: name, text: name }));
    field = (
      <SuggestField
        label={label}
        value={
          parameter.kind === "choice" && input !== "" ? String(parameter.choices![Number(input)]) : (input as string)
        }
        suggestions={options && [...(parameter.required ? [] : [{ key: "", text: "Default" }]), ...options]}
        placeholder={
          parameter.kind === "column" && !columns ? "Pick its table first" : parameter.required ? "Required" : "Default"
        }
        onPick={onChange}
      />
    );
  } else
    field = (
      <input
        className="metanno-viewer__recipe-input"
        aria-label={label}
        type={parameter.kind === "integer" || parameter.kind === "number" ? "number" : "text"}
        placeholder={parameter.required ? "Required" : "Default"}
        value={input as string}
        onChange={(event) => onChange(event.target.value)}
      />
    );
  return (
    <label className={`metanno-viewer__recipe-field${parameter.kind === "boolean" ? " is-inline" : ""}`}>
      <span>
        <strong>{parameter.name}</strong>
        {parameter.description && <span className="metanno-viewer__recipe-description">{parameter.description}</span>}
      </span>
      {field}
      {error && <span className="metanno-viewer__recipe-error">{error}</span>}
    </label>
  );
}

/**
 * Pick a table for each Store key a recipe reads, in a tab opened from the Recipes section of the sidebar or whose
 * recipe selector chose a recipe the view has no tables for, and set its parameters. onOpen opens the view in the tab
 */
export function RecipeForm({
  explorer,
  manager,
  form,
  onOpen,
}: {
  explorer: ExplorerKernelConnection;
  manager: KernelClient;
  form: RecipeFormData;
  onOpen(tables: Record<string, TablePick>, parameters: Record<string, unknown>): void;
}) {
  const [picks, setPicks] = useState(() => prefill(form));
  // Keys filled from the database of another pick, emptied when the user picks a table so they follow the new pick
  const [filled, setFilled] = useState(() => new Set<string>());
  // Field texts of the parameters, and the columns of the picked tables offered by Column parameters
  const [inputs, setInputs] = useState(() =>
    Object.fromEntries(
      form.parameters.map((parameter) => [
        parameter.name,
        parameterInput(parameter, parameter.name in form.values ? form.values[parameter.name] : parameter.default),
      ])
    )
  );
  const [columns, setColumns] = useState<Record<string, string[]>>({});
  const [candidates, setCandidates] = useState<Record<string, Candidate>>({});
  // Listings still running, whether listed_tables replied, and whether every first listing replied, after which the
  // suggestions show and follow the tables listed later
  const [listing, setListing] = useState(0);
  const [known, setKnown] = useState(false);
  const [settled, setSettled] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [listed] = useState(() => new Set<string>());
  // Listings that failed, e.g. a Trino source before its login, retried when the sidebar lists something
  const [failed] = useState(() => new Set<string>());
  // Listings made for each source, which bounds the folders listed under a file source
  const [folders] = useState(() => new Map<string, number>());

  // We list a source or a folder of a file source only once, and its tables become candidates of every picker. Since
  // datasets often sit a few folders below the source uri, we also list subfolders (4 levels and 200 folders per
  // source at most, e.g. eds-doc-classif/pool/notes). Only the sources of picked tables get listed here, since the
  // other tables come from the sidebar
  const list = (source: string, folder = "") => {
    const id = `${source}\n${folder}`;
    if (listed.has(id)) return;
    const count = folders.get(source) ?? 0;
    if (folder && count >= 200) return;
    folders.set(source, count + 1);
    listed.add(id);
    setListing((count) => count + 1);
    void manager
      .request<{ tables: { name: string; kind: string }[] }>("list_tables", { source, folder }, 300000)
      .then((reply) => {
        addTables(source, reply.data.tables);
        for (const entry of reply.data.tables)
          if (entry.kind === "folder" && entry.name.split("/").length < 4) list(source, entry.name);
      })
      .catch(() => failed.add(id))
      .finally(() => setListing((count) => count - 1));
  };

  // Add the tables of a listing to the candidates of every picker
  const addTables = (source: string, tables: { name: string; kind: string }[]) =>
    setCandidates((current) => {
      const next = { ...current };
      for (const entry of tables) {
        if (entry.kind !== "table") continue;
        const key = candidateKey({ source, table: entry.name });
        next[key] = { source, table: entry.name, key };
      }
      return next;
    });

  // Tables listed by the sidebar join the candidates, and each sidebar listing retries the failed ones, so a source
  // that needed a login in the sidebar shows its tables here without reopening the form
  useEffect(
    () =>
      explorer.onListing((source, tables) => {
        if (tables) addTables(source, tables);
        for (const id of [...failed]) {
          failed.delete(id);
          listed.delete(id);
          const [retried, folder] = id.split("\n");
          list(retried, folder);
        }
      }),
    [explorer]
  );

  useEffect(() => {
    if (known && listing === 0) setSettled(true);
  }, [known, listing]);

  useEffect(() => {
    // We start from the tables listed so far by the sidebar or other forms, since listing every source can take
    // minutes (e.g. Spark sources)
    void manager
      .request<{ listings: { source: string; tables: { name: string; kind: string }[] }[] }>("listed_tables", {})
      .then((reply) => {
        reply.data.listings.forEach((entry) => addTables(entry.source, entry.tables));
        // Annotation files are local and quick to list, so we offer their tables without opening them in the sidebar
        list("annotations");
      })
      .catch((reason) => setError(String(reason?.message ?? reason)))
      .finally(() => setKnown(true));
  }, [manager]);

  useEffect(() => {
    for (const pick of Object.values(picks)) {
      if (!pick) continue;
      list(pick.source);
      if (folderOf(pick.table)) list(pick.source, folderOf(pick.table));
    }
  }, [picks]);

  // An empty key takes the table of the same database as a picked table, named as the key or one of its keywords,
  // e.g. picking cse250022.person fills visit_occurrence with cse250022.visit_occurrence once cse250022 is listed
  useEffect(() => {
    const next = { ...picks };
    const added: string[] = [];
    for (const [key, declared] of Object.entries(form.tables)) {
      if (next[key]) continue;
      const names = [key, ...declared.keywords].map((name) => name.toLowerCase());
      const taken = new Set(Object.values(next).flatMap((pick) => (pick ? [candidateKey(pick)] : [])));
      const match = Object.values(next).flatMap((anchor) =>
        anchor
          ? Object.values(candidates).filter(
              (candidate) =>
                candidate.source === anchor.source &&
                folderOf(candidate.table) === folderOf(anchor.table) &&
                names.includes(candidate.table.split("/").pop()!.toLowerCase()) &&
                !taken.has(candidate.key)
            )
          : []
      )[0];
      if (!match) continue;
      next[key] = { source: match.source, table: match.table };
      added.push(key);
    }
    if (!added.length) return;
    setPicks(next);
    setFilled((current) => new Set([...current, ...added]));
  }, [candidates, picks]);

  // Candidates of each key from the most to the least likely, null until every first listing has replied
  const ranked = useMemo(() => {
    if (!settled) return null;
    const result: Record<string, Candidate[]> = {};
    for (const [key, declared] of Object.entries(form.tables)) {
      const others = Object.entries(picks)
        .filter(([other, pick]) => other !== key && pick)
        .map(([, pick]) => pick!);
      result[key] = Object.values(candidates)
        .map((candidate) => ({
          candidate,
          score: scoreCandidate(candidate, key, declared.keywords, others),
        }))
        .sort((a, b) => b.score - a.score || a.candidate.key.localeCompare(b.candidate.key))
        .map((entry) => entry.candidate);
    }
    return result;
  }, [candidates, picks, form, settled]);

  useEffect(() => {
    for (const parameter of form.parameters) {
      const pick = parameter.table ? picks[parameter.table] : null;
      if (!pick || columns[candidateKey(pick)]) continue;
      void manager
        .request<{ columns: string[] }>("table_columns", { ...pick }, 300000)
        .then((reply) => setColumns((current) => ({ ...current, [candidateKey(pick)]: reply.data.columns })))
        .catch(() => {});
    }
  }, [picks]);

  // Values given to the recipe (parameters left empty take their default), and the errors of the fields, i.e. numbers
  // and JSON that do not parse, then the kernel errors of the values the view was opened with
  const parsed = form.parameters.map(
    (parameter) => [parameter, parameterValue(parameter, inputs[parameter.name])] as const
  );
  const values = Object.fromEntries(
    parsed
      .filter(([, result]) => result.value !== undefined)
      .map(([parameter, result]) => [parameter.name, result.value])
  );
  const complete =
    Object.keys(form.tables).length > 0 &&
    Object.keys(form.tables).every((key) => picks[key]) &&
    parsed.every(([parameter, result]) => !result.error && (!parameter.required || result.value !== undefined));

  return (
    <div className="metanno-viewer__recipe-form" role="form" aria-label={`Tables of ${form.recipe}`}>
      <div className="metanno-viewer__recipe-column">
        <div className="metanno-viewer__recipe-form-title">Choose the tables of the {form.recipe} recipe</div>
        {Object.keys(form.tables).length === 0 && (
          <div className="metanno-viewer__recipe-note">
            This recipe does not say which tables it reads. Annotate the store parameter of its main with a TypedDict of
            the Store keys it reads, with a description and words their table names often contain, then reload the
            sidebar:
            <pre>{TABLES_EXAMPLE}</pre>
          </div>
        )}
        {error && <div className="metanno-viewer__error">{error}</div>}
        {form.parameters.length > 0 && <div className="metanno-viewer__recipe-section">Tables</div>}
        {Object.entries(form.tables).map(([key, declared]) => (
          <label key={key} className="metanno-viewer__recipe-field">
            <span>
              <strong>{key}</strong>
              {declared.description && (
                <span className="metanno-viewer__recipe-description">{declared.description}</span>
              )}
            </span>
            <SuggestField
              label={`Table for ${key}`}
              value={picks[key] ? tableLabel(picks[key]!.source, picks[key]!.table) : ""}
              suggestions={
                ranked &&
                ranked[key].map((candidate) => ({
                  key: candidate.key,
                  text: tableLabel(candidate.source, candidate.table),
                }))
              }
              placeholder={
                !ranked
                  ? `Listing tables, ${listing} sources left`
                  : ranked[key].length
                  ? "Search tables"
                  : "Open sources in the sidebar to list their tables"
              }
              onPick={(pick) => {
                setPicks({
                  ...Object.fromEntries(
                    Object.entries(picks).map(([other, value]) => [other, filled.has(other) ? null : value])
                  ),
                  [key]: { source: candidates[pick].source, table: candidates[pick].table },
                });
                setFilled(new Set());
              }}
            />
          </label>
        ))}
        {form.parameters.length > 0 && <div className="metanno-viewer__recipe-section">Parameters</div>}
        {parsed.map(([parameter, result]) => {
          const pick = parameter.table ? picks[parameter.table] : null;
          const submitted = parameter.name in form.values && form.errors[parameter.name];
          return (
            <ParameterField
              key={parameter.name}
              parameter={parameter}
              input={inputs[parameter.name]}
              columns={pick ? columns[candidateKey(pick)] ?? null : null}
              error={result.error ?? (submitted ? form.errors[parameter.name] : null)}
              onChange={(input) => setInputs({ ...inputs, [parameter.name]: input })}
            />
          );
        })}
        {Object.keys(form.tables).length > 0 && (
          <div className="metanno-viewer__recipe-actions">
            <button
              className="metanno-viewer__toolbar-button"
              disabled={!complete}
              onClick={() =>
                onOpen(Object.fromEntries(Object.entries(picks).map(([key, pick]) => [key, pick!])), values)
              }
            >
              Open view
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
