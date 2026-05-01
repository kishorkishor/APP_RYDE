# RYDE Platform — Claude Code Instructions

Read `AI_CONTEXT.md` for full project context before making changes.

## Repo Layout
- `driver/` — Expo React Native driver app
- `passenger/` — Expo React Native passenger app
- `admin/` — React + Vite admin panel (deployed to Netlify)
- `backend/` — Express + Appwrite backend API
- `docs/` — Architecture docs

## Critical Rules
1. Status updates in `driver/src/services/driverRecords.ts` must set BOTH `driverProgress` AND `adminStatus`
2. Never add a reject/decline button to the driver assignment popup
3. Never commit `.env` files with real credentials
4. After driver app changes: build APK from `driver/android/` with `SENTRY_DISABLE_AUTO_UPLOAD=true`
5. After admin changes: `npm run build && npx netlify deploy --prod --dir=dist`
6. After backend changes: restart the Express server on port 3000

## Appwrite Collections
- `rides` — Ride documents with status/adminStatus/driverProgress
- `profiles` — User profiles (role: 'driver' or 'passenger')
- `ride_events` — Audit log
- `vehicle_classes` — Vehicle types
- `driver_locations` — GPS tracking data
