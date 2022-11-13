import abc
from typing import TypeVar

from .base import Widget
from ..types import *
from ..utils import frontend_only

T = TypeVar('T')


class TextWidget(Widget[T], abc.ABC):
    WIDGET_TYPE = 'text-widget'

    def handle_key_press(self, key: str, modkeys: List[str], spans: List[TextSpan]):
        pass

    def handle_click_span(self, span_id: str, modkeys: List[str]):
        pass

    def handle_mouse_enter_span(self, span_id: str, modkeys: List[str]):
        pass

    def handle_mouse_leave_span(self, span_id: str, modkeys: List[str]):
        pass

    def handle_button_press(self, idx: int, spans: List[TextSpan]):
        pass

    def handle_mouse_select(self, modkeys: List[str], spans: List[TextSpan]):
        pass

    @frontend_only
    def scroll_to_line(self, line_number: int):
        self._actions.scroll_to_line(line_number)  # noqa

    @frontend_only
    def scroll_to_span(self, span_id: str):
        self._actions.scroll_to_span(span_id)  # noqa

    @frontend_only
    def focus(self):
        self._actions.focus()  # noqa

    @frontend_only
    def clear_mouse_span_selection(self):
        self._actions.clear_current_mouse_selection()  # noqa

    def render(self) -> TextViewProps:
        """"""
