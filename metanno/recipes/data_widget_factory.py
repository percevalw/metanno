import warnings
from asyncio import Future
from os import PathLike
from typing import Any, Callable, Dict, List, Optional, Sequence, Tuple, Union

from pret import component, create_store, use_store_snapshot
from pret.hooks import (
    RefType,
    use_connection_status,
    use_effect,
    use_event_callback,
    use_imperative_handle,
    use_memo,
    use_ref,
    use_state,
)
from pret.react import b as bold
from pret.react import div
from pret.render import Renderable
from pret.store import transact
from pret_joy import (
    Autocomplete,
    Box,
    Button,
    ButtonGroup,
    Checkbox,
    FormControl,
    FormLabel,
    Input,
    Option,
    Radio,
    RadioGroup,
    Select,
    Stack,
    Typography,
)
from typing_extensions import Literal, NotRequired, TypedDict

from metanno import AnnotatedText, Table


class FieldSpec(TypedDict):
    key: str
    name: NotRequired[str]
    kind: Literal["text", "boolean", "hyperlink", "select", "radio", "autocomplete"]
    editable: NotRequired[bool]
    filterable: NotRequired[bool]
    options: Optional[Union[Sequence[Any], Callable[[Any], Sequence[Any]]]]


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


def infer_fields(
    rows,
    hidden_keys=(),
    visible_keys=None,
    id_keys=(),
    editable_keys=(),
    categorical_keys=(),
    categories=None,
    first_keys=(),
    column_names=None,
    filterable_keys=None,
) -> List[FieldSpec]:
    """
    Infer Metanno field metadata from a list-like collection of row dicts.

    Parameters
    ----------
    rows : Sequence[Dict[str, Any]]
        Input records used to infer available keys and value types.
    hidden_keys : Sequence[str]
        Keys to exclude from the resulting fields.
    visible_keys : Sequence[str] | None
        Explicit allow-list of keys to render. When set, only these keys are
        included, ordered by `visible_keys` unless `first_keys` is provided.
    id_keys : Sequence[str]
        Keys treated as identifiers, rendered as hyperlinks.
    editable_keys : Sequence[str]
        Keys marked as editable.
    categorical_keys : Sequence[str]
        Keys treated as categorical, with options inferred from values.
    categories : Dict[str, Sequence[Any]] | None
        Optional mapping of key to precomputed candidate values.
    first_keys : Sequence[str]
        Keys promoted to the front of the ordering. When `visible_keys` is
        provided, it reorders only those keys that are present.
    column_names : Dict[str, str] | None
        Optional mapping of key to display label.
    filterable_keys : Sequence[str] | None
        Key that can be filtered in a table view. If None, all keys are filterable.

    Returns
    -------
    List[FieldSpec]
        Field specifications compatible with Metanno widgets.
    """
    rows = rows.to_py() if hasattr(rows, "to_py") else list(rows)
    if categories is None:
        categories = {}

    all_keys = list(
        {
            **dict.fromkeys(first_keys),
            **dict.fromkeys(k for row in rows for k in row),
        }
    )
    if visible_keys is None:
        ordered_keys = all_keys
    else:
        visible_keys = list(dict.fromkeys(visible_keys))
        if first_keys:
            first_visible = [k for k in first_keys if k in visible_keys]
            remaining_visible = [k for k in visible_keys if k not in first_visible]
            ordered_keys = [*first_visible, *remaining_visible]
        else:
            ordered_keys = visible_keys
    visible_keys = [k for k in ordered_keys if k not in hidden_keys]

    def non_null_values(key):
        return list(dict.fromkeys(val for row in rows if (val := row.get(key)) is not None))

    def infer_scalar_type(values):
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

    columns = []
    for key in visible_keys:
        values = categories[key] if key in categories else non_null_values(key)
        s_type = infer_scalar_type(values)

        if s_type == "bool":
            metanno_type = "boolean"
        elif key in id_keys:
            metanno_type = "hyperlink"
        else:
            metanno_type = "text"

        options = None
        if key in categorical_keys:
            options = list(dict.fromkeys(values))
            if metanno_type == "text":
                if len(options) < 4:
                    metanno_type = "radio"
                elif len(options) < 15:
                    metanno_type = "select"
                else:
                    metanno_type = "autocomplete"

        columns.append(
            {
                "key": key,
                "name": column_names.get(key, key) if column_names else key,
                "kind": metanno_type,
                "editable": key in editable_keys,
                "filterable": filterable_keys is None or key in filterable_keys,
                "options": options,
            }
        )

    return columns


class TextWidgetHandle(TypedDict):
    """
    Imperative handle for interacting with a text annotation widget.
    """

    scroll_to_span: Callable[[str], None]
    set_doc_idx: Callable[[int], None]
    get_doc_idx: Callable[[], Optional[int]]
    set_highlighted_spans: Callable[[List[str]], None]
    set_selected_span: Callable[[str], None]


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
    get_adjacent_row_id: Callable[[Any, int], Any]
    get_adjacent_row_idx: Callable[[Optional[int], int], Optional[int]]


class FormWidgetHandle(TypedDict):
    """
    Imperative handle for interacting with a form widget.
    """

    get_row_idx: Callable[[], Optional[int]]
    set_row_idx: Callable[[int], None]


MIXED_VALUES_LABEL = "Multiple values"


def extract_selected_rows(selected_rows: Optional[Sequence[Any]]) -> List[int]:
    extracted: List[int] = []
    seen = set()
    for item in list(selected_rows or []):
        idx = None
        if isinstance(item, bool):
            idx = None
        elif isinstance(item, int):
            idx = item
        else:
            idx = item.get("row_idx", item.get("rowIdx"))
        if not isinstance(idx, int) or idx < 0 or idx in seen:
            continue
        extracted.append(idx)
        seen.add(idx)
    return extracted


def get_first_selected_row_idx(selected_rows: Optional[Sequence[Any]]) -> Optional[int]:
    extracted = extract_selected_rows(selected_rows)
    if len(extracted) > 0:
        return extracted[0]
    return None


def normalize_selected_rows(
    selected_rows: Optional[Sequence[Any]],
    row_idx: Optional[int],
    row_count: int,
) -> List[int]:
    if row_count <= 0:
        return []
    source: List[Any] = list(selected_rows or [])
    if isinstance(row_idx, int) and not isinstance(row_idx, bool) and row_idx >= 0:
        source = [row_idx, *source]
    normalized = []
    seen = set()
    for idx in extract_selected_rows(source):
        if idx >= row_count or idx in seen:
            continue
        normalized.append(idx)
        seen.add(idx)
    return sorted(normalized)


def make_field_label(
    label: Any,
    is_mixed: bool,
):
    if not is_mixed:
        return label
    suffix = f" ({MIXED_VALUES_LABEL})"
    if isinstance(label, str):
        return f"{label}{suffix}"
    return div(label, suffix)


