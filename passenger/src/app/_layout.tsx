import { useEffect } from 'react';
import { LogBox } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, Inter_800ExtraBold } from '@expo-google-fonts/inter';
import * as SplashScreen from 'expo-splash-screen';
import { initSentry } from '@/src/services/sentry';

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
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  // Suppress known non-fatal errors in dev
  useEffect(() => {
    if (__DEV__) {
      LogBox.ignoreAllLogs(true);
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
  }, []);

  if (!fontsLoaded) return null;

  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" options={{ animation: 'fade' }} />
        <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
        <Stack.Screen name="(ride)" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
      </Stack>
    </>
  );
}
