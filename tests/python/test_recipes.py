import asyncio
from types import SimpleNamespace

import pytest

from metanno.viewer.explorer_kernel import create_source_view
from metanno.viewer.query_worker import SourceQueryWorker
from metanno.viewer.recipes import load_recipes, load_views
from metanno.viewer.source_provider import SourceDataFrameProvider


def test_view_opener_renders_plain_store_with_explicit_recipe(tmp_path):
    from pret import DataFrame, create_store

    from metanno import view_opener
    from metanno.viewer.view_opener import MIMETYPE, rendered_views

    recipes = tmp_path / "views" / "recipes"
    recipes.mkdir(parents=True)
    (recipes / "summary.py").write_text(
        "from pret import component\nfrom pret.react import div\n\n"
        "@component\ndef main(store):\n"
        "    return div(store['title'])\n"
    )
    store = create_store({"title": "Planner summary"}, sync=True)
    with pytest.raises(ValueError, match="requires view"):
        view_opener(store, config_path=tmp_path)
    output = view_opener(store, view="summary", config_path=tmp_path)
    assert output._repr_mimebundle_()[MIMETYPE]["choices"] == ["summary"]
    rendered = output.render("summary", {}, {})
    assert rendered["read_only"]
    assert rendered_views.pop(rendered["view_ref"]) is not None

    rows = create_store({"rows": DataFrame([{"id": 1}])}, sync=True)
    opener = view_opener(rows, config_path=tmp_path)
    assert opener.view == "table"
    # The table view and the project recipes are offered, the table view only for a Store with one DataFrame
    assert opener.choices() == ["table", "summary"]


def test_confit_recipe_and_saved_view_discovery(tmp_path):
    recipes_path = tmp_path / "recipes"
    views_path = tmp_path / "views"
    recipes_path.mkdir()
    views_path.mkdir()
    (recipes_path / "documents.py").write_text(
        "def main(store, title: str = 'Documents'):\n    return store, title\n",
        encoding="utf-8",
    )
    (views_path / "review.yml").write_text(
        "recipe: documents\n"
        "tables:\n"
        "  todos:\n"
        "    source: planner\n"
        "    table: todos\n"
        "parameters:\n"
        "  title: Review todos\n"
        "root: todos\n",
        encoding="utf-8",
    )

    recipes = load_recipes(recipes_path)
    store = object()

    assert recipes["documents"](store=store, title="Todos") == (
        store,
        "Todos",
    )
    assert load_views(views_path) == [
        {
            "name": "review",
            "tables": {"todos": {"source": "planner", "table": "todos"}},
            "recipe": "documents",
            "parameters": {"title": "Review todos"},
            "root": "todos",
        }
    ]


def test_recipe_requires_a_store_entrypoint(tmp_path):
    recipe = tmp_path / "related.py"
    recipe.write_text(
        "def main(table):\n    return table\n",
        encoding="utf-8",
    )

    with pytest.raises(ValueError, match="main.store"):
        load_recipes(tmp_path)


def test_recipe_receives_the_transient_store(tmp_path):
    recipes = tmp_path / "views" / "recipes"
    recipes.mkdir(parents=True)
    (recipes / "documents.py").write_text(
        "def main(store):\n    store['recipe'] = 'documents'\n    return 'Documents view'\n",
        encoding="utf-8",
    )
    service = SimpleNamespace(config=SimpleNamespace(directory=tmp_path, preview=SimpleNamespace(rows=500)))
    saved_view = {
        "recipe": "documents",
        "parameters": {},
        "tables": {
            "todos": {"source": "planner", "table": "todos"},
            "tags": {"source": "planner", "table": "tags"},
        },
    }

    view, store, choices = create_source_view(service, None, "view", saved_view)

    assert store["todos"].provider.max_rows == 500
    assert store["tags"].provider.max_rows == 500
    # The recipe received the Store of the source view
    assert store["recipe"] == "documents"
    assert choices == ["documents"]
    assert store["todos"].resource_id != store["tags"].resource_id


