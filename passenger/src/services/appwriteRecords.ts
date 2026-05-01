import { ID, Permission, Query, Role } from 'react-native-appwrite';
import type { Models } from 'react-native-appwrite';
import { account, databases, databaseId, COLLECTIONS } from '@/src/services/appwrite';
import type { RideLocation, RideRequestType, RideSelection, TripRecord, VehicleOption } from '@/src/types';

export type LoginProfileInput = {
  passengerName: string;
  projectLeader: string;
  projectCode: string;
  companyName: string;
  email: string;
  number: string;
};

export type AuthProfile = LoginProfileInput & {
  id: string;
};

type RideDocument = Models.Document & {
  riderId: string;
  passengerName?: string;
  email?: string;
  projectCode?: string;
  projectLeader?: string;
  companyName?: string;
  number?: string;
  status: string;
  pickupLat: number;
  pickupLng: number;
  pickupAddress: string;
  dropoffLat: number;
  dropoffLng: number;
  dropoffAddress: string;
  rideType: string;
  fareAmount: number;
  distanceKm?: number;
  durationMinutes?: number;
  driverId?: string;
  requestType?: RideRequestType;
  scheduledPickupAt?: string;
  requestedAt?: string;
  adminStatus?: string;
};

type VehicleClassDocument = Models.Document & {
  name: string;
  tagline?: string;
  capacity?: number;
  availabilityCount?: number;
  sortOrder?: number;
  isActive?: boolean;
};

export const normalizeEmail = (email: string) => email.trim().toLowerCase();

const FALLBACK_VEHICLE_OPTIONS: VehicleOption[] = [
  {
    id: 'premium_sedan',
    name: 'Premium Sedans',
    tagline: 'Executive sedans for private city travel',
    capacity: 4,
    availabilityCount: 0,
    sortOrder: 1,
    isActive: true,
  },
  {
    id: 'premium_suv',
    name: 'Premium SUV',
    tagline: 'Spacious premium SUVs for group comfort',
    capacity: 6,
    availabilityCount: 0,
    sortOrder: 2,
    isActive: true,
  },
  {
    id: 'custom_luxury',
    name: 'Custom Your Luxury',
    tagline: 'Tailored luxury booking for special requests',
    capacity: 4,
    availabilityCount: 0,
    sortOrder: 3,
    isActive: true,
  },
];

export const getReadableErrorMessage = (error: unknown, fallback: string) => {
  if (error && typeof error === 'object' && 'message' in error) {
    const message = String((error as { message?: unknown }).message || '').trim();
    if (message) return message;
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message.trim();
  }

  return fallback;
};

export const userDocumentPermissions = (userId: string) => [
  Permission.read(Role.user(userId)),
  Permission.update(Role.user(userId)),
  Permission.delete(Role.user(userId)),
];

export const clearCurrentSession = async () => {
  try {
    await account.deleteSession({ sessionId: 'current' });
  } catch {
    // No active session is a normal state on the login screen.
  }
};

export const sendEmailOtp = async (email: string) => {
  const token = await account.createEmailToken({
    userId: ID.unique(),
    email: normalizeEmail(email),
    phrase: true,
  });

  return {
    userId: token.userId,
    phrase: token.phrase || '',
  };
};

export const verifyEmailOtpAndSaveProfile = async (
  userId: string,
  code: string,
  profile: LoginProfileInput
): Promise<AuthProfile> => {
  const email = normalizeEmail(profile.email);

  await account.createSession({ userId, secret: code });
  const appwriteUser = await account.get();

  try {
    await account.updateName({ name: profile.passengerName.trim() });
  } catch {
    // The profile document is the source of truth for passenger details.
  }

  const data = {
    role: 'rider',
    fullName: profile.passengerName.trim(),
    passengerName: profile.passengerName.trim(),
    projectLeader: profile.projectLeader.trim(),
    projectCode: profile.projectCode.trim(),
    companyName: profile.companyName.trim(),
    email,
    phone: profile.number.trim(),
    number: profile.number.trim(),
  };

  const saved = await databases.upsertDocument({
    databaseId,
    collectionId: COLLECTIONS.PROFILES,
    documentId: appwriteUser.$id,
    data,
    permissions: userDocumentPermissions(appwriteUser.$id),
  });

  return {
    id: saved.$id,
    passengerName: data.passengerName,
    projectLeader: data.projectLeader,
    projectCode: data.projectCode,
    companyName: data.companyName,
    email,
    number: data.number,
  };
};

