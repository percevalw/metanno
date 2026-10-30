"""
Table rendering used by DataWidgetFactory
"""

from typing import Any, Callable, Dict, List, Optional, Sequence, Union

from pret import component, create_store, use_store_snapshot
from pret.hooks import (
    RefType,
    use_effect,
    use_event_callback,
    use_imperative_handle,
    use_ref,
    use_state,
)
from pret.marshal import marshal_as
from pret.react import div
from pret.render import Renderable
from pret_joy import Button, Stack, ToggleButtonGroup
from typing_extensions import TypedDict

from metanno import Table
from metanno.ui import js

from .data_relations import ancestor_filter, selected_value
from .fields import FieldSpec
from .widget_data import (
    ErrorBanner,
    LoadingStatus,
    StoreWidget,
    edit_rows,
    extract_row_indices,
    get_parent_selection,
    use_rows,
)


@marshal_as(js="return filterAst", globals={"filterAst": js.Metanno.filterAst})
def parse_table_filters(description, filters):
    """
    Parse table header filter strings into the DataFrame filter tree
    """


class TableWidgetHandle(TypedDict):
    """
    Imperative handle for interacting with a table widget.
    """

    scroll_to_row_id: Callable[[Any], None]
    scroll_to_row_idx: Callable[[int], None]
    select_row_id: Callable[[Any], None]
    set_filter: Callable[[str, Any], None]
    get_filters: Callable[[], Dict[str, Any]]
    clear_filters: Callable[[], None]
    set_highlighted: Callable[[List[Any]], None]
    get_adjacent_row_id: Callable[[Any, int], Any]
    get_adjacent_row_idx: Callable[[Optional[int], int], Optional[int]]


