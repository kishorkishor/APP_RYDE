// ─── Driver Records Service ───────────────────────────────────────────────────
// All Appwrite operations for the driver app.
// Uses only the public client — no server-side API key here.
// ─────────────────────────────────────────────────────────────────────────────
import { ID, Permission, Query, Role } from 'react-native-appwrite';
import { withRetry } from '@/src/services/withRetry';
import type { Models } from 'react-native-appwrite';
import { account, databases, databaseId, COLLECTIONS } from '@/src/services/appwrite';
import { Sentry } from '@/src/services/sentry';
import type { DriverProfile, DriverRide, RideHistoryItem } from '@/src/types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

export const normalizeEmail = (email: string) => email.trim().toLowerCase();

export const getReadableErrorMessage = (error: unknown, fallback: string) => {
  if (error && typeof error === 'object' && 'message' in error) {
    const message = String((error as { message?: unknown }).message || '').trim();
    if (message) return message;
  }
  if (error instanceof Error && error.message.trim()) return error.message.trim();
  return fallback;
};

export const userDocumentPermissions = (userId: string) => [
  Permission.read(Role.user(userId)),
  Permission.update(Role.user(userId)),
  Permission.delete(Role.user(userId)),
];

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const clearCurrentSession = async () => {
  try {
    await account.deleteSession({ sessionId: 'current' });
  } catch {
    // No active session — normal state on login screen
  }
};

export const sendEmailOtp = async (email: string) => {
  const token = await account.createEmailToken({
    userId: ID.unique(),
    email: normalizeEmail(email),
    phrase: true,
  });
  return { userId: token.userId, phrase: token.phrase || '' };
};

export const verifyEmailOtpAndUpsertDriverProfile = async (
  userId: string,
  code: string,
  partialProfile: { email: string; fullName?: string }
): Promise<DriverProfile> => {
  const email = normalizeEmail(partialProfile.email);

  await account.createSession({ userId, secret: code });
  const appwriteUser = await account.get();
  const fullName = (partialProfile.fullName || appwriteUser.name || 'Driver').trim();
  const phone = '';

  // Upsert driver profile. The live profiles collection still has required
  // rider fields, so driver records include harmless placeholders.
  const saved = await databases.upsertDocument({
    databaseId,
    collectionId: COLLECTIONS.PROFILES,
    documentId: appwriteUser.$id,
    data: {
      role: 'driver',
      fullName,
      passengerName: fullName || 'Driver',
      projectLeader: 'DRIVER',
      projectCode: 'DRIVER',
      number: phone || 'N/A',
      email,
      phone,
      vehicleLabel: '',
      plateNumber: '',
      rideType: '',
      isOnline: true,
    },
    permissions: userDocumentPermissions(appwriteUser.$id),
  });

  return {
    id: saved.$id,
    fullName: String(saved.fullName || saved.passengerName || 'Driver'),
    email: String(saved.email || email),
    phone: String(saved.phone || saved.number || ''),
    vehicleLabel: String(saved.vehicleLabel || ''),
    plateNumber: String(saved.plateNumber || ''),
    rideType: String(saved.rideType || ''),
    role: 'driver',
    isOnline: Boolean(saved.isOnline ?? true),
    currentRideId: saved.currentRideId || null,
  };
};

// ─── Profile ──────────────────────────────────────────────────────────────────

export const getCurrentDriverProfile = async (): Promise<DriverProfile | null> => {
  try {
    const appwriteUser = await account.get();
    const profile = await databases.getDocument({
      databaseId,
      collectionId: COLLECTIONS.PROFILES,
      documentId: appwriteUser.$id,
    });

    if (profile.role !== 'driver') {
      // Not a driver account
      return null;
    }

    return {
      id: appwriteUser.$id,
      fullName: String(profile.fullName || profile.passengerName || appwriteUser.name || 'Driver'),
      email: String(profile.email || appwriteUser.email || ''),
      phone: String(profile.phone || profile.number || ''),
      vehicleLabel: String(profile.vehicleLabel || ''),
      plateNumber: String(profile.plateNumber || ''),
      rideType: String(profile.rideType || ''),
      role: 'driver',
      isOnline: Boolean(profile.isOnline ?? true),
      currentRideId: profile.currentRideId || null,
    };
  } catch {
    return null;
  }
};

