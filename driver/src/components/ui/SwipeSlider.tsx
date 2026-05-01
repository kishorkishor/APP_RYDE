import React, { useCallback, useEffect, useState } from 'react';
import {
  Dimensions,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  Easing,
  interpolateColor,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

const SLIDER_WIDTH = Dimensions.get('window').width - 64;
const THUMB_SIZE = 52;
const TRACK_PADDING = 6;
const TRAVEL = SLIDER_WIDTH - THUMB_SIZE - TRACK_PADDING * 2;
const settle = (toValue: number) =>
  withTiming(toValue, {
    duration: 180,
    easing: Easing.out(Easing.cubic),
  });

type SwipeSliderProps = {
  isOnline: boolean;
  onToggle: (online: boolean) => void;
};

export function SwipeSlider({ isOnline, onToggle }: SwipeSliderProps) {
  const [showOfflineConfirm, setShowOfflineConfirm] = useState(false);
  // RIGHT (progress=1) = ONLINE, LEFT (progress=0) = OFFLINE
  const progress = useSharedValue(isOnline ? 1 : 0);
  const startX = useSharedValue(0);

  useEffect(() => {
    progress.value = settle(isOnline ? 1 : 0);
  }, [isOnline, progress]);

  const stayOnline = useCallback(() => {
    setShowOfflineConfirm(false);
    progress.value = settle(1);
  }, [progress]);

  const confirmOffline = useCallback(() => {
    setShowOfflineConfirm(false);
    progress.value = settle(0);
    onToggle(false);
  }, [onToggle, progress]);

  const commit = useCallback(
    (goOnline: boolean) => {
      if (!goOnline && isOnline) {
        // Driver wants to go offline — show confirmation, snap back to online
        progress.value = settle(1);
        setShowOfflineConfirm(true);
        return;
      }

      progress.value = settle(goOnline ? 1 : 0);
      onToggle(goOnline);
    },
    [isOnline, onToggle, progress]
  );

  const panGesture = Gesture.Pan()
    .onBegin(() => {
      startX.value = progress.value * TRAVEL;
    })
    .onUpdate((event) => {
      const nextX = startX.value + event.translationX;
      progress.value = Math.min(1, Math.max(0, nextX / TRAVEL));
    })
    .onEnd((event) => {
      // Swipe RIGHT = go online, swipe LEFT = go offline
      const goOnline =
        event.velocityX > 50
          ? true
          : event.velocityX < -50
          ? false
          : progress.value > 0.5;

      runOnJS(commit)(goOnline);
    });

  // progress=0 (LEFT/OFFLINE) = red, progress=1 (RIGHT/ONLINE) = green
  const trackStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1],
      ['rgba(118,13,13,0.94)', 'rgba(0,82,36,0.92)']
    ),
    borderColor: interpolateColor(
      progress.value,
      [0, 1],
      ['rgba(255,90,90,0.98)', 'rgba(74,255,143,0.96)']
    ),
    shadowColor: interpolateColor(progress.value, [0, 1], ['#EF4444', '#22C55E']),
  }));

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: progress.value * TRAVEL }],
  }));

  const thumbInnerStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(progress.value, [0, 1], ['#EF4444', '#22C55E']),
    shadowColor: interpolateColor(progress.value, [0, 1], ['#EF4444', '#22C55E']),
  }));

  return (
    <View style={styles.container}>
      <GestureDetector gesture={panGesture}>
        <Animated.View
          style={[styles.track, trackStyle]}
          accessibilityRole="switch"
          accessibilityLabel={isOnline ? 'Online, swipe left to go offline' : 'Offline, swipe right to go online'}
          accessibilityState={{ checked: isOnline }}
        >
          <Text style={styles.trackLabel}>{isOnline ? 'ONLINE' : 'OFFLINE'}</Text>
          <Animated.View style={[styles.thumb, thumbStyle]}>
            <Animated.View style={[styles.thumbInner, thumbInnerStyle]}>
              <Ionicons name={isOnline ? 'checkmark' : 'power'} size={24} color="#FFFFFF" />
            </Animated.View>
          </Animated.View>
        </Animated.View>
      </GestureDetector>

      <Modal
        visible={showOfflineConfirm}
        transparent
        animationType="fade"
        onRequestClose={stayOnline}
      >
        <Pressable style={styles.modalBackdrop} onPress={stayOnline}>
          <Pressable style={styles.confirmCard} onPress={(event) => event.stopPropagation()}>
            <View style={styles.confirmAccent} />
            <View style={styles.confirmIconBox}>
              <Ionicons name="wifi-outline" size={24} color="#FCA5A5" />
              <View style={styles.offlineSlash} />
            </View>
            <Text style={styles.confirmTitle}>Go Offline?</Text>
            <Text style={styles.confirmSubtitle}>
              You will stop receiving new ride requests until you go online again.
            </Text>
            <View style={styles.confirmActions}>
              <Pressable style={styles.stayButton} onPress={stayOnline}>
                <Text style={styles.stayButtonText}>Stay Online</Text>
              </Pressable>
              <Pressable style={styles.offlineButton} onPress={confirmOffline}>
                <Text style={styles.offlineButtonText}>Go Offline</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 0,
  },
  track: {
    width: SLIDER_WIDTH,
    height: THUMB_SIZE + TRACK_PADDING * 2,
    borderRadius: 999,
    borderWidth: 2,
    justifyContent: 'center',
    paddingHorizontal: TRACK_PADDING,
    overflow: 'hidden',
    alignSelf: 'center',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.48,
    shadowRadius: 24,
    elevation: 12,
  },
  trackLabel: {
    fontSize: 16,
    fontWeight: '800',
    fontFamily: 'Inter_800ExtraBold',
    color: 'rgba(255,255,255,0.98)',
    textAlign: 'center',
    position: 'absolute',
    left: 0,
    right: 0,
    letterSpacing: 2.2,
    textShadowColor: 'rgba(0,0,0,0.58)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    zIndex: 10,
  },
  thumbInner: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.58)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  confirmCard: {
    width: '100%',
    borderRadius: 24,
    backgroundColor: '#10131C',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    padding: 20,
    alignItems: 'center',
    overflow: 'hidden',
  },
  confirmAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: '#EF4444',
  },
  confirmIconBox: {
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: 'rgba(239,68,68,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  offlineSlash: {
    position: 'absolute',
    width: 32,
    height: 2,
    borderRadius: 999,
    backgroundColor: '#FCA5A5',
    transform: [{ rotate: '-42deg' }],
  },
  confirmTitle: {
    fontSize: 20,
    fontWeight: '800',
    fontFamily: 'Inter_800ExtraBold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  confirmSubtitle: {
    fontSize: 13,
    lineHeight: 20,
    color: 'rgba(255,255,255,0.52)',
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    marginBottom: 18,
  },
  confirmActions: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  stayButton: {
    flex: 1,
    height: 48,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stayButtonText: {
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
    color: 'rgba(255,255,255,0.72)',
  },
  offlineButton: {
    flex: 1,
    height: 48,
    borderRadius: 15,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  offlineButtonText: {
    fontSize: 14,
    fontWeight: '800',
    fontFamily: 'Inter_800ExtraBold',
    color: '#FFFFFF',
  },
});
