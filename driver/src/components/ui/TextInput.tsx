// ─── TextInput Component ──────────────────────────────────────────────────────
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput as RNTextInput,
  StyleSheet,
  type TextInputProps as RNTextInputProps,
  type ViewStyle,
} from 'react-native';
import { DT } from '@/src/theme/tokens';

type TextInputProps = RNTextInputProps & {
  label?: string;
  icon?: React.ReactNode;
  error?: string;
  containerStyle?: ViewStyle;
};

export function TextInput({
  label,
  icon,
  error,
  containerStyle,
  style,
  ...props
}: TextInputProps) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={[styles.wrapper, containerStyle]}>
      {label && (
        <Text style={styles.label}>{label}</Text>
      )}
      <View
        style={[
          styles.inputRow,
          focused && styles.inputFocused,
          error ? styles.inputError : null,
        ]}
      >
        {icon && <View style={styles.iconWrapper}>{icon}</View>}
        <RNTextInput
          style={[styles.input, icon ? styles.inputWithIcon : null, style]}
          placeholderTextColor={DT.textFaint}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          {...props}
        />
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 8,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
    color: DT.textLabel,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: DT.bgCard,
    borderWidth: 1,
    borderColor: DT.border,
    borderRadius: 14,
    height: 52,
    paddingHorizontal: 16,
  },
  inputFocused: {
    borderColor: DT.assigned,
    backgroundColor: DT.assignedBg,
  },
  inputError: {
    borderColor: DT.offline,
  },
  iconWrapper: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: DT.text,
    fontFamily: 'Inter_500Medium',
  },
  inputWithIcon: {
    paddingLeft: 0,
  },
  errorText: {
    fontSize: 12,
    color: DT.offline,
    fontFamily: 'Inter_400Regular',
  },
});
