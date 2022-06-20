from copy import copy as shallow_copy
from dataclasses import dataclass, field

import collections.abc
import functools
import inspect
from contextlib import contextmanager
from itertools import count
from typing import TypeVar, Generic, Optional, List, Tuple, Sequence, Iterable, Iterator, Any, Callable, Dict


def get_class_that_defined_method(meth):
    if isinstance(meth, functools.partial):
        return get_class_that_defined_method(meth.func)
    if inspect.ismethod(meth) or (inspect.isbuiltin(meth) and getattr(meth, '__self__', None) is not None and getattr(meth.__self__, '__class__', None)):
        for cls in inspect.getmro(meth.__self__.__class__):
            if meth.__name__ in cls.__dict__:
                return cls
        meth = getattr(meth, '__func__', meth)  # fallback to __qualname__ parsing
    if inspect.isfunction(meth):
        cls = getattr(inspect.getmodule(meth),
                      meth.__qualname__.split('.<locals>', 1)[0].rsplit('.', 1)[0],
                      None)
        if isinstance(cls, type):
            return cls
    return getattr(meth, '__objclass__', None)  # handle special descriptor objects


def ensure_copy(state):
    if state.copy is None:
        state.copy = shallow_copy(state.base)


def set_on_parent(state):
    if state.setter_method is not None:
        getattr(state.parent.proxy, state.setter_method)(*state.setter_args, state.copy)


def get_closest_non_derived_parent(state):
    if state.setter_method is not None:
        return state
    if state.parent:
        return get_closest_non_derived_parent(state.parent)
    return state


def maybe_on_change(proxy):
    if proxy._state.on_change is not None:
        res, patches = commit(proxy, do_patches=True)
        proxy._state.on_change(res, patches)


T = TypeVar('T')
S = TypeVar('S')
K = TypeVar('K')


@dataclass
class Scope:
    # patches: Optional[List[Patch]]
    # inverse_patches: Optional[List[Patch]]
    parent: Optional['Scope'] = None
    unfinalized_drafts: int = 0
    proxies: ['Proxy'] = field(default_factory=lambda: [])
    on_change: Optional[Callable[[Any], None]] = None


@dataclass
class ProxyState(Generic[T]):
    scope: Scope
    parent: 'ProxyState'
    setter_args: Optional[Tuple]
    setter_method: Optional[str]
    base: T
    copy: T
    proxy: 'Proxy'
    on_change: Callable[[Any, List[Dict[str, Any]]], None]

    @property
    def target(self) -> T:
        return self.copy if self.copy is not None else self.base


current_scopes: List[Optional[Scope]] = [Scope()]


def recursive_copy(state: ProxyState):
    if state.parent is not None and state.parent.copy is None:
        state.copy = shallow_copy(state.base)
        recursive_copy(state.parent)
        getattr(state.parent.copy, state.setter_method)(state.setter_args, state.copy)


# Each scope represents a `produce` call.
def get_current_scope() -> Scope:
    return current_scopes[-1]


class Proxy(Generic[T]):
    STATE_TYPE = ProxyState
    _state: ProxyState[T]

    # def __getattr__(self, key):
    #     state = self._state
    #     target = state.target
    #     res = getattr(target, key)
    #     return AutoProxy(res, state, '__proxy_setattr__')

    # def __setattr__(self, key, value):
    #     state = self._state
    #     ensure_copy(state)
    #     setattr(state.copy, key, value)

    def __setattr__(self, name, value):
        if name not in ('_state', '__class__'):
            raise AttributeError(f"Cannot set attribute {name}")
        object.__setattr__(self, name, value)

    def __getattr__(self, name):
        return getattr(self._state.target, name)


