// ─── OTP Verification Screen ──────────────────────────────────────────────────
import { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { DT } from '@/src/theme/tokens';
import { Button } from '@/src/components/ui';
import {
  verifyEmailOtpAndUpsertDriverProfile,
  getReadableErrorMessage,
} from '@/src/services/driverRecords';
import { useDriverAuthStore } from '@/src/store/useDriverAuthStore';

const CODE_LENGTH = 6;

export default function OtpScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    email: string;
    otpUserId: string;
    phrase: string;
  }>();

  const setProfile = useDriverAuthStore((s) => s.setProfile);
  const clearOtp = useDriverAuthStore((s) => s.clearOtp);

  const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(''));
  const [isVerifying, setIsVerifying] = useState(false);
  const [phraseVisible, setPhraseVisible] = useState(true);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  const email = params.email || '';
  const otpUserId = params.otpUserId || '';
  const phrase = params.phrase || '';
  const code = digits.join('');

  useEffect(() => {
    // Auto-hide phrase hint after 4 seconds
    const t = setTimeout(() => setPhraseVisible(false), 4000);
    return () => clearTimeout(t);
  }, []);

  const handleDigitChange = (text: string, index: number) => {
    const cleaned = text.replace(/[^0-9]/g, '').slice(-1);
    const newDigits = [...digits];
    newDigits[index] = cleaned;
    setDigits(newDigits);

    if (cleaned && index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
    // Auto-verify when all digits filled
    if (newDigits.every((d) => d !== '') && newDigits.join('').length === CODE_LENGTH) {
      handleVerify(newDigits.join(''));
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async (overrideCode?: string) => {
    const codeToVerify = overrideCode || code;
    if (codeToVerify.length < CODE_LENGTH || isVerifying) return;
    setIsVerifying(true);
    try {
      const profile = await verifyEmailOtpAndUpsertDriverProfile(
        otpUserId,
        codeToVerify,
        { email }
      );
      clearOtp();
      setProfile(profile);
      router.replace('/(auth)/permissions');
    } catch (error) {
      Alert.alert(
        'Verification failed',
        getReadableErrorMessage(
          error,
          'The code is incorrect or has expired. Please try again.'
        )
      );
      setDigits(Array(CODE_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
    } finally {
      setIsVerifying(false);
    }
  };

  const maskedEmail =
    email.length > 4
      ? `${email.slice(0, 2)}***@${email.split('@')[1] || ''}`
      : email;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.container}>
        {/* Back */}
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={20} color="rgba(255,255,255,0.7)" />
        </TouchableOpacity>

        <View style={styles.body}>
          {/* Icon */}
          <View style={styles.iconWrap}>
            <Ionicons name="mail" size={28} color="#3B82F6" />
          </View>

          <Text style={styles.title}>Check your email</Text>
          <Text style={styles.subtitle}>
            We sent a 6-digit code to{'\n'}
            <Text style={styles.emailHighlight}>{maskedEmail}</Text>
          </Text>

          {/* Phrase hint */}
          {phrase && phraseVisible && (
            <View style={styles.phraseBox}>
              <Ionicons
                name="key-outline"
                size={13}
                color={DT.assignedText}
              />
              <Text style={styles.phraseText}>
                Security phrase:{' '}
                <Text style={styles.phraseValue}>{phrase}</Text>
              </Text>
            </View>
          )}

          {/* Code inputs */}
          <View style={styles.codeRow}>
            {digits.map((digit, i) => (
              <TextInput
                key={i}
                ref={(ref) => {
                  inputRefs.current[i] = ref;
                }}
                style={[
                  styles.codeInput,
                  digit ? styles.codeInputFilled : null,
                ]}
                value={digit}
                onChangeText={(t) => handleDigitChange(t, i)}
                onKeyPress={({ nativeEvent }) =>
                  handleKeyPress(nativeEvent.key, i)
                }
                keyboardType="number-pad"
                maxLength={1}
                selectionColor="#3B82F6"
              />
            ))}
          </View>

          {/* Verify button */}
          <Button
            variant="primary"
            fullWidth
            onPress={() => handleVerify()}
            disabled={code.length < CODE_LENGTH || isVerifying}
            loading={isVerifying}
          >
            {isVerifying ? 'Verifying...' : 'Verify & Sign in'}
          </Button>

          <TouchableOpacity
            style={styles.resendBtn}
            onPress={() => router.back()}
          >
            <Text style={styles.resendText}>
              Didn't receive a code?{' '}
              <Text style={styles.resendLink}>Resend</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DT.bg,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
  },
  backBtn: {
    marginLeft: 20,
    marginBottom: 8,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: DT.bgCard,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: DT.border,
  },
  body: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
    gap: 20,
  },
  iconWrap: {
    width: 60,
    height: 60,
    borderRadius: 18,
    backgroundColor: DT.assignedBg,
    borderWidth: 1,
    borderColor: DT.assignedBorder,
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
  emailHighlight: {
    color: '#93C5FD',
    fontFamily: 'Inter_600SemiBold',
  },
  phraseBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: DT.assignedBg,
    borderWidth: 1,
    borderColor: DT.assignedBorder,
    borderRadius: 12,
  },
  phraseText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    fontFamily: 'Inter_400Regular',
  },
  phraseValue: {
    color: DT.assignedText,
    fontFamily: 'Inter_700Bold',
  },
  codeRow: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'center',
    marginVertical: 8,
  },
  codeInput: {
    width: 46,
    height: 56,
    borderRadius: 14,
    backgroundColor: DT.bgCard,
    borderWidth: 1,
    borderColor: DT.border,
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
    color: '#FFFFFF',
  },
  codeInputFilled: {
    borderColor: '#3B82F6',
    backgroundColor: DT.assignedBg,
  },
  resendBtn: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  resendText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.35)',
    fontFamily: 'Inter_400Regular',
  },
  resendLink: {
    color: '#93C5FD',
    fontFamily: 'Inter_600SemiBold',
  },
});