def render_select_field(
    key: str,
    label: Any,
    kind: str,
    value: Any,
    data: Any,
    editable: bool,
    options: Sequence[Any],
    on_field_change: Callable,
    min_input_width: Optional[str],
    align_self: Optional[str] = None,
    all_label: Optional[str] = None,
    is_mixed: bool = False,
):
    field_label = make_field_label(label, is_mixed)
    if callable(options):
        options = options(data)
    value = data[key]
    select_options = list(options)
    if len(select_options) == 0:
        return

    if kind == "autocomplete":
        if all_label is not None:
            select_options = [all_label, *select_options]
            value = all_label if value in (None, "") else value

        def _on_change(event, val):
            if all_label is not None and val == all_label:
                on_field_change(key, "")
            else:
                on_field_change(key, val)

        return FormControl(
            FormLabel(field_label),
            Autocomplete(
                options=select_options,
                value=None if is_mixed else value,
                on_change=_on_change,
                disabled=not editable,
                placeholder=MIXED_VALUES_LABEL if is_mixed else None,
                size="sm",
            ),
            sx={
                "minWidth": min_input_width or 0,
                "width": "fit-content",
                "alignSelf": align_self,
                "gridArea": key,
            },
        )
    elif kind == "select":
        if all_label is not None and value in (None, ""):
            value = ""
        select_default_option = [Option(all_label, value="")] if all_label is not None else []
        return FormControl(
            FormLabel(field_label),
            Select(
                *select_default_option,
                *(Option(str(c), value=c) for c in select_options),
                value=None if is_mixed else value,
                on_change=lambda event, val: on_field_change(key, val),
                disabled=not editable,
                placeholder=MIXED_VALUES_LABEL if is_mixed else None,
                size="sm",
            ),
            sx={
                "minWidth": min_input_width,
                "alignSelf": align_self,
                "gridArea": key,
            },
        )
    elif kind == "radio":
        return FormControl(
            FormLabel(field_label),
            RadioGroup(
                *(Radio(label=str(c), value=c, size="sm") for c in options),
                value=value,
                on_change=lambda event: on_field_change(key, event.target.value),
                disabled=not editable,
                size="sm",
            ),
            sx={"gridArea": key, "alignSelf": align_self},
        )
    else:
        print(f"Unsupported select field kind: {kind}")


def render_text_field(
    key: str,
    label: Any,
    value: Any,
    data: Any,
    editable: bool,
    on_field_change: Callable,
    min_input_width: Optional[str],
    align_self: Optional[str] = None,
    is_mixed: bool = False,
):
    def _on_change(event=None):
        target = getattr(event, "target", None)
        on_field_change(key, getattr(target, "value", ""))

    value = data[key]
    return FormControl(
        FormLabel(make_field_label(label, is_mixed)),
        Input(
            value="" if is_mixed or value is None else value,
            on_change=_on_change,
            read_only=not editable,
            disabled=not editable,
            placeholder=MIXED_VALUES_LABEL if is_mixed else None,
            size="sm",
        ),
        sx={"minWidth": min_input_width, "alignSelf": align_self, "gridArea": key},
    )


def render_boolean_field(
    key: str,
    label: Any,
    value: Any,
    data: Any,
    editable: bool,
    on_field_change: Callable,
    min_input_width: Optional[str],
    align_self: Optional[str] = None,
    is_mixed: bool = False,
):
    def _on_change(event=None, checked=None):
        new_val = (
            bool(checked)
            if checked is not None
            else getattr(getattr(event, "target", None), "checked", None)
        )
        on_field_change(key, bool(new_val))

    return FormControl(
        FormLabel(make_field_label(label, is_mixed)),
        Checkbox(
            checked=False if is_mixed else bool(value),
            indeterminate=is_mixed,
            on_change=_on_change,
            disabled=not editable,
            size="md",
            sx={"flex": 1, "alignItems": "center"},
        ),
        sx={"minWidth": min_input_width, "alignSelf": align_self or "flex-start", "gridArea": key},
    )


def render_field(
    current_row,
    col: Dict[str, Any],
    on_field_change: Callable,
    min_input_width: Optional[str],
    align_self: Optional[str] = None,
    value: Any = None,
    is_mixed: bool = False,
    use_explicit_value: bool = False,
):
    key = col["key"]
    if not use_explicit_value:
        value = current_row.get(key) if current_row is not None else None
    options = col.get("options")
    editable = col.get("editable", False)
    label = col.get("name", key)
    kind = col.get("kind", "text")

    if kind in ("select", "radio", "autocomplete") and options is not None:
        return render_select_field(
            key,
            label,
            kind,
            value,
            current_row,
            editable,
            options,
            on_field_change,
            min_input_width,
            align_self,
            is_mixed=is_mixed,
        )
    if col.get("kind") == "boolean":
        return render_boolean_field(
            key,
            label,
            value,
            current_row,
            editable,
            on_field_change,
            min_input_width,
            align_self,
            is_mixed=is_mixed,
        )
    return render_text_field(
        key,
        label,
        value,
        current_row,
        editable,
        on_field_change,
        min_input_width,
        align_self,
        is_mixed=is_mixed,
    )


