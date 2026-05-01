// ─── Trip In-Progress Screen ──────────────────────────────────────────────────
// Driver is navigating to dropoff. Shows map + dropoff card + End Trip CTA.
// ─────────────────────────────────────────────────────────────────────────────
import { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DT } from '@/src/theme/tokens';
import { DriverMap } from '@/src/components/map/DriverMap';
import { useDriverRideStore } from '@/src/store/useDriverRideStore';
import { useDriverStatusStore } from '@/src/store/useDriverStatusStore';
import { useDriverAuthStore } from '@/src/store/useDriverAuthStore';
import { completeRide } from '@/src/services/driverRecords';
import { useToastStore } from '@/src/store/useToastStore';

export default function TripScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const activeRide = useDriverRideStore((s) => s.activeRide);
  const clearActiveRide = useDriverRideStore((s) => s.clearActiveRide);
  const setStatus = useDriverStatusStore((s) => s.setStatus);
  const profile = useDriverAuthStore((s) => s.profile);

  useEffect(() => {
    if (!activeRide) router.back();
  }, [activeRide]);

  if (!activeRide) return null;

  const handleEndTrip = async () => {
    Alert.alert(
      'End Trip?',
      'Confirm you have reached the drop-off location.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'End Trip',
          style: 'destructive',
          onPress: async () => {
            try {
              await completeRide(activeRide.id, profile?.id);
              clearActiveRide();
              setStatus('online');
              router.replace('/(trip)/complete-ride');
            } catch {
              useToastStore.getState().showToast('Could not complete ride. Please try again.', 'error');
            }
          },
        },
      ]
    );
  };

  const handleNavigate = () => {
    const url = `google.navigation:q=${activeRide.dropoffLat},${activeRide.dropoffLng}`;
    Linking.openURL(url).catch(() => {
      const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${activeRide.dropoffLat},${activeRide.dropoffLng}`;
      Linking.openURL(mapsUrl);
    });
  };

  return (
    <View style={styles.container}>
      {/* Map showing route to dropoff */}
      <DriverMap
        pickupCoords={{
          latitude: activeRide.pickupLat,
          longitude: activeRide.pickupLng,
        }}
        dropoffCoords={{
          latitude: activeRide.dropoffLat,
          longitude: activeRide.dropoffLng,
        }}
        initialZoom={12}
      />

      <View style={[styles.overlay, { paddingTop: insets.top + 8 }]}>
        {/* Top status pill */}
        <View style={styles.topRow}>
          <View style={styles.statusPill}>
            <View style={styles.statusDot} />
            <View>
              <Text style={styles.statusTitle}>Trip In Progress</Text>
              <Text style={styles.statusSub} numberOfLines={1}>
                Heading to {activeRide.dropoffAddress}
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
        <View style={[styles.card, { paddingBottom: insets.bottom + 12 }]}>
          {/* Passenger row */}
          <View style={styles.passengerRow}>
            <View style={styles.passengerInfo}>
              <Text style={styles.passengerName}>{activeRide.passengerName}</Text>
              <Text style={styles.passengerSub}>
                {activeRide.projectCode} · {activeRide.companyName}
              </Text>
            </View>
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark-circle" size={13} color="#22C55E" />
              <Text style={styles.verifiedText}>Verified</Text>
            </View>
          </View>

          {/* Dropoff info */}
          <View style={styles.dropoffBox}>
            <View style={styles.dropoffIconWrap}>
              <Ionicons name="location" size={16} color="#EF4444" />
            </View>
            <View style={styles.dropoffInfo}>
              <Text style={styles.dropoffLabel}>Drop-off</Text>
              <Text style={styles.dropoffAddr} numberOfLines={2}>
                {activeRide.dropoffAddress}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.navigateBtn}
              onPress={handleNavigate}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Navigate to drop-off"
            >
              <Ionicons name="navigate" size={16} color="#3B82F6" />
            </TouchableOpacity>
          </View>

          {/* Stats */}
          <View style={styles.stats}>
            <View style={styles.stat}>
              <Ionicons name="navigate-outline" size={13} color={DT.textLabel} />
              <Text style={styles.statText}>{activeRide.distanceKm.toFixed(1)} km</Text>
            </View>
            <View style={styles.statSep} />
            <View style={styles.stat}>
              <Ionicons name="time-outline" size={13} color={DT.textLabel} />
              <Text style={styles.statText}>~{activeRide.durationMinutes} min</Text>
            </View>
            <View style={styles.statSep} />
            <View style={styles.stat}>
              <Ionicons name="car-outline" size={13} color={DT.textLabel} />
              <Text style={styles.statText}>{activeRide.rideType}</Text>
            </View>
          </View>

          {/* End trip */}
          <TouchableOpacity
            style={styles.endTripBtn}
            onPress={handleEndTrip}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="End trip"
          >
            <Ionicons name="flag" size={18} color="#fff" />
            <Text style={styles.endTripBtnText}>End Trip</Text>
          </TouchableOpacity>
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
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
  },
  statusPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: 'rgba(10,11,15,0.85)',
    borderWidth: 1,
    borderColor: DT.amberBorder,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: DT.amber,
    flexShrink: 0,
  },
  statusTitle: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
    color: DT.amberText,
    letterSpacing: 0.3,
  },
  statusSub: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.45)',
    fontFamily: 'Inter_400Regular',
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
    backgroundColor: 'rgba(8,10,18,0.93)',
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
    justifyContent: 'space-between',
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
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(34,197,94,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.25)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  verifiedText: {
    fontSize: 11,
    color: '#22C55E',
    fontFamily: 'Inter_600SemiBold',
  },
  dropoffBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: DT.borderLight,
    borderRadius: 14,
    padding: 12,
  },
  dropoffIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(239,68,68,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  dropoffInfo: { flex: 1 },
  dropoffLabel: {
    fontSize: 10,
    color: DT.textFaint,
    fontFamily: 'Inter_400Regular',
    marginBottom: 2,
  },
  dropoffAddr: {
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
    color: '#FFFFFF',
    lineHeight: 18,
  },
  navigateBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: DT.assignedBg,
    borderWidth: 1,
    borderColor: DT.assignedBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: DT.borderLight,
    padding: 8,
  },
  stat: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    justifyContent: 'center',
  },
  statText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
    color: 'rgba(255,255,255,0.7)',
  },
  statSep: {
    width: 1,
    height: 14,
    backgroundColor: DT.borderLight,
  },
  endTripBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#EF4444',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  endTripBtnText: {
    fontSize: 15,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
    color: '#FFFFFF',
  },
});
