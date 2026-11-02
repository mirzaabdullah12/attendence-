import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Logo8Star } from './Logo8Star';
import { AppText } from './Typography';

interface Props {
  title?: string;
  subtitle?: string;
  right?: React.ReactNode;
}

export function AppHeader({ title, subtitle, right }: Props) {
  return (
    <View style={styles.wrap}>
      <View style={styles.top}>
        <Logo8Star size={30} />
        {right}
      </View>
      {(title || subtitle) && (
        <View style={styles.titles}>
          {title && <AppText variant="h1">{title}</AppText>}
          {subtitle && (
            <AppText variant="small" tone="muted">
              {subtitle}
            </AppText>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingTop: 8, gap: 14 },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  titles: { gap: 2 },
});
