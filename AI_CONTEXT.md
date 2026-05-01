# AI Context — RYDE Platform

This file helps AI agents understand the full system. Read before making changes.

## What RYDE Does

RYDE is an **admin-dispatched** ride-hailing platform for Riyadh. Unlike Uber/Lyft, drivers don't choose rides — admins assign rides to online drivers manually.

**The flow:**
1. Passenger requests ride (via passenger app, or admin creates it)
2. Admin sees ride on dispatch board, calls passenger to confirm
3. Admin assigns an online driver
4. Driver gets a **mandatory** assignment popup (no reject option)
5. Driver follows trip: Start Ride -> Arrived -> Picked Up -> Dropped Off
6. All apps + admin panel reflect the same status through Appwrite

## Architecture Overview

```
┌─────────────┐     ┌─────────────┐     ┌──────────────┐
│ Passenger    │     │ Driver      │     │ Admin Panel  │
│ (Expo RN)    │     │ (Expo RN)   │     │ (React+Vite) │
└──────┬───────┘     └──────┬──────┘     └──────┬───────┘
       │                    │                    │
       │  Appwrite SDK      │  Appwrite SDK      │  REST API
       │  (direct)          │  (direct)          │  (via Express)
       │                    │                    │
       ▼                    ▼                    ▼
┌──────────────────────────────────────────────────────────┐
│                    Appwrite Cloud                         │
│  Collections: rides, profiles, ride_events,               │
│               vehicle_classes, driver_locations            │
│  Real-time: WebSocket subscriptions                       │
└───────────────────────┬──────────────────────────────────┘
                        │
                        ▼
              ┌──────────────────┐
              │ Express Backend  │
              │ (node-appwrite)  │
              │ Port 3000        │
              └──────────────────┘
```

- **No shared code package.** Each app is independent.
- **Appwrite is the database.** Driver and passenger apps use the Appwrite client SDK directly.
- **The backend is a thin Express layer** for admin auth (JWT) and operations needing server API keys (assign driver, manage document permissions).

## Tech Stack

| App | Framework | State | Routing | Styling |
|-----|-----------|-------|---------|---------|
| Driver | Expo 54 / React Native | Zustand | Expo Router (file-based) | StyleSheet + DT tokens |
| Passenger | Expo / React Native | Zustand | Expo Router | StyleSheet |
| Admin | React 19 + Vite | React state + Context | React Router v7 | Tailwind CSS |
| Backend | Express + TypeScript | — | Express routes | — |

## Ride Status — Three Fields

Every ride document has **three** status fields. All three must stay in sync:

| Field | Set by | Values | Purpose |
|-------|--------|--------|---------|
| `status` | Admin + Driver | `pending` → `calling` → `confirmed` → `assigned` → `accepted` → `in_progress` → `completed` / `cancelled` | Primary lifecycle |
| `adminStatus` | Driver (via driverRecords.ts) | `assigned` → `heading_pickup` → `arrived` → `in_progress` → `completed` / `cancelled` | What admin panel displays |
| `driverProgress` | Driver (via driverRecords.ts) | `heading_pickup` → `arrived` → `picked_up` → `in_progress` → `completed` | Driver-side tracking |

**The admin panel reads `adminStatus` and `driverProgress` to show labels:** Assigned, En Route, Arrived, In Progress, Completed.

### Status Mapping in driverRecords.ts

| Driver Action | status | adminStatus | driverProgress |
|--------------|--------|-------------|----------------|
| Accept (Start Ride) | `accepted` | `heading_pickup` | `heading_pickup` |
| Arrived | — | `arrived` | `arrived` |
| Picked Up | `in_progress` | `in_progress` | `picked_up` |
| Dropped Off | `completed` | `completed` | `completed` |

## Key Files by App

### Driver (`driver/`)

| File | Purpose |
|------|---------|
| `src/app/(tabs)/home.tsx` | Main screen — online/offline toggle, 5s polling for new assignments |
| `src/app/(trip)/incoming-ride.tsx` | Mandatory assignment popup — NO reject button, vibrates, shows ride details |
| `src/app/(trip)/active-ride.tsx` | Active trip flow — Arrived → Picked Up → Dropped Off buttons |
| `src/app/(trip)/complete-ride.tsx` | Completion confirmation screen |
| `src/services/driverRecords.ts` | All Appwrite writes — `acceptRide`, `markArrived`, `markPickedUp`, `completeRide`, `updateDriverOnlineStatus` |
| `src/services/appwrite.ts` | Appwrite client + collection IDs |
| `src/services/realtime.ts` | Appwrite WebSocket subscriptions |
| `src/store/useDriverRideStore.ts` | Zustand — assigned rides, active ride |
| `src/store/useDriverStatusStore.ts` | Zustand — online/offline state |
| `src/store/useDriverAuthStore.ts` | Zustand — auth + user profile |

