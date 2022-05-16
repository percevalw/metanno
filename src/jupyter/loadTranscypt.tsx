import {applyPatches, createDraft, finishDraft, Patch, produce as immerProduce} from 'immer';

const {AssertionError, AttributeError, BaseException, DeprecationWarning, Exception, IndexError, IterableError, KeyError, NotImplementedError, RuntimeWarning, StopIteration, UserWarning, ValueError, Warning, __JsIterator__, __PyIterator__, __Terminal__, __add__, __and__, __call__, __class__, __envir__, __eq__, __floordiv__, __ge__, __get__, __getcm__, __getitem__, __getslice__, __getsm__, __gt__, __i__, __iadd__, __iand__, __idiv__, __ijsmod__, __ilshift__, __imatmul__, __imod__, __imul__, __in__, __init__, __ior__, __ipow__, __irshift__, __isub__, __ixor__, __jsUsePyNext__, __jsmod__, __k__, __kwargtrans__, __le__, __lshift__, __lt__, __matmul__, __mergefields__, __mergekwargtrans__, __mod__, __mul__, __ne__, __neg__, __nest__, __or__, __pow__, __pragma__, __proxy__, __pyUseJsNext__, __rshift__, __setitem__, __setproperty__, __setslice__, __sort__, __specialattrib__, __sub__, __super__, __t__, __terminal__, __truediv__, __withblock__, __xor__, abs, all, any, assert, bool, bytearray, bytes, callable, chr, copy, deepcopy, delattr, dict, dir, divmod, enumerate, filter, float, getattr, hasattr, input, int, isinstance, issubclass, len, list, map, max, min, object, ord, pow, print, property, py_TypeError, py_iter, py_metatype, py_next, py_reversed, py_typeof, range, repr, round, set, setattr, sorted, str, sum, tuple, zip} = require('./org.transcrypt.__runtime__.js');

const chain_map = (...args) => Object.assign({}, ...args);
const chain_list = (...args) => [].concat.apply([], args);

const kernel_only = fn => {
    const func_name = fn();
    return (self, ...args) => {
        return self.manager.remoteCall(func_name, args);
    };
};

const frontend_only = fn => {
    fn.frontend_only = true;
    return fn;
}

const produce = fn => {
    const new_fn = async (self, ...args) => {
        let recordedPatches: Patch[] = [];

        // Create a new immer draft for the state and make it available to the app instance
        self.state = createDraft(self.manager.store.getState());

        // Await the function result (in case it is async, when it queries the backend)
        await fn(self, ...args);

        // Finish the draft and if the state has changed, update the redux state and send the patches to the backend
        finishDraft(self.state, (patches, inversePatches) => recordedPatches = patches);
        if (recordedPatches.length) {
            const newState = applyPatches(self.manager.store.getState(), recordedPatches);

            self.manager.store.dispatch({type: 'SET_STATE', payload: newState});
            // @ts-ignore
            if (new_fn.frontend_only || fn.frontend_only)
                return;
            self.manager.comm.send({
                'method': 'patch',
                'data': {
                    'patches': recordedPatches,
                }
            }, {
                id: self.manager.id,
            })
        }
        delete self.state;
    }
    return new_fn;
}

const get_idx = (items: { [key: string]: any }[], value: any, key: string = "id"): number => {
    for (let i = 0; i < items.length; i++) {
        if (items[i][key] === value) {
            return i;
        }
    }
}

function __keys__(obj) {
    if (!(obj instanceof Object))
        return obj.keys()
    var keys = [];
    for (var attrib in obj) {
        if (!__specialattrib__(attrib)) {
            keys.push(attrib);
        }
    }
    return keys;
}

function __items__(obj) {
    if (!(obj instanceof Object))
        return obj.items()
    var items = [];
    for (var attrib in obj) {
        if (!__specialattrib__(attrib)) {
            items.push([attrib, obj [attrib]]);
        }
    }
    return items;
}

function __clear__(obj) {
    if (!(obj instanceof Object))
        return obj.clear()
    for (var attrib in obj) {
        delete obj [attrib];
    }
}

function __getdefault__(obj, aKey, aDefault) {
    if (!(obj instanceof Object))
        return obj.get(aKey, aDefault)
    var result = obj [aKey];
    if (result == undefined) {
        result = obj ['py_' + aKey]
    }
    return result == undefined ? (aDefault == undefined ? null : aDefault) : result;
}

function __setdefault__(obj, aKey, aDefault) {
    if (!(obj instanceof Object))
        return obj.setdefault(aKey, aDefault)
    var result = obj [aKey];
    if (result != undefined) {
        return result;
    }
    var val = aDefault == undefined ? null : aDefault;
    obj [aKey] = val;
    return val;
}

function __pop__(obj, aKey, aDefault) {
    if (!(obj instanceof Object))
        return obj.pop(aKey, aDefault)
    var result = obj [aKey];
    if (result != undefined) {
        delete obj [aKey];
        return result;
    } else {
        if (aDefault === undefined) {
            throw KeyError(aKey, new Error());
        }
    }
    return aDefault;
}

function __popitem__(obj) {
    if (!(obj instanceof Object))
        return obj.popitem()
    var aKey = Object.keys(obj) [0];
    if (aKey == null) {
        throw KeyError("popitem(): dictionary is empty", new Error());
    }
    var result = tuple([aKey, obj [aKey]]);
    delete obj [aKey];
    return result;
}

function __update__(obj, aDict) {
    if (!(obj instanceof Object))
        return obj.update(aDict)
    for (var aKey in aDict) {
        obj [aKey] = aDict [aKey];
    }
}

function __values__(obj) {
    if (!(obj instanceof Object))
        return obj.values()
    var values = [];
    for (var attrib in obj) {
        if (!__specialattrib__(attrib)) {
            values.push(obj [attrib]);
        }
    }
    return values;
}

export function eval_code(code: string): any {
    return eval(code);
}