def test_source_relations_follow_derived_parent_views_before_paging(tmp_path):
    """
    Query related tags through a derived todos view without collecting parent IDs
    """
    from metanno.viewer.sources import SourceCatalog

    ibis = pytest.importorskip("ibis")
    service = SourceCatalog()
    service.config = SimpleNamespace(directory=tmp_path, preview=SimpleNamespace(max_bytes=100_000, rows=500))
    service.table = lambda source, name: backend.table(name)
    recipes = tmp_path / "views" / "recipes"
    recipes.mkdir(parents=True)
    (recipes / "todos.py").write_text(
        'def main(store):\n    store["todos"] = store["todos"].with_columns(done=False)\n    return store\n'
    )
    queries = SourceQueryWorker(lambda event: None)
    queries.requests_by_view["view"] = set()
    with queries.executor as executor:
        backend = executor.submit(ibis.sqlite.connect, tmp_path / "source.sqlite").result()
        executor.submit(backend.raw_sql, "CREATE TABLE lists(list_id INTEGER, selected INTEGER)").result()
        executor.submit(backend.raw_sql, "INSERT INTO lists VALUES (1,0),(2,1),(2,1)").result()
        executor.submit(backend.raw_sql, "CREATE TABLE todos(todo_id INTEGER, list_id INTEGER)").result()
        executor.submit(backend.raw_sql, "INSERT INTO todos VALUES (10,1),(20,2),(21,2),(30,3)").result()
        executor.submit(backend.raw_sql, "CREATE TABLE tags(tag_id INTEGER, todo_id INTEGER)").result()
        executor.submit(backend.raw_sql, "INSERT INTO tags VALUES (1,10),(2,20),(3,21),(4,30)").result()
        _, store, _ = create_source_view(
            service,
            queries,
            "view",
            {
                "recipe": "todos",
                "parameters": {},
                "tables": {
                    name: {"source": "planner", "table": name, "paging": True} for name in ("lists", "todos", "tags")
                },
            },
        )
        parent_filter = {
            "kind": "relation",
            "column": "list_id",
            "parent_column": "list_id",
            "resource_id": store["lists"].resource_id,
            "filter": {"kind": "predicate", "column": "selected", "operator": "eq", "value": 1},
        }
        result = asyncio.run(
            asyncio.wait_for(
                store["tags"].call_provider(
                    "query",
                    {
                        "filter": {
                            "kind": "relation",
                            "column": "todo_id",
                            "parent_column": "todo_id",
                            "resource_id": store["todos"].resource_id,
                            "filter": parent_filter,
                        },
                        "sort": [{"column": "tag_id", "direction": "desc"}],
                        "limit": 1,
                    },
                ),
                timeout=5,
            )
        )
        assert result["total_count"] == 2
        assert result["table"].drop(["__pret_row_id"]).to_pylist() == [{"tag_id": 3, "todo_id": 21}]
        from unittest.mock import patch

        with patch.object(ibis.expr.types.Table, "count", side_effect=AssertionError("Page recounted rows")):
            page = asyncio.run(
                asyncio.wait_for(
                    store["tags"].call_provider(
                        "query",
                        {
                            "sort": [{"column": "tag_id", "direction": "desc"}],
                            "offset": 1,
                            "limit": 1,
                            "include_count": False,
                        },
                    ),
                    timeout=5,
                )
            )
        assert page["total_count"] is None
        assert page["table"].drop(["__pret_row_id"]).to_pylist() == [{"tag_id": 3, "todo_id": 21}]
        # Both limited tables share the full parent filter, not the parent's displayed row cap
        for name in ("todos", "tags"):
            source = store[name].provider.parent if name == "todos" else store[name]
            source.provider.paging = False
            source.provider.max_rows = 1
        from contextlib import ExitStack

        with ExitStack() as patches:
            for method in ("count", "order_by"):
                patches.enter_context(patch.object(ibis.expr.types.Table, method, side_effect=AssertionError(method)))
            limited = asyncio.run(
                asyncio.wait_for(
                    store["tags"].call_provider(
                        "query",
                        {
                            "filter": {
                                "kind": "relation",
                                "column": "todo_id",
                                "parent_column": "todo_id",
                                "resource_id": store["todos"].resource_id,
                                "filter": parent_filter,
                            },
                            "limit": 500,
                        },
                    ),
                    timeout=5,
                )
            )
        assert limited["total_count"] is None
        assert limited["table"].num_rows == 1
        assert limited["table"]["todo_id"][0].as_py() in (20, 21)
        executor.submit(backend.disconnect).result()


