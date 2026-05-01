import type { Driver, Ride, RideEvent, VehicleClass } from "../data/mockData";

const API_BASE_URL =
  import.meta.env.VITE_ADMIN_API_BASE_URL ||
  `${window.location.protocol}//${window.location.hostname || "localhost"}:3000`;
const TOKEN_KEY = "ryde-admin-token";
const USER_KEY = "ryde-admin-user";

export interface AdminUser {
  id: string;
  email: string;
  name: string;
}

interface AppwriteList<T> {
  documents: T[];
  total: number;
}

type AppwriteDocument = {
  $id: string;
  $createdAt?: string;
  [key: string]: unknown;
};

export function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser(): AdminUser | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AdminUser;
  } catch {
    return null;
  }
}

export function storeSession(token: string, user: AdminUser) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export class ApiError extends Error {
  status: number;
  code?: string;
  body?: unknown;
  constructor(message: string, status: number, code?: string, body?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.body = body;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
  } catch {
    throw new Error(`Cannot reach Riyadh admin API at ${API_BASE_URL}. Start the backend with npm run dev in E:\\app 2\\backend.`);
  }
  const body = await response.json().catch(() => null);

  if (!response.ok) {
    if (response.status === 401) clearSession();
    const code = typeof body?.error === "string" ? body.error : undefined;
    const message = body?.message || code || `Request failed: ${response.status}`;
    throw new ApiError(message, response.status, code, body);
  }

  return body as T;
}

export async function loginAdmin(email: string, password: string) {
  if (!email.trim() || !password.trim()) {
    throw new Error("Email and password are required.");
  }
  const response = await request<{ token: string; user: AdminUser }>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  storeSession(response.token, response.user);
  return response.user;
}

export async function checkApiHealth() {
  return request<{ status: string; appwrite: string; timestamp: string }>("/health");
}

const asString = (value: unknown, fallback = "") => typeof value === "string" && value ? value : fallback;
const asNumber = (value: unknown, fallback = 0) => typeof value === "number" ? value : fallback;
const asBoolean = (value: unknown, fallback = false) => typeof value === "boolean" ? value : fallback;

function parseDate(value: unknown, fallback?: unknown) {
  const raw = asString(value) || asString(fallback) || new Date().toISOString();
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? new Date() : date;
}

function normalizeRideStatus(doc: AppwriteDocument): Ride["status"] {
  const status = asString(doc.status, "pending");
  const adminStatus = asString(doc.adminStatus);
  const driverProgress = asString(doc.driverProgress);

  if (adminStatus === "completed" || status === "completed") return "completed";
  if (status === "cancelled") return "cancelled";

  if (driverProgress === "in_progress" || driverProgress === "picked_up" || adminStatus === "in_progress") return "in_progress" as Ride["status"];
  if (driverProgress === "arrived" || adminStatus === "arrived") return "arrived" as Ride["status"];
  if (driverProgress === "heading_pickup" || adminStatus === "heading_pickup") return "heading_pickup" as Ride["status"];

  if (adminStatus === "calling" || adminStatus === "confirmed") return adminStatus;
  if (status === "accepted") return "heading_pickup" as Ride["status"];
  if (["pending", "calling", "confirmed", "assigned"].includes(status)) {
    return status as Ride["status"];
  }
  if (status === "in_progress") return "in_progress" as Ride["status"];
  return "pending";
}

function normalizeVehicleClass(value: unknown): Ride["vehicleClass"] {
  const label = asString(value, "Premium Sedans");
  if (label.toLowerCase().includes("suv")) return "Premium SUV";
  if (label.toLowerCase().includes("luxury") || label.toLowerCase().includes("custom")) return "Custom Your Luxury";
  return "Premium Sedans";
}

function mapRideEvent(doc: AppwriteDocument): RideEvent {
  return {
    timestamp: parseDate(doc.createdAt, doc.$createdAt),
    action: asString(doc.action, "Activity"),
    user: asString(doc.actorName, "Admin"),
    notes: asString(doc.notes),
  };
}

function mapRide(doc: AppwriteDocument, events: RideEvent[] = []): Ride {
  return {
    id: doc.$id,
    passengerName: asString(doc.passengerName, "Passenger"),
    phone: asString(doc.number, asString(doc.phone, "N/A")),
    companyName: asString(doc.companyName, "Unassigned Company"),
    projectLeader: asString(doc.projectLeader, "N/A"),
    projectCode: asString(doc.projectCode, "N/A"),
    pickupLocation: asString(doc.pickupAddress, "Pickup not set"),
    destination: asString(doc.dropoffAddress, "Dropoff not set"),
    vehicleClass: normalizeVehicleClass(doc.rideType || doc.vehicleLabel),
    requestTime: parseDate(doc.requestedAt, doc.$createdAt),
    scheduledPickupTime: parseDate(doc.scheduledPickupAt, doc.requestedAt || doc.$createdAt),
    status: normalizeRideStatus(doc),
    assignedDriver: asString(doc.driverId) || undefined,
    billingStatus: doc.status === "completed" ? "not_reviewed" : "not_reviewed",
    amount: asNumber(doc.fareAmount, undefined as unknown as number),
    events,
  };
}

