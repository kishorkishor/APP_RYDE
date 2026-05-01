import { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { T, shadows } from '@/src/theme/tokens';
import { BackButton, Button, Divider, AddressRoute, CtaBar } from '@/src/components/ui';
import { useRideStore } from '@/src/store/useRideStore';
import { fetchRoute } from '@/src/services/routing';
import { listVehicleOptions } from '@/src/services/appwriteRecords';
import type { VehicleOption } from '@/src/types';

const rideIcons: Record<string, keyof typeof Ionicons.glyphMap> = {
  premium_sedan: 'car-sport-outline',
  premium_suv: 'car-outline',
  custom_luxury: 'diamond-outline',
};

export default function RideOptionsScreen() {
  const router = useRouter();
  const [vehicleOptions, setVehicleOptions] = useState<VehicleOption[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [isLoadingRoute, setIsLoadingRoute] = useState(true);
  const [isLoadingVehicles, setIsLoadingVehicles] = useState(true);

  const pickup = useRideStore((s) => s.pickup);
  const destination = useRideStore((s) => s.destination);
  const setRouteDetails = useRideStore((s) => s.setRouteDetails);
  const distanceKm = useRideStore((s) => s.distanceKm);
  const durationMinutes = useRideStore((s) => s.durationMinutes);
  const setSelectedRide = useRideStore((s) => s.setSelectedRide);

  const selected = useMemo(
    () => vehicleOptions.find((vehicle) => vehicle.id === selectedId) || vehicleOptions[0] || null,
    [selectedId, vehicleOptions]
  );

  useEffect(() => {
    const loadVehicles = async () => {
      setIsLoadingVehicles(true);
      const vehicles = await listVehicleOptions();
      setVehicleOptions(vehicles);
      setSelectedId(vehicles[0]?.id || '');
      setIsLoadingVehicles(false);
    };

    loadVehicles();
  }, []);

  useEffect(() => {
    const getRoute = async () => {
      if (pickup?.latitude && pickup?.longitude && destination?.latitude && destination?.longitude) {
        setIsLoadingRoute(true);
        const res = await fetchRoute(pickup.longitude, pickup.latitude, destination.longitude, destination.latitude);
        if (res) {
          setRouteDetails(res.distanceKm, res.durationMinutes, res.geometry);
        }
        setIsLoadingRoute(false);
        return;
      }

      setIsLoadingRoute(false);
    };

    getRoute();
  }, [pickup, destination, setRouteDetails]);

  const handleConfirm = () => {
    if (!selected || selected.availabilityCount < 1) return;

    setSelectedRide({
      id: selected.id,
      name: selected.name,
      etaMinutes: durationMinutes || 0,
      fareAmount: 0,
    });
    router.push('/(ride)/searching-driver');
  };

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <BackButton onPress={() => router.back()} />
        <Text style={styles.title}>Choose a vehicle</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.routeBox}>
        <AddressRoute from={pickup?.label || 'Pickup'} to={destination?.label || 'Destination'} />
      </View>

      <Divider />

      <ScrollView contentContainerStyle={styles.optionsList} showsVerticalScrollIndicator={false}>
        {isLoadingRoute || isLoadingVehicles ? (
          <View style={styles.loadingState}>
            <ActivityIndicator size="large" color={T.primary} />
            <Text style={styles.loadingText}>
              {isLoadingVehicles ? 'Loading available vehicles...' : 'Calculating route...'}
            </Text>
          </View>
        ) : (
          vehicleOptions.map((ride) => {
            const isSelected = ride.id === selectedId;
            const eta = durationMinutes || 0;
            const availabilityLabel =
              ride.availabilityCount > 0
                ? `${ride.availabilityCount} available now`
                : 'Currently unavailable';

            return (
              <TouchableOpacity
                key={ride.id}
                onPress={() => setSelectedId(ride.id)}
                activeOpacity={0.85}
                disabled={ride.availabilityCount < 1}
                style={[
                  styles.optionCard,
                  isSelected && styles.optionCardActive,
                  ride.availabilityCount < 1 && styles.optionCardDisabled,
                ]}
              >
                <View style={styles.optionLeft}>
                  <Ionicons name={rideIcons[ride.id] || 'car-outline'} size={22} color={T.text2} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.optionName}>{ride.name}</Text>
                  <Text style={styles.optionTagline}>{ride.tagline}</Text>
                  <Text style={styles.optionMeta}>
                    {ride.capacity} seats · {availabilityLabel}
                    {eta > 0 ? ` · ${eta} min trip` : ''}
                    {distanceKm ? ` · ${distanceKm.toFixed(1)} km` : ''}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      <CtaBar>
        <Button
          variant="primary"
          size="lg"
          fullWidth
          onPress={handleConfirm}
          disabled={!selected || selected.availabilityCount < 1}
        >
          {selected ? `Confirm ${selected.name}` : 'Confirm vehicle'}
        </Button>
      </CtaBar>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.white },
  topBar: { paddingTop: 54, paddingHorizontal: 20, paddingBottom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 18, fontWeight: '700', color: T.text, letterSpacing: -0.3 },
  routeBox: { paddingHorizontal: 20, paddingVertical: 16 },
  optionsList: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 12, gap: 10 },
  loadingState: { padding: 40, alignItems: 'center' },
  loadingText: { marginTop: 12, color: T.text3, fontWeight: '500' },
  optionCard: { flexDirection: 'row', alignItems: 'center', gap: 14, borderRadius: T.radius.lg, padding: 14, borderWidth: 1.5, borderColor: 'transparent', backgroundColor: T.gray50 },
  optionCardActive: { borderColor: T.primary, backgroundColor: T.white, ...shadows.sm },
  optionCardDisabled: { opacity: 0.55 },
  optionLeft: { width: 48, height: 48, borderRadius: 14, backgroundColor: T.gray100, alignItems: 'center', justifyContent: 'center' },
  optionName: { fontSize: T.font.lg, fontWeight: '700', color: T.text, marginBottom: 2 },
  optionTagline: { fontSize: T.font.sm, color: T.text3 },
  optionMeta: { fontSize: T.font.xs, color: T.text4, marginTop: 4 },
});
