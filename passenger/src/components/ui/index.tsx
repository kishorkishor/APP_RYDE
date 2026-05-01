// ─── VELO UI Kit ──────────────────────────────────────────────────────────────
// Core reusable components ported from Figma prototype UIKit.tsx
// ────────────────────────────────────────────────────────────────────────────────

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput as RNTextInput,
  Image,
  StyleSheet,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import { T, shadows, chipColors, type ChipVariant, statusPillColors, type StatusPillVariant } from '@/src/theme/tokens';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  withSequence,
  withSpring,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

// ── BUTTON ───────────────────────────────────────────────────────────────────
type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'green' | 'danger' | 'outline';
type ButtonSize = 'sm' | 'md' | 'lg';

const btnVariants: Record<ButtonVariant, ViewStyle & { _textColor: string }> = {
  primary:   { backgroundColor: T.primary, _textColor: T.white },
  secondary: { backgroundColor: T.gray100, _textColor: T.primary },
  ghost:     { backgroundColor: 'transparent', _textColor: T.primary },
  green:     { backgroundColor: T.green, _textColor: T.white },
  danger:    { backgroundColor: T.red, _textColor: T.white },
  outline:   { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: T.border, _textColor: T.primary },
};

const btnSizes: Record<ButtonSize, { height: number; px: number; fontSize: number; radius: number }> = {
  sm: { height: 40, px: T.space.lg, fontSize: T.font.base, radius: T.radius.md },
  md: { height: 48, px: T.space.xl, fontSize: T.font.lg, radius: T.radius.lg },
  lg: { height: 56, px: T.space['2xl'], fontSize: T.font.xl, radius: T.radius.xl },
};

interface ButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: React.ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
}

export function Button({ variant = 'primary', size = 'lg', children, onPress, disabled, fullWidth, icon, style }: ButtonProps) {
  const v = btnVariants[variant];
  const s = btnSizes[size];
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.85}
      style={[{
        height: s.height,
        paddingHorizontal: s.px,
        borderRadius: s.radius,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: T.space.sm,
        opacity: disabled ? 0.45 : 1,
        width: fullWidth ? '100%' : undefined,
        backgroundColor: v.backgroundColor,
        borderWidth: (v as any).borderWidth,
        borderColor: (v as any).borderColor,
      }, style]}
    >
      {icon}
      <Text style={{ fontSize: s.fontSize, fontWeight: '600', color: v._textColor, fontFamily: 'Inter_600SemiBold' }}>
        {typeof children === 'string' ? children : ''}
      </Text>
    </TouchableOpacity>
  );
}

