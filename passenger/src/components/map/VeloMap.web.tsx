import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { ACTIVE_CITY } from '@/src/config/city';
import { T } from '@/src/theme/tokens';

type VeloMapProps = {
  centerCoordinate?: [number, number];
  zoomLevel?: number;
  pickupCoordinate?: [number, number];
  destinationCoordinate?: [number, number];
  routeGeoJSON?: any;
  showsUserLocation?: boolean;
  onRegionWillChange?: () => void;
  onRegionChangeComplete?: (center: [number, number]) => void;
  style?: any;
};

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const pointToPosition = (coordinate?: [number, number]) => {
  if (!coordinate) return null;

  const [west, south, east, north] = ACTIVE_CITY.bounds;
  const [longitude, latitude] = coordinate;
  const left = clamp(((longitude - west) / (east - west)) * 100, 8, 92);
  const top = clamp((1 - (latitude - south) / (north - south)) * 100, 8, 92);

  return { left: `${left}%`, top: `${top}%` };
};

export default function VeloMap({
  centerCoordinate = ACTIVE_CITY.center,
  pickupCoordinate,
  destinationCoordinate,
  onRegionChangeComplete,
  style,
}: VeloMapProps) {
  React.useEffect(() => {
    onRegionChangeComplete?.(centerCoordinate);
  }, [centerCoordinate, onRegionChangeComplete]);

  const pickupPosition = pointToPosition(pickupCoordinate);
  const destinationPosition = pointToPosition(destinationCoordinate);

  return (
    <View style={[styles.container, style]}>
      <View style={styles.gridLayer}>
        {Array.from({ length: 8 }).map((_, index) => (
          <View key={`h-${index}`} style={[styles.gridLineHorizontal, { top: `${(index + 1) * 12}%` }]} />
        ))}
        {Array.from({ length: 6 }).map((_, index) => (
          <View key={`v-${index}`} style={[styles.gridLineVertical, { left: `${(index + 1) * 14}%` }]} />
        ))}
      </View>

      {pickupPosition && destinationPosition && (
        <View style={[styles.routeLine, routeStyle(pickupPosition, destinationPosition)]} />
      )}

      {pickupPosition && (
        <View style={[styles.marker, styles.pickupMarker, pickupPosition as any]}>
          <View style={styles.pickupDot} />
        </View>
      )}

      {destinationPosition && (
        <View style={[styles.marker, styles.destinationMarker, destinationPosition as any]}>
          <View style={styles.destinationDot} />
        </View>
      )}

      {!pickupPosition && !destinationPosition && (
        <View style={styles.centerLabel}>
          <Text style={styles.cityText}>{ACTIVE_CITY.name}</Text>
        </View>
      )}
    </View>
  );
}

const routeStyle = (
  from: { left: string; top: string },
  to: { left: string; top: string }
) => {
  const fromLeft = Number.parseFloat(from.left);
  const fromTop = Number.parseFloat(from.top);
  const toLeft = Number.parseFloat(to.left);
  const toTop = Number.parseFloat(to.top);
  const width = Math.hypot(toLeft - fromLeft, toTop - fromTop);
  const angle = Math.atan2(toTop - fromTop, toLeft - fromLeft) * (180 / Math.PI);

  return {
    left: `${fromLeft}%`,
    top: `${fromTop}%`,
    width: `${width}%`,
    transform: [{ rotate: `${angle}deg` }],
  };
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E8F0FE',
    overflow: 'hidden',
  },
  gridLayer: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.9,
  },
  gridLineHorizontal: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(37, 99, 235, 0.08)',
  },
  gridLineVertical: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: 'rgba(37, 99, 235, 0.08)',
  },
  routeLine: {
    position: 'absolute',
    height: 4,
    borderRadius: 2,
    backgroundColor: T.primary,
    transformOrigin: '0 50%',
  } as any,
  marker: {
    position: 'absolute',
    width: 22,
    height: 22,
    marginLeft: -11,
    marginTop: -11,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  pickupMarker: {
    backgroundColor: 'rgba(37, 99, 235, 0.18)',
    borderColor: T.blue,
  },
  pickupDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: T.blue,
  },
  destinationMarker: {
    backgroundColor: 'rgba(22, 163, 74, 0.18)',
    borderColor: T.green,
  },
  destinationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: T.green,
  },
  centerLabel: {
    position: 'absolute',
    left: 20,
    bottom: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: T.radius.md,
    backgroundColor: 'rgba(255,255,255,0.88)',
  },
  cityText: {
    fontSize: T.font.sm,
    fontWeight: '700',
    color: T.text2,
  },
});
