import sys
from enum import Enum
from typing import Union, List, Dict, Optional, Any, Protocol

if sys.version_info < (3, 11):
    from typing_extensions import TypedDict, NotRequired
else:
    from typing import TypedDict, NotRequired


class PositionMode(str, Enum):
    SELECT = "SELECT"
    EDIT = "EDIT"


class HyperLink(TypedDict):
    key: str
    text: str


Value = Dict[str, Union[str, bool, List[str], HyperLink, List[HyperLink]]]

Filters = NotRequired[Dict[str, str]]


class TextSpan(TypedDict):
    begin: int
    end: int


class TextAnnotation(TextSpan):
    label: str
    style: str
    id: str
    selected: NotRequired[bool]
    highlighted: NotRequired[bool]


class CSSProperties(TypedDict):
    fontSize: float
    fontFamily: str


class Style(CSSProperties):
    backgroundColor: str
    borderColor: str
    autoNestingLayout: bool
    labelPosition: str
    shape: str


class Button(TypedDict):
    label: str
    type: NotRequired[str]
    secondary: NotRequired[str]
    color: NotRequired[str]


class key_press_handler(Protocol):
    def __call__(self, key: str, modkeys: List[str], spans: List[TextSpan]):
        pass


class click_span_handler(Protocol):
    def __call__(self, span_id: any, modkeys: List[str]):
        pass


class mouse_enter_span_handler(Protocol):
    def __call__(self, span_id: any, modkeys: List[str]):
        pass


class mouse_leave_span_handler(Protocol):
    def __call__(self, span_id: any, modkeys: List[str]):
        pass


class mouse_select_handler(Protocol):
    def __call__(self, modkeys: List[str], spans: List[TextSpan]):
        pass



class TextAnnotatorViewActions(TypedDict):
    class scroll_to_line(Protocol):
        def __call__(self, number: int):
            ...

    class scroll_to_span(Protocol):
        def __call__(self):
            ...

    class clear_current_mouse_selection(Protocol):
        def __call__(self):
            ...


class ColumnType(str, Enum):
    hyperlink = "hyperlink"
    boolean = "boolean"
    text = "text"
    number = "number"


class Column(TypedDict):
    key: str
    name: str
    type: ColumnType
    mutable: bool
    filterable: bool


class TablePosition(TypedDict):
    editor_id: str
    row_id: str
    col: str
    mode: PositionMode


class click_cell_content_handler(Protocol):
    def __call__(self, row_id: str, name: str, value: Any):
        pass


class click_cell_content_handler(Protocol):
    def __call__(self, row_id: str, col: str, value: Value):
        pass


class mouse_enter_row_handler(Protocol):
    def __call__(self, row_id: str):
        pass


class mouse_leave_row_handler(Protocol):
    def __call__(self, row_id: str):
        pass


class select_rows_handler(Protocol):
    def __call__(self, row_keys: List[str]):
        pass


class position_change_handler(Protocol):
    def __call__(self, row_id: str, col: str, mode: PositionMode, cause=None):
        pass


class cell_change_handler(Protocol):
    def __call__(self, row_id: str, col: str, value: Value):
        pass


class button_press_handler(Protocol):
    def __call__(self, idx: int, spans: List[TextSpan]):
        pass


class filters_change_handler(Protocol):
    def __call__(self, name: str, value: Any):
        ...


class input_change_handler(Protocol):
    def __call__(self, row_id: str, name: str, value: Any, cause: str):
        ...


class TableAnnotatorViewActions(TypedDict):
    class scroll_to_line(Protocol):
        def __call__(self, line_number: int):
            ...

    class scroll_to_row(Protocol):
        def __call__(self, row_idx: int):
            ...

    class focus(Protocol):
        def __call__(self):
            ...


class Entity(TypedDict):
    label: str
    id: str
    begin: int
    end: int
    attributes: Dict[str, Union[str, bool, List[str], HyperLink, List[HyperLink]]]


class Doc(TypedDict):
    id: str
    text: str
    seen: bool
    entities: Dict[str, Entity]


class AttributeScheme(TypedDict):
    name: str
    choices: List[Value]
    filterable: bool
    mutable: bool
    type: ColumnType


class LabelScheme(TypedDict):
    name: str


class NERScheme(TypedDict):
    attributes: List[AttributeScheme]
    labels: List[LabelScheme]


class NERState(TypedDict):
    doc_id: int
    docs: List[Doc]
    mouse_selection: List[TextSpan]
    buttons: List[Button]
    entities_filters: Filters
    highlighted: List[str]
    selected: List[str]
    entities_subset: List[str]
    styles: Dict[str, Style]
    aliases: Dict[str, str]
    scheme: NERScheme
    table_position: NotRequired[TablePosition]
    inputValue: Value
    suggestions: List[Value]


class Layout:
    def table_annotator(
          self,
          rows: List[Dict[str, Value]],
          columns: List[Column],
          row_key: str,
          highlighted_rows: List[str] = [],
          position: TablePosition = None,
          filters: Filters = None,
          suggestions: List[Value] = None,
          input_value: Value = None,

          on_click_cell_content: click_cell_content_handler = None,
          on_position_change: position_change_handler = None,
          on_filters_change: filters_change_handler = None,
          on_key_press: key_press_handler = None,
          on_mouse_enter_row: mouse_enter_row_handler = None,
          on_mouse_leave_row: mouse_leave_row_handler = None,
          on_cell_change: cell_change_handler = None,
          on_input_change: input_change_handler = None,
    ) -> TableAnnotatorViewActions:
        pass

    def text_annotator(
          self,
          text: str,
          spans: List[TextAnnotation] = [],
          styles: Dict[str, Style] = {},
          mouse_selection: List[TextSpan] = [],

          on_key_press: key_press_handler = None,
          on_click_span: click_span_handler = None,
          on_mouse_enter_span: mouse_enter_span_handler = None,
          on_mouse_leave_span: mouse_leave_span_handler = None,
          on_mouse_select: mouse_select_handler = None,
    ) -> TextAnnotatorViewActions:
        pass
