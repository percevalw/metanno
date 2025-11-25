from os import PathLike
from typing import Any, Dict, List, Optional, Sequence, Union

from pret import component, create_store, use_store_snapshot
from pret.hooks import (
    use_event_callback,
    use_imperative_handle,
    use_memo,
    use_ref,
    use_state,
)
from pret.react import div
from pret.render import Renderable
from pret_joy import Button, ButtonGroup, Divider

from metanno import AnnotatedText, Table


def build_columns(
    rows: List[Dict[str, Any]],
    hidden_columns: Sequence[str] = (),
    id_columns: Sequence[str] = (),
    editable_columns: Sequence[str] = (),
    categorical_columns: Sequence[str] = (),
    first_columns=(),
) -> List[Dict[str, Any]]:
    all_keys = list(
        {
            **dict.fromkeys(first_columns),
            **dict.fromkeys(k for row in rows for k in row),
        }
    )
    visible_keys = [k for k in all_keys if k not in hidden_columns]

    def non_null_values(key: str) -> List[Any]:
        return list(
            dict.fromkeys(
                val for row in rows[:1000] if (val := row.get(key)) is not None
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

        if key in id_columns:
            metanno_type = "hyperlink"

        categories = None
        if key in categorical_columns:
            categories = list(dict.fromkeys(values))

        columns.append(
            {
                "key": key,
                "name": key,
                "kind": metanno_type,
                "editable": key in editable_columns,
                "filterable": True,
                "candidates": categories,
            }
        )
    return columns


class DatasetExplorerWidgetFactory:
    """
    The `DatasetExplorerWidgetFactory` is a helper widget factories for building
    interactive annotation and exploration applications using Metanno components. It
    manages data stores, shared state, and multiple synchronized views such as tables
    and annotated text views.

    Parameters
    ----------
    data : Any
        Initial data to populate the application. Typically, a list of dictionaries
        or another data structure supported by
        [`create_store`][pret.store.create_store].
    sync : Optional[Union[bool, str, PathLike]], default=None
        Whether and how to sync and persist the data:

        - False / None: no persistence (in-memory browser only).
        - True: data will be synced between browser and server,
          but not persisted on the server.
        - str or PathLike: path where the store should be saved.
          This we also enable syncing multiple notebook kernels or
          server together.
    """

    def __init__(self, data: Any, sync: Optional[Union[bool, str, PathLike]] = None):
        self.data = create_store(data, sync=sync)

    def create_table_widget(
        self,
        store_key,
        pkey_column: str,
        hidden_columns: Sequence[str] = (),
        id_columns: Sequence[str] = (),
        editable_columns: Sequence[str] = (),
        categorical_columns: Sequence[str] = (),
        first_columns: Sequence[str] = (),
        # Widget args
        style: Optional[Dict[str, Any]] = None,
        handle=None,
        on_position_change=None,
        on_mouse_hover_row=None,
    ) -> Renderable:
        # Server-side prep
        data_store = self.data[store_key]
        columns = build_columns(
            rows=data_store,
            hidden_columns=hidden_columns,
            id_columns=id_columns,
            editable_columns=editable_columns,
            categorical_columns=categorical_columns,
            first_columns=first_columns,
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
                    "scroll_to_row": lambda idx: table_ref.current.scroll_to_row(idx),
                    "scroll_to_key": lambda key: (
                        table_ref.current.scroll_to_row(
                            next(
                                (
                                    i
                                    for i, row in enumerate(data)
                                    if str(row.get(pkey_column)) == str(key)
                                ),
                                None,
                            )
                        )
                    ),
                    "set_filter": lambda col, val: set_filters(
                        lambda p: {**p, col: val}
                    ),
                    "get_filters": lambda: filters,
                    "clear_filters": lambda: set_filters({}),
                    "set_highlighted": lambda row_ids: set_highlighted(row_ids),
                },
                [filters],
            )

            @use_event_callback
            def handle_cell_change(row_idx, col, new_value):
                data_store[row_idx][col] = new_value

            @use_event_callback
            def handle_position_change(row_idx, col, mode, cause):
                if row_idx is not None and on_position_change:
                    row_id = data[row_idx].get(pkey_column)
                    on_position_change(row_id, row_idx, col, mode, cause)

            @use_event_callback
            def handle_input_change(row_idx, col, value, cause):
                value = value or ""
                candidates = next((c for c in columns if c["key"] == col), {}).get(
                    "candidates"
                )
                if cause == "unmount":
                    set_suggestions(None)
                elif candidates is not None:
                    if cause == "mount":
                        set_suggestions(candidates)
                    elif cause == "type":
                        set_suggestions(
                            [c for c in candidates if value.lower() in c.lower()]
                        )

            @use_event_callback
            def handle_mouse_hover_row(row_idx, modkeys):
                if row_idx is not None:
                    row_id = data[row_idx].get(pkey_column)
                    set_highlighted([row_id])
                    on_mouse_hover_row(row_idx, row_id, modkeys)
                else:
                    set_highlighted([])

            return Table(
                rows=data,
                row_key=pkey_column,
                columns=columns,
                filters=filters,
                suggestions=suggestions,
                highlighted_rows=highlighted,
                on_filters_change=lambda f, c: set_filters(f),
                on_input_change=handle_input_change,
                on_cell_change=handle_cell_change,
                on_position_change=handle_position_change,
                on_mouse_hover_row=handle_mouse_hover_row,
                auto_filter=True,
                style=style,
                handle=table_ref,
            )

        return TableWidget()

    def create_text_widget(
        self,
        store_text_key: Any,
        store_spans_key: Any,
        text_column: str,
        text_pkey_column: str,
        spans_pkey_column: str,
        labels: Dict[str, Dict[str, Any]] = {},
        style: Optional[Dict[str, Any]] = None,
        handle=None,
        on_change_text_id=None,
        on_hover_spans=None,
    ) -> Renderable:
        text_store = self.data[store_text_key]
        spans_store = self.data[store_spans_key]

        @component
        def Toolbar(on_add_span=None, on_delete=None):
            btns = []
            for label, cfg in labels.items():
                sx = {"backgroundColor": cfg["color"], "color": "black", "p": "0 8px"}
                btns.append(
                    ButtonGroup(
                        Button(
                            label,
                            on_click=lambda lab=label: on_add_span(lab),
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

            doc_idx, set_doc_idx = use_state(0)
            selected_ranges, set_selected_ranges = use_state([])
            highlighted_spans, set_highlighted_spans = use_state([])

            current_doc = text_data[doc_idx] if 0 <= doc_idx < len(text_data) else None
            current_doc_id = current_doc[text_pkey_column] if current_doc else None

            text_ref = use_ref()

            use_imperative_handle(
                handle,
                lambda: {
                    "scroll_to_span": lambda s: text_ref.current.scroll_to_span(s),
                    "set_document_by_id": lambda doc_id: _set_doc_by_id(doc_id),
                    "get_current_doc_id": lambda: current_doc_id,
                    "set_highlighted_spans": lambda ids: set_highlighted_spans(ids),
                },
                [text_data, doc_idx],
            )

            def _set_doc_by_id(doc_id):
                # Strict type comparison might fail if CSV loads as strings vs ints
                for i, doc in enumerate(text_data):
                    if str(doc[text_pkey_column]) == str(doc_id):
                        set_doc_idx(i)
                        return

            def handle_mouse_hover_spans(span_ids: List[str]):
                set_highlighted_spans(span_ids)
                if on_hover_spans:
                    on_hover_spans(span_ids)

            def filter_doc_spans():
                return [
                    {
                        **span,
                        "highlighted": span[spans_pkey_column] in highlighted_spans,
                    }
                    for span in span_data
                    if str(span.get(text_pkey_column)) == str(current_doc_id)
                ]

            doc_spans = use_memo(
                filter_doc_spans, [span_data, current_doc_id, highlighted_spans]
            )

            @use_event_callback
            def on_add_span(label):
                if not current_doc_id or not selected_ranges:
                    return
                for r in selected_ranges:
                    text_content = current_doc[text_column][r["begin"] : r["end"]]
                    spans_store.append(
                        {
                            "id": f"{current_doc_id}-{r['begin']}-{r['end']}-{label}",
                            "begin": r["begin"],
                            "end": r["end"],
                            "label": label,
                            "text": text_content,
                            text_pkey_column: current_doc_id,
                            spans_pkey_column: f"{current_doc_id}-{r['begin']}-{label}",
                        }
                    )
                set_selected_ranges([])

            @use_event_callback
            def on_delete():
                to_remove = []
                for span in reversed(spans_store):
                    if str(span[text_pkey_column]) != str(current_doc_id):
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
                        on_change_text_id(text_data[next_idx][text_pkey_column])
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
                    text=current_doc[text_column],
                    spans=doc_spans,
                    annotation_styles=labels,
                    on_key_press=on_key_press,
                    on_mouse_select=lambda r, m: set_selected_ranges(r),
                    mouse_selection=selected_ranges,
                    on_mouse_hover_spans=handle_mouse_hover_spans,
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
