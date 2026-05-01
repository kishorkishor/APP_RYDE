// ─── Driver App Types ─────────────────────────────────────────────────────────

export type DriverProfile = {
  id: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  vehicleLabel: string | null;
  plateNumber: string | null;
  rideType: string | null;
  role: 'driver';
  isOnline?: boolean;
  currentRideId?: string | null;
  expoPushToken?: string;
};

export type DriverStatus =
  | 'online'
  | 'offline'
  | 'assigned'
  | 'heading_pickup'
  | 'arrived'
  | 'verified'
  | 'in_progress';

export type DriverRide = {
  id: string;
  riderId: string;
  passengerName: string;
  email: string;
  projectCode: string;
  projectLeader: string;
  companyName: string;
  number: string;
  pickupAddress: string;
  pickupLat: number;
  pickupLng: number;
  dropoffAddress: string;
  dropoffLat: number;
  dropoffLng: number;
  distanceKm: number;
  durationMinutes: number;
  rideType: string;
  status: string;
  adminStatus: string | null;
  driverId: string | null;
  driverName: string | null;
  driverPhone: string | null;
  vehicleLabel: string | null;
  requestType: 'now' | 'scheduled';
  scheduledPickupAt: string | null;
  requestedAt: string;
  // Extended driver progress fields
  driverProgress: string | null;
  passengerVerified: boolean;
  verifiedAt: string | null;
  completedAt: string | null;
  issueStatus: string | null;
  issueNote: string | null;
};

export type Coordinates = {
  latitude: number;
  longitude: number;
};

export type DriverLocationStatus = 'idle' | 'assigned' | 'on_trip';

export type DriverLocationRecord = {
  driverId: string;
  rideId: string | null;
  lat: number;
  lng: number;
  heading: number | null;
  speed: number | null;
  accuracy: number | null;
  status: DriverLocationStatus;
  updatedAt: string;
};

export type RideHistoryItem = {
  id: string;
  dateLabel: string;
  passengerName: string;
  pickup: string;
  dropoff: string;
  distanceKm: number;
  durationMin: number;
  status: string;
};
