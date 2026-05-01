# RYDE — Passenger App

## Identity
- App: RYDE (passenger-facing ride-hailing)
- Package: com.velo.app
- Folder: E:\app 2\mobile

## Stack
- Expo ~54.0.33 + React Native 0.81.5 + React 19
- Expo Router v6 (file-based routing, typed routes)
- Zustand v5 (state)
- Appwrite Cloud (auth + database + realtime)
- MapLibre React Native v11 (maps — NOT Google Maps)
- Photon geocoding + OSRM routing (open source, free)
- TypeScript strict mode

## Key Files
- src/services/appwrite.ts — Appwrite client + COLLECTIONS constant
- src/services/appwriteRecords.ts — all DB operations (auth, rides, profiles)
- src/store/useAuthStore.ts — Zustand auth state
- src/store/useRideStore.ts — Zustand ride state
- src/config/city.ts — Riyadh config + pricing formula
- src/types/index.ts — all shared TypeScript types
- src/app/(auth)/ — login, OTP, permissions screens
- src/app/(ride)/ — full ride booking flow screens
- src/app/(tabs)/ — home, history, profile, saved-places

## Appwrite Collections
PROFILES, RIDES, RIDE_EVENTS, SAVED_PLACES, CITIES, VEHICLE_CLASSES, DRIVER_LOCATIONS

## Auth Flow
Email OTP → verifyEmailOtpAndSaveProfile() → upsert profile doc → Zustand setUser()

## Ride Status Flow
pending → calling → confirmed → assigned → in_progress → completed / cancelled

## Pricing Formula (city.ts)
baseFare(10 SAR) + distanceKm × perKmRate(2) + durationMin × perMinRate(0.5), × typeMultiplier
Min fare: 15 SAR. Currency: SAR.
Type multipliers: swift×1.0, comfort×1.3, xl×1.6, premium×2.5

## Conventions
- ALWAYS use userDocumentPermissions(userId) for new Appwrite docs
- ALWAYS use normalizeEmail(email) before storing/querying email
- ALWAYS use @/ path alias (maps to project root)
- New screens go in src/app/(ride)/ or src/app/(tabs)/
- New reusable UI goes in src/components/ui/
- State updates go through Zustand stores, not local useState for shared data
- All Appwrite calls must be wrapped in try/catch

## Dev Commands
- npm start — start Expo dev server
- expo run:android — run on Android device/emulator
- npx tsc --noEmit — type check without building
- npm run migrate:driver-schema — (backend only) run DB migration

## Sub-Agent Commands Available
- /fix-bugs — full bug scan and fix pass
- /build-release — build production Android APK
- /security-check — security audit
