# RYDE Passenger App

> Part of the RYDE monorepo. See `../CLAUDE.md` and `../AI_CONTEXT.md` for full system context.

## Stack
- Expo 54 + React Native 0.81.5 + React 19
- Expo Router v6 (file-based routing, typed routes)
- Zustand v5 (state)
- Appwrite Cloud (auth + database + realtime)
- MapLibre React Native v11 (maps — NOT Google Maps)
- Photon geocoding + OSRM routing (open source, free)
- TypeScript strict mode

## Key Files
- `src/services/appwrite.ts` — Appwrite client + COLLECTIONS
- `src/services/appwriteRecords.ts` — all DB operations (auth, rides, profiles)
- `src/store/useAuthStore.ts` — Zustand auth state
- `src/store/useRideStore.ts` — Zustand ride state
- `src/config/city.ts` — Riyadh config + pricing formula
- `src/app/(auth)/` — login, OTP, permissions
- `src/app/(ride)/` — ride booking flow
- `src/app/(tabs)/` — home, history, profile, saved-places

## Auth Flow
Email OTP → `verifyEmailOtpAndSaveProfile()` → upsert profile → Zustand `setUser()`

## Pricing (city.ts)
`baseFare(10) + distanceKm × perKmRate(2) + durationMin × perMinRate(0.5)` × type multiplier
Min fare: 15 SAR. Multipliers: swift ×1.0, comfort ×1.3, xl ×1.6, premium ×2.5

## Conventions
- Use `@/` path alias
- Use `userDocumentPermissions(userId)` for new Appwrite docs
- Use `normalizeEmail(email)` before storing/querying
- All Appwrite calls wrapped in try/catch

## Commands
```bash
npx expo start           # Dev server
expo run:android         # Run on Android
npx tsc --noEmit         # Type check
```
