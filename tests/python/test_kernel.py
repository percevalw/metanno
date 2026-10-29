"""Data kernel commands and lifecycle events"""

from __future__ import annotations

import logging
from concurrent.futures import Future
from types import SimpleNamespace

import pytest

from metanno.viewer.explorer_kernel import DataExplorerKernel, SourceView


class EventComm:
    """Collect the replies and lifecycle events sent by the data kernel."""

    def __init__(self):
        self.messages = []

    def send(self, data):
        self.messages.append(data)


class ImmediateLoop:
    """Run callbacks immediately after their worker exception scope ends."""

    def add_callback(self, callback):
        callback()


def request(kernel, comm, method, data):
    """Send a frontend comm request to the data kernel, its replies are collected by `comm`"""
    message = {"protocol_version": 1, "kind": "request", "method": method, "request_id": method, "data": data}
    kernel.handle_comm_message(comm, {"content": {"data": message}})


def test_comm_replies_errors_events_and_liveness(monkeypatch):
    """
    Worker errors are replied after IO loop scheduling, query status is broadcast as an event, and liveness reports
    the active and queued requests
    """
    kernel = DataExplorerKernel.__new__(DataExplorerKernel)
    kernel.io_loop = ImmediateLoop()
    kernel.log = logging.getLogger("test-data-kernel")
    future = Future()
    future.set_exception(RuntimeError("missing configuration"))
    comm = EventComm()
    kernel.send_worker_reply(comm, "request-1", "list_sources", future)
    assert comm.messages[0]["request_id"] == "request-1"
    assert comm.messages[0]["data"]["error"] == {"type": "RuntimeError", "message": "missing configuration"}

    comm = EventComm()
    kernel.comms = {"data-comm": comm}
    status = {"phase": "running", "operation_id": "dataframe-1", "source": "planner", "table": "lists"}
    kernel.send_query_event(status)
    assert comm.messages == [
        {"protocol_version": 1, "kind": "event", "method": "query_status", "request_id": None, "data": status}
    ]

    kernel.query_worker = SimpleNamespace(
        active_queries={"active-preview": SimpleNamespace(request_id="active-preview")},
        pending_requests={"active-preview": Future()},
    )
    monkeypatch.setattr("metanno.viewer.explorer_kernel.os.getcwd", lambda: "/project")
    comm = EventComm()
    request(kernel, comm, "is_alive", {})
    assert comm.messages[0]["data"]["active_requests"] == ["active-preview"]
    assert comm.messages[0]["data"]["queued_requests"] == ["active-preview"]


def test_preparation_uses_the_requested_view(monkeypatch, tmp_path):
    """
    Copy preparation for one open view while another view remains active
    """
    import metanno.viewer.code_export as dataframe_module

    kernel = DataExplorerKernel.__new__(DataExplorerKernel)
    kernel.sources = SimpleNamespace(config=SimpleNamespace(directory=tmp_path))
    kernel.views = {name: SourceView(name, {"recipe": name}, kernel.sources) for name in ("A", "B")}
    monkeypatch.setattr(
        dataframe_module,
        "export_view_code",
        lambda store, view, purpose: f"prepare({store!r})",
    )
    comm = EventComm()
    request(kernel, comm, "export_view_code", {"view_ref": "A"})
    assert [message["data"] for message in comm.messages] == [{"code": "prepare('A')"}]
    assert kernel.views["B"].store == "B"


