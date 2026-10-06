import { useEffect, useMemo, useRef, useState } from "react";
import type { ClientDataFrame, DataFrameDescription, DataFrameRowSource } from "pret";

import { filterAst } from "./components/Table/dataframeFilters";
import type { Filters, RowData, TableSort } from "./types";

// Filter trees of PRET DataFrame queries, evaluated in the browser for Store lists
type FilterNode =
  | { kind: "and"; children: FilterNode[] }
  | { kind: "or"; children: FilterNode[] }
  | { kind: "not"; child: FilterNode }
  | { kind: "predicate"; column: string; operator: string; value?: any };

export type RowsView = {
  rowSource: DataFrameRowSource | null;
  // Last source while a DataFrame query replaces it, the table keeps showing it meanwhile
  previousRowSource: DataFrameRowSource | null;
  contentVersion: unknown;
  description: DataFrameDescription | null;
  loading: string | null;
  error: string | null;
};

function isDataFrame(data: any): data is ClientDataFrame {
  return !!data?.__pret_dataframe__;
}

// Describe list columns in first seen order, the type is only used to parse filter text and show booleans
function describeRows(rows: RowData[], primaryKey: string): DataFrameDescription {
  const types = new Map<string, string>();
  for (const row of rows) {
    for (const [name, value] of Object.entries(row)) {
      if (types.get(name) !== undefined && types.get(name) !== "null") continue;
      types.set(
        name,
        value == null
          ? "null"
          : typeof value === "boolean"
          ? "bool"
          : typeof value === "number"
          ? Number.isInteger(value)
            ? "int64"
            : "double"
          : typeof value === "string"
          ? "string"
          : "json"
      );
    }
  }
  return {
    columns: [...types].map(([name, type]) => ({ name, type: type === "null" ? "string" : type, nullable: true })),
    row_count: rows.length,
    internal_id_col: primaryKey,
    capabilities: { edit: true, source_filters: false, changes: false, stable_identity: true },
  };
}

function matches(node: FilterNode, row: RowData): boolean {
  if (node.kind === "and") return node.children.every((child) => matches(child, row));
  if (node.kind === "or") return node.children.some((child) => matches(child, row));
  if (node.kind === "not") return !matches(node.child, row);
  const value = row[node.column];
  const target = node.value;
  switch (node.operator) {
    case "is_null":
      return value == null;
    case "is_not_null":
      return value != null;
    case "in":
      return target.includes(value);
    case "eq":
      return value === target;
    case "ne":
      return value !== target;
  }
  if (value == null) return false;
  // Text operators ignore case like SQLite LIKE does for DataFrames
  const text = String(value).toLowerCase();
  const needle = String(target).toLowerCase();
  switch (node.operator) {
    case "contains":
      return text.includes(needle);
    case "starts_with":
      return text.startsWith(needle);
    case "ends_with":
      return text.endsWith(needle);
    case "lt":
      return value < target;
    case "lte":
      return value <= target;
    case "gt":
      return value > target;
    case "gte":
      return value >= target;
  }
  throw new Error(`Unsupported filter operator ${node.operator}`);
}

// Rows of a Store list after filtering and sorting, read synchronously by the grid through getCachedRow.
// The object stays the same while its filter and sort do, a new revision tells the grid its rows changed
class ListRowSource implements DataFrameRowSource {
  rows: RowData[] = [];
  revision = 0;
  private byKey = new Map<unknown, RowData>();

  constructor(private primaryKey: string) {}

  get rowCount() {
    return this.rows.length;
  }

  update(rows: RowData[]) {
    this.rows = rows;
    this.byKey = new Map(rows.map((row) => [row[this.primaryKey], row]));
    this.revision++;
  }

  subscribeRows() {
    return () => {};
  }

  getCachedRow(index: number) {
    return this.rows[index];
  }

  async getRows(start: number, end: number) {
    return this.rows.slice(start, end);
  }

  async getRowKeys(start: number, end: number) {
    return this.rows.slice(start, end).map((row) => row[this.primaryKey]);
  }

  async findRowIndex(key: string | number) {
    return this.rows.findIndex((row) => row[this.primaryKey] === key);
  }

  async getRowsAtIndices(indices: number[]) {
    return indices.map((index) => this.rows[index]).filter(Boolean);
  }

  async getRowsByKeys(keys: unknown[]) {
    return keys.map((key) => this.byKey.get(key)).filter(Boolean) as RowData[];
  }
}

/**
 * Combine header filter text by column with an extra filter tree, such as a related table selection.
 *
 * Returns the filter tree and the parse error, the last valid tree is kept while the user is still typing.
 * use_rows in widget_data.py passes the tree to use_dataframe_view for DataFrames.
 */
