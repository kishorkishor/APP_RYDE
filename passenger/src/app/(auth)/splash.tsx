import { useEffect } from 'react';
import { Image, View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withDelay, withSpring, withRepeat, withSequence } from 'react-native-reanimated';
import { T } from '@/src/theme/tokens';
import { getCurrentAuthProfile } from '@/src/services/appwriteRecords';
import { useAuthStore } from '@/src/store/useAuthStore';

export default function SplashScreen() {
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);
  const logoScale = useSharedValue(0.6);
  const logoOpacity = useSharedValue(0);
  const titleY = useSharedValue(12);
  const titleOpacity = useSharedValue(0);
  const tagY = useSharedValue(8);
  const tagOpacity = useSharedValue(0);

  useEffect(() => {
    logoScale.value = withSpring(1, { damping: 12, stiffness: 150 });
    logoOpacity.value = withTiming(1, { duration: 600 });
    titleY.value = withDelay(300, withTiming(0, { duration: 500 }));
    titleOpacity.value = withDelay(300, withTiming(1, { duration: 500 }));
    tagY.value = withDelay(500, withTiming(0, { duration: 500 }));
    tagOpacity.value = withDelay(500, withTiming(1, { duration: 500 }));

    let mounted = true;
    const timer = setTimeout(async () => {
      const profile = await getCurrentAuthProfile();
      if (!mounted) return;

      if (profile) {
        setUser({
          id: profile.id,
          email: profile.email,
          phone: profile.number,
          name: profile.passengerName,
          companyName: profile.companyName,
          projectLeader: profile.projectLeader,
          projectCode: profile.projectCode,
        });
        router.replace('/(tabs)/home');
      } else {
        router.replace('/(auth)/login');
      }
    }, 2600);
    return () => {
      mounted = false;
      clearTimeout(timer);
    };
  }, []);

  const logoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoScale.value }],
    opacity: logoOpacity.value,
  }));

  const titleStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: titleY.value }],
    opacity: titleOpacity.value,
  }));

  const tagStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: tagY.value }],
    opacity: tagOpacity.value,
  }));

  return (
    <LinearGradient colors={['#090909', '#17130B']} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }} style={styles.container}>
      {/* Ambient glow */}
      <View style={styles.glow} />

      {/* Logo */}
      <Animated.View style={[styles.logoWrap, logoStyle]}>
        <Image source={require('../../../assets/ryde-logo.png')} style={styles.logoImage} resizeMode="contain" />
      </Animated.View>

      {/* Brand */}
      <Animated.View style={[{ alignItems: 'center', marginBottom: 10 }, titleStyle]}>
        <Text style={styles.brandName}>RYDE</Text>
      </Animated.View>

      {/* Tagline */}
      <Animated.View style={tagStyle}>
        <Text style={styles.tagline}>ELEVATED CITY TRAVEL</Text>
      </Animated.View>

      {/* Loading dots */}
      <View style={styles.dotsRow}>
        {[0, 1, 2].map((i) => (
          <View key={i} style={[styles.dot, { opacity: i === 1 ? 1 : 0.4 }]} />
        ))}
      </View>

      {/* Version */}
      <Text style={styles.version}>RYDE Premium</Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  glow: { position: 'absolute', top: '30%', width: 320, height: 320, borderRadius: 160, backgroundColor: 'rgba(215,176,89,0.12)' },
  logoWrap: { marginBottom: 28 },
  logoImage: {
    width: 116,
    height: 116,
    borderRadius: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.45,
    shadowRadius: 18,
  },
  brandName: { fontSize: 38, fontWeight: '800', color: T.white, letterSpacing: -1, fontFamily: 'Inter_800ExtraBold' },
  tagline: { fontSize: 14, color: 'rgba(238,207,130,0.62)', letterSpacing: 2, fontWeight: '500' },
  dotsRow: { position: 'absolute', bottom: 80, flexDirection: 'row', gap: 8 },
  dot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: '#D7B059' },
  version: { position: 'absolute', bottom: 50, fontSize: 11, color: 'rgba(255,255,255,0.2)', letterSpacing: 0.5 },
});

