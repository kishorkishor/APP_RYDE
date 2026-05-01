// ─── Root Layout ──────────────────────────────────────────────────────────────
import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
} from '@expo-google-fonts/inter';
import * as SplashScreen from 'expo-splash-screen';
import * as SystemUI from 'expo-system-ui';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet, LogBox } from 'react-native';

// Suppress LogBox warnings and known non-critical errors in dev
if (__DEV__) {
  LogBox.ignoreAllLogs(true);

  // Suppress WebSocket INVALID_STATE_ERR (Appwrite SDK heartbeat on stale connection)
  // and Firebase init errors (FCM not configured yet) — both are non-fatal in dev.
  const originalHandler = (globalThis as any).ErrorUtils?.getGlobalHandler?.();
  (globalThis as any).ErrorUtils?.setGlobalHandler?.((error: any, isFatal: boolean) => {
    const msg = String(error?.message || error || '');
    if (
      msg.includes('INVALID_STATE_ERR') ||
      msg.includes('FirebaseApp is not initialized')
    ) {
      return;
    }
    originalHandler?.(error, isFatal);
  });
}
import { ToastProvider, OfflineBanner } from '@/src/components/ui';
import { useNetworkListener } from '@/src/hooks/useNetworkListener';
import { usePushNotifications } from '@/src/hooks/usePushNotifications';
import { useAppStateHandler } from '@/src/hooks/useAppStateHandler';
import { initSentry, Sentry } from '@/src/services/sentry';

SplashScreen.preventAutoHideAsync();
initSentry();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
  });

  useEffect(() => {
    SystemUI.setBackgroundColorAsync('#0A0B0F');
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  useNetworkListener();
  usePushNotifications();
  useAppStateHandler();

  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={styles.root}>
      <Sentry.ErrorBoundary fallback={<></>}>
        <StatusBar style="light" />
        <ToastProvider />
        <OfflineBanner />
        <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" options={{ animation: 'fade' }} />
          <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
          <Stack.Screen
            name="(trip)"
            options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
          />
        </Stack>
      </Sentry.ErrorBoundary>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
