"""
Field definitions, inference and editors used by factory forms and annotation toolbars
"""

from typing import Any, Callable, Dict, List, Optional, Sequence, Union

from pret import component
from pret.hooks import use_ref, use_state
from pret.react import div
from pret_joy import (
    Autocomplete,
    Checkbox,
    FormControl,
    FormLabel,
    Option,
    Radio,
    RadioGroup,
    Select,
    Textarea,
)
from typing_extensions import Literal, NotRequired, TypedDict

MIXED_VALUES_LABEL = "Multiple values"


@component
def TextField(key_name, label, value, editable, on_change, is_mixed, style):
    """
    Keep a field draft until blur or Enter and show rejected edits for correction. Long values wrap and
    grow up to 12 lines before scrolling, read only values stay selectable on a tinted background
    """
    draft, set_draft = use_state(None)
    error, set_error = use_state(None)
    pending = use_ref(False)

    async def commit(event=None):
        if draft is None or pending.current:
            return
        pending.current = True
        try:
            await on_change(key_name, draft)
            set_draft(None)
            set_error(None)
        except BaseException as reason:
            set_error(str(reason))
        finally:
            pending.current = False

    def handle_key(event):
        if event.key == "Escape":
            event.preventDefault()
            set_draft(None)
            set_error(None)
        elif event.key == "Enter" and not event.shiftKey:
            # Shift+Enter inserts a line break
            event.preventDefault()
            commit()

    return FormControl(
        FormLabel(make_field_label(label, is_mixed), sx={"fontSize": "inherit", "fontWeight": 400, "mb": 0.5}),
        Textarea(
            # Numbers and the arrays and objects of list and struct columns show as JSON text
            value=draft
            if draft is not None
            else ("" if is_mixed or value is None else value if isinstance(value, str) else JSON.stringify(value)),  # noqa: F821
            on_change=lambda event: set_draft(event.target.value),
            on_blur=commit,
            on_key_down=handle_key,
            tab_index=0,
            read_only=not editable,
            placeholder=MIXED_VALUES_LABEL if is_mixed else None,
            min_rows=1,
            max_rows=12,
            size="sm",
            sx={
                "fontSize": "inherit",
                **(
                    {}
                    if editable
                    else {
                        "background": "var(--joy-palette-background-level1)",
                        "boxShadow": "none",
                        "--Textarea-focusedThickness": "0px",
                    }
                ),
            },
        ),
        div(error, role="alert", class_name="metanno-error") if error else None,
        sx={
            **(style or {}),
            "gap": 0,
            "flex": "0 0 auto",
            "& > .MuiInput-formControl": {"mt": 0},
        },
    )


class FieldSpec(TypedDict):
    key: str
    name: NotRequired[str]
    kind: Literal["text", "boolean", "hyperlink", "select", "radio", "autocomplete"]
    editable: NotRequired[bool]
    filterable: NotRequired[bool]
    options: Optional[Union[Sequence[Any], Callable[[Any], Sequence[Any]]]]


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
    select_options = list(options)
    if len(select_options) == 0:
        return

    if kind == "autocomplete":
        if all_label is not None:
            select_options = [all_label, *select_options]
            value = all_label if value in (None, "") else value

        def handle_change(event, val):
            if all_label is not None and val == all_label:
                on_field_change(key, "")
            else:
                on_field_change(key, val)

        return FormControl(
            FormLabel(field_label),
            Autocomplete(
                options=select_options,
                value=None if is_mixed else value,
                on_change=handle_change,
                disabled=not editable,
                placeholder=MIXED_VALUES_LABEL if is_mixed else None,
                size="sm",
                sx={"flex": 1},
            ),
            sx={
                "minWidth": min_input_width or 0,
                "width": "fit-content",
                "alignSelf": align_self,
                "gridArea": key,
                "flex": 1,
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
                sx={"flex": 1},
            ),
            sx={
                "minWidth": min_input_width,
                "alignSelf": align_self,
                "gridArea": key,
                "flex": 1,
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
    return TextField(
        key_name=key,
        label=label,
        value=value,
        editable=editable,
        on_change=on_field_change,
        is_mixed=is_mixed,
        style={"minWidth": min_input_width, "alignSelf": align_self, "gridArea": key},
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
    def handle_change(event=None, checked=None):
        new_val = bool(checked) if checked is not None else getattr(getattr(event, "target", None), "checked", None)
        on_field_change(key, bool(new_val))

    return FormControl(
        FormLabel(make_field_label(label, is_mixed), sx={"fontSize": "inherit", "fontWeight": 400, "mb": 0.5}),
        Checkbox(
            checked=False if is_mixed else bool(value),
            indeterminate=is_mixed,
            on_change=handle_change,
            disabled=not editable,
            size="md",
            sx={"alignItems": "center", "fontSize": "inherit"},
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
