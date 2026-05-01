import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { T, shadows } from '@/src/theme/tokens';
import { Button, Avatar, StatusPill, StarRating, ContactRow } from '@/src/components/ui';
import { SAMPLE_DRIVER } from '@/src/data/sampleData';
import { Ionicons } from '@expo/vector-icons';
import { useRideStore } from '@/src/store/useRideStore';
import VeloMap from '@/src/components/map/VeloMap';
import { subscribeToDriverLocation, subscribeToRide } from '@/src/services/realtime';
import type { DriverLocationRecord } from '@/src/types';

export default function DriverAssignedScreen() {
  const router = useRouter();
  const activeRide = useRideStore((s) => s.activeRide);
  const driver = useRideStore((s) => s.driver);
  const setDriver = useRideStore((s) => s.setDriver);
  const d = driver || SAMPLE_DRIVER;
  const pickup = useRideStore((s) => s.pickup);
  const durationMinutes = useRideStore((s) => s.durationMinutes);
  const [driverLocation, setDriverLocation] = useState<DriverLocationRecord | null>(null);

  useEffect(() => {
    if (!activeRide?.id) return;
    return subscribeToRide(activeRide.id, setDriver);
  }, [activeRide?.id, setDriver]);

  useEffect(() => {
    if (!d.id) return;
    return subscribeToDriverLocation(d.id, setDriverLocation);
  }, [d.id]);

  return (
    <View style={styles.container}>
      {/* Map area */}
      <View style={styles.mapArea}>
        <VeloMap 
          style={StyleSheet.absoluteFillObject}
          pickupCoordinate={pickup?.longitude && pickup?.latitude ? [pickup.longitude, pickup.latitude] : undefined}
          driverCoordinate={driverLocation ? [driverLocation.lng, driverLocation.lat] : undefined}
        />
        <View style={styles.mapOverlay}>
          <StatusPill variant="blue">Driver on the way</StatusPill>
          <TouchableOpacity style={styles.shareBtn} activeOpacity={0.7}>
            <Ionicons name="share-outline" size={18} color={T.text} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Bottom sheet */}
      <ScrollView style={styles.sheet} contentContainerStyle={styles.sheetContent} showsVerticalScrollIndicator={false}>
        <View style={styles.handle} />
        <StatusPill variant="green" style={{ alignSelf: 'center', marginBottom: 12 }}>Driver assigned</StatusPill>
        <Text style={styles.title}>{d.name} is coming</Text>
        <Text style={styles.subtitle}>Arriving in ~{durationMinutes || d.etaMinutes} min · {d.distanceAway}</Text>

        {/* Driver card */}
        <View style={styles.driverCard}>
          <View style={styles.driverRow}>
            <Avatar initials={d.initials} bg={d.avatarBg!} size={52} photoUrl={d.photoUrl} />
            <View style={{ flex: 1 }}>
              <Text style={styles.driverName}>{d.name}</Text>
              <View style={styles.ratingRow}>
                <View style={styles.onlineDot} />
                <StarRating rating={5} size={12} />
                <Text style={styles.ratingText}>{d.rating}</Text>
                <Text style={styles.tripsText}>· {d.totalTrips?.toLocaleString()} trips</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Vehicle info */}
        <View style={styles.vehicleRow}>
          <View>
            <Text style={styles.vehicleName}>{d.vehicle}</Text>
            <Text style={styles.vehicleColor}>{d.vehicleColor}</Text>
          </View>
          <View style={styles.plateBox}>
            <Text style={styles.plateText}>{d.plateNumber}</Text>
          </View>
        </View>

        {/* ETA */}
        <View style={styles.etaRow}>
          <Text style={styles.etaLabel}>Arriving in</Text>
          <Text style={styles.etaValue}>{durationMinutes || d.etaMinutes} min · {d.distanceAway}</Text>
        </View>

        {/* Actions */}
        <ContactRow style={{ marginVertical: 16 }} />

        <Button variant="primary" size="lg" fullWidth onPress={() => router.push('/(ride)/tracking')}>
          Track ride
        </Button>

        <TouchableOpacity style={styles.cancelBtn} activeOpacity={0.7}>
          <Text style={styles.cancelText}>Cancel ride</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.white },
  mapArea: { height: '30%', backgroundColor: '#E8F0FE', position: 'relative' },
  mapOverlay: { position: 'absolute', top: 54, left: 20, right: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  shareBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: T.white, alignItems: 'center', justifyContent: 'center', ...shadows.sm },
  sheet: { flex: 1, backgroundColor: T.white, borderTopLeftRadius: 28, borderTopRightRadius: 28, marginTop: -20 },
  sheetContent: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 36 },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: T.gray300, alignSelf: 'center', marginBottom: 12 },
  title: { fontSize: 22, fontWeight: '800', color: T.text, textAlign: 'center', letterSpacing: -0.5, fontFamily: 'Inter_800ExtraBold' },
  subtitle: { fontSize: T.font.base, color: T.text3, textAlign: 'center', marginBottom: 20 },
  driverCard: { backgroundColor: T.gray50, borderRadius: T.radius.lg, padding: 16, marginBottom: 12 },
  driverRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  driverName: { fontSize: T.font.xl, fontWeight: '700', color: T.text, marginBottom: 4 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  onlineDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: T.green },
  ratingText: { fontSize: T.font.sm, fontWeight: '600', color: T.text2 },
  tripsText: { fontSize: T.font.sm, color: T.text3 },
  vehicleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: T.gray50, borderRadius: T.radius.md, padding: 14, marginBottom: 12 },
  vehicleName: { fontSize: T.font.lg, fontWeight: '600', color: T.text },
  vehicleColor: { fontSize: T.font.sm, color: T.text3, marginTop: 2 },
  plateBox: { backgroundColor: T.primary, borderRadius: T.radius.sm, paddingHorizontal: 12, paddingVertical: 8 },
  plateText: { fontSize: T.font.sm, fontWeight: '700', color: T.white, letterSpacing: 0.5 },
  etaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: T.greenLight, borderRadius: T.radius.md, padding: 14 },
  etaLabel: { fontSize: T.font.base, color: T.green },
  etaValue: { fontSize: T.font.lg, fontWeight: '700', color: T.green },
  cancelBtn: { alignItems: 'center', marginTop: 12 },
  cancelText: { fontSize: T.font.base, fontWeight: '600', color: T.red },
});
