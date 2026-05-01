# Assignment Flow

## Lifecycle

```
1. PENDING        - Ride created, waiting for admin action
2. CALLING        - Admin is contacting passenger to confirm
3. CONFIRMED      - Passenger confirmed, ready for driver assignment
4. ASSIGNED       - Admin assigned a driver (driver hasn't started yet)
5. HEADING_PICKUP - Driver tapped "Start Ride", en route to pickup
6. ARRIVED        - Driver arrived at pickup location
7. IN_PROGRESS    - Passenger picked up, trip underway
8. COMPLETED      - Driver dropped off passenger, trip done
9. CANCELLED      - Ride cancelled at any point
```

## Database Fields

Each ride document has three status-related fields:

- `status` — Primary ride status (`pending` -> `assigned` -> `accepted` -> `in_progress` -> `completed`)
- `adminStatus` — Tracks driver progress for admin visibility (`assigned` -> `heading_pickup` -> `arrived` -> `in_progress` -> `completed`)
- `driverProgress` — Driver-side progress (`heading_pickup` -> `arrived` -> `picked_up` -> `in_progress` -> `completed`)

## What Each App Does at Each Step

### Step 1-3: Admin creates/confirms ride
- **Admin**: Sets `status` and `adminStatus` via backend endpoints
- **Driver**: Not involved yet
- **Passenger**: Sees ride as pending/confirmed

### Step 4: Admin assigns driver
- **Admin**: Calls `PATCH /rides/:id/assign-driver` with driverId
- **Backend**: Sets `status: 'assigned'`, `adminStatus: 'assigned'`, `driverId`, adds read/update permissions for driver
- **Driver**: 5s polling detects new ride with `status === 'assigned'` and empty `driverProgress` → navigates to mandatory assignment popup

### Step 5: Driver starts ride
- **Driver**: Taps "Start Ride" on popup → calls `acceptRide()` → sets `status: 'accepted'`, `adminStatus: 'heading_pickup'`, `driverProgress: 'heading_pickup'`
- **Admin**: Polls see `adminStatus: 'heading_pickup'` → shows "En Route"

### Step 6: Driver arrives
- **Driver**: Taps "Arrived" → calls `markArrived()` → sets `adminStatus: 'arrived'`, `driverProgress: 'arrived'`
- **Admin**: Shows "Arrived"

### Step 7: Driver picks up passenger
- **Driver**: Taps "Picked Up" → calls `markPickedUp()` → sets `status: 'in_progress'`, `adminStatus: 'in_progress'`, `driverProgress: 'picked_up'`
- **Admin**: Shows "In Progress"

### Step 8: Driver completes
- **Driver**: Taps "Dropped Off" → calls `completeRide()` → sets `status: 'completed'`, `adminStatus: 'completed'`, `driverProgress: 'completed'`, clears `currentRideId` on driver profile
- **Admin**: Shows "Completed"
- **Driver**: Navigates to completion screen, then back to home

## Driver Assignment Popup

The assignment popup (`driver/src/app/(trip)/incoming-ride.tsx`):
- Is mandatory — no reject/decline button
- Shows: passenger name, company, project code, pickup/dropoff addresses, distance, duration, ride type
- Shows instructions: "Head to the pickup location. Tap each step..."
- Single "Start Ride" button
- Vibrates on appearance to alert the driver

## Detection Mechanism

New assignments are detected via **5-second polling** (not real-time). Appwrite real-time subscriptions can't detect documents the user just gained permission to read.

## Stale Ride Cleanup

If a ride gets stuck in an active state (e.g., app crash), the backend auto-completes rides older than 4 hours during the `assertDriverAvailable` check. Admins can also call `POST /drivers/:driverId/clear-rides` to manually clear stale rides.
