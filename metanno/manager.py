import linecache
import traceback
import weakref

import sys
from ipykernel.comm import Comm

from .immutable import AutoProxy, apply_patches, commit
from .python_to_javascript import transcrypt_class
from .views import SpanEditor, TableEditor

val = None

def get_formatted_exception():
    global val
    exc_type, exc_obj, tb = sys.exc_info()
    f = tb.tb_frame
    lineno = tb.tb_lineno
    filename = f.f_code.co_filename
    linecache.checkcache(filename)
    line = linecache.getline(filename, lineno, f.f_globals)
    val = traceback.format_exc()
    return f'Exception: {exc_obj}\nin "{line.strip()}"\nat {filename}:{lineno}'


class weakmethod:
    def __init__(self, cls_method):
        self.cls_method = cls_method
        self.instance = None
        self.owner = None

    def __get__(self, instance, owner):
        self.instance = weakref.ref(instance)
        self.owner = owner
        return self

    def __call__(self, *args, **kwargs):
        if self.owner is None:
            raise Exception(f"Function was never bound to a class scope, you should use it as a decorator on a method")
        instance = self.instance()
        if instance is None:
            raise Exception(f"Cannot call {self.owner.__name__}.{self.cls_method.__name__} because instance has been destroyed")
        return self.cls_method(instance, *args, **kwargs)


if "ManagerSingleton" not in globals():
    class ManagerSingleton(type):
        _instance = None

        def __call__(cls, *args, **kwargs):
            if cls._instance is None or cls._instance() is None:
                # we need to make a local variable, otherwise the manager is instantly deallocated
                instance = super(ManagerSingleton, cls).__call__(*args, **kwargs)
                cls._instance = weakref.ref(instance)
            return cls._instance()
else:
    print("The ManagerSingleton metaclass already exists: not creating a new one.")


# noinspection PyUnboundLocalVariable
class AppManager(metaclass=ManagerSingleton):
    def __init__(self):
        self.comm = None
        self._app = None

        # self.store = pydux.create_store(
        #     self.reduce,
        #     initial_state={"editors": {}, "custom": {}}, enhancer=pydux.apply_middleware(
        #         self.make_annotator_middleware(),
        #     ))
        self._past = []
        self._future = []
        self._state = {}
        self.state_is_null = True
        self.state = AutoProxy(self._state, on_change=self._on_state_change)
        self.open()

    def reset_state(self):
        self._past = []
        self._future = []
        self._state = {}
        self.state_is_null = True

    def _on_state_change(self, new_state, patches):
        weakself = weakref.ref(self)
        del self

        weakself().comm.send({
            "method": "patch",
            "data": {
                "patches": patches,
            }})

        weakself().change_state(new_state)

    def change_state(self, new_state):
        if not self.state_is_null:
            self._app().on_state_change(new_state, self._state)

        self.state_is_null = False
        self._state = new_state
        self.state = AutoProxy(self._state, on_change=self._on_state_change)

    def apply_patches(self, patches):
        new_state = apply_patches(self._state, patches)
        self.change_state(new_state)

    def __del__(self):
        self.close()

    def span_editor(self, name=None):
        return SpanEditor(self, name)

    def table_editor(self, name=None):
        return TableEditor(self, name)

    @property
    def app(self):
        return self._app() if self._app is not None else None

    @app.setter
    def app(self, value):
        if value is not None:
            self._app = weakref.ref(value)
            if self.comm is not None:
                js_code, py_code, sourcemap = transcrypt_class(value.__class__, return_python=False)
                self.comm.send({
                    "method": "set_app_code",
                    "data": {
                        "code": js_code,
                        "sourcemap": sourcemap,
                        "py_code": py_code,
                    }
                })
        else:
            self._app = None
            if self.comm is not None:
                self.comm.send({
                    "method": "set_app_code",
                    "data": {
                        "code": None,
                    }
                })

    def open(self):
        """Open a comm to the frontend if one isn't already open."""
        if self.comm is None:
            comm = Comm(
                target_name='metanno',
                data={'state': {}})
            comm.on_msg(self.handle_msg)
            self.comm = comm

    def close(self):
        """Close method.
        Closes the underlying comm.
        When the comm is closed, all of the widget views are automatically
        removed from the front-end."""
        if self.comm is not None:
            self.comm.close()
            self.comm = None

    # Event handlers
    @weakmethod
    def handle_msg(self, msg):
        """Called when a msg is received from the front-end"""
        msg_content = msg['content']['data']
        if "method" not in msg_content:
            return
        method = msg_content['method']
        data = msg_content['data']
        if method == "action":
            self.store.dispatch(data)
        elif method == "patch":
            emitter_id = msg['metadata'].get('id', None)
            self.apply_patches(data['patches'])
            self.comm.send({
                "method": "patch",
                "data": {
                    "patches": data['patches'],
                },
            }, {
                'exceptId': emitter_id
            } if emitter_id is not None else {})
        elif method == "method_call":
            try:
                result = getattr(self.app, data["method_name"])(*data["args"])
                self.comm.send({
                    'method': 'method_return',
                    'data': {
                        'value': result,
                        'callback_id': data["callback_id"],
                    }
                })
            except Exception:
                traceback.print_exc()
                self.comm.send({
                    'method': 'method_call',
                    'data': {
                        'method_name': 'error',
                        'args': [get_formatted_exception()],
                    }
                })
        elif method == "sync_request":
            if self.app is not None:
                self.app = self.app
            if self.comm is not None:
                self.comm.send({
                    "method": "sync",
                    "data": {
                        "state": self._state,
                    }
                })

    def make_annotator_middleware(self):
        weakself = weakref.ref(self)
        del self

        def annotator_middleware(store):
            def apply_middleware(next):
                def apply_action(action):
                    action_type = action["type"]
                    # send the action to the front-end
                    for executor in action["meta"]["executors"]:
                        if executor == "frontend":
                            weakself().comm.send({
                                "method": "action",
                                "data": {
                                    **action,
                                    "meta": {"executors": [executor]},
                                }})
                        elif executor == "kernel":
                            next(action)

                return apply_action

            return apply_middleware

        return annotator_middleware

    def setState(self, state):
        self.change_state(commit(state)[0])
        self.sync_state()

    def sync_state(self):
        self.comm.send({
            "method": "sync",
            "data": {
                "state": self._state,
            }
        })

    def undo(self):
        """
        Changes the current state to the previous one in the list of past states
        :return:
        """
        # If there is no more past state, return
        if len(self._past) == 0:
            return
        self._future.append(self._state)
        self._state = self._past[-1]
        self._past = self._past[:-1]
        self.state = AutoProxy(self._state, on_change=self._on_state_change)
        self.sync_state()

    def redo(self):
        """
        Changes the current state to the next one in the list of future states
        :return:
        """
        # If there is no more future state, return
        if len(self._future) == 0:
            return
        self._past.append(self._state)
        self._state = self._future[-1]
        self._future = self._future[:-1]
        self.state = AutoProxy(self._state, on_change=self._on_state_change)
        self.sync_state()

    def save_state(self):
        """
        Adds the current state to the past states
        :return:
        """
        # If the state hasn't changed

        if len(self._past) and self._state is self._past[-1]:
            return
        self._future = []
        self._past.append(self._state)

    def dispatch(self, *args):
        return self.store.dispatch(*args)

    @weakmethod
    def reduce(self, state={}, action=None):
        if self.app is not None:
            return self.app.reduce(state, action)
        return state
