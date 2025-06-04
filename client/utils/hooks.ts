import {useCallback, useEffect, useRef} from 'react';
import { internalReconcile } from "./reconcile";

export function useEventCallback(callback) {
    const callbackRef = useRef(callback);
    useEffect(() => {
        callbackRef.current = callback;
    });
    return useCallback((...args) => callbackRef.current(...args), []);
}


/**
 * React-hook version of `cachedReconcile`.
 *
 * ```ts
 * const select = useCachedReconcile(
 *   (value: number) => ({ a: { subkey: 3 }, b: value })
 * );
 *
 * const res4 = select(4);
 * const res5 = select(5);
 * // res4 !== res5 (object identity changes)
 * // res4.a === res5.a (un-changed slice is preserved)
 * ```
 *
 * @param fn  — pure selector whose output you want to reconcile
 * @returns   — memoised selector that maximises referential equality
 */
export function useCachedReconcile<Inputs extends any[], Output>(
  fn: (...args: Inputs) => Output
): (...args: Inputs) => Output {
  const cacheRef = useRef<Output | null>(null);
  const reconciledSelector = useCallback(
    (...args: Inputs) => {
      const next = fn(...args);

      const didReconcile = internalReconcile(next, cacheRef.current);

      if (!didReconcile) cacheRef.current = next;

      return cacheRef.current as Output;
    },
    [fn]
  );

  return reconciledSelector;
}
