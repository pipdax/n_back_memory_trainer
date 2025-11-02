import { useRef, useEffect } from 'react';

/**
 * A custom hook that returns the value of a variable from the previous render.
 * @param value The value to track.
 * @returns The value from the previous render, or undefined on the first render.
 */
export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T | undefined>();
  useEffect(() => {
    ref.current = value;
  }, [value]);
  return ref.current;
}