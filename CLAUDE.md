# RYDE Platform — Claude Code Instructions

Read `AI_CONTEXT.md` for full project context before making changes.

## Project Root

`E:\RYDE APP` — this is the monorepo for all RYDE apps.

## Repo Layout

```
driver/          Expo 54 React Native — driver app (Android APK)
passenger/       Expo React Native — passenger app
admin/           React + Vite + Tailwind — admin panel (Netlify)
backend/         Express + Appwrite — REST API server
docs/            Architecture docs (ASSIGNMENT_FLOW, API, ENVIRONMENT)
```

## Quick Start

```bash
# Backend (must run first — admin panel talks to it)
cd backend && npm install && npx ts-node index.ts

# Admin panel (dev server)
cd admin && npm install && npm run dev

# Driver app
cd driver && npm install && npx expo start

# Passenger app
cd passenger && npm install && npx expo start
```

## Environment Files

All `.env` files are in place locally but excluded from git. Each app has its own:

| App | File | Key vars |
|-----|------|----------|
| `backend/` | `backend/.env` | `APPWRITE_*`, `ADMIN_*`, `PORT` |
| `admin/` | `admin/.env` | `VITE_ADMIN_API_BASE_URL` (default: `http://localhost:3000`) |
| `driver/` | `driver/.env` | `EXPO_PUBLIC_APPWRITE_*`, `EXPO_PUBLIC_SENTRY_DSN` |
| `passenger/` | `passenger/.env` | `EXPO_PUBLIC_APPWRITE_*` |

## Critical Rules

1. **Status updates in `driver/src/services/driverRecords.ts` must set BOTH `driverProgress` AND `adminStatus`** — if only one is set, the admin panel won't reflect the change
2. **Never add a reject/decline button** to the driver assignment popup (`driver/src/app/(trip)/incoming-ride.tsx`)
3. **Never commit `.env` files** — they contain real Appwrite API keys and admin credentials
4. **After driver app changes:** build APK with `cd driver/android && set SENTRY_DISABLE_AUTO_UPLOAD=true && ./gradlew assembleRelease`
5. **After admin changes:** `cd admin && npm run build && npx netlify deploy --prod --dir=dist`
6. **After backend changes:** kill port 3000 process, then `cd backend && npx ts-node index.ts`

## Appwrite Collections

All apps share the same Appwrite project (`69ea59a700081d8ec806`) and database (`69ea59ef00258ac48b94`):

| Collection | Purpose |
|------------|---------|
| `rides` | Ride documents — `status`, `adminStatus`, `driverProgress`, passenger info, driver assignment |
| `profiles` | User profiles — `role` is `'driver'` or `'passenger'`, `isOnline`, `currentRideId` |
| `ride_events` | Audit log — every action (assigned, started, arrived, completed) with timestamp and actor |
| `vehicle_classes` | Vehicle types — name, tagline, availability count, active flag |
| `driver_locations` | GPS tracking — lat/lng/heading/speed per driver, upserted during active rides |

## Admin Panel Architecture

The admin panel uses a **shared data context** (`admin/src/app/context/AdminDataContext.tsx`):
- One polling instance serves ALL pages (DispatchBoard, Information, Dashboard, etc.)
- Rides poll every 10 seconds, drivers every 3 seconds
- When any page triggers `reload()` (e.g., after assigning a driver), all pages see the update instantly
- Do NOT call `useAdminData()` directly in page components — use `useAdminDataContext()` instead

## Deployment

| Target | Command | URL |
|--------|---------|-----|
| Admin panel | `cd admin && npm run build && npx netlify deploy --prod --dir=dist` | https://riyadh-admin.netlify.app |
| Backend | Manual — `cd backend && npx ts-node index.ts` on port 3000 | localhost:3000 |
| Driver APK | `cd driver/android && ./gradlew assembleRelease` | sideloaded |

## Git

Remote: `https://github.com/kishorkishor/APP_RYDE.git`
Branch: `main`
