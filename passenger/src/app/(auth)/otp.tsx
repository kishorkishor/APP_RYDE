import { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput as RNTextInput, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { T } from '@/src/theme/tokens';
import { BackButton } from '@/src/components/ui';
import { useAuthStore } from '@/src/store/useAuthStore';
import {
  getReadableErrorMessage,
  sendEmailOtp,
  verifyEmailOtpAndSaveProfile,
  type LoginProfileInput,
} from '@/src/services/appwriteRecords';

const CODE_LENGTH = 6;

export default function OTPScreen() {
  const router = useRouter();
  const {
    email = '',
    passengerName = '',
    projectLeader = '',
    projectCode = '',
    companyName = '',
    number = '',
    otpUserId = '',
    phrase = '',
  } = useLocalSearchParams<{
    email: string;
    passengerName: string;
    projectLeader: string;
    projectCode: string;
    companyName: string;
    number: string;
    otpUserId: string;
    phrase: string;
  }>();
  const [code, setCode] = useState('');
  const [resendTimer, setResendTimer] = useState(30);
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [tokenUserId, setTokenUserId] = useState(otpUserId);
  const [securityPhrase, setSecurityPhrase] = useState(phrase);
  const inputRef = useRef<RNTextInput>(null);
  const setUser = useAuthStore((s) => s.setUser);

  const profile: LoginProfileInput = {
    email: email as string,
    passengerName: passengerName as string,
    projectLeader: projectLeader as string,
    projectCode: projectCode as string,
    companyName: companyName as string,
    number: number as string,
  };

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (resendTimer > 0) {
      const t = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [resendTimer]);

  useEffect(() => {
    if (code.length === CODE_LENGTH && !isVerifying) {
      handleVerifyCode();
    }
  }, [code]);

  const handleVerifyCode = async () => {
    if (!tokenUserId) {
      setErrorMessage('Please request a new code.');
      return;
    }

    setIsVerifying(true);
    setErrorMessage('');
    try {
      const savedProfile = await verifyEmailOtpAndSaveProfile(tokenUserId as string, code, profile);
      setUser({
        id: savedProfile.id,
        email: savedProfile.email,
        phone: savedProfile.number,
        name: savedProfile.passengerName,
        companyName: savedProfile.companyName,
        projectLeader: savedProfile.projectLeader,
        projectCode: savedProfile.projectCode,
      });
      router.replace('/(auth)/location-permission');
    } catch (error) {
      console.error('Failed to verify email OTP', error);
      setCode('');
      setErrorMessage(
        getReadableErrorMessage(error, 'That code did not work. Check the email and try again.')
      );
      inputRef.current?.focus();
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendCode = async () => {
    try {
      const token = await sendEmailOtp(email as string);
      setTokenUserId(token.userId);
      setSecurityPhrase(token.phrase);
      setCode('');
      setErrorMessage('');
      setResendTimer(30);
      inputRef.current?.focus();
    } catch (error) {
      console.error('Failed to resend email OTP', error);
      setErrorMessage(
        getReadableErrorMessage(error, 'We could not resend the code. Please try again.')
      );
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <BackButton onPress={() => router.back()} />
      </View>

      <View style={styles.titleArea}>
        <Text style={styles.title}>Enter verification code</Text>
        <Text style={styles.subtitle}>
          We sent a 6-digit code to{'\n'}
          <Text style={styles.emailText}>{email || 'your email'}</Text>
        </Text>
        {!!securityPhrase && (
          <Text style={styles.phraseText}>Security phrase: {securityPhrase}</Text>
        )}
      </View>

      {/* Code input boxes */}
      <View style={styles.codeRow}>
        {Array.from({ length: CODE_LENGTH }).map((_, i) => {
          const char = code[i] || '';
          const isCurrent = i === code.length;
          return (
            <TouchableOpacity key={i} onPress={() => inputRef.current?.focus()} style={[styles.codeBox, isCurrent && styles.codeBoxActive, char && styles.codeBoxFilled]}>
              <Text style={[styles.codeChar, char && styles.codeCharFilled]}>
                {char || (isCurrent ? '|' : '')}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Hidden input */}
      <RNTextInput
        ref={inputRef}
        value={code}
        onChangeText={(t) => {
          setErrorMessage('');
          setCode(t.replace(/[^0-9]/g, '').slice(0, CODE_LENGTH));
        }}
        keyboardType="number-pad"
        maxLength={CODE_LENGTH}
        editable={!isVerifying}
        style={{ position: 'absolute', opacity: 0 }}
        autoFocus
      />

      {!!errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}
      {isVerifying && <Text style={styles.verifyingText}>Verifying code...</Text>}

      {/* Resend */}
      <View style={styles.resendArea}>
        {resendTimer > 0 ? (
          <Text style={styles.resendText}>Resend code in <Text style={styles.resendTimer}>{resendTimer}s</Text></Text>
        ) : (
          <TouchableOpacity onPress={handleResendCode} activeOpacity={0.7}>
            <Text style={styles.resendLink}>Resend code</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.white },
  topBar: { paddingTop: 54, paddingHorizontal: 20, paddingBottom: 8 },
  titleArea: { paddingHorizontal: 20, marginBottom: 32 },
  title: { fontSize: 28, fontWeight: '800', color: T.text, letterSpacing: -0.5, marginBottom: 8, fontFamily: 'Inter_800ExtraBold' },
  subtitle: { fontSize: T.font.lg, color: T.text3, lineHeight: 22 },
  emailText: { color: T.text, fontWeight: '600' },
  phraseText: { marginTop: 12, fontSize: T.font.md, color: T.text3, fontWeight: '600' },
  codeRow: { flexDirection: 'row', justifyContent: 'center', gap: 10, paddingHorizontal: 20 },
  codeBox: {
    width: 48, height: 56, borderRadius: T.radius.md, backgroundColor: T.gray100,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: 'transparent',
  },
  codeBoxActive: { borderColor: T.primary },
  codeBoxFilled: { backgroundColor: T.gray50, borderColor: T.green },
  codeChar: { fontSize: 22, fontWeight: '700', color: T.text4 },
  codeCharFilled: { color: T.text },
  resendArea: { alignItems: 'center', marginTop: 32 },
  errorText: { marginTop: 18, paddingHorizontal: 24, textAlign: 'center', fontSize: T.font.base, color: T.red, fontWeight: '600' },
  verifyingText: { marginTop: 18, textAlign: 'center', fontSize: T.font.base, color: T.text3, fontWeight: '600' },
  resendText: { fontSize: T.font.base, color: T.text4 },
  resendTimer: { fontWeight: '700', color: T.text2 },
  resendLink: { fontSize: T.font.base, fontWeight: '600', color: T.green },
});
