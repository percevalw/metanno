"""
MIME openers for Store applications and requests to render those applications in Metanno tabs
"""

import sys
import time
import uuid
from pathlib import Path

from .config import config_file
from .messages import PROTOCOL_VERSION, send_error, send_message
from .recipes import load_recipes, load_views, recipe_choices, render_recipe

MIMETYPE = "application/vnd.metanno-viewer+json"
COMM_TARGET = "metanno.viewer_display"
view_openers = {}
rendered_views = {}


class ViewOpener:
    """
    Describe an Open with Metanno button and keep the Store needed when the button is clicked
    """

    def __init__(self, store, view, parameters, title, read_only):
        from pret import DataFrame, Store

        if not isinstance(store, Store):
            raise TypeError("view_opener expects a PRET Store")
        database = store.doc.database
        self.path = str(Path(database.path).resolve()) if database and database.path != ":memory:" else None
        if read_only is False and self.path is None:
            raise ValueError("Annotation editing requires a writable file backed Store")
        self.read_only = bool(read_only) if read_only is not None else self.path is None
        self.store = store
        self.config_dir = config_file().parent
        # Recipes and notebooks can import the modules of the config folder, e.g. metanno-home/my_connections.py
        if str(self.config_dir) not in sys.path:
            sys.path.insert(0, str(self.config_dir))
        self.recipes = load_recipes(self.config_dir / "views")
        self.view_definitions = {view.name: view for view in load_views(self.config_dir / "views")}
        if callable(view):
            if view.__module__ == "__main__" or "<locals>" in view.__qualname__:
                raise ValueError("Put the application in an importable Python module so it can be reopened")
            view = f"{view.__module__}:{view.__qualname__}"
        self.view = view or store.metadata.get("view")
        if self.view is None:
            if sum(isinstance(store[key], DataFrame) for key in store) != 1:
                raise ValueError(
                    "view_opener requires view=... for a Store without exactly one DataFrame, "
                    "pass a recipe function or the name of a view in the views directory"
                )
            self.view = "table"
        self.parameters = dict(store.metadata.get("parameters", {})) if parameters is None else parameters
        self.title = title or (Path(self.path).stem if self.path else "Metanno view")
        self.id = uuid.uuid4().hex
        # Notebook cell and execution that displayed this opener, and the tabs still showing its views
        self.execution = None
        self.views = set()
        self.replaced = False

    def choices(self):
        """
        Return the views offered by the recipe selectors of the notebook output and of the Metanno tab
        """
        return list(
            dict.fromkeys(
                [*recipe_choices(self.store, self.recipes), *self.view_definitions, *([self.view] if self.view else [])]
            )
        )

    def _repr_mimebundle_(self, *args, **kwargs):
        """
        Return the opener MIME payload and keep its Store available for later button clicks. Openers
        displayed by an earlier run of the same notebook cell are released once no tab shows their views
        """
        from IPython import get_ipython

        parent = getattr(get_ipython(), "parent_header", {})
        cell = parent.get("metadata", {}).get("cellId")
        self.execution = (cell, parent["header"]["msg_id"]) if cell else None
        for opener in list(view_openers.values()):
            if cell and opener.execution not in (None, self.execution) and opener.execution[0] == cell:
                opener.replaced = True
            if opener.replaced and not opener.views:
                del view_openers[opener.id]
        view_openers[self.id] = self
        return {
            "text/plain": f'Metanno view "{self.title}". This text shows instead of an "Open with Metanno" button '
            "because the Metanno extension is not installed in this JupyterLab",
            MIMETYPE: {
                "id": self.id,
                "view": self.view,
                "choices": self.choices(),
                "title": self.title,
                "path": self.path,
                "read_only": self.read_only,
                "cell": cell,
            },
        }

    def render(self, name, parameters, origin):
        """
        Construct the selected Python application and return its PRET host reference, with the view choices
        shown by the recipe selector of the tab. Parameters saved for another view are not passed to this one
        """
        definition = self.view_definitions.get(name)
        recipe, defaults = (definition.recipe, definition.parameters) if definition else (name, {})
        saved = self.parameters if name == self.view else {}
        parameters = {**defaults, **saved, **parameters}
        start = time.perf_counter()
        rendered = render_recipe(self.store, recipe, parameters, self.recipes, self.read_only)
        recipe_seconds = time.perf_counter() - start
        self.view, self.parameters = name, parameters
        if not self.read_only:
            with self.store.doc.edit_transaction(kind="application"):
                self.store.metadata.update(
                    {
                        "view": name,
                        "recipe": recipe,
                        "parameters": parameters,
                        "origin": origin,
                        "kernelspec": origin["kernelspec"],
                        "title": self.title,
                    }
                )
        start = time.perf_counter()
        payload = rendered._repr_mimebundle_()["application/vnd.pret+json"]["view_data"]
        serialize_seconds = time.perf_counter() - start
        reference = uuid.uuid4().hex
        rendered_views[reference] = rendered
        self.views.add(reference)
        return {
            **payload,
            "view_ref": reference,
            "path": self.path,
            "read_only": self.read_only,
            "title": self.title,
            "view": name,
            "choices": self.choices(),
            # Seconds of each step, logged by the tab when diagnosing slow view openings
            "timings": {"recipe": round(recipe_seconds, 3), "serialize": round(serialize_seconds, 3)},
        }


