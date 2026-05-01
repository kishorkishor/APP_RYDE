import { client, databaseId, COLLECTIONS } from '@/src/services/appwrite';
import { listAssignedRides } from '@/src/services/driverRecords';
import type { DriverRide } from '@/src/types';

type ActiveSub = {
  channel: string;
  handler: (response: any) => void;
  currentUnsub: () => void;
};

const activeSubs: ActiveSub[] = [];

function safeSubscribe(channel: string, handler: (response: any) => void): () => void {
  try {
    const unsub = client.subscribe(channel, handler);
    return typeof unsub === 'function' ? unsub : () => {};
  } catch {
    // WebSocket may be in a bad state (INVALID_STATE_ERR) after app
    // background/foreground cycles. Return a no-op unsubscribe.
    return () => {};
  }
}

export const pauseAllSubscriptions = () => {
  activeSubs.forEach((s) => s.currentUnsub());
};

export const reconnectSubscriptions = () => {
  activeSubs.forEach((s) => {
    try { s.currentUnsub(); } catch {}
    s.currentUnsub = safeSubscribe(s.channel, s.handler);
  });
};

export const subscribeToAssignedRides = (
  driverId: string,
  onChange: (rides: DriverRide[]) => void
) => {
  const channel = `databases.${databaseId}.collections.${COLLECTIONS.RIDES}.documents`;
  const handler = async () => {
    const rides = await listAssignedRides(driverId);
    onChange(rides);
  };

  const unsub = safeSubscribe(channel, handler);
  const entry: ActiveSub = { channel, handler, currentUnsub: unsub };
  activeSubs.push(entry);

  return () => {
    entry.currentUnsub();
    const idx = activeSubs.indexOf(entry);
    if (idx !== -1) activeSubs.splice(idx, 1);
  };
};

export const subscribeToRideCollection = (
  onChange: () => void
) => {
  const channel = `databases.${databaseId}.collections.${COLLECTIONS.RIDES}.documents`;
  const handler = () => onChange();

  const unsub = safeSubscribe(channel, handler);
  const entry: ActiveSub = { channel, handler, currentUnsub: unsub };
  activeSubs.push(entry);

  return () => {
    entry.currentUnsub();
    const idx = activeSubs.indexOf(entry);
    if (idx !== -1) activeSubs.splice(idx, 1);
  };
};

export const subscribeToRideDocument = (
  rideId: string,
  onChange: (ride: Record<string, any>) => void
) => {
  const channel = `databases.${databaseId}.collections.${COLLECTIONS.RIDES}.documents.${rideId}`;
  const handler = (response: any) => {
    if (response.payload) {
      onChange(response.payload as Record<string, any>);
    }
  };

  const unsub = safeSubscribe(channel, handler);
  const entry: ActiveSub = { channel, handler, currentUnsub: unsub };
  activeSubs.push(entry);

  return () => {
    entry.currentUnsub();
    const idx = activeSubs.indexOf(entry);
    if (idx !== -1) activeSubs.splice(idx, 1);
  };
};
