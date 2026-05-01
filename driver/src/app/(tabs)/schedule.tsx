// ─── Schedule Screen ──────────────────────────────────────────────────────────
// Shows Upcoming / Today / Completed ride tabs with live countdown timers.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { DT } from '@/src/theme/tokens';
import { useToastStore } from '@/src/store/useToastStore';
import { useDriverAuthStore } from '@/src/store/useDriverAuthStore';
import { useDriverRideStore } from '@/src/store/useDriverRideStore';
import { listScheduledRides, listCompletedScheduledRides, acceptRide } from '@/src/services/driverRecords';
import { subscribeToRideCollection } from '@/src/services/realtime';
import { CountdownBadge, NextCountdown, SkeletonCard } from '@/src/components/ui';
import type { DriverRide } from '@/src/types';

const TABS = ['Upcoming', 'Today', 'Completed'] as const;
type Tab = typeof TABS[number];

// ── Status chip config ────────────────────────────────────────────────────────
const STATUS_STYLE: Record<string, { bg: string; border: string; text: string; label: string }> = {
  assigned: { bg: DT.assignedBg, border: DT.assignedBorder, text: DT.assignedText, label: 'Assigned' },
  in_progress: { bg: DT.amberBg, border: DT.amberBorder, text: DT.amberText, label: 'In Progress' },
  completed: { bg: DT.onlineBg, border: DT.onlineBorder, text: DT.online, label: 'Done' },
  cancelled: { bg: DT.offlineBg, border: DT.offlineBorder, text: DT.offline, label: 'Cancelled' },
  pending: { bg: 'rgba(255,255,255,0.06)', border: DT.border, text: DT.textMuted, label: 'Pending' },
};

function getStatusStyle(status: string) {
  return STATUS_STYLE[status] ?? STATUS_STYLE.pending;
}

// ── Ride row ──────────────────────────────────────────────────────────────────
const RideRow = React.memo(function RideRow({ ride, isFirst, onPress }: { ride: DriverRide; isFirst: boolean; onPress?: () => void }) {
  const sc = getStatusStyle(ride.status);
  const targetMs = ride.scheduledPickupAt
    ? new Date(ride.scheduledPickupAt).getTime()
    : 0;

  const timeLabel = ride.scheduledPickupAt
    ? new Date(ride.scheduledPickupAt).toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })
    : new Date(ride.requestedAt).toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      });

  return (
    <TouchableOpacity
      style={[styles.rideRow, !onPress && { opacity: 0.55 }]}
      onPress={onPress}
      activeOpacity={onPress ? 0.75 : 1}
      disabled={!onPress}
      accessibilityRole="button"
      accessibilityLabel={`Ride with ${ride.passengerName}`}
      accessibilityState={{ disabled: !onPress }}
    >
      {/* Top row */}
      <View style={styles.rideRowTop}>
        <View style={styles.rideRowLeft}>
          <View style={styles.timeRow}>
            <Ionicons name="time-outline" size={11} color={DT.textLabel} />
            <Text style={styles.timeText}>{timeLabel}</Text>
          </View>
          <Text style={styles.passengerName}>{ride.passengerName}</Text>
          {isFirst && targetMs > Date.now() && (
            <CountdownBadge targetMs={targetMs} />
          )}
        </View>
        <View style={styles.rideRowRight}>
          <View
            style={[
              styles.statusChip,
              { backgroundColor: sc.bg, borderColor: sc.border },
            ]}
          >
            <Text style={[styles.statusChipText, { color: sc.text }]}>
              {sc.label}
            </Text>
          </View>
          {ride.projectCode ? (
            <View style={styles.projectRow}>
              <Ionicons name="briefcase-outline" size={10} color={DT.textFaint} />
              <Text style={styles.projectText}>{ride.projectCode}</Text>
            </View>
          ) : null}
        </View>
      </View>

      {/* Route */}
      <View style={styles.routeRow}>
        <View style={styles.routeDots}>
          <View style={styles.greenDot} />
          <View style={styles.routeVLine} />
          <Ionicons name="location" size={10} color="#EF4444" />
        </View>
        <View style={styles.routeTexts}>
          <Text style={styles.routeAddr} numberOfLines={1}>{ride.pickupAddress}</Text>
          <Text style={styles.routeAddr} numberOfLines={1}>{ride.dropoffAddress}</Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color={DT.textFaint} />
      </View>
    </TouchableOpacity>
  );
});

