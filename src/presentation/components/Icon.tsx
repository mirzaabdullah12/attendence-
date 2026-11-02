import React from 'react';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

export type IconName = 'clock' | 'calendar' | 'history' | 'pin' | 'user' | 'chevron-left' | 'chevron-right' | 'navigate' | 'star';

interface Props {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
}

/** Minimal line icon set drawn with react-native-svg (no icon font dependency). */
export function Icon({ name, size = 22, color = '#000', strokeWidth = 1.8 }: Props) {
  const common = { stroke: color, strokeWidth, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: 'none' };
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {name === 'clock' && (
        <>
          <Circle cx={12} cy={12} r={9} {...common} />
          <Path d="M12 7v5l3 2" {...common} />
        </>
      )}
      {name === 'calendar' && (
        <>
          <Rect x={3.5} y={5} width={17} height={15} rx={3} {...common} />
          <Path d="M3.5 10h17M8 3v4M16 3v4" {...common} />
        </>
      )}
      {name === 'history' && (
        <>
          <Path d="M4 12a8 8 0 1 0 2.3-5.6" {...common} />
          <Path d="M4 4v4.5h4.5" {...common} />
          <Path d="M12 8v4l2.5 1.5" {...common} />
        </>
      )}
      {name === 'pin' && (
        <>
          <Path d="M12 21s-6.5-5.3-6.5-11a6.5 6.5 0 0 1 13 0c0 5.7-6.5 11-6.5 11z" {...common} />
          <Circle cx={12} cy={10} r={2.3} {...common} />
        </>
      )}
      {name === 'user' && (
        <>
          <Circle cx={12} cy={8.5} r={3.8} {...common} />
          <Path d="M4.5 20c.8-3.7 3.8-5.8 7.5-5.8s6.7 2.1 7.5 5.8" {...common} />
        </>
      )}
      {name === 'chevron-left' && <Path d="M14.5 5.5L8 12l6.5 6.5" {...common} />}
      {name === 'chevron-right' && <Path d="M9.5 5.5L16 12l-6.5 6.5" {...common} />}
      {name === 'navigate' && <Path d="M20 4L4 11l7 2 2 7 7-16z" {...common} />}
      {name === 'star' && (
        <Path d="M12 2.5l1.8 5.7h6l-4.8 3.5 1.8 5.8-4.8-3.6-4.8 3.6 1.8-5.8L4.2 8.2h6z" {...common} />
      )}
    </Svg>
  );
}
