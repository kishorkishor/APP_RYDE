import { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { T, shadows } from '@/src/theme/tokens';
import { Divider, Badge, StarRating, EmptyState } from '@/src/components/ui';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/src/store/useAuthStore';
import { listRideHistory } from '@/src/services/appwriteRecords';
import type { TripRecord } from '@/src/types';

export default function RideHistoryScreen() {
  const user = useAuthStore((s) => s.user);
  const [trips, setTrips] = useState<TripRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const loadTrips = useCallback(async () => {
    if (!user?.id) {
      setTrips([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorMessage('');
    try {
      const history = await listRideHistory(user.id);
      setTrips(history);
    } catch (error) {
      console.error('Failed to load ride history', error);
      setErrorMessage('Could not load your trips.');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadTrips();
  }, [loadTrips]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Your Trips</Text>
        <Text style={styles.subtitle}>{trips.length} rides total</Text>
      </View>
      <ScrollView
        contentContainerStyle={[styles.list, trips.length === 0 && styles.emptyList]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={loadTrips} />}
      >
        {errorMessage ? (
          <EmptyState emoji="!" title={errorMessage} subtitle="Pull down to try again." />
        ) : trips.length === 0 && !isLoading ? (
          <EmptyState emoji="0" title="No trips yet" subtitle="Your completed and requested rides will show here." />
        ) : (
          trips.map((trip) => (
          <TouchableOpacity key={trip.id} activeOpacity={0.85} style={styles.tripCard}>
            <View style={styles.tripTop}>
              <Text style={styles.tripDate}>{trip.dateLabel}</Text>
              <Badge variant={trip.status === 'completed' ? 'green' : trip.status === 'cancelled' ? 'red' : 'blue'}>
                {trip.status}
              </Badge>
            </View>
            <View style={styles.tripRoute}>
              <View style={styles.routeDots}>
                <View style={[styles.routeDot, { backgroundColor: T.blue }]} />
                <View style={styles.routeLine} />
                <View style={[styles.routeDot, { backgroundColor: T.primary, borderRadius: 2 }]} />
              </View>
              <View style={{ flex: 1, gap: 12 }}>
                <Text style={styles.routeText}>{trip.pickup}</Text>
                <Text style={styles.routeText}>{trip.dropoff}</Text>
              </View>
            </View>
            <Divider style={{ marginVertical: 12 }} />
            <View style={styles.tripBottom}>
              <Text style={styles.tripRide}>{trip.rideName}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                {trip.rating && <StarRating rating={trip.rating} size={12} />}
                <Text style={styles.tripFare}>${trip.fare.toFixed(2)}</Text>
              </View>
            </View>
          </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.bg },
  header: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 16, backgroundColor: T.white },
  title: { fontSize: 24, fontWeight: '800', color: T.text, letterSpacing: -0.5, fontFamily: 'Inter_800ExtraBold' },
  subtitle: { fontSize: T.font.md, color: T.text3, marginTop: 4 },
  list: { padding: 20, gap: 12 },
  emptyList: { flexGrow: 1, justifyContent: 'center' },
  tripCard: { backgroundColor: T.white, borderRadius: T.radius.lg, padding: 16, ...shadows.sm },
  tripTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  tripDate: { fontSize: T.font.sm, fontWeight: '600', color: T.text3 },
  tripRoute: { flexDirection: 'row', gap: 12 },
  routeDots: { alignItems: 'center', paddingTop: 4 },
  routeDot: { width: 8, height: 8, borderRadius: 4 },
  routeLine: { width: 1.5, flex: 1, backgroundColor: T.gray300, marginVertical: 4, minHeight: 12 },
  routeText: { fontSize: T.font.base, fontWeight: '600', color: T.text },
  tripBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  tripRide: { fontSize: T.font.sm, color: T.text3, fontWeight: '500' },
  tripFare: { fontSize: T.font.lg, fontWeight: '700', color: T.text },
});
