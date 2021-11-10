import {Exception} from "./org.transcrypt.__runtime__";

function internalReconcile(a, b, do_string_compare) {
    // 7.1. All identical values are equivalent, as determined by ===.
    if (a === b) {
        return true;
    }

    const typeA = typeof a;
    const typeB = typeof b;

    if (typeA !== typeB) {
        return false;
    }

    // 7.3. Other pairs that do not both pass typeof value == 'object', equivalence is determined by ==.
    if (!a || !b || (typeA !== "object" && typeB !== "object")) {
        return a == b; // eslint-disable-line eqeqeq
    }
    if (Object.isFrozen(a)) {
        return false;
    }


    var i, key;

    /*if (do_string_compare) {
      if (JSON.stringify(a) === JSON.stringify(b)) {
        return true;
      }
    }*/

    if (a == null || b == null) {
        return false;
    }

    // equivalent values for every corresponding key, and ~~~possibly expensive deep test
    const ka = Object.keys(a);
    const kb = Object.keys(b);
    let has_diff = ka.length !== kb.length;

    // console.log("START");
    //const sub_do_string_compare = ka.length < 0;
    for (i = kb.length - 1; i >= 0; i--) {
        key = kb[i];
        if (internalReconcile(a[key], b[key], false)) {
            a[key] = b[key];
        } else {
            has_diff = true;
        }
    }
    return !has_diff;
}

export function reconcile(a, b) {
    const reconciled = internalReconcile(a, b,);
    return reconciled ? b : a;
}

export default function cachedReconcile(fn) {
    let cache = null;
    return (...args) => {
        const a = fn(...args);
        const reconciled = internalReconcile(a, cache);
        cache = reconciled ? cache : a;
        return cache;
    };
}