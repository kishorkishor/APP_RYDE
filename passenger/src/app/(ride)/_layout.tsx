import { Stack } from 'expo-router';

export default function RideLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="search" options={{ animation: 'slide_from_bottom' }} />
      <Stack.Screen name="confirm-pickup" />
      <Stack.Screen name="ride-options" />
      <Stack.Screen name="confirm-booking" />
      <Stack.Screen name="searching-driver" options={{ gestureEnabled: false }} />
      <Stack.Screen name="driver-assigned" options={{ gestureEnabled: false }} />
      <Stack.Screen name="tracking" options={{ gestureEnabled: false }} />
      <Stack.Screen name="completed" options={{ gestureEnabled: false, animation: 'fade' }} />
      <Stack.Screen name="no-drivers" options={{ animation: 'fade' }} />
    </Stack>
  );
}
