// ─── Shared Types ──────────────────────────────────────────────────────────────

export type Coordinates = {
  latitude: number;
  longitude: number;
};

export type CityBounds = [west: number, south: number, east: number, north: number];

export type CityConfig = {
  id: string;
  name: string;
  countryCode: string;
  language: string;
  center: [longitude: number, latitude: number];
  bounds: CityBounds;
  defaultZoom: number;
  minZoom: number;
  maxZoom: number;
};

export type RideStatus =
  | 'draft'
  | 'pending'
  | 'admin_review'
  | 'driver_assigned'
  | 'accepted'
  | 'driver_arriving'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export type PaymentStatus = 'pending' | 'approved' | 'rejected';
export type RideRequestType = 'now' | 'scheduled';

export type UserRole = 'rider' | 'driver' | 'admin';

export type RideLocation = {
  label: string;
  address?: string;
  secondaryText?: string;
  latitude?: number;
  longitude?: number;
  placeId?: string;
  cityId?: string;
  countryCode?: string;
  distanceKm?: number;
  durationMin?: number;
};

export type RideSelection = {
  id: string;
  name: string;
  etaMinutes?: number;
  fareAmount?: number;
};

export type VehicleOption = {
  id: string;
  name: string;
  tagline: string;
  capacity: number;
  availabilityCount: number;
  sortOrder: number;
  isActive: boolean;
};

export type FareQuote = {
  amount: number;
  currency: string;
  baseFare?: number;
  serviceFee?: number;
};

export type DriverAssignment = {
  id?: string;
  name: string;
  rating?: number;
  totalTrips?: number;
  vehicle?: string;
  vehicleColor?: string;
  plateNumber?: string;
  phone?: string;
  initials?: string;
  avatarBg?: string;
  etaMinutes?: number;
  distanceAway?: string;
  photoUrl?: string;
  vehiclePhotoUrl?: string;
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

export type RideRecord = {
  id: string;
  riderId: string;
  cityId: string;
  requestType?: RideRequestType;
  scheduledPickupAt?: string | null;
  pickup: RideLocation;
  destination: RideLocation;
  selectedRide: RideSelection | null;
  fare: FareQuote | null;
  paymentStatus: PaymentStatus;
  status: RideStatus;
  paymentMethod?: string | null;
  driver?: DriverAssignment | null;
  createdAt: string;
  updatedAt: string;
};

export type ProfileRecord = {
  id: string;
  role: UserRole;
  fullName: string;
  phone?: string | null;
  email?: string | null;
  avatarUrl?: string | null;
  rating?: number;
  totalTrips?: number;
  memberSince?: string;
  createdAt: string;
  updatedAt: string;
};

export type SavedPlaceRecord = {
  id: string;
  riderId: string;
  label: string;
  address: string;
  latitude: number;
  longitude: number;
  kind: 'home' | 'work' | 'saved';
  cityId: string;
  createdAt: string;
  updatedAt: string;
};

export type LocationEntity = RideLocation;

export type RideOption = {
  id: string;
  name: string;
  tagline: string;
  eta: number;
  capacity: number;
  availabilityCount: number;
  sortOrder: number;
  isActive: boolean;
};

export type TripRecord = {
  id: string;
  dateLabel: string;
  pickup: string;
  dropoff: string;
  fare: number;
  rideName: string;
  status: 'completed' | 'cancelled' | 'pending';
  durationMin: number;
  distanceKm: number;
  driverName: string;
  rating?: number;
};

export type PaymentCard = {
  id: string;
  type: 'visa' | 'mastercard' | 'wallet' | 'cash';
  label: string;
  last4?: string;
  isDefault: boolean;
  balance?: number;
};
