"""
Jupyter kernel serving source discovery and query requests for Metanno Explore tabs
"""

from __future__ import annotations

import os
import sys
import time
import traceback
from concurrent.futures import Future
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict, Optional

from ipykernel.ipkernel import IPythonKernel
from ipykernel.kernelapp import IPKernelApp

from .config import ViewConfig, ViewTable
from .messages import PROTOCOL_VERSION, send_error, send_message
from .query_worker import SourceQueryWorker
from .sources import SourceCatalog

COMM_TARGET = "metanno.viewer"


@dataclass
class SourceView:
    """
    Keep the Store and source definitions needed by Copy code and tab cleanup
    """

    store: Any
    definition: ViewConfig
    sources: SourceCatalog


class DataExplorerKernel(IPythonKernel):
    """
    Persistent query kernel shared by data explorer panels.

    handle_comm_message answers requests that read kernel state or one Store file, and builds
    views on the kernel thread because PRET bindings need its event loop. dispatch runs requests
    that open source connections or scan directories on SourceQueryWorker, one at a time per
    connection, so a slow database blocks neither the kernel nor the other connections.
    """

    implementation = "metanno-viewer"
    from metanno.version import __version__ as implementation_version

    language = "python"
    language_version = "3"
    language_info = {
        "name": "python",
        "mimetype": "text/x-python",
        "file_extension": ".py",
    }
    banner = "Metanno query kernel"

    def __init__(self, **kwargs: Any) -> None:
        super().__init__(**kwargs)
        # Root of the Jupyter file browser, sent by the sidebar, whose metanno-home/metanno.yaml lists the sources
        self.root = None
        self.sources = SourceCatalog()
        self.query_worker = SourceQueryWorker(self.send_query_event)
        self.comms: Dict[str, Any] = {}
        self.views = {}
        self.comm_manager.register_target(COMM_TARGET, self.handle_comm_open)

    def handle_comm_open(self, comm: Any, msg: Dict[str, Any]) -> None:
        """
        Keep a frontend comm so query events can reach its tabs after a page reload
        """
        self.comms[comm.comm_id] = comm
        comm.on_msg(lambda incoming: self.handle_comm_message(comm, incoming))
        comm.on_close(lambda _: self.comms.pop(comm.comm_id, None))

    def handle_comm_message(self, comm: Any, msg: Dict[str, Any]) -> None:
        """
        Validate a request and execute source work on the single query queue
        """
        envelope = msg.get("content", {}).get("data", {})
        request_id = envelope.get("request_id")
        try:
            if envelope.get("protocol_version") != PROTOCOL_VERSION:
                raise ValueError("Unsupported data protocol version")
            if envelope.get("kind") != "request":
                raise ValueError("Data comm accepts request messages only")
            method = envelope.get("method")
            data = envelope.get("data") or {}
            if not isinstance(data, dict):
                raise ValueError("Request data must be a mapping")
            if method == "is_alive":
                send_message(
                    comm,
                    "response",
                    method,
                    request_id=request_id,
                    data={
                        "alive": True,
                        "pid": os.getpid(),
                        "python": sys.executable,
                        "cwd": os.getcwd(),
                        "active_requests": list(self.query_worker.active_queries),
                        "queued_requests": list(self.query_worker.pending_requests),
                    },
                )
                return
            if method == "cancel":
                target_id = data.get("request_id")
                if not isinstance(target_id, str):
                    raise ValueError("cancel requires the target request_id")
                cancelled = self.query_worker.cancel(target_id)
                send_message(comm, "response", method, request_id=request_id, data={"cancelled": cancelled})
                return
            if method == "close_view":
                entry = self.views.pop(data["view_ref"], None)
                self.query_worker.close_view(data["view_ref"])
                if (
                    entry
                    and entry.sources is not self.sources
                    and not any(view.sources is entry.sources for view in self.views.values())
                ):
                    self.query_worker.executor(None).submit(entry.sources.close)
                send_message(comm, "response", method, request_id=request_id, data={})
                return
            if method in {"open_table_view", "open_saved_view"}:
                started = time.monotonic()

                def report_view_stage(stage):
                    """
                    Send source tab loading progress to the frontend that requested it
                    """
                    elapsed_ms = round((time.monotonic() - started) * 1000)
                    send_message(comm, "event", "view_status", {"stage": stage, "elapsed_ms": elapsed_ms}, request_id)

                report_view_stage("loading_modules")
                # Create PRET bindings on the kernel loop after its comm manager exists
                from .recipes import load_views

                report_view_stage("building_view")
                if method == "open_table_view":
                    # The Store key is the table name, so recipes written for a table, e.g. notes, also render it
                    source = self.sources.source(data["source"])
                    table = ViewTable(
                        source=data["source"],
                        table=data["table"],
                        connection=data.get("connection") or source.connection,
                    )
                    definition = ViewConfig(tables={data["table"]: table}, recipe="table")
                else:
                    saved = load_views(self.sources.config.directory / "views")
                    definition = {view.name: view for view in saved}[data["name"]]
                # The recipe selector of the tab renders the same tables with another recipe, without the
                # parameters the saved view gives its own recipe
                if data.get("recipe", definition.recipe) != definition.recipe:
                    definition = definition.model_copy(update={"recipe": data["recipe"], "parameters": {}})
                view_ref = data["view_ref"]
                # Factory backends that list table files at table() time ask for a new table at each view open,
                # e.g. the DuckDB views of Delta tables then see the commits made since the previous open
                for table in definition.tables.values():
                    connection = table.connection or self.sources.source(table.source).connection
                    key = table.source, table.table, connection
                    cached = self.sources.tables.get(key)
                    if cached is not None and getattr(cached.get_backend(), "refresh_tables_on_view_open", False):
                        del self.sources.tables[key]
                self.query_worker.requests_by_view[view_ref] = set()
                try:
                    view, store, choices = create_source_view(self.sources, self.query_worker, view_ref, definition)
                    report_view_stage("serializing_view")
                    mime = view._repr_mimebundle_()["application/vnd.pret+json"]
                except Exception:
                    self.query_worker.close_view(view_ref)
                    raise
                self.views[view_ref] = SourceView(store, definition, self.sources)
                report_view_stage("reply_ready")
                reply = {**mime["view_data"], "view_ref": view_ref, "view": definition.recipe, "choices": choices}
                if method == "open_table_view":
                    reply["connection"] = table.connection
                    reply["connections"] = source.allowed_connections
                send_message(comm, "response", method, request_id=request_id, data=reply)
                return
            if method == "export_view_code":
                from .code_export import export_view_code

                entry = self.views[data["view_ref"]]
                code = export_view_code(
                    entry.store,
                    entry.definition,
                    entry.sources.config.directory,
                    data.get("purpose", "annotation"),
                )
                send_message(comm, "response", method, request_id=request_id, data={"code": code})
                return
            # Work on a source runs on the query thread of its connection
            source = data.get("source")
            connection = data.get("connection") or (self.sources.source(source).connection if source else None)
            future = self.query_worker.submit(request_id, self.dispatch, method, data, connection=connection)
            future.add_done_callback(lambda completed: self.send_worker_reply(comm, request_id, method, completed))
        except Exception as exc:
            self.report_error(comm, request_id, envelope.get("method"), exc)

    def dispatch(
        self,
        method: str,
        data: Dict[str, Any],
    ) -> Dict[str, Any]:
        """
        Return explorer command data for the comm response
        """
        if method == "set_root":
            # The sidebar edits metanno-home/metanno.yaml at the root of the file browser, creating it lets notebook
            # kernels, which start in a folder below that root, find the same configuration
            root = Path(data["root"]).expanduser().resolve()
            config_path = root / "metanno-home" / "metanno.yaml"
            if not config_path.exists():
                config_path.parent.mkdir(exist_ok=True)
                config_path.write_text("connections: {}\nsources: {}\n")
            if root == self.root:
                return {}
            self.root = root
        if method in {"set_root", "reload_configuration"}:
            previous = self.sources
            self.sources = SourceCatalog(self.root / "metanno-home")
            if not any(view.sources is previous for view in self.views.values()):
                previous.close()
            return {}
        if method == "list_sources":
            return {"sources": self.sources.list_sources()}
        if method == "list_views":
            from pret import load_store_snapshot

            from .recipes import load_views

            view_path = self.sources.config.directory / "views"
            store_path = self.sources.config.directory / "annotations"
            # The sidebar links open these directories, so they exist even in a new project
            for directory in (view_path, store_path):
                directory.mkdir(parents=True, exist_ok=True)
            stores = []
            for path in sorted([*store_path.glob("*.pret"), *store_path.glob("*/*.pret")]):
                try:
                    metadata = load_store_snapshot(path, metadata=True)
                except Exception as error:
                    # A file that cannot be read shows its error in its own entry, e.g. an unsupported format, or the
                    # SQLite "disk I/O error" of a folder named .pret, the other Stores still list
                    metadata = {"error": str(error)}
                # Files of a subfolder, e.g. one per annotator of a campaign, are grouped under the folder name
                group = path.parent.name if path.parent != store_path else None
                stores.append({"name": path.stem, "group": group, "path": str(path.resolve()), **metadata})
            # The sidebar opens these directories in the file browser, whose paths start from the Jupyter root.
            # JupyterLab writes a root under the home directory as ~/..., expanded here where the home is known
            root = Path(os.path.abspath(Path(data["root"]).expanduser()))
            directories = {}
            for name, directory in {"views": view_path, "stores": store_path}.items():
                # A metanno-home folder linked under the root opens through its link, other links compare by real path
                directory = Path(os.path.abspath(directory))
                inside = directory.is_relative_to(root)
                if not inside:
                    directory, root_path = directory.resolve(), root.resolve()
                    inside = directory.is_relative_to(root_path)
                    directory = root / directory.relative_to(root_path) if inside else directory
                if not inside:
                    raise ValueError(f"The Metanno directory {directory} must be inside the Jupyter root {root}")
                directories[name] = "" if directory == root else directory.relative_to(root).as_posix()
            views = [view.model_dump() for view in load_views(view_path)]
            return {"views": views, "stores": stores, "directories": directories}
        if method == "list_tables":
            return {"tables": self.sources.list_tables(data["source"])}
        if method == "list_databases":
            return {"sources": self.sources.list_databases(data["source"])}
        if method == "set_source_connection":
            self.sources.set_connection(data["source"], data["connection"])
            return {}
        raise ValueError(f"Unknown data method {method!r}")

    def send_worker_reply(
        self, comm: Any, request_id: Optional[str], method: str, future: Future[dict[str, Any]]
    ) -> None:
        """
        Send the worker result or error to the requesting frontend through the kernel event loop
        """
        try:
            data = future.result()

            def callback() -> None:
                send_message(comm, "response", method, request_id=request_id, data=data)

        except Exception as exc:

            def callback(exc=exc) -> None:
                self.report_error(comm, request_id, method, exc)

        self.io_loop.add_callback(callback)

    def send_query_event(self, data: Dict[str, Any]) -> None:
        """
        Broadcast provider query lifecycle events to every attached data panel
        """

        def send() -> None:
            for comm in list(self.comms.values()):
                send_message(comm, "event", "query_status", data)

        self.io_loop.add_callback(send)

    def report_error(self, comm: Any, request_id: Optional[str], method: Optional[str], exc: Exception) -> None:
        """
        Send a typed request failure without exposing a full server traceback
        """
        self.log.error(
            "Data request failed, method=%s request_id=%s\n%s",
            method,
            request_id,
            "".join(traceback.format_exception(type(exc), exc, exc.__traceback__)),
        )
        send_error(comm, method, request_id, exc)

    def do_shutdown(self, restart: bool) -> Dict[str, Any]:
        """
        Cancel queued work and close the connections opened by this kernel when it exits
        """
        self.query_worker.close({self.sources, *(view.sources for view in self.views.values())})
        self.views.clear()
        return {"status": "ok", "restart": restart}


