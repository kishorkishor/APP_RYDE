// ─── Permissions Screen ───────────────────────────────────────────────────────
import { useState } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { DT } from '@/src/theme/tokens';
import { Button } from '@/src/components/ui';
import { useDriverAuthStore } from '@/src/store/useDriverAuthStore';

type PermissionItem = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  color: string;
  bg: string;
};

const PERMISSIONS: PermissionItem[] = [
  {
    icon: 'location',
    title: 'Location Access',
    description: 'Required for navigation, pickup tracking, and trip routing.',
    color: '#22C55E',
    bg: 'rgba(34,197,94,0.1)',
  },
  {
    icon: 'notifications',
    title: 'Notifications',
    description: 'Receive alerts for new ride assignments and updates.',
    color: '#3B82F6',
    bg: 'rgba(59,130,246,0.1)',
  },
];

export default function PermissionsScreen() {
  const router = useRouter();
  const setLocationPermission = useDriverAuthStore(
    (s) => s.setLocationPermission
  );
  const setOnboardingComplete = useDriverAuthStore(
    (s) => s.setOnboardingComplete
  );
  const [isRequesting, setIsRequesting] = useState(false);

  const handleGrantPermissions = async () => {
    setIsRequesting(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setLocationPermission(status === 'granted');
    } catch {
      setLocationPermission(false);
    } finally {
      setIsRequesting(false);
      setOnboardingComplete();
      router.replace('/(tabs)/home');
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.iconWrap}>
          <Ionicons name="shield-checkmark" size={28} color="#22C55E" />
        </View>
        <Text style={styles.title}>Allow Permissions</Text>
        <Text style={styles.subtitle}>
          RYDE Driver needs the following permissions to work properly.
        </Text>
      </View>

      {/* Permission cards */}
      <View style={styles.cards}>
        {PERMISSIONS.map((perm) => (
          <View key={perm.title} style={styles.card}>
            <View style={[styles.permIcon, { backgroundColor: perm.bg }]}>
              <Ionicons name={perm.icon} size={22} color={perm.color} />
            </View>
            <View style={styles.permText}>
              <Text style={styles.permTitle}>{perm.title}</Text>
              <Text style={styles.permDescription}>{perm.description}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Privacy note */}
      <View style={styles.privacyBox}>
        <Ionicons
          name="lock-closed-outline"
          size={13}
          color="rgba(255,255,255,0.35)"
        />
        <Text style={styles.privacyText}>
          Location data is only used during active trips and is not stored or
          shared externally.
        </Text>
      </View>

      {/* CTA */}
      <View style={styles.ctaArea}>
        <Button
          variant="green"
          fullWidth
          onPress={handleGrantPermissions}
          loading={isRequesting}
          icon={
            <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
          }
        >
          Grant Permissions & Continue
        </Button>
        <Button
          variant="ghost"
          fullWidth
          onPress={() => {
            setOnboardingComplete();
            router.replace('/(tabs)/home');
          }}
        >
          Skip for now
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DT.bg,
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 80 : 60,
    paddingBottom: 40,
    gap: 24,
  },
  header: {
    gap: 12,
  },
  iconWrap: {
    width: 60,
    height: 60,
    borderRadius: 18,
    backgroundColor: 'rgba(34,197,94,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    fontFamily: 'Inter_800ExtraBold',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.45)',
    fontFamily: 'Inter_400Regular',
    lineHeight: 22,
  },
  cards: {
    gap: 12,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: DT.bgCard,
    borderWidth: 1,
    borderColor: DT.border,
    borderRadius: 16,
    padding: 16,
  },
  permIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  permText: {
    flex: 1,
    gap: 4,
  },
  permTitle: {
    fontSize: 15,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
    color: '#FFFFFF',
  },
  permDescription: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.45)',
    fontFamily: 'Inter_400Regular',
    lineHeight: 18,
  },
  privacyBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 12,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: DT.borderLight,
    borderRadius: 12,
  },
  privacyText: {
    flex: 1,
    fontSize: 11,
    color: 'rgba(255,255,255,0.35)',
    fontFamily: 'Inter_400Regular',
    lineHeight: 16,
  },
  ctaArea: {
    marginTop: 'auto',
    gap: 10,
  },
});
