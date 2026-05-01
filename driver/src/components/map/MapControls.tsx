// ─── MapControls ──────────────────────────────────────────────────────────────
// Floating action buttons that overlay the map. Anchored either top-right or
// bottom-right of the viewport. Stack vertically:
//   [recenter] → [fit-route, optional] → [zoom-in, optional] → [zoom-out, optional]
// ─────────────────────────────────────────────────────────────────────────────
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type Anchor = 'top-right' | 'bottom-right';

type Props = {
  onRecenter: () => void;
  onFitRoute?: () => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  anchor?: Anchor;
  topOffset?: number;
  bottomOffset?: number;
  recenterActive?: boolean;
};

export function MapControls({
  onRecenter,
  onFitRoute,
  onZoomIn,
  onZoomOut,
  anchor = 'bottom-right',
  topOffset = 0,
  bottomOffset = 0,
  recenterActive = false,
}: Props) {
  const positionStyle =
    anchor === 'top-right'
      ? { top: topOffset + 12 }
      : { bottom: bottomOffset + 12 };

  return (
    <View
      pointerEvents="box-none"
      style={[styles.container, positionStyle]}
    >
      <TouchableOpacity
        style={[styles.btn, recenterActive ? styles.btnPrimary : styles.btnDark]}
        onPress={onRecenter}
        activeOpacity={0.85}
        accessibilityLabel="Recenter on my location"
      >
        <Ionicons
          name="locate"
          size={20}
          color={recenterActive ? '#FFFFFF' : '#E5EAF2'}
        />
      </TouchableOpacity>

      {onFitRoute && (
        <TouchableOpacity
          style={[styles.btn, styles.btnDark]}
          onPress={onFitRoute}
          activeOpacity={0.85}
          accessibilityLabel="Fit route to screen"
        >
          <Ionicons name="git-compare-outline" size={18} color="#E5EAF2" />
        </TouchableOpacity>
      )}

      {onZoomIn && (
        <TouchableOpacity
          style={[styles.btn, styles.btnSmall, styles.btnDark]}
          onPress={onZoomIn}
          activeOpacity={0.85}
          accessibilityLabel="Zoom in"
        >
          <Ionicons name="add" size={18} color="#E5EAF2" />
        </TouchableOpacity>
      )}

      {onZoomOut && (
        <TouchableOpacity
          style={[styles.btn, styles.btnSmall, styles.btnDark]}
          onPress={onZoomOut}
          activeOpacity={0.85}
          accessibilityLabel="Zoom out"
        >
          <Ionicons name="remove" size={18} color="#E5EAF2" />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: 14,
    gap: 8,
    alignItems: 'flex-end',
    zIndex: 30,
  },
  btn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  btnSmall: {
    width: 38,
    height: 38,
    borderRadius: 12,
  },
  btnDark: {
    backgroundColor: 'rgba(15,17,24,0.94)',
    borderColor: 'rgba(255,255,255,0.14)',
  },
  btnPrimary: {
    backgroundColor: 'rgba(59,130,246,0.96)',
    borderColor: 'rgba(147,197,253,0.6)',
  },
});