def test_list_views_groups_campaign_stores(tmp_path, monkeypatch):
    """
    List recipes and Store files, those of a campaign folder grouped under its name, unsupported files with their error
    """
    from pret import create_store
    from pret.store import write_store

    monkeypatch.chdir(tmp_path)
    stores = tmp_path / "annotations"
    stores.mkdir()
    write_store(create_store({"done": False}), stores / "current.pret", metadata={"recipe": "todo"})
    (stores / "campaign").mkdir()
    write_store(create_store({"done": False}), stores / "campaign" / "alice.pret", metadata={"recipe": "todo"})
    recipes = tmp_path / "recipes"
    recipes.mkdir()
    (recipes / "todo.py").write_text("def main(store):\n    return store\n")
    kernel = DataExplorerKernel.__new__(DataExplorerKernel)
    kernel.sources = SimpleNamespace(config=SimpleNamespace(directory=tmp_path))

    # JupyterLab writes a Jupyter root under the home directory as ~/...
    monkeypatch.setenv("HOME", str(tmp_path.parent))
    reply = kernel.dispatch("list_views", {"root": f"~/{tmp_path.name}"})

    assert reply["stores"] == [
        {"name": "alice", "group": "campaign", "path": str(stores / "campaign" / "alice.pret"), "recipe": "todo"},
        {"name": "current", "group": None, "path": str(stores / "current.pret"), "recipe": "todo"},
    ]
    # The sidebar opens the metanno.yaml folder, relative to the Jupyter root, in the file browser
    assert reply["home"] == ""
    with pytest.raises(ValueError, match="must be inside the Jupyter root"):
        kernel.dispatch("list_views", {"root": str(tmp_path / "other")})
    # A metanno-home folder linked under the root, eg on a data disk, opens through its link
    (tmp_path / "home").mkdir()
    (tmp_path / "home" / "disk").symlink_to(tmp_path)
    kernel.sources = SimpleNamespace(config=SimpleNamespace(directory=tmp_path / "home" / "disk"))
    reply = kernel.dispatch("list_views", {"root": str(tmp_path / "home")})
    assert reply["home"] == "disk"
    kernel.sources = SimpleNamespace(config=SimpleNamespace(directory=tmp_path))
    import sqlite3

    unsupported = stores / "unsupported.pret"
    with sqlite3.connect(unsupported) as connection:
        connection.execute("PRAGMA user_version=2")
    before = unsupported.read_bytes()
    reply = kernel.dispatch("list_views", {"root": str(tmp_path)})
    assert reply["stores"][2]["error"] == "Unsupported PRET database format 2"
    assert unsupported.read_bytes() == before

    # A SQLite error of one file leaves the other Stores listed
    import pret

    load_store_snapshot = pret.load_store_snapshot

    def failing_snapshot(path, **kwargs):
        if path.name == "current.pret":
            raise RuntimeError("disk I/O error")
        return load_store_snapshot(path, **kwargs)

    monkeypatch.setattr(pret, "load_store_snapshot", failing_snapshot)
    reply = kernel.dispatch("list_views", {"root": str(tmp_path)})
    assert [store.get("error") for store in reply["stores"]] == [
        None,
        "disk I/O error",
        "Unsupported PRET database format 2",
    ]


def test_sidebar_root_and_configuration_reload(tmp_path):
    """
    The explorer reads the metanno-home/metanno.yaml of the Jupyter root sent by the sidebar, created when missing,
    and reloading it keeps the catalogue of open views
    """
    from metanno.viewer.config import ConfigError
    from metanno.viewer.sources import SourceCatalog

    kernel = DataExplorerKernel.__new__(DataExplorerKernel)
    kernel.root = None
    kernel.views = {}
    kernel.sources = SourceCatalog(tmp_path)
    root = tmp_path / "root"
    root.mkdir()
    kernel.dispatch("set_root", {"root": str(root)})
    path = root / "metanno-home" / "metanno.yaml"
    assert path.read_text() == "connections: {}\nsources: {}\n"
    assert kernel.sources.config.directory == root / "metanno-home"
    old = kernel.sources
    kernel.views = {"old": SourceView(None, {}, old)}
    path.write_text("connections:\n  local:\n    url: 'duckdb://'\nsources:\n  planner:\n    connection: local\n")
    # The same root keeps the open connections, reloading reads the edited file
    kernel.dispatch("set_root", {"root": str(root)})
    assert kernel.sources is old
    kernel.dispatch("reload_configuration", {})
    assert kernel.sources.list_sources() == [
        {"name": "planner", "kind": "catalogue", "connection": "local", "connections": ["local"]}
    ]
    assert old.list_sources() == []
    assert kernel.views["old"].sources is old
    current = kernel.sources
    path.write_text("[invalid")
    with pytest.raises(ConfigError):
        kernel.dispatch("reload_configuration", {})
    assert kernel.sources is current
    assert path.read_text() == "[invalid"


def test_view_open_resolves_refreshing_backend_tables_again(tmp_path, monkeypatch):
    """
    Opening a view drops the cached tables of backends that list table files at table() time
    """
    import metanno.viewer.explorer_kernel as kernel_module
    from metanno.viewer.sources import SourceCatalog

    (tmp_path / "factories.py").write_text(
        "import ibis\n\n\n"
        "def connect():\n"
        "    backend = ibis.duckdb.connect()\n"
        "    backend.con.execute('CREATE TABLE notes AS SELECT 1 AS id')\n"
        "    backend.refresh_tables_on_view_open = True\n"
        "    return backend\n"
    )
    (tmp_path / "metanno.yaml").write_text(
        "connections:\n  fresh: {factory: 'factories:connect'}\nsources:\n  fresh: {connection: fresh}\n"
    )
    kernel = DataExplorerKernel.__new__(DataExplorerKernel)
    kernel.sources = SourceCatalog(tmp_path)
    kernel.views = {}
    kernel.query_worker = SimpleNamespace(requests_by_view={}, close_view=lambda view_ref: None)
    rendered = SimpleNamespace(_repr_mimebundle_=lambda: {"application/vnd.pret+json": {"view_data": {}}})
    monkeypatch.setattr(
        kernel_module, "create_source_view", lambda sources, worker, view_ref, view, recipes: (rendered, None, [])
    )
    kernel.sources.table("fresh", "notes")
    request(kernel, EventComm(), "open_table_view", {"source": "fresh", "table": "notes", "view_ref": "fresh"})
    assert ("fresh", "notes", "fresh") not in kernel.sources.tables