class DataWidgetFactory:
    """
    The `DataWidgetFactory` is a helper widget factory for building
    interactive annotation and exploration applications using Metanno components. It
    manages data stores, shared state, and multiple synchronized views such as tables
    and annotated text views.

    Parameters
    ----------
    data : Union[Dict[str, List[Dict[str, Any]]], Callable[[], Dict]]
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
        data: Union[Dict[str, List[Dict[str, Any]]], Callable[[], Dict]],
        sync: Optional[Union[bool, str, PathLike]] = None,
    ):
        self.data = create_store(data, sync=sync)
        if not isinstance(sync, (str, PathLike)):
            warnings.warn(
                "DataWidgetFactory persistence is disabled: modifications on the data will not be "
                "saved ! Use `sync` parameter with a file path to enable persistence.",
            )
        self.handles = {}
        self.primary_keys = {}
        self.selected_rows = {}  # store_key -> currently selected row indices
        self.is_synced = bool(sync)

    def _ensure_selected_rows(self, store_key):
        if store_key is None:
            return
        if store_key not in self.selected_rows:
            self.selected_rows[store_key] = create_store({"rows": []})

    @staticmethod
    def _deep_get_store(
        data_store,
        path_parts: List[str],
        selected_row_idx_by_store: Dict[str, Optional[int]],
    ):
        if not path_parts:
            return None
        store = data_store[path_parts[0]]
        if len(path_parts) == 1:
            return store

        prefix = path_parts[0]
        for part in path_parts[1:]:
            if store is None or len(store) == 0:
                return None
            row_idx = selected_row_idx_by_store.get(prefix, 0)
            if row_idx is None or row_idx < 0:
                return None
            if row_idx >= len(store):
                row_idx = 0
            row = store[row_idx]
            if row is None:
                return None
            child_store = row.get(part)
            if child_store is None:
                return None
            store = child_store
            prefix = f"{prefix}.{part}"
        return store

    def _register_pkey(self, store_key, primary_key: str):
        if store_key is None or primary_key is None:
            return
        path_parts = str(store_key).split(".")
        for i in range(1, len(path_parts) + 1):
            path = ".".join(path_parts[:i])
            self._ensure_selected_rows(path)
        if store_key in self.primary_keys:
            return
        self.primary_keys[store_key] = primary_key

    def _register_table_columns(
        self,
        store_key,
        columns: Sequence[Dict[str, Any]],
        rows: Optional[Sequence[Dict[str, Any]]] = None,
    ):
        if store_key is None:
            return
        keys = {col.get("key") for col in columns if col.get("key")}
        if rows and len(rows) > 0 and isinstance(rows[0], dict):
            keys.update(rows[0].keys())

    def make_filter_related_tables(self):
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

    def make_sync_store_selection(self, filter_related_tables=None):
        handles = self.handles
        primary_keys = self.primary_keys
        selected_rows_by_store = self.selected_rows
        data_store = self.data
        deep_get_store = DataWidgetFactory._deep_get_store
        filter_related_tables = filter_related_tables or self.make_filter_related_tables()

        def sync_store_selection(
            store_key,
            row_idx,
            source_handle,
            sync_related_tables,
            selected_rows: Optional[Sequence[int]] = None,
        ):
            if row_idx is None:
                return
            path_parts = str(store_key).split(".")
            parent_selected_idx = {}
            for i in range(1, len(path_parts)):
                parent_path = ".".join(path_parts[:i])
                parent_store = selected_rows_by_store.get(parent_path)
                parent_selected_idx[parent_path] = (
                    get_first_selected_row_idx(parent_store["rows"])
                    if parent_store is not None
                    else None
                )
            data = deep_get_store(data_store, path_parts, parent_selected_idx)
            if data is None or len(data) == 0 or row_idx < 0 or row_idx >= len(data):
                return
            selected_rows_store = selected_rows_by_store.get(store_key)
            previous_lead_idx = (
                get_first_selected_row_idx(selected_rows_store["rows"])
                if selected_rows_store is not None
                else None
            )
            normalized_selected_rows = normalize_selected_rows(
                selected_rows,
                row_idx,
                len(data),
            )
            if selected_rows_store is not None:
                selected_rows_store["rows"] = normalized_selected_rows
            next_lead_idx = get_first_selected_row_idx(normalized_selected_rows)

            if previous_lead_idx != next_lead_idx:
                descendant_prefix = f"{store_key}."
                for candidate_store_key, candidate_rows_store in selected_rows_by_store.items():
                    if str(candidate_store_key).startswith(descendant_prefix):
                        candidate_rows_store["rows"] = []
            row = data[row_idx]
            primary_key = primary_keys[store_key]
            row_id = row[primary_key]
            for other in handles.get(store_key, []):
                other_handle = other[0]
                other_kind = other[1]
                if other_handle.current is None:
                    continue
                if other_handle == source_handle:
                    continue
                if other_kind == "spans":
                    other_handle.current.scroll_to_span(row_id)
                    # other_handle.current.set_highlighted_spans([row_id])
                    # raise Exception()
                    # other_handle.current.set_selected_span(row_id)
                elif other_kind == "table":
                    other_handle.current.scroll_to_row_id(row_id)
                    # other_handle.current.set_highlighted([row_id])

            if sync_related_tables:
                filter_related_tables(
                    primary_key,
                    row_id,
                    store_key,
                    source_handle,
                )

        return sync_store_selection

    def make_sync_parent_widgets(self, sync_store_selection=None):
        primary_keys = self.primary_keys
        selected_rows_by_store = self.selected_rows
        data_store = self.data
        deep_get_store = DataWidgetFactory._deep_get_store
        sync_store_selection = sync_store_selection or self.make_sync_store_selection()

        def sync_parent_widgets(store_key, row_idx):
            if row_idx is None:
                return
            path_parts = str(store_key).split(".")
            parent_selected_idx = {}
            for i in range(1, len(path_parts)):
                parent_path = ".".join(path_parts[:i])
                parent_store = selected_rows_by_store.get(parent_path)
                parent_selected_idx[parent_path] = (
                    get_first_selected_row_idx(parent_store["rows"])
                    if parent_store is not None
                    else None
                )
            data = deep_get_store(data_store, path_parts, parent_selected_idx)
            if data is None or len(data) == 0 or row_idx < 0 or row_idx >= len(data):
                return
            row = data[row_idx]
            for parent_store_key, parent_key in primary_keys.items():
                if parent_store_key == store_key:
                    continue
                parent_id = row.get(parent_key)
                if parent_id is None:
                    continue
                parent_parts = str(parent_store_key).split(".")
                parent_selected_idx = {}
                for i in range(1, len(parent_parts)):
                    parent_path = ".".join(parent_parts[:i])
                    parent_store = selected_rows_by_store.get(parent_path)
                    parent_selected_idx[parent_path] = (
                        get_first_selected_row_idx(parent_store["rows"])
                        if parent_store is not None
                        else None
                    )
                parent_data = deep_get_store(data_store, parent_parts, parent_selected_idx)
                if parent_data is None or len(parent_data) == 0:
                    continue
                parent_pk = primary_keys[parent_store_key]
                parent_idx = None
                for i, item in enumerate(parent_data):
                    if str(item.get(parent_pk)) == str(parent_id):
                        parent_idx = i
                        break
                if parent_idx is None:
                    continue
                sync_store_selection(parent_store_key, parent_idx, None, False)

        return sync_parent_widgets

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
            self._ensure_selected_rows(".".join(path_parts[:i]))
        selected_rows_store = self.selected_rows[store_key]
        selected_rows_by_store = self.selected_rows
        data_store = self.data
        deep_get_store = DataWidgetFactory._deep_get_store
        empty_store = create_store([])

        @component
        def SelectedFieldView():
            parent_selected_idx = {}
            for i in range(1, len(path_parts)):
                parent_path = ".".join(path_parts[:i])
                parent_rows = use_store_snapshot(selected_rows_by_store[parent_path]).get("rows")
                parent_selected_idx[parent_path] = get_first_selected_row_idx(parent_rows)
            view_store = deep_get_store(data_store, path_parts, parent_selected_idx) or empty_store
            rows = use_store_snapshot(view_store)
            row_idx = get_first_selected_row_idx(
                use_store_snapshot(selected_rows_store).get("rows")
            )
            current_idx = None
            if isinstance(row_idx, int) and rows and 0 <= row_idx < len(rows):
                current_idx = row_idx
            if current_idx is None:
                return fallback
            row = rows[current_idx]
            return row.get(shown_key, fallback)

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

    def create_table_widget(
        self,
        *,
        store_key,
        primary_key: str,
        fields: Sequence[FieldSpec],
        style: Optional[Dict[str, Any]] = None,
        handle: RefType[TableWidgetHandle] = None,
        accept_related_filter_keys: Union[bool, Sequence[str]] = True,
        on_selection_change: Optional[
            Callable[
                [Any, Optional[int], Optional[str], str, Any, Optional[List[Dict[str, int]]]], None
            ]
        ] = None,
        on_mouse_hover_row: Optional[Callable[[Any, int, List[str]], None]] = None,
        on_click_cell_content: Optional[Callable[[Any, int, str, Any], None]] = None,
    ) -> Tuple[Renderable, Renderable]:
        """
        Create a [`Table`][metanno.ui.Table] widget bound to a store entry.
        Field metadata is inferred from the underlying data, with optional
        callbacks for selection changes, hover, and cell content clicks. An
        imperative handle can be exposed for scrolling and filtering.

        Parameters
        ----------
        store_key : Any
            Key pointing to the list-like store to render.
        primary_key : str
            Field name that uniquely identifies each row (primary key).
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
            Inline style overrides applied to the table container.
        handle : RefType[TableWidgetHandle] | None
            Imperative handle exposing helpers :

            - `scroll_to_row_id(row_id)`: Scroll to the row with the given primary key
            - `scroll_to_row_idx(row_idx)`: Scroll to the specified row index.
            - `set_filter(col, value)`: Apply a filter on the given column.
            - `get_filters()`: Retrieve the current filter mapping.
            - `clear_filters()`: Clear all active filters.
            - `set_highlighted(row_ids)`: Highlight the specified rows by their IDs.
            - `get_adjacent_row_id(current_row_id, delta)`: Retrieve the next/previous
              row ID within the filtered view, wrapping around.
            - `get_adjacent_row_idx(current_row_idx, delta)`: Retrieve the next/previous
              row index within the filtered view, wrapping around.
        accept_related_filter_keys : bool | Sequence[str]
            Controls whether this table accepts filters broadcast by other views.
            `True` accepts all incoming filters, `False` accepts none, and a
            sequence restricts accepted filter keys.
        on_selection_change : Callable[
            [Any, Optional[int], Optional[str], str, Any, Optional[List[Dict[str, int]]]], None
        ] | None
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

        Returns
        -------
        Renderable
            A Pret component instance rendering the configured table.
        """
        # Server-side prep
        store_key = str(store_key)
        path_parts = store_key.split(".")
        empty_store = create_store([])

        # Table only support a subset of kinds for editing/viewing values
        KIND_MAP = {
            "radio": "text",
            "checkbox": "boolean",
            "select": "text",
            "autocomplete": "text",
        }
        columns = [{**c, "kind": KIND_MAP.get(c["kind"], c["kind"])} for c in fields]

        # Register handle
        handles = self.handles
        handle = handle or use_ref()
        if isinstance(accept_related_filter_keys, str):
            accept_related_filter_keys = [accept_related_filter_keys]
        if store_key not in handles:
            handles[store_key] = []
        handles[store_key].append([handle, "table", accept_related_filter_keys])
        self._register_pkey(store_key, primary_key)
        selected_rows_by_store = self.selected_rows
        selected_rows_store = selected_rows_by_store[store_key]
        data_store = self.data
        deep_get_store = DataWidgetFactory._deep_get_store
        initial_selected_idx = {}
        for i in range(1, len(path_parts)):
            parent_path = ".".join(path_parts[:i])
            parent_store = selected_rows_by_store.get(parent_path)
            initial_selected_idx[parent_path] = (
                get_first_selected_row_idx(parent_store["rows"])
                if parent_store is not None
                else None
            )
        initial_store = deep_get_store(data_store, path_parts, initial_selected_idx)
        self._register_table_columns(store_key, columns, initial_store)
        filter_related_tables = self.make_filter_related_tables()
        sync_store_selection = self.make_sync_store_selection(filter_related_tables)
        sync_parent_widgets = self.make_sync_parent_widgets(sync_store_selection)

        @component
        def TableWidget():
            position, set_position = use_state({"row_idx": None, "col": None, "mode": "SELECT"})

            parent_selected_idx = {}
            for i in range(1, len(path_parts)):
                parent_path = ".".join(path_parts[:i])
                parent_rows = use_store_snapshot(selected_rows_by_store[parent_path]).get("rows")
                parent_selected_idx[parent_path] = get_first_selected_row_idx(parent_rows)
            view_store = deep_get_store(data_store, path_parts, parent_selected_idx) or empty_store
            data = use_store_snapshot(view_store)
            selected_rows_snapshot = use_store_snapshot(selected_rows_store)
            filters, set_filters = use_state({})
            highlighted, set_highlighted = use_state([])
            suggestions, set_suggestions = use_state([])
            table_ref = use_ref()

            def row_matches_filters(row, active_filters):
                for key, raw_value in (active_filters or {}).items():
                    if raw_value is None or key not in row:
                        continue
                    needle = str(raw_value).lower()
                    if needle == "":
                        continue
                    if needle not in str(row.get(key, "")).lower():
                        return False
                return True

            def get_filtered_indices():
                if not filters:
                    return list(range(len(data)))
                return [i for i, row in enumerate(data) if row_matches_filters(row, filters)]

            def get_adjacent_row_id(current_row_id, delta):
                indices = get_filtered_indices()
                if not indices:
                    return None
                current_pos = None
                if current_row_id is not None:
                    for pos, idx in enumerate(indices):
                        if str(data[idx].get(primary_key)) == str(current_row_id):
                            current_pos = pos
                            break
                if current_pos is None:
                    current_pos = 0 if delta >= 0 else len(indices) - 1
                next_idx = indices[(current_pos + delta) % len(indices)] if len(indices) > 0 else 0
                return data[next_idx].get(primary_key)

            def get_adjacent_row_idx(current_row_idx, delta):
                indices = get_filtered_indices()
                if not indices:
                    return None
                current_pos = None
                if current_row_idx is not None and current_row_idx in indices:
                    current_pos = indices.index(current_row_idx)
                if current_pos is None:
                    current_pos = 0 if delta >= 0 else len(indices) - 1
                return indices[(current_pos + delta) % len(indices)]

            def set_filter(col, v):
                cleaned = dict(filters)
                if v is None:
                    cleaned.pop(col, None)
                else:
                    cleaned[col] = v
                set_filters(cleaned)

            use_imperative_handle(
                handle,
                lambda: {
                    "scroll_to_row_id": lambda key: table_ref.current.scroll_to_row_id(key),
                    "scroll_to_row_idx": lambda idx: table_ref.current.scroll_to_row_idx(idx),
                    "set_filter": lambda col, v: set_filter(col, v),
                    "get_filters": lambda: filters,
                    "clear_filters": lambda: set_filters({}),
                    "set_highlighted": set_highlighted,
                    "get_adjacent_row_id": get_adjacent_row_id,
                    "get_adjacent_row_idx": get_adjacent_row_idx,
                },
                [filters, data],
            )

            @use_event_callback
            def handle_cell_change(row_id, row_idx, col, new_value):
                view_store[row_idx][col] = new_value

            @use_event_callback
            def handle_input_change(row_id, row_idx, col, value, cause):
                value = value or ""
                options = next((c for c in columns if c["key"] == col), {}).get("options")
                if cause == "unmount":
                    set_suggestions(None)
                elif options is not None:
                    if cause == "mount":
                        set_suggestions(options)
                    elif cause == "type":
                        set_suggestions([c for c in options if value.lower() in c.lower()])

            @use_event_callback
            def handle_mouse_hover_row(row_id, row_idx, modkeys):
                if row_id is None:
                    set_highlighted([])
                    return
                set_highlighted([row_id])
                # Synchronize other widgets
                for other in handles.get(store_key, []):
                    # other_handle, other_kind, *_ = other
                    if other[0].current is None:
                        continue
                    if other[1] == "spans":
                        other[0].current.set_highlighted_spans([row_id])
                if on_mouse_hover_row:
                    on_mouse_hover_row(row_id, row_idx, modkeys)

            @use_event_callback
            def handle_position_change(row_id, row_idx, col, mode, cause, ranges=None):
                is_blur_event = cause == "blur"
                has_valid_row_idx = (
                    isinstance(row_idx, int) and not isinstance(row_idx, bool) and row_idx >= 0
                )
                has_ranges = ranges is not None and len(ranges) > 0

                if is_blur_event:
                    normalized_selected_rows = normalize_selected_rows(
                        selected_rows_snapshot.get("rows"),
                        None,
                        len(data),
                    )
                    row_idx = None
                    col = None
                    mode = "SELECT"
                elif has_valid_row_idx or has_ranges:
                    normalized_selected_rows = normalize_selected_rows(ranges, row_idx, len(data))
                else:
                    normalized_selected_rows = normalize_selected_rows(
                        selected_rows_snapshot.get("rows"),
                        None,
                        len(data),
                    )
                normalized_ranges = [{"row_idx": idx} for idx in normalized_selected_rows]
                set_position(
                    {
                        "row_idx": row_idx,
                        "col": col,
                        "mode": mode or "SELECT",
                    }
                )

                if not is_blur_event and len(normalized_selected_rows) > 0:
                    lead_idx = normalized_selected_rows[0]
                    sync_parent_widgets(store_key, lead_idx)
                    sync_store_selection(
                        store_key,
                        lead_idx,
                        handle,
                        True,
                        normalized_selected_rows,
                    )
                elif not is_blur_event:
                    selected_rows_store["rows"] = normalized_selected_rows
                if on_selection_change is not None:
                    on_selection_change(
                        row_id,
                        row_idx,
                        col,
                        mode,
                        cause,
                        normalized_ranges,
                    )

            selected_rows_value = normalize_selected_rows(
                selected_rows_snapshot.get("rows"),
                None,
                len(data),
            )
            position_row_idx = position.get("row_idx")
            if (
                not isinstance(position_row_idx, int)
                or position_row_idx < 0
                or position_row_idx >= len(data)
            ):
                position_row_idx = None
            selection_col = position.get("col")
            table_selection = {
                "row_idx": position_row_idx,
                "col": selection_col,
                "mode": position.get("mode") or "SELECT",
                "ranges": [{"row_idx": idx} for idx in selected_rows_value],
            }

            return Table(
                rows=data,
                primary_key=primary_key,
                columns=columns,
                filters=filters,
                selection=table_selection,
                multi_selection_mode="rows",
                suggestions=suggestions,
                highlighted_rows=highlighted,
                on_filters_change=lambda f, c: set_filters(f),
                on_input_change=handle_input_change,
                on_cell_change=handle_cell_change,
                on_selection_change=handle_position_change,
                on_mouse_hover_row=handle_mouse_hover_row,
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
        fields: Sequence[FieldSpec],
        style: Optional[Dict[str, Any]] = {},
        min_input_width: Optional[str] = None,
        add_navigation_buttons: bool = False,
        handle: Optional[Any] = None,
    ) -> Tuple[Renderable, Renderable]:
        """
        Render a single record from a store as a classic form with text, select,
        and boolean inputs. The current row can be changed via the imperative
        handle to keep multiple widgets in sync. When multiple rows are selected
        in a linked table, fields show mixed values and edits are applied to
        every selected row.

        Parameters
        ----------
        store_key : Any
            Key pointing to the collection to edit.
        primary_key : str
            Field name that uniquely identifies each row (primary key).
        fields : Sequence[FieldSpec]
            Field metadata used for rendering and editing:

            - `key`: Field key.
            - `name`: Field display name.
            - `kind`: Field data kind:

                - `"text"`: single-line text input.
                - `"select"`: dropdown select input.
                - `"autocomplete"`: autocomplete text input.
                - `"radio"`: radio button group.
                - `"boolean"`: checkbox input.

            - `editable`: If False, the field will be read-only.
            - `options`: If present, a dropdown/autocomplete/radio will be used.
        style : Dict[str, Any] | None
            Inline style overrides for the wrapping container.
        min_input_width : str | None
            Minimum width applied to each input control.
        add_navigation_buttons : bool
            Whether to display previous/next navigation buttons.
        handle : RefType[FormWidgetHandle] | None
            Imperative handle exposing helpers :

            - `set_row_idx(row_idx)`: Switch to the row with the given index.
            - `get_row_idx()`: Retrieve the currently active row index.

        Returns
        -------
        Renderable
            A Pret component instance rendering the editable form.
        """
        store_key = str(store_key)
        path_parts = store_key.split(".")
        empty_store = create_store([])
        fields = list(fields)

        # Register handle
        handle = handle or use_ref()
        if store_key not in self.handles:
            self.handles[store_key] = []
        self.handles[store_key].append([handle, "form"])
        self._register_pkey(store_key, primary_key)
        selected_rows_store = self.selected_rows[store_key]
        selected_rows_by_store = self.selected_rows
        data_store = self.data
        deep_get_store = DataWidgetFactory._deep_get_store
        handles = self.handles
        filter_related_tables = self.make_filter_related_tables()
        sync_store_selection = self.make_sync_store_selection(filter_related_tables)
        sync_parent_widgets = self.make_sync_parent_widgets(sync_store_selection)

        @component
        def FormWidget():
            parent_selected_idx = {}
            for i in range(1, len(path_parts)):
                parent_path = ".".join(path_parts[:i])
                parent_rows = use_store_snapshot(selected_rows_by_store[parent_path]).get("rows")
                parent_selected_idx[parent_path] = get_first_selected_row_idx(parent_rows)
            view_store = deep_get_store(data_store, path_parts, parent_selected_idx) or empty_store
            rows = use_store_snapshot(view_store)
            selected_rows_snapshot = use_store_snapshot(selected_rows_store)
            row_idx = get_first_selected_row_idx(selected_rows_snapshot.get("rows"))

            current_idx = None
            if isinstance(row_idx, int) and rows and 0 <= row_idx < len(rows):
                current_idx = row_idx

            current_row = rows[current_idx] if current_idx is not None else None
            selected_row_indices = normalize_selected_rows(
                selected_rows_snapshot.get("rows"),
                current_idx,
                len(rows),
            )
            selected_rows_data = [rows[idx] for idx in selected_row_indices]

            def get_table_handle():
                for other in handles.get(store_key, []):
                    # other_handle, other_kind, *_ = other
                    if other[1] == "table" and other[0].current is not None:
                        return other[0]
                return None

            def set_row_idx(idx, sync=False):
                if idx is None:
                    return
                if rows and (idx < 0 or idx >= len(rows)):
                    idx = 0
                if sync:
                    sync_parent_widgets(store_key, idx)
                    sync_store_selection(store_key, idx, handle, True, [idx])
                else:
                    selected_rows_store["rows"] = [idx]

            def nav(delta):
                if not rows:
                    return
                table_handle = get_table_handle()
                next_row_idx = None
                if table_handle is not None:
                    next_row_idx = table_handle.current.get_adjacent_row_idx(current_idx, delta)
                if next_row_idx is None:
                    if current_idx is None:
                        next_row_idx = 0 if delta >= 0 else len(rows) - 1
                    else:
                        next_row_idx = (current_idx + delta) % len(rows)
                if next_row_idx is None:
                    return
                set_row_idx(next_row_idx, sync=True)

            use_imperative_handle(
                handle,
                lambda: {
                    "get_row_idx": lambda: current_idx,
                    "set_row_idx": lambda idx: set_row_idx(idx),
                },
            )

            @use_event_callback
            def handle_field_change(key, value):
                if current_idx is None:
                    return
                if not selected_row_indices:
                    view_store[current_idx][key] = value
                    return
                with transact(view_store):
                    for idx in selected_row_indices:
                        view_store[idx][key] = value

            def get_field_state(field_key: str):
                if len(selected_rows_data) == 0:
                    current_value = current_row.get(field_key) if current_row is not None else None
                    return current_value, False
                first_value = selected_rows_data[0].get(field_key)
                is_mixed = any(
                    (row.get(field_key)) != first_value for row in selected_rows_data[1:]
                )
                if not is_mixed:
                    return first_value, False
                current_value = (
                    current_row.get(field_key) if current_row is not None else first_value
                )
                return current_value, True

            def render_form_field(field: Dict[str, Any]):
                field_value, field_is_mixed = get_field_state(field["key"])
                return render_field(
                    current_row,
                    field,
                    handle_field_change,
                    min_input_width,
                    value=field_value,
                    is_mixed=field_is_mixed,
                    use_explicit_value=True,
                )

            if not current_row:
                return div("No data available", style=style)

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

            return Stack(
                navigation_controls,
                *[render_form_field(f) for f in fields],
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
        fields: Sequence[FieldSpec],
        begin_key: str = "begin",
        end_key: str = "end",
        style_key: str = "style",
        label_key: str = "label",
        label_formatter: Optional[Callable[[Dict[str, Any]], str]] = None,
        button_key: str = "label",
        labels: Dict[str, Dict[str, Any]] = {},
        style: Optional[Dict[str, Any]] = None,
        handle: Optional[Any] = None,
        on_change_text_id: Optional[Callable[[Any], None]] = None,
        on_add_span: Optional[Callable[[List[str]], None]] = None,
        on_hover_spans: Optional[Callable[[List[str], List[str]], None]] = None,
        on_click_span: Optional[Callable[[str, List[str]], None]] = None,
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
            an empty store is created and managed locally.
        text_key : str
            Field name holding the raw text to annotate.
        text_primary_key : str
            Field name that uniquely identifies each text document.
        spans_primary_key : str
            Field name that uniquely identifies each span.
        fields : Sequence[FieldSpec]
            Field metadata for span fields, used in the inline editor.
        begin_key : str
            Field name for span start offsets.
        end_key : str
            Field name for span end offsets.
        style_key : str
            Field name for span styling configuration key.
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
            - `set_doc_idx(doc_idx)`: Switch to the document with the given index.
            - `get_doc_idx()`: Retrieve the currently active document index.
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
        Returns
        -------
        Tuple[Renderable, Renderable]
            A pair of Pret components: the toolbar widget and the text widget.
        """
        store_text_key = str(store_text_key)
        text_path_parts = store_text_key.split(".")
        store_spans_key = str(store_spans_key) if store_spans_key is not None else None
        spans_path_parts = store_spans_key.split(".") if store_spans_key is not None else None
        local_spans_store = create_store([]) if store_spans_key is None else None
        empty_store = create_store([])
        button_field_name = "Type"
        for field in fields:
            if field["key"] == button_field_name:
                button_field_name = field.get("name", button_field_name)
                break
        span_fields = [col for col in fields if col.get("editable")]
        span_field_by_key = {col.get("key"): col for col in span_fields}

        # Register handle
        handle = handle or use_ref()
        handles = self.handles
        if store_text_key not in handles:
            handles[store_text_key] = []
        handles[store_text_key].append([handle, "text"])
        if store_spans_key is not None:
            if store_spans_key not in handles:
                handles[store_spans_key] = []
            handles[store_spans_key].append([handle, "spans"])
        self._register_pkey(store_text_key, text_primary_key)
        selected_rows_by_store = self.selected_rows
        selected_doc_rows_store = selected_rows_by_store[store_text_key]
        data_store = self.data
        deep_get_store = DataWidgetFactory._deep_get_store
        empty_selected_rows_store = create_store({"rows": []})
        if store_spans_key is not None:
            self._register_pkey(store_spans_key, spans_primary_key)
        selected_span_rows_store = (
            selected_rows_by_store[store_spans_key]
            if store_spans_key is not None
            else empty_selected_rows_store
        )
        filter_related_tables = self.make_filter_related_tables()
        sync_store_selection = self.make_sync_store_selection(filter_related_tables)
        sync_parent_widgets = self.make_sync_parent_widgets(sync_store_selection)

        toolbar_state = create_store(
            {
                "move_mode": False,
                "action_id": 0,
                "action": None,
                "action_payload": None,
            }
        )

        def get_selected_span_indices(
            span_data: Sequence[Dict[str, Any]],
            selected_rows: Optional[Sequence[int]],
        ) -> List[int]:
            return normalize_selected_rows(selected_rows, None, len(span_data))

        def build_field_state_by_key(
            selected_spans: Sequence[Dict[str, Any]],
            fallback_span: Optional[Dict[str, Any]],
        ) -> Dict[str, Dict[str, Any]]:
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

        def get_adjacent_doc_idx(current_doc_idx, delta):
            table_handle = None
            for other in handles.get(store_text_key, []):
                # other_handle, other_kind, *_ = other
                if other[1] == "table":
                    table_handle = other[0]
                    break
            if table_handle is not None:
                return table_handle.current.get_adjacent_row_idx(current_doc_idx, delta)

        @component
        def Toolbar(
            on_add_span_click=None,
            on_delete=None,
            selected_span=None,
            on_update_span=None,
            span_fields=None,
            field_state_by_key=None,
            move_mode=False,
            on_toggle_move=None,
        ):
            field_state_by_key = field_state_by_key or {}
            button_state = field_state_by_key.get(button_key, {})
            button_is_mixed = button_state.get("is_mixed", False)
            btns = []
            for label, cfg in labels.items():
                if not selected_span or (
                    not button_is_mixed and selected_span.get(button_key) == label
                ):
                    sx = {
                        "backgroundColor": cfg["color"],
                        "color": "black",
                        "whiteSpace": "nowrap",
                    }
                else:
                    sx = {}

                def _handle_button_click(event=None, lab=label):
                    if selected_span and on_update_span:
                        on_update_span(button_key, lab)
                    else:
                        on_add_span_click(lab)

                btns.append(
                    ButtonGroup(
                        Button(
                            label,
                            on_click=_handle_button_click,
                            size="sm",
                            variant="soft",
                            sx=sx,
                        ),
                        Button(cfg["shortcut"], size="sm", variant="soft", sx=sx)
                        if cfg.get("shortcut")
                        else None,
                        sx={"display": "inline-flex", "alignItems": "flex-end"},
                    )
                )
            span_inputs = []
            if selected_span and on_update_span and span_fields:
                for col in span_fields:
                    if col["key"] != button_key:
                        field_state = field_state_by_key.get(col["key"], {})
                        span_inputs.append(
                            render_field(
                                selected_span,
                                col,
                                on_update_span,
                                min_input_width=None,
                                align_self="stretch",
                                value=field_state.get("value"),
                                is_mixed=field_state.get("is_mixed", False),
                                use_explicit_value=True,
                            )
                        )

            return Stack(
                FormControl(
                    FormLabel(button_field_name),
                    Stack(
                        *btns,
                        Button(
                            "Delete ⌫",
                            color="danger",
                            size="sm",
                            on_click=on_delete,
                            sx={"p": "0 8px"},
                        ),
                        Button(
                            "Move",
                            size="sm",
                            variant="solid" if move_mode else "soft",
                            color="primary" if move_mode else "neutral",
                            on_click=on_toggle_move,
                            sx={"p": "0 8px"},
                        )
                        if selected_span
                        else None,
                        direction="row",
                        spacing=1,
                        use_flex_gap=True,
                        sx={"alignItems": "flex-end", "flexWrap": "wrap"},
                    ),
                ),
                Stack(
                    *span_inputs,
                    direction="row",
                    spacing=1,
                    use_flex_gap=True,
                    sx={"alignItems": "flex-end"},
                )
                if span_inputs
                else None,
                direction="row",
                spacing=1,
                use_flex_gap=True,
                sx={"alignItems": "flex-end", "flexWrap": "wrap"},
            )

        @component
        def ToolbarWidget():
            toolbar_snapshot = use_store_snapshot(toolbar_state)
            selected_span_rows_snapshot = use_store_snapshot(selected_span_rows_store)
            action_id_ref = use_ref(toolbar_snapshot.get("action_id", 0))

            parent_selected_idx = {}
            if spans_path_parts is not None:
                for i in range(1, len(spans_path_parts)):
                    parent_path = ".".join(spans_path_parts[:i])
                    parent_rows = use_store_snapshot(selected_rows_by_store[parent_path]).get(
                        "rows"
                    )
                    parent_selected_idx[parent_path] = get_first_selected_row_idx(parent_rows)
            toolbar_spans_store = (
                deep_get_store(data_store, spans_path_parts, parent_selected_idx) or empty_store
                if spans_path_parts is not None
                else local_spans_store
            )
            toolbar_span_data = use_store_snapshot(toolbar_spans_store)

            selected_span_indices = get_selected_span_indices(
                toolbar_span_data,
                selected_span_rows_snapshot.get("rows"),
            )
            selected_spans = [toolbar_span_data[idx] for idx in selected_span_indices]
            selected_span = selected_spans[0] if len(selected_spans) > 0 else None
            field_state_by_key = build_field_state_by_key(selected_spans, selected_span)

            def emit_action(action, payload=None):
                action_id_ref.current += 1
                toolbar_state["action_id"] = action_id_ref.current
                toolbar_state["action"] = action
                toolbar_state["action_payload"] = payload

            def handle_add_or_update(label):
                emit_action("label_click", {"label": label})

            def handle_delete(event=None):
                emit_action("delete")

            def handle_toggle_move(event=None):
                emit_action("toggle_move")

            def handle_update_span(key, value):
                emit_action("update_span", {"key": key, "value": value})

            return Toolbar(
                on_add_span_click=handle_add_or_update,
                on_delete=handle_delete,
                selected_span=selected_span,
                on_update_span=handle_update_span,
                span_fields=span_fields,
                field_state_by_key=field_state_by_key,
                move_mode=toolbar_snapshot.get("move_mode", False),
                on_toggle_move=handle_toggle_move,
            )

        @component
        def TextWidget():
            parent_selected_idx = {}
            for i in range(1, len(text_path_parts)):
                parent_path = ".".join(text_path_parts[:i])
                parent_rows = use_store_snapshot(selected_rows_by_store[parent_path]).get("rows")
                parent_selected_idx[parent_path] = get_first_selected_row_idx(parent_rows)
            if spans_path_parts is not None:
                for i in range(1, len(spans_path_parts)):
                    parent_path = ".".join(spans_path_parts[:i])
                    if parent_path in parent_selected_idx:
                        continue
                    parent_rows = use_store_snapshot(selected_rows_by_store[parent_path]).get(
                        "rows"
                    )
                    parent_selected_idx[parent_path] = get_first_selected_row_idx(parent_rows)

            text_store = (
                deep_get_store(data_store, text_path_parts, parent_selected_idx) or empty_store
            )
            spans_store = (
                deep_get_store(data_store, spans_path_parts, parent_selected_idx) or empty_store
                if spans_path_parts is not None
                else local_spans_store
            )
            text_data = use_store_snapshot(text_store)
            span_data = use_store_snapshot(spans_store)
            selected_doc_rows_snapshot = use_store_snapshot(selected_doc_rows_store)
            selected_span_rows_snapshot = use_store_snapshot(selected_span_rows_store)

            doc_idx = get_first_selected_row_idx(selected_doc_rows_snapshot.get("rows"))
            persistent_doc_idx = doc_idx
            selected_ranges, set_selected_ranges = use_state([])
            highlighted, set_highlighted = use_state([])
            toolbar_snapshot = use_store_snapshot(toolbar_state)
            selected_span_idx = get_first_selected_row_idx(selected_span_rows_snapshot.get("rows"))
            move_mode = bool(toolbar_snapshot.get("move_mode", False))
            last_action_id_ref = use_ref(0)

            current_doc = (
                text_data[persistent_doc_idx]
                if isinstance(persistent_doc_idx, int) and 0 <= persistent_doc_idx < len(text_data)
                else None
            )
            current_doc_id = current_doc[text_primary_key] if current_doc else None

            text_ref = use_ref()
            pending_span_ids_ref = use_ref(None)
            suppress_next_empty_select_clear_ref = use_ref(False)
            is_mounting_ref = use_ref(True)

            def set_selected_span_rows(selected_rows: Optional[Sequence[int]] = None):
                selected_span_rows_store["rows"] = normalize_selected_rows(
                    selected_rows,
                    None,
                    len(span_data),
                )

            def set_selected_span(span_id):
                if span_id is None:
                    set_selected_span_rows([])
                    return
                idx = next(
                    (
                        i
                        for i, span in enumerate(span_data)
                        if str(span.get(spans_primary_key)) == str(span_id)
                    ),
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
                return get_selected_span_indices(
                    span_data,
                    selected_span_rows_snapshot.get("rows"),
                )

            def set_doc_idx(idx):
                if idx is None:
                    return
                if text_data and (idx < 0 or idx >= len(text_data)):
                    idx = 0
                selected_doc_rows_store["rows"] = [idx]

            def get_doc_id_by_idx(idx):
                if idx is None or not (0 <= idx < len(text_data)):
                    return None
                return text_data[idx].get(text_primary_key)

            def scroll_to_top():
                if is_mounting_ref.current:
                    if current_doc_id is not None:
                        is_mounting_ref.current = False
                    return
                if text_ref.current:
                    text_ref.current.scroll_to_line(0, "instant")

            def handle_text_change(new_doc_idx):
                if new_doc_idx is None:
                    return
                new_doc_id = get_doc_id_by_idx(new_doc_idx)
                if new_doc_id is None:
                    return

                # Synchronize other widgets
                sync_store_selection(store_text_key, new_doc_idx, handle, True)
                sync_parent_widgets(store_text_key, new_doc_idx)

                if on_change_text_id:
                    on_change_text_id(new_doc_id)

            def ensure_initial_doc_selection():
                if len(selected_doc_rows_store["rows"]) == 0 and len(text_data) > 0:
                    selected_doc_rows_store["rows"] = [0]

            use_effect(ensure_initial_doc_selection, [text_store])
            use_effect(scroll_to_top, [current_doc_id])

            use_imperative_handle(
                handle,
                lambda: {
                    "scroll_to_span": lambda key: text_ref.current.scroll_to_span(key),
                    "set_doc_idx": set_doc_idx,
                    "get_doc_idx": lambda: persistent_doc_idx,
                    "set_highlighted_spans": set_highlighted,
                    "set_selected_span": set_selected_span,
                },
                [text_data, span_data, persistent_doc_idx],
            )

            def handle_mouse_hover_spans(span_ids: List[str], mod_keys: List[str]):
                set_highlighted(span_ids)

                # Synchronize other widgets
                for other in handles.get(store_spans_key, []):
                    # other_handle, other_kind, *_ = other
                    if other[0].current is None:
                        continue
                    if other[1] == "table":
                        other[0].current.set_highlighted(span_ids)

                if on_hover_spans:
                    on_hover_spans(span_ids, mod_keys)

            def update_selected_span(key, value):
                col = span_field_by_key.get(key)
                if col and col.get("kind") == "boolean":
                    value = bool(value)

                selected_indices = get_current_selected_span_indices()
                if not selected_indices:
                    return
                for i in selected_indices:
                    spans_store[i][key] = value
                if selected_span_idx is None or selected_span_idx < 0:
                    set_selected_span_rows(selected_indices)

            def filter_doc_spans():
                selected_ids = {
                    span_data[idx].get(spans_primary_key)
                    for idx in get_current_selected_span_indices()
                    if 0 <= idx < len(span_data)
                }
                return [
                    {
                        "highlighted": span[spans_primary_key] in highlighted,
                        "selected": span[spans_primary_key] in selected_ids,
                        **span,
                    }
                    for span in span_data
                    if (
                        text_primary_key not in span
                        or str(span[text_primary_key]) == str(current_doc_id)
                    )
                ]

            doc_spans = use_memo(
                filter_doc_spans,
                [
                    span_data,
                    current_doc_id,
                    highlighted,
                    selected_span_rows_snapshot.get("rows"),
                ],
            )

            def flush_pending_span_scroll():
                if pending_span_ids_ref.current is None:
                    return
                span_ids = pending_span_ids_ref.current
                doc_span_ids = {span[spans_primary_key] for span in doc_spans}
                if not any(span_id in doc_span_ids for span_id in span_ids):
                    return
                pending_span_ids_ref.current = None
                if on_add_span:

                    def after_timeout():
                        last_span_id = span_ids[len(span_ids) - 1]
                        last_span_idx = next(
                            i
                            for i, span in enumerate(spans_store)
                            if span[spans_primary_key] == last_span_id
                        )
                        set_selected_span_rows([last_span_idx])
                        if store_spans_key is not None:
                            sync_store_selection(
                                store_spans_key,
                                last_span_idx,
                                handle,
                                False,
                                [last_span_idx],
                            )
                        on_add_span(span_ids)

                    # TODO replace with await on transaction when supported
                    setTimeout(after_timeout, 100)  # noqa: F821

            use_effect(flush_pending_span_scroll)

            @use_event_callback
            async def handle_add_span(label):
                if not current_doc_id or not selected_ranges:
                    return
                added_span_ids = []
                for r in selected_ranges:
                    text_content = current_doc[text_key][r["begin"] : r["end"]]
                    span_id = f"{current_doc_id}-{r['begin']}-{r['end']}-{label}"
                    if label in labels and "defaults" in labels[label]:
                        span_defaults = labels[label]["defaults"]
                    else:
                        span_defaults = {}
                    spans_store.append(
                        {
                            "text": text_content,
                            spans_primary_key: span_id,
                            begin_key: r["begin"],
                            end_key: r["end"],
                            button_key: label,
                            # todo, only add when spans use the key ?
                            #    we would actually maybe need to analyze the
                            #    shape of the full data first, in init for instance.
                            text_primary_key: current_doc_id,
                            **span_defaults,
                        }
                    )
                    added_span_ids.append(span_id)
                set_selected_ranges([])
                if text_ref.current:
                    text_ref.current.clear_current_mouse_selection()
                if added_span_ids:
                    set_move_mode(False)
                    pending_span_ids_ref.current = added_span_ids

            @use_event_callback
            def on_delete():
                selected_indices = get_current_selected_span_indices()
                if selected_indices:
                    to_remove = sorted(selected_indices, reverse=True)
                    with transact(spans_store):
                        for idx in to_remove:
                            del spans_store[idx]
                    set_selected_span_rows([])
                    return
                to_remove = []
                for idx, span in enumerate(spans_store):
                    if text_primary_key in span and str(span.get(text_primary_key)) != str(
                        current_doc_id
                    ):
                        continue
                    for r in selected_ranges:
                        if not (span["end"] <= r["begin"] or r["end"] <= span["begin"]):
                            to_remove.append(span)
                            break
                with transact(spans_store):
                    for item in sorted(to_remove, reverse=True):
                        del spans_store[item]
                if to_remove:
                    set_selected_ranges([])

            @use_event_callback
            def handle_toggle_move(event=None):
                toggle_move_mode()

            @use_event_callback
            def on_key_press(k, modkeys, selection):
                next_idx = None
                if k == "ArrowRight":
                    next_idx = get_adjacent_doc_idx(persistent_doc_idx, 1)
                    if next_idx is None and text_data:
                        next_idx = (persistent_doc_idx + 1) % len(text_data)
                elif k == "ArrowLeft":
                    next_idx = get_adjacent_doc_idx(persistent_doc_idx, -1)
                    if next_idx is None and text_data:
                        next_idx = (persistent_doc_idx - 1) % len(text_data)

                if next_idx is not None:
                    handle_text_change(next_idx)
                    return

                if k == "Backspace":
                    on_delete()
                else:
                    for label, cfg in labels.items():
                        if k == cfg.get("shortcut"):
                            handle_add_span(label)
                            break

            def handle_toolbar_action():
                action_id = toolbar_snapshot.get("action_id", 0)
                if action_id == last_action_id_ref.current:
                    return
                last_action_id_ref.current = action_id
                action = toolbar_snapshot.get("action")
                payload = toolbar_snapshot.get("action_payload") or {}
                selected_indices = get_current_selected_span_indices()
                if action == "label_click":
                    label = payload.get("label")
                    if not label:
                        return
                    if len(selected_indices) > 0:
                        update_selected_span(button_key, label)
                    else:
                        handle_add_span(label)
                elif action == "delete":
                    on_delete()
                elif action == "toggle_move":
                    toggle_move_mode()
                elif action == "update_span":
                    key = payload.get("key")
                    if key is None:
                        return
                    update_selected_span(key, payload.get("value"))

            use_effect(handle_toolbar_action, [toolbar_snapshot.get("action_id", 0)])

            if not current_doc:
                return div("No document selected")

            def handle_click_span(span_id, modkeys):
                if span_id is None:
                    set_selected_span_rows([])
                    return
                clicked_idx = next(
                    (
                        i
                        for i, span in enumerate(spans_store)
                        if str(span.get(spans_primary_key)) == str(span_id)
                    ),
                    None,
                )
                if clicked_idx is None:
                    return
                shift_pressed = bool(
                    modkeys and any(str(key).lower() == "shift" for key in modkeys)
                )
                current_selected_rows = selected_span_rows_snapshot.get("rows") or []
                next_selected_rows = (
                    normalize_selected_rows(
                        [*current_selected_rows, clicked_idx],
                        clicked_idx,
                        len(span_data),
                    )
                    if shift_pressed
                    else [clicked_idx]
                )
                suppress_next_empty_select_clear_ref.current = True
                set_selected_span_rows(next_selected_rows)
                if store_spans_key is not None and len(next_selected_rows) > 0:
                    sync_store_selection(
                        store_spans_key,
                        next_selected_rows[0],
                        handle,
                        False,
                        next_selected_rows,
                    )
                set_move_mode(False)

                # auto synchronization with other text widgets
                for other in handles.get(store_spans_key, []):
                    # other_handle, other_kind, *_ = other
                    if other[1] == "table" and other[0].current:
                        other[0].current.set_highlighted([span_id])
                        other[0].current.scroll_to_row_id(span_id)
                if on_click_span:
                    on_click_span(span_id, modkeys)

            def handle_mouse_select(ranges, modkeys):
                if len(ranges) == 0 and suppress_next_empty_select_clear_ref.current:
                    suppress_next_empty_select_clear_ref.current = False
                    set_selected_ranges(ranges)
                    return
                if (
                    move_mode
                    and selected_span_idx is not None
                    and 0 <= selected_span_idx < len(spans_store)
                    and len(ranges) > 0
                ):
                    r = ranges[0]
                    spans_store[selected_span_idx][begin_key] = r["begin"]
                    spans_store[selected_span_idx][end_key] = r["end"]
                    spans_store[selected_span_idx]["text"] = current_doc[text_key][
                        r["begin"] : r["end"]
                    ]
                    set_selected_span_rows([selected_span_idx])
                    set_move_mode(False)
                    set_selected_ranges([])
                    if text_ref.current:
                        text_ref.current.clear_current_mouse_selection()
                    return
                elif len(ranges) > 0:
                    set_selected_span_rows([])
                elif (
                    selected_span_idx is not None and selected_span_idx >= 0
                ) or selected_span_rows_snapshot.get("rows"):
                    set_selected_span_rows([])
                set_selected_ranges(ranges)

            return div(
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
                    label_formatter=label_formatter,
                    on_key_press=on_key_press,
                    on_mouse_select=handle_mouse_select,
                    on_mouse_hover_spans=handle_mouse_hover_spans,
                    on_click_span=handle_click_span,
                    handle=text_ref,
                    style={"flex": 1, "minHeight": 0, "overflow": "scroll", **(style or {})},
                ),
                style={
                    "display": "flex",
                    "flexDirection": "column",
                    "flex": 1,
                    "minHeight": 0,
                    **(style or {}),
                },
            )

        return TextWidget(), ToolbarWidget()

    def create_connection_status_bar(self):
        is_synced = self.is_synced

        @component
        def StatusBar():
            status = use_connection_status()
            if status["connected"]:
                connected = "Connected"
                color = "success"
            elif is_synced:
                connected = "Disconnected"
                color = "danger"
            else:
                connected = "Offline (changes won't be saved)"
                color = "neutral"

            return Box(
                Typography(f"Connection status: {connected}", level="body-sm", color=color),
                sx={
                    "width": "100%",
                    "px": 1.5,
                    "py": 0.25,
                    "borderTop": "1px solid var(--joy-palette-divider, #d6d6d6)",
                    "background": "var(--joy-palette-background-surface, #fff)",
                },
            )

        return StatusBar()
