
import sys
from typing import Any, Union, List
from pret.render import stub_component
from pret.marshal import js, make_stub_js_module, marshal_as

__version__ = "0.10.0"
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
 "on_click_shape": "onClickShape",
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

@stub_component(js.Metanno.ImageComponent, props_mapping)
def ImageComponent(*children, annotations: Any, annotation_styles: Any, image: str, mouse_selection: Any, style: Any, actions: Any, key: Union[str, int], on_click_shape: Any, on_key_press: Any, on_mouse_enter_shape: Any, on_mouse_leave_shape: Any, on_mouse_select: Any):
    """"""
@stub_component(js.Metanno.TableComponent, props_mapping)
def TableComponent(*children, columns: Any, filters: Any, highlighted_rows: Any, input_value: Any, on_input_change: Any, on_scroll_bottom: Any, row_key: str, rows: Any, style: Any, actions: Any, auto_filter: bool, key: Union[str, int], on_cell_change: Any, on_click_cell_content: Any, on_filters_change: Any, on_key_press: Any, on_mouse_enter_row: Any, on_mouse_leave_row: Any, on_position_change: Any, on_subset_change: Any, position: Any, subset: Any, suggestions: Any):
    """"""
@stub_component(js.Metanno.TextComponent, props_mapping)
def TextComponent(*children, style: Any, actions: Any, annotation_styles: Any, key: Union[str, int], mouse_selection: Any, on_click_span: Any, on_key_press: Any, on_mouse_enter_span: Any, on_mouse_leave_span: Any, on_mouse_select: Any, ref: Any, spans: Any, text: Any):
    """"""
