const {AssertionError, AttributeError, BaseException, DeprecationWarning, Exception, IndexError, IterableError, KeyError, NotImplementedError, RuntimeWarning, StopIteration, UserWarning, ValueError, Warning, __JsIterator__, __PyIterator__, __Terminal__, __add__, __and__, __call__, __class__, __envir__, __eq__, __floordiv__, __ge__, __get__, __getcm__, __getitem__, __getslice__, __getsm__, __gt__, __i__, __iadd__, __iand__, __idiv__, __ijsmod__, __ilshift__, __imatmul__, __imod__, __imul__, __in__, __init__, __ior__, __ipow__, __irshift__, __isub__, __ixor__, __jsUsePyNext__, __jsmod__, __k__, __kwargtrans__, __le__, __lshift__, __lt__, __matmul__, __mergefields__, __mergekwargtrans__, __mod__, __mul__, __ne__, __neg__, __nest__, __or__, __pow__, __pragma__, __proxy__, __pyUseJsNext__, __rshift__, __setitem__, __setproperty__, __setslice__, __sort__, __specialattrib__, __sub__, __super__, __t__, __terminal__, __truediv__, __withblock__, __xor__, abs, all, any, assert, bool, bytearray, bytes, callable, chr, copy, deepcopy, delattr, dict, dir, divmod, enumerate, filter, float, getattr, hasattr, input, int, isinstance, issubclass, len, list, map, max, min, object, ord, pow, print, property, py_TypeError, py_iter, py_metatype, py_next, py_reversed, py_typeof, range, repr, round, set, setattr, sorted, str, sum, tuple, zip} = require('./python');

const deserialize = (cls, data) => {
    const instance = cls.__new__(cls);
    for (let aKey in data) {
        instance [aKey] = data [aKey];
    }
    return instance;
}

const transpilable = (flag) => {
    const identity = (fn) => {
        return fn;
    };
    if (!(typeof (flag) === 'boolean')) {
        return flag
    }
    return identity;
}

const get_idx = (items: { [key: string]: any }[], value: any, key: string = "id"): number => {
    for (let i = 0; i < items.length; i++) {
        if (items[i][key] === value) {
            return i;
        }
    }
}

export function evalViewCode(
    code: string,
    getState,
    getRemoteFunction,
    variableStore,
): any {
    return eval(code);
}

// @ts-ignore
window.evalViewCode = evalViewCode;
