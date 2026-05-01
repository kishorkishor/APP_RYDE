# RYDE Driver App

> Part of the RYDE monorepo. See `../CLAUDE.md` and `../AI_CONTEXT.md` for full system context.

## Stack
- Expo 54 + React Native 0.81.5 + React 19
- Expo Router v6 (typed routes)
- Zustand v5 (3 stores: auth, ride, status)
- Appwrite Cloud (shared DB with passenger app)
- MapLibre React Native v11 (navigation maps)
- expo-camera (QR scanner)
- TypeScript strict mode

## Key Files
- `src/services/appwrite.ts` — Appwrite client + COLLECTIONS
- `src/services/driverRecords.ts` — all driver DB operations (status updates MUST set both `driverProgress` AND `adminStatus`)
- `src/store/useDriverAuthStore.ts` — auth state
- `src/store/useDriverRideStore.ts` — rides, active trip
- `src/store/useDriverStatusStore.ts` — online/offline
- `src/app/(tabs)/home.tsx` — main screen, 5s polling for assignments
- `src/app/(trip)/incoming-ride.tsx` — mandatory assignment popup (NO reject button)
- `src/app/(trip)/active-ride.tsx` — trip flow: Arrived → Picked Up → Dropped Off

## Status Update Functions (driverRecords.ts)
| Function | status | adminStatus | driverProgress |
|----------|--------|-------------|----------------|
| `acceptRide()` | `accepted` | `heading_pickup` | `heading_pickup` |
| `markArrived()` | — | `arrived` | `arrived` |
| `markPickedUp()` | `in_progress` | `in_progress` | `picked_up` |
| `completeRide()` | `completed` | `completed` | `completed` |

## Conventions
- Use `@/` path alias (mapped in tsconfig.json)
- Status updates go through `driverRecords.ts` functions, NOT raw `updateDocument()`
- All Appwrite calls wrapped in try/catch

## Commands
```bash
npx expo start                    # Dev server
cd android && ./gradlew assembleRelease  # Build APK (set SENTRY_DISABLE_AUTO_UPLOAD=true)
npx tsc --noEmit                  # Type check
```