def test_export_view_code_and_notebook_display(tmp_path, monkeypatch):
    """
    Execute copied parent and child queries, then reopen the resulting named SQLite tables
    """
    import sqlite3
    from pathlib import Path

    from pret import DataFrame, create_store, load_store, load_store_snapshot

    import metanno
    from metanno.viewer.code_export import export_view_code
    from metanno.viewer.view_opener import MIMETYPE, ViewOpener

    ibis = pytest.importorskip("ibis")
    # Autocommit so the connection of the copied code sees each change
    backend = sqlite3.connect(tmp_path / "source.sqlite", isolation_level=None)
    backend.execute("CREATE TABLE todos(todo_id INTEGER, selected INTEGER, title TEXT, text TEXT, due_date TEXT)")
    backend.execute(
        "INSERT INTO todos VALUES (1,0,'One','First todo','2026-01-01'),"
        "(2,1,'Two','Second todo','2026-01-02'),(3,1,'Three','Third todo','2026-01-03')"
    )
    backend.execute("CREATE TABLE tags(todo_id INTEGER, label TEXT, start INTEGER, end INTEGER, word TEXT)")
    backend.execute("INSERT INTO tags VALUES (1,'a',0,5,'First'),(2,'b',0,6,'Second'),(3,'c',0,5,'Third')")
    recipes = tmp_path / "views" / "recipes"
    recipes.mkdir(parents=True)
    (recipes / "todo_tags.py").write_text((Path(__file__).parents[1] / "jupyter/related_recipe.py").read_text())
    frames = {
        name: DataFrame(provider=SourceDataFrameProvider(None, None, "source", name, "view"))
        for name in ("todos", "tags")
    }
    frames["todos"].provider.last_query = {
        "limit": 1,
        "filter": {"kind": "predicate", "column": "selected", "operator": "eq", "value": 1},
    }
    frames["tags"].provider.last_query = {
        "limit": 500,
        "filter": {
            "kind": "predicate",
            "column": "todo_id",
            "operator": "in",
            "value": [2],
            "source_relation": {
                "resource_id": frames["todos"].resource_id,
                "parent_column": "todo_id",
                "filter": frames["todos"].provider.last_query["filter"],
            },
        },
    }
    (tmp_path / "metanno.yaml").write_text(
        f"connections:\n  local:\n    url: sqlite:///{tmp_path / 'source.sqlite'}\n"
        "sources:\n  source:\n    connection: local\n"
    )
    # Keep the notebook display object while running the generated saving code
    monkeypatch.setattr(
        metanno,
        "view_opener",
        lambda store, **kwargs: ViewOpener(
            store,
            kwargs.get("view"),
            kwargs.get("parameters"),
            kwargs.get("config_path"),
            None,
            kwargs.get("read_only"),
        ),
    )
    with_defaults = {**frames, "todos": frames["todos"].with_columns(done=False)}
    frames["tags"].provider.last_query["filter"]["source_relation"]["resource_id"] = with_defaults["todos"].resource_id
    code = export_view_code(with_defaults, {"recipe": "todo_tags", "parameters": {}}, tmp_path)
    assert "sources =" not in code and "queries =" not in code
    assert "tables = {name:" not in code
    assert "Parameters are keyword arguments" in code
    assert "parameters = {'tag_key': 'tag_id'}" in code
    query_code = export_view_code(
        with_defaults,
        {"recipe": "todo_tags", "parameters": {"tag_key": "__pret_row_id"}},
        tmp_path,
        "query",
    )
    assert "save_store" not in query_code and "uuid" not in query_code
    # Copied queries only need Ibis and Metanno, typed literals follow the recorded source schema
    assert "apply_ibis_filter" not in query_code and ".filter(_['selected'] == 1)" in query_code
    query_namespace = {}
    exec(query_code, query_namespace)
    assert query_namespace["tags"].execute()["todo_id"].tolist() == [2]
    assert set(query_namespace["store"]) == {"todos", "tags"}
    assert query_namespace["parameters"] == {"tag_key": "__pret_row_id"}
    assert "read_only=True" in query_code
    # The notebook view loads each source group before filtering its related rows by parent keys
    from unittest.mock import patch

    async def query_notebook_group():
        todos = query_namespace["store"]["todos"]
        tags = query_namespace["store"]["tags"]
        assert (await todos.describe())["row_limit"] == 500
        assert (await tags.describe())["internal_id_col"] == "__pret_row_id"
        parent = await todos.call_provider("query", {"limit": 500})
        child = await tags.call_provider(
            "query",
            {
                "limit": 500,
                "filter": {
                    "kind": "predicate",
                    "column": "todo_id",
                    "operator": "in",
                    "value": parent["table"]["todo_id"].to_pylist(),
                },
            },
        )
        assert parent["total_count"] is None
        assert child["table"]["todo_id"].to_pylist() == [2]
        assert child["table"]["__pret_row_id"].to_pylist() == [0]

    with patch.object(ibis.expr.types.Table, "count", side_effect=AssertionError("Preview counted rows")):
        asyncio.run(query_notebook_group())
    materialize = DataFrame.materialize

    def collect_then_change_source(frame, *args, **kwargs):
        # Move the source selection after collection to check that children use the collected parent IDs
        result = materialize(frame, *args, **kwargs)
        if hasattr(frame.provider, "expression") and "text" in result.column_names:
            backend.execute("UPDATE todos SET selected=0 WHERE todo_id=2")
        return result

    namespace = {}
    with monkeypatch.context() as patch:
        patch.setattr(DataFrame, "materialize", collect_then_change_source)
        exec(code, namespace)
    backend.execute("UPDATE todos SET selected=1 WHERE todo_id=2")
    path = namespace["destination"]
    # Annotation copies open in full mode and record it for reopening
    assert namespace["store"].doc.dataframe_sync == "full"
    assert load_store_snapshot(path, metadata=True)["dataframe_sync"] == "full"
    with sqlite3.connect(path) as connection:
        assert connection.execute("SELECT todo_id, done FROM todos").fetchall() == [(2, 0)]
        assert connection.execute("SELECT todo_id, label FROM tags").fetchall() == [(2, "b")]
        tag_id = connection.execute("SELECT tag_id FROM tags").fetchone()[0]
        assert tag_id
    store = load_store(path)
    output = ViewOpener(store, None, None, None, None, None)
    assert output.view == "todo_tags"
    assert output.parameters == {"tag_key": "tag_id"}
    assert output.config_dir == tmp_path
    assert not output._repr_mimebundle_()[MIMETYPE]["read_only"]
    reply = output.render("todo_tags", {}, {"notebook": "planner.ipynb", "cell": "prepare", "kernelspec": "py311"})
    assert reply["path"] == str(path)
    assert load_store(path).metadata["kernelspec"] == "py311"
    assert store["tags"].materialize()["tag_id"][0].as_py() == tag_id
    single = export_view_code({"todos": frames["todos"]}, None, tmp_path)
    exec(single.replace("'annotation.pret'", "'single.pret'"), {})
    assert load_store(tmp_path / "views/stores/single.pret")["todos"].materialize().num_rows == 1
    tag_filter = {"kind": "predicate", "column": "label", "operator": "eq", "value": "b"}
    parent_filter = {
        "kind": "predicate",
        "column": "todo_id",
        "operator": "in",
        "value": [2],
        "source_relation": {
            "resource_id": frames["tags"].resource_id,
            "parent_column": "todo_id",
            "filter": tag_filter,
        },
    }
    frames["todos"].provider.last_query["filter"] = parent_filter
    frames["tags"].provider.last_query["filter"] = {
        "kind": "and",
        "children": [
            tag_filter,
            {
                "kind": "predicate",
                "column": "todo_id",
                "operator": "in",
                "value": [2],
                "source_relation": {
                    "resource_id": frames["todos"].resource_id,
                    "parent_column": "todo_id",
                    "filter": parent_filter,
                },
            },
        ],
    }
    from_child = export_view_code(frames, {"recipe": "todo_tags", "parameters": {}}, tmp_path)
    exec(from_child.replace("'annotation.pret'", "'from_tags.pret'"), {})
    with sqlite3.connect(tmp_path / "views/stores/from_tags.pret") as connection:
        assert connection.execute("SELECT todo_id FROM todos").fetchall() == [(2,)]
        assert connection.execute("SELECT todo_id FROM tags").fetchall() == [(2,)]
    transient = create_store({"todos": DataFrame([{"todo_id": 1}])})
    assert ViewOpener(transient, None, {}, tmp_path, None, None).read_only
    with pytest.raises(ValueError, match="file backed"):
        ViewOpener(transient, None, {}, tmp_path, None, False)


