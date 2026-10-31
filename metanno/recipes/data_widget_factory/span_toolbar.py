"""
Span editing controls used by the text widget
"""

from pret import component
from pret_joy import Button, ButtonGroup, FormControl, FormLabel, Stack

from .fields import render_field


@component
def SpanToolbar(
    labels,
    button_key,
    button_field_name,
    on_add_span_click=None,
    on_delete=None,
    selected_span=None,
    selected_count=0,
    on_update_span=None,
    span_fields=None,
    field_state_by_key=None,
    move_mode=False,
    on_toggle_move=None,
):
    """
    Render label and field controls for the spans selected in the text widget
    """
    field_state_by_key = field_state_by_key or {}
    button_state = field_state_by_key.get(button_key, {})
    button_is_mixed = button_state.get("is_mixed", False)
    btns = []
    for label, cfg in labels.items():
        # Pages such as JupyterLab may uppercase button text, labels keep their case
        sx = {"textTransform": "none"}
        if not selected_span or (not button_is_mixed and selected_span.get(button_key) == label):
            sx = {**sx, "backgroundColor": cfg["color"], "color": "black", "whiteSpace": "nowrap"}

        def handle_button_click(event=None, lab=label):
            if selected_span and on_update_span:
                on_update_span(button_key, lab)
            else:
                on_add_span_click(lab)

        btns.append(
            ButtonGroup(
                Button(
                    label,
                    on_click=handle_button_click,
                    size="sm",
                    variant="soft",
                    sx=sx,
                ),
                # The shortcut key is a compact hint next to its label
                Button(
                    cfg["shortcut"],
                    size="sm",
                    variant="soft",
                    sx={**sx, "px": "6px", "minWidth": 0, "fontSize": "xs", "opacity": 0.8},
                )
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
                    f"Delete {selected_count} selected ⌫" if selected_count else "Delete ⌫",
                    color="danger",
                    size="sm",
                    on_click=on_delete,
                    sx={"p": "0 8px", "textTransform": "none"},
                ),
                Button(
                    "Move",
                    size="sm",
                    variant="solid" if move_mode else "soft",
                    color="primary" if move_mode else "neutral",
                    on_click=on_toggle_move,
                    sx={"p": "0 8px", "textTransform": "none"},
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
            sx={"alignItems": "flex-end", "flex": 1},
        )
        if span_inputs
        else None,
        direction="row",
        spacing=1,
        use_flex_gap=True,
        sx={"alignItems": "flex-end", "flexWrap": "wrap", "p": 1},
    )
