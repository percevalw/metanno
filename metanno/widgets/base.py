import abc
from typing import Generic, TypeVar
from uuid import uuid4

from ..immutable import scope
from ..manager import AppManager
from ..py2js import transcrypt_class
from ..state import as_state

T = TypeVar('T')

IS_JS = False


def get_idx(items, value, field="id"):
    return next((i for i, doc in enumerate(items) if doc[field] == value), None)


def kernel_only(fn):
    fn._kernel_only = True
    return fn


def produce(fn):
    def wrap(self, *args, **kwargs):
        with scope(self.state, do_patches=True):
            return fn(self, *args, **kwargs)

    wrap.__name__ = fn.__name__
    wrap.__wrapped__ = fn
    return wrap


def frontend_only(fn):
    def wrapped(self, *args):
        self.manager.comm.send({
            'method': 'method_call',
            'data': {
                'method_name': fn.__name__,
                'widget_id': self.widget_id,
                'state_id': self._state_id,
                'args': args,
            }
        })

    wrapped.__name__ = fn.__name__
    wrapped.__wrapped__ = fn
    return wrapped


class Widget(Generic[T], abc.ABC):
    WIDGET_TYPE: str

    def __init__(self, state, widget_id=None, detach=True):
        self._actions = {}
        if IS_JS:
            self.manager = None
            self.state = None
            self._state_id = None
            self.widget_id = widget_id
        else:
            self.detach = detach
            self.state: T = as_state(state)
            self.manager = AppManager()
            self._state_id = self.state.state_id
            if widget_id is None:
                widget_id = str(uuid4())
            self.widget_id = widget_id
            self.manager.register_widget(self._state_id, widget_id, self)

    def get_widget(self, widget_id):
        manager = self.manager
        return manager.get_widget(self._state_id, widget_id)

    @frontend_only
    def error(self, message: str, auto_close: int=10000):
        self.manager.toastError(message, auto_close)

    @frontend_only
    def info(self, message: str, auto_close: int=10000):
        self.manager.toastInfo(message, auto_close)

    @kernel_only
    def _repr_mimebundle_(self, *args, **kwargs):
        js_code, py_code, sourcemap = transcrypt_class(
            self.__class__,
            return_python=False
        )
        plaintext = repr(self)
        if len(plaintext) > 110:
            plaintext = plaintext[:110] + '…'
        return {
            'text/plain': plaintext,
            'application/vnd.metanno+json': {
                'autodetach': self.detach,
                'version_major': 0,
                'version_minor': 0,
                'widget_id': self.widget_id,
                'widget_type': self.WIDGET_TYPE,
                'widget_state_id': self.state.state_id,  # noqa
                'widget_code': {
                    "code": js_code,
                    "sourcemap": sourcemap,
                    "py_code": py_code,
                },
            }
        }


__all__ = ['frontend_only', 'kernel_only', 'produce', 'Widget']
