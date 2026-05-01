import { useState } from 'react';
import { ActivityIndicator, Alert, Image, View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { T, shadows } from '@/src/theme/tokens';
import { Avatar, Chip, Divider, SectionHeader } from '@/src/components/ui';
import { USER_PROFILE, RECENT_PLACES } from '@/src/data/sampleData';
import { useAuthStore } from '@/src/store/useAuthStore';
import { useRideStore } from '@/src/store/useRideStore';
import VeloMap from '@/src/components/map/VeloMap';
import { ACTIVE_CITY } from '@/src/config/city';
import { geocodeReverse } from '@/src/services/geocoding';

export default function HomeScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const setPickup = useRideStore((s) => s.setPickup);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>(ACTIVE_CITY.center);
  const [address, setAddress] = useState(ACTIVE_CITY.name);
  const [mapKey, setMapKey] = useState(0);
  const [isLocating, setIsLocating] = useState(false);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  const handleUseCurrentLocation = async () => {
    if (isLocating) return;

    setIsLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Location permission needed', 'Allow location access to move the map to your current position.');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({});
      const center: [number, number] = [loc.coords.longitude, loc.coords.latitude];
      const current = await geocodeReverse(center[0], center[1]);

      setLocation(loc);
      setMapCenter(center);
      setMapKey((key) => key + 1);
      setAddress(current?.label || 'Current location');
      setPickup(
        current || {
          label: 'Current location',
          address: 'Current location',
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
          cityId: ACTIVE_CITY.id,
        }
      );
    } catch {
      Alert.alert('Location unavailable', 'We could not get your current location. Please try again.');
    } finally {
      setIsLocating(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.mapArea}>
        <VeloMap
          key={mapKey}
          style={StyleSheet.absoluteFillObject}
          centerCoordinate={mapCenter}
          currentLocationCoordinate={location ? [location.coords.longitude, location.coords.latitude] : undefined}
          showsUserLocation={!!location}
        />

        <View style={styles.topBar}>
          <View style={styles.logoRow}>
            <View style={styles.logoBadge}>
              <Image source={require('../../../assets/ryde-logo.png')} style={styles.logoImage} resizeMode="contain" />
            </View>
            <Text style={styles.brandText}>RYDE</Text>
          </View>
          <View style={styles.topRight}>
            <TouchableOpacity style={styles.bellBtn} activeOpacity={0.7}>
              <Ionicons name="notifications-outline" size={17} color={T.text} />
              <View style={styles.bellDot} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/(tabs)/profile')} activeOpacity={0.7}>
              <Avatar initials={USER_PROFILE.initials} bg={USER_PROFILE.avatarBg} size={38} style={shadows.sm} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.locationChip}>
          <Chip variant="default" style={{ backgroundColor: T.white, ...shadows.sm }}>
            Map area: {address}
          </Chip>
        </View>

        <TouchableOpacity style={styles.locateBtn} activeOpacity={0.82} onPress={handleUseCurrentLocation}>
          {isLocating ? (
            <ActivityIndicator size="small" color={T.text} />
          ) : (
            <Ionicons name="locate" size={19} color={T.text} />
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.sheet}>
        <View style={styles.handle} />
        <ScrollView contentContainerStyle={styles.sheetContent} showsVerticalScrollIndicator={false}>
          <View style={{ marginBottom: 16 }}>
            <Text style={styles.greetingSub}>{greeting},</Text>
            <Text style={styles.greetingName}>{(user?.name || USER_PROFILE.name).split(' ')[0]}</Text>
          </View>

          <TouchableOpacity onPress={() => router.push('/(ride)/search')} activeOpacity={0.9} style={styles.searchBar}>
            <View style={styles.searchIcon}>
              <Ionicons name="search" size={16} color={T.white} />
            </View>
            <Text style={styles.searchPlaceholder}>Where to?</Text>
            <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.4)" />
          </TouchableOpacity>

          <View style={styles.shortcutsRow}>
            {[
              { label: 'Home', icon: 'home-outline' as const, color: T.blue, bg: T.blueLight },
              { label: 'Work', icon: 'briefcase-outline' as const, color: T.amber, bg: T.amberLight },
            ].map((item) => (
              <TouchableOpacity key={item.label} onPress={() => router.push('/(ride)/search')} activeOpacity={0.8} style={styles.shortcutBtn}>
                <View style={[styles.shortcutIcon, { backgroundColor: item.bg }]}>
                  <Ionicons name={item.icon} size={15} color={item.color} />
                </View>
                <Text style={styles.shortcutLabel}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Divider style={{ marginBottom: 16 }} />

          <SectionHeader style={{ marginBottom: 8 }}>Recent trips</SectionHeader>
          {RECENT_PLACES.slice(0, 3).map((place, i) => (
            <TouchableOpacity key={i} onPress={() => router.push('/(ride)/search')} activeOpacity={0.7} style={styles.recentRow}>
              <View style={styles.recentIcon}>
                <Ionicons name="time-outline" size={16} color={T.text3} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.recentName}>{place.label}</Text>
                <Text style={styles.recentAddr} numberOfLines={1}>
                  {place.address}
                </Text>
              </View>
              <Text style={styles.recentDist}>{place.distanceKm} km</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.white },
  mapArea: { height: '52%', backgroundColor: '#E8F0FE', position: 'relative' },
  topBar: {
    position: 'absolute',
    top: 14,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  logoBadge: { width: 32, height: 32, borderRadius: 10, backgroundColor: '#121212', overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  logoImage: { width: 32, height: 32 },
  brandText: { fontSize: 16, fontWeight: '800', color: T.text, letterSpacing: -0.5 },
  topRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  bellBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: T.white, alignItems: 'center', justifyContent: 'center', ...shadows.sm },
  bellDot: { position: 'absolute', top: 7, right: 7, width: 8, height: 8, borderRadius: 4, backgroundColor: '#DC2626', borderWidth: 1.5, borderColor: T.white },
  locationChip: { position: 'absolute', bottom: 16, alignSelf: 'center' },
  locateBtn: { position: 'absolute', right: 20, bottom: 64, width: 44, height: 44, borderRadius: 22, backgroundColor: T.white, alignItems: 'center', justifyContent: 'center', ...shadows.md },
  sheet: { flex: 1, backgroundColor: T.white, borderTopLeftRadius: 28, borderTopRightRadius: 28, marginTop: -20, ...shadows.sheet },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: T.gray300, alignSelf: 'center', marginTop: 12 },
  sheetContent: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20 },
  greetingSub: { fontSize: T.font.md, color: T.text3, marginBottom: 2 },
  greetingName: { fontSize: 20, fontWeight: '800', color: T.text, letterSpacing: -0.5, fontFamily: 'Inter_800ExtraBold' },
  searchBar: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: T.primary, borderRadius: 18, height: 58, paddingHorizontal: 16, marginBottom: 16, ...shadows.md },
  searchIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
  searchPlaceholder: { flex: 1, fontSize: T.font.lg, fontWeight: '500', color: 'rgba(255,255,255,0.7)' },
  shortcutsRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  shortcutBtn: { flex: 1, height: 52, backgroundColor: T.gray100, borderRadius: T.radius.lg, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12 },
  shortcutIcon: { width: 30, height: 30, borderRadius: T.radius.sm, alignItems: 'center', justifyContent: 'center' },
  shortcutLabel: { fontSize: T.font.md, fontWeight: '600', color: T.text },
  recentRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 11, borderRadius: T.radius.md },
  recentIcon: { width: 38, height: 38, borderRadius: T.radius.md, backgroundColor: T.gray100, alignItems: 'center', justifyContent: 'center' },
  recentName: { fontSize: T.font.base, fontWeight: '600', color: T.text },
  recentAddr: { fontSize: T.font.sm, color: T.text3, marginTop: 1 },
  recentDist: { fontSize: T.font.sm, color: T.text4 },
});
