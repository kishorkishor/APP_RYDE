import { Stack } from 'expo-router';

export default function TripLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_bottom' }}>
      <Stack.Screen name="active-ride" />
      <Stack.Screen name="incoming-ride" />
      <Stack.Screen name="pickup-nav" />
      <Stack.Screen name="trip" />
      <Stack.Screen name="complete-ride" />
      <Stack.Screen name="report-issue" />
    </Stack>
  );
}
