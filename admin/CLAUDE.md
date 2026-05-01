# RYDE Admin Portal

## Identity
- App: Riyadh Admin Dashboard
- Deployed: Netlify
- Folder: E:\WEBSITE 4 (ADMIN PPORTAL)\Admin Dashboard Design

## Stack
- React 18 + Vite 6 + TypeScript
- React Router 7 (SPA routing, protected routes in routes.tsx)
- Tailwind CSS v4 + shadcn/ui (50+ Radix UI components in src/app/components/ui/)
- Recharts (data visualization)
- React Hook Form (forms)
- Lucide React + MUI Icons
- Playwright (E2E testing)

## Key Files
- src/app/services/api.ts — ALL backend API calls (never call fetch() directly)
- src/app/context/AuthContext.tsx — admin auth state (localStorage)
- src/app/data/mockData.ts — TypeScript types: Ride, Driver, VehicleClass, RideEvent
- src/app/pages/ — Dashboard, DispatchBoard, DriverManagement, BillingReview, Settings, Login
- src/app/pages/mobile/ — mobile-optimized versions: PendingRides, ScheduledRides, RideDetail, AssignDriver, DriverList, VehicleAvailability
- src/app/hooks/useAdminData.ts — data fetching hook
- src/app/layouts/ — DesktopLayout, MobileLayout

## Backend API (Express — E:\app 2\backend)
Base URL: VITE_ADMIN_API_BASE_URL (default: http://localhost:3000)
Auth: Bearer token in Authorization header (stored in localStorage as velo-admin-token)

### Endpoints
- POST /auth/login
- GET  /health
- GET  /rides?status=&adminStatus=&projectCode=&limit=&offset=
- GET  /rides/:id
- PATCH /rides/:id/status         — body: { status, adminStatus, actorName, notes }
- PATCH /rides/:id/assign-driver  — body: { driverId, driverName, driverPhone, vehicleLabel, assignedBy, assignedByName }
- PATCH /rides/:id/unassign-driver — body: { actorName }
- GET  /profiles?role=driver&limit=
- GET  /ride-events?rideId=
- GET  /vehicle-classes
- POST /vehicle-classes
- PATCH /vehicle-classes/:id

## Data Normalization (api.ts)
- mapRide(doc) — Appwrite doc → Ride type
- mapDriver(doc) — Appwrite doc → Driver type
- normalizeRideStatus(doc) — maps Appwrite status → UI status
- normalizeVehicleClass(value) — maps rideType string → vehicle class label

## Auth
- Login via POST /auth/login → stores token + user in localStorage
- All API calls add Authorization: Bearer <token> via the request() helper
- 401 response → clearSession() → user redirected to /login
- Token key: "velo-admin-token" | User key: "velo-admin-user"

## Conventions
- ALL API calls must go through the request() helper in api.ts — never call fetch() directly
- Use existing shadcn/ui components from src/app/components/ui/ — don't add new UI libraries
- New pages go in src/app/pages/, add route in routes.tsx
- Mobile pages go in src/app/pages/mobile/
- Use Recharts for any new charts/graphs

## Dev Commands
- npm run dev — Vite dev server (port 5173)
- npm run build — production build to dist/
- npx playwright test — E2E tests
- npx tsc --noEmit — type check

## Sub-Agent Commands Available
- /fix-bugs — full bug scan and fix pass
- /security-check — security audit
- /build-deploy — build and prepare for Netlify deployment
