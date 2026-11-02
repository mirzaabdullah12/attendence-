import React from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText } from './Typography';

export function EmptyState({ title, body }: { title: string; body?: string }) {
  return (
    <View style={styles.wrap}>
      <AppText variant="h3" center>
        {title}
      </AppText>
      {body ? (
        <AppText variant="small" tone="muted" center>
          {body}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingVertical: 32, alignItems: 'center', gap: 6 },
});
