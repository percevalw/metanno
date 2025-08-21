
import sys
from typing import Any, Union, List, TypedDict, Optional, Dict, Callable
from pret.render import stub_component
from pret.marshal import js, make_stub_js_module, marshal_as
from metanno import __version__

_py_package_name = "metanno"
_js_package_name = "metanno"
_js_global_name = "Metanno"

make_stub_js_module("Metanno", "metanno", "metanno", __version__, __name__)

if sys.version_info >= (3, 8):
    from typing import Literal
else:
    from typing_extensions import Literal

props_mapping = {
 "annotation_styles": "annotationStyles",
 "mouse_selection": "mouseSelection",
 "on_click": "onClick",
 "on_key_press": "onKeyPress",
 "on_mouse_enter_shape": "onMouseEnterShape",
 "on_mouse_leave_shape": "onMouseLeaveShape",
 "on_mouse_select": "onMouseSelect",
 "highlighted_rows": "highlightedRows",
 "input_value": "inputValue",
 "on_input_change": "onInputChange",
 "on_scroll_bottom": "onScrollBottom",
 "row_key": "rowKey",
 "auto_filter": "autoFilter",
 "on_cell_change": "onCellChange",
 "on_click_cell_content": "onClickCellContent",
 "on_filters_change": "onFiltersChange",
 "on_mouse_enter_row": "onMouseEnterRow",
 "on_mouse_leave_row": "onMouseLeaveRow",
 "on_position_change": "onPositionChange",
 "on_subset_change": "onSubsetChange",
 "on_click_span": "onClickSpan",
 "on_mouse_enter_span": "onMouseEnterSpan",
 "on_mouse_leave_span": "onMouseLeaveSpan"
}

