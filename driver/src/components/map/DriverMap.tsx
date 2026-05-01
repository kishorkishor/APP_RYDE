// ─── DriverMap Component ──────────────────────────────────────────────────────
// MapLibre-based map for the driver app.
// Dark, professional style. Exposes an imperative ref:
//   - recenter(coords?)        → fly to driver / given coords
//   - fitToRoute(route)        → fit camera to a GeoJSON LineString with padding
//   - flyTo(coords, zoom?)     → fly to a coordinate
//   - enterNavMode(coords, b)  → pitch + bearing follow camera
//   - exitNavMode()            → reset pitch/bearing to overview
//   - zoomBy(delta)            → zoom in/out by delta
// Renders pickup, dropoff, driver markers and an optional route line.
// ─────────────────────────────────────────────────────────────────────────────
import React, {
  forwardRef,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { StyleSheet, View } from 'react-native';
import {
  Map,
  Camera,
  Marker,
  GeoJSONSource,
  Layer,
  UserLocation,
  type CameraRef,
} from '@maplibre/maplibre-react-native';

import { getMapboxMapStyle } from '@/src/services/mapbox';

const MAPTILER_KEY = process.env.EXPO_PUBLIC_MAPTILER_KEY || '';

// Priority: Mapbox navigation-night (best) → MapTiler dark → Carto Dark (free)
const getInitialStyle = () => {
  const mapbox = getMapboxMapStyle();
  if (mapbox) return mapbox;
  if (MAPTILER_KEY) return `https://api.maptiler.com/maps/streets-v2-dark/style.json?key=${MAPTILER_KEY}`;
  return 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';
};

const CARTO_FALLBACK = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';

type Coordinate = [number, number]; // [longitude, latitude]
type LatLng = { latitude: number; longitude: number };

export type DriverMapHandle = {
  recenter: (coords?: LatLng) => void;
  fitToRoute: (
    geojson: any,
    options?: { paddingTop?: number; paddingBottom?: number },
  ) => void;
  flyTo: (coords: LatLng, zoom?: number) => void;
  enterNavMode: (coords: LatLng, bearing: number) => void;
  exitNavMode: (coords?: LatLng) => void;
  zoomBy: (delta: number) => void;
  getZoom: () => number;
};

type DriverMapProps = {
  driverCoords?: LatLng | null;
  pickupCoords?: LatLng | null;
  dropoffCoords?: LatLng | null;
  routeGeoJSON?: any | null;
  initialZoom?: number;
  showUserPuck?: boolean;
  onUserGesture?: () => void;
};

export const DriverMap = forwardRef<DriverMapHandle, DriverMapProps>(function DriverMap(
  {
    driverCoords,
    pickupCoords,
    dropoffCoords,
    routeGeoJSON,
    initialZoom = 13,
    showUserPuck = true,
    onUserGesture,
  },
  ref,
) {
  const cameraRef = useRef<CameraRef>(null);
  const lastZoomRef = useRef<number>(initialZoom);
  const [mapStyle, setMapStyle] = useState(() => getInitialStyle());
  const fallbackApplied = useRef(false);

  const center: Coordinate = useMemo(() => {
    if (driverCoords) return [driverCoords.longitude, driverCoords.latitude];
    if (pickupCoords) return [pickupCoords.longitude, pickupCoords.latitude];
    return [46.6753, 24.7136]; // Riyadh fallback
  }, [driverCoords, pickupCoords]);

  useImperativeHandle(
    ref,
    () => ({
      recenter: (coords) => {
        const target = coords ?? driverCoords;
        if (!target) return;
        lastZoomRef.current = 16;
        cameraRef.current?.flyTo({
          center: [target.longitude, target.latitude],
          zoom: 16,
          pitch: 0,
          bearing: 0,
          duration: 700,
        });
      },
      fitToRoute: (geojson, opts) => {
        const coords = extractLineCoords(geojson);
        if (coords.length < 2) return;
        const lons = coords.map((c) => c[0]);
        const lats = coords.map((c) => c[1]);
        cameraRef.current?.fitBounds(
          [Math.min(...lons), Math.min(...lats), Math.max(...lons), Math.max(...lats)],
          {
            padding: {
              top: opts?.paddingTop ?? 140,
              bottom: opts?.paddingBottom ?? 360,
              left: 70,
              right: 70,
            },
            duration: 900,
          },
        );
      },
      flyTo: (coords, zoom = 15) => {
        lastZoomRef.current = zoom;
        cameraRef.current?.flyTo({
          center: [coords.longitude, coords.latitude],
          zoom,
          duration: 700,
        });
      },
      enterNavMode: (coords, bearing) => {
        lastZoomRef.current = 16.5;
        cameraRef.current?.flyTo({
          center: [coords.longitude, coords.latitude],
          zoom: 16.5,
          pitch: 50,
          bearing,
          duration: 700,
        });
      },
      exitNavMode: (coords) => {
        const target = coords ?? driverCoords;
        if (!target) return;
        cameraRef.current?.flyTo({
          center: [target.longitude, target.latitude],
          pitch: 0,
          bearing: 0,
          duration: 600,
        });
      },
      zoomBy: (delta) => {
        const next = Math.max(3, Math.min(20, lastZoomRef.current + delta));
        lastZoomRef.current = next;
        const target = driverCoords;
        if (!target) return;
        cameraRef.current?.flyTo({
          center: [target.longitude, target.latitude],
          zoom: next,
          duration: 250,
        });
      },
      getZoom: () => lastZoomRef.current,
    }),
    [driverCoords?.latitude, driverCoords?.longitude],
  );

  return (
    <View style={StyleSheet.absoluteFill}>
      <Map
        style={StyleSheet.absoluteFill}
        mapStyle={mapStyle}
        logo={false}
        attribution={false}
        onPress={() => onUserGesture?.()}
        onLongPress={() => onUserGesture?.()}
        onDidFailLoadingMap={() => {
          if (!fallbackApplied.current) {
            fallbackApplied.current = true;
            setMapStyle(CARTO_FALLBACK);
          }
        }}
      >
        <Camera
          ref={cameraRef}
          initialViewState={{
            zoom: initialZoom,
            center: center,
          }}
        />

        {/* Built-in user puck — Uber-like arrow showing heading */}
        {showUserPuck && (
          <UserLocation animated heading accuracy={false} />
        )}

        {/* Route line — glow + casing + core (3 layers) */}
        {routeGeoJSON && (
          <GeoJSONSource id="routeSource" data={routeGeoJSON}>
            <Layer
              id="routeLineGlow"
              type="line"
              paint={{
                'line-color': '#3B82F6',
                'line-width': 16,
                'line-opacity': 0.18,
                'line-blur': 10,
              }}
              layout={{ 'line-cap': 'round', 'line-join': 'round' }}
            />
            <Layer
              id="routeLineCasing"
              type="line"
              paint={{
                'line-color': '#1E40AF',
                'line-width': 9,
                'line-opacity': 0.95,
              }}
              layout={{ 'line-cap': 'round', 'line-join': 'round' }}
            />
            <Layer
              id="routeLine"
              type="line"
              paint={{
                'line-color': '#7DD3FC',
                'line-width': 6,
                'line-opacity': 1,
              }}
              layout={{ 'line-cap': 'round', 'line-join': 'round' }}
            />
          </GeoJSONSource>
        )}

        {/* Pickup pin — green */}
        {pickupCoords && (
          <Marker id="pickup" lngLat={[pickupCoords.longitude, pickupCoords.latitude]}>
            <View style={styles.pinWrap}>
              <View style={[styles.pinHead, styles.pickupPinHead]}>
                <View style={styles.pinDot} />
              </View>
              <View style={[styles.pinTail, styles.pickupPinTail]} />
              <View style={styles.pinShadow} />
            </View>
          </Marker>
        )}

        {/* Dropoff pin — red */}
        {dropoffCoords && (
          <Marker id="dropoff" lngLat={[dropoffCoords.longitude, dropoffCoords.latitude]}>
            <View style={styles.pinWrap}>
              <View style={[styles.pinHead, styles.dropoffPinHead]}>
                <View style={styles.pinDot} />
              </View>
              <View style={[styles.pinTail, styles.dropoffPinTail]} />
              <View style={styles.pinShadow} />
            </View>
          </Marker>
        )}

        {/* Manual driver marker — fallback when user puck is disabled */}
        {!showUserPuck && driverCoords && (
          <Marker id="driver" lngLat={[driverCoords.longitude, driverCoords.latitude]}>
            <View style={styles.driverMarker}>
              <View style={styles.driverDot} />
            </View>
          </Marker>
        )}
      </Map>
    </View>
  );
});

function extractLineCoords(geojson: any): Coordinate[] {
  if (!geojson) return [];
  const geom = geojson.geometry ?? geojson;
  if (geom?.type === 'LineString' && Array.isArray(geom.coordinates)) {
    return geom.coordinates as Coordinate[];
  }
  if (geom?.type === 'MultiLineString' && Array.isArray(geom.coordinates)) {
    return (geom.coordinates as Coordinate[][]).flat();
  }
  return [];
}

const styles = StyleSheet.create({
  pinWrap: {
    width: 32,
    height: 40,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  pinHead: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 6,
  },
  pickupPinHead: {
    backgroundColor: '#22C55E',
  },
  dropoffPinHead: {
    backgroundColor: '#EF4444',
  },
  pinTail: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginTop: -2,
  },
  pickupPinTail: {
    borderTopColor: '#22C55E',
  },
  dropoffPinTail: {
    borderTopColor: '#EF4444',
  },
  pinDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
  pinShadow: {
    position: 'absolute',
    bottom: 0,
    width: 14,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  driverMarker: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(59,130,246,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#3B82F6',
  },
  driverDot: {
    width: 13,
    height: 13,
    borderRadius: 7,
    backgroundColor: '#3B82F6',
  },
});
