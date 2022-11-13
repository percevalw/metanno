from uuid import uuid4

from .immutable import MapProxy
from .manager import AppManager


def as_state(state):
    if not isinstance(state, State):
        return State(state)
    return state


class State(MapProxy):
    uuid: str

    def __init__(self, obj, on_change=None, unsync=(), *args, **kwargs):
        manager = AppManager()
        state_id = str(uuid4())

        state_patcher = manager.make_state_patcher(state_id)

        def on_change_and_patch(old, new, patches):
            if on_change is not None:
                on_change(old, new, patches)
            state_patcher(patches)

        object.__setattr__(self, '_state_id', state_id)
        object.__setattr__(self, '_unsync', unsync)


        # This will create a state in the client
        # with a uuid we can refer to track changes

        super(State, self).__init__(
            obj,
            *args,
            on_change=on_change_and_patch,
            **kwargs,
        )
        manager.create_state(self, state_id, unsync=unsync)

    @property
    def __weakref__(self):
        return object.__getattribute__(self, '___weakref__')

    @__weakref__.setter
    def __weakref__(self, weakref):
        return object.__setattr__(self, '___weakref__', weakref)

    @__weakref__.deleter
    def __weakref__(self):
        return object.__detattr__(self, '___weakref__')

    @property
    def state_id(self):
        return object.__getattribute__(self, '_state_id')

    @property
    def unsync(self):
        return object.__getattribute__(self, '_unsync')
