// ─── Zustand: Driver Ride Store ───────────────────────────────────────────────
import { create } from 'zustand';
import type { DriverRide, RideHistoryItem } from '@/src/types';
import { cacheAssignedRides, cacheActiveRide, clearRideCache } from '@/src/services/rideCache';

type RideState = {
  activeRide: DriverRide | null;
  assignedRides: DriverRide[];
  scheduledRides: DriverRide[];
  historyRides: RideHistoryItem[];
  routeGeoJSON: any | null;
  isLoadingRides: boolean;
};

type RideActions = {
  setActiveRide: (ride: DriverRide | null) => void;
  setAssignedRides: (rides: DriverRide[]) => void;
  setScheduledRides: (rides: DriverRide[]) => void;
  setHistoryRides: (rides: RideHistoryItem[]) => void;
  setRouteGeoJSON: (geojson: any | null) => void;
  setLoadingRides: (loading: boolean) => void;
  clearActiveRide: () => void;
};

export type DriverRideStore = RideState & RideActions;

const initialState: RideState = {
  activeRide: null,
  assignedRides: [],
  scheduledRides: [],
  historyRides: [],
  routeGeoJSON: null,
  isLoadingRides: false,
};

export const useDriverRideStore = create<DriverRideStore>()((set) => ({
  ...initialState,

  setActiveRide: (activeRide) => {
    set({ activeRide });
    if (activeRide) cacheActiveRide(activeRide);
  },

  setAssignedRides: (assignedRides) => {
    cacheAssignedRides(assignedRides);
    set((state) => {
      if (state.activeRide) {
        return { assignedRides };
      }
      const found = assignedRides.find(
        (r) => r.status === 'in_progress' || r.driverProgress === 'heading_pickup'
      );
      return { assignedRides, activeRide: found ?? null };
    });
  },

  setScheduledRides: (scheduledRides) => set({ scheduledRides }),

  setHistoryRides: (historyRides) => set({ historyRides }),

  setRouteGeoJSON: (routeGeoJSON) => set({ routeGeoJSON }),

  setLoadingRides: (isLoadingRides) => set({ isLoadingRides }),

  clearActiveRide: () => {
    clearRideCache();
    set({ activeRide: null, routeGeoJSON: null });
  },
}));