class TableWidgets:
    """
    Tables of DataWidgetFactory, which provides the Store, row selections, relations and widget handles
    """

    def create_table_widget(
        self,
        *,
        store_key,
        primary_key: Optional[str],
        fields: Sequence[FieldSpec],
        style: Optional[Dict[str, Any]] = None,
        handle: RefType[TableWidgetHandle] = None,
        accept_related_filter_keys: Union[bool, Sequence[str]] = True,
        on_selection_change: Optional[
            Callable[[Any, Optional[int], Optional[str], str, Any, Optional[List[Dict[str, int]]]], None]
        ] = None,
        on_mouse_hover_row: Optional[Callable[[Any, int, List[str]], None]] = None,
        on_click_cell_content: Optional[Callable[[Any, int, str, Any], None]] = None,
        source_requery: bool = False,
        include_unconfigured_columns: bool = False,
        follow_parent_selection: bool = False,
        parent_row_name: Optional[str] = None,
    ) -> Renderable:
        """
        Create a [`Table`][metanno.ui.Table] widget bound to a store entry.
        Field metadata is inferred from the underlying data, with optional
        callbacks for selection changes, hover, and cell content clicks. An
        imperative handle can be exposed for scrolling and filtering.

        Parameters
        ----------
        store_key : Any
            Key pointing to the list-like store to render.
        primary_key : str | None
            Column identifying rows, shared selections store its values. Required for lists of rows,
            with None a DataFrame table clears its selection when its rows change.
        fields : Sequence[FieldSpec]
            Field metadata used for rendering and editing. Expects:

            - `key`: Field key.
            - `name`: Field display name.
            - `kind`: Field data kind:

                - `"text"`: Plain text.
                - `"boolean"`: Boolean values.
                - `"hyperlink"`: Clickable hyperlink.
                - `"select"/"radio"/"autocomplete"`: Multi choice selection.

            - `options`: If present, a dropdown/autocomplete will be used
                with the provided options (can also be a function that takes the
                selected sample as input and returns options).
            - `editable`: If True, cells in this column are editable.
            - `filterable`: If False, no filter control will be rendered.
        style : Dict[str, Any] | None
            Inline style of the table container, which fills its parent unless these keys override it,
            e.g. a fixed height in a notebook output.
        handle : RefType[TableWidgetHandle] | None
            Imperative handle exposing helpers :

            - `scroll_to_row_id(row_id)`: Scroll to the row with the given primary key
            - `scroll_to_row_idx(row_idx)`: Scroll to the specified row index.
            - `select_row_id(row_id)`: Select the row with the given primary key, as a click on it would.
            - `set_filter(col, value)`: Apply a filter on the given column.
            - `get_filters()`: Retrieve the current filter mapping.
            - `clear_filters()`: Clear all active filters.
            - `set_highlighted(row_ids)`: Highlight the specified rows by their IDs.
            - `get_adjacent_row_id(current_row_id, delta)`: Retrieve the next/previous
              row ID within the filtered view, wrapping around.
            - `get_adjacent_row_idx(current_row_idx, delta)`: Retrieve the next/previous
              row index within the filtered view, wrapping around.
        accept_related_filter_keys : bool | Sequence[str]
            Controls whether this table accepts filters broadcast by other views when the factory declares no
            relation for them, tables linked by a DataRelation follow the selection of their parent instead.
            `True` accepts all incoming filters, `False` accepts none, and a
            sequence restricts accepted filter keys.
        on_selection_change : Callable | None
            Called when focus moves inside the table.

            - `row_id`: Primary key of the focused row.
            - `row_idx`: Index of the focused row.
            - `col`: Field key receiving focus.
            - `mode`: Interaction mode, such as `"EDIT"` or `"SELECT"`.
            - `cause`: What triggered the move (e.g. `"key"`, `"mouse"`).
            - `ranges`: Row ranges selected by range selection.
        on_mouse_hover_row : Callable[[Any, int, List[str]], None] | None
            Called when the mouse hovers over a row.

            - `row_id`: Primary key for that row.
            - `row_idx`: Index of the row under the pointer.
            - `modkeys`: Pressed modifier keys during the hover.
        on_click_cell_content : Callable[[Any, int, str, Any], None] | None
            Called when hyperlink-like content inside a cell is clicked.

            - `row_id`: Primary key of the clicked row.
            - `row_idx`: Index of the clicked row.
            - `col`: Field key containing the clickable content.
            - `value`: Value associated with the clicked cell.
        source_requery : bool
            Show an action for fetching the DataFrame source again.
        include_unconfigured_columns : bool
            Show columns missing from fields without allowing edits to them.
        follow_parent_selection : bool
            For the child of a `working_set` DataRelation, start with only the rows under the selected
            parent row shown, instead of every row. Choices above a related table pick the ancestor to
            follow among those with a selected row, e.g. All, Patient and Stay for notes under stays under
            patients, or All and Patient while no stay is selected. Without a selected row of the chosen
            ancestor, the table follows the nearest selected one above it. An ancestor row selected by
            clicking a row of this table is only followed once chosen, so the rows shown stay. These choices
            only change what the table shows, not the rows loaded for other widgets. The child of a
            `selection` DataRelation always follows an ancestor.
        parent_row_name : str | None
            Name of one row of the parent table, e.g. `"stay"`, in the choices of this table and of the
            tables below it. Defaults to the Store key of the parent table.

        Returns
        -------
        Renderable
            A Pret component instance rendering the configured table.
        """
        read_only = self.read_only
        store_key = str(store_key)
        path_parts = store_key.split(".")

        # Table only support a subset of kinds for editing/viewing values
        KIND_MAP = {
            "radio": "text",
            "checkbox": "boolean",
            "select": "text",
            "autocomplete": "text",
        }
        columns = [
            {**c, "kind": KIND_MAP.get(c["kind"], c["kind"]), "editable": bool(c.get("editable") and not read_only)}
            for c in fields
        ]

        # Register the handle so other widgets can scroll and filter this table
        handle = handle or use_ref()
        if isinstance(accept_related_filter_keys, str):
            accept_related_filter_keys = [accept_related_filter_keys]
        self.handles.setdefault(store_key, []).append([handle, "table", accept_related_filter_keys])
        self.ensure_selected_rows(store_key)
        self.register_pkey(store_key, primary_key)
        on_mount = self.register_widget_dataframe(store_key)
        is_dataframe = on_mount is not None
        if primary_key is None and not is_dataframe:
            raise ValueError("A table of Store rows requires a primary_key")

        # Factory state captured by the browser component below
        data_store, handles = self.data, self.handles
        deep_get_store, primary_keys = self.deep_get_store, self.primary_keys
        selected_rows_by_store = self.selected_rows
        selected_rows_store = selected_rows_by_store[store_key]
        query_from = self.query_from
        select_rows, _ = self.make_select_rows()
        # A related table shows the rows under the selected row of one of its ancestors, chosen above the table
        # among every ancestor, e.g. a stay or a patient for notes, and every row for the child of a working set
        ancestor_relations = self.ancestor_relations(store_key)
        ancestor_selection_stores = [self.selected_rows[relation["parent"]] for relation in ancestor_relations]
        is_working_set = len(ancestor_relations) > 0 and ancestor_relations[0]["load"] == "working_set"
        if len(ancestor_relations) and parent_row_name:
            self.row_names[ancestor_relations[0]["parent"]] = parent_row_name
        row_names = self.row_names
        initial_level = 0 if len(ancestor_relations) and (follow_parent_selection or not is_working_set) else None
        # Choices from the broadest to the nearest ancestor, e.g. All, Patient, Stay, as indices in ancestor_relations
        levels = ([None] if is_working_set else []) + list(reversed(range(len(ancestor_relations))))
        empty_store = create_store([])

        @component
        def TableWidget():
            """
            Build a table of DataFrame or Store rows that shares selection and edits with the other factory widgets
            """
            position, set_position = use_state({"row_idx": None, "col": None, "mode": "SELECT", "ranges": []})
            selected_rows_snapshot = use_store_snapshot(selected_rows_store)
            parent_ids = get_parent_selection(path_parts, selected_rows_by_store, use_store_snapshot)
            data = deep_get_store(data_store, path_parts, parent_ids, primary_keys) or empty_store

            filters, set_filters = use_state({})
            related_filters, set_related_filters = use_state({})
            highlighted, set_highlighted = use_state([])
            suggestions, set_suggestions = use_state([])
            sort, set_sort = use_state([])
            table_ref = use_ref()
            if on_mount is not None:
                use_effect(on_mount, [])
            # Index in ancestor_relations of the nearest ancestor to follow, None for every row, and whether the user
            # picked it above the table
            choice, set_choice = use_state({"level": initial_level, "picked": False})
            ancestor_selections = []
            for selection_store in ancestor_selection_stores:
                ancestor_selections.append(use_store_snapshot(selection_store))
            followed, parent_filter = (
                ancestor_filter(
                    ancestor_relations, ancestor_selections, data_store, primary_keys, choice["level"], choice["picked"]
                )
                if choice["level"] is not None
                else (None, None)
            )
            # Choices of All and of the ancestors with a selected row, e.g. All and Patient while no stay is selected,
            # with the row name of each, given by the tables created after this one too
            names = [row_names.get(relation["parent"]) or relation["parent"] for relation in ancestor_relations]
            options = [
                option
                for option in levels
                if option is None
                or selected_value(ancestor_relations[option], ancestor_selections[option], primary_keys) is not None
            ]
            view = use_rows(data, primary_key, {**filters, **related_filters}, parent_filter, sort)
            description = view.description
            source = view.rowSource
            selection_request = use_ref(None)

            def select_first_row():
                # Store lists open on their first row, as forms and annotations show the lead selected row
                if not is_dataframe and len(selected_rows_store["identities"]) == 0 and source and source.rowCount:
                    select_row_id(source.getCachedRow(0)[primary_key])

            use_effect(select_first_row, [source])

            def sync_shared_selection():
                """
                Keep this table and the shared selection of its Store key in sync when either changes. The selected
                rows are highlighted at their positions in the rows shown, e.g. after a filter change or when another
                widget selected them, like the stay of a clicked note, and the lead one is scrolled to when it was not
                highlighted. An active header cell stays, so typing in a filter keeps its focus. Edited values of the
                selected rows refresh the shared selection, and select_rows then follows a changed parent key.
                """
                identities = selected_rows_snapshot["identities"]
                if source is None or primary_key is None or not len(identities):
                    return
                controller = __new__(AbortController())  # noqa: F821

                async def sync():
                    rows = await source.getRowsByKeys(identities, controller.signal)
                    indices = []
                    for row in rows:
                        idx = await source.findRowIndex(row[primary_key], controller.signal)
                        if idx >= 0:
                            indices.append(idx)
                    if controller.signal.aborted:
                        return
                    highlighted = [source.getCachedRow(idx) for idx in position["ranges"]]
                    if str([row[primary_key] if row else None for row in highlighted]) != str(identities):
                        lead = indices[0] if len(indices) else None
                        set_position(
                            lambda current: {
                                **current,
                                "ranges": indices,
                                "row_idx": None if current["row_idx"] is None else lead,
                            }
                        )
                        if lead is not None and table_ref.current:
                            table_ref.current.scroll_to_row_idx(lead)
                    previous = selected_rows_snapshot["row"]
                    if len(rows) and previous and str(rows[0]) != str(previous):
                        select_rows(store_key, rows, handle, "snapshot")

                sync()
                return lambda: controller.abort()

            use_effect(sync_shared_selection, [source, view.contentVersion, str(selected_rows_snapshot["identities"])])

            def set_filter(column, value):
                updated = dict(related_filters)
                if value is None:
                    updated.pop(column, None)
                else:
                    updated[column] = f"= {value}"
                set_related_filters(updated)

            def cancel_selection():
                if selection_request.current is not None:
                    selection_request.current.abort()

            use_effect(lambda: cancel_selection, [source])

            async def select_row_id(row_id, cause="select"):
                """
                Select a row by its primary key, `cause` is "relation" when it follows the selection of a related
                widget, which already updated the widgets depending on it
                """
                if source is None:
                    return
                cancel_selection()
                controller = __new__(AbortController())  # noqa: F821
                selection_request.current = controller
                rows = await source.getRowsByKeys([row_id], controller.signal)
                if len(rows) and not controller.signal.aborted:
                    idx = await source.findRowIndex(row_id, controller.signal)
                    if controller.signal.aborted:
                        return
                    set_position(
                        {
                            "row_idx": idx if idx >= 0 else None,
                            "col": None,
                            "mode": "SELECT",
                            "ranges": [idx] if idx >= 0 else [],
                        }
                    )
                    handle_position_change(
                        row_id,
                        idx if idx >= 0 else None,
                        None,
                        "SELECT",
                        cause,
                        [{"row_idx": idx}] if idx >= 0 else [],
                        rows[0],
                        rows,
                    )
                    if idx >= 0:
                        table_ref.current.scroll_to_row_idx(idx)

            async def adjacent_row_idx(idx, delta):
                if source is None or not source.rowCount:
                    return None
                # Related tables loaded by relations show only their loaded window of the DataFrame
                scope = data.scope if is_dataframe else None
                first = (scope.offset or 0) if scope and scope.rows and source.getCachedRow(0) is None else 0
                count = min(source.rowCount - first, len(scope.rows)) if scope and scope.rows else source.rowCount
                return first + ((idx if idx is not None else first) - first + delta) % count

            async def row_id_at(idx):
                if source is None or idx is None:
                    return None
                controller = __new__(AbortController())  # noqa: F821
                rows = await source.getRows(idx, idx + 1, controller.signal)
                return rows[0][primary_key] if len(rows) else None

            async def adjacent_row_id(row_id, delta):
                if source is None:
                    return None
                idx = await source.findRowIndex(row_id, __new__(AbortController()).signal)  # noqa: F821
                return await row_id_at(await adjacent_row_idx(idx, delta))

            use_imperative_handle(
                handle,
                lambda: {
                    "scroll_to_row_id": lambda value: table_ref.current.scroll_to_row_id(value),
                    "scroll_to_row_idx": lambda value: table_ref.current.scroll_to_row_idx(value),
                    "select_row_id": select_row_id,
                    "set_filter": set_filter,
                    "get_filters": lambda: filters,
                    "clear_filters": lambda: set_filters({}),
                    "set_highlighted": set_highlighted,
                    "get_adjacent_row_idx": adjacent_row_idx,
                    "get_adjacent_row_id": adjacent_row_id,
                    "get_row_id": row_id_at,
                    "focus": lambda: table_ref.current.focus(),
                },
                [source, filters, related_filters],
            )

            async def handle_selection(row_id, row_idx, col, mode, cause, ranges=None, row=None):
                indices = extract_row_indices(ranges)
                if row_idx is not None and row_idx >= 0 and row_idx not in indices:
                    indices = [row_idx, *indices]
                # The rows found again by the grid after a source change are highlighted by show_shared_selection
                if cause == "snapshot":
                    return
                # The active cell and the highlighted row positions stay in this table. A click on a header or a
                # filter selects no row and keeps the highlighted rows, like a click outside the table
                if len(indices):
                    set_position({"row_idx": row_idx, "col": col, "mode": mode, "ranges": indices})
                else:
                    set_position(lambda current: {**current, "row_idx": row_idx, "col": col, "mode": mode})
                if source is None:
                    return
                cancel_selection()
                controller = __new__(AbortController())  # noqa: F821
                selection_request.current = controller
                try:
                    rows = await source.getRowsAtIndices(indices, controller.signal)
                    if not controller.signal.aborted:
                        handle_position_change(row_id, row_idx, col, mode, cause, ranges, row, rows)
                except BaseException as error:
                    if is_dataframe and not controller.signal.aborted:
                        data.setStatus(None, str(error))

            async def handle_cell_change(row_id, row_idx, column, value):
                await edit_rows(data, primary_key, [source.getCachedRow(row_idx)], {column: value}, read_only=read_only)

            @use_event_callback
            def handle_input_change(row_id, row_idx, col, value, cause):
                # Suggest the configured options of the edited column while typing
                options = next((c for c in columns if c["key"] == col), {}).get("options")
                if cause == "unmount" or options is None:
                    set_suggestions(None)
                elif cause == "mount":
                    set_suggestions(options)
                elif cause == "type":
                    set_suggestions([c for c in options if (value or "").lower() in c.lower()])

            async def query_source(event=None):
                set_related_filters({})
                await query_from(store_key, source_ast)

            @use_event_callback
            def handle_position_change(
                row_id,
                row_idx,
                col,
                mode,
                cause,
                ranges=None,
                row=None,
                selected_data=None,
            ):
                """
                Share the selected rows with related widgets, a blur or a click without row keeps the previous selection
                """
                if cause != "blur" and len(selected_data or []):
                    select_rows(store_key, selected_data, handle, cause)
                if on_selection_change is not None:
                    on_selection_change(row_id, row_idx, col, mode, cause, ranges)

            @use_event_callback
            def handle_mouse_hover_row(row_id, row_idx, modkeys, row=None):
                """
                Highlight the spans of the row under the pointer and call the user supplied hover callback
                """
                highlighted_ids = [] if row is None or primary_key is None else [row[primary_key]]
                for handle_item in handles.get(store_key, []):
                    if handle_item[1] == "spans" and handle_item[0].current is not None:
                        handle_item[0].current.set_highlighted_spans(highlighted_ids)
                if on_mouse_hover_row is not None:
                    on_mouse_hover_row(row_id, row_idx, modkeys)

            # Configured fields first, then source columns when requested or when no field is configured
            inferred = (
                [
                    {
                        "key": c["name"],
                        "name": c["name"],
                        "kind": "boolean" if "bool" in c.type.lower() else "text",
                        "editable": description.capabilities.edit,
                        "filterable": not c.normalized and c.source_filter is not False,
                    }
                    for c in description.columns
                ]
                if description
                else []
            )
            configured = {c["key"]: c for c in columns}
            inferred_by_key = {c["key"]: c for c in inferred}
            # A configured field absent from every row, eg a score no one has filled yet, is named by its key
            displayed_columns = (
                [{"name": c["key"], **inferred_by_key.get(c["key"], {}), **c} for c in columns]
                if len(columns)
                else inferred
            )
            if len(columns) and include_unconfigured_columns:
                displayed_columns.extend([{**c, "editable": False} for c in inferred if c["key"] not in configured])
            for column in displayed_columns:
                column["editable"] = bool(
                    not read_only and column.get("editable") and description and description.capabilities.edit
                )
            source_ast = None
            if is_dataframe and description is not None and source_requery:
                try:
                    source_ast = parse_table_filters(
                        {
                            **description,
                            "columns": [c for c in description.columns if c.source_filter is not False],
                        },
                        filters,
                    )
                except BaseException:
                    source_ast = None
            query_changed = is_dataframe and str(source_ast) != str(data.sourceFilter)
            displayed_source = source or view.previousRowSource
            error = view.filterError or view.error
            toolbar = [
                item
                for item in [
                    div(
                        f"{source.rowCount} rows shown"
                        + (", limit reached" if source.rowCount == description.get("row_limit") else "")
                    )
                    if source and description.get("row_limit") is not None
                    else None,
                    ToggleButtonGroup(
                        *[
                            Button(
                                "All" if option is None else names[option][:1].upper() + names[option][1:],
                                value="all" if option is None else str(option),
                                title=f"Rows of every listed {names[0]}"
                                if option is None
                                else f"Rows of the selected {names[option]}",
                                sx={"textTransform": "none"},
                            )
                            for option in options
                        ],
                        # The pressed choice is the followed ancestor, e.g. Patient when Stay was chosen and no stay
                        # is selected
                        value="all" if followed is None else str(followed),
                        # A click on the pressed choice gives no value and keeps it
                        on_change=lambda event, value: set_choice(
                            {"level": None if value == "all" else int(value), "picked": True}
                        )
                        if value
                        else None,
                        size="sm",
                        aria_label="Rows shown",
                    )
                    if len(options) > 1
                    else None,
                    Button(
                        "Apply source filters" if query_changed else "Query source",
                        on_click=query_source,
                        disabled=bool(view.loading or view.filterError),
                        color="neutral",
                        variant="outlined" if query_changed else "soft",
                        size="sm",
                        sx={"textTransform": "none"},
                    )
                    if source_requery and description and description.capabilities.source_filters
                    else None,
                    LoadingStatus(label=view.loading) if view.loading else None,
                    ErrorBanner(error=error) if error else None,
                ]
                if item is not None
            ]
            return StoreWidget(
                store=data_store,
                read_only=read_only,
                content=Stack(
                    Stack(
                        *toolbar,
                        direction="row",
                        spacing=1,
                        use_flex_gap=True,
                        sx={"p": 1, "alignItems": "center", "flexWrap": "wrap"},
                    )
                    if len(toolbar)
                    else None,
                    Table(
                        rows=[],
                        row_source=displayed_source,
                        primary_key=primary_key,
                        preserve_selection=description.capabilities.stable_identity is not False,
                        columns=displayed_columns,
                        filters=filters,
                        # Capped source previews sort the rows they loaded
                        sort=sort,
                        on_sort_change=set_sort,
                        highlighted_rows=highlighted,
                        suggestions=suggestions,
                        # Highlight nothing once another widget cleared the shared selection, e.g. a new parent row
                        selection={
                            **position,
                            "ranges": [{"row_idx": idx} for idx in position["ranges"]]
                            if len(selected_rows_snapshot["identities"])
                            else [],
                        },
                        multi_selection_mode="rows",
                        on_selection_change=handle_selection,
                        on_cell_change=handle_cell_change,
                        on_input_change=handle_input_change,
                        on_filters_change=lambda value, column: set_filters(value),
                        on_mouse_hover_row=handle_mouse_hover_row,
                        on_click_cell_content=on_click_cell_content,
                        auto_filter=False,
                        handle=table_ref,
                        style={
                            "flex": "1 1 auto",
                            "height": "auto",
                            "minHeight": 0,
                        },
                    )
                    if displayed_source
                    else None,
                    style={"height": "100%", "minHeight": 0},
                ),
                # Fill the parent, such as a dock panel, unless the given style says otherwise. The width also
                # keeps a flex parent, such as a documentation snippet, from shrinking the widget to nothing
                style={"width": "100%", "height": "100%", "minHeight": 0, **(style or {})},
            )

        return TableWidget()
