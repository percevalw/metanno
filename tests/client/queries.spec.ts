const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");
const { test } = require(process.env.PRET_TESTING_HELPER);
const pret = path.resolve(path.dirname(process.env.PRET_TESTING_HELPER), "../..");
// Transcrypt uses the native error check that was added after Node 22
Error.isError ??= require("node:util").types.isNativeError;

// Compile the factory callbacks so client scenarios run the browser Python code
let factoryCallbacks;
async function loadFactoryCallbacks() {
  if (!factoryCallbacks)
    factoryCallbacks = (async () => {
      const { execFileSync } = require("node:child_process");
      const directory = fs.mkdtempSync(path.join(require("node:os").tmpdir(), "metanno-query-"));
      fs.writeFileSync(path.join(directory, "package.json"), '{"type":"module"}');
      const env = {
        ...process.env,
        PYTHONPATH: [
          path.resolve(__dirname, "../.."),
          pret,
          path.join(pret, "vendor/transcrypt"),
          process.env.PYTHONPATH || "",
        ].join(path.delimiter),
      };
      try {
        execFileSync(
          process.env.PYTHON || "python",
          [
            "-c",
            `
import inspect, json, os, pathlib, sys, textwrap
from metanno.recipes.data_widget_factory.data_relations import make_dataframe_queries
pathlib.Path(sys.argv[1]).write_text(textwrap.dedent(inspect.getsource(make_dataframe_queries)))
if os.environ.get("PRET_COVERAGE_DIR"):
    filename = inspect.getsourcefile(make_dataframe_queries)
    pathlib.Path(sys.argv[1] + ".origin.json").write_text(json.dumps({
        "path": filename, "line": inspect.getsourcelines(make_dataframe_queries)[1],
        "source": pathlib.Path(filename).read_text(),
    }))
`,
            path.join(directory, "queries.py"),
          ],
          { env }
        );
        execFileSync(
          process.env.PYTHON || "python",
          [
            "-m",
            "transcrypt",
            "-b",
            "-n",
            "-p",
            ".none",
            ...(process.env.PRET_COVERAGE_DIR ? ["-m"] : []),
            path.join(directory, "queries.py"),
          ],
          { env }
        );
        if (process.env.PRET_COVERAGE_DIR) {
          const target = path.join(directory, "__target__/queries.js");
          const { inlineTranscrypt } = require(path.join(pret, "pret/testing/convert.cjs"));
          fs.writeFileSync(
            target,
            inlineTranscrypt(
              fs.readFileSync(target, "utf8"),
              JSON.parse(fs.readFileSync(path.join(directory, "__target__/queries.map"))),
              JSON.parse(fs.readFileSync(path.join(directory, "queries.py.origin.json")))
            )
          );
        }
        const { make_dataframe_queries } = await import(path.join(directory, "__target__/queries.js"));
        const { dict } = await import(path.join(directory, "__target__/org.transcrypt.__runtime__.js"));
        return (frames, relations) => make_dataframe_queries(dict(frames), relations);
      } finally {
        fs.rmSync(directory, { recursive: true, force: true });
      }
    })();
  return factoryCallbacks;
}

// Use actual client modules and the Node SQLite initializer for controlled query replies
let clientModules;
async function loadClientModules() {
  if (!clientModules)
    clientModules = (async () => {
      const esbuild = require(path.join(pret, "node_modules/esbuild"));
      const result = await esbuild.build({
        stdin: {
          contents: `export {ClientDataFrame, useDataFrameView} from ${JSON.stringify(
            path.join(pret, "client/dataframe.ts")
          )};
        export {BrowserDatabase} from ${JSON.stringify(path.join(pret, "client/dataframeSqlite.ts"))};
        export {filterAst} from ${JSON.stringify(
          path.resolve(__dirname, "../../client/components/Table/dataframeFilters.ts")
        )};`,
          resolveDir: path.resolve(__dirname, "../.."),
        },
        bundle: true,
        platform: "node",
        format: "cjs",
        write: false,
        sourcemap: process.env.PRET_COVERAGE_DIR ? "inline" : false,
        treeShaking: process.env.PRET_COVERAGE_DIR ? false : undefined,
        define: { "import.meta.url": JSON.stringify(`file://${__filename}`) },
        external: ["react", "apache-arrow", "@sqlite.org/sqlite-wasm", "use-sync-external-store/shim"],
        plugins: [
          {
            name: "sqlite-node",
            setup(build) {
              // Browser WASM asset URLs are replaced only at the initialization boundary in Node tests
              build.onResolve({ filter: /^\.\/dataframeSqlite$/ }, (args) =>
                args.importer.endsWith("/dataframe.ts") ? { path: "sqlite-node", namespace: "test" } : undefined
              );
              build.onLoad({ filter: /.*/, namespace: "test" }, () => ({
                contents: `import initialize from '@sqlite.org/sqlite-wasm';
            import {BrowserDatabase} from ${JSON.stringify(path.join(pret, "client/dataframeSqlite.ts"))};
            export async function createBrowserDatabase(resources) {return new BrowserDatabase(await initialize(), resources);}`,
                resolveDir: pret,
              }));
            },
          },
        ],
      });
      const loaded = new Module(__filename, module);
      loaded.filename = __filename;
      loaded.paths = [...module.paths, path.join(pret, "node_modules")];
      loaded._compile(result.outputFiles[0].text, __filename);
      return loaded.exports;
    })();
  return clientModules;
}

