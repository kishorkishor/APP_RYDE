# VELO Admin Backend

A Node.js/TypeScript API layer for the VELO ride-hailing admin panel, integrated with Appwrite Cloud.

## Prerequisites
- Node.js (v18+)
- Appwrite Project with Database and Collections set up (use `mobile/scripts/setup-db.ts`)

## Setup

1.  Navigate to the backend directory:
    ```bash
    cd backend
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

3.  Configure environment variables:
    Create a `.env` file based on `.env.example`.
    ```bash
    cp .env.example .env
    ```
    Fill in your Appwrite Project ID and API Key. **Do not share this file.**

## Development

Run the development server with hot-reload:
```bash
npm run dev
```
The server will start at `http://localhost:3000`.

## Endpoints

All endpoints (except `/health`) require an `Authorization: Bearer <ADMIN_API_TOKEN>` header.

### System
- `GET /health`: Check backend and Appwrite connectivity.

### Rides
- `GET /rides`: List all rides with filters (`status`, `adminStatus`, `projectCode`, `requestType`, `dateFrom`, `dateTo`, `limit`, `offset`).
- `GET /rides/:rideId`: Get full details of a specific ride.
- `PATCH /rides/:rideId/status`: Update ride `status` and `adminStatus`.
- `PATCH /rides/:rideId/assign-driver`: Assign a driver to a ride (updates driver details, sets status to `assigned`, and grants the assigned Appwrite user read/update document permissions).

### Maintenance

Repair permissions for already-assigned rides:

```bash
npm run repair:ride-permissions
```

This is a server-side maintenance command only. It requires `APPWRITE_API_KEY` and must never be exposed to the mobile apps.

### Profiles
- `GET /profiles`: List all passenger profiles with filters (`search`, `projectCode`).

### Vehicle Classes
- `GET /vehicle-classes`: List all vehicle types shown in the app.
- `POST /vehicle-classes`: Create a new vehicle type.
- `PATCH /vehicle-classes/:id`: Update an existing vehicle type.

## Example Request

```bash
curl -X GET http://localhost:3000/rides \
  -H "Authorization: Bearer your-secret-admin-token"
```

## Deployment Notes

This backend is currently implemented as a long-running Express server suitable for Render, Railway, Fly.io, a VPS, PM2, or Docker. Netlify/Vercel serverless deployment would require adding a serverless adapter/handler first.

Ensure you whitelist your production admin frontend URL in the `ADMIN_ALLOWED_ORIGINS` environment variable.
