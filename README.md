# RYDE - Premium Ride-Hailing Platform

Multi-app ride-hailing system for Riyadh, Saudi Arabia. Connects passengers with drivers through an admin-dispatched model.

## Repo Structure

```
driver/      - Driver mobile app (Expo/React Native)
passenger/   - Passenger mobile app (Expo/React Native)
admin/       - Admin dispatch panel (React + Vite + Tailwind)
backend/     - REST API (Express + Appwrite)
docs/        - Architecture and API documentation
```

## Tech Stack

| Component | Stack |
|-----------|-------|
| Driver app | Expo 54, React Native, Appwrite SDK, Zustand, MapLibre |
| Passenger app | Expo, React Native, Appwrite SDK, Zustand |
| Admin panel | React 19, Vite, Tailwind CSS, shadcn/ui |
| Backend | Express, TypeScript, node-appwrite SDK |
| Database | Appwrite Cloud (collections: rides, profiles, ride_events, vehicle_classes, driver_locations) |
| Hosting | Admin on Netlify (riyadh-admin.netlify.app), Backend self-hosted |

## Quick Start

### Backend
```bash
cd backend
cp .env.example .env   # fill in Appwrite credentials
npm install
npx ts-node index.ts
```

### Admin Panel
```bash
cd admin
cp .env.example .env   # set VITE_ADMIN_API_BASE_URL
npm install
npm run dev            # http://localhost:5173
```

### Driver App
```bash
cd driver
npm install
npx expo start
# or build APK:
cd android && ./gradlew assembleRelease
```

### Passenger App
```bash
cd passenger
npm install
npx expo start
```

## Assignment Lifecycle

```
Driver Online -> Admin Assigns -> Driver Gets Popup -> Driver Starts ->
En Route -> Arrived -> Picked Up -> In Progress -> Dropped Off -> Completed
```

See [docs/ASSIGNMENT_FLOW.md](docs/ASSIGNMENT_FLOW.md) for full details.

## Environment Variables

See [docs/ENVIRONMENT.md](docs/ENVIRONMENT.md) for all required variables. Never commit real keys — use `.env.example` files as templates.
