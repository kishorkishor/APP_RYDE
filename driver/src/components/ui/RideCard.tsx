// ─── RideCard Component ───────────────────────────────────────────────────────
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DT } from '@/src/theme/tokens';
import type { DriverRide } from '@/src/types';

type RideCardProps = {
  ride: DriverRide;
  onPress?: () => void;
  compact?: boolean;
};

export const RideCard = React.memo(function RideCard({ ride, onPress, compact = false }: RideCardProps) {
  const isScheduled = ride.requestType === 'scheduled' && ride.scheduledPickupAt;

  const scheduledLabel = isScheduled
    ? new Date(ride.scheduledPickupAt!).toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })
    : null;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={`Ride for ${ride.passengerName}, ${ride.pickupAddress} to ${ride.dropoffAddress}`}
      style={styles.card}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.passengerRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {ride.passengerName.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.passengerInfo}>
            <Text style={styles.passengerName}>{ride.passengerName}</Text>
            <Text style={styles.company}>{ride.companyName}</Text>
          </View>
        </View>
        {isScheduled && (
          <View style={styles.scheduledBadge}>
            <Ionicons name="calendar-outline" size={11} color={DT.amberText} />
            <Text style={styles.scheduledText}>{scheduledLabel}</Text>
          </View>
        )}
      </View>

      {/* Meta chips */}
      {!compact && (
        <View style={styles.chips}>
          {ride.projectCode ? (
            <View style={styles.chip}>
              <Ionicons name="briefcase-outline" size={10} color={DT.textLabel} />
              <Text style={styles.chipText}>{ride.projectCode}</Text>
            </View>
          ) : null}
          {ride.projectLeader ? (
            <View style={styles.chip}>
              <Ionicons name="person-outline" size={10} color={DT.textLabel} />
              <Text style={styles.chipText}>{ride.projectLeader}</Text>
            </View>
          ) : null}
        </View>
      )}

      {/* Route */}
      <View style={styles.route}>
        <View style={styles.routeIconCol}>
          <View style={styles.pickupDot} />
          <View style={styles.routeLine} />
          <Ionicons name="location" size={10} color="#EF4444" />
        </View>
        <View style={styles.routeLabels}>
          <Text style={styles.routeLabel}>Pickup</Text>
          <Text style={styles.routeAddress} numberOfLines={1}>{ride.pickupAddress}</Text>
          <Text style={[styles.routeLabel, { marginTop: 8 }]}>Drop-off</Text>
          <Text style={styles.routeAddress} numberOfLines={1}>{ride.dropoffAddress}</Text>
        </View>
      </View>

      {/* Stats */}
      <View style={styles.stats}>
        <View style={styles.stat}>
          <Ionicons name="navigate-outline" size={12} color={DT.textLabel} />
          <Text style={styles.statText}>{ride.distanceKm.toFixed(1)} km</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Ionicons name="time-outline" size={12} color={DT.textLabel} />
          <Text style={styles.statText}>~{ride.durationMinutes} min</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Ionicons name="car-outline" size={12} color={DT.textLabel} />
          <Text style={styles.statText}>{ride.rideType}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: DT.bgCard,
    borderWidth: 1,
    borderColor: DT.border,
    borderRadius: 20,
    padding: 16,
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  passengerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: 'rgba(59,130,246,0.12)',
    borderWidth: 1,
    borderColor: DT.assignedBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
    color: DT.assignedText,
  },
  passengerInfo: {
    flex: 1,
  },
  passengerName: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
    color: DT.text,
    letterSpacing: -0.2,
  },
  company: {
    fontSize: 11,
    color: DT.textMuted,
    fontFamily: 'Inter_400Regular',
    marginTop: 2,
  },
  scheduledBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: DT.amberBg,
    borderWidth: 1,
    borderColor: DT.amberBorder,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  scheduledText: {
    fontSize: 10,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
    color: DT.amberText,
  },
  chips: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: DT.borderLight,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  chipText: {
    fontSize: 11,
    color: DT.textMuted,
    fontFamily: 'Inter_500Medium',
  },
  route: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: DT.borderLight,
    borderRadius: 14,
    padding: 12,
  },
  routeIconCol: {
    alignItems: 'center',
    paddingTop: 4,
    gap: 2,
  },
  pickupDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22C55E',
  },
  routeLine: {
    width: 1,
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginVertical: 2,
  },
  routeLabels: {
    flex: 1,
  },
  routeLabel: {
    fontSize: 10,
    color: DT.textFaint,
    fontFamily: 'Inter_400Regular',
    marginBottom: 2,
  },
  routeAddress: {
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
    color: DT.text,
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: DT.borderLight,
  },
  stat: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    justifyContent: 'center',
  },
  statText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
    color: DT.textMuted,
  },
  statDivider: {
    width: 1,
    height: 14,
    backgroundColor: DT.borderLight,
  },
});
