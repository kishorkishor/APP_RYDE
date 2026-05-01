import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { Query, ID, Permission, Role } from 'node-appwrite';
import { databases, databaseId, COLLECTIONS } from './appwrite';
import * as dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// CORS Configuration
const allowedOrigins = process.env.ADMIN_ALLOWED_ORIGINS?.split(',') || [
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
];
app.use(cors({
  origin: (origin, callback) => {
    const isLocalDevOrigin = !!origin && /^https?:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin);
    if (!origin || allowedOrigins.includes(origin) || isLocalDevOrigin) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
}));

const logRouteError = (label: string, err: unknown) => {
  console.error(label, err);
};

const errorResponse = (res: Response, status: number, error: string) =>
  res.status(status).json({ error });

const mergePermissions = (existing: string[] = [], additions: string[]) => {
  const merged = new Set(existing);
  for (const permission of additions) merged.add(permission);
  return Array.from(merged);
};

const createRideEvent = async (data: Record<string, unknown>) => {
  try {
    await databases.createDocument(databaseId, COLLECTIONS.RIDE_EVENTS, ID.unique(), {
      createdAt: new Date().toISOString(),
      ...data,
    });
  } catch (err) {
    logRouteError('Failed to create ride event', err);
  }
};

/**
 * Set or clear a driver's currentRideId. There is NO `availability` attribute
 * on the profiles collection — admin/clients derive availability from
 * { isOnline, currentRideId, has-active-ride }.
 */
const updateDriverCurrentRide = async (driverId: string, currentRideId: string) => {
  try {
    await databases.updateDocument(databaseId, COLLECTIONS.PROFILES, driverId, {
      currentRideId,
    });
  } catch (err) {
    logRouteError('Failed to update driver current ride', err);
  }
};

const ACTIVE_RIDE_STATUSES = new Set([
  'assigned',
  'accepted',
  'heading_pickup',
  'arrived',
  'picked_up',
  'in_progress',
]);

const TERMINAL_RIDE_STATUSES = new Set(['completed', 'cancelled']);

const normalizeStatus = (value: unknown) => String(value || '').toLowerCase();

const isRideActiveForDriver = (ride: any) => {
  const status = normalizeStatus(ride.status);
  const adminStatus = normalizeStatus(ride.adminStatus);
  const progress = normalizeStatus(ride.driverProgress);

  // Terminal ride status is authoritative. This prevents a stale
  // driverProgress value like "picked_up" from keeping a completed ride busy.
  if (TERMINAL_RIDE_STATUSES.has(status) || TERMINAL_RIDE_STATUSES.has(adminStatus)) {
    return false;
  }

  return ACTIVE_RIDE_STATUSES.has(status) || ACTIVE_RIDE_STATUSES.has(progress);
};

const STALE_RIDE_MS = 4 * 60 * 60 * 1000; // 4 hours

const autoCompleteStaleRide = async (ride: any) => {
  try {
    await databases.updateDocument(databaseId, COLLECTIONS.RIDES, ride.$id, {
      status: 'completed',
      adminStatus: 'completed',
      driverProgress: 'completed',
      completedAt: new Date().toISOString(),
    });
    if (ride.driverId) {
      await updateDriverCurrentRide(String(ride.driverId), '');
    }
    console.log(`[cleanup] Auto-completed stale ride ${ride.$id}`);
  } catch (err) {
    logRouteError(`Failed to auto-complete stale ride ${ride.$id}`, err);
  }
};

const assertDriverAvailable = async (driverId: string) => {
  const driver = await databases.getDocument(databaseId, COLLECTIONS.PROFILES, driverId);

  if (driver.role !== 'driver') {
    throw Object.assign(new Error('Profile is not a driver'), {
      statusCode: 400,
      code: 'not_driver',
    });
  }
  if (driver.isOnline === false) {
    throw Object.assign(new Error('Driver is offline'), {
      statusCode: 409,
      code: 'driver_offline',
    });
  }

  const activeRides = await databases.listDocuments(databaseId, COLLECTIONS.RIDES, [
    Query.equal('driverId', driverId),
    Query.orderDesc('$updatedAt'),
    Query.limit(10),
  ]);

  const now = Date.now();
  let busyRide: any = null;
  for (const ride of activeRides.documents) {
    if (!isRideActiveForDriver(ride)) continue;
    const updatedAt = new Date(ride.$updatedAt || ride.$createdAt).getTime();
    if (now - updatedAt > STALE_RIDE_MS) {
      await autoCompleteStaleRide(ride);
    } else {
      busyRide = ride;
      break;
    }
  }

  if (busyRide) {
    throw Object.assign(new Error('Driver is already assigned to an active ride'), {
      statusCode: 409,
      code: 'driver_busy',
    });
  }

  if (driver.currentRideId) {
    await updateDriverCurrentRide(driverId, '');
  }

  return driver;
};

