// ─── Complete Ride Screen ─────────────────────────────────────────────────────
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DT } from '@/src/theme/tokens';

export default function CompleteRideScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 20 },
      ]}
    >
      {/* Success icon */}
      <View style={styles.iconWrap}>
        <View style={styles.iconRing}>
          <Ionicons name="checkmark-circle" size={72} color="#22C55E" />
        </View>
      </View>

      {/* Title */}
      <Text style={styles.title}>Trip Completed</Text>
      <Text style={styles.subtitle}>
        The ride has been marked as completed successfully.
      </Text>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Summary placeholder */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <Ionicons name="checkmark-circle-outline" size={15} color={DT.online} />
          <Text style={styles.summaryText}>Passenger verified and delivered</Text>
        </View>
        <View style={styles.summaryRow}>
          <Ionicons name="flag-outline" size={15} color={DT.textMuted} />
          <Text style={styles.summaryText}>Ride status updated in system</Text>
        </View>
        <View style={styles.summaryRow}>
          <Ionicons name="time-outline" size={15} color={DT.textMuted} />
          <Text style={styles.summaryText}>
            Completed at {new Date().toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
          </Text>
        </View>
      </View>

      <View style={{ flex: 1 }} />

      {/* Report issue */}
      <TouchableOpacity
        style={styles.reportLink}
        onPress={() => router.push('/(trip)/report-issue')}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel="Report an issue with this ride"
      >
        <Ionicons name="flag-outline" size={14} color={DT.textFaint} />
        <Text style={styles.reportLinkText}>Report an issue with this ride</Text>
      </TouchableOpacity>

      {/* Done CTA */}
      <TouchableOpacity
        style={styles.doneBtn}
        onPress={() => router.replace('/(tabs)/home')}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel="Back to home"
      >
        <Text style={styles.doneBtnText}>Back to Home</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DT.bg,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  iconWrap: {
    marginTop: 32,
    marginBottom: 24,
  },
  iconRing: {
    width: 120,
    height: 120,
    borderRadius: 36,
    backgroundColor: 'rgba(34,197,94,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    fontFamily: 'Inter_800ExtraBold',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: DT.textMuted,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    lineHeight: 22,
  },
  divider: {
    width: '40%',
    height: 1,
    backgroundColor: DT.borderLight,
    marginVertical: 24,
  },
  summaryCard: {
    width: '100%',
    backgroundColor: DT.bgCard,
    borderWidth: 1,
    borderColor: DT.border,
    borderRadius: 20,
    padding: 16,
    gap: 14,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  summaryText: {
    fontSize: 13,
    color: DT.textMuted,
    fontFamily: 'Inter_400Regular',
    flex: 1,
  },
  reportLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  reportLinkText: {
    fontSize: 12,
    color: DT.textFaint,
    fontFamily: 'Inter_400Regular',
  },
  doneBtn: {
    width: '100%',
    height: 52,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneBtnText: {
    fontSize: 15,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
    color: '#0A0B0F',
  },
});
