// ─── Assignment Screen ───────────────────────────────────────────────────────
// Shows when admin assigns a ride. No reject option — assignment is mandatory.
// Driver sees task details and taps "Start" to begin heading to pickup.
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Vibration,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DT } from '@/src/theme/tokens';
import { DriverMap } from '@/src/components/map/DriverMap';
import { useDriverRideStore } from '@/src/store/useDriverRideStore';
import { useDriverAuthStore } from '@/src/store/useDriverAuthStore';
import { useToastStore } from '@/src/store/useToastStore';
import { acceptRide } from '@/src/services/driverRecords';

export default function IncomingRideScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const assignedRides = useDriverRideStore((s) => s.assignedRides);
  const activeRide = useDriverRideStore((s) => s.activeRide);
  const setActiveRide = useDriverRideStore((s) => s.setActiveRide);
  const profile = useDriverAuthStore((s) => s.profile);

  const [accepting, setAccepting] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const ride =
    activeRide ??
    assignedRides.find(
      (r) =>
        (r.status === 'assigned' || r.adminStatus === 'assigned') &&
        !r.driverProgress,
    ) ??
    assignedRides[0] ??
    null;

  // Pulse animation for the alert badge
  useEffect(() => {
    Vibration.vibrate([0, 300, 200, 300]);
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.15, duration: 600, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, []);

  useEffect(() => {
    if (!ride) router.replace('/(tabs)/home');
  }, [ride]);

  const handleStart = async () => {
    if (!ride || accepting) return;
    setAccepting(true);
    try {
      await acceptRide(ride.id, profile?.id, profile?.fullName);
      setActiveRide({ ...ride, driverProgress: 'heading_pickup' });
      router.replace('/(trip)/active-ride');
    } catch {
      useToastStore.getState().showToast('Could not start ride. Please try again.', 'error');
      setAccepting(false);
    }
  };

  if (!ride) return null;

  return (
    <View style={styles.container}>
      {/* Map background */}
      <DriverMap
        pickupCoords={{ latitude: ride.pickupLat, longitude: ride.pickupLng }}
        dropoffCoords={{ latitude: ride.dropoffLat, longitude: ride.dropoffLng }}
        initialZoom={12}
      />

      <View style={[styles.overlay, { paddingTop: insets.top + 8 }]}>
        {/* Top alert chip */}
        <View style={styles.alertChipRow}>
          <Animated.View style={[styles.alertChip, { transform: [{ scale: pulseAnim }] }]}>
            <View style={styles.alertPulse} />
            <Text style={styles.alertChipText}>NEW ASSIGNMENT</Text>
          </Animated.View>
        </View>

        <View style={{ flex: 1 }} />

        {/* Ride card */}
        <View style={[styles.card, { paddingBottom: insets.bottom + 8 }]}>
          <View style={styles.cardBody}>
            {/* Header */}
            <View style={styles.cardHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.sectionLabel}>PASSENGER</Text>
                <Text style={styles.passengerName}>{ride.passengerName}</Text>
              </View>
              <View style={styles.assignedBadge}>
                <Ionicons name="checkmark-circle" size={14} color="#22C55E" />
                <Text style={styles.assignedText}>Assigned to you</Text>
              </View>
            </View>

            {/* Meta chips */}
            <View style={styles.chips}>
              {ride.companyName ? (
                <View style={styles.chip}>
                  <Ionicons name="business-outline" size={11} color={DT.textLabel} />
                  <Text style={styles.chipText}>{ride.companyName}</Text>
                </View>
              ) : null}
              {ride.projectCode ? (
                <View style={styles.chip}>
                  <Ionicons name="briefcase-outline" size={11} color={DT.textLabel} />
                  <Text style={styles.chipText}>{ride.projectCode}</Text>
                </View>
              ) : null}
              {ride.projectLeader ? (
                <View style={styles.chip}>
                  <Ionicons name="person-outline" size={11} color={DT.textLabel} />
                  <Text style={styles.chipText}>{ride.projectLeader}</Text>
                </View>
              ) : null}
              {ride.rideType ? (
                <View style={styles.chip}>
                  <Ionicons name="car-outline" size={11} color={DT.textLabel} />
                  <Text style={styles.chipText}>{ride.rideType}</Text>
                </View>
              ) : null}
            </View>

            {/* Route */}
            <View style={styles.route}>
              <View style={styles.routeIconCol}>
                <View style={styles.pickupDot} />
                <View style={styles.routeVLine} />
                <Ionicons name="location" size={10} color="#EF4444" />
              </View>
              <View style={styles.routeLabels}>
                <Text style={styles.routeAddrLabel}>PICKUP LOCATION</Text>
                <Text style={styles.routeAddr} numberOfLines={2}>
                  {ride.pickupAddress}
                </Text>
                <Text style={[styles.routeAddrLabel, { marginTop: 10 }]}>
                  DROP-OFF LOCATION
                </Text>
                <Text style={styles.routeAddr} numberOfLines={2}>
                  {ride.dropoffAddress}
                </Text>
              </View>
            </View>

            {/* Stats */}
            <View style={styles.stats}>
              <View style={styles.stat}>
                <Ionicons name="navigate-outline" size={14} color={DT.textLabel} />
                <Text style={styles.statText}>{(ride.distanceKm ?? 0).toFixed(1)} km</Text>
              </View>
              <View style={styles.statSep} />
              <View style={styles.stat}>
                <Ionicons name="time-outline" size={14} color={DT.textLabel} />
                <Text style={styles.statText}>~{ride.durationMinutes ?? 0} min</Text>
              </View>
            </View>

            {/* Instructions */}
            <View style={styles.instructions}>
              <Ionicons name="information-circle-outline" size={14} color="#93C5FD" />
              <Text style={styles.instructionsText}>
                Head to the pickup location. Tap each step as you complete it: Arrived → Picked Up → Dropped Off.
              </Text>
            </View>

            {/* Start button — no decline option */}
            <TouchableOpacity
              style={[styles.startBtn, accepting && styles.startBtnDisabled]}
              onPress={handleStart}
              disabled={accepting}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Start ride assignment"
            >
              <Text style={styles.startBtnText}>
                {accepting ? 'Starting...' : 'Start Ride'}
              </Text>
              {!accepting && (
                <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: DT.bg },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    flex: 1,
    flexDirection: 'column',
  },
  alertChipRow: { paddingHorizontal: 16 },
  alertChip: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: 'rgba(34,197,94,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.45)',
  },
  alertPulse: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22C55E',
  },
  alertChipText: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
    color: '#86EFAC',
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: 'rgba(8,10,18,0.96)',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: DT.glassBorder,
    overflow: 'hidden',
  },
  cardBody: { padding: 18, gap: 14 },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  sectionLabel: {
    fontSize: 10,
    color: DT.textFaint,
    fontFamily: 'Inter_500Medium',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  passengerName: {
    fontSize: 22,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  assignedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(34,197,94,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.3)',
  },
  assignedText: {
    fontSize: 11,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
    color: '#86EFAC',
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: DT.borderLight,
  },
  chipText: {
    fontSize: 11,
    color: DT.textMuted,
    fontFamily: 'Inter_500Medium',
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
    height: 24,
    backgroundColor: 'rgba(255,255,255,0.12)',
    marginVertical: 2,
  },
  routeLabels: { flex: 1 },
  routeAddrLabel: {
    fontSize: 10,
    color: DT.textFaint,
    fontFamily: 'Inter_500Medium',
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  routeAddr: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
    color: '#FFFFFF',
    lineHeight: 20,
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: DT.borderLight,
    padding: 10,
  },
  stat: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    justifyContent: 'center',
  },
  statText: {
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
    color: 'rgba(255,255,255,0.7)',
  },
  statSep: {
    width: 1,
    height: 14,
    backgroundColor: DT.borderLight,
  },
  instructions: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(59,130,246,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.2)',
  },
  instructionsText: {
    flex: 1,
    fontSize: 12,
    color: '#93C5FD',
    fontFamily: 'Inter_400Regular',
    lineHeight: 18,
  },
  startBtn: {
    height: 56,
    borderRadius: 16,
    backgroundColor: '#22C55E',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  startBtnDisabled: {
    opacity: 0.6,
  },
  startBtnText: {
    fontSize: 17,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
    color: '#FFFFFF',
  },
});
