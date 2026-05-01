import { useCallback, useEffect, useRef, useState } from "react";
import type { Driver, Ride, VehicleClass } from "../data/mockData";
import { fetchAdminData } from "../services/api";
import { useDriverAvailability } from "./useDriverAvailability";

const RIDE_POLL_MS = 10_000;

/**
 * Loads rides + vehicle classes and polls every 10s to keep them fresh.
 * Driver list is kept fresh via the availability hook (~3s).
 */
export function useAdminData() {
  const [rides, setRides] = useState<Ride[]>([]);
  const [vehicleClasses, setVehicleClasses] = useState<VehicleClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [seedDrivers, setSeedDrivers] = useState<Driver[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadRides = useCallback(async () => {
    try {
      const data = await fetchAdminData();
      setRides(data.rides);
      setVehicleClasses(data.vehicleClasses);
      setSeedDrivers(data.drivers);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load admin data");
    } finally {
      setLoading(false);
    }
  }, []);

  const reload = useCallback(async () => {
    setError("");
    await loadRides();
  }, [loadRides]);

  useEffect(() => {
    loadRides();

    timerRef.current = setInterval(() => {
      if (typeof document !== "undefined" && document.visibilityState === "hidden") return;
      loadRides();
    }, RIDE_POLL_MS);

    const handleVisibility = () => {
      if (document.visibilityState === "visible") loadRides();
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [loadRides]);

  const {
    drivers,
    error: driverError,
    refresh: refreshDrivers,
    patchDriver,
  } = useDriverAvailability({ initial: seedDrivers });

  return {
    rides,
    drivers,
    vehicleClasses,
    loading,
    error: error || driverError,
    reload,
    refreshDrivers,
    patchDriver,
  };
}
