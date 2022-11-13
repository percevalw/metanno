import isEqual from "react-fast-compare";
import React from "react";
import {TextRange} from "./types";

export {isEqual};

export const shallowCompare = (obj1: object, obj2: object) =>
    obj1 === obj2 ||
    (typeof obj1 === 'object' && typeof obj2 == 'object' &&
    obj1 !== null && obj2 !== null &&
    Object.keys(obj1).length === Object.keys(obj2).length &&
    Object.keys(obj1).every(key => obj2.hasOwnProperty(key) && obj1[key] === obj2[key]));


export const replaceObject = (obj: object, new_obj: object) => {
    Object.keys(obj).forEach(key => {
      delete obj[key];
    })
    Object.assign(obj, new_obj);
}

export const memoize = <Inputs extends any[], Output extends object>(
    factory: (...rest: Inputs) => Output,
    checkDeps: (...rest: Inputs) => any = ((...rest) => rest.length > 0 ? rest[0] : null),
    shallow: boolean = false,
    post: boolean = false,
): (...rest: Inputs) => Output => {
    let last = null;
    let cache: Output = null;
    return (...args: Inputs): Output => {
        if (post) {
            const new_state = factory(...args);
            if (!(shallow && shallowCompare(new_state, cache) || !shallow && isEqual(new_state, cache))) {
                cache = new_state;
            }
            return cache;
        }
        else {
            const state = checkDeps(...args);
            if (!(shallow && shallowCompare(last, state) && last !== null || !shallow && isEqual(last, state) && last !== null)) {
                last = state;
                cache = factory(...args);
            }
            return cache;
        }
    }
};

export const makeModKeys = (event: React.KeyboardEvent | React.MouseEvent): string[] => {
    const modkeys = [];
    if (event.shiftKey)
        modkeys.push("Shift");
    if (event.metaKey)
        modkeys.push("Meta");
    if (event.ctrlKey)
        modkeys.push("Control");
    return modkeys;
};

function internalReconcile(a, b) {
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

export function getDocumentSelectedRanges(): TextRange[] {
    const ranges: TextRange[] = [];
    let range = null;
    const get_span_begin = (range) => {
        return (range?.getAttribute?.("span_begin")
            || range.parentElement.getAttribute("span_begin")
            || range.parentElement.parentElement.getAttribute("span_begin"))
    }
    if (window.getSelection) {
        const selection = window.getSelection();
        let begin = null, end = null;
        for (let i = 0; i < selection.rangeCount; i++) {
            range = selection.getRangeAt(i);
            const startContainerBegin = parseInt(
                // @ts-ignore
                get_span_begin(range.startContainer),
                10
            );
            const endContainerBegin = parseInt(
                // @ts-ignore
                get_span_begin(range.endContainer),
                10
            );
            if (!isNaN(startContainerBegin)) {
                if (!isNaN(begin) && begin !== null) {
                    begin = Math.min(begin, range.startOffset + startContainerBegin);
                } else {
                    begin = range.startOffset + startContainerBegin;
                }
            }
            if (!isNaN(endContainerBegin)) {
                if (!isNaN(begin) && begin !== null) {
                    end = Math.max(end, range.endOffset + endContainerBegin);
                } else {
                    end = range.endOffset + endContainerBegin;
                }
            }
        }
        if (!isNaN(begin) && begin !== null && !isNaN(end) && end !== null && begin !== end) {
            ranges.push({
                begin: begin,
                end: end,
            });
        }
        return ranges;
    } else { // @ts-ignore
        if (document.selection && document.selection.type !== "Control") {
        }
    }
    return ranges
}

export const arrayEquals = (a1: any[], a2: any[]) => {
    // https://stackoverflow.com/questions/7837456/how-to-compare-arrays-in-javascript/7837725#7837725
    let i = a1.length;
    while (i--) {
        if (a1[i] !== a2[i]) return false;
    }
    return true
};