/**
 * Compute availability for a single driver document.
 * Caller may pass an optional `hasActiveRide` to avoid a second roundtrip.
 */
const deriveAvailability = (
  driver: any,
  hasActiveRide: boolean
): 'available' | 'on_ride' | 'unavailable' => {
  if (driver.isOnline === false) return 'unavailable';
  if (hasActiveRide) return 'on_ride';
  return 'available';
};

app.post('/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body || {};
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) {
    return res.status(500).json({ error: 'Admin auth is not configured' });
  }
  const adminPassword = process.env.ADMIN_PASSWORD || process.env.ADMIN_API_TOKEN;
  const adminToken = process.env.ADMIN_API_TOKEN;

  if (!adminToken || !adminPassword) {
    return res.status(500).json({ error: 'Admin auth is not configured' });
  }

  const isValidPassword = password === adminPassword || password === adminToken;

  if (email !== adminEmail || !isValidPassword) {
    return res.status(401).json({ error: 'Invalid admin credentials' });
  }

  res.json({
    token: adminToken,
    user: {
      id: 'admin',
      email: adminEmail,
      name: process.env.ADMIN_NAME || 'Admin',
    },
  });
});

// Auth Middleware
const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const adminToken = process.env.ADMIN_API_TOKEN;

  if (!adminToken) {
    console.error('⚠️ ADMIN_API_TOKEN is not set in environment variables');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  if (!authHeader || !authHeader.startsWith('Bearer ') || authHeader.split(' ')[1] !== adminToken) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  next();
};

// 1. Health Check
app.get('/health', async (req: Request, res: Response) => {
  try {
    // Check Appwrite connectivity
    await databases.listCollections(databaseId, [Query.limit(1)]);
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      appwrite: 'connected'
    });
  } catch (err: any) {
    logRouteError('Health check failed', err);
    res.status(500).json({
      status: 'error',
      appwrite: 'disconnected'
    });
  }
});

// Apply Auth Middleware to all following routes
app.use(authMiddleware);

// 2. List Rides
app.get('/rides', async (req: Request, res: Response) => {
  try {
    const status = req.query.status as string | undefined;
    const adminStatus = req.query.adminStatus as string | undefined;
    const projectCode = req.query.projectCode as string | undefined;
    const requestType = req.query.requestType as string | undefined;
    const dateFrom = req.query.dateFrom as string | undefined;
    const dateTo = req.query.dateTo as string | undefined;
    const limit = req.query.limit as string | undefined;
    const offset = req.query.offset as string | undefined;
    
    const queries = [Query.orderDesc('$createdAt')];
    
    if (status) queries.push(Query.equal('status', status));
    if (adminStatus) queries.push(Query.equal('adminStatus', adminStatus));
    if (projectCode) queries.push(Query.equal('projectCode', projectCode));
    if (requestType) queries.push(Query.equal('requestType', requestType));
    
    if (dateFrom) queries.push(Query.greaterThanEqual('$createdAt', dateFrom));
    if (dateTo) queries.push(Query.lessThanEqual('$createdAt', dateTo));
    
    queries.push(Query.limit(limit ? parseInt(limit) : 25));
    queries.push(Query.offset(offset ? parseInt(offset) : 0));

    const response = await databases.listDocuments(databaseId, COLLECTIONS.RIDES, queries);
    res.json(response);
  } catch (err: any) {
    logRouteError('Failed to fetch rides', err);
    errorResponse(res, 500, 'Failed to fetch rides');
  }
});

