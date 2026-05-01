// ─── Home Screen ──────────────────────────────────────────────────────────────
// Map-first layout with glass header and swipe online/offline slider.
// Real-time subscription for instant ride updates; 30s poll as fallback.
// ─────────────────────────────────────────────────────────────────────────────
import { useEffect, useCallback, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { DT } from '@/src/theme/tokens';
import { SwipeSlider } from '@/src/components/ui';
import { DriverMap, type DriverMapHandle } from '@/src/components/map/DriverMap';
import { MapControls } from '@/src/components/map/MapControls';
import { useDriverAuthStore } from '@/src/store/useDriverAuthStore';
import { useDriverStatusStore } from '@/src/store/useDriverStatusStore';
import { useDriverRideStore } from '@/src/store/useDriverRideStore';
import {
  listAssignedRides,
  updateDriverOnlineStatus,
} from '@/src/services/driverRecords';
import { subscribeToAssignedRides } from '@/src/services/realtime';
import { startDriverLocationTracking, stopDriverLocationTracking } from '@/src/services/locationTracking';
import { getCachedAssignedRides, getCachedActiveRide } from '@/src/services/rideCache';
import { useToastStore } from '@/src/store/useToastStore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const POLL_INTERVAL_MS = 5_000;

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const profile = useDriverAuthStore((s) => s.profile);
  const { isOnline, setOnline, setOffline } = useDriverStatusStore();
  const {
    assignedRides,
    setAssignedRides,
    setLoadingRides,
  } = useDriverRideStore();

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mapRef = useRef<DriverMapHandle>(null);
  const togglingRef = useRef(false);
  const [driverCoords, setDriverCoords] = useState<{ latitude: number; longitude: number } | null>(null);

  // Driver location tracking with Appwrite upload
  const activeRideForTracking = useDriverRideStore((s) => s.activeRide);
  useEffect(() => {
    if (!profile?.id) return;
    startDriverLocationTracking(
      profile.id,
      isOnline,
      activeRideForTracking,
      setDriverCoords,
    );
    return () => stopDriverLocationTracking();
  }, [profile?.id, isOnline, activeRideForTracking?.id]);

  // Load cached rides on mount (before first API fetch)
  useEffect(() => {
    (async () => {
      const [cached, cachedActive] = await Promise.all([
        getCachedAssignedRides(),
        getCachedActiveRide(),
      ]);
      if (cached.length > 0) setAssignedRides(cached);
      if (cachedActive) useDriverRideStore.getState().setActiveRide(cachedActive);
    })();
  }, []);

  const handleRecenter = () => {
    if (driverCoords) mapRef.current?.recenter(driverCoords);
  };

  // Ride polling
  const fetchRides = useCallback(async () => {
    if (!profile?.id || !isOnline) return;
    setLoadingRides(true);
    try {
      const rides = await listAssignedRides(profile.id);
      setAssignedRides(rides);
    } catch {
      useToastStore.getState().showToast('Failed to load rides.', 'error');
    } finally {
      setLoadingRides(false);
    }
  }, [profile?.id, isOnline]);

  useEffect(() => {
    fetchRides();
    pollRef.current = setInterval(fetchRides, POLL_INTERVAL_MS);

    let unsubscribe: (() => void) | null = null;
    if (profile?.id && isOnline) {
      unsubscribe = subscribeToAssignedRides(profile.id, (rides) => {
        setAssignedRides(rides);
        setLoadingRides(false);
      });
    }

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      unsubscribe?.();
    };
  }, [fetchRides]);

  // Show incoming-ride confirmation screen when a NEW ride is assigned.
  const shownIncomingRef = useRef<string | null>(null);
  useEffect(() => {
    const storeActive = useDriverRideStore.getState().activeRide;
    if (
      storeActive &&
      storeActive.driverProgress &&
      storeActive.driverProgress !== 'heading_pickup'
    ) {
      return;
    }

    const newRide = assignedRides.find((r) => {
      const progress = (r.driverProgress ?? '').trim();
      const isAssigned =
        r.status === 'assigned' || r.adminStatus === 'assigned';
      return isAssigned && progress === '';
    });
    if (!newRide || shownIncomingRef.current === newRide.id) return;
    shownIncomingRef.current = newRide.id;
    router.push('/(trip)/incoming-ride');
  }, [assignedRides]);

  const handleToggle = async (online: boolean) => {
    if (togglingRef.current) return;
    togglingRef.current = true;

    // Optimistic update
    if (online) { setOnline(); } else { setOffline(); }

    try {
      if (profile?.id) {
        await updateDriverOnlineStatus(profile.id, online);
        // Keep auth store profile in sync so other screens read correct isOnline
        useDriverAuthStore.getState().setProfile({ ...profile, isOnline: online });
      }
    } catch {
      // Revert local state and inform driver
      if (online) { setOffline(); } else { setOnline(); }
      useToastStore.getState().showToast('Failed to update status. Check connection and try again.', 'error');
    } finally {
      togglingRef.current = false;
    }
  };

  const initials =
    (profile?.fullName ?? 'D')
      .split(' ')
      .slice(0, 2)
      .map((w) => w[0])
      .join('')
      .toUpperCase() || 'D';

  const activeRide = assignedRides.find(
    (r) => r.driverProgress === 'heading_pickup' || r.status === 'in_progress'
  );

  return (
    <View style={styles.container}>
      {/* Full-screen map */}
      <DriverMap
        ref={mapRef}
        driverCoords={driverCoords}
        pickupCoords={
          activeRide
            ? { latitude: activeRide.pickupLat, longitude: activeRide.pickupLng }
            : undefined
        }
        dropoffCoords={
          activeRide
            ? {
                latitude: activeRide.dropoffLat,
                longitude: activeRide.dropoffLng,
              }
            : undefined
        }
      />

      <View
        pointerEvents="none"
        style={[
          styles.statusScrim,
          { height: Math.max(insets.top + 16, 44) },
        ]}
      />

      {/* Recenter / zoom controls — top-right, just below the header card */}
      <MapControls
        anchor="top-right"
        topOffset={Math.max(insets.top + 16, 42) + 80}
        onRecenter={handleRecenter}
        onZoomIn={() => mapRef.current?.zoomBy(1)}
        onZoomOut={() => mapRef.current?.zoomBy(-1)}
      />

      {/* Header card */}
      <View
        style={[styles.header, { paddingTop: Math.max(insets.top + 16, 42) }]}
        pointerEvents="box-none"
      >
        <View style={styles.headerCard}>
          {/* Avatar + driver info */}
          <View style={styles.driverRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
            <View style={styles.driverInfo}>
              <Text style={styles.driverName} numberOfLines={1}>
                {profile?.fullName ?? 'Driver'}
              </Text>
              <Text style={styles.vehicleLabel} numberOfLines={1}>
                <Ionicons
                  name="car-outline"
                  size={11}
                  color="rgba(255,255,255,0.45)"
                />{' '}
                {profile?.vehicleLabel
                  ? `${profile.vehicleLabel} · ${profile.plateNumber ?? ''}`
                  : 'No vehicle assigned'}
              </Text>
            </View>
          </View>

          {/* Online/offline pill */}
          <View
            style={[
              styles.statusPill,
              {
                backgroundColor: isOnline ? DT.onlineBg : DT.offlineBg,
                borderColor: isOnline ? DT.onlineBorder : DT.offlineBorder,
              },
            ]}
          >
            <View
              style={[
                styles.statusDot,
                { backgroundColor: isOnline ? DT.online : DT.offline },
              ]}
            />
            <Text
              style={[
                styles.statusText,
                { color: isOnline ? DT.online : DT.offline },
              ]}
            >
              {isOnline ? 'Online' : 'Offline'}
            </Text>
          </View>
        </View>
      </View>

      {/* Active ride banner (if driver is heading to pickup / in trip) */}
      {activeRide && (
        <View style={styles.activeBannerContainer} pointerEvents="box-none">
          <TouchableOpacity
            style={styles.activeBanner}
            onPress={() => router.push('/(trip)/active-ride')}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="View active ride"
          >
            <View style={styles.activeBannerPulse} />
            <View style={styles.activeBannerContent}>
              <Text style={styles.activeBannerTitle}>
                {activeRide.status === 'in_progress'
                  ? 'Trip in progress'
                  : 'Heading to pickup'}
              </Text>
              <Text style={styles.activeBannerSub} numberOfLines={1}>
                {activeRide.status === 'in_progress'
                  ? activeRide.dropoffAddress
                  : activeRide.pickupAddress}
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={16}
              color="rgba(255,255,255,0.5)"
            />
          </TouchableOpacity>
        </View>
      )}

      {/* Bottom slider */}
      <View
        style={[
          styles.sliderArea,
          { paddingBottom: Math.max(insets.bottom + 16, 28) },
        ]}
        pointerEvents="box-none"
      >
        <SwipeSlider isOnline={isOnline} onToggle={handleToggle} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DT.bg,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    zIndex: 20,
  },
  statusScrim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 18,
    backgroundColor: 'rgba(5,7,12,0.78)',
  },
  headerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 20,
    backgroundColor: 'rgba(8,10,18,0.95)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  driverRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(30,58,95,0.9)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 15,
    fontWeight: '800',
    fontFamily: 'Inter_800ExtraBold',
    color: '#FFFFFF',
  },
  driverInfo: {
    flex: 1,
    gap: 2,
  },
  driverName: {
    fontSize: 15,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
    color: '#FFFFFF',
  },
  vehicleLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.45)',
    fontFamily: 'Inter_400Regular',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 999,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
  },
  activeBannerContainer: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 160,
    zIndex: 20,
  },
  activeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(8,10,18,0.96)',
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.55)',
    borderRadius: 16,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  activeBannerPulse: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: '#3B82F6',
    flexShrink: 0,
  },
  activeBannerContent: {
    flex: 1,
  },
  activeBannerTitle: {
    fontSize: 13,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  activeBannerSub: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.6)',
    fontFamily: 'Inter_400Regular',
    marginTop: 2,
  },
  sliderArea: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 16,
    zIndex: 20,
    backgroundColor: 'transparent',
  },
});
