import { useEffect, useRef } from 'react';
import { config } from '@/lib/config';
import { toast } from 'sonner';

interface UsePollingRefreshOptions<T> {
  // Function to fetch current data
  fetchData: () => Promise<T>;
  // Function to extract a comparable value from data (e.g., count, timestamp)
  extractComparable: (data: T) => number | string;
  // Callback when new data is detected (optional, for custom handling)
  onNewData?: (oldData: T, newData: T) => void;
  // Enable/disable polling (default: true)
  enabled?: boolean;
  // Custom interval (overrides config)
  interval?: number;
  // Toast message when new data is detected
  toastMessage?: string;
}

export function usePollingRefresh<T>({
  fetchData,
  extractComparable,
  onNewData,
  enabled = true,
  interval,
  toastMessage,
}: UsePollingRefreshOptions<T>) {
  const previousValueRef = useRef<number | string | null>(null);
  const isInitialFetchRef = useRef(true);
  const fetchDataRef = useRef(fetchData);
  const extractComparableRef = useRef(extractComparable);
  const onNewDataRef = useRef(onNewData);
  const toastMessageRef = useRef(toastMessage);

  // Update refs when values change
  useEffect(() => {
    fetchDataRef.current = fetchData;
  }, [fetchData]);

  useEffect(() => {
    extractComparableRef.current = extractComparable;
  }, [extractComparable]);

  useEffect(() => {
    onNewDataRef.current = onNewData;
  }, [onNewData]);

  useEffect(() => {
    toastMessageRef.current = toastMessage;
  }, [toastMessage]);

  useEffect(() => {
    if (!enabled) return;

    const pollInterval = interval ?? config.pollingInterval;
    if (pollInterval <= 0) return;

    const checkForUpdates = async () => {
      try {
        const data = await fetchDataRef.current();
        const currentValue = extractComparableRef.current(data);

        // Skip comparison on initial fetch
        if (isInitialFetchRef.current) {
          previousValueRef.current = currentValue;
          isInitialFetchRef.current = false;
          return;
        }

        // Check if value changed
        if (previousValueRef.current !== null && currentValue !== previousValueRef.current) {
          const previousValue = previousValueRef.current;
          previousValueRef.current = currentValue;

          // Show toast if enabled
          if (config.showPollingNotifications && toastMessageRef.current && currentValue > previousValue) {
            toast.info(toastMessageRef.current, {
              duration: 4000,
              position: 'top-right',
            });
          }

          // Call custom callback
          if (onNewDataRef.current) {
            onNewDataRef.current(data as any, data as any);
          }
        } else {
          previousValueRef.current = currentValue;
        }
      } catch (error) {
        console.error('Polling refresh error:', error);
      }
    };

    // Initial check
    checkForUpdates();

    // Set up interval
    const intervalId = setInterval(checkForUpdates, pollInterval);

    return () => clearInterval(intervalId);
  }, [enabled, interval]);
}
