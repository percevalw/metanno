import {applyPatches, createDraft, finishDraft, Patch } from "immer";
import { Store } from "redux";
import {arrayEquals} from "./utils";

const START_MUTATION: unique symbol = Symbol.for('metanno-start-mutation');
const STOP_MUTATION: unique symbol = Symbol.for('metanno-stop-mutation');
const STATE_ID: unique symbol = Symbol.for('metanno-state-id');

type JSONValue =
 | string
 | number
 | boolean
 | null
 | JSONValue[]
 | {[key: string]: JSONValue}
export type State = {
  [key: string]: JSONValue,
};
/* & {
  START_MUTATION: () => void,
  STOP_MUTATION: () => Patch[],
  STATE_ID: string,
};*/

export const createState = (store: Store, stateId: string): State => {
  let draft = null;
  const startMutation = () => {
      if (draft)
        return;
      draft = createDraft(store.getState()[stateId]);
  }
  const stopMutation = () => {
    if (!draft)
      return [];
    let recordedPatches: Patch[] = [];
    finishDraft(draft, (patches, inversePatches) => recordedPatches = patches);
    draft = null;
    return recordedPatches;
  }

  return new Proxy({}, {
    get(dummy, prop, receiver) {
      if (prop === START_MUTATION) {
        return startMutation;
      }
      if (prop === STATE_ID) {
        return stateId;
      }
      else if (prop === STOP_MUTATION) {
        return stopMutation;
      }
      return Reflect.get(draft || store.getState()[stateId], prop, receiver);
    },
    has(dummy, prop) {
      return Reflect.has(
          draft || store.getState()[stateId], prop
      );
    },

    ownKeys(dummy) {
      return Reflect.ownKeys(
          draft || store.getState()[stateId]
      );
    },

    set(dummy, prop, value) {
      return Reflect.set(
          draft || store.getState()[stateId], prop, value
      );
    },

    deleteProperty(dummy, prop) {
      return Reflect.deleteProperty(
          draft || store.getState()[stateId], prop
      );
    },

    getOwnPropertyDescriptor(dummy, prop) {
      return Reflect.get(
          draft || store.getState()[stateId], prop
      );
    },

    getPrototypeOf(dummy) {
      return Reflect.getPrototypeOf(
          draft || store.getState()[stateId]
      );
    },
  }) as State;
};

export const multiProduce = (statesRef: WeakRef<State>[], store: Store) => (fn) => {
    return async (...args) => {
      const states = statesRef.map(ref => ref.deref()).filter(state => !!state);
      // Any access to this state will now be directed to the draft
      // @ts-ignore
      states.forEach(state => (state[START_MUTATION])());

      // Apply the function, the user may mutate the state (ie its draft) here
      const result = await fn(...args);

      // Collect the mutations
      const patches = states.map(state => ({
        // @ts-ignore
        stateId: state[STATE_ID],
        // @ts-ignore
        patches: state[STOP_MUTATION]()
      })) as unknown as {stateId: string, patches: Patch[]}[];

      // And apply them to the Redux state
      if (patches.some(x => x.patches.length > 0)) {
          // We could maybe move this into a middleware + reducer ?

          const groupedPatches: {[stateId: string]: Patch[]} = {};
          patches.forEach(({stateId, patches}) => {
              if (!groupedPatches[stateId]) groupedPatches[stateId] = [];
              groupedPatches[stateId].push(...patches);
          });
          store.dispatch({
              type: 'APPLY_PATCHES',
              patches: Object.entries(groupedPatches)
                  .map(([stateId, patches]) => ({stateId, patches})
              ),
          });
      }

      return result;
    }
  }