from collections import ChainMap
from itertools import chain

__all__ = ['chain_list', 'chain_map', 'frontend_only', 'kernel_only', 'produce']

from metanno.immutable import scope


def chain_map(*args):
    return dict(ChainMap(*reversed(args)))


def chain_list(*args):
    return list(chain.from_iterable(args))


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
                'args': args,
            }
        })

    wrapped.__name__ = fn.__name__
    wrapped.__wrapped__ = fn
    return wrapped
