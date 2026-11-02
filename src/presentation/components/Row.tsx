import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTheme } from '../theme';
import { AppText } from './Typography';

interface Props {
  title: string;
  subtitle?: string;
  left?: React.ReactNode;
  right?: React.ReactNode;
  onPress?: () => void;
  last?: boolean;
}

/** A list row with optional leading/trailing slots and a hairline divider. */
export function Row({ title, subtitle, left, right, onPress, last }: Props) {
  const { colors } = useTheme();
  const content = (
    <View style={[styles.row, !last && { borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth }]}>
      {left && <View style={styles.left}>{left}</View>}
      <View style={styles.body}>
        <AppText variant="bodyStrong">{title}</AppText>
        {subtitle ? (
          <AppText variant="small" tone="muted">
            {subtitle}
          </AppText>
        ) : null}
      </View>
      {right && <View style={styles.right}>{right}</View>}
    </View>
  );
  if (!onPress) return content;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 12 },
  left: { width: 40, alignItems: 'center' },
  body: { flex: 1, gap: 2 },
  right: { alignItems: 'flex-end' },
});
