// ─── Ride Store ───────────────────────────────────────────────────────────────
import { create } from 'zustand';
import type {
  Coordinates,
  RideRecord,
  RideLocation,
  RideSelection,
  RideStatus,
  DriverAssignment,
  RideRequestType,
} from '@/src/types';

type RideStoreState = {
  pickup: RideLocation | null;
  pickupCoords: Coordinates | null;
  destination: RideLocation | null;
  selectedRide: RideSelection | null;
  activeRide: RideRecord | null;
  requestType: RideRequestType;
  scheduledPickupAt: string | null;
  status: RideStatus;
  driver: DriverAssignment | null;
  distanceKm: number | null;
  durationMinutes: number | null;
  fareAmount: number | null;
  routeGeoJSON: any | null;
};

type RideStoreActions = {
  setPickup: (pickup: RideLocation | null) => void;
  setPickupCoords: (coords: Coordinates | null) => void;
  setDestination: (destination: RideLocation | null) => void;
  setSelectedRide: (ride: RideSelection | null) => void;
  setActiveRide: (ride: RideRecord | null) => void;
  setRequestType: (requestType: RideRequestType) => void;
  setScheduledPickupAt: (scheduledPickupAt: string | null) => void;
  setStatus: (status: RideStatus) => void;
  setDriver: (driver: DriverAssignment | null) => void;
  setRouteDetails: (distance: number, duration: number, geojson: any) => void;
  setFareAmount: (fare: number) => void;
  resetRide: () => void;
};

export type RideStore = RideStoreState & RideStoreActions;

const initialState: RideStoreState = {
  pickup: null,
  pickupCoords: null,
  destination: null,
  selectedRide: null,
  activeRide: null,
  requestType: 'now',
  scheduledPickupAt: null,
  status: 'draft',
  driver: null,
  distanceKm: null,
  durationMinutes: null,
  fareAmount: null,
  routeGeoJSON: null,
};

export const useRideStore = create<RideStore>()((set) => ({
  ...initialState,

  setPickup: (pickup) =>
    set({
      pickup,
      pickupCoords:
        pickup?.latitude && pickup?.longitude
          ? { latitude: pickup.latitude, longitude: pickup.longitude }
          : null,
    }),

  setPickupCoords: (pickupCoords) => set({ pickupCoords }),

  setDestination: (destination) => set({ destination }),

  setSelectedRide: (selectedRide) => set({ selectedRide }),

  setActiveRide: (activeRide) =>
    set({
      activeRide,
      requestType: activeRide?.requestType ?? 'now',
      scheduledPickupAt: activeRide?.scheduledPickupAt ?? null,
      status: activeRide?.status ?? 'draft',
      driver: activeRide?.driver ?? null,
    }),

  setRequestType: (requestType) =>
    set((state) => ({
      requestType,
      scheduledPickupAt: requestType === 'now' ? null : state.scheduledPickupAt,
    })),

  setScheduledPickupAt: (scheduledPickupAt) => set({ scheduledPickupAt }),

  setStatus: (status) => set({ status }),

  setDriver: (driver) => set({ driver }),

  setRouteDetails: (distanceKm, durationMinutes, routeGeoJSON) => 
    set({ distanceKm, durationMinutes, routeGeoJSON }),

  setFareAmount: (fareAmount) => set({ fareAmount }),

  resetRide: () => set(initialState),
}));
