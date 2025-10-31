import { useRef, useEffect } from 'react';

/**
 * A custom hook that returns the value of a variable from the previous render.
 * @param value The value to track.
 * @returns The value from the previous render, or undefined on the first render.
 */
export function usePrevious<T>(value: T): T | undefined {
  // FIX: Provide an explicit `undefined` initial value to `useRef`.
  // This resolves a TypeScript error where `useRef` was called with no arguments,
  // which is not supported in older versions of React's type definitions.
  // The type parameter for `useRef` is now `T | undefined` to accommodate the initial `undefined` value.
  const ref = useRef<T | undefined>(undefined);
  useEffect(() => {
    ref.current = value;
  }, [value]);
  return ref.current;
}