@stub_component(js.Metanno.AnnotatedImage, props_mapping)
def AnnotatedImage(*children, annotations: Any, annotation_styles: Any, image: str, mouse_selection: Any, style: Any, actions: Any, key: Union[str, int], on_click: Any, on_key_press: Any, on_mouse_enter_shape: Any, on_mouse_leave_shape: Any, on_mouse_select: Any):
    """
    An interactive image viewer that supports drawing, selecting, and styling
    geometric shapes (polygons, rectangles, points...) as annotations.

    Under the hood, we use [Konva](https://konvajs.org/api/Konva.html) to render
    the image and its annotations.

    Examples
    --------

    <!-- blacken-docs:off -->
    ```python { .render-with-pret style="height: 300px" }
    from pret import component, create_store, use_store_snapshot, use_event_callback
    from pret.ui.metanno import AnnotatedImage
    import time

    # Reactive store holding the annotation list
    img_state = create_store([
        {
            "id": "1",
            "type": "polygon",
            "points": [10, 10, 50, 20],
            "label": "OBJ",
            "style": "primary",
        }
    ])

    # Style preset referenced from the annotation above
    img_annotation_styles = {
        "primary": {
            "strokeColor": "red",
            "strokeWidth": 2,
            "fillColor": "rgba(255,0,0,0.5)",
            "labelPosition": "center",
            "align": "center",
            "verticalAlign": "top",
        },
        "secondary": {
            "strokeColor": "blue",
            "strokeWidth": 2,
            "fillColor": "#0000ff80",
            "textColor": "white",
        }
    }

    @component
    def MyImage():
        tracked_state = use_store_snapshot(img_state)

        @use_event_callback
        def on_mouse_select(modkeys, shapes):
            # Toggle 'mouseSelected' flag
            for shp in shapes:
                img_state.append({
                    "id": str(time.time()),
                    "points": shp["points"],
                    "label": "OBJ",
                    "style": "primary",
                })

        @use_event_callback
        def on_click(shape_idx, modkeys):
            if shape_idx is None:
                img_state.clear()
            else:
                old_style = img_state[shape_idx].get("style", "primary")
                new_style = "secondary" if old_style == "primary" else "primary"
                img_state[shape_idx]["style"] = new_style

        return AnnotatedImage(
            image="https://picsum.photos/400/300",
            annotations=tracked_state,
            annotation_styles=img_annotation_styles,
            on_mouse_select=on_mouse_select,
            on_click=on_click,
        )

    MyImage()
    ```
    <!-- blacken-docs:on -->

    Parameters
    ----------
    annotations: List[ImageAnnotation]
        List of annotation objects drawn on top of the image.
        Each annotation *must* contain the geometric `type` and `points`
        fields (defining the shape) plus optional metadata such as:

        - `id`: Optional unique identifier.
        - `label`: Human-readable text shown next to the shape.
        - `style`: Key that looks up visual properties in *`annotation_styles`*.
        - `selected` / `highlighted` / `mouseSelected`: Booleans used by the
          component when rendering interaction state.
    annotation_styles: Dict[str, ImageAnnotationStyle]
        Named style presets referenced by the `style` field of an
        annotation.  Each preset may define properties such as stroke color,
        fill color, opacity, font size, and label alignment, using the following properties:

        - `strokeColor` (str): Color of the shape's stroke (e.g. `"#ff0000"`).
        - `strokeWidth` (int): Width of the shape's stroke in pixels.
        - `fillColor` (str): Background color of the shape (e.g. `"#0000ff80"`).
        - `opacity` (float): Opacity of the shape's fill (0.0 to 1.0).
        - `shape` (str): Shape type, e.g. `"polygon"`, `"rectangle"`, `"circle"`, etc.
        - `fontSize` (int): Font size for the label text.
        - `align` ("left" | "center" | "right"): Horizontal alignment of the label text.
        - `verticalAlign` ("top" | "middle" | "bottom"): Vertical alignment of the label text.
    image: str
        Source URL or base-64 data URI of the image to annotate.
    mouse_selection: List[Shape]
        Temporary shapes being drawn by the user while the mouse button is held
        down.  Supplied back to `on_mouse_select` when the gesture ends.
    style: Dict[str, Any]
        Inline CSS-compatible style overrides for the root element of the
        component.
    actions: Dict[str, Any]
        Optional imperative handles (e.g. `actions["scroll_to_shape"](idx)`)
        that the parent may call.  Reserved for future expansion.
    key: Union[str, int]
        React key for stable reconciliation.
    on_click: Callable[[Any, List[str]], None]
        Invoked when the user clicks on an existing shape.

        - `shape_id` – Identifier of the clicked annotation
        - `modkeys` – List of pressed modifier keys (e.g. `["Shift"]`)
    on_key_press: Callable[[str, List[str]], None]
        Invoked when the component has focus and the user presses a key.

        - `key` – The key name (`"Escape"`, `"Delete"` …)
        - `modkeys` – Concurrently pressed modifier keys
    on_mouse_enter_shape / on_mouse_leave_shape: Callable[[Any, List[str]], None]
        Hover callbacks fired when the mouse pointer enters or leaves a shape.
    on_mouse_select: Callable[[List[str], List[Shape]], None]
        Fired after the user completes a drag selection.

        - `modkeys` – Modifier keys pressed during selection
        - `shapes` – All shapes inside the lasso / rectangle
    """

class Hyperlink(TypedDict):
    key: str
    text: str

class ColumnData(TypedDict):
    key: str
    name: str
    kind: str
    editable: bool
    filterable: bool
    choices: Optional[Any]

class Position(TypedDict):
    row_idx: int
    col: str
    mode: Literal["EDIT", "SELECT"]