def register_view_comm():
    """
    Register the display comm in a notebook or independently started Annotation kernel
    """
    from IPython import get_ipython

    shell = get_ipython()
    if shell is None or not hasattr(shell, "kernel"):
        return

    def receive_request(comm, message):
        # The MIME output and Annotation tabs request application views through this comm
        request = message["content"]["data"]
        try:
            if request["protocol_version"] != PROTOCOL_VERSION or request["kind"] != "request":
                raise ValueError("Unsupported Metanno request")
            data = request["data"]
            method = request["method"]
            if method == "is_alive":
                result = {}
            elif method == "open":
                if data["id"] not in view_openers:
                    raise ValueError("This opener has expired, recreate it in the application that produced it")
                result = view_openers[data["id"]].render(data["view"], data.get("parameters", {}), data["origin"])
            elif method == "reopen":
                from pret import load_store, load_store_snapshot

                # Annotation Stores saved by the generated code record how pages receive their tables
                start = time.perf_counter()
                saved = load_store_snapshot(data["path"], metadata=True)
                options = {key: saved[key] for key in ("dataframe_sync", "dataframe_max_bytes") if key in saved}
                store = load_store(data["path"], **options)
                load_seconds = time.perf_counter() - start
                metadata = store.metadata.to_py()
                entry = ViewOpener(
                    store,
                    metadata.get("view"),
                    metadata.get("parameters"),
                    metadata.get("title"),
                    data.get("read_only", False),
                )
                opener_seconds = time.perf_counter() - start - load_seconds
                result = entry.render(data.get("view") or entry.view or "table", {}, data["origin"])
                result["timings"] = {
                    "load_store": round(load_seconds, 3),
                    "opener": round(opener_seconds, 3),
                    **result["timings"],
                }
            elif method == "close":
                rendered_views.pop(data["view_ref"], None)
                # A replaced opener is released when the next opener is displayed, not here, because a tab
                # refreshing its view closes the previous view before opening the next one
                for opener in view_openers.values():
                    opener.views.discard(data["view_ref"])
                result = {}
            else:
                raise ValueError(f"Unknown display method {method}")
            send_message(comm, "response", method, result, request["request_id"])
        except Exception as error:
            send_error(comm, request.get("method"), request.get("request_id"), error)

    def attach_comm(comm, message):
        comm.on_msg(lambda message: receive_request(comm, message))

    shell.kernel.comm_manager.register_target(COMM_TARGET, attach_comm)


def view_opener(store, view=None, *, parameters=None, title=None, read_only=None):
    """
    Return a MIME opener that launches a Store application in a Metanno tab.

    A Store holds application state, the view function decides how to render that
    state. When view is omitted, the built in table view requires exactly one
    DataFrame in the Store. Other Store structures require an explicit recipe
    or a view recorded in the Store metadata.

    Parameters
    ----------
    store
        Application state passed to the view, this may contain ordinary values and DataFrames
        Editable Metanno views require a saved Store
    view
        Recipe name, importable function, module and function separated by a colon,
        or the name of a view file in the views directory
        The function receives store and parameters and returns a PRET component
    parameters
        Keyword arguments supplied to the selected recipe
    title
        Entry and tab title, defaults to the saved filename or Metanno view
    read_only
        Defaults to true for transient Stores, may also disable edits to a saved Store

    Returns
    -------
    ViewOpener
        MIME output containing a recipe selector and a button that opens a Metanno tab
    """
    register_view_comm()
    return ViewOpener(store, view, parameters, title, read_only)
