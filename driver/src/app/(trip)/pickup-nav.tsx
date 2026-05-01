// ─── Pickup Navigation Screen ─────────────────────────────────────────────────
// Driver heading to pickup. Shows map with route to pickup.
// Tapping "Navigate" fetches an OSRM route, draws it, fits the camera, then
// optionally enters nav-cam mode (pitch + bearing along the first segment).
// If routing service is unavailable, falls back to a straight LineString and
// surfaces a yellow toast.
// ─────────────────────────────────────────────────────────────────────────────
import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { DT } from '@/src/theme/tokens';
import { DriverMap, type DriverMapHandle } from '@/src/components/map/DriverMap';
import { MapControls } from '@/src/components/map/MapControls';
import { useDriverRideStore } from '@/src/store/useDriverRideStore';
import { useDriverStatusStore } from '@/src/store/useDriverStatusStore';
import { useDriverAuthStore } from '@/src/store/useDriverAuthStore';
import { markArrived, startTrip } from '@/src/services/driverRecords';
import { fetchRoute } from '@/src/services/routing';
import { useToastStore } from '@/src/store/useToastStore';

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

export default function PickupNavScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const activeRide = useDriverRideStore((s) => s.activeRide);
  const setActiveRide = useDriverRideStore((s) => s.setActiveRide);
  const setStatus = useDriverStatusStore((s) => s.setStatus);
  const profile = useDriverAuthStore((s) => s.profile);

  const mapRef = useRef<DriverMapHandle>(null);
  const [driverCoords, setDriverCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [routeGeoJSON, setRouteGeoJSON] = useState<any | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeMeta, setRouteMeta] = useState<{ km: number; min: number } | null>(null);
  const [navMode, setNavMode] = useState(false);

  // Track driver location
  useEffect(() => {
    let sub: Location.LocationSubscription | null = null;
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      try {
        const initial = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        setDriverCoords({
          latitude: initial.coords.latitude,
          longitude: initial.coords.longitude,
        });
      } catch {
        // best-effort
      }
      sub = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.Balanced, distanceInterval: 15 },
        (loc) => {
          setDriverCoords({
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
          });
        }
      );
    })();
    return () => {
      sub?.remove();
    };
  }, []);

  useEffect(() => {
    if (!activeRide) router.back();
  }, [activeRide]);

  if (!activeRide) return null;

  const handleArrived = async () => {
    try {
      await markArrived(activeRide.id, profile?.id, profile?.fullName);
      await startTrip(activeRide.id, profile?.id, profile?.fullName);
      setActiveRide({
        ...activeRide,
        driverProgress: 'in_progress',
        status: 'in_progress',
        passengerVerified: true,
        verifiedAt: new Date().toISOString(),
      });
      setStatus('in_progress');
      router.replace('/(trip)/trip');
    } catch {
      useToastStore.getState().showToast('Could not update status. Please try again.', 'error');
    }
  };

  const drawRouteToPickup = async () => {
    if (routeLoading) return;
    setRouteLoading(true);
    try {
      let from = driverCoords;
      if (!from) {
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        from = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
        setDriverCoords(from);
      }
      // fetchRoute(pickupLon, pickupLat, dropoffLon, dropoffLat) — lon/lat order!
      const result = await fetchRoute(
        from.longitude,
        from.latitude,
        activeRide.pickupLng,
        activeRide.pickupLat,
      );
      let feature: any | null = null;
      if (result?.geometry) {
        feature = {
          type: 'Feature',
          properties: {},
          geometry: result.geometry,
        };
        setRouteMeta({ km: result.distanceKm, min: result.durationMinutes });
      } else {
        // Fallback: straight line
        console.warn('[pickup-nav] OSRM unavailable — falling back to straight line.');
        feature = {
          type: 'Feature',
          properties: { fallback: true },
          geometry: {
            type: 'LineString',
            coordinates: [
              [from.longitude, from.latitude],
              [activeRide.pickupLng, activeRide.pickupLat],
            ],
          },
        };
        setRouteMeta(null);
        useToastStore.getState().showToast('Routing service unavailable; showing direct line.', 'warning');
      }
      setRouteGeoJSON(feature);
      // Fit camera to the full route, then enter nav-cam after the fit settles
      setTimeout(() => mapRef.current?.fitToRoute(feature), 80);

      // Compute bearing toward the next route point and arm nav-cam
      const coords = feature.geometry.coordinates as [number, number][];
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
      console.error('[pickup-nav] route fetch error:', err);
      useToastStore.getState().showToast('Could not fetch a route. Check your connection.', 'error');
    } finally {
      setRouteLoading(false);
    }
  };

  const handleRecenter = () => {
    if (!driverCoords) return;
    if (routeGeoJSON) {
      // Re-enter nav cam on existing route, bearing to next point
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

  return (
    <View style={styles.container}>
      {/* Map */}
      <DriverMap
        ref={mapRef}
        driverCoords={driverCoords}
        pickupCoords={{
          latitude: activeRide.pickupLat,
          longitude: activeRide.pickupLng,
        }}
        routeGeoJSON={routeGeoJSON}
        initialZoom={14}
        onUserGesture={handleUserGesture}
      />

      {/* Status-bar scrim — keeps system icons readable on dark map */}
      <View
        pointerEvents="none"
        style={[styles.statusScrim, { height: insets.top + 18 }]}
      />

      <View style={[styles.overlay, { paddingTop: insets.top + 10 }]} pointerEvents="box-none">
        {/* Top row */}
        <View style={styles.topRow}>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => router.back()}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Ionicons name="arrow-back" size={18} color="#fff" />
          </TouchableOpacity>

          {/* Status pill */}
          <View style={styles.statusPill}>
            <View style={styles.statusPulse} />
            <View style={styles.statusText}>
              <Text style={styles.statusTitle}>Heading to Pickup</Text>
              <Text style={styles.statusSub} numberOfLines={1}>
                {routeMeta
                  ? `${routeMeta.km} km · ~${routeMeta.min} min`
                  : `${activeRide.pickupAddress} · ~${activeRide.durationMinutes} min`}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Floating map controls — top-right, just below status pill */}
      <MapControls
        anchor="top-right"
        topOffset={insets.top + 70}
        onRecenter={handleRecenter}
        onFitRoute={routeGeoJSON ? handleFitRoute : undefined}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        recenterActive={navMode}
      />

      {/* Bottom passenger card */}
      <View
        style={[
          styles.cardWrap,
          { paddingBottom: insets.bottom + 12, opacity: navMode ? 0.85 : 1 },
        ]}
        pointerEvents="box-none"
      >
        <View style={styles.card}>
          {/* Passenger row */}
          <View style={styles.passengerRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
            <View style={styles.passengerInfo}>
              <Text style={styles.passengerName}>{activeRide.passengerName}</Text>
              <View style={styles.pickupRow}>
                <Ionicons name="location" size={11} color="#22C55E" />
                <Text style={styles.pickupAddr} numberOfLines={1}>
                  {activeRide.pickupAddress}
                </Text>
              </View>
            </View>
            {activeRide.projectCode ? (
              <View style={styles.projectChip}>
                <Text style={styles.projectChipText}>{activeRide.projectCode}</Text>
              </View>
            ) : null}
          </View>

          {/* Action buttons */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.actionBtn, styles.actionBtnBlue]}
              onPress={drawRouteToPickup}
              activeOpacity={0.85}
              disabled={routeLoading}
              accessibilityRole="button"
              accessibilityLabel="Navigate to pickup"
            >
              {routeLoading ? (
                <ActivityIndicator size="small" color="#3B82F6" />
              ) : (
                <Ionicons name="navigate" size={18} color="#3B82F6" />
              )}
              <Text style={styles.actionBtnText}>
                {routeGeoJSON ? 'Update Route' : 'Navigate'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, styles.actionBtnGreen]}
              onPress={handleCall}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Call passenger"
            >
              <Ionicons name="call" size={18} color="#22C55E" />
              <Text style={styles.actionBtnText}>Call</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, styles.actionBtnGhost]}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Message passenger"
            >
              <Ionicons name="chatbubble-outline" size={18} color={DT.textMuted} />
              <Text style={styles.actionBtnText}>Message</Text>
            </TouchableOpacity>
          </View>

          {/* Arrived CTA */}
          <TouchableOpacity
            style={styles.arrivedBtn}
            onPress={handleArrived}
            activeOpacity={0.9}
            accessibilityRole="button"
            accessibilityLabel="Arrived, start trip"
          >
            <Ionicons name="checkmark-circle" size={18} color="#fff" />
            <Text style={styles.arrivedBtnText}>
              Arrived — Start Trip
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: DT.bg },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
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
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: 'rgba(10,11,15,0.92)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
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
    borderColor: 'rgba(59,130,246,0.45)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  statusPulse: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: '#3B82F6',
    flexShrink: 0,
  },
  statusText: { flex: 1 },
  statusTitle: {
    fontSize: 13,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  statusSub: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.6)',
    fontFamily: 'Inter_400Regular',
    marginTop: 1,
  },
  cardWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  card: {
    backgroundColor: 'rgba(8,10,18,0.96)',
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
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
    color: '#FFFFFF',
  },
  pickupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  pickupAddr: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.55)',
    fontFamily: 'Inter_400Regular',
    flex: 1,
  },
  projectChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: DT.assignedBg,
    borderWidth: 1,
    borderColor: DT.assignedBorder,
  },
  projectChipText: {
    fontSize: 11,
    color: DT.assignedText,
    fontFamily: 'Inter_600SemiBold',
  },
  actionRow: { flexDirection: 'row', gap: 8 },
  actionBtn: {
    flex: 1,
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  actionBtnBlue: {
    backgroundColor: 'rgba(59,130,246,0.14)',
    borderColor: 'rgba(59,130,246,0.35)',
  },
  actionBtnGreen: {
    backgroundColor: 'rgba(34,197,94,0.12)',
    borderColor: 'rgba(34,197,94,0.3)',
  },
  actionBtnGhost: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderColor: DT.borderLight,
  },
  actionBtnText: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.55)',
    fontFamily: 'Inter_500Medium',
  },
  arrivedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#22C55E',
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  arrivedBtnText: {
    fontSize: 15,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
    color: '#FFFFFF',
  },
});
