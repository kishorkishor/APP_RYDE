import { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { T, shadows } from '@/src/theme/tokens';
import { Button, Avatar, StatusPill, StarRating, ContactRow } from '@/src/components/ui';
import { Ionicons } from '@expo/vector-icons';
import { useRideStore } from '@/src/store/useRideStore';
import VeloMap from '@/src/components/map/VeloMap';
import { subscribeToDriverLocation, subscribeToRide } from '@/src/services/realtime';
import { cancelRide } from '@/src/services/appwriteRecords';
import { databases, databaseId, COLLECTIONS } from '@/src/services/appwrite';
import type { DriverLocationRecord } from '@/src/types';

export default function DriverAssignedScreen() {
  const router = useRouter();
  const activeRide = useRideStore((s) => s.activeRide);
  const driver = useRideStore((s) => s.driver);
  const setDriver = useRideStore((s) => s.setDriver);
  const resetRide = useRideStore((s) => s.resetRide);
  const pickup = useRideStore((s) => s.pickup);
  const durationMinutes = useRideStore((s) => s.durationMinutes);
  const [driverLocation, setDriverLocation] = useState<DriverLocationRecord | null>(null);
  const [cancelling, setCancelling] = useState(false);

  // Realtime subscription for ride updates (driver assignment)
  useEffect(() => {
    if (!activeRide?.id) return;
    return subscribeToRide(activeRide.id, setDriver);
  }, [activeRide?.id, setDriver]);

  // Polling fallback — check ride status every 15s in case WebSocket is dead
  useEffect(() => {
    if (!activeRide?.id) return;
    const interval = setInterval(async () => {
      try {
        const ride = await databases.getDocument(databaseId, COLLECTIONS.RIDES, activeRide.id);
        if (ride.status === 'cancelled') {
          resetRide();
          router.replace('/(tabs)/home');
          return;
        }
        if (ride.driverId && !driver) {
          // Trigger a re-fetch through the realtime handler pattern
          setDriver({
            id: String(ride.driverId),
            name: String(ride.driverName || 'Driver'),
            phone: String(ride.driverPhone || ''),
            vehicle: String(ride.vehicleLabel || ''),
            plateNumber: String(ride.plateNumber || ''),
            initials: String(ride.driverName || 'D').split(' ').slice(0, 2).map((p: string) => p[0]).join('').toUpperCase(),
          });
        }
      } catch { /* ignore polling errors */ }
    }, 15000);
    return () => clearInterval(interval);
  }, [activeRide?.id, driver, setDriver, resetRide, router]);

  // Subscribe to driver location when driver is assigned
  useEffect(() => {
    if (!driver?.id) return;
    return subscribeToDriverLocation(driver.id, setDriverLocation);
  }, [driver?.id]);

  const handleCancel = useCallback(async () => {
    if (!activeRide?.id) return;
    Alert.alert('Cancel Ride', 'Are you sure you want to cancel this ride?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes, cancel',
        style: 'destructive',
        onPress: async () => {
          setCancelling(true);
          try {
            await cancelRide(activeRide.id);
            resetRide();
            router.replace('/(tabs)/home');
          } catch (err) {
            setCancelling(false);
            Alert.alert('Error', 'Failed to cancel ride. Please try again.');
          }
        },
      },
    ]);
  }, [activeRide?.id, resetRide, router]);

  // Waiting for driver state
  if (!driver) {
    return (
      <View style={styles.container}>
        <View style={styles.mapArea}>
          <VeloMap
            style={StyleSheet.absoluteFillObject}
            pickupCoordinate={pickup?.longitude && pickup?.latitude ? [pickup.longitude, pickup.latitude] : undefined}
          />
          <View style={styles.mapOverlay}>
            <StatusPill variant="blue">Waiting for driver</StatusPill>
          </View>
        </View>
        <ScrollView style={styles.sheet} contentContainerStyle={styles.sheetContent} showsVerticalScrollIndicator={false}>
          <View style={styles.handle} />
          <StatusPill variant="blue" style={{ alignSelf: 'center', marginBottom: 12 }}>Dispatch reviewing</StatusPill>
          <Text style={styles.title}>Finding your driver</Text>
          <Text style={styles.subtitle}>Our dispatch team is assigning the best available driver for your ride.</Text>
          <View style={styles.waitingAnimation}>
            <View style={styles.waitingDot} />
            <View style={[styles.waitingDot, { opacity: 0.6 }]} />
            <View style={[styles.waitingDot, { opacity: 0.3 }]} />
          </View>
          <TouchableOpacity style={styles.cancelBtn} activeOpacity={0.7} onPress={handleCancel} disabled={cancelling}>
            <Text style={styles.cancelText}>{cancelling ? 'Cancelling...' : 'Cancel ride'}</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.mapArea}>
        <VeloMap
          style={StyleSheet.absoluteFillObject}
          pickupCoordinate={pickup?.longitude && pickup?.latitude ? [pickup.longitude, pickup.latitude] : undefined}
          driverCoordinate={driverLocation ? [driverLocation.lng, driverLocation.lat] : undefined}
        />
        <View style={styles.mapOverlay}>
          <StatusPill variant="blue">Driver on the way</StatusPill>
        </View>
      </View>

      <ScrollView style={styles.sheet} contentContainerStyle={styles.sheetContent} showsVerticalScrollIndicator={false}>
        <View style={styles.handle} />
        <StatusPill variant="green" style={{ alignSelf: 'center', marginBottom: 12 }}>Driver assigned</StatusPill>
        <Text style={styles.title}>{driver.name} is coming</Text>
        <Text style={styles.subtitle}>Arriving in ~{durationMinutes || driver.etaMinutes || 5} min</Text>

        {/* Driver card */}
        <View style={styles.driverCard}>
          <View style={styles.driverRow}>
            <Avatar initials={driver.initials} bg={driver.avatarBg || '#1E293B'} size={52} photoUrl={driver.photoUrl} />
            <View style={{ flex: 1 }}>
              <Text style={styles.driverName}>{driver.name}</Text>
              <View style={styles.ratingRow}>
                <View style={styles.onlineDot} />
                <Text style={styles.ratingText}>Your driver</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Vehicle info */}
        <View style={styles.vehicleRow}>
          <View>
            <Text style={styles.vehicleName}>{driver.vehicle || 'Vehicle'}</Text>
          </View>
          {driver.plateNumber ? (
            <View style={styles.plateBox}>
              <Text style={styles.plateText}>{driver.plateNumber}</Text>
            </View>
          ) : null}
        </View>

        {/* Actions */}
        <ContactRow style={{ marginVertical: 16 }} />

        <Button variant="primary" size="lg" fullWidth onPress={() => router.push('/(ride)/tracking')}>
          Track ride
        </Button>

        <TouchableOpacity style={styles.cancelBtn} activeOpacity={0.7} onPress={handleCancel} disabled={cancelling}>
          <Text style={styles.cancelText}>{cancelling ? 'Cancelling...' : 'Cancel ride'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.white },
  mapArea: { height: '30%', backgroundColor: '#E8F0FE', position: 'relative' },
  mapOverlay: { position: 'absolute', top: 54, left: 20, right: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
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
  vehicleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: T.gray50, borderRadius: T.radius.md, padding: 14, marginBottom: 12 },
  vehicleName: { fontSize: T.font.lg, fontWeight: '600', color: T.text },
  plateBox: { backgroundColor: T.primary, borderRadius: T.radius.sm, paddingHorizontal: 12, paddingVertical: 8 },
  plateText: { fontSize: T.font.sm, fontWeight: '700', color: T.white, letterSpacing: 0.5 },
  cancelBtn: { alignItems: 'center', marginTop: 12 },
  cancelText: { fontSize: T.font.base, fontWeight: '600', color: T.red },
  waitingAnimation: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginVertical: 24 },
  waitingDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: T.green },
});