export const getCurrentAuthProfile = async (): Promise<AuthProfile | null> => {
  try {
    const appwriteUser = await account.get();
    const profile = await databases.getDocument({
      databaseId,
      collectionId: COLLECTIONS.PROFILES,
      documentId: appwriteUser.$id,
    });

    return {
      id: appwriteUser.$id,
      passengerName: profile.passengerName || profile.fullName || appwriteUser.name || 'VELO rider',
      projectLeader: profile.projectLeader || '',
      projectCode: profile.projectCode || '',
      companyName: profile.companyName || '',
      email: profile.email || appwriteUser.email || '',
      number: profile.number || profile.phone || '',
    };
  } catch {
    return null;
  }
};

export const listVehicleOptions = async (): Promise<VehicleOption[]> => {
  try {
    const response = await databases.listDocuments<VehicleClassDocument>({
      databaseId,
      collectionId: COLLECTIONS.VEHICLE_CLASSES,
      queries: [
        Query.equal('isActive', true),
        Query.orderAsc('sortOrder'),
        Query.limit(10),
      ],
    });

    const vehicles = response.documents.map((vehicle) => ({
      id: vehicle.$id,
      name: vehicle.name,
      tagline: vehicle.tagline || '',
      capacity: Number(vehicle.capacity || 4),
      availabilityCount: Number(vehicle.availabilityCount || 0),
      sortOrder: Number(vehicle.sortOrder || 0),
      isActive: Boolean(vehicle.isActive),
    }));

    return vehicles.length > 0 ? vehicles : FALLBACK_VEHICLE_OPTIONS;
  } catch {
    return FALLBACK_VEHICLE_OPTIONS;
  }
};

export const createRideRequest = async (params: {
  riderId: string;
  profile: Partial<LoginProfileInput>;
  pickup: RideLocation | null;
  destination: RideLocation | null;
  selectedRide: RideSelection | null;
  distanceKm: number | null;
  durationMinutes: number | null;
  requestType: RideRequestType;
  scheduledPickupAt: string | null;
}) => {
  const {
    riderId,
    profile,
    pickup,
    destination,
    selectedRide,
    distanceKm,
    durationMinutes,
    requestType,
    scheduledPickupAt,
  } = params;
  const now = new Date().toISOString();

  return databases.createDocument({
    databaseId,
    collectionId: COLLECTIONS.RIDES,
    documentId: ID.unique(),
    data: {
      riderId,
      passengerName: profile.passengerName || 'Unknown',
      email: profile.email ? normalizeEmail(profile.email) : 'Unknown',
      projectCode: profile.projectCode || 'Unknown',
      projectLeader: profile.projectLeader || 'Unknown',
      companyName: profile.companyName || 'Unknown',
      number: profile.number || '',
      status: 'pending',
      pickupLat: pickup?.latitude || 0,
      pickupLng: pickup?.longitude || 0,
      pickupAddress: pickup?.label || pickup?.address || '',
      dropoffLat: destination?.latitude || 0,
      dropoffLng: destination?.longitude || 0,
      dropoffAddress: destination?.label || destination?.address || '',
      rideType: selectedRide?.name || 'Standard',
      fareAmount: selectedRide?.fareAmount || 0,
      distanceKm: distanceKm || 0,
      durationMinutes: durationMinutes || 0,
      requestType,
      scheduledPickupAt: requestType === 'scheduled' ? scheduledPickupAt || '' : '',
      requestedAt: now,
      adminStatus: 'pending_admin_assignment',
    },
    permissions: userDocumentPermissions(riderId),
  });
};

const formatRideDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Recent trip';

  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

export const listRideHistory = async (riderId: string): Promise<TripRecord[]> => {
  const response = await databases.listDocuments<RideDocument>({
    databaseId,
    collectionId: COLLECTIONS.RIDES,
    queries: [
      Query.equal('riderId', riderId),
      Query.orderDesc('$createdAt'),
      Query.limit(50),
    ],
  });

  return response.documents.map((ride) => ({
    id: ride.$id,
    dateLabel: ride.requestType === 'scheduled' && ride.scheduledPickupAt
      ? `Scheduled ${formatRideDate(ride.scheduledPickupAt)}`
      : formatRideDate(ride.$createdAt),
    pickup: ride.pickupAddress || 'Pickup',
    dropoff: ride.dropoffAddress || 'Drop-off',
    fare: Number(ride.fareAmount || 0),
    rideName: ride.rideType || 'Standard',
    status: ride.status === 'cancelled' || ride.status === 'completed' ? ride.status : 'pending',
    durationMin: Number(ride.durationMinutes || 0),
    distanceKm: Number(ride.distanceKm || 0),
    driverName: ride.driverId || 'Pending assignment',
  }));
};
