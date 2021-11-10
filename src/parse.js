import {produce as immerProduce} from 'immer';
import {Widget} from '@lumino/widgets';

const {AssertionError, AttributeError, BaseException, DeprecationWarning, Exception, IndexError, IterableError, KeyError, NotImplementedError, RuntimeWarning, StopIteration, UserWarning, ValueError, Warning, __JsIterator__, __PyIterator__, __Terminal__, __add__, __and__, __call__, __class__, __envir__, __eq__, __floordiv__, __ge__, __get__, __getcm__, __getitem__, __getslice__, __getsm__, __gt__, __i__, __iadd__, __iand__, __idiv__, __ijsmod__, __ilshift__, __imatmul__, __imod__, __imul__, __in__, __init__, __ior__, __ipow__, __irshift__, __isub__, __ixor__, __jsUsePyNext__, __jsmod__, __k__, __kwargtrans__, __le__, __lshift__, __lt__, __matmul__, __mergefields__, __mergekwargtrans__, __mod__, __mul__, __ne__, __neg__, __nest__, __or__, __pow__, __pragma__, __proxy__, __pyUseJsNext__, __rshift__, __setitem__, __setproperty__, __setslice__, __sort__, __specialattrib__, __sub__, __super__, __t__, __terminal__, __truediv__, __withblock__, __xor__, abs, all, any, assert, bool, bytearray, bytes, callable, chr, copy, deepcopy, delattr, dict, dir, divmod, enumerate, filter, float, getattr, hasattr, input, int, isinstance, issubclass, len, list, map, max, min, object, ord, pow, print, property, py_TypeError, py_iter, py_metatype, py_next, py_reversed, py_typeof, range, repr, round, set, setattr, sorted, str, sum, tuple, zip} = require('./org.transcrypt.__runtime__.js');

const chain_map = (...args) => Object.assign({}, ...args);
const chain_list = (...args) => [].concat.apply([], args);

const kernel_only = fn => {
    const func_name = fn();
    return (self, ...args) => {
        self.manager.comm.send({
            'method': 'run_method',
            'data': {
                'method_name': func_name,
                'args': args,
            }
        })
    };
};

const frontend_only = fn => {
    fn.frontend_only = true;
    return fn;
}

const produce = fn => {
    const new_fn = (self, ...args) => {
        let recordedPatches = [];
        const newState = immerProduce(self.manager.store.getState(), draft => {
            self.state = draft;
            fn(self, ...args);
        }, (patches, inversePatches) => recordedPatches = patches);
        self.manager.store.dispatch({ type: 'SET_STATE', payload: newState });
        if (new_fn.frontend_only || fn.frontend_only)
            return;
        self.manager.comm.send({
            'method': 'patch',
            'data': {
                'patches': recordedPatches,
            }
        })
        delete self.state;
    }
    return new_fn;
}

const make_uid = (...args) => {
    return args.map(String).join("-")
};

export function eval_code(code) {
    return eval(code);
}
