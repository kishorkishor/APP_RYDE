import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { T } from '@/src/theme/tokens';
import { Button } from '@/src/components/ui';
import { useAuthStore } from '@/src/store/useAuthStore';
import { Ionicons } from '@expo/vector-icons';

export default function LocationPermissionScreen() {
  const router = useRouter();
  const setLocationPermission = useAuthStore((s) => s.setLocationPermission);

  const handleAllow = async () => {
    // In production: request expo-location permission here
    setLocationPermission(true);
    router.replace('/(tabs)/home');
  };

  return (
    <View style={styles.container}>
      {/* Illustration */}
      <View style={styles.illustrationArea}>
        <View style={styles.iconCircle}>
          <Ionicons name="location" size={48} color={T.green} />
        </View>
        <View style={styles.pulseRing} />
        <View style={styles.pulseRingOuter} />
      </View>

      {/* Content */}
      <View style={styles.contentArea}>
        <Text style={styles.title}>Enable location</Text>
        <Text style={styles.subtitle}>
          RYDE needs your location to find nearby drivers and show your position on the map.
        </Text>

        <View style={styles.permissionItems}>
          {[
            { icon: 'navigate-outline', text: 'Find drivers near you' },
            { icon: 'map-outline', text: 'Show your location on the map' },
            { icon: 'time-outline', text: 'Accurate pickup ETAs' },
          ].map((item, i) => (
            <View key={i} style={styles.permItem}>
              <View style={styles.permIcon}>
                <Ionicons name={item.icon as any} size={18} color={T.green} />
              </View>
              <Text style={styles.permText}>{item.text}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* CTA */}
      <View style={styles.ctaArea}>
        <Button variant="primary" size="lg" fullWidth onPress={handleAllow}
          icon={<Ionicons name="location-outline" size={18} color={T.white} />}>
          Allow location access
        </Button>
        <Button variant="ghost" size="sm" onPress={() => router.replace('/(tabs)/home')}>
          Maybe later
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.white },
  illustrationArea: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  iconCircle: {
    width: 100, height: 100, borderRadius: 50, backgroundColor: T.greenLight,
    alignItems: 'center', justifyContent: 'center', zIndex: 2,
  },
  pulseRing: {
    position: 'absolute', width: 160, height: 160, borderRadius: 80,
    borderWidth: 2, borderColor: 'rgba(22,163,74,0.15)',
  },
  pulseRingOuter: {
    position: 'absolute', width: 220, height: 220, borderRadius: 110,
    borderWidth: 1.5, borderColor: 'rgba(22,163,74,0.08)',
  },
  contentArea: { paddingHorizontal: 24 },
  title: { fontSize: 28, fontWeight: '800', color: T.text, letterSpacing: -0.5, marginBottom: 12, textAlign: 'center', fontFamily: 'Inter_800ExtraBold' },
  subtitle: { fontSize: T.font.lg, color: T.text3, textAlign: 'center', lineHeight: 22, marginBottom: 28 },
  permissionItems: { gap: 16 },
  permItem: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  permIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: T.greenLight, alignItems: 'center', justifyContent: 'center' },
  permText: { fontSize: T.font.lg, fontWeight: '500', color: T.text },
  ctaArea: { paddingHorizontal: 20, paddingBottom: 40, paddingTop: 32, gap: 8, alignItems: 'center' },
});
