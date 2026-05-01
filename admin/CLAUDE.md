# RYDE Admin Portal

> Part of the RYDE monorepo. See `../CLAUDE.md` and `../AI_CONTEXT.md` for full system context.

## Stack
- React 19 + Vite 6 + TypeScript
- React Router 7 (SPA, protected routes in `src/app/routes.tsx`)
- Tailwind CSS v4 + shadcn/ui components (`src/app/components/ui/`)
- Recharts (data visualization)

## Key Files
- `src/app/services/api.ts` — ALL backend API calls (never call `fetch()` directly)
- `src/app/context/AdminDataContext.tsx` — shared data provider, single polling instance for all pages
- `src/app/context/AuthContext.tsx` — admin auth state (localStorage)
- `src/app/data/mockData.ts` — TypeScript types: Ride, Driver, VehicleClass, RideEvent
- `src/app/hooks/useAdminData.ts` — core data hook (polls rides 10s, drivers 3s)
- `src/app/pages/` — DispatchBoard, Information, Dashboard, DriverManagement, etc.
- `src/app/pages/mobile/` — mobile-optimized views
- `src/app/layouts/` — DesktopLayout, MobileLayout (both wrap Outlet in AdminDataProvider)

## Critical: Shared Data Context
All pages must use `useAdminDataContext()` from `context/AdminDataContext.tsx`.
Do NOT call `useAdminData()` directly — it creates a separate polling instance.

## Conventions
- All API calls go through `request()` in `api.ts`
- Use existing shadcn/ui components — don't add new UI libraries
- New pages go in `src/app/pages/`, add route in `routes.tsx`

## Commands
```bash
npm run dev          # Vite dev server (port 5173)
npm run build        # Production build to dist/
npx netlify deploy --prod --dir=dist  # Deploy to Netlify
```