// ─────────────────────────────────────────────────────────────────────────────
export default function ScheduleScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const profile = useDriverAuthStore((s) => s.profile);
  const { scheduledRides, setScheduledRides } = useDriverRideStore();
  const [activeTab, setActiveTab] = useState<Tab>('Upcoming');
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [completedRides, setCompletedRides] = useState<DriverRide[]>([]);

  const handleRidePress = async (ride: DriverRide) => {
    if (ride.status === 'completed' || ride.status === 'cancelled') return;
    const progress = (ride.driverProgress ?? '').trim();
    if (progress === '') {
      try {
        await acceptRide(ride.id, profile?.id);
        useDriverRideStore.getState().setActiveRide({
          ...ride,
          driverProgress: 'heading_pickup',
        });
      } catch {
        useToastStore.getState().showToast('Could not accept ride. Try again.', 'error');
        return;
      }
    } else {
      useDriverRideStore.getState().setActiveRide(ride);
    }
    router.push('/(trip)/active-ride');
  };

  const fetchRides = async () => {
    if (!profile?.id) return;
    try {
      const [rides, completed] = await Promise.all([
        listScheduledRides(profile.id),
        listCompletedScheduledRides(profile.id),
      ]);
      setScheduledRides(rides);
      setCompletedRides(completed);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRides();
  }, [profile?.id]);

  useEffect(() => {
    if (!profile?.id) return;
    const unsub = subscribeToRideCollection(() => fetchRides());
    return () => unsub();
  }, [profile?.id]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchRides();
    setRefreshing(false);
  };

  // Partition rides by tab
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const todayRides = scheduledRides.filter((r) => {
    const d = new Date(r.scheduledPickupAt || r.requestedAt);
    return d >= today && d < tomorrow;
  });
  const upcomingRides = scheduledRides.filter((r) => {
    const d = new Date(r.scheduledPickupAt || r.requestedAt);
    return d >= tomorrow;
  });
  const listByTab: Record<Tab, DriverRide[]> = {
    Today: todayRides,
    Upcoming: upcomingRides,
    Completed: completedRides,
  };
  const list = listByTab[activeTab];

  const nextRide = scheduledRides.find(
    (r) => r.scheduledPickupAt && new Date(r.scheduledPickupAt) > new Date()
  );
  const nextMs = nextRide?.scheduledPickupAt
    ? new Date(nextRide.scheduledPickupAt).getTime()
    : 0;

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
        {/* Title */}
        <View style={styles.titleArea}>
          <Text style={styles.title}>Schedule</Text>
        </View>

        {/* Summary cards */}
        <View style={styles.summaryRow}>
          {/* Assigned count */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryLabel}>
              <Ionicons name="map-outline" size={12} color={DT.textLabel} />
              <Text style={styles.summaryLabelText}>ASSIGNED</Text>
            </View>
            <View style={styles.summaryValueRow}>
              <Text style={styles.summaryBigNum}>
                {scheduledRides.filter(
                  (r) => r.status !== 'completed' && r.status !== 'cancelled'
                ).length}
              </Text>
              <Text style={styles.summaryUnit}>Rides</Text>
            </View>
          </View>

          {/* Next pickup */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryLabel}>
              <Ionicons name="alarm-outline" size={12} color={DT.textLabel} />
              <Text style={styles.summaryLabelText}>NEXT PICKUP</Text>
            </View>
            {nextRide && nextMs > Date.now() ? (
              <>
                <NextCountdown targetMs={nextMs} />
                <Text style={styles.nextPickupAddr} numberOfLines={1}>
                  {nextRide.pickupAddress}
                </Text>
              </>
            ) : (
              <Text style={styles.summaryBigNum}>—</Text>
            )}
          </View>
        </View>

        {/* Dispatch note — if active ride has project info */}
        {nextRide && (
          <View style={styles.dispatchBox}>
            <Ionicons name="chatbox-outline" size={14} color={DT.textMuted} />
            <View style={styles.dispatchTextArea}>
              <Text style={styles.dispatchTitle}>Dispatch Note</Text>
              <Text style={styles.dispatchBody}>
                {nextRide.projectLeader
                  ? `Assigned by ${nextRide.projectLeader} · ${nextRide.projectCode}`
                  : 'Check passenger details before departure.'}
              </Text>
            </View>
          </View>
        )}

        {/* Tabs */}
        <View style={styles.tabs}>
          {TABS.map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
              onPress={() => setActiveTab(tab)}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={`${tab} tab`}
              accessibilityState={{ selected: activeTab === tab }}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === tab && styles.tabTextActive,
                ]}
              >
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Ride list */}
        <View style={styles.rideList}>
          {isLoading && list.length === 0 ? (
            <View style={{ gap: 12 }}>
              <SkeletonCard variant="schedule" />
              <SkeletonCard variant="schedule" />
              <SkeletonCard variant="schedule" />
            </View>
          ) : list.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons
                name="calendar-outline"
                size={40}
                color={DT.textFaint}
              />
              <Text style={styles.emptyText}>No rides in this category</Text>
            </View>
          ) : (
            list.map((ride, i) => {
              const tappable = ride.status !== 'completed' && ride.status !== 'cancelled';
              return (
                <RideRow
                  key={ride.id}
                  ride={ride}
                  isFirst={i === 0}
                  onPress={tappable ? () => handleRidePress(ride) : undefined}
                />
              );
            })
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: DT.bg },
  titleArea: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 },
  title: {
    fontSize: 26,
    fontWeight: '800',
    fontFamily: 'Inter_800ExtraBold',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: DT.bgCard,
    borderWidth: 1,
    borderColor: DT.border,
    borderRadius: 18,
    padding: 14,
    gap: 6,
  },
  summaryLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  summaryLabelText: {
    fontSize: 10,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
    color: DT.textLabel,
    letterSpacing: 0.6,
  },
  summaryValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  summaryBigNum: {
    fontSize: 30,
    fontWeight: '800',
    fontFamily: 'Inter_800ExtraBold',
    color: '#FFFFFF',
    lineHeight: 34,
  },
  summaryUnit: {
    fontSize: 12,
    color: DT.textMuted,
    fontFamily: 'Inter_400Regular',
  },
  nextPickupAddr: {
    fontSize: 11,
    color: DT.textMuted,
    fontFamily: 'Inter_400Regular',
  },
  dispatchBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginHorizontal: 20,
    marginBottom: 14,
    padding: 12,
    backgroundColor: DT.bgCard,
    borderWidth: 1,
    borderColor: DT.borderLight,
    borderRadius: 14,
  },
  dispatchTextArea: { flex: 1, gap: 3 },
  dispatchTitle: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
    color: '#FFFFFF',
  },
  dispatchBody: {
    fontSize: 12,
    color: DT.textMuted,
    fontFamily: 'Inter_400Regular',
    lineHeight: 18,
  },
  tabs: {
    flexDirection: 'row',
    gap: 4,
    marginHorizontal: 20,
    marginBottom: 14,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: DT.borderLight,
    padding: 4,
  },
  tab: {
    flex: 1,
    height: 36,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabActive: {
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '500',
    fontFamily: 'Inter_500Medium',
    color: DT.textFaint,
  },
  tabTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
  },
  rideList: { paddingHorizontal: 20, gap: 12, paddingBottom: 32 },
  rideRow: {
    backgroundColor: DT.bgCard,
    borderWidth: 1,
    borderColor: DT.border,
    borderRadius: 20,
    padding: 16,
    gap: 12,
  },
  rideRowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  rideRowLeft: { gap: 4, flex: 1 },
  rideRowRight: { alignItems: 'flex-end', gap: 6 },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeText: {
    fontSize: 11,
    color: DT.textMuted,
    fontFamily: 'Inter_500Medium',
  },
  passengerName: {
    fontSize: 16,
    fontWeight: '800',
    fontFamily: 'Inter_800ExtraBold',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  statusChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  statusChipText: {
    fontSize: 10,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  projectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  projectText: {
    fontSize: 11,
    color: DT.textFaint,
    fontFamily: 'Inter_400Regular',
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: DT.borderLight,
  },
  routeDots: {
    alignItems: 'center',
    gap: 2,
  },
  greenDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22C55E',
  },
  routeVLine: {
    width: 1,
    height: 14,
    backgroundColor: DT.borderLight,
  },
  routeTexts: { flex: 1, gap: 8 },
  routeAddr: {
    fontSize: 13,
    fontWeight: '500',
    fontFamily: 'Inter_500Medium',
    color: 'rgba(255,255,255,0.7)',
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 48,
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    color: DT.textFaint,
    fontFamily: 'Inter_400Regular',
  },
});
