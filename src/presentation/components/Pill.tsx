import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '../theme';
import { AppText } from './Typography';

type Tone = 'neutral' | 'success' | 'warning' | 'danger' | 'info';

interface Props {
  label: string;
  tone?: Tone;
  dot?: boolean;
}

export function Pill({ label, tone = 'neutral', dot }: Props) {
  const { colors, radius } = useTheme();
  const map: Record<Tone, { bg: string; fg: string }> = {
    neutral: { bg: colors.surfaceAlt, fg: colors.textMuted },
    success: { bg: colors.successSoft, fg: colors.success },
    warning: { bg: colors.warningSoft, fg: colors.warning },
    danger: { bg: colors.dangerSoft, fg: colors.danger },
    info: { bg: colors.infoSoft, fg: colors.info },
  };
  const { bg, fg } = map[tone];
  return (
    <View style={[styles.pill, { backgroundColor: bg, borderRadius: radius.pill }]}>
      {dot && <View style={[styles.dot, { backgroundColor: fg }]} />}
      <AppText variant="caption" style={{ color: fg }}>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    alignSelf: 'flex-start',
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
});