// 3. Get Ride Details
app.get('/rides/:rideId', async (req: Request, res: Response) => {
  try {
    const rideId = req.params.rideId as string;
    const ride = await databases.getDocument(databaseId, COLLECTIONS.RIDES, rideId);
    res.json(ride);
  } catch (err: any) {
    logRouteError('Failed to fetch ride', err);
    const status = err.code === 404 ? 404 : 500;
    errorResponse(res, status, status === 404 ? 'Ride not found' : 'Failed to fetch ride');
  }
});

// 4. Update Ride/Admin Status
app.patch('/rides/:rideId/status', async (req: Request, res: Response) => {
  try {
    const rideId = req.params.rideId as string;
    const { status, adminStatus, actorName, notes } = req.body;

    const allowedStatuses = ['pending', 'calling', 'confirmed', 'accepted', 'assigned', 'heading_pickup', 'arrived', 'in_progress', 'completed', 'cancelled'];
    const allowedAdminStatuses = ['pending_admin_assignment', 'calling', 'confirmed', 'assigned', 'heading_pickup', 'arrived', 'in_progress', 'dispatched', 'completed', 'cancelled'];

    if (status && !allowedStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    if (adminStatus && !allowedAdminStatuses.includes(adminStatus)) {
      return res.status(400).json({ error: 'Invalid adminStatus' });
    }

    const data: any = {};
    if (status) data.status = status;
    if (adminStatus) data.adminStatus = adminStatus;

    const isTerminal =
      (status && TERMINAL_RIDE_STATUSES.has(status)) ||
      (adminStatus && TERMINAL_RIDE_STATUSES.has(adminStatus));
    if (isTerminal) {
      data.driverProgress = status || adminStatus;
    }

    const updated = await databases.updateDocument(databaseId, COLLECTIONS.RIDES, rideId, data);

    // Clear driver currentRideId when the ride leaves the active set
    if (isTerminal && updated.driverId) {
      await updateDriverCurrentRide(String(updated.driverId), '');
    }

    await createRideEvent({
      rideId,
      action: 'status_updated',
      actorId: 'admin',
      actorName: actorName || 'Admin',
      driverId: updated.driverId || '',
      notes: notes || `Status updated to ${status || adminStatus}`,
    });
    res.json(updated);
  } catch (err: any) {
    logRouteError('Failed to update ride status', err);
    errorResponse(res, 500, 'Update failed');
  }
});

// 5. Assign Driver
app.patch('/rides/:rideId/assign-driver', async (req: Request, res: Response) => {
  try {
    const rideId = req.params.rideId as string;
    const { driverId, driverName, driverPhone, vehicleLabel, assignedBy, assignedByName } = req.body;

    if (!driverId || typeof driverId !== 'string') {
      return res.status(400).json({ error: 'driverId is required' });
    }

    try {
      await assertDriverAvailable(driverId);
    } catch (e: any) {
      return res.status(e.statusCode || 400).json({
        error: e.message,
        code: e.code || 'driver_unavailable',
      });
    }

    const ride = await databases.getDocument(databaseId, COLLECTIONS.RIDES, rideId);
    const permissions = mergePermissions(ride.$permissions || [], [
      Permission.read(Role.user(driverId)),
      Permission.update(Role.user(driverId)),
    ]);

    const data = {
      driverId,
      driverName: driverName || '',
      driverPhone: driverPhone || '',
      vehicleLabel: vehicleLabel || '',
      status: 'assigned',
      adminStatus: 'assigned'
    };

    const updated = await databases.updateDocument(
      databaseId,
      COLLECTIONS.RIDES,
      rideId,
      data,
      permissions
    );
    await updateDriverCurrentRide(driverId, rideId);
    await createRideEvent({
      rideId,
      action: 'driver_assigned',
      actorId: assignedBy || 'admin',
      actorName: assignedByName || 'Admin',
      driverId,
      driverName: driverName || '',
      pickupAddress: ride.pickupAddress || '',
      dropoffAddress: ride.dropoffAddress || '',
      notes: `Assigned ${driverName || driverId} to ${ride.pickupAddress || 'pickup'} -> ${ride.dropoffAddress || 'dropoff'}`,
    });
    res.json(updated);
  } catch (err: any) {
    logRouteError('Driver assignment failed', err);
    errorResponse(res, err.code === 404 ? 404 : 500, err.code === 404 ? 'Ride not found' : 'Assignment failed');
  }
});

app.patch('/rides/:rideId/unassign-driver', async (req: Request, res: Response) => {
  try {
    const rideId = req.params.rideId as string;
    const { actorName } = req.body || {};
    const ride = await databases.getDocument(databaseId, COLLECTIONS.RIDES, rideId);
    const previousDriverId = typeof ride.driverId === 'string' ? ride.driverId : '';
    const previousDriverName = typeof ride.driverName === 'string' ? ride.driverName : '';

    const updated = await databases.updateDocument(databaseId, COLLECTIONS.RIDES, rideId, {
      driverId: '',
      driverName: '',
      driverPhone: '',
      vehicleLabel: '',
      driverProgress: '',
      status: 'confirmed',
      adminStatus: 'confirmed',
    });

    if (previousDriverId) {
      await updateDriverCurrentRide(previousDriverId, '');
    }

    await createRideEvent({
      rideId,
      action: 'driver_unassigned',
      actorId: 'admin',
      actorName: actorName || 'Admin',
      driverId: previousDriverId,
      driverName: previousDriverName,
      pickupAddress: ride.pickupAddress || '',
      dropoffAddress: ride.dropoffAddress || '',
      notes: previousDriverName ? `Removed ${previousDriverName} from ride` : 'Removed assigned driver',
    });

    res.json(updated);
  } catch (err: any) {
    logRouteError('Driver unassignment failed', err);
    errorResponse(res, err.code === 404 ? 404 : 500, err.code === 404 ? 'Ride not found' : 'Unassignment failed');
  }
});

// Clear all stale/active rides for a driver so they can receive new assignments
app.post('/drivers/:driverId/clear-rides', async (req: Request, res: Response) => {
  try {
    const driverId = req.params.driverId as string;
    const activeRides = await databases.listDocuments(databaseId, COLLECTIONS.RIDES, [
      Query.equal('driverId', driverId),
      Query.orderDesc('$updatedAt'),
      Query.limit(20),
    ]);
    let cleared = 0;
    for (const ride of activeRides.documents) {
      if (isRideActiveForDriver(ride)) {
        await databases.updateDocument(databaseId, COLLECTIONS.RIDES, ride.$id, {
          status: 'completed',
          adminStatus: 'completed',
          driverProgress: 'completed',
          completedAt: new Date().toISOString(),
        });
        cleared++;
      }
    }
    await updateDriverCurrentRide(driverId, '');
    res.json({ cleared, message: `Cleared ${cleared} stale ride(s) for driver ${driverId}` });
  } catch (err: any) {
    logRouteError('Failed to clear driver rides', err);
    errorResponse(res, 500, 'Failed to clear rides');
  }
});

// 6. List Profiles/Passengers
app.get('/profiles', async (req: Request, res: Response) => {
  try {
    const search = req.query.search as string | undefined;
    const projectCode = req.query.projectCode as string | undefined;
    const role = req.query.role as string | undefined;
    const limit = req.query.limit as string | undefined;
    const offset = req.query.offset as string | undefined;
    
    const queries = [];
    if (search) queries.push(Query.search('passengerName', search));
    if (projectCode) queries.push(Query.equal('projectCode', projectCode));
    if (role) queries.push(Query.equal('role', role));
    
    queries.push(Query.limit(limit ? parseInt(limit) : 50));
    queries.push(Query.offset(offset ? parseInt(offset) : 0));

    const response = await databases.listDocuments(databaseId, COLLECTIONS.PROFILES, queries);
    res.json(response);
  } catch (err: any) {
    logRouteError('Failed to fetch profiles', err);
    errorResponse(res, 500, 'Failed to fetch profiles');
  }
});

/**
 * GET /drivers/availability
 *
 * Returns the list of drivers with a derived `availability` field
 * ("available" | "on_ride" | "unavailable") for the admin portal to poll.
 *
 * Optional query: ?onlineOnly=1 to filter to drivers currently online.
 */
app.get('/drivers/availability', async (req: Request, res: Response) => {
  try {
    const onlineOnly = req.query.onlineOnly === '1' || req.query.onlineOnly === 'true';

    const profileQueries: any[] = [Query.equal('role', 'driver'), Query.limit(200)];
    if (onlineOnly) profileQueries.push(Query.equal('isOnline', true));
    const profileRes = await databases.listDocuments(
      databaseId,
      COLLECTIONS.PROFILES,
      profileQueries
    );

    // Pull active rides in one batch then index by driverId.
    const ridesRes = await databases.listDocuments(databaseId, COLLECTIONS.RIDES, [
      Query.limit(200),
      Query.orderDesc('$createdAt'),
    ]);
    const activeByDriver = new Map<string, string>();
    for (const r of ridesRes.documents as any[]) {
      if (isRideActiveForDriver(r) && r.driverId && !activeByDriver.has(r.driverId)) {
        activeByDriver.set(String(r.driverId), String(r.$id));
      }
    }

    const drivers = (profileRes.documents as any[]).map((d) => {
      const hasActive = activeByDriver.has(d.$id);
      const availability = deriveAvailability(d, hasActive);
      return {
        id: d.$id,
        fullName: d.fullName || d.passengerName || 'Driver',
        phone: d.phone || d.number || '',
        vehicleLabel: d.vehicleLabel || '',
        plateNumber: d.plateNumber || '',
        isOnline: Boolean(d.isOnline),
        currentRideId: activeByDriver.get(d.$id) || null,
        availability,
        $updatedAt: d.$updatedAt,
      };
    });

    res.json({ drivers, total: drivers.length });
  } catch (err: any) {
    logRouteError('Failed to fetch driver availability', err);
    errorResponse(res, 500, 'Failed to fetch driver availability');
  }
});

app.get('/ride-events', async (req: Request, res: Response) => {
  try {
    const rideId = req.query.rideId as string | undefined;
    const limit = req.query.limit as string | undefined;
    const queries = [Query.orderDesc('createdAt'), Query.limit(limit ? parseInt(limit) : 100)];
    if (rideId) queries.push(Query.equal('rideId', rideId));
    const response = await databases.listDocuments(databaseId, COLLECTIONS.RIDE_EVENTS, queries);
    res.json(response);
  } catch (err: any) {
    logRouteError('Failed to fetch ride events', err);
    errorResponse(res, 500, 'Failed to fetch ride events');
  }
});

// 7. Vehicle Classes Admin
app.get('/vehicle-classes', async (req: Request, res: Response) => {
  try {
    const response = await databases.listDocuments(databaseId, COLLECTIONS.VEHICLE_CLASSES, [Query.orderAsc('sortOrder')]);
    res.json(response);
  } catch (err: any) {
    logRouteError('Failed to fetch vehicle classes', err);
    errorResponse(res, 500, 'Failed to fetch vehicle classes');
  }
});

app.post('/vehicle-classes', async (req: Request, res: Response) => {
  try {
    const { name, tagline, capacity, availabilityCount, sortOrder, isActive } = req.body;
    
    if (!name) return res.status(400).json({ error: 'name is required' });

    const data = { name, tagline, capacity, availabilityCount, sortOrder, isActive: isActive ?? true };
    const created = await databases.createDocument(databaseId, COLLECTIONS.VEHICLE_CLASSES, ID.unique(), data);
    res.json(created);
  } catch (err: any) {
    logRouteError('Failed to create vehicle class', err);
    errorResponse(res, 500, 'Creation failed');
  }
});

app.patch('/vehicle-classes/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { name, tagline, capacity, availabilityCount, sortOrder, isActive } = req.body;
    
    const data: any = {};
    if (name !== undefined) data.name = name;
    if (tagline !== undefined) data.tagline = tagline;
    if (capacity !== undefined) data.capacity = capacity;
    if (availabilityCount !== undefined) data.availabilityCount = availabilityCount;
    if (sortOrder !== undefined) data.sortOrder = sortOrder;
    if (isActive !== undefined) data.isActive = isActive;

    const updated = await databases.updateDocument(databaseId, COLLECTIONS.VEHICLE_CLASSES, id, data);
    res.json(updated);
  } catch (err: any) {
    logRouteError('Failed to update vehicle class', err);
    errorResponse(res, 500, 'Update failed');
  }
});

// Start Server
app.listen(port, () => {
  console.log(`🚀 VELO Admin Backend running at http://localhost:${port}`);
});