class AutoProxy(Proxy[T]):
    def __init__(self, base: T, parent: ProxyState = None, setter_method: str = None, setter_args=None, on_change=None):
        object.__setattr__(self, "_state", ProxyState(
            # Track which produce call this is associated with.
            scope=parent.scope if parent else get_current_scope(),

            # The parent draft state.
            parent=parent,

            setter_args=setter_args,

            setter_method=setter_method,

            # The base state.
            base=base,

            # The base copy with any updated values.
            copy=None,

            proxy=self,

            on_change=on_change,
        ))

    def __new__(cls, obj, *args, **kwargs):
        if isinstance(obj, Proxy):
            return obj
        if isinstance(obj, (str, int, float)) or obj is None:
            return obj
        if hasattr(obj.__class__, 'keys'):
            return MapProxy(obj, *args, **kwargs)
        elif hasattr(obj.__class__, '__iter__'):
            return SequenceProxy(obj, *args, **kwargs)
        return super(AutoProxy, cls).__new__(cls, obj, *args, **kwargs)


@dataclass
class SequenceProxyState(ProxyState[T]):
    keys: T


class SequenceProxy(Proxy[T], collections.Sequence):
    _state = SequenceProxyState[T]

    def __init__(self, base: Any, copy: Any = None, parent: ProxyState = None, setter_args=None, setter_method=None, keys: T = None, on_change=None):
        if keys is None:
            if isinstance(base, list):
                keys = list(range(len(base)))
            elif isinstance(base, collections.abc.Iterator):
                keys = count()

        object.__setattr__(self, "_state", SequenceProxyState(
            # Track which produce call this is associated with.
            scope=parent.scope if parent else get_current_scope(),

            # The parent draft state.
            parent=parent,

            keys=keys,

            setter_args=setter_args,

            setter_method=setter_method,

            # The base state.
            base=base,

            # The base copy with any updated values.
            copy=copy,

            proxy=self,

            on_change=on_change,
        ))

    def __getitem__(self, indexer: int or slice) -> T or Sequence[T]:
        state = self._state
        parent = get_closest_non_derived_parent(state)
        if isinstance(indexer, int):
            key = state.keys[indexer]
            return AutoProxy(
                state.target[indexer],
                parent=parent,
                setter_method='__proxy_setitem__',
                setter_args=(key,))
        elif isinstance(indexer, slice):
            return SequenceProxy(
                parent.target,
                copy=state.target[indexer],
                parent=parent,
                setter_method=None,
                setter_args=None,
                keys=state.keys[indexer])
        else:
            raise NotImplementedError()

    def append(self, value):
        state = self._state
        ensure_copy(state)
        state.copy.append(value)
        set_on_parent(state)
        maybe_on_change(self)

    def insert(self, key, value):
        state = self._state
        ensure_copy(state)
        state.copy.insert(key, value)
        set_on_parent(state)
        maybe_on_change(self)

    def clear(self):
        state = self._state
        ensure_copy(state)
        state.copy.clear()
        set_on_parent(state)
        maybe_on_change(self)

    def __setitem__(self, indexer, value):
        state = self._state
        ensure_copy(state)
        state.copy[indexer] = value
        set_on_parent(state)
        maybe_on_change(self)

    def extend(self, values):
        state = self._state
        ensure_copy(state)
        state.copy.extend(values)
        set_on_parent(state)
        maybe_on_change(self)

    def pop(self, indexer):
        state = self._state
        ensure_copy(state)
        state.copy.pop(indexer)
        set_on_parent(state)
        maybe_on_change(self)

    def remove(self, value):
        state = self._state
        ensure_copy(state)
        state.copy.remove(value)
        set_on_parent(state)
        maybe_on_change(self)

    __proxy_setitem__ = __setitem__

    def __iter__(self):
        return ProxyIterator(parent=self._state, keys=iter(self._state.keys))

    def __len__(self):
        return len(self._state.keys)

    def __reversed__(self):
        state = self._state
        parent = get_closest_non_derived_parent(state)
        return SequenceProxy(
            parent.target,
            copy=list(reversed(state.target)),
            parent=parent,
            setter_method=None,
            setter_args=None,
            keys=reversed(state.keys)
        )

    def __repr__(self):
        return repr(self._state.target)

    def __str__(self):
        return str(self._state.target)

    def _repr_pretty_(self, p, cycle):
        if cycle:
            p.text("...")
        else:
            p.pretty(self._state.target)


