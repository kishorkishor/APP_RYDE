import { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { T } from '@/src/theme/tokens';
import { Button } from '@/src/components/ui';
import VeloMap from '@/src/components/map/VeloMap';
import { ACTIVE_CITY } from '@/src/config/city';
import { databases, databaseId, COLLECTIONS } from '@/src/services/appwrite';
import { createRideRequest, type LoginProfileInput } from '@/src/services/appwriteRecords';
import { useAuthStore } from '@/src/store/useAuthStore';
import { useRideStore } from '@/src/store/useRideStore';

export default function SearchingDriverScreen() {
  const router = useRouter();
  const pickup = useRideStore((s) => s.pickup);
  const destination = useRideStore((s) => s.destination);
  const selectedRide = useRideStore((s) => s.selectedRide);
  const routeGeoJSON = useRideStore((s) => s.routeGeoJSON);
  const distanceKm = useRideStore((s) => s.distanceKm);
  const durationMinutes = useRideStore((s) => s.durationMinutes);
  const requestType = useRideStore((s) => s.requestType);
  const scheduledPickupAt = useRideStore((s) => s.scheduledPickupAt);
  const setActiveRide = useRideStore((s) => s.setActiveRide);
  const user = useAuthStore((s) => s.user);
  const [elapsed, setElapsed] = useState(0);
  const [requestSaved, setRequestSaved] = useState(false);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const pulseScale = useSharedValue(1);

  useEffect(() => {
    pulseScale.value = withRepeat(withTiming(1.6, { duration: 1200 }), -1, true);
    const interval = setInterval(() => setElapsed((e) => e + 1), 1000);
    const countdownInterval = setInterval(() => setNow(Date.now()), 30000);

    const createRideRecord = async () => {
      try {
        if (!user) return;
        const profile = await databases.getDocument(databaseId, COLLECTIONS.PROFILES, user.id);

        const created = await createRideRequest({
          riderId: user.id,
          profile: {
            passengerName: profile.passengerName || user.name || 'Unknown',
            email: profile.email || user.email || 'Unknown',
            projectCode: profile.projectCode || user.projectCode || 'Unknown',
            projectLeader: profile.projectLeader || user.projectLeader || 'Unknown',
            companyName: profile.companyName || user.companyName || 'Unknown',
            number: profile.number || user.phone || '',
          } as Partial<LoginProfileInput>,
          pickup,
          destination,
          selectedRide,
          distanceKm,
          durationMinutes,
          requestType,
          scheduledPickupAt,
        });

        setActiveRide({
          id: created.$id,
          riderId: user.id,
          cityId: ACTIVE_CITY.id,
          requestType,
          scheduledPickupAt,
          pickup: pickup || { label: 'Pickup' },
          destination: destination || { label: 'Drop-off' },
          selectedRide,
          fare: selectedRide?.fareAmount ? { amount: selectedRide.fareAmount, currency: ACTIVE_CITY.currency } : null,
          paymentStatus: 'pending',
          status: 'admin_review',
          createdAt: created.$createdAt,
          updatedAt: created.$updatedAt,
        });
        setRequestSaved(true);
      } catch (err) {
        console.error('Failed to create ride:', err);
        setRequestError(
          err instanceof Error ? err.message : 'Could not submit ride request. Please try again.'
        );
      }
    };

    createRideRecord();
    return () => {
      clearInterval(interval);
      clearInterval(countdownInterval);
    };
  }, []);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: 2 - pulseScale.value,
  }));

  return (
    <View style={styles.container}>
      <View style={styles.mapArea}>
        <VeloMap
          style={StyleSheet.absoluteFillObject}
          pickupCoordinate={pickup?.longitude && pickup?.latitude ? [pickup.longitude, pickup.latitude] : undefined}
          destinationCoordinate={destination?.longitude && destination?.latitude ? [destination.longitude, destination.latitude] : undefined}
          routeGeoJSON={routeGeoJSON}
        />
        <View style={styles.pulseOverlay}>
          <Animated.View style={[styles.pulseOuter, pulseStyle]} />
          <View style={styles.pulseInner}>
            <Ionicons name="checkmark" size={28} color={T.green} />
          </View>
        </View>
      </View>

      <View style={styles.sheet}>
        <View style={styles.handle} />
        <View style={[styles.statusPill, requestError && styles.errorPill]}>
          <View style={[styles.statusDot, requestError && styles.errorDot]} />
          <Text style={[styles.statusText, requestError && styles.errorText]}>
            {requestError ? 'Request failed' : requestSaved ? 'Pending dispatch' : 'Saving request'}
          </Text>
        </View>
        {requestError ? (
          <>
            <Text style={styles.title}>Something went wrong</Text>
            <Text style={styles.subtitle}>{requestError}</Text>
          </>
        ) : (
          <>
            <Text style={styles.title}>Ride request sent</Text>
            <Text style={styles.subtitle}>Dispatch will review the request, assign a driver, and confirm details by phone.</Text>
          </>
        )}

        {requestType === 'scheduled' && scheduledPickupAt && (
          <View style={styles.scheduleSummary}>
            <Ionicons name="calendar-outline" size={18} color={T.green} />
            <View style={{ flex: 1 }}>
              <Text style={styles.scheduleSummaryText}>
                Scheduled for {new Date(scheduledPickupAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
              </Text>
              <Text style={styles.scheduleCountdownText}>{formatCountdown(new Date(scheduledPickupAt).getTime() - now)}</Text>
            </View>
          </View>
        )}

        <View style={styles.timerRow}>
          <Text style={styles.timerLabel}>Request age</Text>
          <Text style={styles.timerValue}>{elapsed}s</Text>
        </View>

        <View style={styles.dotsRow}>
          {[0, 1, 2].map((i) => (
            <View key={i} style={[styles.loadDot, { opacity: elapsed % 3 === i ? 1 : 0.3 }]} />
          ))}
        </View>

        <Button variant="primary" size="md" fullWidth onPress={() => router.replace('/(tabs)/home')} style={{ marginTop: 24 }}>
          Done
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.white },
  mapArea: { flex: 1, backgroundColor: '#E8F0FE', position: 'relative', alignItems: 'center', justifyContent: 'center' },
  pulseOverlay: { position: 'absolute', alignItems: 'center', justifyContent: 'center', zIndex: 10 },
  pulseOuter: { position: 'absolute', width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(22,163,74,0.15)' },
  pulseInner: { width: 64, height: 64, borderRadius: 32, backgroundColor: T.white, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },
  sheet: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 36, backgroundColor: T.white, borderTopLeftRadius: 28, borderTopRightRadius: 28 },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: T.gray300, alignSelf: 'center', marginBottom: 16 },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: T.blueLight, borderRadius: T.radius.full, paddingHorizontal: 12, paddingVertical: 7, alignSelf: 'center', marginBottom: 12 },
  errorPill: { backgroundColor: T.redLight },
  statusDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: T.blue },
  errorDot: { backgroundColor: T.red },
  statusText: { fontSize: T.font.md, fontWeight: '700', color: T.blue },
  errorText: { color: T.red },
  title: { fontSize: 22, fontWeight: '800', color: T.text, textAlign: 'center', letterSpacing: -0.5, marginBottom: 8, fontFamily: 'Inter_800ExtraBold' },
  subtitle: { fontSize: T.font.base, color: T.text3, textAlign: 'center', lineHeight: 20, marginBottom: 20 },
  scheduleSummary: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: T.greenLight, borderRadius: T.radius.md, padding: 12, marginBottom: 16 },
  scheduleSummaryText: { fontSize: T.font.base, fontWeight: '800', color: T.text },
  scheduleCountdownText: { fontSize: T.font.sm, fontWeight: '700', color: T.green, marginTop: 2 },
  timerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: T.gray50, borderRadius: T.radius.md, padding: 14 },
  timerLabel: { fontSize: T.font.base, color: T.text3 },
  timerValue: { fontSize: T.font.lg, fontWeight: '700', color: T.text },
  dotsRow: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginTop: 16 },
  loadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: T.green },
});

const formatCountdown = (milliseconds: number) => {
  if (milliseconds <= 0) return 'Pickup time has arrived';

  const totalMinutes = Math.ceil(milliseconds / 60000);
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) return `Pickup in ${days}d ${hours}h`;
  if (hours > 0) return `Pickup in ${hours}h ${minutes}m`;
  return `Pickup in ${minutes}m`;
};
