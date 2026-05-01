// ─── Button Component ─────────────────────────────────────────────────────────
import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
  type ViewStyle,
} from 'react-native';
import { DT } from '@/src/theme/tokens';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'green';

type ButtonProps = {
  children: React.ReactNode;
  onPress?: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
};

export function Button({
  children,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  fullWidth = false,
  icon,
  style,
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={typeof children === 'string' ? children : undefined}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      style={[
        styles.base,
        styles[variant],
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'ghost' ? DT.text : '#fff'}
        />
      ) : (
        <View style={styles.content}>
          {icon && <View style={styles.icon}>{icon}</View>}
          <Text style={[styles.label, styles[`${variant}Label` as keyof typeof styles]]}>
            {children}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  fullWidth: {
    width: '100%',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  icon: {
    marginRight: 2,
  },
  label: {
    fontSize: 15,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
    letterSpacing: -0.2,
  },
  disabled: {
    opacity: 0.5,
  },

  // Variant backgrounds
  primary: {
    backgroundColor: '#FFFFFF',
  },
  secondary: {
    backgroundColor: DT.bgCard,
    borderWidth: 1,
    borderColor: DT.border,
  },
  danger: {
    backgroundColor: DT.offlineBg,
    borderWidth: 1,
    borderColor: DT.offlineBorder,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  green: {
    backgroundColor: '#22C55E',
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },

  // Variant label colors
  primaryLabel: { color: '#0A0B0F' },
  secondaryLabel: { color: DT.text },
  dangerLabel: { color: '#FCA5A5' },
  ghostLabel: { color: DT.textMuted },
  greenLabel: { color: '#FFFFFF' },
});