// Source queries load a coherent group, all selection and annotation filtering stays local
test("shares loaded todos and tags across selection query and paging", async () => {
  const arrow = require(path.join(pret, "node_modules/apache-arrow"));
  const { default: initialize } = await import(path.join(pret, "node_modules/@sqlite.org/sqlite-wasm/dist/node.mjs"));
  const { BrowserDatabase } = await loadClientModules();
  const { ClientDataFrame } = await loadClientModules();
  const callbacks = await loadFactoryCallbacks();
  const ids = Array.from({ length: 1001 }, (_, idx) => idx + 1);
  const database = new BrowserDatabase(await initialize(), [
    {
      resource_id: "todos",
      bytes: arrow.tableToIPC(
        arrow.tableFromArrays({
          todo_id: ids,
          text: arrow.vectorFromArray(ids.map(String), new arrow.Utf8()),
        })
      ),
    },
    {
      resource_id: "tags",
      bytes: arrow.tableToIPC(
        arrow.tableFromArrays({
          todo_id: [...ids, 1002],
          start: [...ids, 1002].map(() => 0),
        })
      ),
    },
  ]);
  for (const paging of [false, true]) {
    const calls = [];
    const frames = Object.fromEntries(
      ["todos", "tags"].map((name) => [
        name,
        new ClientDataFrame({
          resource_id: name,
          describe: async () => ({
            ...database.describe(name),
            row_limit: paging ? null : 500,
            capabilities: { edit: false, source_filters: true, stable_identity: false },
            columns: [
              ...database.describe(name).columns,
              ...(name === "tags" ? [{ name: "tag_id", type: "string", source_filter: false }] : []),
            ],
          }),
          query: async (options) => {
            calls.push({ name, ...options });
            const result = database.query(name, options);
            if (name === "tags") {
              const table = arrow.tableFromIPC(result.bytes);
              result.bytes = arrow.tableToIPC(
                table.assign(
                  arrow.tableFromArrays({
                    tag_id: arrow.vectorFromArray(
                      Array.from({ length: table.numRows }, (_, idx) => `${calls.length}-${idx}`),
                      new arrow.Utf8()
                    ),
                  })
                )
              );
            }
            return result;
          },
        }),
      ])
    );
    const [mount, query] = callbacks(frames, [
      { parent: "todos", child: "tags", parent_column: "todo_id", child_column: "todo_id", load: "working_set" },
    ]);
    const releaseTags = mount();
    const releaseTodos = mount();
    for (let i = 0; i < 500 && (!frames.tags.scope || frames.todos.loading); i++)
      await new Promise((resolve) => setTimeout(resolve, 10));
    assert.equal(frames.todos.error, null);
    assert.equal(frames.tags.error, null);
    assert.equal(calls.length, 2);
    assert.equal(calls[1].filter.operator, "in");
    assert.equal(calls[1].filter.value.length, 500);
    assert.ok(frames.tags.scope.rows.every((row) => row.todo_id <= 500));
    const signal = new AbortController().signal;
    const table = await frames.todos.createView(null, "null", "todo_id");
    const document = await frames.todos.createView(null, "null", "todo_id");
    assert.equal((await table.getRowsByKeys([1], signal))[0].text, "1");
    assert.equal((await document.getRowsByKeys([1], signal))[0].text, "1");
    assert.equal((await document.getRowsByKeys([1001], signal)).length, 0);
    const selectedTag = frames.tags.scope.rows[0].tag_id;
    const form = await frames.tags.createView(
      { kind: "predicate", column: "tag_id", operator: "eq", value: selectedTag },
      "selected",
      "tag_id"
    );
    assert.equal((await form.getRows(0, 500, signal)).length, 1);
    assert.equal(calls.length, 2);
    if (paging) {
      await table.getRows(500, 520, signal);
      assert.equal(frames.todos.scope.offset, 260);
      assert.ok(frames.todos.scope.rows.every((row) => row.todo_id > 260 && row.todo_id <= 760));
      assert.ok(frames.tags.scope.rows.every((row) => row.todo_id > 260 && row.todo_id <= 760));
    }
    await query("tags", {
      kind: "predicate",
      column: "todo_id",
      operator: "eq",
      value: 1001,
    });
    assert.equal(frames.todos.scope.rows.length, 1);
    assert.equal(frames.todos.scope.rows[0].todo_id, 1001);
    assert.equal(frames.tags.scope.rows.length, 1);
    const afterQuery = calls.length;
    const queried = await frames.todos.createView(null, "null", "todo_id");
    assert.equal((await queried.getRowsByKeys([1001], signal))[0].text, "1001");
    assert.equal((await queried.getRowsByKeys([1], signal)).length, 0);
    assert.equal(calls.length, afterQuery);
    await query("tags", {
      kind: "predicate",
      column: "todo_id",
      operator: "eq",
      value: 1002,
    });
    assert.equal(frames.todos.scope.rows.length, 0);
    assert.equal(frames.tags.scope.rows.length, 0);
    releaseTags();
    releaseTodos();
  }
  database.close();
});

