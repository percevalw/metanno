import sys
from typing import Any, Union
from pret.render import stub_component
from pret.bridge import make_stub_js_module, js, pyodide

make_stub_js_module("Metanno", "./client/components", __name__)

if sys.version_info >= (3, 8):
    from typing import Literal
else:
    from typing_extensions import Literal

props_mapping = {
 "on_key_press": "onKeyPress",
 "on_click_span": "onClickSpan",
 "on_mouse_enter_span": "onMouseEnterSpan",
 "on_mouse_leave_span": "onMouseLeaveSpan",
 "on_mouse_select": "onMouseSelect",
 "mouse_selection": "mouseSelection",
 "row_key": "rowKey",
 "input_value": "inputValue",
 "on_position_change": "onPositionChange",
 "on_filters_change": "onFiltersChange",
 "on_click_cell_content": "onClickCellContent",
 "on_mouse_enter_row": "onMouseEnterRow",
 "on_mouse_leave_row": "onMouseLeaveRow",
 "on_cell_change": "onCellChange",
 "on_input_change": "onInputChange",
 "on_scroll_bottom": "onScrollBottom",
 "highlighted_rows": "highlightedRows",
 "on_click_shape": "onClickShape",
 "on_mouse_enter_shape": "onMouseEnterShape",
 "on_mouse_leave_shape": "onMouseLeaveShape"
}

@stub_component(js.Metanno.TextComponent, props_mapping)
def TextComponent(*children, key: Union[str, int], ref: Any, actions: Any, on_key_press: Any, on_click_span: Any, on_mouse_enter_span: Any, on_mouse_leave_span: Any, on_mouse_select: Any, text: Any, spans: Any, mouse_selection: Any, styles: Any):
    """"""
@stub_component(js.Metanno.TableComponent, props_mapping)
def TableComponent(*children, key: Union[str, int], ref: Any, actions: Any, on_key_press: Any, rows: Any, row_key: Any, columns: Any, suggestions: Any, input_value: Any, position: Any, on_position_change: Any, on_filters_change: Any, on_click_cell_content: Any, on_mouse_enter_row: Any, on_mouse_leave_row: Any, on_cell_change: Any, on_input_change: Any, on_scroll_bottom: Any, highlighted_rows: Any, filters: Any):
    """"""
@stub_component(js.Metanno.ImageComponent, props_mapping)
def ImageComponent(*children, key: Union[str, int], image: str, annotations: Any, mouse_selection: Any, styles: Any, actions: Any, on_key_press: Any, on_click_shape: Any, on_mouse_enter_shape: Any, on_mouse_leave_shape: Any, on_mouse_select: Any):
    """"""
