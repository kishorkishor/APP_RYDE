# AI Context — RYDE Platform

This file helps AI agents understand the project quickly. Read this before making changes.

## What This Project Does

RYDE is an admin-dispatched ride-hailing platform for Riyadh. Unlike Uber/Lyft, drivers don't choose rides — admins assign rides to online drivers. The flow is:

1. Passenger requests a ride (via passenger app or admin creates it)
2. Admin sees the ride on the dispatch board
3. Admin assigns an online driver
4. Driver receives a mandatory assignment popup (no reject option)
5. Driver follows the trip flow: Start -> Arrived -> Picked Up -> Dropped Off
6. All three apps and the backend reflect the same status in real time

## Architecture

- **No shared code package.** Each app is independent. They communicate through Appwrite (database + real-time WebSocket) and the Express backend.
- **Appwrite is the database.** Collections: `rides`, `profiles`, `ride_events`, `vehicle_classes`, `driver_locations`.
- **The backend is a thin Express layer** for admin auth and operations that need server-side Appwrite API keys (assign driver, manage permissions).
- **Driver and passenger apps use the Appwrite client SDK directly** for reads, writes, and real-time subscriptions.

## Status Values (Ride Lifecycle)

These are the actual values stored in Appwrite on ride documents:

| Field | Values |
|-------|--------|
| `status` | `pending`, `calling`, `confirmed`, `assigned`, `accepted`, `in_progress`, `completed`, `cancelled` |
| `adminStatus` | `assigned`, `heading_pickup`, `arrived`, `in_progress`, `completed`, `cancelled` |
| `driverProgress` | `heading_pickup`, `arrived`, `picked_up`, `in_progress`, `completed` |

The admin panel reads `driverProgress` and `adminStatus` to display human-readable labels: Assigned, En Route, Arrived, In Progress, Completed.

## Key Files by App

### Driver (`driver/`)
- `src/app/(tabs)/home.tsx` — Main screen, online/offline toggle, assignment detection (5s polling)
- `src/app/(trip)/incoming-ride.tsx` — Mandatory assignment popup (no reject)
- `src/app/(trip)/active-ride.tsx` — Trip flow: Arrived -> Picked Up -> Dropped Off
- `src/app/(trip)/complete-ride.tsx` — Completion confirmation screen
- `src/services/driverRecords.ts` — All Appwrite operations (acceptRide, markArrived, markPickedUp, completeRide)
- `src/services/realtime.ts` — Appwrite real-time subscriptions
- `src/store/useDriverRideStore.ts` — Zustand store for ride state
- `src/store/useDriverStatusStore.ts` — Online/offline state
- `src/store/useDriverAuthStore.ts` — Auth + profile

### Passenger (`passenger/`)
- `src/app/` — Expo Router screens
- `src/services/` — Appwrite operations
- `src/store/` — Zustand stores

### Admin (`admin/`)
- `src/app/pages/DispatchBoard.tsx` — Main dispatch view, driver assignment
- `src/app/pages/Dashboard.tsx` — Overview with ride stats
- `src/app/pages/Information.tsx` — Ride log table with status
- `src/app/services/api.ts` — Backend API client, `normalizeRideStatus()` maps DB values to UI
- `src/app/hooks/useAdminData.ts` — Polls rides every 10s, drivers every 3s
- `src/app/hooks/useDriverAvailability.ts` — Driver availability polling

### Backend (`backend/`)
- `index.ts` — All Express routes
- `appwrite.ts` — Appwrite client setup
- Key endpoints: `PATCH /rides/:id/assign-driver`, `PATCH /rides/:id/status`, `POST /drivers/:id/clear-rides`, `GET /drivers/availability`

## Known Constraints

1. **Appwrite real-time can't detect NEW assignments.** The driver doesn't have read permission on a ride until the admin assigns it — so the WebSocket subscription misses new assignments. We use 5s polling as the primary detection mechanism.
2. **Stale rides can block drivers.** If a ride gets stuck in an active state, the backend's `assertDriverAvailable` blocks new assignments. The backend auto-completes rides older than 4 hours, and there's a `POST /drivers/:id/clear-rides` endpoint for manual cleanup.
3. **The admin panel derives status from `driverProgress` + `adminStatus`.** If the driver app only updates `driverProgress` without updating `adminStatus`, the admin won't see the change. All driver status update functions must set both.

## What Not to Break

- Online/offline toggle flow (works correctly)
- Driver assignment popup (mandatory, no reject)
- The 3-button trip flow on active-ride screen (Arrived -> Picked Up -> Dropped Off)
- Admin dispatch board assignment UI
- Admin status polling (10s for rides, 3s for drivers)
- Backend `assertDriverAvailable` safety check

## How to Approach Changes

1. Read the relevant app's code first — don't assume from this doc alone
2. Status changes must update BOTH `driverProgress` AND `adminStatus` in `driverRecords.ts`
3. Test the full cycle: admin assigns -> driver popup -> driver completes -> admin sees completed
4. After changing driver app, build APK: `cd driver/android && ./gradlew assembleRelease`
5. After changing admin, deploy: `cd admin && npm run build && npx netlify deploy --prod --dir=dist`
6. After changing backend, restart: kill port 3000 process, then `cd backend && npx ts-node index.ts`
