# Backend API Reference

Base URL: `http://localhost:3000` (local) or your deployed backend URL.
All endpoints except `/auth/login` and `/health` require `Authorization: Bearer <token>`.

## Auth

### POST /auth/login
```json
// Request
{ "email": "admin@ryde.local", "password": "..." }
// Response
{ "token": "jwt...", "user": { "id": "...", "email": "...", "name": "..." } }
```

## Health

### GET /health
```json
{ "status": "ok", "appwrite": "connected", "timestamp": "..." }
```

## Rides

### GET /rides?limit=100
Returns `{ documents: [...], total: N }` — all rides.

### PATCH /rides/:rideId/status
Update ride status (admin-initiated).
```json
// Request
{ "status": "confirmed", "adminStatus": "confirmed", "actorName": "Admin", "notes": "..." }
```
Allowed `status`: pending, calling, confirmed, accepted, assigned, heading_pickup, arrived, in_progress, completed, cancelled.
Allowed `adminStatus`: pending_admin_assignment, calling, confirmed, assigned, heading_pickup, arrived, in_progress, dispatched, completed, cancelled.

### PATCH /rides/:rideId/assign-driver
Assign a driver to a ride.
```json
// Request
{
  "driverId": "...",
  "driverName": "...",
  "driverPhone": "...",
  "vehicleLabel": "...",
  "assignedBy": "admin-user-id",
  "assignedByName": "Admin"
}
// Error responses
{ "error": "Driver is offline", "code": "driver_offline" }           // 409
{ "error": "Driver is already assigned to an active ride", "code": "driver_busy" }  // 409
```

### PATCH /rides/:rideId/unassign-driver
Remove assigned driver, reset to confirmed.
```json
{ "actorName": "Admin" }
```

## Drivers

### GET /drivers/availability
Returns all drivers with derived availability.
```json
{
  "drivers": [
    {
      "id": "...",
      "fullName": "...",
      "isOnline": true,
      "currentRideId": null,
      "availability": "available"  // "available" | "on_ride" | "unavailable"
    }
  ],
  "total": 2
}
```

### POST /drivers/:driverId/clear-rides
Force-complete all active rides for a driver (cleanup stale state).
```json
// Response
{ "cleared": 3, "message": "Cleared 3 stale ride(s) for driver ..." }
```

## Profiles

### GET /profiles?role=driver&limit=100
Returns `{ documents: [...], total: N }`.

## Ride Events

### GET /ride-events?limit=500
Returns `{ documents: [...], total: N }` — audit log of ride actions.

## Vehicle Classes

### GET /vehicle-classes
Returns `{ documents: [...], total: N }`.

### PATCH /vehicle-classes/:id
Update a vehicle class.
```json
{ "name": "...", "tagline": "...", "availabilityCount": 5, "isActive": true }
```
