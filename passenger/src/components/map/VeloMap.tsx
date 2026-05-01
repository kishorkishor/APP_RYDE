import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, type NativeSyntheticEvent } from 'react-native';
import {
  Camera,
  GeoJSONSource,
  Layer,
  Map,
  Marker,
  UserLocation,
  type CameraRef,
  type ViewStateChangeEvent,
} from '@maplibre/maplibre-react-native';
import { ACTIVE_CITY } from '@/src/config/city';
import { T } from '@/src/theme/tokens';
import { getTomTomMapStyle } from '@/src/services/tomtom';
import { getMapboxMapStyle } from '@/src/services/mapbox';

// Priority: Mapbox (best) → TomTom (has traffic) → OpenFreeMap (free fallback)
const getPrimaryStyle = () => getMapboxMapStyle() ?? getTomTomMapStyle();
const getFallbackStyle = () => getTomTomMapStyle();

type VeloMapProps = {
  centerCoordinate?: [number, number]; // [longitude, latitude]
  zoomLevel?: number;
  pickupCoordinate?: [number, number];
  destinationCoordinate?: [number, number];
  driverCoordinate?: [number, number];
  routeGeoJSON?: any; // LineString Feature or Geometry
  currentLocationCoordinate?: [number, number];
  showsUserLocation?: boolean;
  interactive?: boolean;
  onRegionWillChange?: () => void;
  onRegionChangeComplete?: (center: [number, number]) => void;
  style?: any;
};

export default function VeloMap({
  centerCoordinate = ACTIVE_CITY.center,
  zoomLevel = ACTIVE_CITY.defaultZoom,
  pickupCoordinate,
  destinationCoordinate,
  driverCoordinate,
  routeGeoJSON,
  currentLocationCoordinate,
  showsUserLocation = true,
  interactive = true,
  onRegionWillChange,
  onRegionChangeComplete,
  style,
}: VeloMapProps) {
  const cameraRef = useRef<CameraRef>(null);
  const [mapStyle, setMapStyle] = useState(() => getPrimaryStyle());
  const fallbackApplied = useRef(false);

  useEffect(() => {
    if (routeGeoJSON && pickupCoordinate && destinationCoordinate) {
      const west = Math.min(pickupCoordinate[0], destinationCoordinate[0]);
      const south = Math.min(pickupCoordinate[1], destinationCoordinate[1]);
      const east = Math.max(pickupCoordinate[0], destinationCoordinate[0]);
      const north = Math.max(pickupCoordinate[1], destinationCoordinate[1]);

      cameraRef.current?.fitBounds([west, south, east, north], {
        padding: { top: 50, right: 50, bottom: 50, left: 50 },
        duration: 1000,
      });
    }
  }, [routeGeoJSON, pickupCoordinate, destinationCoordinate]);

  const handleRegionDidChange = (e: NativeSyntheticEvent<ViewStateChangeEvent>) => {
    if (onRegionChangeComplete) {
      const center = e.nativeEvent.center as [number, number];
      onRegionChangeComplete(center);
    }
  };

  return (
    <View style={[styles.container, style]}>
      <View style={styles.map} pointerEvents={interactive ? 'auto' : 'none'}>
        <Map
          style={styles.map}
          mapStyle={mapStyle}
          logo={false}
          attribution={false}
          onRegionWillChange={interactive ? onRegionWillChange : undefined}
          onRegionDidChange={interactive ? handleRegionDidChange : undefined}
          onDidFailLoadingMap={() => {
            if (!fallbackApplied.current) {
              fallbackApplied.current = true;
              setMapStyle(getFallbackStyle());
            }
          }}
        >
          <Camera
            ref={cameraRef}
            initialViewState={{
              center: centerCoordinate,
              zoom: zoomLevel,
            }}
            minZoom={ACTIVE_CITY.minZoom}
            maxZoom={ACTIVE_CITY.maxZoom}
          />

          {showsUserLocation && (
            <UserLocation heading accuracy />
          )}

          {currentLocationCoordinate && (
            <Marker id="current-location" lngLat={currentLocationCoordinate}>
              <View style={styles.currentLocationMarker}>
                <View style={styles.currentLocationPulse} />
                <View style={styles.currentLocationPin}>
                  <View style={styles.currentLocationDot} />
                </View>
              </View>
            </Marker>
          )}

          {pickupCoordinate && (
            <Marker id="pickup" lngLat={pickupCoordinate}>
              <View style={styles.pickupMarker}>
                <View style={styles.pickupDot} />
              </View>
            </Marker>
          )}

          {destinationCoordinate && (
            <Marker id="destination" lngLat={destinationCoordinate}>
              <View style={styles.destinationMarker}>
                <View style={styles.destinationDot} />
              </View>
            </Marker>
          )}

          {driverCoordinate && (
            <Marker id="driver" lngLat={driverCoordinate}>
              <View style={styles.driverMarker}>
                <View style={styles.driverDot} />
              </View>
            </Marker>
          )}

          {routeGeoJSON && (
            <GeoJSONSource id="routeSource" data={routeGeoJSON}>
              {/* Glow */}
              <Layer
                id="routeLineGlow"
                type="line"
                paint={{
                  'line-color': T.blue,
                  'line-width': 14,
                  'line-opacity': 0.15,
                  'line-blur': 8,
                }}
                layout={{ 'line-cap': 'round', 'line-join': 'round' }}
              />
              {/* Casing */}
              <Layer
                id="routeLineCasing"
                type="line"
                paint={{
                  'line-color': '#1D4ED8',
                  'line-width': 8,
                  'line-opacity': 0.9,
                }}
                layout={{ 'line-cap': 'round', 'line-join': 'round' }}
              />
              {/* Core */}
              <Layer
                id="routeLine"
                type="line"
                paint={{
                  'line-color': '#60A5FA',
                  'line-width': 5,
                  'line-opacity': 1,
                }}
                layout={{ 'line-cap': 'round', 'line-join': 'round' }}
              />
            </GeoJSONSource>
          )}
        </Map>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E8F0FE',
  },
  map: {
    flex: 1,
  },
  pickupMarker: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(37, 99, 235, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: T.blue,
  },
  pickupDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: T.blue,
  },
  destinationMarker: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(22, 163, 74, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: T.green,
  },
  destinationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: T.green,
  },
  driverMarker: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(59, 130, 246, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#3B82F6',
  },
  driverDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#3B82F6',
  },
  currentLocationMarker: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  currentLocationPulse: {
    position: 'absolute',
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(37, 99, 235, 0.18)',
  },
  currentLocationPin: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: T.white,
    borderWidth: 3,
    borderColor: T.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  currentLocationDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: T.blue,
  },
});
