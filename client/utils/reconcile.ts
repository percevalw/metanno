
export function internalReconcile(a, b) {
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

    let i, key;

    if ((a === null) || (b === null)) {
        return false;
    }

    const ka = Object.keys(a);
    const kb = Object.keys(b);
    let has_diff = ka.length !== kb.length;

    for (i = kb.length - 1; i >= 0; i--) {
        key = kb[i];
        if (internalReconcile(a[key], b[key])) {
            a[key] = b[key];
        } else {
            has_diff = true;
        }
    }
    return !has_diff;
}

export function reconcile(a, b) {
    const reconciled = internalReconcile(a, b);
    return reconciled ? b : a;
}

/**
 * Reconciles the previous and the new output of a function call
 * to maximize referential equality (===) between any item of the output object
 * This allows React to quickly detect parts of the state that haven't changed
 * when the state selectors are monolithic blocks, as in our case.
 *
 * For instance
 * ```es6
 * func = cachedReconcile((value) => {a: {subkey: 3}, b: value})
 * res4 = func(4)
 * res5 = func(5)
 * res4 !== res5 (the object has changed)
 * res4['a'] === res5['a'] (but the 'a' entry has not)
 * ```
 * @param fn: Function whose output we want to cache
 */
export function cachedReconcile<Inputs extends any[], Output>(fn: (...args: Inputs) => Output): (...args: Inputs) => Output {
    let cache = null;
    return ((...args) => {
        const a = fn(...args);
        const reconciled = internalReconcile(a, cache);
        cache = reconciled ? cache : a;
        return cache;
    });
}
