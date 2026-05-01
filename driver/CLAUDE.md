# RYDE Driver App

## Identity
- App: RYDE (driver-facing)
- Package: com.velo.driver
- Folder: E:\app 3 (DRIVER)\DriverExpo

## Stack
- Expo ~54.0.33 + React Native 0.81.5 + React 19
- Expo Router v6 (typed routes)
- Zustand v5 (3 stores: auth, ride, status)
- Appwrite Cloud (shared DB with passenger app)
- MapLibre React Native v11 (navigation maps)
- expo-camera (QR scanner for passenger verification)
- TypeScript strict mode

## Key Files
- src/services/appwrite.ts — Appwrite client + COLLECTIONS
- src/services/driverRecords.ts — all driver DB operations
- src/store/useDriverAuthStore.ts — auth state
- src/store/useDriverRideStore.ts — rides, active trip
- src/store/useDriverStatusStore.ts — online/offline status
- src/types/index.ts — DriverProfile, DriverRide, DriverStatus types
- src/app/(auth)/ — login, OTP, permissions
- src/app/(tabs)/ — home (assigned rides), schedule, history, profile
- src/app/(trip)/ — incoming-ride, pickup-nav, scanner-verify, trip, complete-ride, report-issue

## Shared Appwrite Collections (same DB as passenger app)
PROFILES, RIDES, RIDE_EVENTS, SAVED_PLACES, CITIES, VEHICLE_CLASSES

## Driver Status Flow
online → assigned → heading_pickup → arrived → verified → in_progress → completed

## Ride Operations (driverRecords.ts)
- listAssignedRides(driverId) — active + assigned rides
- listScheduledRides(driverId) — upcoming scheduled
- acceptRide(rideId) → driverProgress: 'heading_pickup'
- markArrived(rideId) → driverProgress: 'arrived'
- startTrip(rideId) → status: 'in_progress', passengerVerified: true
- completeRide(rideId) → status: 'completed', adminStatus: 'completed'
- reportRideIssue(rideId, status, note)
- updateDriverOnlineStatus(userId, isOnline)

## QR Verification Flow
scanner-verify.tsx → expo-camera scans QR → reads ride ID → calls startTrip(rideId)

## Conventions
- ALWAYS use userDocumentPermissions(userId) for new docs
- ALWAYS use normalizeEmail(email) when storing email
- Use @/ path alias (mapped in tsconfig.json)
- Driver profile must have role: 'driver' — checked in getCurrentDriverProfile()
- New trip screens go in src/app/(trip)/
- Status updates must go through driverRecords.ts functions, NOT raw updateDocument()
- All Appwrite calls must be wrapped in try/catch

## Dev Commands
- npm start — Expo dev server
- expo run:android — run on Android
- npx tsc --noEmit — type check
- npm run migrate:driver-schema — run Appwrite DB migration

## Sub-Agent Commands Available
- /fix-bugs — full bug scan and fix pass
- /build-release — build production Android APK
- /security-check — security audit