### Passenger (`passenger/`)

| File | Purpose |
|------|---------|
| `src/app/` | Expo Router screens |
| `src/services/appwrite.ts` | Appwrite client (platform: `com.ryde.app`) |
| `src/services/appwriteRecords.ts` | Ride requests, profile management |
| `src/store/` | Zustand stores for auth, rides |

### Admin (`admin/`)

| File | Purpose |
|------|---------|
| `src/app/pages/DispatchBoard.tsx` | Main view — ride table, assign/unassign drivers, status updates |
| `src/app/pages/Information.tsx` | Ride log table — all rides with status badges |
| `src/app/pages/Dashboard.tsx` | Overview — KPI cards, ride log, activity feed |
| `src/app/pages/DriverManagement.tsx` | Driver list and management |
| `src/app/services/api.ts` | Backend API client — `fetchAdminData()`, `normalizeRideStatus()`, `assignRideDriver()` |
| `src/app/context/AdminDataContext.tsx` | **Shared data provider** — single polling instance for all pages |
| `src/app/hooks/useAdminData.ts` | Core data hook — polls rides every 10s, drivers every 3s |
| `src/app/hooks/useDriverAvailability.ts` | Driver availability polling with optimistic updates |
| `src/app/layouts/DesktopLayout.tsx` | Sidebar + `<AdminDataProvider>` wrapping `<Outlet>` |
| `src/app/routes.tsx` | React Router config — all desktop and mobile routes |

### Backend (`backend/`)

| File | Purpose |
|------|---------|
| `index.ts` | All Express routes — rides, drivers, profiles, vehicle classes, auth |
| `appwrite.ts` | Server-side Appwrite client (uses API key with full access) |

**Key endpoints:**
- `POST /auth/login` — JWT login for admin panel
- `GET /rides?limit=100` — All rides
- `PATCH /rides/:id/assign-driver` — Assign driver (sets permissions, updates status)
- `PATCH /rides/:id/unassign-driver` — Remove driver, reset to confirmed
- `PATCH /rides/:id/status` — Admin status change
- `GET /drivers/availability` — All drivers with derived availability
- `POST /drivers/:id/clear-rides` — Force-complete stale rides for a driver

## Known Constraints

1. **Appwrite real-time can't detect NEW assignments.** The driver doesn't have read permission on a ride until the admin assigns it, so WebSocket subscriptions miss new assignments. The driver app uses **5-second polling** as the primary detection mechanism.

2. **Stale rides block new assignments.** If a ride gets stuck in an active state (app crash, network loss), `assertDriverAvailable` in the backend blocks new assignments. Auto-cleanup: rides older than 4 hours are completed automatically. Manual cleanup: `POST /drivers/:id/clear-rides`.

3. **Admin panel uses shared context, not per-page hooks.** All pages read from `useAdminDataContext()`. Do NOT call `useAdminData()` directly in page components — it would create a separate polling instance.

4. **Driver assignment popup is mandatory.** No reject/decline button by design. The driver taps "Start Ride" to begin.

## What Not to Break

- Online/offline toggle (home.tsx)
- Driver assignment popup — mandatory, no reject (`incoming-ride.tsx`)
- 3-button trip flow: Arrived → Picked Up → Dropped Off (`active-ride.tsx`)
- Admin dispatch board assignment UI (`DispatchBoard.tsx`)
- Shared data context — all admin pages use `useAdminDataContext()`
- Backend `assertDriverAvailable` safety check
- `.env` files excluded from git (`.gitignore` handles this)

## How to Make Changes

1. **Read the relevant app's code first** — don't assume from this doc alone
2. **Status changes must update BOTH `driverProgress` AND `adminStatus`** in `driverRecords.ts`
3. **Test the full cycle:** admin assigns → driver popup → driver completes → admin sees "Completed"
4. **After driver app:** build APK — `cd driver/android && set SENTRY_DISABLE_AUTO_UPLOAD=true && ./gradlew assembleRelease`
5. **After admin panel:** deploy — `cd admin && npm run build && npx netlify deploy --prod --dir=dist`
6. **After backend:** restart — kill port 3000, then `cd backend && npx ts-node index.ts`
