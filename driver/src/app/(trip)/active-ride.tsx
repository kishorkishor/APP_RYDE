import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { DT } from '@/src/theme/tokens';
import { startDriverLocationTracking, stopDriverLocationTracking } from '@/src/services/locationTracking';
import { DriverMap, type DriverMapHandle } from '@/src/components/map/DriverMap';
import { MapControls } from '@/src/components/map/MapControls';
import { useDriverRideStore } from '@/src/store/useDriverRideStore';
import { useDriverStatusStore } from '@/src/store/useDriverStatusStore';
import { useDriverAuthStore } from '@/src/store/useDriverAuthStore';
import {
  markArrived,
  markPickedUp,
  completeRide,
} from '@/src/services/driverRecords';
import { useToastStore } from '@/src/store/useToastStore';
import { subscribeToRideDocument } from '@/src/services/realtime';
import { databases, databaseId, COLLECTIONS } from '@/src/services/appwrite';
import { fetchRoute } from '@/src/services/routing';
import { useGeofenceArrival } from '@/src/hooks/useGeofenceArrival';

type FlowStep = 'heading' | 'arrived' | 'picked_up' | 'completed';

function resolveStep(ride: { driverProgress?: string | null }): FlowStep {
  switch (ride.driverProgress) {
    case 'arrived':
      return 'arrived';
    case 'picked_up':
    case 'in_progress':
      return 'picked_up';
    case 'completed':
      return 'completed';
    default:
      return 'heading';
  }
}

// Compute initial bearing (degrees, 0..360) from one lat/lng to another.
function computeBearing(
  fromLat: number,
  fromLon: number,
  toLat: number,
  toLon: number,
): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const toDeg = (r: number) => (r * 180) / Math.PI;
  const dLon = toRad(toLon - fromLon);
  const lat1 = toRad(fromLat);
  const lat2 = toRad(toLat);
  const y = Math.sin(dLon) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

