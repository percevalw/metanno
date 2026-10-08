"""
Register shared selections and handles before rendering table, form and text widgets
"""

import warnings
from contextvars import ContextVar
from os import PathLike
from typing import Any, Callable, Dict, List, Optional, Sequence, Tuple, Union

from pret import DataFrame, Store, component, create_store, use_store_snapshot
from pret.hooks import (
    RefType,
    use_effect,
    use_ref,
    use_state,
)
from pret.react import b as bold
from pret.react import div
from pret.render import Renderable
from pret_joy import Stack
from typing_extensions import Literal, TypedDict

from .data_relations import DataRelation, make_dataframe_queries
from .fields import FieldSpec, render_select_field, render_text_field
from .fields import infer_fields as infer_fields
from .form_widget import FormWidgetHandle, FormWidgets
from .pdf_widget import PdfWidgets
from .table_widgets import TableWidgetHandle, TableWidgets
from .text_widget import TextWidgetHandle, TextWidgets
from .widget_data import StatusBar, get_parent_selection, use_selected_rows

VIEW_READ_ONLY = ContextVar("metanno_view_read_only", default=False)


class DataWidgetFactory(TableWidgets, FormWidgets, TextWidgets, PdfWidgets):
    """
    Build tables, forms and annotation views that share a PRET Store.

    Widgets created by this factory edit the same data and share row selection.
    The factory keeps selection separately from the data so navigation does not
    enter the data undo history.

    Parameters
    ----------
    data
        Existing PRET Store, or initial mapping of row lists and DataFrames
    sync
        Used when creating a Store from initial data. False or None keeps edits in
        the browser. True synchronizes with Python without saving to disk. A file
        path also saves edits and lets other Python processes open the same Store
    relations
        Parent and child columns used to filter linked tables
    read_only
        Disable mutations from these widgets without changing notebook access to the Store
    """

    def __init__(
        self,
        data: Union[Store, Dict[str, Any], Callable[[], Dict]],
        sync: Optional[Union[bool, str, PathLike]] = None,
        relations: Sequence[DataRelation] = (),
        read_only: bool = False,
    ):
        self.read_only = VIEW_READ_ONLY.get() or read_only
        if isinstance(data, Store):
            self.data = data
        else:
            self.data = create_store(data, sync=sync)
        if self.data.doc.sync_id is None and not self.read_only:
            warnings.warn(
                "DataWidgetFactory edits are not saved, use pret.save_store to create a Store saved to a file"
            )
        self.handles = {}
        self.primary_keys = {}
        self.selected_rows = {}
        # Browser code reads relations as plain dicts
        self.relations = [relation.as_dict() for relation in relations]

        relation_parents = {}
        for relation in self.relations:
            if relation["child"] in relation_parents:
                raise ValueError(f"DataFrame {relation['child']!r} has several relation parents")
            relation_parents[relation["child"]] = relation["parent"]
        for child in relation_parents:
            current = relation_parents[child]
            while current in relation_parents:
                if current == child:
                    raise ValueError("DataRelation values must not form a cycle")
                current = relation_parents[current]

        self.query_tables = {}
        self.mount_dataframes, self.query_from = make_dataframe_queries(self.query_tables, self.relations)

    def register_dataframe(self, key):
        """
        Include a created widget table and its ancestors in the shared browser initialization
        """
        self.query_tables[key] = self.data[key]
        for relation in self.relations:
            if relation["child"] == key:
                self.register_dataframe(relation["parent"])

    def register_widget_dataframe(self, store_key):
        """
        Register the DataFrame of a top level Store key, returns the effect that widgets showing it run on mount
        to initialize the DataFrames in the browser, or None for Store rows
        """
        if "." in store_key or not isinstance(self.data[store_key], DataFrame):
            return None
        self.register_dataframe(store_key)
        return self.mount_dataframes

    def ensure_selected_rows(self, store_key):
        """
        Create the shared selection of a Store key, read and written by every widget showing it.

        `identities` holds the primary keys of the selected rows and `row` the values of the lead one.
        Tables keep the positions of these rows themselves, to highlight them.
        """
        if store_key is None:
            return
        if store_key not in self.selected_rows:
            self.selected_rows[store_key] = create_store({"identities": [], "row": None})

    @staticmethod
    def deep_get_store(data_store, path_parts: List[str], parent_ids: Dict[str, Any], primary_keys: Dict[str, str]):
        """
        Find the rows shown for a Store key, following a nested key such as notes.entities
        through the lead selected row of each parent, identified by its primary key
        """
        store = data_store[path_parts[0]]
        for idx in range(1, len(path_parts)):
            parent_path = ".".join(path_parts[:idx])
            identity = parent_ids.get(parent_path)
            key = primary_keys.get(parent_path)
            row = next((row for row in store if row[key] == identity), None) if identity is not None else None
            if row is None or row.get(path_parts[idx]) is None:
                return None
            store = row[path_parts[idx]]
        return store

    def register_pkey(self, store_key, primary_key: Optional[str]):
        if store_key is None or primary_key is None:
            return
        path_parts = str(store_key).split(".")
        for i in range(1, len(path_parts) + 1):
            self.ensure_selected_rows(".".join(path_parts[:i]))
        self.primary_keys.setdefault(store_key, primary_key)

    def make_select_rows(self):
        """
        Build the browser functions that change a shared selection and update the widgets related to it.

        `select_rows` is called by tables with the selected rows, and by forms and
        annotation widgets when no table shows their rows. `select_row_id` goes through a table of the
        Store key when there is one, so it scrolls to the row and highlights it.
        """
        handles, relations = self.handles, self.relations
        primary_keys, selected_rows_by_store = self.primary_keys, self.selected_rows

        def filter_related_tables(filter_key, filter_value, source_store_key, source_handle):
            """
            Filter the tables of other Store keys on the primary key of a selected row, for Store keys without a
            declared DataRelation, each table accepts the keys given by its accept_related_filter_keys
            """
            for other_store_key, handle_list in handles.items():
                if other_store_key == source_store_key:
                    continue
                for other_handle, _, accepted_keys in [item for item in handle_list if item[1] == "table"]:
                    if other_handle.current is None or other_handle == source_handle or accepted_keys is False:
                        continue
                    if accepted_keys is True or accepted_keys is None or filter_key in accepted_keys:
                        other_handle.current.set_filter(filter_key, str(filter_value))

        def select_row_id(store_key, identity, source_handle=None):
            tables = [
                item[0]
                for item in handles.get(store_key, [])
                if item[1] == "table" and item[0].current is not None and item[0] != source_handle
            ]
            for table in tables:
                table.current.select_row_id(identity, "relation")
            selection = selected_rows_by_store.get(store_key)
            if not len(tables) and selection is not None and str(selection["identities"]) != str([identity]):
                selection["identities"] = [identity]
                selection["row"] = None

        def select_rows(store_key, rows, source_handle, cause):
            selection = selected_rows_by_store[store_key]
            primary_key = primary_keys.get(store_key)
            # Positions left over from a previous filter resolve to undefined rows, which is not None in the browser
            rows = [row for row in rows if row]
            identities = [row[primary_key] for row in rows] if primary_key is not None else []
            changed = str(selection["identities"]) != str(identities)
            selection["identities"] = identities
            selection["row"] = rows[0] if len(rows) else None
            lead = rows[0] if len(rows) else None
            in_relation = any(store_key in (relation["parent"], relation["child"]) for relation in relations)
            if lead is not None:
                # Select parent rows from declared relations, or guess parents from their primary key names
                for relation in relations:
                    if relation["child"] == store_key:
                        select_row_id(relation["parent"], lead[relation["child_column"]])
                if not in_relation:
                    for other_key in primary_keys.keys():
                        other_pk = primary_keys[other_key]
                        if other_key != store_key and other_pk != primary_key and lead.get(other_pk) is not None:
                            select_row_id(other_key, lead[other_pk])
            if changed and cause != "relation":
                # Children of the previous selection no longer apply
                for key in selected_rows_by_store.keys():
                    is_child = key.startswith(f"{store_key}.") or any(
                        relation["parent"] == store_key and relation["child"] == key for relation in relations
                    )
                    if is_child and len(selected_rows_by_store[key]["identities"]):
                        selected_rows_by_store[key]["identities"] = []
                        selected_rows_by_store[key]["row"] = None
            if lead is not None and primary_key is not None and cause not in {"relation", "snapshot"}:
                for other in handles.get(store_key, []):
                    if other[0] == source_handle or other[0].current is None:
                        continue
                    if other[1] == "spans":
                        other[0].current.scroll_to_span(lead[primary_key])
                    elif other[1] == "table":
                        other[0].current.scroll_to_row_id(lead[primary_key])
                # Child tables of declared relations follow the selection themselves
                if not in_relation:
                    filter_related_tables(primary_key, lead[primary_key], store_key, source_handle)

        return select_rows, select_row_id

    def create_selected_field_view(
        self,
        *,
        store_key,
        shown_key,
        fallback: Optional[str] = "",
    ) -> Renderable:
        """
        Render a single field from the currently selected row in a store.

        Parameters
        ----------
        store_key : Any
            Key pointing to the collection to display
        shown_key : Any
            Field key to show from the current row
        fallback : str | None
            Value returned when no row is available

        Returns
        -------
        Renderable
            Pret component instance displaying the selected field value
        """
        store_key = str(store_key)
        path_parts = store_key.split(".")
        primary_key = self.primary_keys[store_key]
        self.register_pkey(store_key, primary_key)
        selected_rows_store = self.selected_rows[store_key]
        selected_rows_by_store = self.selected_rows
        data_store = self.data
        deep_get_store, primary_keys = self.deep_get_store, self.primary_keys
        empty_store = create_store([])
        on_mount = self.register_widget_dataframe(store_key)

        @component
        def SelectedFieldView():
            """
            Show a field of the lead selected row, looked up by its primary key
            """
            if on_mount is not None:
                use_effect(on_mount, [])
            parent_ids = get_parent_selection(path_parts, selected_rows_by_store, use_store_snapshot)
            data = deep_get_store(data_store, path_parts, parent_ids, primary_keys) or empty_store
            selected = use_store_snapshot(selected_rows_store)
            rows, view = use_selected_rows(data, primary_key, selected["identities"][:1])
            return view.error or view.loading or (rows[0].get(shown_key, fallback) if len(rows) else fallback)

        return SelectedFieldView()

    def create_status_bar(self, show_connection=True):
        """
        Return a bar showing the last rejected edit or undo of the Store and its connection to Python, place it
        below the widgets of a notebook output or an app. Factory widgets do not show Store errors themselves

        Parameters
        ----------
        show_connection : bool
            Also show whether the Store is connected, disconnected or offline
        """
        return StatusBar(store=self.data, synced=self.data.doc.sync_id is not None, show_connection=show_connection)

    # Former name, kept for existing apps
    create_connection_status_bar = create_status_bar
