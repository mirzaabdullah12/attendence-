import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTheme } from '../theme';
import { AppText } from './Typography';

interface Props {
  message: string;
  tone?: 'danger' | 'warning' | 'info' | 'success';
  onDismiss?: () => void;
}

export function Banner({ message, tone = 'danger', onDismiss }: Props) {
  const { colors, radius } = useTheme();
  const bg = { danger: colors.dangerSoft, warning: colors.warningSoft, info: colors.infoSoft, success: colors.successSoft }[tone];
  const fg = { danger: colors.danger, warning: colors.warning, info: colors.info, success: colors.success }[tone];
  return (
    <View style={[styles.wrap, { backgroundColor: bg, borderRadius: radius.md }]}>
      <AppText variant="small" style={{ color: fg, flex: 1 }}>
        {message}
      </AppText>
      {onDismiss && (
        <Pressable onPress={onDismiss} hitSlop={10}>
          <AppText variant="caption" style={{ color: fg }}>
            DISMISS
          </AppText>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 12 },
});
