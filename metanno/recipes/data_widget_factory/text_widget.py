"""
Text and span rendering used by DataWidgetFactory
"""

from typing import Any, Awaitable, Callable, Dict, List, Optional, Sequence, Tuple

from pret import DataFrame, component, create_store, use_store_snapshot
from pret.hooks import use_effect, use_event_callback, use_imperative_handle, use_memo, use_ref, use_state
from pret.react import div
from pret.render import Renderable
from typing_extensions import Literal, TypedDict

from metanno import AnnotatedText

from .fields import FieldSpec
from .span_toolbar import SpanToolbar
from .widget_data import (
    LoadingStatus,
    Ref,
    StoreWidget,
    edit_rows,
    get_first_selected_row_idx,
    get_parent_selection,
    normalize_row_indices,
    use_selected_rows,
)


class TextWidgetHandle(TypedDict):
    """
    Imperative handle for interacting with a text annotation widget.
    """

    scroll_to_span: Callable[[str], None]
    set_doc_idx: Callable[[int], Awaitable[None]]
    get_doc_idx: Callable[[], Awaitable[Optional[int]]]
    set_highlighted_spans: Callable[[List[str]], None]
    set_selected_span: Callable[[str], None]


class TextWidgets:
    """
    Text annotation widgets of DataWidgetFactory, which provides the Store, row selections and widget handles
    """

    def create_text_widget(
        self,
        *,
        store_text_key: Any,
        store_spans_key: Optional[Any] = None,
        text_key: str,
        text_primary_key: str,
        spans_primary_key: Optional[str] = None,
        fields: Sequence[FieldSpec] = (),
        spans_foreign_key: Optional[str] = None,
        begin_key: str = "begin",
        end_key: str = "end",
        style_key: str = "style",
        label_key: str = "label",
        label_formatter: Optional[Callable[[Dict[str, Any]], str]] = None,
        button_key: str = "label",
        labels: Optional[Dict[str, Dict[str, Any]]] = None,
        style: Optional[Dict[str, Any]] = None,
        handle: Optional[Any] = None,
        on_change_text_id: Optional[Callable[[Any], None]] = None,
        on_add_span: Optional[Callable[[List[str]], None]] = None,
        on_hover_spans: Optional[Callable[[List[str], List[str]], None]] = None,
        on_click_span: Optional[Callable[[str, List[str]], None]] = None,
        on_select_text: Optional[Callable[[Any, List[Dict[str, int]], str], None]] = None,
        docs_mode: Literal["lead", "selected", "all"] = "lead",
        container_renderer: Optional[Callable[[Dict[str, Any], Renderable, Optional[Renderable]], Renderable]] = None,
    ) -> Tuple[Renderable, Renderable]:
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
            an empty store is created and managed locally, eg to only show the text of DataFrame rows.
        text_key : str
            Field name holding the raw text to annotate.
        text_primary_key : str
            Field name that uniquely identifies each text document.
        spans_primary_key : str | None
            Field name that uniquely identifies each span, required with `store_spans_key`.
        fields : Sequence[FieldSpec]
            Field metadata for span fields, used in the inline editor.
        begin_key : str
            Field name for span start offsets.
        end_key : str
            Field name for span end offsets.
        style_key : str
            Field name for span styling configuration key. Spans without it use the style of their
            `button_key` value when it is a key of `labels`, otherwise the first label.
        label_key : str
            Field name for span display label.
        label_formatter : Callable[[Dict[str, Any]], str] | None
            Optional function used to compute the rendered label text for each span.
            It receives the full span dictionary and should return a string.

            If left as None, the uppercased `label_key` field will be used.
        button_key : str
            Field name that annotation buttons will update.
        labels : Dict[str, Dict[str, Any]]
            Mapping of label name to styling config (e.g. color, shortcut).
        style : Dict[str, Any] | None
            Inline style overrides for the text widget wrapper and content panes.
        handle : RefType[TextWidgetHandle] | None
            Imperative handle exposing helpers:

            - `scroll_to_span(span_id)`: Scroll to the specified span.
            - `set_doc_idx(doc_idx)`: Select the document at this position among all documents.
            - `get_doc_idx()`: Retrieve the position of the active document among all documents.
            - `set_highlighted_spans(span_ids)`: Highlight the specified spans.
            - `set_selected_span(span_id)`: Set the currently selected span.
        on_change_text_id : Callable[[Any], None] | None
            Called when navigation changes the active document.

            - `doc_id`: Identifier of the newly active document.
        on_add_span : Callable[[List[str]], None] | None
            Called after new spans are created from the current selection.

            - `span_ids`: List of identifiers for the newly created spans.
        on_hover_spans : Callable[[List[str], List[str]], None] | None
            Called whenever spans are hovered.

            - `span_ids`: List of identifiers for the currently hovered spans.
            - `mod_keys`: Modifier keys pressed during the hover.
        on_click_span : Callable[[str, List[str]], None] | None
            Called when a span is clicked.

            - `span_id`: Identifier of the clicked span.
            - `mod_keys`: Modifier keys pressed during the click.
        on_select_text : Callable[[Any, List[Dict[str, int]], str], None] | None
            Called when the text selected in a document changes, including when it is cleared.

            - `doc_id`: Identifier of the document.
            - `ranges`: Selected `{"begin", "end"}` offsets, empty when the selection is cleared.
            - `text`: Text of the first range, empty when the selection is cleared.
        docs_mode : Literal["lead", "selected", "all"]
            Controls which documents are displayed:

            - `"lead"`: show only the lead selected document.
            - `"selected"`: show every selected document.
            - `"all"`: show every document from the current store. Documents of a DataFrame that is the
              child of a DataRelation show only the documents of the selected parent row.
        container_renderer : Callable[[Dict[str, Any], Renderable, Optional[Renderable]], Renderable] | None
            Optional callback used to wrap each rendered document.
            It receives `(row, component, shared_toolbar)` and may also accept
            optional keyword arguments `note_idx` and `note_count`.
            It should return a renderable.
            By default, documents are wrapped as `div(component)`.
        Returns
        -------
        Tuple[Renderable, Renderable]
            A pair of Pret components: the toolbar widget and the text widget.
        """  # noqa: E501
        store_text_key = str(store_text_key)
        root_text_key = store_text_key.split(".")[0]
        root_text_store = self.data[root_text_key]
        is_dataframe = isinstance(root_text_store, DataFrame)
        on_mount = self.mount_dataframes if is_dataframe else None
        if is_dataframe:
            if store_spans_key is not None and not isinstance(self.data[str(store_spans_key)], DataFrame):
                raise ValueError("The spans of a DataFrame text widget must be a DataFrame")
            self.register_dataframe(root_text_key)
            if store_spans_key is not None:
                self.register_dataframe(str(store_spans_key))
        spans_foreign_key = spans_foreign_key or text_primary_key
        # DataFrame documents of a relation child follow the selected parent row in "all" mode
        parent_relation = (
            next((r for r in self.relations if r["child"] == root_text_key), None) if is_dataframe else None
        )
        if parent_relation is not None:
            self.ensure_selected_rows(parent_relation["parent"])
        parent_selection_store = (
            self.selected_rows[parent_relation["parent"]]
            if parent_relation is not None and docs_mode == "all"
            else create_store({"identities": [], "row": None})
        )

        text_path_parts = store_text_key.split(".")
        store_spans_key = str(store_spans_key) if store_spans_key is not None else None
        spans_path_parts = store_spans_key.split(".") if store_spans_key is not None else None
        local_spans_store = create_store([]) if store_spans_key is None else None
        empty_store = create_store([])
        # Spans of a nested list such as notes.entities already belong to the selected document
        filter_spans = spans_path_parts is not None and len(spans_path_parts) == 1
        labels = labels or {}
        default_style = next(iter(labels), "annotation")
        button_field_name = "Type"
        for field in fields:
            if field["key"] == button_field_name:
                button_field_name = field.get("name", button_field_name)
                break
        span_fields = [col for col in fields if col.get("editable")]
        span_field_by_key = {col.get("key"): col for col in span_fields}

        # Register the handle so tables of the documents and spans can scroll this widget
        handle = handle or use_ref()
        handles = self.handles
        handles.setdefault(store_text_key, []).append([handle, "text"])
        if store_spans_key is not None:
            handles.setdefault(store_spans_key, []).append([handle, "spans"])
        self.register_pkey(store_text_key, text_primary_key)
        selected_rows_by_store = self.selected_rows
        selected_doc_rows_store = selected_rows_by_store[store_text_key]
        data_store = self.data
        read_only = self.read_only
        deep_get_store, primary_keys = self.deep_get_store, self.primary_keys
        empty_selected_rows_store = create_store({"identities": [], "row": None})
        if store_spans_key is not None:
            self.register_pkey(store_spans_key, spans_primary_key)
        selected_span_rows_store = (
            selected_rows_by_store[store_spans_key] if store_spans_key is not None else empty_selected_rows_store
        )
        docs_mode = docs_mode or "lead"
        if docs_mode not in ("lead", "selected", "all"):
            raise ValueError(f"Unsupported docs_mode={docs_mode!r}. Expected one of: 'lead', 'selected', 'all'.")

        def default_container_renderer(
            row: Dict[str, Any],
            component: Renderable,
            toolbar: Optional[Renderable],
            key,
            note_idx,
            note_count,
        ) -> Renderable:
            return div(component, key=key)

        container_renderer = container_renderer or default_container_renderer
        select_rows, _ = self.make_select_rows()

        toolbar_state = create_store({"move_mode": False})
        toolbar_actions = use_ref(None)

        def build_field_state_by_key(
            selected_spans: Sequence[Dict[str, Any]],
            fallback_span: Optional[Dict[str, Any]],
        ) -> Dict[str, Dict[str, Any]]:
            """
            Compute shared values and mixed flags for the span toolbar inputs
            """
            field_state = {}
            for col in span_fields:
                key = col.get("key")
                if key is None:
                    continue
                if len(selected_spans) > 0:
                    first_value = selected_spans[0].get(key)
                    is_mixed = any((span.get(key)) != first_value for span in selected_spans[1:])
                    if is_mixed:
                        value = fallback_span.get(key) if fallback_span is not None else first_value
                    else:
                        value = first_value
                else:
                    value = fallback_span.get(key) if fallback_span is not None else None
                    is_mixed = False
                field_state[key] = {"value": value, "is_mixed": is_mixed}
            return field_state

        @component
        def ToolbarWidget():
            toolbar_snapshot = use_store_snapshot(toolbar_state)
            selected_span_rows_snapshot = use_store_snapshot(selected_span_rows_store)

            parent_ids = (
                get_parent_selection(spans_path_parts, selected_rows_by_store, use_store_snapshot)
                if spans_path_parts is not None
                else {}
            )
            toolbar_spans_store = (
                deep_get_store(data_store, spans_path_parts, parent_ids, primary_keys) or empty_store
                if spans_path_parts is not None
                else local_spans_store
            )
            if on_mount is not None:
                use_effect(on_mount, [])
            selected_spans, toolbar_view = use_selected_rows(
                toolbar_spans_store, spans_primary_key, selected_span_rows_snapshot["identities"]
            )
            selected_span = selected_spans[0] if len(selected_spans) > 0 else None
            field_state_by_key = build_field_state_by_key(selected_spans, selected_span)

            if read_only or not toolbar_view.description or not toolbar_view.description.capabilities.edit:
                return None
            return SpanToolbar(
                labels=labels,
                button_key=button_key,
                button_field_name=button_field_name,
                on_add_span_click=lambda label: toolbar_actions.current["add"](label),
                on_delete=lambda event=None: toolbar_actions.current["delete"](),
                selected_span=selected_span,
                selected_count=len(selected_spans),
                on_update_span=lambda key, value: toolbar_actions.current["update"](key, value),
                span_fields=span_fields,
                field_state_by_key=field_state_by_key,
                move_mode=toolbar_snapshot.get("move_mode", False),
                on_toggle_move=lambda event=None: toolbar_actions.current["move"](),
                key=str([span[spans_primary_key] for span in selected_spans]),
            )

        @component
        def TextWidget():
            parent_ids = get_parent_selection(text_path_parts, selected_rows_by_store, use_store_snapshot)
            if spans_path_parts is not None:
                spans_selection = get_parent_selection(spans_path_parts, selected_rows_by_store, use_store_snapshot)
                # Browser code cannot iterate a dict, walk the parent paths instead
                for idx in range(1, len(spans_path_parts)):
                    parent_path = ".".join(spans_path_parts[:idx])
                    if parent_path not in parent_ids:
                        parent_ids[parent_path] = spans_selection[parent_path]
            text_context_key = (
                "|".join(
                    f"{'.'.join(text_path_parts[:i])}:{parent_ids.get('.'.join(text_path_parts[:i]))}"
                    for i in range(1, len(text_path_parts))
                )
                or "root"
            )

            text_store = deep_get_store(data_store, text_path_parts, parent_ids, primary_keys) or empty_store
            spans_store = (
                deep_get_store(data_store, spans_path_parts, parent_ids, primary_keys) or empty_store
                if spans_path_parts is not None
                else local_spans_store
            )
            if on_mount is not None:
                use_effect(on_mount, [])
            selected_doc_rows_snapshot = use_store_snapshot(selected_doc_rows_store)
            selected_span_rows_snapshot = use_store_snapshot(selected_span_rows_store)
            selected_doc_ids = selected_doc_rows_snapshot["identities"]
            parent_selection = use_store_snapshot(parent_selection_store)
            docs_filter = None
            if parent_relation is not None and docs_mode == "all":
                # The parent column is read from the parent row, or from its ID when it is the primary key
                parent_row = parent_selection["row"]
                parent_ids = parent_selection["identities"]
                parent_column = parent_relation["parent_column"]
                parent_value = None
                if parent_row:
                    parent_value = parent_row[parent_column]
                elif len(parent_ids) and primary_keys.get(parent_relation["parent"]) == parent_column:
                    parent_value = parent_ids[0]
                docs_filter = {
                    "kind": "predicate",
                    "column": parent_relation["child_column"],
                    "operator": "eq",
                    "value": parent_value,
                }
            text_data, text_view = use_selected_rows(
                text_store,
                text_primary_key,
                None if docs_mode == "all" else selected_doc_ids[:1] if docs_mode == "lead" else selected_doc_ids,
                docs_filter,
            )
            span_data, span_view = use_selected_rows(
                spans_store,
                spans_primary_key,
                None,
                {
                    "kind": "predicate",
                    "column": spans_foreign_key,
                    "operator": "in",
                    "value": [row[text_primary_key] for row in text_data],
                }
                if filter_spans
                else None,
            )
            # Positions of the selected documents and spans in the loaded rows below
            selected_doc_rows_snapshot = {
                "rows": [idx for idx, row in enumerate(text_data) if row[text_primary_key] in selected_doc_ids]
            }
            selected_span_rows_snapshot = {
                "rows": [
                    idx
                    for idx, row in enumerate(span_data)
                    if row[spans_primary_key] in selected_span_rows_snapshot["identities"]
                ]
            }
            toolbar_snapshot = use_store_snapshot(toolbar_state)
            selected_ranges_by_doc, set_selected_ranges_by_doc = use_state({})
            highlighted, set_highlighted = use_state([])
            active_doc_id, set_active_doc_id = use_state(None)
            text_ref = use_ref()
            text_refs_by_doc = use_ref({})
            pending_span_ids_ref = use_ref(None)
            pending_scroll_top_doc_id_ref = use_ref(None)
            pending_scroll_span_id_ref = use_ref(None)
            suppress_next_empty_select_clear_ref = use_ref(False)
            is_mounting_ref = use_ref(True)
            last_non_empty_selected_ranges_by_doc_ref = use_ref({})

            selected_doc_indices = normalize_row_indices(
                selected_doc_rows_snapshot.get("rows"),
                None,
                len(text_data),
            )
            lead_doc_idx = (
                selected_doc_indices[0] if len(selected_doc_indices) > 0 else (0 if len(text_data) > 0 else None)
            )
            if docs_mode == "all":
                visible_doc_indices = list(range(len(text_data)))
            elif docs_mode == "selected":
                visible_doc_indices = selected_doc_indices
            else:
                visible_doc_indices = [lead_doc_idx] if lead_doc_idx is not None else []

            doc_idx_by_id = {}
            for idx, row in enumerate(text_data):
                doc_id = row.get(text_primary_key)
                if doc_id is None:
                    continue
                doc_idx_by_id[str(doc_id)] = idx
            visible_doc_ids = [
                str(text_data[idx].get(text_primary_key))
                for idx in visible_doc_indices
                if text_data[idx].get(text_primary_key) is not None
            ]
            doc_ref_key_by_id = {}
            doc_ref_key_by_idx = {}
            for doc_idx in visible_doc_indices:
                if doc_idx is None or not (0 <= doc_idx < len(text_data)):
                    continue
                doc_id = text_data[doc_idx].get(text_primary_key)
                if doc_id is not None:
                    ref_key = f"{text_context_key}|doc:{doc_id}"
                    doc_ref_key_by_id[str(doc_id)] = ref_key
                else:
                    ref_key = f"{text_context_key}|idx:{doc_idx}"
                doc_ref_key_by_idx[doc_idx] = ref_key
            if docs_mode != "lead":
                active_ref_keys = set(doc_ref_key_by_idx.values())
                text_refs_by_doc.current = {
                    key: ref for key, ref in text_refs_by_doc.current.items() if key in active_ref_keys
                }

            selected_span_idx = get_first_selected_row_idx(selected_span_rows_snapshot.get("rows"))
            move_mode = bool(toolbar_snapshot.get("move_mode", False))

            selected_span_doc_id = None
            if (
                isinstance(selected_span_idx, int)
                and not isinstance(selected_span_idx, bool)
                and 0 <= selected_span_idx < len(span_data)
            ):
                span_doc_id = span_data[selected_span_idx].get(spans_foreign_key)
                if span_doc_id is not None:
                    selected_span_doc_id = str(span_doc_id)

            def get_doc_id_by_idx(idx):
                if idx is None or not (0 <= idx < len(text_data)):
                    return None
                return text_data[idx].get(text_primary_key)

            def get_doc_text_ref(doc_ref_key: Optional[str]):
                if doc_ref_key is None:
                    return text_ref
                key = str(doc_ref_key)
                existing = text_refs_by_doc.current.get(key)
                if existing:
                    return existing
                created = Ref(current=None)
                text_refs_by_doc.current[key] = created
                return created

            def resolve_text_ref_for_doc_id(doc_id: Optional[Any]):
                if docs_mode == "lead":
                    return text_ref
                if doc_id is None:
                    return text_ref
                return get_doc_text_ref(doc_ref_key_by_id.get(str(doc_id)))

            def ensure_active_doc():
                current_active = str(active_doc_id) if active_doc_id is not None else None
                visible_doc_id_set = set(visible_doc_ids)
                if current_active in visible_doc_id_set:
                    return
                if selected_span_doc_id in visible_doc_id_set:
                    set_active_doc_id(selected_span_doc_id)
                    return
                if len(visible_doc_ids) > 0:
                    set_active_doc_id(visible_doc_ids[0])
                elif active_doc_id is not None:
                    set_active_doc_id(None)

            use_effect(
                ensure_active_doc,
                [visible_doc_indices, selected_span_idx, len(text_data), len(span_data)],
            )

            def get_active_doc_id() -> Optional[str]:
                if active_doc_id is not None:
                    return str(active_doc_id)
                if selected_span_doc_id is not None and selected_span_doc_id in set(visible_doc_ids):
                    return selected_span_doc_id
                if len(visible_doc_ids) > 0:
                    return visible_doc_ids[0]
                return None

            def get_doc_selected_ranges(doc_id: Optional[str]) -> List[Dict[str, Any]]:
                if doc_id is None:
                    return []
                return selected_ranges_by_doc.get(str(doc_id), [])

            def set_doc_selected_ranges(doc_id: Optional[str], ranges: Sequence[Dict[str, Any]]) -> None:
                if doc_id is None:
                    return
                key = str(doc_id)
                next_ranges_by_doc = dict(selected_ranges_by_doc)
                if ranges and len(ranges) > 0:
                    normalized_ranges = list(ranges)
                    next_ranges_by_doc[key] = normalized_ranges
                    remembered = dict(last_non_empty_selected_ranges_by_doc_ref.current or {})
                    remembered[key] = normalized_ranges
                    last_non_empty_selected_ranges_by_doc_ref.current = remembered
                else:
                    next_ranges_by_doc.pop(key, None)
                set_selected_ranges_by_doc(next_ranges_by_doc)
                if on_select_text is not None:
                    doc_idx = doc_idx_by_id.get(key)
                    doc_text = (text_data[doc_idx].get(text_key) or "") if doc_idx is not None else ""
                    first = ranges[0] if ranges and len(ranges) > 0 else None
                    on_select_text(doc_id, list(ranges or []), doc_text[first["begin"] : first["end"]] if first else "")

            def get_selected_or_last_ranges(doc_id: Optional[str]) -> List[Dict[str, Any]]:
                if doc_id is None:
                    return []
                selected_ranges = get_doc_selected_ranges(doc_id)
                if len(selected_ranges) > 0:
                    return list(selected_ranges)
                remembered = dict(last_non_empty_selected_ranges_by_doc_ref.current or {})
                return list(remembered.get(str(doc_id)) or [])

            def set_selected_span_rows(selected_rows: Optional[Sequence[int]] = None):
                # Tables of the spans follow through select_span_in_tables, which also highlights the row
                rows = [span_data[idx] for idx in normalize_row_indices(selected_rows, None, len(span_data))]
                selected_span_rows_store["identities"] = [row[spans_primary_key] for row in rows]
                selected_span_rows_store["row"] = rows[0] if len(rows) else None

            def select_span_in_tables(span_id):
                # This widget already shared the span selection, the tables only highlight the row
                for other in handles.get(store_spans_key, []):
                    if other[1] == "table" and other[0].current is not None:
                        other[0].current.select_row_id(span_id, "relation")

            def set_selected_span(span_id):
                if span_id is None:
                    set_selected_span_rows([])
                    return
                idx = next(
                    (i for i, span in enumerate(span_data) if str(span.get(spans_primary_key)) == str(span_id)),
                    None,
                )
                if idx is None:
                    set_selected_span_rows([])
                    return
                set_selected_span_rows([idx])

            def set_move_mode(enabled: bool):
                toolbar_state["move_mode"] = bool(enabled)

            def toggle_move_mode():
                toolbar_state["move_mode"] = not bool(toolbar_state["move_mode"])

            def get_current_selected_span_indices() -> List[int]:
                return normalize_row_indices(selected_span_rows_snapshot.get("rows"), None, len(span_data))

            async def select_doc(doc_row):
                """
                Make a document row the lead selected document, through a table of the documents if any
                """
                doc_id = doc_row[text_primary_key]
                table = next(
                    (item[0] for item in handles.get(store_text_key, []) if item[1] == "table" and item[0].current),
                    None,
                )
                if table is not None:
                    await table.current.select_row_id(doc_id)
                else:
                    select_rows(store_text_key, [doc_row], handle, "key")
                set_active_doc_id(str(doc_id))
                if on_change_text_id:
                    on_change_text_id(doc_id)

            async def select_doc_at(idx):
                # Positions count every document of the Store key, before table filters
                source = text_view.rowSource
                if source is None or not source.rowCount:
                    return
                position = idx % source.rowCount
                rows = await source.getRows(position, position + 1, __new__(AbortController()).signal)  # noqa: F821
                if len(rows):
                    await select_doc(rows[0])

            async def move_lead_doc(delta):
                current_id = get_doc_id_by_idx(lead_doc_idx)
                table = next(
                    (item[0] for item in handles.get(store_text_key, []) if item[1] == "table" and item[0].current),
                    None,
                )
                if table is not None:
                    row_id = await table.current.get_adjacent_row_id(current_id, delta)
                    if row_id is not None:
                        await table.current.select_row_id(row_id)
                        set_active_doc_id(str(row_id))
                        if on_change_text_id:
                            on_change_text_id(row_id)
                    return
                source = text_view.rowSource
                signal = __new__(AbortController()).signal  # noqa: F821
                idx = await source.findRowIndex(current_id, signal) if current_id is not None else -1
                await select_doc_at(idx + delta)

            async def get_doc_idx():
                doc_id = get_doc_id_by_idx(lead_doc_idx) if docs_mode == "lead" else get_active_doc_id()
                if doc_id is None or text_view.rowSource is None:
                    return None
                return await text_view.rowSource.findRowIndex(doc_id, __new__(AbortController()).signal)  # noqa: F821

            def scroll_to_top():
                lead_doc_id = get_doc_id_by_idx(lead_doc_idx)
                if is_mounting_ref.current:
                    if lead_doc_id is not None:
                        is_mounting_ref.current = False
                    return
                if lead_doc_id is None:
                    return
                target_ref = resolve_text_ref_for_doc_id(lead_doc_id)
                if target_ref is not None and target_ref.current is not None:
                    target_ref.current.scroll_to_line(0, "smooth", "start")
                    pending_scroll_top_doc_id_ref.current = None
                    return
                pending_scroll_top_doc_id_ref.current = str(lead_doc_id) if lead_doc_id is not None else None

            use_effect(scroll_to_top, [get_doc_id_by_idx(lead_doc_idx), docs_mode])

            def flush_pending_top_scroll_request():
                pending_doc_id = pending_scroll_top_doc_id_ref.current
                if pending_doc_id is None:
                    return
                target_ref = resolve_text_ref_for_doc_id(pending_doc_id)
                if target_ref is None or target_ref.current is None:
                    return
                target_ref.current.scroll_to_line(0, "smooth", "start")
                pending_scroll_top_doc_id_ref.current = None

            use_effect(flush_pending_top_scroll_request)

            def flush_pending_span_scroll_request():
                pending_span_id = pending_scroll_span_id_ref.current
                if pending_span_id is None:
                    return
                span = next((span for span in span_data if str(span[spans_primary_key]) == str(pending_span_id)), None)
                if span is None:
                    return
                pending_doc_id = span.get(spans_foreign_key)
                if pending_doc_id is not None and str(pending_doc_id) not in visible_doc_ids:
                    return
                target_ref = resolve_text_ref_for_doc_id(pending_doc_id)
                if target_ref is None or target_ref.current is None:
                    return
                target_ref.current.scroll_to_span(pending_span_id)
                pending_scroll_span_id_ref.current = None

            use_effect(flush_pending_span_scroll_request)

            def scroll_to_span(span_id):
                if span_id is None:
                    return
                # Keep the requested identity until its document and annotation are rendered
                pending_scroll_span_id_ref.current = span_id
                set_highlighted([span_id])
                idx = next(
                    (i for i, span in enumerate(span_data) if str(span.get(spans_primary_key)) == str(span_id)),
                    None,
                )
                if idx is None:
                    return
                span_doc_id = span_data[idx].get(spans_foreign_key)
                if span_doc_id is not None:
                    set_active_doc_id(str(span_doc_id))

            def ensure_unique_span_id(base_span_id: Any, existing_ids: set) -> str:
                candidate = str(base_span_id)
                if candidate not in existing_ids:
                    existing_ids.add(candidate)
                    return candidate
                suffix = 1
                while True:
                    next_candidate = f"{candidate}-{suffix}"
                    if next_candidate not in existing_ids:
                        existing_ids.add(next_candidate)
                        return next_candidate
                    suffix += 1

            async def add_spans_for_doc(
                target_doc_id: Optional[Any],
                selected_ranges: Sequence[Dict[str, Any]],
                span_values: Optional[Dict[str, Any]] = None,
            ) -> List[str]:
                if target_doc_id is None:
                    return []
                target_doc_idx = doc_idx_by_id.get(str(target_doc_id))
                if target_doc_idx is None or not (0 <= target_doc_idx < len(text_data)):
                    return []
                target_doc = text_data[target_doc_idx]
                doc_text = target_doc.get(text_key) or ""
                normalized_ranges = []
                for selected_range in selected_ranges or []:
                    begin = selected_range.get("begin")
                    end = selected_range.get("end")
                    if begin is None or end is None:
                        continue
                    begin = int(begin)
                    end = int(end)
                    if end <= begin:
                        continue
                    normalized_ranges.append({"begin": begin, "end": end})
                if len(normalized_ranges) == 0:
                    return []

                span_values = dict(span_values or {})
                provided_span_id = span_values.pop(spans_primary_key, None)
                span_values.pop(begin_key, None)
                span_values.pop(end_key, None)
                span_values.pop(text_primary_key, None)
                span_values.pop("text", None)

                button_value = span_values.get(button_key)
                span_defaults = labels[button_value].get("defaults", {}) if button_value in labels else {}
                span_template = {**span_defaults, **span_values}
                if provided_span_id is not None and len(normalized_ranges) != 1:
                    provided_span_id = None
                existing_span_ids = {
                    str(span.get(spans_primary_key)) for span in span_data if span.get(spans_primary_key) is not None
                }
                added_span_ids = []
                inserted_rows = []
                for selected_range in normalized_ranges:
                    begin = selected_range["begin"]
                    end = selected_range["end"]
                    text_content = doc_text[begin:end]
                    # New spans get a random hex ID like uuid.uuid4().hex, which says nothing about their position
                    span_id = (
                        ensure_unique_span_id(provided_span_id, existing_span_ids)
                        if provided_span_id is not None
                        else "".join(crypto.randomUUID().split("-"))  # noqa: F821
                    )
                    inserted_rows.append(
                        {
                            "text": text_content,
                            label_key: text_content,
                            style_key: span_template.get(button_key) or default_style,
                            spans_primary_key: span_id,
                            begin_key: begin,
                            end_key: end,
                            button_key: span_template.get(button_key),
                            spans_foreign_key: target_doc_id,
                            **span_template,
                        }
                    )
                    added_span_ids.append(span_id)

                if is_dataframe:
                    columns = [column["name"] for column in spans_store.description.columns]
                    inserted_rows = [
                        {key: value for key, value in row.items() if key in columns} for row in inserted_rows
                    ]
                await edit_rows(spans_store, spans_primary_key, insert=inserted_rows, read_only=read_only)
                if len(added_span_ids) > 0:
                    remembered = dict(last_non_empty_selected_ranges_by_doc_ref.current or {})
                    remembered.pop(str(target_doc_id), None)
                    last_non_empty_selected_ranges_by_doc_ref.current = remembered
                    set_doc_selected_ranges(target_doc_id, [])
                    if docs_mode == "lead" and text_ref.current:
                        text_ref.current.clear_current_mouse_selection()
                    set_move_mode(False)
                    pending_span_ids_ref.current = added_span_ids
                return added_span_ids

            async def add_spans_from_current_selection(
                span_values: Optional[Dict[str, Any]] = None,
            ) -> List[str]:
                target_doc_id = get_active_doc_id()
                if target_doc_id is None:
                    return []
                selected_ranges = get_selected_or_last_ranges(target_doc_id)
                return await add_spans_for_doc(target_doc_id, selected_ranges, span_values)

            def get_current_selected_ranges() -> List[Dict[str, Any]]:
                target_doc_id = get_active_doc_id()
                if target_doc_id is None:
                    return []
                return list(get_selected_or_last_ranges(target_doc_id))

            def get_current_selected_text() -> Optional[str]:
                target_doc_id = get_active_doc_id()
                if target_doc_id is None:
                    return None
                target_doc_idx = doc_idx_by_id.get(str(target_doc_id))
                if target_doc_idx is None or not (0 <= target_doc_idx < len(text_data)):
                    return None
                selected_ranges = get_selected_or_last_ranges(target_doc_id)
                if len(selected_ranges) == 0:
                    return None
                first_range = selected_ranges[0]
                begin = first_range.get("begin")
                end = first_range.get("end")
                if begin is None or end is None:
                    return None
                begin = int(begin)
                end = int(end)
                if end <= begin:
                    return None
                doc_text = text_data[target_doc_idx].get(text_key) or ""
                return doc_text[begin:end]

            use_imperative_handle(
                handle,
                lambda: {
                    "scroll_to_span": scroll_to_span,
                    "set_doc_idx": select_doc_at,
                    "get_doc_idx": get_doc_idx,
                    "set_highlighted_spans": set_highlighted,
                    "set_selected_span": set_selected_span,
                    "get_active_doc_id": get_active_doc_id,
                    "get_selected_ranges": get_current_selected_ranges,
                    "get_selected_text": get_current_selected_text,
                    "add_span_from_selection": add_spans_from_current_selection,
                },
                [text_data, span_data, lead_doc_idx, docs_mode, active_doc_id],
            )

            def handle_mouse_hover_spans(span_ids: List[str], mod_keys: List[str]):
                set_highlighted(span_ids)

                # Synchronize other widgets
                for other in handles.get(store_spans_key, []):
                    if other[0].current is None:
                        continue
                    if other[1] == "table":
                        other[0].current.set_highlighted(span_ids)

                if on_hover_spans:
                    on_hover_spans(span_ids, mod_keys)

            async def update_selected_span(key, value):
                col = span_field_by_key.get(key)
                if col and col.get("kind") == "boolean":
                    value = bool(value)

                selected_indices = get_current_selected_span_indices()
                if not selected_indices:
                    return
                selected_spans = [span_data[idx] for idx in selected_indices]
                await edit_rows(spans_store, spans_primary_key, selected_spans, {key: value}, read_only=read_only)
                if selected_span_idx is None or selected_span_idx < 0:
                    set_selected_span_rows(selected_indices)

            # Spans shown in each visible document, built again only when the spans, the selection or the
            # hovered hidden spans change. Hovered spans are styled by AnnotatedText through its highlighted
            # prop, so hovering does not tokenize the documents again
            selected_ids = [
                span_data[idx].get(spans_primary_key)
                for idx in get_current_selected_span_indices()
                if 0 <= idx < len(span_data)
            ]
            hidden_ids = use_memo(
                lambda: {span[spans_primary_key]: True for span in span_data if span.get("hidden")}, [span_data]
            )
            shown_hidden_ids = [span_id for span_id in highlighted if span_id in hidden_ids]

            def compute_spans_by_doc():
                shown = {span_id: True for span_id in [*selected_ids, *shown_hidden_ids]}
                selected = {span_id: True for span_id in selected_ids}
                spans_by_doc = {doc_id: [] for doc_id in visible_doc_ids}
                for span in span_data:
                    span_id = span[spans_primary_key]
                    if span.get("hidden") and span_id not in shown:
                        continue
                    doc_ids = [str(span[spans_foreign_key])] if spans_foreign_key in span else list(spans_by_doc.keys())
                    for doc_id in doc_ids:
                        if doc_id in spans_by_doc:
                            spans_by_doc[doc_id].append(
                                {
                                    "selected": span_id in selected,
                                    **span,
                                    # Spans without a style take the style of their label, like the spans added
                                    # with the toolbar buttons
                                    style_key: span.get(style_key)
                                    or (span.get(button_key) if span.get(button_key) in labels else default_style),
                                }
                            )
                return spans_by_doc

            spans_by_doc = use_memo(
                compute_spans_by_doc, [span_data, str(visible_doc_ids), str(selected_ids), str(shown_hidden_ids)]
            )

            def flush_pending_span_scroll():
                if pending_span_ids_ref.current is None:
                    return
                span_ids = pending_span_ids_ref.current
                span_ids_in_store = {span.get(spans_primary_key) for span in span_data}
                if not any(span_id in span_ids_in_store for span_id in span_ids):
                    return
                pending_span_ids_ref.current = None
                last_span_idx = next(
                    i for i, span in enumerate(span_data) if span[spans_primary_key] == span_ids[len(span_ids) - 1]
                )
                set_selected_span_rows([last_span_idx])
                select_span_in_tables(span_ids[len(span_ids) - 1])
                if on_add_span:
                    on_add_span(span_ids)

            use_effect(flush_pending_span_scroll)

            can_edit_spans = not read_only and span_view.description and span_view.description.capabilities.edit

            @use_event_callback
            async def handle_add_span(label):
                if not can_edit_spans:
                    return
                await add_spans_from_current_selection({button_key: label})

            @use_event_callback
            async def on_delete():
                if not can_edit_spans:
                    return
                selected_indices = get_current_selected_span_indices()
                if selected_indices:
                    selected_spans = [span_data[idx] for idx in selected_indices]
                    await edit_rows(spans_store, spans_primary_key, selected_spans, remove=True, read_only=read_only)
                    set_selected_span_rows([])
                    return
                target_doc_id = get_active_doc_id()
                selected_ranges = get_doc_selected_ranges(target_doc_id)
                to_remove = []
                for idx, span in enumerate(span_data):
                    if spans_foreign_key in span and str(span.get(spans_foreign_key)) != str(target_doc_id):
                        continue
                    for r in selected_ranges:
                        if not (span[end_key] <= r["begin"] or r["end"] <= span[begin_key]):
                            to_remove.append(idx)
                            break
                removed = [span_data[idx] for idx in to_remove]
                await edit_rows(spans_store, spans_primary_key, removed, remove=True, read_only=read_only)
                if to_remove:
                    set_doc_selected_ranges(target_doc_id, [])

            @use_event_callback
            async def on_key_press(k, modkeys, selection):
                if docs_mode == "lead" and k in {"ArrowRight", "ArrowLeft"}:
                    await move_lead_doc(1 if k == "ArrowRight" else -1)
                    return
                if k in {"ArrowRight", "ArrowLeft"}:
                    # Other display modes move the active document among the visible ones
                    if len(visible_doc_ids) > 0:
                        current_doc_id = get_active_doc_id()
                        if current_doc_id not in set(visible_doc_ids):
                            set_active_doc_id(visible_doc_ids[0])
                        else:
                            current_pos = visible_doc_ids.index(current_doc_id) + (1 if k == "ArrowRight" else -1)
                            set_active_doc_id(visible_doc_ids[current_pos % len(visible_doc_ids)])
                    return
                if k == "Backspace":
                    on_delete()
                else:
                    for label, cfg in labels.items():
                        if k == cfg.get("shortcut"):
                            handle_add_span(label)
                            break

            def handle_doc_key_press(k, modkeys, selection, doc):
                doc_id = doc.get(text_primary_key)
                if doc_id is not None:
                    set_active_doc_id(str(doc_id))
                on_key_press(k, modkeys, selection)

            def connect_toolbar():
                toolbar_actions.current = {
                    "add": handle_add_span,
                    "delete": on_delete,
                    "update": update_selected_span,
                    "move": toggle_move_mode,
                }

                def disconnect():
                    toolbar_actions.current = None

                return disconnect

            use_effect(connect_toolbar)

            def handle_click_span(span_id, modkeys, doc_id):
                if doc_id is not None:
                    set_active_doc_id(str(doc_id))
                if span_id is None:
                    set_selected_span_rows([])
                    return
                clicked_idx = next(
                    (i for i, span in enumerate(span_data) if str(span.get(spans_primary_key)) == str(span_id)),
                    None,
                )
                if clicked_idx is None:
                    return
                shift_pressed = bool(modkeys and any(str(key).lower() == "shift" for key in modkeys))
                current_selected_rows = selected_span_rows_snapshot.get("rows") or []
                next_selected_rows = (
                    normalize_row_indices(
                        [*current_selected_rows, clicked_idx],
                        clicked_idx,
                        len(span_data),
                    )
                    if shift_pressed
                    else [clicked_idx]
                )
                suppress_next_empty_select_clear_ref.current = True
                set_selected_span_rows(next_selected_rows)
                # A shift click extends the selection, tables would replace it with the clicked row
                if not shift_pressed:
                    select_span_in_tables(span_id)
                set_move_mode(False)

                # auto synchronization with other text widgets
                for other in handles.get(store_spans_key, []):
                    other_handle = other[0]
                    if other_handle.current is None or other_handle == handle:
                        continue
                    set_highlighted = getattr(other_handle.current, "set_highlighted", None)
                    scroll_to_row_id = getattr(other_handle.current, "scroll_to_row_id", None)
                    if callable(set_highlighted):
                        set_highlighted([span_id])
                    if callable(scroll_to_row_id):
                        scroll_to_row_id(span_id)
                if on_click_span:
                    on_click_span(span_id, modkeys)

            async def handle_mouse_select(ranges, modkeys, doc):
                doc_id = doc.get(text_primary_key)
                doc_id_str = str(doc_id) if doc_id is not None else None
                if doc_id_str is not None:
                    set_active_doc_id(doc_id_str)
                if len(ranges) == 0 and suppress_next_empty_select_clear_ref.current:
                    suppress_next_empty_select_clear_ref.current = False
                    set_doc_selected_ranges(doc_id_str, ranges)
                    return
                selected_span_doc_id = (
                    span_data[selected_span_idx].get(spans_foreign_key) or doc_id
                    if selected_span_idx is not None and 0 <= selected_span_idx < len(span_data)
                    else doc_id
                )
                if (
                    move_mode
                    and selected_span_idx is not None
                    and 0 <= selected_span_idx < len(span_data)
                    and selected_span_doc_id == doc_id
                    and len(ranges) > 0
                ):
                    r = ranges[0]
                    values = {
                        begin_key: r["begin"],
                        end_key: r["end"],
                        "text": doc[text_key][r["begin"] : r["end"]],
                    }
                    if is_dataframe and "text" not in [column["name"] for column in spans_store.description.columns]:
                        values.pop("text")
                    selected_spans = [span_data[selected_span_idx]]
                    await edit_rows(spans_store, spans_primary_key, selected_spans, values, read_only=read_only)
                    set_selected_span_rows([selected_span_idx])
                    set_move_mode(False)
                    set_doc_selected_ranges(doc_id_str, [])
                    if docs_mode == "lead" and text_ref.current:
                        text_ref.current.clear_current_mouse_selection()
                    return
                elif len(ranges) > 0:
                    set_selected_span_rows([])
                elif (selected_span_idx is not None and selected_span_idx >= 0) or selected_span_rows_snapshot.get(
                    "rows"
                ):
                    set_selected_span_rows([])
                set_doc_selected_ranges(doc_id_str, ranges)

            if len(text_data) == 0 and (text_view.error or span_view.error or text_view.loading or span_view.loading):
                error = text_view.error or span_view.error
                return div(
                    error or LoadingStatus(label=text_view.loading or span_view.loading),
                    role="alert" if error else "status",
                    class_name="metanno-error" if error else None,
                    style={"margin": "8px"},
                )
            if len(visible_doc_indices) == 0:
                return [div("No document selected", key="no-document-selected", style={"padding": "8px"})]

            rendered_docs = []
            visible_doc_count = len(visible_doc_indices)
            for note_idx, doc_idx in enumerate(visible_doc_indices):
                if doc_idx is None or not (0 <= doc_idx < len(text_data)):
                    continue
                doc = text_data[doc_idx]
                doc_id = doc.get(text_primary_key)
                doc_id_str = str(doc_id) if doc_id is not None else f"idx-{doc_idx}"
                doc_text_ref = (
                    text_ref
                    if docs_mode == "lead"
                    else get_doc_text_ref(doc_ref_key_by_idx.get(doc_idx, f"{text_context_key}|idx:{doc_idx}"))
                )
                annotated_text = AnnotatedText(
                    text=doc[text_key],
                    spans=spans_by_doc.get(doc_id_str, []),
                    highlighted=highlighted,
                    annotation_styles=labels,
                    mouse_selection=get_doc_selected_ranges(str(doc_id) if doc_id is not None else None),
                    primary_key=spans_primary_key,
                    begin_key=begin_key,
                    end_key=end_key,
                    style_key=style_key,
                    label_key=label_key,
                    label_formatter=label_formatter,
                    on_key_press=lambda k, modkeys, selection, d=doc: handle_doc_key_press(k, modkeys, selection, d),
                    on_mouse_select=lambda ranges, modkeys, d=doc: handle_mouse_select(ranges, modkeys, d),
                    on_mouse_hover_spans=handle_mouse_hover_spans,
                    on_click_span=lambda span_id, modkeys, d=doc: handle_click_span(
                        span_id, modkeys, d.get(text_primary_key)
                    ),
                    handle=doc_text_ref,
                    style=(
                        {"flex": 1, "minHeight": 0, "overflow": "scroll", **(style or {})}
                        if docs_mode == "lead"
                        # Stacked documents grow with their text, the widget scrolls them together
                        else {"minHeight": "180px", "overflow": "visible", **(style or {})}
                    ),
                )
                wrapper_key = "doc-lead" if docs_mode == "lead" else f"{text_context_key}:doc:{doc_idx}:{doc_id_str}"
                wrapped_component = container_renderer(
                    doc,
                    annotated_text,
                    toolbar_view,
                    key=wrapper_key,
                    note_idx=note_idx,
                    note_count=visible_doc_count,
                )
                rendered_docs.append(
                    wrapped_component,
                )
            return rendered_docs

        toolbar_view = StoreWidget(store=data_store, read_only=read_only, content=ToolbarWidget())
        # Stacked documents scroll in this element, the parent of their wrappers, so sticky document titles of a
        # container_renderer stay within the whole scrolled height
        text_view = StoreWidget(
            store=data_store,
            read_only=read_only,
            content=TextWidget(),
            style={"height": "100%", "minHeight": 0, **({"overflow": "auto"} if docs_mode != "lead" else {})},
        )
        return text_view, toolbar_view
