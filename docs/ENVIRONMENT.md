# Environment Variables

## Backend (`backend/.env`)

| Variable | Description | Example |
|----------|-------------|---------|
| `APPWRITE_ENDPOINT` | Appwrite Cloud API URL | `https://cloud.appwrite.io/v1` |
| `APPWRITE_PROJECT_ID` | Appwrite project ID | `your_project_id` |
| `APPWRITE_DATABASE_ID` | Appwrite database ID | `your_database_id` |
| `APPWRITE_API_KEY` | Server API key (full access) | `standard_xxxxx` |
| `ADMIN_API_TOKEN` | Token for admin API auth | random 64-char hex |
| `ADMIN_EMAIL` | Admin login email | `admin@ryde.local` |
| `ADMIN_PASSWORD` | Admin login password | strong random password |
| `ADMIN_NAME` | Admin display name | `RYDE Admin` |
| `ADMIN_ALLOWED_ORIGINS` | CORS origins (comma-separated) | `https://riyadh-admin.netlify.app,http://localhost:5173` |
| `PORT` | Server port | `3000` |

## Admin Panel (`admin/.env`)

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_ADMIN_API_BASE_URL` | Backend API URL | `http://localhost:3000` |

## Driver App (`driver/.env`)

Uses Appwrite config from `driver/src/services/appwrite.ts` — the Appwrite project ID and endpoint are typically hardcoded or set via Expo env vars:

| Variable | Description | Example |
|----------|-------------|---------|
| `EXPO_PUBLIC_SENTRY_DSN` | Sentry error tracking DSN | `https://xxx@sentry.io/xxx` |

## Passenger App (`passenger/.env`)

Same Appwrite config pattern as the driver app.

## Security Notes

- Never commit `.env` files with real credentials
- The `.gitignore` at the repo root excludes all `.env` files
- Use `.env.example` files as templates
- The Appwrite API key in the backend has full server access — keep it secret
- Admin password is only used for the Express backend's JWT auth, not Appwrite directly
