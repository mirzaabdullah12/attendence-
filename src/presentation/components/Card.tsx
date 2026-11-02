import React from 'react';
import { StyleSheet, View, type ViewProps } from 'react-native';
import { useTheme } from '../theme';

interface Props extends ViewProps {
  tone?: 'surface' | 'alt' | 'primary' | 'success' | 'warning' | 'danger' | 'info';
  padded?: boolean;
}

export function Card({ tone = 'surface', padded = true, style, ...rest }: Props) {
  const { colors, radius, spacing } = useTheme();
  const bg = {
    surface: colors.surface,
    alt: colors.surfaceAlt,
    primary: colors.primary,
    success: colors.successSoft,
    warning: colors.warningSoft,
    danger: colors.dangerSoft,
    info: colors.infoSoft,
  }[tone];
  const border = tone === 'surface' ? colors.border : 'transparent';
  return (
    <View
      {...rest}
      style={[
        styles.card,
        { backgroundColor: bg, borderColor: border, borderRadius: radius.lg },
        padded && { padding: spacing.lg },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
});