def create_source_view(sources, query_worker, view_id, view):
    """
    Create DataFrame providers for the source view definition and pass their Store to its recipe.

    Returns the rendered view, its Store and the recipes the recipe selector of the tab offers for that Store.
    """
    from pret import DataFrame, create_store

    from .recipes import load_recipes, recipe_choices, render_recipe
    from .source_provider import SourceDataFrameProvider

    frames = {
        name: DataFrame(
            provider=SourceDataFrameProvider(
                sources,
                query_worker,
                table.source,
                table.table,
                view_id,
                connection=table.connection,
                paging=table.paging,
                max_rows=table.max_rows or sources.config.preview.rows,
            )
        )
        for name, table in view.tables.items()
    }
    store = create_store(frames, sync=True)
    for frame in frames.values():
        frame.provider.dataframes_by_id = store.doc._dataframe_registry
    recipes = load_recipes(sources.config.directory / "views")
    rendered = render_recipe(store, view.recipe, view.parameters, recipes, True)
    return rendered, store, recipe_choices(store, recipes)


def main() -> None:
    """
    Launch the explorer kernel or register this Python environment with Jupyter
    """
    import argparse
    import json
    from tempfile import TemporaryDirectory

    from jupyter_client.kernelspec import KernelSpecManager

    parser = argparse.ArgumentParser(add_help=False)
    parser.add_argument("--install", action="store_true")
    options, kernel_args = parser.parse_known_args()
    if options.install:
        spec = json.loads((Path(__file__).parent / "kernelspec/kernel.json").read_text())
        spec["argv"] = [sys.executable, "-m", "metanno.viewer.explorer_kernel", "-f", "{connection_file}"]
        with TemporaryDirectory() as directory:
            (Path(directory) / "kernel.json").write_text(json.dumps(spec))
            destination = KernelSpecManager().install_kernel_spec(directory, kernel_name="metanno-explorer", user=True)
        print(f"Installed Metanno Data Explorer at {destination}")
    else:
        IPKernelApp.launch_instance(kernel_class=DataExplorerKernel, argv=kernel_args)


if __name__ == "__main__":
    main()