/**
 * Update driver online/offline state in Appwrite.
 * Writes only `isOnline` (the `availability` attribute does not exist on
 * profiles — admin derives it from isOnline + currentRideId server-side).
 * Throws on failure so the caller can surface an error toast and revert
 * local state if needed.
 */
export const updateDriverOnlineStatus = async (
  userId: string,
  isOnline: boolean
): Promise<void> => {
  await withRetry(() =>
    databases.updateDocument({
      databaseId,
      collectionId: COLLECTIONS.PROFILES,
      documentId: userId,
      data: { isOnline },
    })
  );
};

// ─── Push Token ──────────────────────────────────────────────────────────────

export const savePushToken = async (
  userId: string,
  expoPushToken: string,
): Promise<void> => {
  await databases.updateDocument({
    databaseId,
    collectionId: COLLECTIONS.PROFILES,
    documentId: userId,
    data: { expoPushToken },
  });
};

// ─── Ride document type ───────────────────────────────────────────────────────

type RideDocument = Models.Document & {
  riderId: string;
  passengerName?: string;
  email?: string;
  projectCode?: string;
  projectLeader?: string;
  companyName?: string;
  number?: string;
  status: string;
  adminStatus?: string;
  pickupLat: number;
  pickupLng: number;
  pickupAddress: string;
  dropoffLat: number;
  dropoffLng: number;
  dropoffAddress: string;
  rideType: string;
  fareAmount?: number;
  distanceKm?: number;
  durationMinutes?: number;
  driverId?: string;
  driverName?: string;
  driverPhone?: string;
  vehicleLabel?: string;
  requestType?: string;
  scheduledPickupAt?: string;
  requestedAt?: string;
  driverProgress?: string;
  passengerVerified?: boolean;
  verifiedAt?: string;
  completedAt?: string;
  issueStatus?: string;
  issueNote?: string;
};

const toDriverRide = (doc: RideDocument): DriverRide => ({
  id: doc.$id,
  riderId: doc.riderId,
  passengerName: doc.passengerName || 'Passenger',
  email: doc.email || '',
  projectCode: doc.projectCode || '',
  projectLeader: doc.projectLeader || '',
  companyName: doc.companyName || '',
  number: doc.number || '',
  pickupAddress: doc.pickupAddress,
  pickupLat: Number(doc.pickupLat || 0),
  pickupLng: Number(doc.pickupLng || 0),
  dropoffAddress: doc.dropoffAddress,
  dropoffLat: Number(doc.dropoffLat || 0),
  dropoffLng: Number(doc.dropoffLng || 0),
  distanceKm: Number(doc.distanceKm || 0),
  durationMinutes: Number(doc.durationMinutes || 0),
  rideType: doc.rideType || 'Standard',
  status: doc.status,
  adminStatus: doc.adminStatus || null,
  driverId: doc.driverId || null,
  driverName: doc.driverName || null,
  driverPhone: doc.driverPhone || null,
  vehicleLabel: doc.vehicleLabel || null,
  requestType: (doc.requestType as 'now' | 'scheduled') || 'now',
  scheduledPickupAt: doc.scheduledPickupAt || null,
  requestedAt: doc.requestedAt || doc.$createdAt,
  driverProgress: doc.driverProgress || null,
  passengerVerified: Boolean(doc.passengerVerified),
  verifiedAt: doc.verifiedAt || null,
  completedAt: doc.completedAt || null,
  issueStatus: doc.issueStatus || null,
  issueNote: doc.issueNote || null,
});

// ─── Ride Queries ─────────────────────────────────────────────────────────────

/** Active rides assigned to this driver (assigned + in_progress) */
export const listAssignedRides = async (driverId: string): Promise<DriverRide[]> => {
  try {
    const response = await databases.listDocuments<RideDocument>({
      databaseId,
      collectionId: COLLECTIONS.RIDES,
      queries: [
        Query.equal('driverId', driverId),
        Query.orderDesc('$createdAt'),
        Query.limit(20),
      ],
    });
    return response.documents
      .filter((doc) => !['completed', 'cancelled'].includes(String(doc.status)))
      .map(toDriverRide);
  } catch {
    return [];
  }
};

