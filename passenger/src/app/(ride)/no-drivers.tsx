import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { T } from '@/src/theme/tokens';
import { Button, EmptyState } from '@/src/components/ui';

export default function NoDriversScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <EmptyState
          emoji="😔"
          title="No drivers available"
          subtitle="All drivers in your area are currently busy. Please try again in a few minutes."
        />
      </View>
      <View style={styles.cta}>
        <Button variant="primary" size="lg" fullWidth onPress={() => router.replace('/(ride)/searching-driver')}>
          Try again
        </Button>
        <Button variant="ghost" size="md" onPress={() => router.replace('/(tabs)/home')}>
          Go home
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.white },
  cta: { paddingHorizontal: 20, paddingBottom: 36, gap: 8, alignItems: 'center' },
});
