import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { T, shadows } from '@/src/theme/tokens';
import { Avatar, StatusPill, ContactRow, Button, AddressRoute } from '@/src/components/ui';
import { SAMPLE_DRIVER } from '@/src/data/sampleData';
import { useRideStore } from '@/src/store/useRideStore';
import { Ionicons } from '@expo/vector-icons';
import VeloMap from '@/src/components/map/VeloMap';
import { subscribeToDriverLocation, subscribeToRide } from '@/src/services/realtime';
import type { DriverLocationRecord } from '@/src/types';

export default function TrackingScreen() {
  const router = useRouter();
  const destination = useRideStore((s) => s.destination);
  const pickup = useRideStore((s) => s.pickup);
  const activeRide = useRideStore((s) => s.activeRide);
  const driver = useRideStore((s) => s.driver);
  const setDriver = useRideStore((s) => s.setDriver);
  const routeGeoJSON = useRideStore((s) => s.routeGeoJSON);
  const durationMinutes = useRideStore((s) => s.durationMinutes);
  const d = driver || SAMPLE_DRIVER;
  const [elapsed, setElapsed] = useState(0);
  const [driverLocation, setDriverLocation] = useState<DriverLocationRecord | null>(null);

  useEffect(() => {
    const interval = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!activeRide?.id) return;
    return subscribeToRide(activeRide.id, setDriver);
  }, [activeRide?.id, setDriver]);

  useEffect(() => {
    if (!d.id) return;
    return subscribeToDriverLocation(d.id, setDriverLocation);
  }, [d.id]);

  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;

  return (
    <View style={styles.container}>
      {/* Map */}
      <View style={styles.mapArea}>
        <VeloMap 
          style={StyleSheet.absoluteFillObject}
          pickupCoordinate={pickup?.longitude && pickup?.latitude ? [pickup.longitude, pickup.latitude] : undefined}
          destinationCoordinate={destination?.longitude && destination?.latitude ? [destination.longitude, destination.latitude] : undefined}
          driverCoordinate={driverLocation ? [driverLocation.lng, driverLocation.lat] : undefined}
          routeGeoJSON={routeGeoJSON}
        />
        <View style={styles.topOverlay}>
          <StatusPill variant="blue">Ride in progress</StatusPill>
          <TouchableOpacity style={styles.sosBtn} activeOpacity={0.7}>
            <Ionicons name="shield-outline" size={16} color={T.red} />
            <Text style={{ fontSize: T.font.sm, fontWeight: '700', color: T.red }}>SOS</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Bottom sheet */}
      <View style={styles.sheet}>
        <View style={styles.handle} />
        <View style={styles.timerRow}>
          <View>
            <Text style={styles.timerLabel}>Trip time</Text>
            <Text style={styles.timerValue}>{String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.timerLabel}>Arriving in</Text>
            <Text style={styles.timerValue}>~{Math.max((durationMinutes || 15) - mins, 1)} min</Text>
          </View>
        </View>

        <AddressRoute from={pickup?.label || 'Midtown Manhattan'} to={destination?.label || 'Destination'} style={{ marginVertical: 16 }} />

        {/* Driver mini card */}
        <View style={styles.driverMini}>
          <Avatar initials={d.initials} bg={d.avatarBg!} size={40} photoUrl={d.photoUrl} />
          <View style={{ flex: 1 }}>
            <Text style={styles.driverName}>{d.name}</Text>
            <Text style={styles.driverVehicle}>{d.vehicle} · {d.plateNumber}</Text>
          </View>
        </View>

        <ContactRow style={{ marginVertical: 12 }} />

        <Button variant="primary" size="lg" fullWidth onPress={() => router.replace('/(ride)/completed')}>
          Arrived at destination
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.white },
  mapArea: { flex: 1, backgroundColor: '#E8F0FE', position: 'relative' },
  topOverlay: { position: 'absolute', top: 54, left: 20, right: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sosBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: T.redLight, paddingHorizontal: 12, paddingVertical: 8, borderRadius: T.radius.full },
  sheet: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 36, backgroundColor: T.white, borderTopLeftRadius: 28, borderTopRightRadius: 28, ...shadows.sheet },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: T.gray300, alignSelf: 'center', marginBottom: 16 },
  timerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: T.gray50, borderRadius: T.radius.md, padding: 16 },
  timerLabel: { fontSize: T.font.sm, color: T.text4, marginBottom: 4 },
  timerValue: { fontSize: T.font['3xl'], fontWeight: '800', color: T.text, fontFamily: 'Inter_800ExtraBold' },
  driverMini: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: T.gray50, borderRadius: T.radius.md, padding: 12 },
  driverName: { fontSize: T.font.lg, fontWeight: '600', color: T.text },
  driverVehicle: { fontSize: T.font.sm, color: T.text3, marginTop: 2 },
});