class ProxyIterator(collections.abc.Iterator):
    def __init__(self, parent: ProxyState[Iterable[T]], keys: Iterator):
        self.parent = parent
        self.target = iter(parent.target)
        self.keys = iter(keys)
        self.index = 0

    def __iter__(self):
        return self

    def __next__(self) -> T:
        key = next(self.keys)
        value = next(self.target)
        return AutoProxy(value,
                         parent=get_closest_non_derived_parent(self.parent),
                         setter_method='__proxy_setitem__',
                         setter_args=(key,))


class MapProxy(Proxy[T], collections.Mapping):
    def __init__(self, base: T, parent: ProxyState = None, setter_args=None, setter_method=None, on_change=None):
        super(MapProxy, self).__init__()
        object.__setattr__(self, "_state", ProxyState(
            # Track which produce call this is associated with.
            scope=parent.scope if parent else get_current_scope(),

            # The parent draft state.
            parent=parent,

            setter_args=setter_args,

            setter_method=setter_method,

            # The base state.
            base=base,

            # The base copy with any updated values.
            copy=None,

            proxy=self,

            on_change=on_change,
        ))

    def __getitem__(self, key):
        state = self._state
        return AutoProxy(state.target[key], parent=state, setter_method='__proxy_setitem__', setter_args=(key,))

    def __setitem__(self, key, value):
        state = self._state
        ensure_copy(state)
        state.copy[key] = value
        set_on_parent(state)
        maybe_on_change(self)

    def pop(self, indexer):
        state = self._state
        ensure_copy(state)
        state.copy.pop(indexer)
        set_on_parent(state)
        maybe_on_change(self)

    def clear(self):
        state = self._state
        ensure_copy(state)
        state.copy.clear()
        set_on_parent(state)
        maybe_on_change(self)

    def update(self, other):
        state = self._state
        ensure_copy(state)
        state.copy.update(other)
        set_on_parent(state)
        maybe_on_change(self)

    def setdefault(self, key, default):
        state = self._state
        ensure_copy(state)
        state.copy.setdefault(key, default)
        set_on_parent(state)
        maybe_on_change(self)

    def popitem(self):
        state = self._state
        ensure_copy(state)
        state.copy.popitem()
        set_on_parent(state)
        maybe_on_change(self)

    # __getattr__ = __getitem__
    # __setattr__ = __setitem__
    def __repr__(self):
        return repr(self._state.target)

    def __str__(self):
        return str(self._state.target)

    __proxy_setitem__ = __setitem__

    def _repr_pretty_(self, p, cycle):
        if cycle:
            p.text("...")
        else:
            p.pretty(self._state.target)

    def __iter__(self):
        return self._state.target.__iter__()

    def __len__(self):
        return self._state.target.__len__()


