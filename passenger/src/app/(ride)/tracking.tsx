import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { T, shadows } from '@/src/theme/tokens';
import { Avatar, StatusPill, ContactRow, Button, AddressRoute } from '@/src/components/ui';
import { useRideStore } from '@/src/store/useRideStore';
import { Ionicons } from '@expo/vector-icons';
import VeloMap from '@/src/components/map/VeloMap';
import { subscribeToDriverLocation, subscribeToRide } from '@/src/services/realtime';
import { databases, databaseId, COLLECTIONS } from '@/src/services/appwrite';
import type { DriverLocationRecord } from '@/src/types';

export default function TrackingScreen() {
  const router = useRouter();
  const destination = useRideStore((s) => s.destination);
  const pickup = useRideStore((s) => s.pickup);
  const activeRide = useRideStore((s) => s.activeRide);
  const driver = useRideStore((s) => s.driver);
  const setDriver = useRideStore((s) => s.setDriver);
  const resetRide = useRideStore((s) => s.resetRide);
  const routeGeoJSON = useRideStore((s) => s.routeGeoJSON);
  const durationMinutes = useRideStore((s) => s.durationMinutes);
  const [elapsed, setElapsed] = useState(0);
  const [driverLocation, setDriverLocation] = useState<DriverLocationRecord | null>(null);

  useEffect(() => {
    const interval = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  // Realtime ride subscription
  useEffect(() => {
    if (!activeRide?.id) return;
    return subscribeToRide(activeRide.id, setDriver);
  }, [activeRide?.id, setDriver]);

  // Polling fallback — detect cancellation/completion every 15s
  useEffect(() => {
    if (!activeRide?.id) return;
    const interval = setInterval(async () => {
      try {
        const ride = await databases.getDocument(databaseId, COLLECTIONS.RIDES, activeRide.id);
        if (ride.status === 'cancelled') {
          resetRide();
          router.replace('/(tabs)/home');
        } else if (ride.status === 'completed' || ride.adminStatus === 'completed' || ride.driverProgress === 'completed') {
          router.replace('/(ride)/completed');
        }
      } catch { /* ignore */ }
    }, 15000);
    return () => clearInterval(interval);
  }, [activeRide?.id, resetRide, router]);

  // Driver location subscription
  useEffect(() => {
    if (!driver?.id) return;
    return subscribeToDriverLocation(driver.id, setDriverLocation);
  }, [driver?.id]);

  const handleSOS = useCallback(() => {
    Alert.alert(
      'Emergency SOS',
      'Do you need emergency assistance?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Call Emergency (999)',
          style: 'destructive',
          onPress: () => Linking.openURL('tel:999'),
        },
        {
          text: 'Call RYDE Support',
          onPress: () => Linking.openURL('tel:+966500000000'),
        },
      ],
    );
  }, []);

  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;
  const driverName = driver?.name || 'Driver';
  const driverInitials = driver?.initials || driverName.charAt(0).toUpperCase();

  return (
    <View style={styles.container}>
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
          <TouchableOpacity style={styles.sosBtn} activeOpacity={0.7} onPress={handleSOS}>
            <Ionicons name="shield-outline" size={16} color={T.red} />
            <Text style={{ fontSize: T.font.sm, fontWeight: '700', color: T.red }}>SOS</Text>
          </TouchableOpacity>
        </View>
      </View>

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

        <AddressRoute from={pickup?.label || 'Pickup'} to={destination?.label || 'Destination'} style={{ marginVertical: 16 }} />

        <View style={styles.driverMini}>
          <Avatar initials={driverInitials} bg={driver?.avatarBg || '#1E293B'} size={40} photoUrl={driver?.photoUrl} />
          <View style={{ flex: 1 }}>
            <Text style={styles.driverName}>{driverName}</Text>
            <Text style={styles.driverVehicle}>{driver?.vehicle || 'Vehicle'}{driver?.plateNumber ? ` · ${driver.plateNumber}` : ''}</Text>
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
