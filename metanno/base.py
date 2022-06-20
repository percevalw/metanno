from .manager import AppManager
from .utils import frontend_only

IS_JS = False

class App(object):
    def __init__(self):
        if not IS_JS:
            manager = AppManager()
            manager.reset_state()
            self.manager = manager
            self.manager.app = self
        else:
            self.manager = None

    @property
    def state(self):
        return self.manager.state

    @state.setter
    def state(self, state):
        self.manager.setState(state)

    def set_class(self, cls):
        self.__class__ = cls
        self.manager.app = self

    def on_state_change(self, state, old_state):
        pass

    def handle_key_press(self, editor_id, key, modkeys, spans):
        pass

    def handle_click_span(self, editor_id, span_id, modkeys):
        pass

    def handle_mouse_enter_span(self, editor_id, span_id, modkeys):
        pass

    def handle_mouse_leave_span(self, editor_id, span_id, modkeys):
        pass

    def handle_mouse_enter_row(self, editor_id, row_idx, modkeys):
        pass

    def handle_mouse_leave_row(self, editor_id, row_idx, modkeys):
        pass

    def handle_button_press(self, idx, selections):
        pass

    def handle_filters_change(self, col, value):
        pass

    def handle_key_down(self, editor_id, ):
        pass

    def handle_mouse_select(self, editor_id, ):
        pass

    def select_editor_state(self, editor_id, ):
        pass

    def handle_click_cell_content(self, editor_id, row_id, col, value):
        pass

    def handle_select_rows(self, editor_id, row_keys):
        pass

    def handle_selected_position_change(self, editor_id, row_id, col, mode, cause=None):
        pass

    def handle_cell_change(self, editor_id, row_id, col, value):
        pass

    @frontend_only
    def scroll_to_line(self, editor_id, line_number):
        if editor_id in self.manager.actions and self.manager.actions[editor_id]:
            self.manager.actions[editor_id].scroll_to_line(line_number)

    @frontend_only
    def scroll_to_span(self, editor_id, span_id):
        if editor_id in self.manager.actions and self.manager.actions[editor_id]:
            self.manager.actions[editor_id].scroll_to_span(span_id)

    @frontend_only
    def scroll_to_row(self, editor_id, row_idx):
        if editor_id in self.manager.actions and self.manager.actions[editor_id]:
            self.manager.actions[editor_id].scroll_to_row(row_idx)

    @frontend_only
    def focus(self, editor_id):
        if editor_id in self.manager.actions and self.manager.actions[editor_id]:
            self.manager.actions[editor_id].focus()

    @frontend_only
    def clear_mouse_span_selection(self, editor_id):
        if editor_id in self.manager.actions and self.manager.actions[editor_id]:
            self.manager.actions[editor_id].clear_current_mouse_selection()

    @frontend_only
    def error(self, message, auto_close=10000):
        self.manager.toastError(message, auto_close)

    @frontend_only
    def info(self, message, auto_close=10000):
        self.manager.toastInfo(message, auto_close)

    def span_editor(self, name=None):
        return self.manager.span_editor(name)

    def table_editor(self, name=None):
        return self.manager.table_editor(name)
