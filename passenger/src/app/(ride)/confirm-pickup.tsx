import { useEffect, useState } from 'react';
import { Alert, Platform, View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { T, shadows } from '@/src/theme/tokens';
import { BackButton, Button } from '@/src/components/ui';
import { useRideStore } from '@/src/store/useRideStore';
import { Ionicons } from '@expo/vector-icons';
import VeloMap from '@/src/components/map/VeloMap';
import { geocodeReverse } from '@/src/services/geocoding';
import { ACTIVE_CITY } from '@/src/config/city';
import { fetchRoute } from '@/src/services/routing';

export default function ConfirmPickupScreen() {
  const router = useRouter();
  const destination = useRideStore((s) => s.destination);
  const pickup = useRideStore((s) => s.pickup);
  const setPickup = useRideStore((s) => s.setPickup);
  const routeGeoJSON = useRideStore((s) => s.routeGeoJSON);
  const setRouteDetails = useRideStore((s) => s.setRouteDetails);
  const requestType = useRideStore((s) => s.requestType);
  const scheduledPickupAt = useRideStore((s) => s.scheduledPickupAt);
  const setRequestType = useRideStore((s) => s.setRequestType);
  const setScheduledPickupAt = useRideStore((s) => s.setScheduledPickupAt);
  const [scheduledDate, setScheduledDate] = useState(() => getInitialScheduleDate(scheduledPickupAt));
  const [pickerMode, setPickerMode] = useState<'date' | 'time'>('date');
  const [showPicker, setShowPicker] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [mapKey, setMapKey] = useState(0);
  const [isLocating, setIsLocating] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadRoute = async () => {
      if (!pickup?.latitude || !pickup?.longitude || !destination?.latitude || !destination?.longitude) return;

      const route = await fetchRoute(pickup.longitude, pickup.latitude, destination.longitude, destination.latitude);
      if (!cancelled && route) {
        setRouteDetails(route.distanceKm, route.durationMinutes, route.geometry);
      }
    };

    loadRoute();
    return () => {
      cancelled = true;
    };
  }, [
    pickup?.latitude,
    pickup?.longitude,
    destination?.latitude,
    destination?.longitude,
    setRouteDetails,
  ]);

  const handleUseCurrentLocation = async () => {
    if (isLocating) return;

    setIsLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Location permission needed', 'Allow location access to use your current pickup location.');
        return;
      }

      const loc = await Location.getCurrentPositionAsync({});
      const [lon, lat] = [loc.coords.longitude, loc.coords.latitude];
      const current = await geocodeReverse(lon, lat);

      setPickup(
        current || {
          label: 'Current location',
          address: 'Current location',
          latitude: lat,
          longitude: lon,
          cityId: ACTIVE_CITY.id,
        }
      );
      setMapKey((key) => key + 1);
    } catch {
      Alert.alert('Location unavailable', 'We could not get your current location. Please try again.');
    } finally {
      setIsLocating(false);
    }
  };

  const openDatePicker = () => {
    setRequestType('scheduled');
    setPickerMode('date');
    setShowPicker(true);
  };

  const openTimePicker = () => {
    setRequestType('scheduled');
    setPickerMode('time');
    setShowPicker(true);
  };

  const handlePickerChange = (event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === 'android') {
      setShowPicker(false);
    }

    if (event.type === 'dismissed' || !selected) return;

    const next = new Date(scheduledDate);
    if (pickerMode === 'date') {
      next.setFullYear(selected.getFullYear(), selected.getMonth(), selected.getDate());
      setScheduledDate(next);
      setScheduledPickupAt(next.toISOString());

      if (Platform.OS === 'android') {
        setTimeout(() => {
          setPickerMode('time');
          setShowPicker(true);
        }, 250);
      }
      return;
    }

    next.setHours(selected.getHours(), selected.getMinutes(), 0, 0);
    setScheduledDate(next);
    setScheduledPickupAt(next.toISOString());
  };

  const handleConfirmPickup = () => {
    if (requestType === 'scheduled') {
      if (scheduledDate.getTime() <= Date.now()) {
        Alert.alert('Invalid schedule', 'Scheduled pickup time must be in the future.');
        return;
      }

      setScheduledPickupAt(scheduledDate.toISOString());
    } else {
      setScheduledPickupAt(null);
    }

    router.push('/(ride)/ride-options');
  };

  return (
    <View style={styles.container}>
      {/* Map area */}
      <View style={styles.mapArea}>
        <VeloMap 
          key={mapKey}
          style={StyleSheet.absoluteFillObject}
          centerCoordinate={pickup?.longitude && pickup?.latitude ? [pickup.longitude, pickup.latitude] : ACTIVE_CITY.center}
          pickupCoordinate={pickup?.longitude && pickup?.latitude ? [pickup.longitude, pickup.latitude] : undefined}
          destinationCoordinate={destination?.longitude && destination?.latitude ? [destination.longitude, destination.latitude] : undefined}
          routeGeoJSON={routeGeoJSON}
          showsUserLocation={true}
        />

        {/* Top bar */}
        <View style={styles.topBar}>
          <BackButton onPress={() => router.back()} />
          <TouchableOpacity style={styles.myLocBtn} activeOpacity={0.7} onPress={handleUseCurrentLocation}>
            {isLocating ? (
              <ActivityIndicator size="small" color={T.text} />
            ) : (
              <Ionicons name="locate" size={18} color={T.text} />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Bottom sheet */}
      <View style={styles.sheet}>
        <View style={styles.handle} />
        <Text style={styles.title}>Confirm pickup</Text>
        <Text style={styles.subtitle}>Review your route. Use back to change typed locations, or the locate button for current pickup.</Text>

        <View style={styles.addressBox}>
          <View style={[styles.addressDot, { backgroundColor: T.blue }]} />
          <View style={{ flex: 1 }}>
            <Text style={styles.addressLabel}>Pickup location</Text>
            <Text style={styles.addressText} numberOfLines={1}>{pickup?.label || ACTIVE_CITY.name}</Text>
          </View>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() =>
              router.push({
                pathname: '/(ride)/search',
                params: { edit: 'pickup', returnToConfirm: '1' },
              })
            }
          >
            <Ionicons name="pencil-outline" size={16} color={T.text3} />
          </TouchableOpacity>
        </View>

        {destination && (
          <View style={[styles.addressBox, { marginTop: 8 }]}>
            <View style={[styles.addressDot, { backgroundColor: T.primary, borderRadius: 2 }]} />
            <View style={{ flex: 1 }}>
              <Text style={styles.addressLabel}>Destination</Text>
              <Text style={styles.addressText}>{destination.label}</Text>
            </View>
          </View>
        )}

        <View style={styles.scheduleBox}>
          <Text style={styles.scheduleTitle}>Pickup time</Text>
          <View style={styles.scheduleToggle}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setRequestType('now')}
              style={[styles.scheduleToggleBtn, requestType === 'now' && styles.scheduleToggleActive]}
            >
              <Ionicons name="flash-outline" size={16} color={requestType === 'now' ? T.white : T.text3} />
              <Text style={[styles.scheduleToggleText, requestType === 'now' && styles.scheduleToggleTextActive]}>Now</Text>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={openDatePicker}
              style={[styles.scheduleToggleBtn, requestType === 'scheduled' && styles.scheduleToggleActive]}
            >
              <Ionicons name="calendar-outline" size={16} color={requestType === 'scheduled' ? T.white : T.text3} />
              <Text style={[styles.scheduleToggleText, requestType === 'scheduled' && styles.scheduleToggleTextActive]}>Schedule</Text>
            </TouchableOpacity>
          </View>

          {requestType === 'scheduled' && (
            <View style={styles.scheduleDetails}>
              <TouchableOpacity activeOpacity={0.85} onPress={openDatePicker} style={styles.scheduledCard}>
                <View style={styles.scheduledIcon}>
                  <Ionicons name="calendar-outline" size={18} color={T.green} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.scheduledLabel}>Scheduled pickup</Text>
                  <Text style={styles.scheduledValue}>{formatSchedule(scheduledDate)}</Text>
                  <Text style={styles.scheduledCountdown}>{formatCountdown(scheduledDate.getTime() - now)}</Text>
                </View>
                <TouchableOpacity onPress={openTimePicker} activeOpacity={0.75} style={styles.editScheduleBtn}>
                  <Ionicons name="time-outline" size={16} color={T.text2} />
                  <Text style={styles.editScheduleText}>Edit</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {showPicker && (
          <DateTimePicker
            value={scheduledDate}
            mode={pickerMode}
            display={Platform.OS === 'android' ? 'default' : 'spinner'}
            minimumDate={new Date()}
            onChange={handlePickerChange}
          />
        )}

        <Button variant="primary" size="lg" fullWidth onPress={handleConfirmPickup} style={{ marginTop: 20 }}>
          Confirm pickup
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.white },
  mapArea: { flex: 1, backgroundColor: '#E8F0FE', position: 'relative', alignItems: 'center', justifyContent: 'center' },
  pinOverlay: { position: 'absolute', alignItems: 'center', justifyContent: 'center', zIndex: 10, marginTop: -32 },
  pin: { zIndex: 2 },
  pinShadow: { width: 12, height: 4, borderRadius: 6, backgroundColor: 'rgba(0,0,0,0.15)', marginTop: -4 },
  topBar: { position: 'absolute', top: 54, left: 20, right: 20, flexDirection: 'row', justifyContent: 'space-between' },
  myLocBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: T.white, alignItems: 'center', justifyContent: 'center', ...shadows.sm },
  sheet: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 36, backgroundColor: T.white, borderTopLeftRadius: 28, borderTopRightRadius: 28, ...shadows.sheet },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: T.gray300, alignSelf: 'center', marginBottom: 16 },
  title: { fontSize: 20, fontWeight: '800', color: T.text, letterSpacing: -0.5, marginBottom: 4, fontFamily: 'Inter_800ExtraBold' },
  subtitle: { fontSize: T.font.md, color: T.text3, marginBottom: 20 },
  addressBox: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: T.gray50, borderRadius: T.radius.md, padding: 14 },
  addressDot: { width: 10, height: 10, borderRadius: 5 },
  addressLabel: { fontSize: T.font.xs, color: T.text4, marginBottom: 2 },
  addressText: { fontSize: T.font.lg, fontWeight: '600', color: T.text },
  scheduleBox: { marginTop: 16, gap: 10 },
  scheduleTitle: { fontSize: T.font.sm, fontWeight: '700', color: T.text3, textTransform: 'uppercase', letterSpacing: 0.4 },
  scheduleToggle: { flexDirection: 'row', gap: 8, backgroundColor: T.gray100, borderRadius: T.radius.md, padding: 4 },
  scheduleToggleBtn: { flex: 1, height: 42, borderRadius: T.radius.sm, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  scheduleToggleActive: { backgroundColor: T.primary },
  scheduleToggleText: { fontSize: T.font.base, fontWeight: '700', color: T.text3 },
  scheduleToggleTextActive: { color: T.white },
  scheduleDetails: { gap: 12 },
  scheduledCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: T.greenLight, borderRadius: T.radius.lg, padding: 14 },
  scheduledIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: T.white, alignItems: 'center', justifyContent: 'center' },
  scheduledLabel: { fontSize: T.font.xs, fontWeight: '700', color: T.green, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 2 },
  scheduledValue: { fontSize: T.font.base, fontWeight: '800', color: T.text },
  scheduledCountdown: { fontSize: T.font.sm, fontWeight: '600', color: T.green, marginTop: 3 },
  editScheduleBtn: { height: 34, borderRadius: T.radius.full, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: T.white },
  editScheduleText: { fontSize: T.font.sm, fontWeight: '700', color: T.text2 },
});

const addHours = (date: Date, hours: number) => {
  const next = new Date(date);
  next.setHours(next.getHours() + hours, 0, 0, 0);
  return next;
};

const getInitialScheduleDate = (isoValue?: string | null) => {
  if (isoValue) {
    const parsed = new Date(isoValue);
    if (!Number.isNaN(parsed.getTime()) && parsed.getTime() > Date.now()) return parsed;
  }

  return addHours(new Date(), 2);
};

const formatSchedule = (date: Date) =>
  date.toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
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
