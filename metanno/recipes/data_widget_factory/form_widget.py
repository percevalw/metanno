"""
Form rendering used by DataWidgetFactory
"""

from typing import Any, Awaitable, Callable, Dict, Optional, Sequence

from pret import component, create_store, use_store_snapshot
from pret.hooks import use_effect, use_event_callback, use_imperative_handle, use_ref
from pret.react import div
from pret.render import Renderable
from pret_joy import Button, Stack
from typing_extensions import TypedDict

from .fields import FieldSpec, field_state, render_field
from .widget_data import ErrorBanner, LoadingStatus, StoreWidget, edit_rows, get_parent_selection, use_selected_rows


class FormWidgetHandle(TypedDict):
    """
    Imperative handle for interacting with a form widget.
    """

    get_row_idx: Callable[[], Awaitable[Optional[int]]]
    set_row_idx: Callable[[int], Awaitable[None]]


class FormWidgets:
    """
    Record forms of DataWidgetFactory, which provides the Store, row selections and widget handles
    """

    def create_form_widget(
        self,
        *,
        store_key,
        primary_key: str,
        fields: Sequence[FieldSpec],
        style: Optional[Dict[str, Any]] = None,
        min_input_width: Optional[str] = None,
        add_navigation_buttons: bool = False,
        allow_delete: bool = False,
        handle: Optional[Any] = None,
    ) -> Renderable:
        """
        Render a single record from a store as a classic form with text, select,
        and boolean inputs. The current row can be changed via the imperative
        handle to keep multiple widgets in sync. When multiple rows are selected
        in a linked table, fields show mixed values and edits are applied to
        every selected row.

        Parameters
        ----------
        store_key : Any
            Key pointing to the collection to edit
        primary_key : str
            Field name that uniquely identifies each row (primary key)
        fields : Sequence[FieldSpec]
            Field metadata used for rendering and editing:

            - `key`: Field key
            - `name`: Field display name
            - `kind`: Field data kind:

                - `"text"`: single-line text input
                - `"select"`: dropdown select input
                - `"autocomplete"`: autocomplete text input
                - `"radio"`: radio button group
                - `"boolean"`: checkbox input

            - `editable`: If False, the field will be read-only
            - `options`: If present, a dropdown/autocomplete/radio will be used

            An empty list shows every column of a DataFrame, editable when the DataFrame is
        style : Dict[str, Any] | None
            Inline style overrides for the wrapping container, which has an 8px padding by default
        min_input_width : str | None
            Minimum width applied to each input control
        add_navigation_buttons : bool
            Whether to display previous/next navigation buttons
        allow_delete : bool
            Show a button that deletes the selected rows in one Store action
        handle : RefType[FormWidgetHandle] | None
            Imperative handle exposing helpers:

            - `set_row_idx(row_idx)`: Select the row at this position among all rows
            - `get_row_idx()`: Retrieve the position of the current row among all rows

        Returns
        -------
        Renderable
            A Pret component instance rendering the editable form
        """
        store_key = str(store_key)
        path_parts = store_key.split(".")
        empty_store = create_store([])
        fields = list(fields)
        style = {"padding": "8px", "boxSizing": "border-box", **(style or {})}

        self.ensure_selected_rows(store_key)

        # Register the handle so other widgets can move this form to their selected row
        handle = handle or use_ref()
        self.handles.setdefault(store_key, []).append([handle, "form"])
        self.register_pkey(store_key, primary_key)
        selected_rows_store = self.selected_rows[store_key]
        selected_rows_by_store = self.selected_rows
        data_store = self.data
        read_only = self.read_only
        deep_get_store, primary_keys = self.deep_get_store, self.primary_keys
        handles = self.handles
        select_rows, _ = self.make_select_rows()
        on_mount = self.register_widget_dataframe(store_key)

        @component
        def FormWidget():
            parent_ids = get_parent_selection(path_parts, selected_rows_by_store, use_store_snapshot)
            data = deep_get_store(data_store, path_parts, parent_ids, primary_keys) or empty_store
            if on_mount is not None:
                use_effect(on_mount, [])
            selected_rows_snapshot = use_store_snapshot(selected_rows_store)
            rows, view = use_selected_rows(data, primary_key, selected_rows_snapshot["identities"])
            current_row = rows[0] if len(rows) else None

            def get_table_handle():
                for other in handles.get(store_key, []):
                    if other[1] == "table" and other[0].current is not None:
                        return other[0]
                return None

            async def select_row_at(idx):
                """
                Select the row at a position of the unfiltered rows, through a table showing them if any
                """
                source = view.rowSource
                if source is None or not source.rowCount:
                    return
                position = idx % source.rowCount
                # Transcrypt compiles (await x)[0] to await x[0], so index the awaited rows separately
                rows = await source.getRows(position, position + 1, __new__(AbortController()).signal)  # noqa: F821
                row = rows[0]
                table_handle = get_table_handle()
                if table_handle is not None:
                    await table_handle.current.select_row_id(row[primary_key])
                else:
                    select_rows(store_key, [row], handle, "key")

            async def nav(delta):
                if current_row is None:
                    return
                table_handle = get_table_handle()
                if table_handle is not None:
                    row_id = await table_handle.current.get_adjacent_row_id(current_row[primary_key], delta)
                    if row_id is not None:
                        await table_handle.current.select_row_id(row_id)
                    return
                idx = await view.rowSource.findRowIndex(current_row[primary_key], __new__(AbortController()).signal)  # noqa: F821
                await select_row_at(idx + delta)

            async def get_row_idx():
                if current_row is None or view.rowSource is None:
                    return None
                return await view.rowSource.findRowIndex(current_row[primary_key], __new__(AbortController()).signal)  # noqa: F821

            use_imperative_handle(
                handle,
                lambda: {
                    "get_row_idx": get_row_idx,
                    "set_row_idx": select_row_at,
                },
            )

            @use_event_callback
            async def handle_field_change(key, value):
                await edit_rows(data, primary_key, rows, {key: value}, read_only=read_only)

            @use_event_callback
            async def delete_selected(event=None):
                await edit_rows(data, primary_key, rows, remove=True, read_only=read_only)
                select_rows(store_key, [], handle, "key")

            def render_form_field(field: Dict[str, Any]):
                state = field_state(rows, field["key"])
                return render_field(
                    current_row,
                    {
                        **field,
                        "editable": bool(
                            not read_only
                            and field.get("editable")
                            and view.description
                            and view.description.capabilities.edit
                        ),
                    },
                    handle_field_change,
                    min_input_width,
                    value=state["value"],
                    is_mixed=state["is_mixed"],
                    use_explicit_value=True,
                )

            if not current_row:
                return div(
                    (view.error or LoadingStatus(label=view.loading))
                    if view.error or view.loading
                    else "No data selected",
                    style=style,
                )

            navigation_controls = None
            if add_navigation_buttons:
                navigation_controls = Stack(
                    Button(
                        "← Previous",
                        on_click=lambda e: nav(-1),
                        size="sm",
                        variant="soft",
                        sx={"flex": 1},
                    ),
                    Button(
                        "Next →",
                        on_click=lambda e: nav(1),
                        size="sm",
                        variant="soft",
                        sx={"flex": 1},
                    ),
                    direction="row",
                    spacing=1,
                    use_flex_gap=True,
                    sx={"alignItems": "center", "gridArea": "nav"},
                )

            return StoreWidget(
                store=data_store,
                read_only=read_only,
                content=Stack(
                    navigation_controls,
                    ErrorBanner(error=view.error) if view.error else None,
                    *[
                        render_form_field(f)
                        for f in (
                            fields
                            if len(fields)
                            # Without configured fields, show the DataFrame columns as the table does
                            else [
                                {
                                    "key": c["name"],
                                    "name": c["name"],
                                    "kind": "boolean" if "bool" in c.type.lower() else "text",
                                    "editable": True,
                                }
                                for c in view.description.columns
                            ]
                        )
                    ],
                    Button(
                        f"Delete {len(rows)} selected",
                        on_click=delete_selected,
                        color="danger",
                        disabled=not rows,
                    )
                    if allow_delete and not read_only and view.description.capabilities.edit
                    else None,
                    direction="column",
                    spacing=1,
                    use_flex_gap=True,
                    style=style,
                    key=str([row[primary_key] for row in rows]),
                ),
            )

        return FormWidget()
