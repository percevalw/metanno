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
                "DataWidgetFactory persistence is disabled: modifications on the data will not be "
                "saved ! Use pret.save_store to create a writable persisted Store.",
            )
        self.handles = {}
        self.primary_keys = {}
        self.selected_rows = {}  # store_key -> currently selected row indices
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
        query_from = self.query_from

        def query(filters, offset=0):
            return query_from(key, filters, offset)

        return query

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
            path = ".".join(path_parts[:i])
            self.ensure_selected_rows(path)
        if store_key in self.primary_keys:
            return
        self.primary_keys[store_key] = primary_key

    def make_filter_related_tables(self):
        """
        Build the browser function that filters the tables of other Store keys on the primary key of a
        selected row, for Store keys without a declared DataRelation
        """
        handles = self.handles

        def filter_related_tables(
            filter_key: str,
            filter_value: Any,
            source_store_key,
            source_handle,
        ):
            for other_store_key, handle_list in handles.items():
                if other_store_key == source_store_key:
                    continue
                for handle_item in handle_list:
                    other_handle = handle_item[0]
                    other_kind = handle_item[1]
                    accept_related_filter_keys = handle_item[2] if len(handle_item) > 2 else True
                    if other_kind != "table" or other_handle.current is None:
                        continue
                    if other_handle == source_handle:
                        continue
                    if accept_related_filter_keys is False:
                        continue
                    if (
                        accept_related_filter_keys is not True
                        and accept_related_filter_keys is not None
                        and filter_key not in accept_related_filter_keys
                    ):
                        continue
                    other_handle.current.set_filter(filter_key, str(filter_value))

        return filter_related_tables

    def make_select_rows(self):
        """
        Build the browser functions that change a shared selection and update the widgets related to it.

        `select_rows` is called by tables with the selected rows, and by forms and
        annotation widgets when no table shows their rows. `select_row_id` goes through a table of the
        Store key when there is one, so it scrolls to the row and highlights it.
        """
        handles, relations = self.handles, self.relations
        primary_keys, selected_rows_by_store = self.primary_keys, self.selected_rows
        filter_related_tables = self.make_filter_related_tables()

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
            Key pointing to the collection to display.
        shown_key : Any
            Field key to show from the current row.
        fallback : str | None
            Value returned when no row is available.

        Returns
        -------
        Renderable
            Pret component instance displaying the selected field value.
        """
        store_key = str(store_key)
        path_parts = store_key.split(".")
        for i in range(1, len(path_parts) + 1):
            self.ensure_selected_rows(".".join(path_parts[:i]))
        selected_rows_store = self.selected_rows[store_key]
        selected_rows_by_store = self.selected_rows
        data_store = self.data
        deep_get_store, primary_keys = self.deep_get_store, self.primary_keys
        primary_key = primary_keys[store_key]
        empty_store = create_store([])
        on_mount = None
        if len(path_parts) == 1 and isinstance(data_store[store_key], DataFrame):
            self.register_dataframe(store_key)
            on_mount = self.mount_dataframes

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

    def create_filters_view(
        self,
        *,
        store_key,
        fields: Sequence[FieldSpec],
        style: Optional[Dict[str, Any]] = None,
        min_input_width: Optional[str] = None,
        all_label: str = "All",
        label_bold: bool = False,
    ) -> Renderable:
        """
        Render filtering controls for a table linked to a store.

        Parameters
        ----------
        store_key : Any
            Key pointing to the collection to filter.
        fields : Sequence[FieldSpec]
            Field metadata used for rendering filter inputs. Expects:

            - `key`: Field key.
            - `name`: Field display name.
            - `kind`: Field data kind:

                - `"text"`: Plain text.
                - `"boolean"`: Boolean values.
                - `"select"/"radio"/"autocomplete"`: Multi choice selection.

            - `filterable`: If False, no filter control will be rendered.
            - `options`: If present, a dropdown/autocomplete will be used
                with the provided options (can also be a function that takes the
                selected sample as input and returns options).
        style : Dict[str, Any] | None
            Inline style overrides for the wrapping container.
        min_input_width : str | None
            Minimum width applied to each input control.
        all_label : str
            Label used to reset a filter (no filtering).
        label_bold : bool
            Whether to render labels in bold.

        Returns
        -------
        Renderable
            Pret component instance rendering the filter controls.
        """
        handles = self.handles
        fields = list(fields)

        @component
        def FiltersView():
            filters, set_filters = use_state({})

            def apply_filter(key, raw_value):
                cleaned = dict(filters)
                if raw_value is None or raw_value == "":
                    cleaned.pop(key, None)
                    raw_value = None
                else:
                    cleaned[key] = raw_value
                set_filters(cleaned)
                for other in handles.get(store_key, []):
                    if other[1] != "table" or other[0].current is None:
                        continue
                    other[0].current.set_filter(key, raw_value)

            def render_filter(field):
                if field.get("filterable", True) is False:
                    return None
                key = field["key"]
                label = field.get("name", key)
                if label_bold and isinstance(label, str):
                    label = bold(label)
                options = field.get("options")
                kind = field.get("kind")
                current_value = filters.get(key, "")

                if options is None and kind == "boolean":
                    options = [True, False]

                if options is not None:
                    return render_select_field(
                        key=key,
                        label=label,
                        kind="autocomplete" if len(options) > 15 else "select",
                        data=filters,
                        value=current_value,
                        editable=True,
                        options=options,
                        on_field_change=apply_filter,
                        min_input_width=min_input_width,
                        all_label=all_label,
                    )

                return render_text_field(
                    key=key,
                    label=label,
                    data=filters,
                    value=current_value,
                    editable=True,
                    on_field_change=apply_filter,
                    min_input_width=min_input_width,
                )

            filters_view = [render_filter(field) for field in fields]
            return Stack(
                *[item for item in filters_view if item is not None],
                direction="column",
                spacing=1,
                use_flex_gap=True,
                style=style,
            )

        return FiltersView()

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
