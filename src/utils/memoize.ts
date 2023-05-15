import isEqual from "react-fast-compare";

export {isEqual};

export const shallowCompare = (obj1: object, obj2: object) =>
    obj1 === obj2 ||
    (typeof obj1 === 'object' && typeof obj2 == 'object' &&
    obj1 !== null && obj2 !== null &&
    Object.keys(obj1).length === Object.keys(obj2).length &&
    Object.keys(obj1).every(key => obj2.hasOwnProperty(key) && obj1[key] === obj2[key]));


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
