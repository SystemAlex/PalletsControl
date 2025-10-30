import { useState, useEffect } from 'react';

/**
 * Custom hook to debounce a value.
 * The debounced value will only update after the specified delay has passed
 * since the last time the value changed.
 *
 * @param value - The value to debounce (e.g., input text).
 * @param delay - The delay in milliseconds.
 * @returns The debounced value.
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Set a timeout to update the debounced value
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Cleanup function: clear the timeout if value changes before the delay is reached
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