@stub_component(js.Metanno.Table, props_mapping)
def Table(
    *children,
    columns: ColumnData,
    filters: Dict[str, str],
    highlighted_rows: List[int],
    row_key: str,
    rows: List[Dict[str, Any]],
    actions: Dict[str, Any],
    auto_filter: bool,
    input_value: Union[str, Hyperlink],
    suggestions: List[Any],
    position: Position,
    subset: Any,
    style: Dict[str, Any],
    key: Union[str,int],

    on_input_change: Callable,
    on_scroll_bottom: Callable,
    on_cell_change: Callable,
    on_click_cell_content: Callable,
    on_filters_change: Callable,
    on_key_press: Callable,
    on_mouse_enter_row: Callable,
    on_mouse_leave_row: Callable,
    on_position_change: Callable,
    on_subset_change: Callable,
):
    """
    A component for displaying a table with various features such as filtering, highlighting rows, and handling cell changes.

    Examples
    --------
    <!-- blacken-docs:off -->
    ```python { .render-with-pret style="min-height: 300px" }
    from pret import component, create_store, use_store_snapshot, use_event_callback
    from pret.ui.metanno import Table

    table_state = create_store([
        {"id": "1", "date": "2023-01-01", "text": "Sample text 1", "type": "ENT", "labels": ["ready"]},
        {"id": "2", "date": "2023-01-03", "text": "Sample text 2", "type": "OTHER", "labels": ["ready", "danger"]},
        {"id": "3", "date": "2023-01-05", "text": "Sample text 3", "type": "ENT", "labels": ["blue"]},
        {"id": "4", "date": "2023-01-07", "text": "Sample text 4", "type": "OTHER", "labels": ["bad"]},
        {"id": "5", "date": "2023-01-09", "text": "Sample text 5", "type": "ENT", "labels": []},
        {"id": "6", "date": "2023-01-11", "text": "Sample text 6", "type": "OTHER", "labels": ["custom"]},
        {"id": "7", "date": "2023-01-13", "text": "Sample text 7", "type": "FOO", "labels": ["ready"]},
        {"id": "8", "date": "2023-01-15", "text": "Sample text 8", "type": "FOO2", "labels": ["danger"]},
        {"id": "9", "date": "2023-01-17", "text": "Sample text 9", "type": "FOO3", "labels": ["blue"]},
        {"id": "10", "date": "2023-01-19", "text": "Sample text 10", "type": "ENT", "labels": ["bad"]},
        {"id": "11", "date": "2023-01-21", "text": "Sample text 11", "type": "OTHER", "labels": ["custom"]},
        {"id": "12", "date": "2023-01-23", "text": "Sample text 12", "type": "ENT", "labels": ["ready"]},
        {"id": "13", "date": "2023-01-25", "text": "Sample text 13", "type": "OTHER", "labels": ["danger"]},
        {"id": "14", "date": "2023-01-27", "text": "Sample text 14", "type": "FOO2", "labels": ["blue"]},
        {"id": "15", "date": "2023-01-29", "text": "Sample text 15", "type": "FOO3", "labels": ["bad"]},
    ])

    columns = [
        {"key": "id", "kind": "text", "name": "id", "filterable": True},
        {"key": "date", "kind": "text", "name": "end", "filterable": True},
        {"key": "text", "kind": "text", "name": "text", "filterable": True, "editable": True},
        {"key": "type", "kind": "text", "name": "label", "filterable": True, "editable": True, "choices": ["ENT", "OTHER", "STUFF", "FOO", "FOO2", "FOO3"]},
        {"key": "labels", "kind": "multi-text", "name": "labels", "filterable": True, "editable": True, "choices": ["ready", "danger", "blue", "bad", "custom"]},
    ]

    @component
    def MyTable():
        @use_event_callback
        def on_cell_change(row_idx, col, new_value):
            table_state[row_idx][col] = new_value

        view_state = use_store_snapshot(table_state)
        return Table(
            rows=view_state,
            columns=columns,
            auto_filter=True,
            on_cell_change=on_cell_change,
        )

    MyTable()
    ```
    <!-- blacken-docs:on -->

    Parameters
    ----------
    columns: "List[ColumnData]"
        The columns to display in the table:

        - `key`: Unique identifier for the column.
        - `name`: Display name of the column.
        - `kind`: Type of data in the column (e.g., "text", "hyperlink", "multi-text", "boolean", ...).
        - `editable`: Whether the column is editable.
        - `filterable`: Whether the column can be filtered.
        - `choices`: Optional list of choices for the column (if applicable).
    filters: Dict[str, str]
        The current filters applied to the table, mapping column keys to filter values.
    highlighted_rows: List[int]
        List of row indices that should be highlighted.
    row_key: str
        The key used to uniquely identify each row in the table.
    rows: List[Dict[str, Any]]
        The data for each row in the table, where each row is a dictionary mapping column keys to their values.
    actions: Dict[str, Any]
        Actions that can be performed on the table, such as scrolling.
    auto_filter: bool
        Whether to automatically apply filters as the user types.
    input_value: Union[str, Hyperlink]
        The current input value to show in the input field when the user is editing a cell.
        If undefined, this is automatically handled by the component.
    suggestions: List[Any]
        List of suggestions to show when the user is typing in the input field.
    position: Position
        The current position of the cursor in the table, including:

        - row_idx: Index of the row where the cursor is located.
        - col: Key of the column where the cursor is located.
        - mode: Mode of interaction, either "EDIT" or "SELECT".
    style: Dict[str, Any]
        Custom styles for the table component.
    key: Union[str, int]
        A unique key for the component instance, used for React's reconciliation.
    on_input_change: Callable[[int, str, Any, str], None]
        Callback triggered when the input value changes in a cell. Will be called with the following parameters:

        - `row_idx`: Index of the row being edited.
        - `name`: Key of the column being edited.
        - `value`: New value entered by the user.
        - `cause`: Reason for the change (e.g., "blur", "enter").
    on_scroll_bottom: Callable[[Union[UIEvent, Dict[str, bool]]], Any]
        Callback triggered when the user scrolls to the bottom of the table. Will be called with the following parameters:

        - `event`: Scroll event or a dictionary indicating if the user is at the bottom.
    on_cell_change: Callable[[int, str, Any], None]
        Callback triggered when a cell's value changes. Will be called with the following parameters:

        - `row_idx`: Index of the row being edited.
        - `name`: Key of the column being edited.
        - `value`: New value of the cell.
    on_click_cell_content: Callable[[int, str, Optional[Any]], Union[bool, None]]
        Callback triggered when the content of a cell is clicked (like a hyperlink). Will be called with the following parameters:

        - `row_idx`: Index of the row containing the clicked cell.
        - `name`: Key of the column containing the clicked cell.
        - `value`: Optional value of the clicked cell.
    on_filters_change: Callable[[Dict[str, str], str], None]
        Callback triggered when filters are updated. Will be called with the following parameters:

        - `values`: Dictionary mapping column keys to filter values.
        - `column`: Key of the column being filtered.
    on_mouse_enter_row: Callable[[int, List[str]], None]
        Callback triggered when the mouse enters a row. Will be called with the following parameters:

        - `row_idx`: Index of the row being hovered.
        - `mod_keys`: List of modifier keys pressed during the event.
    on_mouse_leave_row: Callable[[int, List[str]], None]
        Callback triggered when the mouse leaves a row. Will be called with the following parameters:

        - `row_idx`: Index of the row being hovered.
        - `mod_keys`: List of modifier keys pressed during the event.
    on_position_change: Callable[[Optional[int], Optional[str], str, str], None]
        Callback triggered when the cursor position changes. Will be called with the following parameters:

        - `row_idx`: Index of the row where the cursor is located, or `None` if not applicable.
        - `name`: Key of the column where the cursor is located, or `None` if not applicable.
        - `mode`: Interaction mode, either "EDIT" or "SELECT".
        - `cause`: Reason for the position change (e.g., "key", "blur").
    on_subset_change: Callable[[List[int]], None]
        Callback triggered when the subset of visible rows changes. Will be called with the following parameters:

        - `subset`: List of indices representing the new subset of rows.
    """
    ...

