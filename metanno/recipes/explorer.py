from asyncio import Future
from os import PathLike
from typing import Any, Callable, Dict, List, Optional, Sequence, Union

from pret import component, create_store, use_store_snapshot
from pret.hooks import (
    RefType,
    use_effect,
    use_event_callback,
    use_imperative_handle,
    use_memo,
    use_ref,
    use_state,
)
from pret.react import div
from pret.render import Renderable
from pret_joy import (
    Button,
    ButtonGroup,
    Divider,
    FormControl,
    FormLabel,
    Input,
    Option,
    Select,
    Stack,
    Switch,
)
from typing_extensions import TypedDict

from metanno import AnnotatedText, Table


def use_awaitable_state(initial):
    """
    Like `use_state`, but the setter returns a Future/Coroutine that can be awaited
    to wait for the state to be applied and the component to re-render.
    """
    state, set_state = use_state(initial)
    resolver_ref = use_ref(None)

    def on_after_render():
        if resolver_ref.current is not None:
            resolver_ref.current(state)
            resolver_ref.current = None

    use_effect(on_after_render)

    def set_state_awaitable(value) -> Any:
        future = Future()
        # Short-circuit if the value is unchanged
        if value is state:
            future.set_result(value)
            return future
        set_state(value)
        resolver_ref.current = future.set_result
        return future

    return state, set_state_awaitable


def _build_columns(
    rows: List[Dict[str, Any]],
    hidden_keys: Sequence[str] = (),
    id_keys: Sequence[str] = (),
    editable_keys: Sequence[str] = (),
    categorical_keys: Sequence[str] = (),
    first_keys=(),
    column_names: Optional[Dict[str, str]] = None,
) -> List[Dict[str, Any]]:
    all_keys = list(
        {
            **dict.fromkeys(first_keys),
            **dict.fromkeys(k for row in rows for k in row),
        }
    )
    visible_keys = [k for k in all_keys if k not in hidden_keys]

    def non_null_values(key: str) -> List[Any]:
        return list(
            dict.fromkeys(
                val for row in rows[: min(1000, len(rows))] if (val := row.get(key)) is not None
            )
        )

    def infer_scalar_type(values: List[Any]) -> str:
        if not values:
            return "other"
        if all(isinstance(v, bool) for v in values):
            return "bool"
        if all(isinstance(v, int) and not isinstance(v, bool) for v in values):
            return "int"
        if all(isinstance(v, float) for v in values):
            return "float"
        if all(isinstance(v, str) for v in values):
            return "string"
        return "other"

    columns: List[Dict[str, Any]] = []
    for key in visible_keys:
        values = non_null_values(key)
        s_type = infer_scalar_type(values)

        if s_type == "other":
            metanno_type = "text"
        elif s_type == "bool":
            metanno_type = "boolean"
        elif s_type == "string":
            metanno_type = "text"
        elif s_type in ("int", "float"):
            metanno_type = "text"
        else:
            metanno_type = "text"

        if key in id_keys:
            metanno_type = "hyperlink"

        categories = None
        if key in categorical_keys:
            categories = list(dict.fromkeys(values))

        columns.append(
            {
                "key": key,
                "name": column_names.get(key, key) if column_names else key,
                "kind": metanno_type,
                "editable": key in editable_keys,
                "filterable": True,
                "candidates": categories,
            }
        )
    return columns


class TextWidgetHandle(TypedDict):
    """
    Imperative handle for interacting with a text annotation widget.
    """

    scroll_to_span: Callable[[str], None]
    set_doc_by_id: Callable[[Any], Future]
    get_doc_id: Callable[[], Any]
    set_highlighted_spans: Callable[[List[str]], None]


class TableWidgetHandle(TypedDict):
    """
    Imperative handle for interacting with a table widget.
    """

    scroll_to_row_id: Callable[[Any], None]
    scroll_to_row_idx: Callable[[int], None]
    set_filter: Callable[[str, Any], None]
    get_filters: Callable[[], Dict[str, Any]]
    clear_filters: Callable[[], None]
    set_highlighted: Callable[[List[Any]], None]


