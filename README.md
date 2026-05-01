# RYDE - Premium Ride-Hailing Platform

Admin-dispatched ride-hailing system for Riyadh, Saudi Arabia. Admins assign rides to online drivers — drivers don't choose rides.

## Repo Structure

```
driver/      Expo React Native — driver mobile app (Android APK)
passenger/   Expo React Native — passenger mobile app
admin/       React + Vite + Tailwind — admin dispatch panel (Netlify)
backend/     Express + TypeScript — REST API (Appwrite backend)
docs/        Architecture and API documentation
```

## Tech Stack

| Component | Stack |
|-----------|-------|
| Driver app | Expo 54, React Native, Appwrite SDK, Zustand, MapLibre |
| Passenger app | Expo, React Native, Appwrite SDK, Zustand, MapLibre |
| Admin panel | React 19, Vite, Tailwind CSS, shadcn/ui |
| Backend | Express, TypeScript, node-appwrite SDK |
| Database | Appwrite Cloud |
| Admin hosting | Netlify — riyadh-admin.netlify.app |

## Quick Start

`.env` files are already set up locally. If cloning fresh, copy from `.env.example` and fill in values.

```bash
# 1. Backend (must run first)
cd backend && npm install && npx ts-node index.ts

# 2. Admin panel
cd admin && npm install && npm run dev

# 3. Driver app
cd driver && npm install && npx expo start

# 4. Passenger app
cd passenger && npm install && npx expo start
```

## Assignment Flow

```
Passenger requests → Admin assigns driver → Driver gets mandatory popup →
Start Ride → En Route → Arrived → Picked Up → In Progress → Dropped Off → Completed
```

See [docs/ASSIGNMENT_FLOW.md](docs/ASSIGNMENT_FLOW.md) for the full lifecycle.

## Docs

- [Assignment Flow](docs/ASSIGNMENT_FLOW.md) — ride lifecycle and status fields
- [API Reference](docs/API.md) — all backend endpoints
- [Environment Variables](docs/ENVIRONMENT.md) — what each `.env` file needs

## For AI Agents

Read `CLAUDE.md` and `AI_CONTEXT.md` at the repo root before making changes.
