import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTheme } from '../theme';
import { AppText } from './Typography';

interface Option<T extends string> {
  value: T;
  label: string;
}

interface Props<T extends string> {
  value: T;
  options: Option<T>[];
  onChange: (value: T) => void;
}

export function Segmented<T extends string>({ value, options, onChange }: Props<T>) {
  const { colors, radius } = useTheme();
  return (
    <View style={[styles.track, { backgroundColor: colors.surfaceAlt, borderRadius: radius.md }]}>
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            style={[
              styles.segment,
              { borderRadius: radius.sm },
              active && { backgroundColor: colors.primary },
            ]}
          >
            <AppText variant="caption" style={{ color: active ? colors.onPrimary : colors.textMuted }}>
              {opt.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: { flexDirection: 'row', padding: 4, gap: 4 },
  segment: { flex: 1, paddingVertical: 9, alignItems: 'center' },
});
