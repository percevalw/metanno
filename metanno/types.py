from enum import Enum
from typing import TypedDict, Union, List, Dict, Optional

from typing_extensions import NotRequired


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


class TextViewProps(TypedDict):
    text: str
    spans: List[TextAnnotation]
    styles: Dict[str, Style]
    mouse_selection: List[TextSpan]
    buttons: List[Button]


class ColumnType(str, Enum):
    hyperlink = "hyperlink"
    bool = "boolean"
    text = "text"
    number = "number"


class Column(TypedDict):
    name: str
    type: ColumnType


class TablePosition(TypedDict):
    editor_id: str
    row_id: str
    col: str
    mode: PositionMode


class TableViewProps(TypedDict):
    rows: List[Dict[str, Value]]
    row_key: str
    columns: List[Column]
    highlighted_rows: List[str]
    position: NotRequired[Optional[TablePosition]]
    filters: NotRequired[Optional[Filters]]
    suggestions: NotRequired[Optional[List[Value]]]
    inputValue: NotRequired[Optional[Value]]


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
