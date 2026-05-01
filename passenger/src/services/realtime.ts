import { client, databases, databaseId, COLLECTIONS } from '@/src/services/appwrite';
import type { DriverAssignment, DriverLocationRecord } from '@/src/types';

function safeSubscribe(channel: string, callback: (event: any) => void): () => void {
  try {
    const unsubscribe = client.subscribe(channel, callback);
    return typeof unsubscribe === 'function' ? unsubscribe : () => {};
  } catch (err) {
    console.warn('Realtime subscribe failed (WebSocket may be disconnected):', err);
    return () => {};
  }
}

export const subscribeToRide = (
  rideId: string,
  onDriverAssigned: (driver: DriverAssignment | null) => void
) => {
  const channel = `databases.${databaseId}.collections.${COLLECTIONS.RIDES}.documents.${rideId}`;
  return safeSubscribe(channel, async () => {
    try {
      const ride = await databases.getDocument({
        databaseId,
        collectionId: COLLECTIONS.RIDES,
        documentId: rideId,
      });

      if (!ride.driverId) {
        onDriverAssigned(null);
        return;
      }

      let driverPhotoUrl = '';
      let vehiclePhotoUrl = '';
      let plateNumber = ride.plateNumber || '';
      try {
        const profile = await databases.getDocument({
          databaseId,
          collectionId: COLLECTIONS.PROFILES,
          documentId: String(ride.driverId),
        });
        driverPhotoUrl = String(profile.driverPhotoUrl || profile.avatarUrl || '');
        vehiclePhotoUrl = String(profile.vehiclePhotoUrl || '');
        plateNumber = String(profile.plateNumber || plateNumber || '');
      } catch {
        // Ride data is still enough to show the assigned driver card.
      }

      const name = String(ride.driverName || 'Assigned driver');
      onDriverAssigned({
        id: String(ride.driverId),
        name,
        phone: String(ride.driverPhone || ''),
        vehicle: String(ride.vehicleLabel || ''),
        plateNumber,
        initials: name
          .split(' ')
          .slice(0, 2)
          .map((part) => part[0])
          .join('')
          .toUpperCase(),
        photoUrl: driverPhotoUrl,
        vehiclePhotoUrl,
      });
    } catch (error) {
      console.error('Ride realtime refresh failed:', error);
    }
  });
};

export const subscribeToDriverLocation = (
  driverId: string,
  onLocation: (location: DriverLocationRecord) => void
) => {
  const channel = `databases.${databaseId}.collections.${COLLECTIONS.DRIVER_LOCATIONS}.documents.${driverId}`;
  return safeSubscribe(channel, (event: any) => {
    const payload = event.payload;
    if (!payload) return;

    const lat = Number(payload.lat);
    const lng = Number(payload.lng);
    if (Number.isNaN(lat) || Number.isNaN(lng) || lat === 0 || lng === 0) return;

    onLocation({
      driverId: String(payload.driverId || driverId),
      rideId: payload.rideId || null,
      lat,
      lng,
      heading: payload.heading === null || payload.heading === undefined ? null : Number(payload.heading),
      speed: payload.speed === null || payload.speed === undefined ? null : Number(payload.speed),
      accuracy: payload.accuracy === null || payload.accuracy === undefined ? null : Number(payload.accuracy),
      status: payload.status || 'idle',
      updatedAt: String(payload.updatedAt || new Date().toISOString()),
    });
  });
};