function mapDriver(doc: AppwriteDocument): Driver {
  const isOnline = asBoolean(doc.isOnline);
  const currentRideId = asString(doc.currentRideId);
  return {
    id: doc.$id,
    name: asString(doc.fullName, asString(doc.passengerName, "Driver")),
    phone: asString(doc.phone, asString(doc.number, "N/A")),
    vehicleClass: normalizeVehicleClass(doc.rideType),
    vehicleModel: asString(doc.vehicleLabel, "Vehicle not set"),
    plateNumber: asString(doc.plateNumber, "N/A"),
    currentArea: currentRideId ? "Assigned ride" : "Available zone",
    availability: !isOnline ? "unavailable" : currentRideId ? "on_ride" : "available",
    active: true,
  };
}

function mapVehicleClass(doc: AppwriteDocument): VehicleClass {
  return {
    id: doc.$id,
    name: normalizeVehicleClass(doc.name),
    description: asString(doc.tagline, "Ride class"),
    availableCount: asNumber(doc.availabilityCount),
    active: asBoolean(doc.isActive, true),
  };
}

export async function fetchAdminData() {
  const [ridesResponse, eventsResponse, profilesResponse, vehicleResponse] = await Promise.all([
    request<AppwriteList<AppwriteDocument>>("/rides?limit=100"),
    request<AppwriteList<AppwriteDocument>>("/ride-events?limit=500").catch(() => ({ documents: [], total: 0 })),
    request<AppwriteList<AppwriteDocument>>("/profiles?role=driver&limit=100"),
    request<AppwriteList<AppwriteDocument>>("/vehicle-classes"),
  ]);

  const eventsByRide = new Map<string, RideEvent[]>();
  for (const raw of eventsResponse.documents) {
    const event = mapRideEvent(raw);
    const rideId = asString(raw.rideId);
    if (!rideId) continue;
    eventsByRide.set(rideId, [...(eventsByRide.get(rideId) || []), event]);
  }

  return {
    rides: ridesResponse.documents.map((doc) => mapRide(doc, eventsByRide.get(doc.$id) || [])),
    drivers: profilesResponse.documents.map(mapDriver),
    vehicleClasses: vehicleResponse.documents.map(mapVehicleClass),
  };
}

interface DriverAvailabilityRecord {
  id: string;
  fullName?: string;
  phone?: string;
  vehicleLabel?: string;
  plateNumber?: string;
  isOnline: boolean;
  currentRideId: string | null;
  availability: Driver["availability"];
}

interface DriverAvailabilityResponse {
  drivers: DriverAvailabilityRecord[];
  total: number;
}

/**
 * Fetches the latest driver list with derived availability from the dedicated
 * /drivers/availability endpoint. Falls back to /profiles?role=driver if the
 * endpoint is unavailable (404).
 */
export async function fetchDriverAvailability(): Promise<Driver[]> {
  try {
    const response = await request<DriverAvailabilityResponse>("/drivers/availability");
    const list = response?.drivers ?? [];

    if (list.length > 0) {
      const profiles = await request<AppwriteList<AppwriteDocument>>("/profiles?role=driver&limit=100");
      const byId = new Map(profiles.documents.map((doc) => [doc.$id, mapDriver(doc)]));
      return list.map((rec) => {
        const base = byId.get(rec.id) || {
          id: rec.id,
          name: rec.fullName || "Driver",
          phone: rec.phone || "N/A",
          vehicleClass: "Premium Sedans" as const,
          vehicleModel: rec.vehicleLabel || "Vehicle not set",
          plateNumber: rec.plateNumber || "N/A",
          currentArea: rec.currentRideId ? "Assigned ride" : "Available zone",
          availability: rec.availability,
          active: true,
        };
        return { ...base, availability: rec.availability, active: true };
      });
    }
  } catch (err) {
    if (!(err instanceof ApiError) || err.status !== 404) {
      throw err;
    }
  }

  // Fallback: derive from profiles list only (no active-ride cross-check).
  const profilesResponse = await request<AppwriteList<AppwriteDocument>>(
    "/profiles?role=driver&limit=100"
  );
  return profilesResponse.documents.map((doc) => {
    const driver = mapDriver(doc);
    const isOnline = asBoolean(doc.isOnline);
    const hasRide = !!asString(doc.currentRideId);
    const availability: Driver["availability"] = !isOnline ? "unavailable" : hasRide ? "on_ride" : "available";
    return { ...driver, availability };
  });
}

export async function updateRideStatus(rideId: string, status: Ride["status"], actorName: string, notes?: string) {
  return request<AppwriteDocument>(`/rides/${rideId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status, adminStatus: status, actorName, notes }),
  });
}

export async function assignRideDriver(rideId: string, driver: Driver, actor: AdminUser | null) {
  return request<AppwriteDocument>(`/rides/${rideId}/assign-driver`, {
    method: "PATCH",
    body: JSON.stringify({
      driverId: driver.id,
      driverName: driver.name,
      driverPhone: driver.phone,
      vehicleLabel: `${driver.vehicleModel} ${driver.plateNumber}`.trim(),
      assignedBy: actor?.id || "admin",
      assignedByName: actor?.name || "Admin",
    }),
  });
}

export async function unassignRideDriver(rideId: string, actor: AdminUser | null) {
  return request<AppwriteDocument>(`/rides/${rideId}/unassign-driver`, {
    method: "PATCH",
    body: JSON.stringify({
      actorName: actor?.name || "Admin",
    }),
  });
}

export async function updateVehicleClass(id: string, data: Partial<VehicleClass>) {
  return request<AppwriteDocument>(`/vehicle-classes/${id}`, {
    method: "PATCH",
    body: JSON.stringify({
      name: data.name,
      tagline: data.description,
      availabilityCount: data.availableCount,
      isActive: data.active,
    }),
  });
}
