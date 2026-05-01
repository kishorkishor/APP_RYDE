import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Dimensions,
  Keyboard,
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  type LayoutChangeEvent,
} from 'react-native';
import { useRouter } from 'expo-router';
import { T } from '@/src/theme/tokens';
import { Button, TextInput, BackButton } from '@/src/components/ui';
import { Ionicons } from '@expo/vector-icons';
import { clearCurrentSession, getReadableErrorMessage, normalizeEmail, sendEmailOtp } from '@/src/services/appwriteRecords';

type LoginField = 'passengerName' | 'projectLeader' | 'projectCode' | 'companyName' | 'email' | 'number';

export default function LoginScreen() {
  const router = useRouter();
  const scrollRef = useRef<ScrollView | null>(null);
  const activeFieldRef = useRef<LoginField | null>(null);
  const keyboardHeightRef = useRef(0);
  const fieldLayouts = useRef<Record<LoginField, { y: number; height: number }>>({} as Record<LoginField, { y: number; height: number }>);
  const [passengerName, setPassengerName] = useState('');
  const [projectLeader, setProjectLeader] = useState('');
  const [projectCode, setProjectCode] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [number, setNumber] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [keyboardInset, setKeyboardInset] = useState(0);

  const normalizedEmail = normalizeEmail(email);
  const isValid =
    passengerName.trim().length > 1 &&
    projectLeader.trim().length > 1 &&
    projectCode.trim().length > 0 &&
    companyName.trim().length > 1 &&
    normalizedEmail.includes('@') &&
    normalizedEmail.includes('.') &&
    number.trim().length > 5;

  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', (event) => {
      keyboardHeightRef.current = event.endCoordinates.height;
      setKeyboardInset(event.endCoordinates.height);
      if (activeFieldRef.current) {
        scrollToField(activeFieldRef.current, 80);
      }
    });
    const hideSub = Keyboard.addListener('keyboardDidHide', () => {
      keyboardHeightRef.current = 0;
      setKeyboardInset(0);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const handleSendCode = async () => {
    if (!isValid || isSending) return;

    setIsSending(true);
    try {
      await clearCurrentSession();
      const token = await sendEmailOtp(normalizedEmail);
      router.push({
        pathname: '/(auth)/otp',
        params: {
          email: normalizedEmail,
          passengerName: passengerName.trim(),
          projectLeader: projectLeader.trim(),
          projectCode: projectCode.trim(),
          companyName: companyName.trim(),
          number: number.trim(),
          otpUserId: token.userId,
          phrase: token.phrase,
        },
      });
    } catch (error) {
      console.error('Failed to send email OTP', error);
      Alert.alert(
        'Code not sent',
        getReadableErrorMessage(
          error,
          'We could not send the verification code. Please check the email and try again.'
        )
      );
    } finally {
      setIsSending(false);
    }
  };

  const scrollToField = (field: LoginField, delay = 220) => {
    activeFieldRef.current = field;
    setTimeout(() => {
      const layout = fieldLayouts.current[field];
      if (!layout) return;

      const windowHeight = Dimensions.get('window').height;
      const usableHeight = Math.max(320, windowHeight - keyboardHeightRef.current);
      const targetY = layout.y - usableHeight * 0.3;

      scrollRef.current?.scrollTo({
        y: Math.max(0, targetY),
        animated: true,
      });
    }, delay);
  };

  const rememberFieldLayout = (field: LoginField) => (event: LayoutChangeEvent) => {
    fieldLayouts.current[field] = {
      y: event.nativeEvent.layout.y,
      height: event.nativeEvent.layout.height,
    };
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 24 : 0}
    >
      <ScrollView
        ref={scrollRef}
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingBottom: Math.max(140, keyboardInset + 96) }]}
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.topBar}>
          <BackButton onPress={() => router.back()} />
        </View>

        {/* Title */}
        <View style={styles.titleArea}>
          <Text style={styles.title}>Welcome to RYDE</Text>
          <Text style={styles.subtitle}>Enter your details to get started</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <View onLayout={rememberFieldLayout('passengerName')}>
            <TextInput
              label="Passenger Name"
              placeholder="Enter passenger name"
              value={passengerName}
              onChangeText={setPassengerName}
              onFocus={() => scrollToField('passengerName')}
              icon={<Ionicons name="person-outline" size={18} color={T.text4} />}
            />
          </View>
          <View onLayout={rememberFieldLayout('projectLeader')}>
            <TextInput
              label="Project Leader's name"
              placeholder="Enter project leader's name"
              value={projectLeader}
              onChangeText={setProjectLeader}
              onFocus={() => scrollToField('projectLeader')}
              icon={<Ionicons name="people-outline" size={18} color={T.text4} />}
            />
          </View>
          <View onLayout={rememberFieldLayout('projectCode')}>
            <TextInput
              label="Project Code"
              placeholder="Enter project code"
              value={projectCode}
              onChangeText={setProjectCode}
              onFocus={() => scrollToField('projectCode')}
              icon={<Ionicons name="briefcase-outline" size={18} color={T.text4} />}
            />
          </View>
          <View onLayout={rememberFieldLayout('companyName')}>
            <TextInput
              label="Company Name"
              placeholder="Enter company name"
              value={companyName}
              onChangeText={setCompanyName}
              onFocus={() => scrollToField('companyName')}
              icon={<Ionicons name="business-outline" size={18} color={T.text4} />}
            />
          </View>
          <View onLayout={rememberFieldLayout('email')}>
            <TextInput
              label="Email address"
              placeholder="you@example.com"
              value={email}
              onChangeText={setEmail}
              onFocus={() => scrollToField('email')}
              keyboardType="email-address"
              icon={<Ionicons name="mail-outline" size={18} color={T.text4} />}
            />
          </View>
          <View onLayout={rememberFieldLayout('number')}>
            <TextInput
              label="Number"
              placeholder="+1 (555) 000-0000"
              value={number}
              onChangeText={setNumber}
              onFocus={() => scrollToField('number')}
              keyboardType="phone-pad"
              icon={<Ionicons name="call-outline" size={18} color={T.text4} />}
            />
          </View>
        </View>

        {/* CTA */}
        <View style={styles.ctaArea}>
          <Button variant="primary" size="lg" fullWidth onPress={handleSendCode} disabled={!isValid || isSending}
            icon={<Ionicons name="mail-outline" size={18} color={T.white} />}>
            {isSending ? 'Sending code...' : 'Send code to email'}
          </Button>
          <Text style={styles.terms}>
            By continuing, you agree to our{' '}
            <Text style={styles.link}>Terms of Service</Text> and{' '}
            <Text style={styles.link}>Privacy Policy</Text>
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.white },
  content: { flexGrow: 1, paddingBottom: 140 },
  topBar: { paddingTop: 54, paddingHorizontal: 20, paddingBottom: 8 },
  titleArea: { paddingHorizontal: 20, marginBottom: 32 },
  title: { fontSize: 28, fontWeight: '800', color: T.text, letterSpacing: -0.5, marginBottom: 8, fontFamily: 'Inter_800ExtraBold' },
  subtitle: { fontSize: T.font.lg, color: T.text3, lineHeight: 22 },
  form: { paddingHorizontal: 20, gap: 20 },
  ctaArea: { paddingHorizontal: 20, marginTop: 32, gap: 16 },
  terms: { fontSize: T.font.sm, color: T.text4, textAlign: 'center', lineHeight: 18 },
  link: { color: T.text2, fontWeight: '600' },
});
