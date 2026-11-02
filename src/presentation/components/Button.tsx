import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View, type ViewStyle } from 'react-native';
import { useTheme } from '../theme';
import { AppText } from './Typography';

type Variant = 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

interface Props {
  title: string;
  onPress?: () => void;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  fullWidth?: boolean;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading,
  disabled,
  icon,
  style,
  fullWidth,
}: Props) {
  const { colors, radius } = useTheme();
  const palette: Record<Variant, { bg: string; fg: string; border: string }> = {
    primary: { bg: colors.primary, fg: colors.onPrimary, border: colors.primary },
    secondary: { bg: colors.surface, fg: colors.text, border: colors.border },
    success: { bg: colors.success, fg: '#FFFFFF', border: colors.success },
    warning: { bg: colors.warning, fg: '#1A1200', border: colors.warning },
    danger: { bg: colors.danger, fg: '#FFFFFF', border: colors.danger },
    ghost: { bg: 'transparent', fg: colors.textMuted, border: 'transparent' },
  };
  const p = palette[variant];
  const height = { sm: 38, md: 48, lg: 58 }[size];
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: p.bg,
          borderColor: p.border,
          height,
          borderRadius: radius.md,
          opacity: isDisabled ? 0.5 : pressed ? 0.85 : 1,
          transform: [{ scale: pressed ? 0.985 : 1 }],
        },
        fullWidth && { alignSelf: 'stretch' },
        style,
      ]}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled }}
    >
      {loading ? (
        <ActivityIndicator color={p.fg} />
      ) : (
        <View style={styles.content}>
          {icon}
          <AppText
            variant={size === 'lg' ? 'h3' : 'bodyStrong'}
            style={{ color: p.fg, fontSize: size === 'sm' ? 13 : undefined }}
          >
            {title}
          </AppText>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderWidth: 1,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});