def test_export_view_code_writes_typed_ibis_filters(tmp_path, monkeypatch):
    """
    Copy nested filters on date and decimal columns as plain Ibis code and run it without importing PRET
    """
    import datetime
    import sys
    from decimal import Decimal

    import pyarrow as pa
    import yaml
    from pret import DataFrame

    from metanno.viewer.code_export import export_view_code

    ibis = pytest.importorskip("ibis")
    duckdb = pytest.importorskip("duckdb")
    todos = pa.table(
        {
            "todo_id": [1, 2, 3],
            "due_date": [datetime.date(2026, 1, day) for day in (1, 2, 3)],
            "score": pa.array([Decimal("0.5"), Decimal("1.5"), None], pa.decimal128(4, 2)),
            "title": ["One", "Two", "Three"],
        }
    )
    with duckdb.connect(str(tmp_path / "source.duckdb")) as connection:
        connection.execute("CREATE TABLE todos AS SELECT * FROM todos")
    # A context manager factory beside metanno.yaml, imported by the copied code from the project directory
    (tmp_path / "typed_filter_connections.py").write_text(
        "from contextlib import contextmanager\n"
        "import ibis\n\n\n"
        "@contextmanager\n"
        "def connect(path):\n"
        "    backend = ibis.duckdb.connect(path)\n"
        "    try:\n"
        "        yield backend\n"
        "    finally:\n"
        "        backend.disconnect()\n"
    )
    (tmp_path / "metanno.yaml").write_text(
        yaml.safe_dump(
            {
                "connections": {
                    "warehouse": {
                        "factory": "typed_filter_connections:connect",
                        "kwargs": {"path": str(tmp_path / "source.duckdb")},
                    }
                },
                "sources": {"source": {"connection": "warehouse"}},
            }
        )
    )
    frame = DataFrame(provider=SourceDataFrameProvider(None, None, "source", "todos", "view"))
    frame.provider.last_schema = ibis.Schema.from_pyarrow(todos.schema)
    title_filter = {"kind": "predicate", "column": "title", "operator": "ends_with", "value": "e"}
    frame.provider.last_query = {
        "limit": 10,
        "filter": {
            "kind": "or",
            "children": [
                {"kind": "predicate", "column": "due_date", "operator": "gte", "value": "2026-01-03"},
                {
                    "kind": "and",
                    "children": [
                        {"kind": "predicate", "column": "score", "operator": "gt", "value": "1"},
                        {"kind": "not", "child": title_filter},
                    ],
                },
            ],
        },
    }
    imports, code = export_view_code({"todos": frame}, None, tmp_path, "query").split("\n\n\n", 1)
    # The connections and queries stop before the Store and view opening, which use PRET and Metanno
    query = code[: code.index("# Tables maps")]
    assert "_['due_date'] >= datetime.date(2026, 1, 3)" in query and "_['score'] > Decimal('1')" in query
    assert "warehouse = connections.enter_context(connect(path=" in query
    imports = [line for line in imports.splitlines() if "pret" not in line and "metanno" not in line]
    namespace = {}
    monkeypatch.setattr(sys, "path", list(sys.path))
    exec("\n".join(imports) + "\n" + query, namespace)
    assert sorted(namespace["todos"].execute()["todo_id"]) == [2, 3]
    namespace["connections"].close()
    del sys.modules["typed_filter_connections"]


