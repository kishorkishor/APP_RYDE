// ─── Report Issue Screen ──────────────────────────────────────────────────────
import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DT } from '@/src/theme/tokens';
import { useDriverRideStore } from '@/src/store/useDriverRideStore';
import { reportRideIssue } from '@/src/services/driverRecords';
import { useToastStore } from '@/src/store/useToastStore';

const ISSUE_REASONS = [
  'Passenger no-show',
  'Route issue',
  'Vehicle breakdown',
  'Passenger behaviour',
  'Wrong location',
  'Other',
] as const;

export default function ReportIssueScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const activeRide = useDriverRideStore((s) => s.activeRide);

  const [selectedReason, setSelectedReason] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!selectedReason) {
      useToastStore.getState().showToast('Please select an issue reason.', 'warning');
      return;
    }
    setIsSubmitting(true);
    try {
      if (activeRide) {
        await reportRideIssue(activeRide.id, selectedReason, notes);
      }
      useToastStore.getState().showToast('Issue reported. Our team will review it.', 'success');
      router.back();
    } catch {
      useToastStore.getState().showToast('Could not submit issue. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={[styles.container, { paddingTop: insets.top }]}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Ionicons name="arrow-back" size={18} color="#fff" />
          </TouchableOpacity>
          <View>
            <Text style={styles.title}>Report Issue</Text>
            <Text style={styles.subtitle}>
              {activeRide ? `Ride · ${activeRide.passengerName}` : 'Report a problem'}
            </Text>
          </View>
        </View>

        {/* Reason selection */}
        <Text style={styles.sectionLabel}>What happened?</Text>
        <View style={styles.reasonGrid}>
          {ISSUE_REASONS.map((reason) => (
            <TouchableOpacity
              key={reason}
              style={[
                styles.reasonBtn,
                selectedReason === reason && styles.reasonBtnSelected,
              ]}
              onPress={() => setSelectedReason(reason)}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={reason}
              accessibilityState={{ selected: selectedReason === reason }}
            >
              <Text
                style={[
                  styles.reasonText,
                  selectedReason === reason && styles.reasonTextSelected,
                ]}
              >
                {reason}
              </Text>
              {selectedReason === reason && (
                <Ionicons name="checkmark-circle" size={14} color="#22C55E" />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Notes */}
        <Text style={styles.sectionLabel}>Additional notes (optional)</Text>
        <TextInput
          style={styles.notesInput}
          value={notes}
          onChangeText={setNotes}
          placeholder="Describe the issue in more detail..."
          placeholderTextColor={DT.textFaint}
          multiline
          numberOfLines={5}
          textAlignVertical="top"
        />

        {/* Submit */}
        <TouchableOpacity
          style={[
            styles.submitBtn,
            (!selectedReason || isSubmitting) && styles.submitBtnDisabled,
          ]}
          onPress={handleSubmit}
          disabled={!selectedReason || isSubmitting}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Submit report"
          accessibilityState={{ disabled: !selectedReason || isSubmitting }}
        >
          <Ionicons name="send" size={16} color="#fff" />
          <Text style={styles.submitBtnText}>
            {isSubmitting ? 'Submitting...' : 'Submit Report'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: DT.bg },
  content: { padding: 20, paddingBottom: 40, gap: 16 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: DT.bgCard,
    borderWidth: 1,
    borderColor: DT.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 12,
    color: DT.textMuted,
    fontFamily: 'Inter_400Regular',
    marginTop: 2,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
    color: DT.textLabel,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  reasonGrid: { gap: 8 },
  reasonBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderRadius: 14,
    backgroundColor: DT.bgCard,
    borderWidth: 1,
    borderColor: DT.border,
  },
  reasonBtnSelected: {
    backgroundColor: 'rgba(34,197,94,0.08)',
    borderColor: 'rgba(34,197,94,0.3)',
  },
  reasonText: {
    fontSize: 14,
    color: DT.textMuted,
    fontFamily: 'Inter_400Regular',
  },
  reasonTextSelected: {
    color: '#FFFFFF',
    fontFamily: 'Inter_600SemiBold',
  },
  notesInput: {
    backgroundColor: DT.bgCard,
    borderWidth: 1,
    borderColor: DT.border,
    borderRadius: 14,
    padding: 14,
    height: 120,
    color: '#FFFFFF',
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#22C55E',
    marginTop: 8,
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  submitBtnDisabled: { opacity: 0.5 },
  submitBtnText: {
    fontSize: 15,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
    color: '#FFFFFF',
  },
});
