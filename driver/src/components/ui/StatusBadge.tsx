// ─── StatusBadge Component ────────────────────────────────────────────────────
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { DT } from '@/src/theme/tokens';
import type { DriverStatus } from '@/src/types';

const STATUS_CONFIG: Record<
  DriverStatus,
  { label: string; bg: string; border: string; text: string; dot: string }
> = {
  online: {
    label: 'Online',
    bg: DT.onlineBg,
    border: DT.onlineBorder,
    text: DT.online,
    dot: DT.online,
  },
  offline: {
    label: 'Offline',
    bg: DT.offlineBg,
    border: DT.offlineBorder,
    text: DT.offline,
    dot: DT.offline,
  },
  assigned: {
    label: 'Assigned',
    bg: DT.assignedBg,
    border: DT.assignedBorder,
    text: DT.assignedText,
    dot: DT.assigned,
  },
  heading_pickup: {
    label: 'Heading to Pickup',
    bg: DT.assignedBg,
    border: DT.assignedBorder,
    text: DT.assignedText,
    dot: DT.assigned,
  },
  arrived: {
    label: 'Arrived',
    bg: DT.onlineBg,
    border: DT.onlineBorder,
    text: DT.online,
    dot: DT.online,
  },
  verified: {
    label: 'Verified',
    bg: DT.onlineBg,
    border: DT.onlineBorder,
    text: DT.online,
    dot: DT.online,
  },
  in_progress: {
    label: 'In Progress',
    bg: DT.amberBg,
    border: DT.amberBorder,
    text: DT.amberText,
    dot: DT.amber,
  },
};

type StatusBadgeProps = {
  status: DriverStatus;
  size?: 'sm' | 'md';
};

export const StatusBadge = React.memo(function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];

  return (
    <View
      accessibilityRole="text"
      accessibilityLabel={`Status: ${config.label}`}
      style={[
        styles.badge,
        {
          backgroundColor: config.bg,
          borderColor: config.border,
        },
        size === 'sm' && styles.badgeSm,
      ]}
    >
      <View
        style={[
          styles.dot,
          { backgroundColor: config.dot },
          size === 'sm' && styles.dotSm,
        ]}
      />
      <Text
        style={[
          styles.label,
          { color: config.text },
          size === 'sm' && styles.labelSm,
        ]}
      >
        {config.label}
      </Text>
    </View>
  );
});

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  badgeSm: {
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 999,
  },
  dotSm: {
    width: 5,
    height: 5,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.2,
  },
  labelSm: {
    fontSize: 11,
  },
});