export function useRowFilter(
  description: DataFrameDescription | null,
  filters: Filters | null,
  filter: FilterNode | null
) {
  const valid = useRef<FilterNode | null>(null);
  let error: string | null = null;
  try {
    const parsed = description && filters ? (filterAst(description, filters) as FilterNode | null) : null;
    valid.current = parsed && filter ? { kind: "and", children: [parsed, filter] } : parsed ?? filter;
  } catch (reason) {
    error = String((reason as Error).message ?? reason);
  }
  return [valid.current, error] as const;
}

/**
 * Show the rows of a Store list snapshot through the same row source interface as a DataFrame view.
 *
 * `rows` is read from the Store list `list` by use_rows in widget_data.py with use_store_snapshot, another list
 * gets a new row source. `filters` holds header filter text by column and `filter` an extra filter tree. The
 * factory table passes the returned rowSource to Table and reads columns from description.
 */
export function useListRows(
  list: unknown,
  rows: RowData[],
  primaryKey: string,
  filters: Filters | null = null,
  filter: FilterNode | null = null,
  sort: TableSort = []
): RowsView & { filterError: string | null } {
  const description = useMemo(() => describeRows(rows, primaryKey), [rows, primaryKey]);
  const [ast, filterError] = useRowFilter(description, filters, filter);
  const filterKey = JSON.stringify(ast);
  const sortKey = JSON.stringify(sort);
  const source = useMemo(() => new ListRowSource(primaryKey), [list, primaryKey, filterKey, sortKey]);
  useMemo(() => {
    let shown = ast ? rows.filter((row) => matches(ast, row)) : rows;
    if (sort.length) {
      const { column, direction } = sort[0];
      const sign = direction === "desc" ? -1 : 1;
      // Missing values go last in both directions
      shown = [...shown].sort((a, b) => {
        const [left, right] = [a[column], b[column]];
        if (left == null || right == null) return left == null ? (right == null ? 0 : 1) : -1;
        return sign * (left < right ? -1 : left > right ? 1 : 0);
      });
    }
    source.update(shown);
  }, [source, rows]);
  return {
    rowSource: source,
    previousRowSource: source,
    contentVersion: rows,
    description,
    loading: null,
    error: null,
    filterError,
  };
}

// Add the filter parse error to a DataFrame view, so use_rows returns the same shape for both kinds of data
export function withFilterError(view: RowsView, filterError: string | null): RowsView & { filterError: string | null } {
  return { ...view, filterError };
}

/**
 * Read the rows shown by forms and annotation widgets, by primary key or by filter, or all rows.
 *
 * `view` is the row view of `data` from use_rows in widget_data.py, built with the same filter. Store list rows
 * are returned during the first render. DataFrame rows are fetched after mounting, the view then reports loading
 * and errors.
 */
export function useSelectedRows(
  data: any,
  view: RowsView,
  primaryKey: string,
  identities: unknown[] | null = null,
  filter: FilterNode | null = null
): [RowData[], RowsView] {
  const identityKey = JSON.stringify(identities);
  const listRows = useMemo(() => {
    if (isDataFrame(data)) return null;
    const source = view.rowSource as ListRowSource;
    if (identities === null) return source.rows;
    const byKey = new Map(source.rows.map((row) => [row[primaryKey], row]));
    return identities.map((key) => byKey.get(key)).filter(Boolean) as RowData[];
  }, [view.rowSource, view.contentVersion, identityKey]);
  const [loaded, setLoaded] = useState<{ data: any; identityKey: string; rows: RowData[] } | null>(null);
  useEffect(() => {
    const source = view.rowSource;
    if (!isDataFrame(data) || !source) return;
    const controller = new AbortController();
    // Scoped DataFrames, such as related tables, show only their loaded window
    const scope = data.scope;
    const start = scope?.rows && filter === null ? scope.offset ?? 0 : 0;
    const end = scope?.rows && filter === null ? start + scope.rows.length : source.rowCount;
    (identities !== null
      ? source.getRowsByKeys(identities, controller.signal)
      : source.getRows(start, end, controller.signal)
    )
      .then((rows) => {
        if (!controller.signal.aborted) setLoaded({ data, identityKey, rows });
      })
      .catch((reason) => {
        if (!controller.signal.aborted) data.setStatus(null, String(reason?.message ?? reason));
      });
    return () => controller.abort();
  }, [view.rowSource, view.contentVersion, identityKey]);
  if (listRows) return [listRows, view];
  return [loaded && loaded.data === data && loaded.identityKey === identityKey ? loaded.rows : [], view];
}
