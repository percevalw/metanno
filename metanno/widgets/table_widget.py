import abc
from typing import TypeVar

from .base import Widget
from ..types import *
from ..utils import frontend_only

T = TypeVar('T')


class TableWidget(Widget[T], abc.ABC):
    WIDGET_TYPE = 'table-widget'

    def handle_click_cell_content(self, row_id: str, col: str, value: Value):
        pass

    def handle_mouse_enter_row(self, row_id: str):
        pass

    def handle_mouse_leave_row(self, row_id: str):
        pass

    def handle_select_rows(self, row_keys: List[str]):
        pass

    def handle_position_change(self, row_id: str, col: str, mode: PositionMode, cause=None):
        pass

    def handle_cell_change(self, row_id: str, col: str, value: Value):
        pass

    def handle_button_press(self, idx: int, spans: List[TextSpan]):
        pass

    @frontend_only
    def scroll_to_line(self, line_number: int):
        self._actions.scroll_to_line(line_number)  # noqa

    @frontend_only
    def scroll_to_row(self, row_idx: int):
        self._actions.scroll_to_span(row_idx)  # noqa

    @frontend_only
    def focus(self):
        self._actions.focus()  # noqa

    def render(self) -> TableViewProps:
        """"""