/** Scheduled upcoming rides for this driver */
export const listScheduledRides = async (driverId: string): Promise<DriverRide[]> => {
  try {
    const response = await databases.listDocuments<RideDocument>({
      databaseId,
      collectionId: COLLECTIONS.RIDES,
      queries: [
        Query.equal('driverId', driverId),
        Query.equal('requestType', 'scheduled'),
        Query.limit(30),
      ],
    });
    return response.documents
      .filter((doc) => !['completed', 'cancelled'].includes(String(doc.status)))
      .sort((a, b) =>
        String(a.scheduledPickupAt || '').localeCompare(String(b.scheduledPickupAt || ''))
      )
      .map(toDriverRide);
  } catch {
    return [];
  }
};

/** Completed/cancelled scheduled rides for this driver (for schedule Completed tab) */
export const listCompletedScheduledRides = async (driverId: string): Promise<DriverRide[]> => {
  try {
    const response = await databases.listDocuments<RideDocument>({
      databaseId,
      collectionId: COLLECTIONS.RIDES,
      queries: [
        Query.equal('driverId', driverId),
        Query.equal('requestType', 'scheduled'),
        Query.orderDesc('$createdAt'),
        Query.limit(30),
      ],
    });
    return response.documents
      .filter((doc) => ['completed', 'cancelled'].includes(String(doc.status)))
      .map(toDriverRide);
  } catch {
    return [];
  }
};

/** All rides for this driver (for history) */
export const listDriverRideHistory = async (driverId: string): Promise<RideHistoryItem[]> => {
  try {
    const response = await databases.listDocuments<RideDocument>({
      databaseId,
      collectionId: COLLECTIONS.RIDES,
      queries: [
        Query.equal('driverId', driverId),
        Query.orderDesc('$createdAt'),
        Query.limit(50),
      ],
    });

    return response.documents.map((doc) => ({
      id: doc.$id,
      dateLabel: formatRideDate(doc),
      passengerName: doc.passengerName || 'Passenger',
      pickup: doc.pickupAddress,
      dropoff: doc.dropoffAddress,
      distanceKm: Number(doc.distanceKm || 0),
      durationMin: Number(doc.durationMinutes || 0),
      status: doc.status,
    }));
  } catch {
    return [];
  }
};

