import linecache
import logging
import sys
import traceback
from weakref import WeakValueDictionary, WeakKeyDictionary, ref, finalize
from typing import Dict, Callable, List

from ipykernel.comm import Comm

from .immutable import AutoProxy, apply_patches, commit, disable_on_change, Patch

val = None


def get_formatted_exception():
    try:
        global val
        exc_type, exc_obj, tb = sys.exc_info()
        f = tb.tb_frame
        lineno = tb.tb_lineno
        filename = f.f_code.co_filename
        linecache.checkcache(filename)
        line = linecache.getline(filename, lineno, f.f_globals)
        val = traceback.format_exc()
        return f'Exception: {exc_obj}\nin "{line.strip()}"\nat {filename}:{lineno}'
    except Exception as e:
        return f'Exception: {e}'


class weakmethod:
    def __init__(self, cls_method):
        self.cls_method = cls_method
        self.instance = None
        self.owner = None

    def __get__(self, instance, owner):
        self.instance = ref(instance)
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
                cls._instance = ref(instance)
            return cls._instance()
else:
    print("The ManagerSingleton metaclass already exists: not creating a new one.")


# noinspection PyUnboundLocalVariable
class AppManager(metaclass=ManagerSingleton):
    def __init__(self):
        self.comm = None
        self.views = {}
        self.states: WeakValueDictionary[str, 'State'] = WeakValueDictionary()
        self.callables = WeakValueDictionary()

        self.open()

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
        When the comm is closed, all the view views are automatically
        removed from the front-end."""
        if self.comm is not None:
            self.comm.close()
            self.comm = None

    def send_message(self, method, data, metadata=None):
        self.comm.send({
            "method": method,
            "data": data,
        }, metadata)

    def get_variable_name(self, variable):
        variable_name = f"var_{id(variable)}"
        return variable_name
        # if variable not in self.variables_store:
        #     try:
        #         self.variables_store[variable] = f"var_{self.variables_offset}"
        #     except TypeError:
        #         pass
        #     self.variables_offset += 1
        # return self.variables_store[variable]

    def register_callables(self, callables):
        self.callables.update(callables)

    def create_state(self, state: Dict, state_id: str, unsync=()):
        """
        Registers and synchronize a state with the client

        Parameters
        ----------
        state: Dict
            The state data
        state_id: str
            The state ID (should be automatically generated)
        unsync: Sequence[Sequence[str]]
            Paths to state parts that should not be synced when modifying the state

        Returns
        -------

        """
        self.states[state_id] = state

        # Must use finalizer instead of __del__ on state to allow cyclic
        # reference detection and easy gc
        finalize(state, self.delete_state, state_id=state_id)
        self.send_message(
            method="set_state",
            data={
                "state": commit(state)[0],
                "state_id": state_id,
                "unsync": unsync,
            },
        )

    def make_state_patcher(self, state_id: str) -> Callable[[Dict], None]:
        """
        Send patches to the client

        Parameters
        ----------
        state_id: str
            UUID of the state to patch

        Returns
        -------
        Callable[[Dict], None]
        """
        def patch_state(patches: List[Patch]):
            self.send_message(
                method="patch_state",
                data={
                    "patches": patches,
                    "state_id": state_id,
                },
            )
        return patch_state

    def delete_state(self, state_id: str):
        """
        Delete the state in the client

        Parameters
        ----------
        state_id: str
            UUID of the state to delete
        """
        if state_id in self.states:
            del self.states[state_id]
        self.send_message(
            method="delete_state",
            data={
                "state_id": state_id,
            },
        )

    def reset_state(self):
        self._past = []
        self._future = []
        self._state = {}
        self.state_is_null = True

#    def change_state(self, new_state):
#        if not self.state_is_null:
#            self._app().on_state_change(new_state, self._state)
#
#        self.state_is_null = False
#        self._state = new_state
#        self.state = AutoProxy(self._state, on_change=self._on_state_change)

    def apply_patches(self, state_id, patches):
        if state_id not in self.states:
            return
        state = self.states[state_id]
        with disable_on_change(state):
            apply_patches(self.states[state_id], patches)
        # self.change_state(new_state)

    def __del__(self):
        self.close()

    # Event handlers
    @weakmethod
    def handle_msg(self, msg):
        """Called when a msg is received from the front-end"""
        msg_content = msg['content']['data']
        if "method" not in msg_content:
            return
        method = msg_content['method']
        data = msg_content['data']

        logging.warning(f"Received message {method} with data: {data}")

        if method == "patch_states":
            for patch_item in data:
                self.apply_patches(patch_item["state_id"], patch_item['patches'])
            emitter_id = msg['metadata'].get('id', None)
            self.send_message(
                method="patch_state",
                data={
                    "patches": data['patches'],
                    "state_id": data['state_id'],
                },
                metadata={
                    'exceptId': emitter_id
                } if emitter_id is not None else {}
            )

        elif method == "method_call":
            try:
                fn = self.callables[data["method_name"]]
                result = fn(*data["args"])
                self.send_message(
                    method="method_return",
                    data={
                        'value': result,
                        'callback_id': data["callback_id"],
                    }
                )
            except Exception:
                traceback.print_exc()
                self.send_message(
                    method="error",
                    data={
                        'args': [get_formatted_exception()],
                        'callback_id': data["callback_id"],
                        'autoClose': False,
                    }
                )

        elif method == "sync_request":
            if self.comm is not None:
                self.sync_states()

    def setState(self, state):
        self.change_state(commit(state)[0])
        self.sync_state()

    def sync_states(self):
        for state_id, state in self.states.items():
            logging.warning(f"Syncing state {state_id}")
            self.send_message(
                method="set_state",
                data={
                    "state": commit(state)[0],
                    "state_id": state_id,
                    "unsync": state.unsync,
                },
            )

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

    def get_view(self, state_id, view_id):
        if state_id not in self.views:
            raise Exception(f"Missing state {state_id} (while looking for view {view_id})")
        state_views = self.views[state_id]
        if view_id in state_views:
            return self.views[view_id]()
        raise Exception(f"Missing view {view_id} for state {state_id}")
