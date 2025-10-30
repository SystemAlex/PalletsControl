import { useState, useEffect, useRef } from 'react';

/**
 * Custom hook to delay the display of a loading indicator.
 * The spinner will only show if the loading state persists for longer than the specified delay.
 * It will hide immediately when loading stops.
 *
 * @param isLoading - The raw loading state (e.g., from a react-query hook).
 * @param delayMs - The delay in milliseconds before the spinner is shown.
 * @returns A boolean indicating whether the spinner should be visible.
 */
export function useDelayedLoading(isLoading: boolean, delayMs: number = 300): boolean {
  const [showSpinner, setShowSpinner] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isLoading) {
      // If loading starts, set a timeout to show the spinner
      timerRef.current = setTimeout(() => {
        setShowSpinner(true);
      }, delayMs);
    } else {
      // If loading stops, clear any pending timeout and hide the spinner immediately
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      setShowSpinner(false);
    }

    // Cleanup function to clear the timer if the component unmounts or isLoading changes
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isLoading, delayMs]);

  return showSpinner;
}
