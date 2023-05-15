__all__ = ['frontend_only', 'produce']

from metanno.immutable import scope


def get_idx(items, value, field="id"):
    return next((i for i, doc in enumerate(items) if doc[field] == value), None)


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