const formatRideDate = (doc: RideDocument) => {
  const value = doc.requestType === 'scheduled' && doc.scheduledPickupAt
    ? doc.scheduledPickupAt
    : doc.requestedAt || doc.$createdAt;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Recent ride';
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

// ─── Ride Event Logging ──────────────────────────────────────────────────────

const logRideEvent = async (data: Record<string, unknown>): Promise<void> => {
  try {
    await databases.createDocument({
      databaseId,
      collectionId: COLLECTIONS.RIDE_EVENTS,
      documentId: ID.unique(),
      data: { createdAt: new Date().toISOString(), ...data },
    });
  } catch {
    // best-effort logging
  }
};

// ─── Ride Status Updates ──────────────────────────────────────────────────────

export type RideStatusUpdate = {
  status?: string;
  adminStatus?: string;
  driverProgress?: string;
  passengerVerified?: boolean;
  verifiedAt?: string;
  completedAt?: string;
  issueStatus?: string;
  issueNote?: string;
};

export const updateRideStatus = async (
  rideId: string,
  updates: RideStatusUpdate
): Promise<void> => {
  // Filter out undefined values
  const data = Object.fromEntries(
    Object.entries(updates).filter(([, v]) => v !== undefined)
  );
  try {
    await withRetry(() =>
      databases.updateDocument({
        databaseId,
        collectionId: COLLECTIONS.RIDES,
        documentId: rideId,
        data,
      })
    );
  } catch (error) {
    Sentry.captureException(error, { extra: { rideId, updates: data } });
    throw error;
  }
};

/**
 * Set the driver's currentRideId in the profiles collection.
 * Pass an empty string to clear it (after ride completion / cancellation).
 * Note: there is no `availability` attribute on profiles — admin derives
 * it from { isOnline, currentRideId } + active rides.
 */
const setDriverCurrentRide = async (
  driverId: string,
  currentRideId: string
): Promise<void> => {
  await withRetry(
    () =>
      databases.updateDocument({
        databaseId,
        collectionId: COLLECTIONS.PROFILES,
        documentId: driverId,
        data: { currentRideId },
      }),
    { maxAttempts: 4, baseDelayMs: 300 }
  );
};

/**
 * Accept a ride. Idempotent: if the ride already has a non-empty
 * `driverProgress` (arrived / picked_up / completed), this is a no-op so
 * stale callers cannot roll trip state backwards.
 */
export const acceptRide = async (
  rideId: string,
  driverId?: string,
  driverName?: string
): Promise<void> => {
  let existingProgress = '';
  try {
    const ride = await databases.getDocument({
      databaseId,
      collectionId: COLLECTIONS.RIDES,
      documentId: rideId,
    });
    existingProgress = String((ride as any).driverProgress || '');
  } catch {
    // If we can't read the ride, fall through and attempt the write.
  }
  if (existingProgress && existingProgress !== 'heading_pickup') {
    // Already past 'heading_pickup' — do not clobber.
    if (driverId) {
      try { await setDriverCurrentRide(driverId, rideId); } catch {}
    }
    return;
  }

  await updateRideStatus(rideId, {
    status: 'accepted',
    adminStatus: 'heading_pickup',
    driverProgress: 'heading_pickup',
  });
  if (driverId) {
    try { await setDriverCurrentRide(driverId, rideId); } catch (e) {
      console.warn('[acceptRide] setDriverCurrentRide failed', e);
    }
  }
  await logRideEvent({
    rideId,
    driverId: driverId || '',
    driverName: driverName || '',
    action: 'accepted',
    actorId: driverId || '',
    actorName: driverName || 'Driver',
  });
};

/** Mark arrived at pickup */
export const markArrived = async (
  rideId: string,
  driverId?: string,
  driverName?: string
): Promise<void> => {
  await updateRideStatus(rideId, {
    adminStatus: 'arrived',
    driverProgress: 'arrived',
  });
  await logRideEvent({
    rideId,
    driverId: driverId || '',
    driverName: driverName || '',
    action: 'arrived_pickup',
    actorId: driverId || '',
    actorName: driverName || 'Driver',
  });
};

/** Mark passenger picked up */
export const markPickedUp = async (
  rideId: string,
  driverId?: string,
  driverName?: string
): Promise<void> => {
  await updateRideStatus(rideId, {
    status: 'in_progress',
    adminStatus: 'in_progress',
    driverProgress: 'picked_up',
    passengerVerified: true,
    verifiedAt: new Date().toISOString(),
  });
  await logRideEvent({
    rideId,
    driverId: driverId || '',
    driverName: driverName || '',
    action: 'picked_up',
    actorId: driverId || '',
    actorName: driverName || 'Driver',
  });
};

/** Verify passenger and start trip */
export const startTrip = async (
  rideId: string,
  driverId?: string,
  driverName?: string
): Promise<void> => {
  await updateRideStatus(rideId, {
    status: 'in_progress',
    adminStatus: 'in_progress',
    driverProgress: 'in_progress',
    passengerVerified: true,
    verifiedAt: new Date().toISOString(),
  });
  await logRideEvent({
    rideId,
    driverId: driverId || '',
    driverName: driverName || '',
    action: 'trip_started',
    actorId: driverId || '',
    actorName: driverName || 'Driver',
  });
};

/** End trip and mark completed. Clears driver currentRideId. */
export const completeRide = async (
  rideId: string,
  driverId?: string,
  driverName?: string
): Promise<void> => {
  await updateRideStatus(rideId, {
    status: 'completed',
    adminStatus: 'completed',
    driverProgress: 'completed',
    completedAt: new Date().toISOString(),
  });
  if (driverId) {
    await setDriverCurrentRide(driverId, '');
  }
  await logRideEvent({
    rideId,
    driverId: driverId || '',
    driverName: driverName || '',
    action: 'completed',
    actorId: driverId || '',
    actorName: driverName || 'Driver',
  });
};

/** Report an issue on a ride */
export const reportRideIssue = async (
  rideId: string,
  issueStatus: string,
  issueNote: string
): Promise<void> => {
  await updateRideStatus(rideId, { issueStatus, issueNote });
};
