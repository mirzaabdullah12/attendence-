import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Polygon } from 'react-native-svg';
import { useTheme } from '../theme';

interface Props {
  size?: number;
  /** Show the "8STAR" wordmark beside the mark */
  wordmark?: boolean;
  /** Force black-on-white or white-on-black regardless of theme */
  variant?: 'auto' | 'light' | 'dark';
}

/** Eight-pointed star built from two concentric point rings (outer/inner radius). */
function starPoints(cx: number, cy: number, outer: number, inner: number, points = 8): string {
  const step = Math.PI / points;
  const coords: string[] = [];
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const angle = i * step - Math.PI / 2;
    coords.push(`${(cx + r * Math.cos(angle)).toFixed(2)},${(cy + r * Math.sin(angle)).toFixed(2)}`);
  }
  return coords.join(' ');
}

export function Logo8Star({ size = 36, wordmark = true, variant = 'auto' }: Props) {
  const theme = useTheme();
  const scheme = variant === 'auto' ? theme.scheme : variant;
  const ink = scheme === 'dark' ? '#FFFFFF' : '#0B0D10';
  const paper = scheme === 'dark' ? '#0B0D10' : '#FFFFFF';
  const half = size / 2;

  return (
    <View style={styles.row}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Circle cx={half} cy={half} r={half} fill={ink} />
        <Polygon points={starPoints(half, half, half * 0.78, half * 0.36)} fill={paper} />
        <Circle cx={half} cy={half} r={half * 0.14} fill={ink} />
      </Svg>
      {wordmark && (
        <Text style={[styles.word, { color: ink, fontSize: size * 0.56 }]}>
          8<Text style={styles.wordLight}>STAR</Text>
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  word: { fontWeight: '800', letterSpacing: 2 },
  wordLight: { fontWeight: '400', letterSpacing: 3 },
});
