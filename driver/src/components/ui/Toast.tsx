import { useEffect } from 'react';
import { Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { ToastType } from '@/src/store/useToastStore';

const THEME: Record<ToastType, { bg: string; border: string; icon: keyof typeof Ionicons.glyphMap; color: string }> = {
  error:   { bg: 'rgba(239,68,68,0.15)', border: 'rgba(239,68,68,0.4)', icon: 'alert-circle', color: '#EF4444' },
  success: { bg: 'rgba(34,197,94,0.15)', border: 'rgba(34,197,94,0.4)', icon: 'checkmark-circle', color: '#22C55E' },
  warning: { bg: 'rgba(245,158,11,0.18)', border: 'rgba(245,158,11,0.4)', icon: 'warning', color: '#F59E0B' },
  info:    { bg: 'rgba(59,130,246,0.15)', border: 'rgba(59,130,246,0.4)', icon: 'information-circle', color: '#3B82F6' },
};

type ToastProps = {
  message: string | null;
  type: ToastType;
  visible: boolean;
  onDismiss: () => void;
};

export function Toast({ message, type, visible, onDismiss }: ToastProps) {
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(-120);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      translateY.value = withTiming(0, { duration: 280 });
      opacity.value = withTiming(1, { duration: 280 });
    } else {
      translateY.value = withTiming(-120, { duration: 220 });
      opacity.value = withTiming(0, { duration: 220 }, () => {
        runOnJS(onDismiss)();
      });
    }
  }, [visible]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  if (!message) return null;

  const t = THEME[type];

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.container,
        { top: insets.top + 12, backgroundColor: t.bg, borderColor: t.border },
        animStyle,
      ]}
    >
      <Ionicons name={t.icon} size={18} color={t.color} />
      <Text style={[styles.text, { color: t.color }]} numberOfLines={2}>
        {message}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 9999,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  text: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
});
