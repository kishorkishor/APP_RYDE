import { useEffect, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { useDriverAuthStore } from '@/src/store/useDriverAuthStore';
import { useDriverRideStore } from '@/src/store/useDriverRideStore';
import { useDriverStatusStore } from '@/src/store/useDriverStatusStore';
import { getCurrentDriverProfile, listAssignedRides } from '@/src/services/driverRecords';
import { reconnectSubscriptions } from '@/src/services/realtime';
import { getCachedActiveRide } from '@/src/services/rideCache';

export function useAppStateHandler() {
  const previousState = useRef<AppStateStatus>(AppState.currentState);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', async (nextState) => {
      if (previousState.current.match(/inactive|background/) && nextState === 'active') {
        const profile = useDriverAuthStore.getState().profile;
        const isOnline = useDriverStatusStore.getState().isOnline;
        if (!profile?.id || !isOnline) {
          previousState.current = nextState;
          return;
        }

        try {
          const freshProfile = await getCurrentDriverProfile();
          if (freshProfile) {
            useDriverAuthStore.getState().setProfile(freshProfile);
            // Sync online status from Appwrite in case it was changed externally
            const { setOnline, setOffline } = useDriverStatusStore.getState();
            if (freshProfile.isOnline) { setOnline(); } else { setOffline(); }
          }
        } catch {
          // best-effort
        }

        try {
          const rides = await listAssignedRides(profile.id);
          useDriverRideStore.getState().setAssignedRides(rides);
        } catch {
          // best-effort
        }

        // Restore active ride from cache if the store lost it
        if (!useDriverRideStore.getState().activeRide) {
          try {
            const cached = await getCachedActiveRide();
            if (cached && cached.status !== 'completed' && cached.status !== 'cancelled') {
              useDriverRideStore.getState().setActiveRide(cached);
            }
          } catch {}
        }

        reconnectSubscriptions();
      }

      previousState.current = nextState;
    });

    return () => subscription.remove();
  }, []);
}
