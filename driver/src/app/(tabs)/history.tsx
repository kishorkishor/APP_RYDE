// ─── History Screen ───────────────────────────────────────────────────────────
import { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { DT } from '@/src/theme/tokens';
import { useToastStore } from '@/src/store/useToastStore';
import { useDriverAuthStore } from '@/src/store/useDriverAuthStore';
import { useDriverRideStore } from '@/src/store/useDriverRideStore';
import { listDriverRideHistory } from '@/src/services/driverRecords';
import { SkeletonCard } from '@/src/components/ui';
import type { RideHistoryItem } from '@/src/types';

const STATUS_CHIP: Record<string, { bg: string; border: string; text: string }> = {
  completed: { bg: DT.onlineBg, border: DT.onlineBorder, text: DT.online },
  cancelled: { bg: DT.offlineBg, border: DT.offlineBorder, text: DT.offline },
  in_progress: { bg: DT.amberBg, border: DT.amberBorder, text: DT.amberText },
};

function HistoryRow({ item }: { item: RideHistoryItem }) {
  const chip = STATUS_CHIP[item.status] ?? STATUS_CHIP.completed;
  return (
    <View style={styles.historyRow}>
      {/* Left icon */}
      <View style={styles.historyIcon}>
        <Ionicons name="car-outline" size={18} color={DT.textMuted} />
      </View>

      {/* Main content */}
      <View style={styles.historyContent}>
        <View style={styles.historyTop}>
          <Text style={styles.passengerName} numberOfLines={1}>
            {item.passengerName}
          </Text>
          <View
            style={[
              styles.chip,
              { backgroundColor: chip.bg, borderColor: chip.border },
            ]}
          >
            <Text style={[styles.chipText, { color: chip.text }]}>
              {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
            </Text>
          </View>
        </View>
        <Text style={styles.dateLabel}>{item.dateLabel}</Text>

        {/* Route */}
        <View style={styles.routeRow}>
          <View style={styles.greenDot} />
          <Text style={styles.routeAddr} numberOfLines={1}>
            {item.pickup}
          </Text>
        </View>
        <View style={styles.routeRow}>
          <Ionicons name="location" size={10} color="#EF4444" />
          <Text style={styles.routeAddr} numberOfLines={1}>
            {item.dropoff}
          </Text>
        </View>

        {/* Stats */}
        <View style={styles.stats}>
          <Ionicons name="navigate-outline" size={11} color={DT.textFaint} />
          <Text style={styles.statText}>{item.distanceKm.toFixed(1)} km</Text>
          <Text style={styles.statDot}>·</Text>
          <Ionicons name="time-outline" size={11} color={DT.textFaint} />
          <Text style={styles.statText}>{item.durationMin} min</Text>
        </View>
      </View>
    </View>
  );
}

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const profile = useDriverAuthStore((s) => s.profile);
  const { historyRides, setHistoryRides } = useDriverRideStore();
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchHistory = async () => {
    if (!profile?.id) return;
    try {
      const rides = await listDriverRideHistory(profile.id);
      setHistoryRides(rides);
    } catch {
      useToastStore.getState().showToast('Failed to load ride history.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchHistory();
    }, [profile?.id]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchHistory();
    setRefreshing(false);
  };

  return (
    <View
      style={[
        styles.container,
        { paddingTop: Math.max(insets.top + 10, 34) },
      ]}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 16) + 96 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="rgba(255,255,255,0.5)"
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>History</Text>
          <Text style={styles.subtitle}>
            {historyRides.length} ride{historyRides.length !== 1 ? 's' : ''} completed
          </Text>
        </View>

        {/* List */}
        <View style={styles.list}>
          {isLoading && historyRides.length === 0 ? (
            <View style={{ gap: 10 }}>
              <SkeletonCard variant="history" />
              <SkeletonCard variant="history" />
              <SkeletonCard variant="history" />
              <SkeletonCard variant="history" />
            </View>
          ) : historyRides.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="time-outline" size={48} color={DT.textFaint} />
              <Text style={styles.emptyTitle}>No rides yet</Text>
              <Text style={styles.emptyBody}>
                Completed rides will appear here.
              </Text>
            </View>
          ) : (
            historyRides.map((item) => (
              <HistoryRow key={item.id} item={item} />
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: DT.bg },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
    gap: 4,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    fontFamily: 'Inter_800ExtraBold',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    color: DT.textMuted,
    fontFamily: 'Inter_400Regular',
  },
  list: { paddingHorizontal: 16, paddingTop: 12, gap: 10, paddingBottom: 32 },
  historyRow: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: DT.bgCard,
    borderWidth: 1,
    borderColor: DT.border,
    borderRadius: 18,
    padding: 14,
  },
  historyIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 2,
  },
  historyContent: { flex: 1, gap: 6 },
  historyTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  passengerName: {
    fontSize: 15,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
    color: '#FFFFFF',
    flex: 1,
  },
  chip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 10,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.3,
  },
  dateLabel: {
    fontSize: 11,
    color: DT.textFaint,
    fontFamily: 'Inter_400Regular',
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  greenDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22C55E',
  },
  routeAddr: {
    flex: 1,
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    fontFamily: 'Inter_400Regular',
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: DT.borderLight,
    marginTop: 2,
  },
  statText: {
    fontSize: 11,
    color: DT.textFaint,
    fontFamily: 'Inter_500Medium',
  },
  statDot: { color: DT.textFaint, fontSize: 11 },
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
    gap: 14,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
    color: 'rgba(255,255,255,0.5)',
  },
  emptyBody: {
    fontSize: 13,
    color: DT.textFaint,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
  },
});
