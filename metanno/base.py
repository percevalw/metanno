from .utils import chain_map, chain_list, make_uid, frontend_only
from .manager import AppManager

IS_JS = False


class App(object):
    def __init__(self):
        if not IS_JS:
            manager = AppManager()
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

    def handle_enter_span(self, editor_id, span_id, modkeys):
        pass

    def handle_leave_span(self, editor_id, span_id, modkeys):
        pass

    def handle_button_press(self, idx, selections):
        pass

    def handle_key_down(self, editor_id, ):
        pass

    def handle_mouse_select(self, editor_id, ):
        pass

    def select_editor_state(self, editor_id, ):
        pass

    def handle_click_cell_content(self, editor_id, ):
        pass

    def handle_select_rows(self, editor_id, row_keys):
        pass

    def handle_select_cell(self, editor_id, *args):
        pass

    def handle_cell_change(self, editor_id, row_idx, col, value):
        pass

    @frontend_only
    def scroll_to_line(self, editor_id, line_number):
        self.manager.actions[editor_id].scroll_to_line(line_number)

    @frontend_only
    def scroll_to_span(self, editor_id, span_id):
        self.manager.actions[editor_id].scroll_to_span(span_id)

    @frontend_only
    def clear_mouse_span_selection(self, editor_id):
        self.manager.actions[editor_id].clear_current_mouse_selection()

    def span_editor(self, name=None):
        return self.manager.span_editor(name)

    def table_editor(self, name=None):
        return self.manager.table_editor(name)