def test_source_provider_queries_and_materializes_on_the_worker(config_path):
    """
    Query pages and complete copies through PRET while preserving source limits and progress
    """
    import threading

    import ibis
    from pret import DataFrame

    from metanno.viewer.sources import SourceCatalog

    events = []
    sources = SourceCatalog(config_path)
    queries = SourceQueryWorker(events.append)
    queries.requests_by_view["lists"] = set()
    try:
        queries.submit(
            "setup",
            lambda: sources.connection("local").create_table(
                "lists",
                ibis.memtable({"id": [1, 2, 3], "name": ["Home", "Work", "Errands"]}),
            ),
        ).result()
        frame = DataFrame(
            provider=SourceDataFrameProvider(
                sources,
                queries,
                "planner",
                "lists",
                "lists",
                paging=True,
            )
        )
        description = asyncio.run(frame.call_provider("describe"))
        assert description["internal_id_col"] == "__pret_row_id"
        result = asyncio.run(
            frame.call_provider(
                "query",
                {
                    "filter": {
                        "kind": "predicate",
                        "column": "id",
                        "operator": "gte",
                        "value": "2",
                    },
                    "sort": [{"column": "id", "direction": "desc"}],
                    "limit": 1,
                },
            )
        )
        assert result["table"]["name"].to_pylist() == ["Errands"]
        assert result["total_count"] == 2
        assert frame.materialize().num_rows == 3
        with pytest.raises(ValueError, match="rows"):
            frame.materialize({"max_rows": 2})
        with pytest.raises(ValueError, match="bytes"):
            frame.materialize({"max_bytes": 1})
        assert queries.thread_id != threading.get_ident()
        assert {event["view_ref"] for event in events} == {"lists"}
        queries.close_view("lists")
        with pytest.raises(ValueError, match="closed"):
            asyncio.run(frame.call_provider("query", {}))
    finally:
        queries.close([sources])


def test_closing_view_cancels_queued_and_running_work():
    """
    Cancel the backend attached to the view while a different catalogue becomes current
    """
    from threading import Event

    started, stopped = Event(), Event()
    events = []
    queries = SourceQueryWorker(events.append)
    queries.requests_by_view.update(old=set(), new=set())
    backend = SimpleNamespace(name="duckdb", con=SimpleNamespace(interrupt=stopped.set))

    def slow_query():
        from metanno.viewer.ibis_cancellation import CancellableQuery

        with queries.cancellable_query(CancellableQuery(backend, "running")):
            started.set()
            assert stopped.wait(5)
        return "cancelled result"

    try:
        running = queries.submit("running", slow_query, view_id="old")
        assert started.wait(5)
        queued = queries.submit("queued", lambda: pytest.fail("Closed view executed"), view_id="old")
        next_view = queries.submit("next", lambda: "new result", view_id="new")
        queries.close_view("old")
        with pytest.raises(ValueError, match="cancelled"):
            running.result(timeout=5)
        assert queued.cancelled()
        assert next_view.result(timeout=5) == "new result"
        assert queries.pending_requests == {}
    finally:
        queries.close([])
