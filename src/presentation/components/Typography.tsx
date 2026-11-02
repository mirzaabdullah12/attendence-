import React from 'react';
import { Text, type TextProps } from 'react-native';
import { useTheme, type Palette, type typography } from '../theme';

type Variant = keyof typeof typography;
type Tone = 'text' | 'muted' | 'faint' | 'success' | 'warning' | 'danger' | 'info' | 'onPrimary';

interface Props extends TextProps {
  variant?: Variant;
  tone?: Tone;
  center?: boolean;
}

const toneKey: Record<Tone, keyof Palette> = {
  text: 'text',
  muted: 'textMuted',
  faint: 'textFaint',
  success: 'success',
  warning: 'warning',
  danger: 'danger',
  info: 'info',
  onPrimary: 'onPrimary',
};

export function AppText({ variant = 'body', tone = 'text', center, style, ...rest }: Props) {
  const theme = useTheme();
  return (
    <Text
      {...rest}
      style={[
        theme.typography[variant],
        { color: theme.colors[toneKey[tone]] },
        center && { textAlign: 'center' },
        style,
      ]}
    />
  );
}
