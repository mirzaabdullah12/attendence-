import React from 'react';
import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';
import { useTheme } from '../theme';
import { AppText } from './Typography';

interface Props extends TextInputProps {
  label: string;
  hint?: string;
}

export function Field({ label, hint, style, ...rest }: Props) {
  const { colors, radius } = useTheme();
  return (
    <View style={styles.wrap}>
      <AppText variant="caption" tone="muted">
        {label.toUpperCase()}
      </AppText>
      <TextInput
        {...rest}
        placeholderTextColor={colors.textFaint}
        style={[
          styles.input,
          { backgroundColor: colors.surfaceAlt, color: colors.text, borderColor: colors.border, borderRadius: radius.md },
          style,
        ]}
      />
      {hint ? (
        <AppText variant="small" tone="faint">
          {hint}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  input: { height: 48, paddingHorizontal: 14, fontSize: 15, borderWidth: 1 },
});