// Related widgets share source errors and can repeat the same query after a failure
test("shares branching queries failure retry and unmount across related tables", async () => {
  const callbacks = await loadFactoryCallbacks();
  const { ClientDataFrame } = await loadClientModules();
  let fail = true;
  let delay = false;
  const pending = [];
  const calls = [];
  const frames = Object.fromEntries(
    ["docs", "spans", "stays"].map((key) => [
      key,
      new ClientDataFrame({
        resource_id: key,
        describe: async () => ({ columns: [], row_limit: 500, capabilities: {}, revision: 0 }),
        query: async () => {
          calls.push(key);
          if (delay && key === "docs") await new Promise((resolve) => pending.push(resolve));
          if (fail) throw new Error("Source query failed");
          return {
            bytes: require(path.join(pret, "node_modules/apache-arrow")).tableToIPC(
              require(path.join(pret, "node_modules/apache-arrow")).tableFromArrays({ id: [] })
            ),
            revision: 0,
          };
        },
      }),
    ])
  );
  const [mount, query] = callbacks(frames, [
    { parent: "docs", child: "spans", parent_column: "id", child_column: "doc_id", load: "working_set" },
    { parent: "docs", child: "stays", parent_column: "id", child_column: "doc_id", load: "working_set" },
  ]);
  const release = mount();
  await new Promise(setImmediate);
  assert.match(frames.docs.error, /Source query failed/);
  assert.equal(frames.spans.error, frames.docs.error);
  assert.equal(frames.spans.loading, null);
  fail = false;
  assert.equal(await query("docs", null), true);
  assert.equal(frames.spans.error, null);
  assert.deepEqual(calls.slice(-3), ["docs", "spans", "stays"]);
  const previous = frames.docs.scope;
  fail = true;
  assert.equal(await query("docs", null), false);
  assert.equal(frames.docs.scope, previous);
  fail = false;
  delay = true;
  const older = query("docs", null);
  const newer = query("docs", null);
  await new Promise(setImmediate);
  pending.pop()();
  assert.equal(await newer, true);
  const accepted = frames.docs.scope;
  pending.pop()();
  assert.equal(await older, false);
  assert.equal(frames.docs.scope, accepted);
  const closing = query("docs", null);
  await new Promise(setImmediate);
  release();
  pending.pop()();
  assert.equal(await closing, false);
  const remount = mount();
  assert.equal(frames.docs.scope, accepted);
  remount();
  assert.equal(frames.docs.loadPage, null);
});

// Show loading while source data or a filtered view is being prepared
test("loads source rows once and filters generated columns locally", async () => {
  const { JSDOM } = require("jsdom");
  const dom = new JSDOM('<div id="root"></div>', { pretendToBeVisual: true });
  global.window = dom.window;
  global.document = dom.window.document;
  const React = require("react");
  const ReactDOM = require("react-dom");
  const { act } = require("react-dom/test-utils");
  const { ClientDataFrame } = await loadClientModules();
  const { useDataFrameView } = await loadClientModules();
  const { filterAst } = await loadClientModules();
  let resolveQuery;
  const dataframe = new ClientDataFrame({
    describe: async () => ({
      columns: [{ name: "id", type: "string", source_filter: false }],
      capabilities: { source_filters: true },
      row_limit: 500,
      revision: 0,
    }),
    query: () =>
      new Promise((resolve) => {
        resolveQuery = resolve;
      }),
  });
  let state;
  function Widget({ filters }) {
    state = useDataFrameView(dataframe, dataframe.description ? filterAst(dataframe.description, filters) : null, "id");
    return null;
  }
  const root = document.getElementById("root");
  await act(async () => {
    ReactDOM.render(React.createElement(Widget, { filters: {} }), root);
    await new Promise(setImmediate);
  });
  assert.equal(state.loading, "Loading data");
  assert.equal(state.rowSource, null);
  await act(async () => {
    const arrow = require(path.join(pret, "node_modules/apache-arrow"));
    resolveQuery({
      bytes: arrow.tableToIPC(arrow.tableFromArrays({ id: arrow.vectorFromArray(["A", "B"], new arrow.Utf8()) })),
      revision: 0,
    });
    await new Promise(setImmediate);
  });
  assert.equal(state.loading, null);
  assert.equal(state.rowSource.rowCount, 2);
  await act(async () => {
    ReactDOM.render(React.createElement(Widget, { filters: { id: "= B" } }), root);
    await new Promise(setImmediate);
    for (let i = 0; i < 500 && !state.rowSource && !state.error; i++)
      await new Promise((resolve) => setTimeout(resolve, 10));
  });
  assert.equal(state.loading, null);
  assert.equal(state.error, null);
  assert.equal(state.rowSource.rowCount, 1);
  assert.equal(state.rowSource.getCachedRow(0).id, "B");
  await act(async () => ReactDOM.unmountComponentAtNode(root));
  dom.window.close();
});