// ── TEXT INPUT ────────────────────────────────────────────────────────────────
interface TextInputProps {
  placeholder?: string;
  value?: string;
  onChangeText?: (v: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  icon?: React.ReactNode;
  label?: string;
  secureTextEntry?: boolean;
  focused?: boolean;
  style?: ViewStyle;
  autoFocus?: boolean;
  keyboardType?: 'default' | 'email-address' | 'phone-pad' | 'numeric';
}

export function TextInput({
  placeholder,
  value,
  onChangeText,
  onFocus,
  onBlur,
  icon,
  label,
  focused,
  style,
  autoFocus,
  keyboardType,
  secureTextEntry,
}: TextInputProps) {
  return (
    <View style={{ gap: 6 }}>
      {label && (
        <Text style={{ fontSize: T.font.sm, fontWeight: '600', color: T.text3, letterSpacing: 0.4, textTransform: 'uppercase' }}>
          {label}
        </Text>
      )}
      <View style={[{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: T.gray100,
        borderRadius: T.radius.md,
        height: 52,
        paddingHorizontal: icon ? T.space.md : T.space.lg,
        gap: T.space.sm,
        borderWidth: 1.5,
        borderColor: focused ? T.primary : 'transparent',
      }, style]}>
        {icon}
        <RNTextInput
          placeholder={placeholder}
          value={value}
          onChangeText={onChangeText}
          onFocus={onFocus}
          onBlur={onBlur}
          autoFocus={autoFocus}
          keyboardType={keyboardType}
          secureTextEntry={secureTextEntry}
          placeholderTextColor={T.text4}
          style={{ flex: 1, fontSize: T.font.lg, color: T.text }}
        />
      </View>
    </View>
  );
}

// ── AVATAR ────────────────────────────────────────────────────────────────────
interface AvatarProps {
  initials?: string;
  bg?: string;
  size?: number;
  photoUrl?: string;
  style?: ViewStyle;
}

export function Avatar({ initials = '?', bg = T.primary, size = 44, photoUrl, style }: AvatarProps) {
  return (
    <View style={[{ width: size, height: size, borderRadius: size / 2, backgroundColor: bg, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }, style]}>
      {photoUrl ? (
        <Image source={{ uri: photoUrl }} style={{ width: size, height: size }} />
      ) : (
        <Text style={{ fontSize: size * 0.35, fontWeight: '700', color: 'white' }}>{initials}</Text>
      )}
    </View>
  );
}

// ── CHIP ──────────────────────────────────────────────────────────────────────
interface ChipProps {
  children: React.ReactNode;
  variant?: ChipVariant;
  size?: 'sm' | 'md';
  icon?: React.ReactNode;
  onPress?: () => void;
  active?: boolean;
  style?: ViewStyle;
}

export function Chip({ children, variant = 'default', size = 'md', icon, onPress, active, style }: ChipProps) {
  const c = active ? chipColors.primary : chipColors[variant];
  const px = size === 'sm' ? 10 : 14;
  const py = size === 'sm' ? 5 : 7;
  const Wrapper = onPress ? TouchableOpacity : View;
  return (
    <Wrapper onPress={onPress} activeOpacity={0.85} style={[{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: px, paddingVertical: py, borderRadius: T.radius.full, backgroundColor: c.bg }, style]}>
      {icon}
      <Text style={{ fontSize: size === 'sm' ? T.font.sm : T.font.md, fontWeight: '600', color: c.text }}>{children}</Text>
    </Wrapper>
  );
}

// ── BADGE ─────────────────────────────────────────────────────────────────────
export function Badge({ children, variant = 'default' }: { children: string; variant?: ChipVariant }) {
  const c = chipColors[variant];
  return (
    <View style={{ paddingHorizontal: T.space.sm, paddingVertical: 3, borderRadius: T.radius.full, backgroundColor: c.bg }}>
      <Text style={{ fontSize: T.font.xs, fontWeight: '700', color: c.text, textTransform: 'uppercase', letterSpacing: 0.2 }}>{children}</Text>
    </View>
  );
}

// ── STATUS PILL ───────────────────────────────────────────────────────────────
export function StatusPill({ variant = 'blue', children, style }: { variant?: StatusPillVariant; children: string; style?: ViewStyle }) {
  const c = statusPillColors[variant];
  return (
    <View style={[{ flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: c.bg, borderRadius: T.radius.full, paddingHorizontal: T.space.md, paddingVertical: 7 }, style]}>
      <View style={{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: c.dot }} />
      <Text style={{ fontSize: T.font.md, fontWeight: '700', color: c.text }}>{children}</Text>
    </View>
  );
}

// ── ICON BOX ──────────────────────────────────────────────────────────────────
export function IconBox({ icon, bg = T.gray100, size = 40, radius, style }: { icon: React.ReactNode; bg?: string; size?: number; radius?: number; style?: ViewStyle }) {
  return (
    <View style={[{ width: size, height: size, borderRadius: radius ?? T.radius.md, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }, style]}>
      {icon}
    </View>
  );
}

// ── DIVIDER ───────────────────────────────────────────────────────────────────
export function Divider({ style }: { style?: ViewStyle }) {
  return <View style={[{ height: 1, backgroundColor: T.border }, style]} />;
}

// ── SECTION HEADER ────────────────────────────────────────────────────────────
export function SectionHeader({ children, style }: { children: string; style?: TextStyle }) {
  return (
    <Text style={[{ fontSize: T.font.xs, fontWeight: '700', color: T.text4, letterSpacing: 0.8, textTransform: 'uppercase' }, style]}>
      {children}
    </Text>
  );
}

// ── HANDLE BAR ────────────────────────────────────────────────────────────────
export function HandleBar() {
  return <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: T.gray300, alignSelf: 'center', marginBottom: T.space.xl }} />;
}