def commit(obj, original=None, inplace=True, do_patches=False) -> Any:
    # if obj is immutable, return it as is
    if isinstance(obj, (int, str, float)) or obj is None:
        return obj, []
    # if obj is proxy, commit its content and return it
    if isinstance(obj, Proxy):
        res, patches = commit(obj._state.target, original=obj._state.base, do_patches=do_patches)
        if inplace:
            obj._state.base = res
            obj._state.copy = None
        return res, patches
    # if an obj is a dict, commit all its values and return either
    # the original if no value has changed, or a copy otherwise
    if isinstance(obj, (dict, list)):
        patches = []
        kept_some_values = False
        new_keys = set(obj.keys() if isinstance(obj, dict) else range(len(obj)))
        if type(original) == type(obj):
            old_keys = set(original.keys() if isinstance(original, dict) else range(len(original)))
        else:
            old_keys = set()

        for key in sorted(new_keys & old_keys, key=hash):
            new_value, sub_patches = commit(obj[key], original[key], inplace=inplace, do_patches=do_patches)
            old_value = original[key]
            if old_value is not new_value:
                obj[key] = new_value
                if do_patches:
                    if len(sub_patches):
                        kept_some_values = True
                        patches.extend(({**p, 'path': [key, *p['path']]} for p in sub_patches))
                    else:
                        patches.append({'op': 'replace', 'path': [key], 'value': new_value})
            else:
                kept_some_values = True

        for key in sorted(new_keys - old_keys, key=hash):
            obj[key] = commit(obj[key], None, inplace=inplace, do_patches=do_patches)[0]
            if do_patches and kept_some_values:
                patches.append({'op': 'add', 'path': [key], 'value': obj[key]})
        if do_patches:
            if kept_some_values:
                for key in reversed(sorted(old_keys - new_keys, key=hash)):
                    patches.append({'op': 'remove', 'path': [key], 'value': None})
            if not kept_some_values:
                patches = [{'op': 'replace', 'path': [], 'value': obj}]
        return obj, patches
    else:
        raise Exception("Cannot process state that contains {} (type {})".format(obj, type(obj)))


def apply_patches(obj, patches):
    proxy = AutoProxy(obj)
    for p in patches:
        item = proxy
        for key in p['path'][:-1]:
            item = item[key]
        if p['op'] == 'replace':
            if isinstance(item, list) and p['path'][-1] == 'length':
                item[p['path'][-1]] = item[p['path'][-1]][:p.value]
            else:
                item[p['path'][-1]] = p['value']
        if p['op'] == 'add':
            if isinstance(item, (SequenceProxy, list)):
                item.insert(p['path'][-1], p['value'])
            else:
                item[p['path'][-1]] = p['value']
        if p['op'] == 'remove':
            item.pop(p['path'][-1])
    return proxy._state.target


def produce(obj, fn):
    proxy = AutoProxy(obj)
    last_on_change, proxy._state.on_change = proxy._state.on_change, None
    fn(proxy)
    proxy._state.on_change = last_on_change
    return commit(proxy)[0]


@contextmanager
def scope(obj, do_patches=False):
    proxy = AutoProxy(obj)
    last_on_change, proxy._state.on_change = proxy._state.on_change, None
    yield proxy
    proxy._state.on_change = last_on_change
    res, patches = commit(proxy, do_patches=do_patches)
    if res is not obj and last_on_change is not None:
        last_on_change(res, patches)


if __name__ == "__main__":
    a = {"ok": {"sub": [{'key': "XX"}, {'key': "YY"}, {'key': "ZZ"}, {'key': "UU"}]}, "ko": {"sub": 5}}


    def on_change(state, patches):
        print()
        print("changed !")
        print("\n".join(map(str, patches)))


    proxy_a = AutoProxy(a, on_change=on_change)

    with scope(proxy_a, do_patches=True):
        proxy_a['ok']['sub'].append(10)
        proxy_a['ko']['sub'] += 10
        proxy_a['ko']['sub'] += 20
        my_new_dico = {"nouveau_dico": proxy_a['ko']}
        proxy_a['new_dico'] = my_new_dico
        my_new_dico['nouveau_dico']['sub'] += 2
        list(reversed(proxy_a['ok']['sub'][1:]))[1]['key'] += "_new"
        # proxy_a['ok']['sub'][:1] = []#"should not appear"
        proxy_a['ok']['sub'] = proxy_a['ok']['sub'][:2]
        # proxy_a['ok']['sub'].append(45)
        # proxy_a['ok']['sub'].append(55)
        # proxy_a['ok']['sub'][-2:] = ['prout']
        if isinstance(proxy_a, Proxy):
            print("ORIG", a)
        print("NEW ", proxy_a)