class FormWidgetHandle(TypedDict):
    """
    Imperative handle for interacting with a form widget.
    """

    get_row_id: Callable[[], Any]
    set_row_id: Callable[[Any], None]


class DatasetExplorerWidgetFactory:
    """
    The `DatasetExplorerWidgetFactory` is a helper widget factories for building
    interactive annotation and exploration applications using Metanno components. It
    manages data stores, shared state, and multiple synchronized views such as tables
    and annotated text views.

    Parameters
    ----------
    data : Dict[str, List[Dict[str, Any]]]
        Initial dataset as a mapping from store keys to list-like records.
    sync : Union[bool, str, PathLike] | None
        Whether and how to sync and persist the data:

        - False / None: no persistence (in-memory browser only).
        - True: data will be synced between browser and server,
          but not persisted on the server.
        - str or PathLike: path where the store should be saved.
          This we also enable syncing multiple notebook kernels or
          server together.
    """

    def __init__(
        self,
        data: Dict[str, List[Dict[str, Any]]],
        sync: Optional[Union[bool, str, PathLike]] = None,
    ):
        self.data = create_store(data, sync=sync)

    def create_table_widget(
        self,
        *,
        store_key,
        primary_key: str,
        hidden_keys: Sequence[str] = (),
        id_keys: Sequence[str] = (),
        editable_keys: Sequence[str] = (),
        categorical_keys: Sequence[str] = (),
        first_keys: Sequence[str] = (),
        column_names: Optional[Dict[str, str]] = None,
        style: Optional[Dict[str, Any]] = None,
        handle: RefType[TableWidgetHandle] = None,
        on_position_change: Optional[Callable[[Any, int, str, str, Any], None]] = None,
        on_mouse_hover_row: Optional[Callable[[Any, int, List[str]], None]] = None,
        on_click_cell_content: Optional[Callable[[Any, int, str, Any], None]] = None,
    ) -> Renderable:
        """
        Create a [`Table`][metanno.ui.Table] widget bound to a store entry.
        Column metadata is inferred from the underlying data, with optional
        callbacks for position changes, hover, and cell content clicks. An
        imperative handle can be exposed for scrolling and filtering.

        Parameters
        ----------
        store_key : Any
            Key pointing to the list-like store to render.
        primary_key : str
            Column name that uniquely identifies each row (primary key).
        hidden_keys : Sequence[str]
            Columns that should be omitted from the view (empty when omitted).
        id_keys : Sequence[str]
            Columns rendered as hyperlinks instead of plain text.
        editable_keys : Sequence[str]
            Columns that support inline editing.
        categorical_keys : Sequence[str]
            Columns with a fixed set of candidates for filtering and editing.
        first_keys : Sequence[str]
            Columns forced to appear first in the table.
        style : Dict[str, Any] | None
            Inline style overrides applied to the table container.
        handle : RefType[TableWidgetHandle] | None
            Imperative handle exposing helpers :

            - `scroll_to_row_id(row_id)`: Scroll to the row with the given primary key
            - `scroll_to_row_idx(row_idx)`: Scroll to the specified row index.
            - `set_filter(col, value)`: Apply a filter on the given column.
            - `get_filters()`: Retrieve the current filter mapping.
            - `clear_filters()`: Clear all active filters.
            - `set_highlighted(row_ids)`: Highlight the specified rows by their IDs.
        on_position_change : Callable[[Any, int, str, str, Any], None] | None
            Called when focus moves inside the table.

            - `row_id`: Primary key of the focused row.
            - `row_idx`: Index of the focused row.
            - `col`: Column key receiving focus.
            - `mode`: Interaction mode, such as `"EDIT"` or `"SELECT"`.
            - `cause`: What triggered the move (e.g. `"key"`, `"mouse"`).
        on_mouse_hover_row : Callable[[Any, int, List[str]], None] | None
            Called when the mouse hovers over a row.

            - `row_id`: Primary key for that row.
            - `row_idx`: Index of the row under the pointer.
            - `modkeys`: Pressed modifier keys during the hover.
        on_click_cell_content : Callable[[Any, int, str, Any], None] | None
            Called when hyperlink-like content inside a cell is clicked.

            - `row_id`: Primary key of the clicked row.
            - `row_idx`: Index of the clicked row.
            - `col`: Column key containing the clickable content.
            - `value`: Value associated with the clicked cell.

        Returns
        -------
        Renderable
            A Pret component instance rendering the configured table.
        """
        # Server-side prep
        data_store = self.data[store_key]
        columns = _build_columns(
            rows=data_store,
            hidden_keys=hidden_keys,
            id_keys=id_keys,
            editable_keys=editable_keys,
            categorical_keys=categorical_keys,
            first_keys=first_keys,
            column_names=column_names,
        )

        @component
        def TableWidget():
            data = use_store_snapshot(data_store)
            filters, set_filters = use_state({})
            highlighted, set_highlighted = use_state([])
            suggestions, set_suggestions = use_state([])
            table_ref = use_ref()

            use_imperative_handle(
                handle,
                lambda: {
                    "scroll_to_row_id": lambda key: table_ref.current.scroll_to_row_id(key),
                    "scroll_to_row_idx": lambda idx: table_ref.current.scroll_to_row_idx(idx),
                    "set_filter": lambda col, v: set_filters(lambda f: {**f, col: v}),
                    "get_filters": lambda: filters,
                    "clear_filters": lambda: set_filters({}),
                    "set_highlighted": set_highlighted,
                },
                [filters],
            )

            @use_event_callback
            def handle_cell_change(row_id, row_idx, col, new_value):
                data_store[row_idx][col] = new_value

            @use_event_callback
            def handle_input_change(row_id, row_idx, col, value, cause):
                value = value or ""
                candidates = next((c for c in columns if c["key"] == col), {}).get("candidates")
                if cause == "unmount":
                    set_suggestions(None)
                elif candidates is not None:
                    if cause == "mount":
                        set_suggestions(candidates)
                    elif cause == "type":
                        set_suggestions([c for c in candidates if value.lower() in c.lower()])

            @use_event_callback
            def handle_mouse_hover_row(row_id, row_idx, modkeys):
                if row_id is None:
                    set_highlighted([])
                    return
                set_highlighted([row_id])
                if on_mouse_hover_row:
                    on_mouse_hover_row(row_id, row_idx, modkeys)

            return Table(
                rows=data,
                primary_key=primary_key,
                columns=columns,
                filters=filters,
                suggestions=suggestions,
                highlighted_rows=highlighted,
                on_filters_change=lambda f, c: set_filters(f),
                on_input_change=handle_input_change,
                on_cell_change=handle_cell_change,
                on_position_change=on_position_change,
                on_mouse_hover_row=on_mouse_hover_row,
                on_click_cell_content=on_click_cell_content,
                auto_filter=True,
                style=style,
                handle=table_ref,
            )

        return TableWidget()

    def create_form_widget(
        self,
        *,
        store_key,
        primary_key: str,
        hidden_keys: Sequence[str] = (),
        editable_keys: Sequence[str] = (),
        categorical_keys: Sequence[str] = (),
        first_keys: Sequence[str] = (),
        style: Optional[Dict[str, Any]] = {},
        min_input_width: Optional[str] = None,
        handle: Optional[Any] = None,
    ) -> Renderable:
        """
        Render a single record from a store as a classic form with text, select,
        and boolean inputs. The current row can be changed via the imperative
        handle to keep multiple widgets in sync.

        Parameters
        ----------
        store_key : Any
            Key pointing to the collection to edit.
        primary_key : str
            Column name that uniquely identifies each row (primary key).
        hidden_keys : Sequence[str]
            Columns excluded from the form (empty when omitted).
        editable_keys : Sequence[str]
            Columns that can be edited, while others render as read-only.
        categorical_keys : Sequence[str]
            Columns with enumerated candidates rendered as selects.
        first_keys : Sequence[str]
            Columns forced to appear first in the form layout.
        style : Dict[str, Any] | None
            Inline style overrides for the wrapping container.
        min_input_width : str | None
            Minimum width applied to each input control.
        handle : RefType[FormWidgetHandle] | None
            Imperative handle exposing helpers :

            - `set_row_id(row_id)`: Switch to the row with the given primary key.
            - `get_row_id()`: Retrieve the currently active row ID.

        Returns
        -------
        Renderable
            A Pret component instance rendering the editable form.
        """
        data_store = self.data[store_key]
        columns = _build_columns(
            rows=data_store,
            hidden_keys=hidden_keys,
            editable_keys=editable_keys,
            categorical_keys=categorical_keys,
            first_keys=first_keys,
        )

        @component
        def FormWidget():
            row_idx, set_row_idx = use_state(0)

            current_idx = None
            if data_store and 0 <= row_idx < len(data_store):
                current_idx = row_idx
            elif data_store:
                current_idx = 0

            current_row = (
                use_store_snapshot(data_store[current_idx]) if current_idx is not None else None
            )

            use_imperative_handle(
                handle,
                lambda: {
                    "get_row_id": lambda: current_row.get(primary_key),
                    "set_row_id": lambda row_id: set_row_idx(
                        next(
                            (
                                i
                                for i, row in enumerate(data_store)
                                if str(row.get(primary_key)) == str(row_id)
                            ),
                            0,
                        )
                    ),
                },
            )

            @use_event_callback
            def handle_field_change(key, value):
                if current_row is None or current_idx is None:
                    return
                data_store[current_idx][key] = value

            def render_boolean_field(key: str, value: Any, editable: bool):
                def _on_change(event=None, checked=None, k=key):
                    current_val = None
                    if current_idx is not None and current_idx < len(data_store):
                        current_val = data_store[current_idx].get(k)
                    new_val = (
                        bool(checked)
                        if checked is not None
                        else getattr(getattr(event, "target", None), "checked", None)
                    )
                    if new_val is None:
                        new_val = not bool(current_val)
                    handle_field_change(k, bool(new_val))

                return FormControl(
                    FormLabel(key),
                    Switch(
                        checked=bool(value),
                        on_change=_on_change,
                        disabled=not editable,
                        size="sm",
                    ),
                    sx={
                        "minWidth": min_input_width,
                        "alignSelf": "flex-start",
                    },
                )

            def render_select_field(
                key: str, value: Any, editable: bool, candidates: Sequence[Any]
            ):
                options = [
                    Option(str(candidate), key=f"{key}-{i}", value=candidate)
                    for i, candidate in enumerate(candidates)
                ]

                return FormControl(
                    FormLabel(key),
                    Select(
                        *options,
                        value=value,
                        on_change=lambda event, val, k=key: handle_field_change(k, val),
                        disabled=not editable,
                        size="sm",
                    ),
                    sx={"minWidth": min_input_width},
                )

            def render_text_field(key: str, value: Any, editable: bool):
                def _on_change(event=None, k=key):
                    target = getattr(event, "target", None)
                    handle_field_change(k, getattr(target, "value", ""))

                return FormControl(
                    FormLabel(key),
                    Input(
                        value="" if value is None else value,
                        on_change=_on_change,
                        read_only=not editable,
                        disabled=not editable,
                        size="sm",
                    ),
                    sx={"minWidth": min_input_width},
                )

            def render_field(col: Dict[str, Any]):
                key = col["key"]
                value = current_row.get(key) if current_row is not None else None
                candidates = col.get("candidates")
                editable = col.get("editable", False)

                if candidates is not None:
                    return render_select_field(key, value, editable, candidates)
                if col.get("kind") == "boolean" or isinstance(value, bool):
                    return render_boolean_field(key, value, editable)
                return render_text_field(key, value, editable)

            if not current_row:
                return div("No data available", style=style)

            return Stack(
                *[render_field(col) for col in columns],
                direction="column",
                spacing=1,
                use_flex_gap=True,
                style=style,
            )

        return FormWidget()

    def create_text_widget(
        self,
        *,
        store_text_key: Any,
        store_spans_key: Optional[Any] = None,
        text_key: str,
        text_primary_key: str,
        spans_primary_key: str,
        begin_key: str = "begin",
        end_key: str = "end",
        style_key: str = "style",
        label_key: str = "label",
        labels: Dict[str, Dict[str, Any]] = {},
        style: Optional[Dict[str, Any]] = None,
        handle: Optional[Any] = None,
        on_change_text_id: Optional[Callable[[Any], None]] = None,
        on_hover_spans: Optional[Callable[[List[str], List[str]], None]] = None,
        on_click_span: Optional[Callable[[str, List[str]], None]] = None,
    ) -> Renderable:
        """
        Build a text annotation widget that pairs a text store with a spans store.
        Provides toolbar buttons for creating spans, keyboard navigation between
        documents, and callbacks for hover and click events.

        Parameters
        ----------
        store_text_key : Any
            Key pointing to the store containing documents.
        store_spans_key : Any
            Key pointing to the store containing span annotations. If `None`,
            an empty store is created and managed locally.
        text_key : str
            Field name holding the raw text to annotate.
        text_primary_key : str
            Field name that uniquely identifies each text document.
        spans_primary_key : str
            Field name that uniquely identifies each span.
        begin_key : str
            Field name for span start offsets.
        end_key : str
            Field name for span end offsets.
        style_key : str
            Field name for span styling configuration key.
        label_key : str
            Field name for span display label.
        labels : Dict[str, Dict[str, Any]]
            Mapping of label name to styling config (e.g. color, shortcut).
        style : Dict[str, Any] | None
            Inline style overrides for the wrapper and content panes.
        handle : RefType[TextWidgetHandle] | None
            Imperative handle exposing helpers:

            - `scroll_to_span(span_id)`: Scroll to the specified span.
            - `set_doc_by_id(doc_id)`: Switch to the document with the given ID.
            - `get_doc_id()`: Retrieve the currently active document ID.
            - `set_highlighted_spans(span_ids)`: Highlight the specified spans.
        on_change_text_id : Callable[[str], None] | None
            Called when navigation changes the active document.

            - `doc_id`: Identifier of the newly active document.
        on_hover_spans : Callable[[List[str], List[str], None] | None
            Called whenever spans are hovered.

            - `span_ids`: List of identifiers for the currently hovered spans.
            - `mod_keys`: Modifier keys pressed during the hover.
        on_click_span : Callable[[str, List[str]], None] | None
            Called when a span is clicked.

            - `span_id`: Span dictionary representing the clicked annotation.
            - `mod_keys`: Modifier keys pressed during the click.

        Returns
        -------
        Renderable
            A Pret component instance rendering the annotation interface.
        """
        text_store = self.data[store_text_key]
        spans_store = (
            self.data[store_spans_key] if store_spans_key is not None else create_store([])
        )

        @component
        def Toolbar(on_add_span=None, on_delete=None):
            btns = []
            for label, cfg in labels.items():
                sx = {"backgroundColor": cfg["color"], "color": "black", "p": "0 8px"}
                btns.append(
                    ButtonGroup(
                        Button(
                            label,
                            on_click=lambda event, lab=label: on_add_span(lab),
                            size="sm",
                            variant="soft",
                            sx=sx,
                        ),
                        Button(cfg["shortcut"], size="sm", variant="soft", sx=sx)
                        if cfg.get("shortcut")
                        else None,
                        sx={"display": "inline-block", "margin": "2px"},
                    )
                )
            return div(
                *btns,
                Button(
                    "⌫",
                    color="neutral",
                    size="sm",
                    on_click=on_delete,
                    sx={"p": "0 8px", "ml": 1},
                ),
                style={"marginBottom": "8px"},
            )

        @component
        def TextWidget():
            text_data = use_store_snapshot(text_store)
            span_data = use_store_snapshot(spans_store)

            doc_idx, set_doc_idx = use_awaitable_state(0)
            selected_ranges, set_selected_ranges = use_state([])
            highlighted, set_highlighted = use_state([])

            current_doc = text_data[doc_idx] if 0 <= doc_idx < len(text_data) else None
            current_doc_id = current_doc[text_primary_key] if current_doc else None

            text_ref = use_ref()

            def _set_doc_by_id(doc_id):
                for i, doc in enumerate(text_data):
                    if str(doc[text_primary_key]) == str(doc_id):
                        return set_doc_idx(i)

            use_imperative_handle(
                handle,
                lambda: {
                    "scroll_to_span": lambda key: text_ref.current.scroll_to_span(key),
                    "set_doc_by_id": _set_doc_by_id,
                    "get_doc_id": lambda: current_doc_id,
                    "set_highlighted_spans": set_highlighted,
                },
                [text_data, doc_idx],
            )

            def handle_mouse_hover_spans(span_ids: List[str]):
                set_highlighted(span_ids)
                if on_hover_spans:
                    on_hover_spans(span_ids)

            def filter_doc_spans():
                return [
                    {
                        "highlighted": span[spans_primary_key] in highlighted,
                        **span,
                    }
                    for span in span_data
                    if str(span.get(text_primary_key)) == str(current_doc_id)
                ]

            doc_spans = use_memo(
                filter_doc_spans,
                [span_data, current_doc_id, highlighted],
            )

            @use_event_callback
            def on_add_span(label):
                if not current_doc_id or not selected_ranges:
                    return
                for r in selected_ranges:
                    text_content = current_doc[text_key][r["begin"] : r["end"]]
                    spans_store.append(
                        {
                            "text": text_content,
                            spans_primary_key: f"{current_doc_id}-{r['begin']}-{r['end']}-{label}",
                            begin_key: r["begin"],
                            end_key: r["end"],
                            label_key: label,
                            text_primary_key: current_doc_id,
                        }
                    )
                set_selected_ranges([])

            @use_event_callback
            def on_delete():
                to_remove = []
                for span in reversed(spans_store):
                    if str(span[text_primary_key]) != str(current_doc_id):
                        continue
                    for r in selected_ranges:
                        if not (span["end"] <= r["begin"] or r["end"] <= span["begin"]):
                            to_remove.append(span)
                            break
                for item in to_remove:
                    spans_store.remove(item)
                if to_remove:
                    set_selected_ranges([])

            @use_event_callback
            def on_key_press(k, modkeys, selection):
                next_idx = None
                if k == "ArrowRight":
                    next_idx = (doc_idx + 1) % len(text_data)
                elif k == "ArrowLeft":
                    next_idx = (doc_idx - 1) % len(text_data)

                if next_idx is not None:
                    set_doc_idx(next_idx)
                    if on_change_text_id:
                        on_change_text_id(text_data[next_idx][text_primary_key])
                    return

                if k == "Backspace":
                    on_delete()
                else:
                    for label, cfg in labels.items():
                        if k == cfg.get("shortcut"):
                            on_add_span(label)
                            break

            if not current_doc:
                return div("No document selected")

            return div(
                Toolbar(
                    on_add_span=on_add_span,
                    on_delete=on_delete,
                ),
                Divider(),
                AnnotatedText(
                    text=current_doc[text_key],
                    spans=doc_spans,
                    annotation_styles=labels,
                    mouse_selection=selected_ranges,
                    primary_key=spans_primary_key,
                    begin_key=begin_key,
                    end_key=end_key,
                    style_key=style_key,
                    label_key=label_key,
                    on_key_press=on_key_press,
                    on_mouse_select=lambda r, m: set_selected_ranges(r),
                    on_mouse_hover_spans=handle_mouse_hover_spans,
                    on_click_span=on_click_span,
                    handle=text_ref,
                    style={"flex": 1, "overflow": "scroll", **(style or {})},
                ),
                style={
                    "display": "flex",
                    "flexDirection": "column",
                    "height": "100%",
                    **(style or {}),
                },
            )

        return TextWidget()
