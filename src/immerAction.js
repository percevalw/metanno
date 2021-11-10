import produce, { enablePatches, applyPatches } from "immer";
import { useStore } from "react-redux";

enablePatches();

export function combineReducersWithImmerActionReducer(
    reducers = {},
    initialState = {}
) {
    return (state = initialState, action) => {
        // Ensure the root state object is a new object; otherwise
        // React may not re-render.
        let newState = state;
        if (typeof reducers == 'function') {
            newState = reducers(state, action);
        }
        else {
            newState = {...state};
            Object.keys(reducers).forEach((domain) => {
                let obj = newState ? newState[domain] : undefined;
                newState[domain] = reducers[domain](obj, action);
            });
        }
        if (action.type.endsWith("PATCH")) {
            newState = applyPatches(state, action.payload);
        }
        return newState;
    };
}

export function createImmerActionHook(store) {
    return function immerAction(type, fn) {
        if (typeof type === "function") {
            fn = type;
            type = "PATCH";
        } else {
            type = `${type}_PATCH`;
        }
        store = store || useStore();
        return (...args) => {
            const changes = [];
            produce(store.getState(), state => fn(state, ...args), (patches, inversePatches) => {
                changes.push(...patches);
                //inverseChanges.push(...inversePatches)
            });

            store.dispatch({ type: type, payload: changes });
        };
    };
}

export default createImmerActionHook();
