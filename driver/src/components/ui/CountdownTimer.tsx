import { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export function useCountdown(targetMs: number) {
  const [remaining, setRemaining] = useState(
    Math.max(0, Math.floor((targetMs - Date.now()) / 1000))
  );
  useEffect(() => {
    if (remaining <= 0) return;
    const t = setInterval(() => {
      setRemaining(Math.max(0, Math.floor((targetMs - Date.now()) / 1000)));
    }, 1000);
    return () => clearInterval(t);
  }, [targetMs]);
  return remaining;
}

export function CountdownBadge({ targetMs }: { targetMs: number }) {
  const sec = useCountdown(targetMs);
  if (sec <= 0) return null;
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return (
    <View style={styles.countdownBadge}>
      <Ionicons name="timer-outline" size={11} color="#38BDF8" />
      <Text style={styles.countdownText}>
        {h > 0 ? `${h}h ` : ''}{m}m {s}s
      </Text>
    </View>
  );
}

export function NextCountdown({ targetMs }: { targetMs: number }) {
  const sec = useCountdown(targetMs);
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return (
    <Text style={styles.nextCountdownText}>
      {m}:{s < 10 ? '0' : ''}{s}
    </Text>
  );
}

const styles = StyleSheet.create({
  countdownBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(56,189,248,0.1)',
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 3,
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  countdownText: {
    fontSize: 11,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
    color: '#38BDF8',
  },
  nextCountdownText: {
    fontSize: 26,
    fontWeight: '800',
    fontFamily: 'Inter_800ExtraBold',
    color: '#38BDF8',
    lineHeight: 30,
  },
});
