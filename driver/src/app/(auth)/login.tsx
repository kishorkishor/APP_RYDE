// ─── Login Screen ─────────────────────────────────────────────────────────────
import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { DT } from '@/src/theme/tokens';
import { TextInput, Button } from '@/src/components/ui';
import {
  clearCurrentSession,
  getReadableErrorMessage,
  normalizeEmail,
  sendEmailOtp,
} from '@/src/services/driverRecords';
import { useDriverAuthStore } from '@/src/store/useDriverAuthStore';

const RYDE_LOGO = require('../../../assets/ryde-logo.png');

export default function LoginScreen() {
  const router = useRouter();
  const setOtpPending = useDriverAuthStore((s) => s.setOtpPending);

  const [email, setEmail] = useState('');
  const [isSending, setIsSending] = useState(false);

  const normalizedEmail = normalizeEmail(email);
  const isValid =
    normalizedEmail.includes('@') && normalizedEmail.includes('.');

  const handleSendCode = async () => {
    if (!isValid || isSending) return;
    setIsSending(true);
    try {
      await clearCurrentSession();
      const token = await sendEmailOtp(normalizedEmail);
      setOtpPending(token.userId, token.phrase);
      router.push({
        pathname: '/(auth)/otp',
        params: { email: normalizedEmail, otpUserId: token.userId, phrase: token.phrase },
      });
    } catch (error) {
      Alert.alert(
        'Code not sent',
        getReadableErrorMessage(
          error,
          'Could not send verification code. Check your email and try again.'
        )
      );
    } finally {
      setIsSending(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Background glow */}
        <View style={styles.glowTopRight} pointerEvents="none" />

        {/* Logo */}
        <View style={styles.logo}>
          <Image source={RYDE_LOGO} style={styles.logoMark} resizeMode="contain" />
          <Text style={styles.logoText}>
            RYDE <Text style={styles.logoDriver}>Driver</Text>
          </Text>
        </View>

        {/* Title */}
        <View style={styles.titleArea}>
          <Text style={styles.title}>Welcome back</Text>
          <Text style={styles.subtitle}>
            Sign in with your registered email to continue.
          </Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <TextInput
            label="Email Address"
            placeholder="driver@company.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            icon={
              <Ionicons
                name="mail-outline"
                size={18}
                color="rgba(255,255,255,0.3)"
              />
            }
          />
        </View>

        {/* OTP notice */}
        <View style={styles.noticeBox}>
          <Ionicons
            name="information-circle-outline"
            size={15}
            color="rgba(255,255,255,0.35)"
          />
          <Text style={styles.noticeText}>
            A one-time code will be sent to your email. No password needed.
          </Text>
        </View>

        {/* CTA */}
        <View style={styles.ctaArea}>
          <Button
            variant="primary"
            fullWidth
            onPress={handleSendCode}
            disabled={!isValid || isSending}
            loading={isSending}
            icon={
              <Ionicons name="mail-outline" size={18} color="#0A0B0F" />
            }
          >
            {isSending ? 'Sending code...' : 'Send verification code'}
          </Button>
        </View>

        {/* Terms */}
        <Text style={styles.terms}>
          By signing in, you confirm you are an authorized RYDE driver.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DT.bg,
  },
  content: {
    flexGrow: 1,
    paddingBottom: 48,
  },
  glowTopRight: {
    position: 'absolute',
    top: -60,
    right: -60,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(59,130,246,0.04)',
  },
  logo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 64 : 48,
    marginBottom: 40,
  },
  logoMark: {
    width: 42,
    height: 42,
    borderRadius: 12,
  },
  logoText: {
    fontSize: 20,
    fontWeight: '800',
    fontFamily: 'Inter_800ExtraBold',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  logoDriver: {
    color: 'rgba(255,255,255,0.4)',
    fontWeight: '500',
    fontFamily: 'Inter_500Medium',
  },
  titleArea: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    fontFamily: 'Inter_800ExtraBold',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.45)',
    fontFamily: 'Inter_400Regular',
    lineHeight: 21,
  },
  form: {
    paddingHorizontal: 24,
    gap: 16,
    marginBottom: 16,
  },
  noticeBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginHorizontal: 24,
    padding: 12,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: DT.borderLight,
    borderRadius: 12,
    marginBottom: 32,
  },
  noticeText: {
    flex: 1,
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
    fontFamily: 'Inter_400Regular',
    lineHeight: 18,
  },
  ctaArea: {
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  terms: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.25)',
    textAlign: 'center',
    fontFamily: 'Inter_400Regular',
    paddingHorizontal: 24,
    lineHeight: 16,
  },
});