export default function ActiveRideScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const activeRide = useDriverRideStore((s) => s.activeRide);
  const setActiveRide = useDriverRideStore((s) => s.setActiveRide);
  const clearActiveRide = useDriverRideStore((s) => s.clearActiveRide);
  const routeGeoJSON = useDriverRideStore((s) => s.routeGeoJSON);
  const setRouteGeoJSON = useDriverRideStore((s) => s.setRouteGeoJSON);
  const setStatus = useDriverStatusStore((s) => s.setStatus);
  const profile = useDriverAuthStore((s) => s.profile);

  const mapRef = useRef<DriverMapHandle>(null);
  const [driverCoords, setDriverCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [loading, setLoading] = useState<FlowStep | null>(null);
  const [navMode, setNavMode] = useState(false);

  // Track driver location with Appwrite upload
  useEffect(() => {
    if (!activeRide?.id || !profile?.id) return;
    startDriverLocationTracking(profile.id, true, activeRide, setDriverCoords);
    return () => stopDriverLocationTracking();
  }, [activeRide?.id, profile?.id]);

  // Auto-arrival detection: toast when within 150m of pickup
  const pickupTarget = activeRide
    ? { latitude: activeRide.pickupLat, longitude: activeRide.pickupLng }
    : null;
  useGeofenceArrival(driverCoords, pickupTarget, activeRide?.id, () => {
    useToastStore.getState().showToast("You've arrived at the pickup location!", 'success');
  });

  // Real-time subscription: reflect admin/passenger changes immediately
  useEffect(() => {
    if (!activeRide?.id) return;
    const unsubscribe = subscribeToRideDocument(activeRide.id, (payload) => {
      const current = useDriverRideStore.getState().activeRide;
      if (!current) return;
      const status = String(payload.status || '');

      // Detect cancellation or admin unassignment (driverId cleared / changed)
      const wasCancelled = status === 'cancelled';
      const wasUnassigned =
        profile?.id &&
        payload.driverId !== undefined &&
        payload.driverId !== profile.id;

      if (wasCancelled || wasUnassigned) {
        clearActiveRide();
        useToastStore.getState().showToast(
          wasCancelled ? 'Ride was cancelled' : 'You have been unassigned from this ride',
          'info',
        );
        router.replace('/(tabs)/home');
        return;
      }

      setActiveRide({
        ...current,
        status: status || current.status,
        adminStatus: payload.adminStatus ?? current.adminStatus,
        driverProgress: payload.driverProgress ?? current.driverProgress,
        passengerVerified: payload.passengerVerified ?? current.passengerVerified,
      });
    });
    return () => unsubscribe();
  }, [activeRide?.id]);

  // Polling fallback: check ride status every 15s in case the WebSocket is dead
  // (handles INVALID_STATE_ERR after force-stop/background cycles)
  useEffect(() => {
    if (!activeRide?.id || !profile?.id) return;
    const interval = setInterval(async () => {
      try {
        const doc = await databases.getDocument(
          databaseId,
          COLLECTIONS.RIDES,
          activeRide.id,
        );
        const status = String(doc.status || '');
        const driverId = String(doc.driverId || '');

        if (status === 'cancelled' || (driverId !== profile!.id)) {
          clearActiveRide();
          useToastStore.getState().showToast(
            status === 'cancelled'
              ? 'Ride was cancelled'
              : 'You have been unassigned from this ride',
            'info',
          );
          router.replace('/(tabs)/home');
          return;
        }

        // Sync latest server state into the store
        const current = useDriverRideStore.getState().activeRide;
        if (current) {
          setActiveRide({
            ...current,
            status: status || current.status,
            adminStatus: doc.adminStatus ?? current.adminStatus,
            driverProgress: doc.driverProgress ?? current.driverProgress,
            passengerVerified: doc.passengerVerified ?? current.passengerVerified,
          });
        }
      } catch {
        // best-effort — network may be down
      }
    }, 15_000);
    return () => clearInterval(interval);
  }, [activeRide?.id, profile?.id]);

  // Auto-fetch route on ride / step change. Fall back to a straight line if
  // OSRM is unreachable so the user always sees something.
  useEffect(() => {
    if (!activeRide) return;
    let cancelled = false;
    const step = resolveStep(activeRide);
    const headingToPickup = step === 'heading' || step === 'arrived';

    (async () => {
      try {
        let from: { lat: number; lon: number };
        if (driverCoords) {
          from = { lat: driverCoords.latitude, lon: driverCoords.longitude };
        } else {
          const loc = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          from = { lat: loc.coords.latitude, lon: loc.coords.longitude };
        }
        const to = headingToPickup
          ? { lon: activeRide.pickupLng, lat: activeRide.pickupLat }
          : { lon: activeRide.dropoffLng, lat: activeRide.dropoffLat };
        const result = await fetchRoute(from.lon, from.lat, to.lon, to.lat);
        if (cancelled) return;
        if (result?.geometry) {
          const feature = {
            type: 'Feature',
            properties: {},
            geometry: result.geometry,
          };
          setRouteGeoJSON(feature);
          setTimeout(() => {
            if (!cancelled) mapRef.current?.fitToRoute(feature);
          }, 200);
        } else {
          // Fallback: straight line
          const feature = {
            type: 'Feature',
            properties: { fallback: true },
            geometry: {
              type: 'LineString',
              coordinates: [
                [from.lon, from.lat],
                [to.lon, to.lat],
              ],
            },
          };
          setRouteGeoJSON(feature);
          useToastStore.getState().showToast('Routing service unavailable; showing direct line.', 'warning');
          setTimeout(() => {
            if (!cancelled) mapRef.current?.fitToRoute(feature);
          }, 200);
        }
      } catch (err) {
        console.error('[active-ride] route fetch error:', err);
      }
    })();

    // IMPORTANT: do NOT clear routeGeoJSON on cleanup — that caused the route
    // to flicker / disappear between state transitions. The store is cleared
    // when the ride completes via clearActiveRide().
    return () => {
      cancelled = true;
    };
  }, [activeRide?.id, activeRide?.driverProgress]);

  useEffect(() => {
    if (!activeRide) router.back();
  }, [activeRide]);

  if (!activeRide) return null;

  const step = resolveStep(activeRide);

  const handleArrived = async () => {
    setLoading('arrived');
    try {
      await markArrived(activeRide.id, profile?.id);
      // Local-first state update — server polling won't roll us back because
      // we never re-fetch ride state on this screen.
      setActiveRide({ ...activeRide, driverProgress: 'arrived' });
      setStatus('arrived');
    } catch {
      useToastStore.getState().showToast('Could not update status. Try again.', 'error');
    } finally {
      setLoading(null);
    }
  };

  const handlePickedUp = async () => {
    setLoading('picked_up');
    try {
      await markPickedUp(activeRide.id, profile?.id);
      setActiveRide({ ...activeRide, driverProgress: 'picked_up', status: 'in_progress' });
      setStatus('in_progress');
    } catch {
      useToastStore.getState().showToast('Could not update status. Try again.', 'error');
    } finally {
      setLoading(null);
    }
  };

  const handleDroppedOff = async () => {
    setLoading('completed');
    try {
      await completeRide(activeRide.id, profile?.id);
      clearActiveRide();
      setStatus('online');
      router.replace('/(trip)/complete-ride');
    } catch {
      useToastStore.getState().showToast('Could not complete ride. Try again.', 'error');
    } finally {
      setLoading(null);
    }
  };

  // In-app navigation: refetch route from current driver location, fit camera,
  // then enter nav-cam (pitch + bearing) along the first segment.
  const handleNavigate = async () => {
    const target =
      step === 'heading' || step === 'arrived'
        ? { lat: activeRide.pickupLat, lng: activeRide.pickupLng }
        : { lat: activeRide.dropoffLat, lng: activeRide.dropoffLng };
    try {
      let from = driverCoords;
      if (!from) {
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        from = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
        setDriverCoords(from);
      }
      const result = await fetchRoute(
        from.longitude,
        from.latitude,
        target.lng,
        target.lat,
      );
      let feature: any | null = null;
      if (result?.geometry) {
        feature = {
          type: 'Feature',
          properties: {},
          geometry: result.geometry,
        };
      } else {
        // Fallback: straight line
        feature = {
          type: 'Feature',
          properties: { fallback: true },
          geometry: {
            type: 'LineString',
            coordinates: [
              [from.longitude, from.latitude],
              [target.lng, target.lat],
            ],
          },
        };
        useToastStore.getState().showToast('Routing service unavailable; showing direct line.', 'warning');
      }
      setRouteGeoJSON(feature);
      setTimeout(() => mapRef.current?.fitToRoute(feature), 80);

      // Arm nav-cam after fit settles
      const coords = (feature.geometry?.coordinates ?? []) as [number, number][];
      if (coords.length >= 2 && from) {
        const next = coords[1];
        const bearing = computeBearing(
          from.latitude,
          from.longitude,
          next[1],
          next[0],
        );
        setTimeout(() => {
          if (from) {
            mapRef.current?.enterNavMode(from, bearing);
            setNavMode(true);
          }
        }, 1100);
      }
    } catch (err) {
      console.error('[active-ride] route fetch error:', err);
      useToastStore.getState().showToast('Could not fetch a route. Check your connection.', 'error');
    }
  };

  const handleRecenter = () => {
    if (!driverCoords) return;
    if (routeGeoJSON) {
      const coords = (routeGeoJSON.geometry?.coordinates ?? []) as [number, number][];
      if (coords.length >= 2) {
        const next = coords[1];
        const bearing = computeBearing(
          driverCoords.latitude,
          driverCoords.longitude,
          next[1],
          next[0],
        );
        mapRef.current?.enterNavMode(driverCoords, bearing);
        setNavMode(true);
        return;
      }
    }
    mapRef.current?.recenter(driverCoords);
    setNavMode(false);
  };

  const handleFitRoute = () => {
    if (routeGeoJSON) {
      mapRef.current?.fitToRoute(routeGeoJSON);
      setNavMode(false);
    }
  };

  const handleZoomIn = () => mapRef.current?.zoomBy(1);
  const handleZoomOut = () => mapRef.current?.zoomBy(-1);

  const handleUserGesture = () => {
    if (navMode) {
      setNavMode(false);
      mapRef.current?.exitNavMode(driverCoords ?? undefined);
    }
  };

  const handleCall = () => {
    if (activeRide.number) {
      Linking.openURL(`tel:${activeRide.number}`);
    } else {
      useToastStore.getState().showToast('No phone number available for this passenger.', 'warning');
    }
  };

  const initials = (activeRide.passengerName ?? 'P')
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

  const headingToPickup = step === 'heading' || step === 'arrived';

  const statusLabel = headingToPickup
    ? 'Heading to Pickup'
    : 'Trip In Progress';

  const statusColor = headingToPickup ? '#3B82F6' : DT.amber;

  return (
    <View style={styles.container}>
      <DriverMap
        ref={mapRef}
        driverCoords={driverCoords}
        pickupCoords={{
          latitude: activeRide.pickupLat,
          longitude: activeRide.pickupLng,
        }}
        dropoffCoords={{
          latitude: activeRide.dropoffLat,
          longitude: activeRide.dropoffLng,
        }}
        routeGeoJSON={routeGeoJSON}
        initialZoom={12}
        onUserGesture={handleUserGesture}
      />

      {/* Status-bar scrim */}
      <View
        pointerEvents="none"
        style={[styles.statusScrim, { height: insets.top + 18 }]}
      />

      {/* Floating recenter / fit-route / zoom controls — top-right */}
      <MapControls
        anchor="top-right"
        topOffset={insets.top + 70}
        onRecenter={handleRecenter}
        onFitRoute={routeGeoJSON ? handleFitRoute : undefined}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        recenterActive={navMode}
      />

      <View style={[styles.overlay, { paddingTop: insets.top + 8 }]} pointerEvents="box-none">
        {/* Status pill */}
        <View style={styles.topRow}>
          <View style={[styles.statusPill, { borderColor: `${statusColor}55` }]}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <View style={styles.statusTextWrap}>
              <Text style={[styles.statusTitle, { color: statusColor }]}>
                {statusLabel}
              </Text>
              <Text style={styles.statusSub} numberOfLines={1}>
                {headingToPickup
                  ? activeRide.pickupAddress
                  : activeRide.dropoffAddress}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.reportBtn}
            onPress={() => router.push('/(trip)/report-issue')}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Report issue"
          >
            <Ionicons name="flag-outline" size={16} color={DT.textMuted} />
          </TouchableOpacity>
        </View>

        <View style={{ flex: 1 }} />

        {/* Bottom card */}
        <View
          style={[
            styles.card,
            {
              paddingBottom: insets.bottom + 12,
              opacity: navMode ? 0.85 : 1,
            },
          ]}
        >
          {/* Passenger row */}
          <View style={styles.passengerRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
            <View style={styles.passengerInfo}>
              <Text style={styles.passengerName}>{activeRide.passengerName}</Text>
              <Text style={styles.passengerSub} numberOfLines={1}>
                {[activeRide.projectCode, activeRide.companyName]
                  .filter(Boolean)
                  .join(' · ') || activeRide.pickupAddress}
              </Text>
            </View>
          </View>

          {/* Route */}
          <View style={styles.route}>
            <View style={styles.routeIconCol}>
              <View style={styles.pickupDot} />
              <View style={styles.routeVLine} />
              <Ionicons name="location" size={10} color="#EF4444" />
            </View>
            <View style={styles.routeLabels}>
              <Text style={styles.routeLabel}>Pickup</Text>
              <Text style={styles.routeAddr} numberOfLines={1}>
                {activeRide.pickupAddress}
              </Text>
              <Text style={[styles.routeLabel, { marginTop: 8 }]}>Drop-off</Text>
              <Text style={styles.routeAddr} numberOfLines={1}>
                {activeRide.dropoffAddress}
              </Text>
            </View>
          </View>

          {/* Quick actions */}
          <View style={styles.quickActions}>
            <TouchableOpacity
              style={[styles.quickBtn, styles.quickBtnBlue]}
              onPress={handleNavigate}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Navigate to destination"
            >
              <Ionicons name="navigate" size={16} color="#3B82F6" />
              <Text style={styles.quickBtnText}>Navigate</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.quickBtn, styles.quickBtnGreen]}
              onPress={handleCall}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Call passenger"
            >
              <Ionicons name="call" size={16} color="#22C55E" />
              <Text style={styles.quickBtnText}>Call</Text>
            </TouchableOpacity>
          </View>

          {/* === 3-BUTTON FLOW === */}
          <View style={styles.flowButtons}>
            <FlowButton
              label="Arrived"
              icon="location"
              done={step !== 'heading'}
              active={step === 'heading'}
              loading={loading === 'arrived'}
              onPress={handleArrived}
            />
            <FlowButton
              label="Picked Up"
              icon="person-add"
              done={step === 'picked_up' || step === 'completed'}
              active={step === 'arrived'}
              loading={loading === 'picked_up'}
              onPress={handlePickedUp}
            />
            <FlowButton
              label="Dropped Off"
              icon="flag"
              done={step === 'completed'}
              active={step === 'picked_up'}
              loading={loading === 'completed'}
              onPress={handleDroppedOff}
            />
          </View>
        </View>
      </View>

    </View>
  );
}