// ── BACK BUTTON ───────────────────────────────────────────────────────────────
export function BackButton({ onPress, light }: { onPress?: () => void; light?: boolean }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: light ? 'rgba(255,255,255,0.18)' : T.gray100, alignItems: 'center', justifyContent: 'center' }}>
      <Ionicons name="chevron-back" size={20} color={light ? T.white : T.primary} />
    </TouchableOpacity>
  );
}

// ── CLOSE BUTTON ──────────────────────────────────────────────────────────────
export function CloseButton({ onPress }: { onPress?: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: T.gray100, alignItems: 'center', justifyContent: 'center' }}>
      <Ionicons name="close" size={18} color={T.text3} />
    </TouchableOpacity>
  );
}

// ── STAR RATING ───────────────────────────────────────────────────────────────
export function StarRating({ rating, size = 16, interactive, onChange }: { rating: number; size?: number; interactive?: boolean; onChange?: (r: number) => void }) {
  return (
    <View style={{ flexDirection: 'row', gap: 4 }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <TouchableOpacity key={star} disabled={!interactive} onPress={() => onChange?.(star)} activeOpacity={0.7}>
          <Ionicons name={star <= rating ? 'star' : 'star-outline'} size={size} color={star <= rating ? '#FBBF24' : T.gray300} />
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ── INFO ROW ──────────────────────────────────────────────────────────────────
export function InfoRow({ label, value, valueColor, style }: { label: string; value: string | number; valueColor?: string; style?: ViewStyle }) {
  return (
    <View style={[{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, style]}>
      <Text style={{ fontSize: T.font.base, color: T.text3 }}>{label}</Text>
      <Text style={{ fontSize: T.font.base, fontWeight: '600', color: valueColor ?? T.text }}>{value}</Text>
    </View>
  );
}

// ── CARD ──────────────────────────────────────────────────────────────────────
export function Card({ children, style, onPress, padding }: { children: React.ReactNode; style?: ViewStyle; onPress?: () => void; padding?: number }) {
  const Wrapper = onPress ? TouchableOpacity : View;
  return (
    <Wrapper onPress={onPress} activeOpacity={0.9} style={[{ backgroundColor: T.white, borderRadius: T.radius.lg, padding: padding ?? T.space.lg, ...shadows.sm }, style]}>
      {children}
    </Wrapper>
  );
}

// ── SETTINGS ITEM ─────────────────────────────────────────────────────────────
export function SettingsItem({ icon, label, value, onPress, danger }: { icon: React.ReactNode; label: string; value?: string; onPress?: () => void; danger?: boolean }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14, paddingHorizontal: 2 }}>
      <IconBox icon={icon} bg={danger ? T.redLight : T.gray100} size={40} />
      <Text style={{ flex: 1, fontSize: T.font.lg, fontWeight: '500', color: danger ? T.red : T.text }}>{label}</Text>
      {value && <Text style={{ fontSize: T.font.base, color: T.text4 }}>{value}</Text>}
      {!danger && <Ionicons name="chevron-forward" size={16} color={T.text4} />}
    </TouchableOpacity>
  );
}

// ── SETTINGS GROUP ────────────────────────────────────────────────────────────
export function SettingsGroup({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return (
    <View style={[{ backgroundColor: T.white, borderRadius: T.radius.lg, paddingVertical: T.space.xs, paddingHorizontal: 14, marginBottom: T.space.md, ...shadows.sm, shadowOpacity: 0.04 }, style]}>
      {children}
    </View>
  );
}

// ── CTA BAR ───────────────────────────────────────────────────────────────────
export function CtaBar({ children, topRow, style }: { children: React.ReactNode; topRow?: React.ReactNode; style?: ViewStyle }) {
  return (
    <View style={[{ paddingHorizontal: T.space.xl, paddingTop: T.space.md, paddingBottom: 28, borderTopWidth: 1, borderTopColor: T.border, backgroundColor: T.white }, style]}>
      {topRow && <View style={{ marginBottom: T.space.md }}>{topRow}</View>}
      {children}
    </View>
  );
}

// ── ADDRESS ROUTE ─────────────────────────────────────────────────────────────
export function AddressRoute({ from, to, style }: { from: string; to: string; style?: ViewStyle }) {
  return (
    <View style={[{ flexDirection: 'row', gap: T.space.md }, style]}>
      <View style={{ alignItems: 'center', paddingTop: 4 }}>
        <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: T.blue }} />
        <View style={{ width: 1.5, flex: 1, backgroundColor: T.gray300, marginVertical: 4, minHeight: 20 }} />
        <View style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: T.primary }} />
      </View>
      <View style={{ flex: 1, gap: T.space.md }}>
        <View>
          <Text style={{ fontSize: T.font.sm, color: T.text4, marginBottom: 2 }}>Pickup</Text>
          <Text style={{ fontSize: T.font.lg, fontWeight: '600', color: T.text }}>{from}</Text>
        </View>
        <View>
          <Text style={{ fontSize: T.font.sm, color: T.text4, marginBottom: 2 }}>Drop-off</Text>
          <Text style={{ fontSize: T.font.lg, fontWeight: '600', color: T.text }}>{to}</Text>
        </View>
      </View>
    </View>
  );
}