def test_table_view_store_key_has_no_dot(tmp_path, monkeypatch):
    """
    A file table such as codes.csv opens under the Store key codes_csv, widgets read a dotted key as a nested path
    """
    import metanno.viewer.explorer_kernel as kernel_module
    from metanno.viewer.sources import SourceCatalog

    (tmp_path / "metanno.yaml").write_text(
        f"connections:\n  local: {{factory: 'ibis:duckdb.connect'}}\n"
        f"sources:\n  files: {{connection: local, kind: files, uri: '{tmp_path}'}}\n"
    )
    kernel = DataExplorerKernel.__new__(DataExplorerKernel)
    kernel.sources = SourceCatalog(tmp_path)
    kernel.views = {}
    kernel.query_worker = SimpleNamespace(requests_by_view={}, close_view=lambda view_ref: None)
    rendered = SimpleNamespace(_repr_mimebundle_=lambda: {"application/vnd.pret+json": {"view_data": {}}})
    opened = []
    monkeypatch.setattr(
        kernel_module,
        "create_source_view",
        lambda sources, worker, view_ref, view, recipes: opened.append(view) or (rendered, None, []),
    )
    request(kernel, EventComm(), "open_table_view", {"source": "files", "table": "codes.csv", "view_ref": "codes"})
    assert list(opened[0].tables) == ["codes_csv"]
    assert opened[0].tables["codes_csv"].table == "codes.csv"


def test_recipe_tables_open_a_form_until_each_store_key_has_a_table(tmp_path, monkeypatch):
    """
    A recipe that declares its tables gets table pickers for the missing Store keys, from the sidebar or the recipe
    selector of a table tab, then opens once every key has a table and can be saved as a view
    """
    import yaml

    import metanno.viewer.explorer_kernel as kernel_module
    from metanno.viewer.recipes import load_views
    from metanno.viewer.sources import SourceCatalog

    (tmp_path / "metanno.yaml").write_text(
        "connections:\n  local: {factory: 'ibis:duckdb.connect'}\nsources:\n  planner: {connection: local}\n"
    )
    (tmp_path / "recipes").mkdir()
    (tmp_path / "recipes" / "todo_tags.py").write_text(
        "from typing import Annotated, TypedDict\n\n"
        "from pret import DataFrame\n\n"
        "from metanno import RecipeTable\n\n\n"
        "class Tables(TypedDict):\n"
        '    todos: Annotated[DataFrame, RecipeTable("Todo items", keywords=["todo"])]\n'
        '    tags: Annotated[DataFrame, RecipeTable("Tags of the todos")]\n\n\n'
        "def main(store: Tables, limit: int):\n    return store\n"
    )
    kernel = DataExplorerKernel.__new__(DataExplorerKernel)
    kernel.sources = SourceCatalog(tmp_path)
    kernel.views = {}
    kernel.query_worker = SimpleNamespace(requests_by_view={}, close_view=lambda view_ref: None)
    rendered = SimpleNamespace(_repr_mimebundle_=lambda: {"application/vnd.pret+json": {"view_data": {}}})
    opened = []
    monkeypatch.setattr(
        kernel_module,
        "create_source_view",
        lambda sources, worker, view_ref, view, recipes: opened.append(view) or (rendered, None, []),
    )
    # A table tab switched to the recipe keeps its table for the picker prefill
    comm = EventComm()
    data = {"source": "planner", "table": "todos", "view_ref": "a", "recipe": "todo_tags"}
    request(kernel, comm, "open_table_view", data)
    form = comm.messages[-1]["data"]["form"]
    assert form["tables"]["todos"] == {"description": "Todo items", "keywords": ["todo"], "max_rows": None}
    assert form["tables"]["tags"] == {"description": "Tags of the todos", "keywords": [], "max_rows": None}
    assert form["current"] == {"todos": {"source": "planner", "table": "todos", "connection": "local", "paging": False}}
    assert opened == []
    # The sidebar opens the recipe without tables, then with a table for each Store key
    comm = EventComm()
    request(kernel, comm, "open_recipe_view", {"recipe": "todo_tags", "view_ref": "b"})
    assert comm.messages[-1]["data"]["form"]["current"] == {}
    tables = {"todos": {"source": "planner", "table": "todos"}, "tags": {"source": "planner", "table": "tags"}}
    # A required parameter without a valid value keeps the form, with the error of the value
    comm = EventComm()
    data = {"recipe": "todo_tags", "tables": tables, "parameters": {"limit": "many"}, "view_ref": "c"}
    request(kernel, comm, "open_recipe_view", data)
    form = comm.messages[-1]["data"]["form"]
    assert [field["name"] for field in form["parameters"]] == ["limit"] and form["values"] == {"limit": "many"}
    assert form["errors"] == {"limit": "Input should be a valid integer, unable to parse string as an integer"}
    request(kernel, EventComm(), "open_recipe_view", {**data, "parameters": {"limit": 3}})
    assert list(opened[0].tables) == ["todos", "tags"] and opened[0].recipe == "todo_tags"
    assert opened[0].parameters == {"limit": 3}
    # Once seen, the view is saved with its recipe, tables and parameters to show under Explore
    kernel.dispatch("save_view", {"view_ref": "c", "name": "planner"})
    assert yaml.safe_load((tmp_path / "views" / "planner.yml").read_text()) == {
        "tables": tables,
        "recipe": "todo_tags",
        "parameters": {"limit": 3},
        "root": "todos",
    }
    assert [view.name for view in load_views(tmp_path / "views")] == ["planner"]
    with pytest.raises(ValueError, match="already exists"):
        kernel.dispatch("save_view", {"view_ref": "c", "name": "planner"})
    # The sidebar lists the recipe with its tables
    assert kernel.dispatch("list_views", {"root": str(tmp_path)})["recipes"] == [
        {"name": "todo_tags", "tables": form["tables"]}
    ]
    # Column parameters offer the columns of the picked table
    kernel.sources.connection("local").raw_sql("CREATE TABLE notes AS SELECT 1 AS note_id, 'a' AS text")
    assert kernel.dispatch("table_columns", {"source": "planner", "table": "notes"}) == {"columns": ["note_id", "text"]}
    # A new form starts from the tables listed so far
    kernel.sources.connection("local").raw_sql("CREATE TABLE todos AS SELECT 1 AS todo_id")
    kernel.dispatch("list_tables", {"source": "planner"})
    assert kernel.dispatch("listed_tables", {})["listings"] == [
        {
            "source": "planner",
            "tables": [
                {"name": "notes", "source": "planner", "kind": "table"},
                {"name": "todos", "source": "planner", "kind": "table"},
            ],
        }
    ]


