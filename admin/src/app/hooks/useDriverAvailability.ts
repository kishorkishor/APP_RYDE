import { useCallback, useEffect, useRef, useState } from "react";
import type { Driver } from "../data/mockData";
import { fetchDriverAvailability } from "../services/api";

export const DRIVER_AVAILABILITY_POLL_MS = 3000;

interface UseDriverAvailabilityOptions {
  /** Polling interval in ms. Defaults to 4 seconds. */
  intervalMs?: number;
  /** When false, polling is suspended (initial fetch still runs once). */
  enabled?: boolean;
  /** Seed the hook with an existing driver list to avoid a flash of empty state. */
  initial?: Driver[];
}

export interface UseDriverAvailabilityResult {
  drivers: Driver[];
  loading: boolean;
  error: string;
  /** Manually refetch now (e.g. after an assign succeeds). */
  refresh: () => Promise<void>;
  /**
   * Optimistically patch a driver in local state — used right after a successful
   * assign so the UI doesn't keep showing the driver as `available` while we
   * wait for the next poll tick.
   */
  patchDriver: (id: string, patch: Partial<Driver>) => void;
}

/**
 * Polls driver availability every `intervalMs` (default 4s).
 * - Pauses while the tab is hidden (document.visibilityState === "hidden")
 *   and refreshes immediately when it becomes visible again.
 * - Cleans up on unmount.
 * - Tolerates transient network errors without clobbering the existing list.
 */
export function useDriverAvailability(options: UseDriverAvailabilityOptions = {}): UseDriverAvailabilityResult {
  const { intervalMs = DRIVER_AVAILABILITY_POLL_MS, enabled = true, initial } = options;

  const [drivers, setDrivers] = useState<Driver[]>(initial ?? []);
  const [loading, setLoading] = useState(!initial);
  const [error, setError] = useState("");

  const mountedRef = useRef(true);
  const inFlightRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchNow = useCallback(async () => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    try {
      const next = await fetchDriverAvailability();
      if (!mountedRef.current) return;
      setDrivers(next);
      setError("");
    } catch (err) {
      if (!mountedRef.current) return;
      // Don't blank the list on transient errors — keep stale data visible.
      setError(err instanceof Error ? err.message : "Failed to load driver availability");
    } finally {
      inFlightRef.current = false;
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  const startTimer = useCallback(() => {
    if (timerRef.current) return;
    timerRef.current = setInterval(() => {
      if (typeof document !== "undefined" && document.visibilityState === "hidden") return;
      void fetchNow();
    }, intervalMs);
  }, [fetchNow, intervalMs]);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    if (!enabled) {
      stopTimer();
      return () => {
        mountedRef.current = false;
        stopTimer();
      };
    }

    void fetchNow();
    startTimer();

    const handleVisibility = () => {
      if (document.visibilityState === "hidden") {
        stopTimer();
      } else {
        // Resume: refresh immediately, then continue polling.
        void fetchNow();
        startTimer();
      }
    };

    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", handleVisibility);
    }

    return () => {
      mountedRef.current = false;
      stopTimer();
      if (typeof document !== "undefined") {
        document.removeEventListener("visibilitychange", handleVisibility);
      }
    };
  }, [enabled, fetchNow, startTimer, stopTimer]);

  const patchDriver = useCallback((id: string, patch: Partial<Driver>) => {
    setDrivers((prev) => prev.map((d) => (d.id === id ? { ...d, ...patch } : d)));
  }, []);

  return { drivers, loading, error, refresh: fetchNow, patchDriver };
}
