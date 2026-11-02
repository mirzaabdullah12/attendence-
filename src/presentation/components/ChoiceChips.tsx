import React from 'react';
import { Pressable, ScrollView, StyleSheet } from 'react-native';
import { useTheme } from '../theme';
import { AppText } from './Typography';

interface Choice<T extends string> {
  value: T;
  label: string;
  caption?: string;
}

interface Props<T extends string> {
  value: T | null;
  choices: Choice<T>[];
  onChange: (value: T) => void;
}

export function ChoiceChips<T extends string>({ value, choices, onChange }: Props<T>) {
  const { colors, radius } = useTheme();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {choices.map((c) => {
        const active = c.value === value;
        return (
          <Pressable
            key={c.value}
            onPress={() => onChange(c.value)}
            style={[
              styles.chip,
              {
                borderRadius: radius.md,
                backgroundColor: active ? colors.primary : colors.surfaceAlt,
                borderColor: active ? colors.primary : colors.border,
              },
            ]}
          >
            <AppText variant="bodyStrong" style={{ color: active ? colors.onPrimary : colors.text }}>
              {c.label}
            </AppText>
            {c.caption ? (
              <AppText variant="caption" style={{ color: active ? colors.onPrimary : colors.textMuted, opacity: 0.8 }}>
                {c.caption}
              </AppText>
            ) : null}
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: 8, paddingVertical: 2 },
  chip: { paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, gap: 2 },
});