// ── CONTACT ROW ───────────────────────────────────────────────────────────────
export function ContactRow({ onCall, onMessage, style }: { onCall?: () => void; onMessage?: () => void; style?: ViewStyle }) {
  const btnStyle: ViewStyle = { flex: 1, height: 46, borderRadius: T.radius.lg, backgroundColor: T.gray100, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 };
  return (
    <View style={[{ flexDirection: 'row', gap: 10 }, style]}>
      <TouchableOpacity onPress={onCall} activeOpacity={0.7} style={btnStyle}>
        <Ionicons name="call-outline" size={15} color={T.text} />
        <Text style={{ fontSize: T.font.base, fontWeight: '600', color: T.text }}>Call</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={onMessage} activeOpacity={0.7} style={btnStyle}>
        <Ionicons name="chatbubble-outline" size={15} color={T.text} />
        <Text style={{ fontSize: T.font.base, fontWeight: '600', color: T.text }}>Message</Text>
      </TouchableOpacity>
    </View>
  );
}

// ── EMPTY STATE ───────────────────────────────────────────────────────────────
export function EmptyState({ emoji = '📭', title, subtitle, action }: { emoji?: string; title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', padding: T.space['4xl'], gap: T.space.sm }}>
      <Text style={{ fontSize: 48, marginBottom: T.space.sm }}>{emoji}</Text>
      <Text style={{ fontSize: T.font['2xl'], fontWeight: '700', color: T.text, textAlign: 'center' }}>{title}</Text>
      {subtitle && <Text style={{ fontSize: T.font.base, color: T.text3, textAlign: 'center', maxWidth: 260, lineHeight: 21 }}>{subtitle}</Text>}
      {action && <View style={{ marginTop: T.space.lg }}>{action}</View>}
    </View>
  );
}

// ── LOADING DOTS ──────────────────────────────────────────────────────────────
export function LoadingDots({ color = T.white }: { color?: string }) {
  return (
    <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
      {[0, 1, 2].map((i) => (
        <View key={i} style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: color, opacity: 0.6 }} />
      ))}
    </View>
  );
}

// ── PLACE ROW ─────────────────────────────────────────────────────────────────
const placeIcons: Record<string, string> = { home: 'home-outline', work: 'briefcase-outline', recent: 'time-outline', saved: 'star-outline', suggestion: 'location-outline' };

export function PlaceRow({ name, address, type = 'recent', distance, onPress }: { name: string; address: string; type?: string; distance?: number; onPress?: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 13, borderRadius: T.radius.md }}>
      <IconBox icon={<Ionicons name={(placeIcons[type] || 'location-outline') as any} size={16} color={T.text3} />} />
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: T.font.base, fontWeight: '600', color: T.text }} numberOfLines={1}>{name}</Text>
        <Text style={{ fontSize: T.font.sm, color: T.text3, marginTop: 2 }} numberOfLines={1}>{address}</Text>
      </View>
      {distance !== undefined && <Text style={{ fontSize: T.font.sm, color: T.text4 }}>{distance} km</Text>}
      <Ionicons name="chevron-forward" size={16} color={T.text4} />
    </TouchableOpacity>
  );
}