def test_view_connection_selector_moves_every_table(tmp_path, monkeypatch):
    """
    A view offers the connections all its tables can use, shows none when its tables use different ones, and a
    choice reads every table with it so related tables stay on one connection
    """
    import metanno.viewer.explorer_kernel as kernel_module
    from metanno.viewer.sources import SourceCatalog

    (tmp_path / "metanno.yaml").write_text(
        "connections:\n  fast: {url: 'duckdb://'}\n  wide: {url: 'duckdb://'}\n  alone: {url: 'duckdb://'}\n"
        "sources:\n  todos: {connection: fast, connections: [fast, wide, alone]}\n"
        "  tags: {connection: wide, connections: [wide, fast]}\n"
    )
    (tmp_path / "views").mkdir()
    (tmp_path / "views" / "planner.yml").write_text(
        "recipe: table\ntables:\n  todos: {source: todos, table: todos}\n  tags: {source: tags, table: tags}\n"
    )
    kernel = DataExplorerKernel.__new__(DataExplorerKernel)
    kernel.sources = SourceCatalog(tmp_path)
    kernel.views = {}
    kernel.query_worker = SimpleNamespace(requests_by_view={}, close_view=lambda view_ref: None)
    rendered = SimpleNamespace(_repr_mimebundle_=lambda: {"application/vnd.pret+json": {"view_data": {}}})
    opened = []
    monkeypatch.setattr(
        kernel_module,
        "create_source_view",
        lambda sources, worker, view_ref, view, recipes: opened.append(view) or (rendered, None, []),
    )
    comm = EventComm()
    request(kernel, comm, "open_saved_view", {"name": "planner", "view_ref": "a"})
    reply = comm.messages[-1]["data"]
    assert reply["connection"] is None and reply["connections"] == ["fast", "wide"]
    comm = EventComm()
    request(kernel, comm, "open_saved_view", {"name": "planner", "view_ref": "b", "connection": "wide"})
    assert comm.messages[-1]["data"]["connection"] == "wide"
    assert [table.connection for table in opened[-1].tables.values()] == ["wide", "wide"]