function FlowButton({
  label,
  icon,
  done,
  active,
  loading,
  onPress,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  done: boolean;
  active: boolean;
  loading: boolean;
  onPress: () => void;
}) {
  const bg = done
    ? 'rgba(34,197,94,0.15)'
    : active
    ? '#22C55E'
    : 'rgba(255,255,255,0.04)';
  const border = done
    ? 'rgba(34,197,94,0.3)'
    : active
    ? '#22C55E'
    : 'rgba(255,255,255,0.08)';
  const textColor = done
    ? '#22C55E'
    : active
    ? '#FFFFFF'
    : 'rgba(255,255,255,0.2)';
  const iconColor = done
    ? '#22C55E'
    : active
    ? '#FFFFFF'
    : 'rgba(255,255,255,0.15)';

  return (
    <TouchableOpacity
      style={[
        styles.flowBtn,
        { backgroundColor: bg, borderColor: border },
        active && styles.flowBtnActive,
      ]}
      onPress={onPress}
      disabled={!active || loading}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !active || loading }}
    >
      {done ? (
        <Ionicons name="checkmark-circle" size={18} color="#22C55E" />
      ) : (
        <Ionicons name={icon} size={16} color={iconColor} />
      )}
      <Text style={[styles.flowBtnText, { color: textColor }]}>
        {loading ? 'Updating...' : label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: DT.bg },
  overlay: { ...StyleSheet.absoluteFillObject, flex: 1 },
  statusScrim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(5,7,12,0.72)',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    // leave room for the top-right MapControls (~56px wide + margin)
    paddingRight: 70,
  },
  statusPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: 'rgba(10,11,15,0.94)',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  statusDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    flexShrink: 0,
  },
  statusTextWrap: { flex: 1 },
  statusTitle: {
    fontSize: 13,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.3,
    color: '#FFFFFF',
  },
  statusSub: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.6)',
    fontFamily: 'Inter_400Regular',
    marginTop: 1,
  },
  reportBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(10,11,15,0.8)',
    borderWidth: 1,
    borderColor: DT.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  card: {
    backgroundColor: 'rgba(8,10,18,0.94)',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: DT.glassBorder,
    padding: 16,
    gap: 12,
  },
  passengerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(30,58,95,0.9)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
    color: '#FFFFFF',
  },
  passengerInfo: { flex: 1, gap: 3 },
  passengerName: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  passengerSub: {
    fontSize: 12,
    color: DT.textMuted,
    fontFamily: 'Inter_400Regular',
  },
  route: {
    flexDirection: 'row',
    gap: 12,
    padding: 13,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: DT.borderLight,
  },
  routeIconCol: { alignItems: 'center', paddingTop: 3, gap: 2 },
  pickupDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22C55E',
    shadowColor: '#22C55E',
    shadowRadius: 4,
    shadowOpacity: 0.6,
    shadowOffset: { width: 0, height: 0 },
  },
  routeVLine: {
    width: 1,
    height: 18,
    backgroundColor: 'rgba(255,255,255,0.12)',
    marginVertical: 2,
  },
  routeLabels: { flex: 1 },
  routeLabel: {
    fontSize: 11,
    color: DT.textFaint,
    fontFamily: 'Inter_400Regular',
    marginBottom: 2,
  },
  routeAddr: {
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
    color: '#FFFFFF',
  },
  quickActions: { flexDirection: 'row', gap: 8 },
  quickBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  quickBtnBlue: {
    backgroundColor: 'rgba(59,130,246,0.12)',
    borderColor: 'rgba(59,130,246,0.3)',
  },
  quickBtnGreen: {
    backgroundColor: 'rgba(34,197,94,0.1)',
    borderColor: 'rgba(34,197,94,0.25)',
  },
  quickBtnText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    fontFamily: 'Inter_500Medium',
  },
  flowButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  flowBtn: {
    flex: 1,
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  flowBtnActive: {
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  flowBtnText: {
    fontSize: 11,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
  },
});
