from typing import TypeVar

from metanno import AppManager, State
from .py2js import get_code_transcrypt, pack
import dill

T = TypeVar('T')


class View:
    def __init__(self, renderable, detach=True):
        manager = AppManager()
        self.py_code, id_to_callable = pack(
            renderable,
        )
        manager.register_callables(id_to_callable)

        self.js_code, self.sourcemap = get_code_transcrypt(self.py_code)

        #states = [
        #    val for val in manager.variables_store.keys() if isinstance(val, State)
        #]
        #print("Using states", "".join(state.state_id for state in states))

        self.renderable = renderable
        self.detach = detach

    def __repr__(self):
        return f"View({self.renderable})"

    def _repr_mimebundle_(self, *args, **kwargs):
        plaintext = repr(self)
        if len(plaintext) > 110:
            plaintext = plaintext[:110] + '…'
        return {
            'text/plain': plaintext,
            'application/vnd.metanno+json': {
                'detach': self.detach,
                'version_major': 0,
                'version_minor': 0,
                'view_data': {
                    "sourcemap": self.sourcemap,
                    "js_code": self.js_code,
                    "py_code": self.py_code,
                },
            }
        }


__all__ = ['View']