@stub_component(js.Metanno.AnnotatedText, props_mapping)
def AnnotatedText(
        *children,
        text: str,
        spans: List[Dict[str, Any]],
        annotation_styles: Dict[str, Dict[str, Any]],
        mouse_selection: List[Dict[str, int]],
        style: Dict[str, Any],
        actions: Dict[str, Any],
        key: Union[str, int],
        on_click_span: Callable[[str, List[str]], None],
        on_key_press: Callable[[str, List[Dict[str, int]], List[str]], None],
        on_mouse_enter_span: Callable[[str, List[str]], None],
        on_mouse_leave_span: Callable[[str, List[str]], None],
        on_mouse_select: Callable[[List[Dict[str, int]], List[str]], None]
):
    """
    The `AnnotatedText` is a rich text viewer that supports span-level annotations, nested token
    highlights, and various user event callbacks.

    Examples
    --------

    ```python { .render-with-pret }
    from pret import (
        component,
        create_store,
        use_store_snapshot,
        use_event_callback,
        use_state,
    )
    from pret.ui.metanno import AnnotatedText
    from pret.ui.joy import Button, Box

    txt = (
        "Metanno brings annotation components to Pret\\n"
        "to build tailored annotation tools."
    )

    # One span covering the word “Metanno”
    spans = create_store(
        [
            {
                "id": f"span-0-7",
                "begin": 0,
                "end": 7,
                "label": "OBJ",
                "highlighted": False,
            }
        ]
    )

    txt_annotation_styles = create_store(
        {
            "OBJ": {
                "color": "red",
                "shape": "underline",
            }
        }
    )


    @component
    def MyText():
        tracked_spans = use_store_snapshot(spans)
        tracked_styles = use_store_snapshot(txt_annotation_styles)

        @use_event_callback
        def handle_select(ranges, modkeys):
            for sp in ranges:
                spans.extend(
                    [
                        {
                            "id": f"span-{sp['begin']}-{sp['end']}",
                            "begin": sp["begin"],
                            "end": sp["end"],
                            "label": "OBJ",
                        }
                    ]
                )

        def on_mouse_enter_span(span_id, modkeys):
            for i, sp in enumerate(spans):
                if sp["id"] == span_id:
                    spans[i]["highlighted"] = True

        def on_mouse_leave_span(span_id, modkeys):
            for i, sp in enumerate(spans):
                if sp["id"] == span_id:
                    spans[i]["highlighted"] = False

        def on_span_style_change():
            old_style = txt_annotation_styles["OBJ"]["shape"]
            new_style = "box" if old_style == "underline" else "underline"
            txt_annotation_styles["OBJ"]["shape"] = new_style

        return Box(
            Button("Change style", on_click=on_span_style_change),
            Button("Remove annotations", on_click=lambda: spans.clear()),
            AnnotatedText(
                text=txt,
                spans=tracked_spans,
                annotation_styles=tracked_styles,
                on_mouse_select=handle_select,
                on_mouse_enter_span=on_mouse_enter_span,
                on_mouse_leave_span=on_mouse_leave_span,
                style={"gridColumn": "1 / -1"},
            ),
            sx={
                "p": 1,
                "display": "grid",
                "gridTemplateColumns": "repeat(2, auto)",
                "gap": 1,
            },
        )


    MyText()
    ```

    Parameters
    ----------
    text: str
        Raw text content shown in the viewer.
    spans: List[TextAnnotation]
        Span-level annotations over `text`.  Each span *must* include
        `begin` and `end` character offsets, with optional fields:

        - `id`: Optional unique identifier.
        - `label`: Category name displayed next to / above the span.
        - `style`: Key referencing `annotation_styles`.
        - `selected` (bool): styled as selected by the user.
        - `highlighted` (bool): styled as highlighted by the user.
    annotation_styles: Dict[str, TextAnnotationStyle]
        Named style presets that control span background color, border, label
        placement, etc. Each style may define properties such as:

        - `color` (str): Color of the span. Will be overridden by `backgroundColor` and `borderColor`.
        - `shape` ("underline" | "box"): Visual style of the span.
        - `backgroundColor` (str): Background color of the span (e.g. `"#0000ff80"`).
        - `borderColor` (str): Border color of the span (e.g. `"#000000"`).
        - `autoNestingLayout` (bool): Whether to automatically nest overlapping spans, rather than rendering them on top of each other.
    mouse_selection: List[TextRange]
        Current mouse drag selection expressed as character‐offset ranges.
        Passed to `on_mouse_select` when the action completes.
    style: Dict[str, Any]
        CSS style overrides for the outer element.
    actions: Dict[str, Any]
        Optional imperative helpers (`scroll_to_span` …, `clear_current_mouse_selection`).
    key: Union[str, int]
        React reconciliation key.
    on_click_span: Callable[[Any, List[str]], None]
        Called when the user clicks on a span.

        - `span_id` – Identifier of the clicked annotation
        - `modkeys` – Pressed modifier keys
    on_key_press: Callable[[str, List[TextRange], List[str]], None]
        Called when a key is pressed with focus inside the component.

        - `key` – Key name
        - `ranges` – Current selection ranges
        - `modkeys` – Modifier keys
    on_mouse_enter_span: Callable[[Any, List[str]], None]
        Called when the mouse pointer enters a span.

        - `span_id` – Identifier of the span entered
        - `modkeys` – Pressed modifier keys
    on_mouse_leave_span: Callable[[Any, List[str]], None]
        Called when the mouse pointer leaves a span.

        - `span_id` – Identifier of the span left
        - `modkeys` – Pressed modifier keys
    on_mouse_select: Callable[[List[TextRange], List[str]], None]
        Triggered when the user finishes selecting text with the mouse.

        - `ranges` – Final list of selected ranges
        - `modkeys` – Modifier keys
    """
