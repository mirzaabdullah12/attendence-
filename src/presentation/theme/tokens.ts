export type ThemeMode = 'system' | 'light' | 'dark';
export type ColorScheme = 'light' | 'dark';

export interface Palette {
  bg: string;
  surface: string;
  surfaceAlt: string;
  border: string;
  text: string;
  textMuted: string;
  textFaint: string;
  primary: string;
  onPrimary: string;
  success: string;
  successSoft: string;
  warning: string;
  warningSoft: string;
  danger: string;
  dangerSoft: string;
  info: string;
  infoSoft: string;
  overlay: string;
}

export const lightPalette: Palette = {
  bg: '#F4F5F7',
  surface: '#FFFFFF',
  surfaceAlt: '#EDEFF2',
  border: '#E1E4E9',
  text: '#0E1116',
  textMuted: '#5F6673',
  textFaint: '#9AA1AC',
  primary: '#0E1116',
  onPrimary: '#FFFFFF',
  success: '#0F9D6E',
  successSoft: '#E1F6EE',
  warning: '#D98A0B',
  warningSoft: '#FCF1DB',
  danger: '#D63B3B',
  dangerSoft: '#FBE4E4',
  info: '#2563EB',
  infoSoft: '#E4ECFD',
  overlay: 'rgba(14,17,22,0.45)',
};

export const darkPalette: Palette = {
  bg: '#0B0D10',
  surface: '#15181D',
  surfaceAlt: '#1C2026',
  border: '#272C34',
  text: '#F3F5F7',
  textMuted: '#9AA3B0',
  textFaint: '#5F6774',
  primary: '#F3F5F7',
  onPrimary: '#0B0D10',
  success: '#34D399',
  successSoft: '#10302A',
  warning: '#FBBF24',
  warningSoft: '#3A2D0E',
  danger: '#F87171',
  dangerSoft: '#3B1818',
  info: '#60A5FA',
  infoSoft: '#15233B',
  overlay: 'rgba(0,0,0,0.6)',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 18,
  xl: 28,
  pill: 999,
} as const;

export const typography = {
  display: { fontSize: 44, fontWeight: '700' as const, letterSpacing: -1 },
  h1: { fontSize: 28, fontWeight: '700' as const, letterSpacing: -0.5 },
  h2: { fontSize: 20, fontWeight: '700' as const, letterSpacing: -0.3 },
  h3: { fontSize: 16, fontWeight: '600' as const },
  body: { fontSize: 15, fontWeight: '400' as const },
  bodyStrong: { fontSize: 15, fontWeight: '600' as const },
  small: { fontSize: 13, fontWeight: '400' as const },
  caption: { fontSize: 12, fontWeight: '500' as const, letterSpacing: 0.3 },
  mono: { fontSize: 15, fontWeight: '600' as const, fontVariant: ['tabular-nums'] as const },
};

export interface Theme {
  scheme: ColorScheme;
  colors: Palette;
  spacing: typeof spacing;
  radius: typeof radius;
  typography: typeof typography;
}

export function buildTheme(scheme: ColorScheme): Theme {
  return {
    scheme,
    colors: scheme === 'dark' ? darkPalette : lightPalette,
    spacing,
    radius,
    typography,
  };
}
