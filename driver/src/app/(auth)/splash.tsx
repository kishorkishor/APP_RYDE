// ─── Splash Screen ────────────────────────────────────────────────────────────
import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { DT } from '@/src/theme/tokens';
import { getCurrentDriverProfile, listAssignedRides } from '@/src/services/driverRecords';
import { useDriverAuthStore } from '@/src/store/useDriverAuthStore';
import { useDriverStatusStore } from '@/src/store/useDriverStatusStore';
import { useDriverRideStore } from '@/src/store/useDriverRideStore';
import { getCachedActiveRide } from '@/src/services/rideCache';

const RYDE_LOGO = require('../../../assets/ryde-logo.png');

export default function SplashScreen() {
  const router = useRouter();
  const setProfile = useDriverAuthStore((s) => s.setProfile);
  const setLoading = useDriverAuthStore((s) => s.setLoading);

  const logoScale = useRef(new Animated.Value(0.7)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Entrance animation
    Animated.sequence([
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          stiffness: 160,
          damping: 18,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(taglineOpacity, {
        toValue: 1,
        duration: 400,
        delay: 100,
        useNativeDriver: true,
      }),
    ]).start();

    // Check session in parallel
    const checkSession = async () => {
      try {
        const profile = await getCurrentDriverProfile();
        if (profile) {
          setProfile(profile);
          // Sync online/offline state from persisted Appwrite profile
          const { setOnline, setOffline } = useDriverStatusStore.getState();
          if (profile.isOnline) { setOnline(); } else { setOffline(); }

          // Restore active ride: check cache first, then fall back to API
          let resumed = false;
          try {
            const cached = await getCachedActiveRide();
            if (cached && cached.status !== 'completed' && cached.status !== 'cancelled') {
              useDriverRideStore.getState().setActiveRide(cached);
              resumed = true;
            }
          } catch {}

          if (!resumed) {
            try {
              const rides = await listAssignedRides(profile.id);
              useDriverRideStore.getState().setAssignedRides(rides);
              resumed = !!useDriverRideStore.getState().activeRide;
            } catch {}
          }

          setTimeout(() => {
            if (resumed) {
              router.replace('/(trip)/active-ride');
            } else {
              router.replace('/(tabs)/home');
            }
          }, 600);
        } else {
          setLoading(false);
          setTimeout(() => router.replace('/(auth)/login'), 1200);
        }
      } catch {
        setLoading(false);
        setTimeout(() => router.replace('/(auth)/login'), 1200);
      }
    };

    checkSession();
  }, []);

  return (
    <View style={styles.container}>
      {/* Background glow */}
      <View style={styles.glow} />

      <Animated.View
        style={[
          styles.logoArea,
          { opacity: logoOpacity, transform: [{ scale: logoScale }] },
        ]}
      >
        {/* RYDE logo mark */}
        <Image source={RYDE_LOGO} style={styles.logoMark} resizeMode="contain" />
        <Text style={styles.logoText}>
          RYDE{' '}
          <Text style={styles.logoDriver}>Driver</Text>
        </Text>
      </Animated.View>

      <Animated.Text style={[styles.tagline, { opacity: taglineOpacity }]}>
        Internal Fleet Operations
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DT.bg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  glow: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: 'rgba(59,130,246,0.04)',
    top: '30%',
    left: '50%',
    marginLeft: -160,
  },
  logoArea: {
    alignItems: 'center',
    gap: 12,
  },
  logoMark: {
    width: 96,
    height: 96,
    borderRadius: 24,
  },
  logoText: {
    fontSize: 28,
    fontWeight: '800',
    fontFamily: 'Inter_800ExtraBold',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  logoDriver: {
    color: 'rgba(255,255,255,0.45)',
    fontWeight: '500',
    fontFamily: 'Inter_500Medium',
  },
  tagline: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.3)',
    fontFamily: 'Inter_500Medium',
    letterSpacing: 0.5,
  },
});
