import { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { DT } from '@/src/theme/tokens';

type SkeletonVariant = 'ride' | 'schedule' | 'history';

const HEIGHT: Record<SkeletonVariant, number> = {
  ride: 140,
  schedule: 100,
  history: 72,
};

export function SkeletonCard({ variant = 'ride' }: { variant?: SkeletonVariant }) {
  const opacity = useSharedValue(0.4);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 800 }),
        withTiming(0.4, { duration: 800 }),
      ),
      -1,
      false,
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View style={[styles.card, { height: HEIGHT[variant] }, animStyle]}>
      <View style={styles.row}>
        <View style={styles.circle} />
        <View style={styles.col}>
          <View style={[styles.bar, { width: '55%' }]} />
          <View style={[styles.bar, { width: '35%', marginTop: 6 }]} />
        </View>
      </View>
      {variant !== 'history' && (
        <View style={styles.body}>
          <View style={[styles.bar, { width: '80%' }]} />
          <View style={[styles.bar, { width: '60%', marginTop: 6 }]} />
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    backgroundColor: DT.bgCard,
    borderWidth: 1,
    borderColor: DT.borderLight,
    padding: 14,
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  circle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  col: {
    flex: 1,
  },
  bar: {
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  body: {
    paddingTop: 4,
  },
});
