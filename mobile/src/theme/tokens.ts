// ─── Design System Tokens ───────────────────────────────────────────────────
// Twitter/X-inspired minimalist: pure black (dark) ↔ pure white (light)

export const Colors = {
  // Brand — X/Twitter Blue
  primary: '#1D9BF0',
  primaryLight: '#60B8F5',
  primaryDark: '#1678C1',
  accent: '#1D9BF0',
  accentDark: '#1678C1',

  // Status
  success: '#00BA7C',
  warning: '#FFB938',
  danger: '#F4212E',
  info: '#1D9BF0',

  // Neutrals — DARK mode (major black, minor white)
  background: '#000000',
  surface: '#0A0A0A',
  surfaceElevated: '#111111',
  surfaceHighlight: '#1A1A1A',
  border: '#2F3336',
  borderLight: '#3E4144',

  // Text — dark mode
  textPrimary: '#E7E9EA',
  textSecondary: '#71767B',
  textMuted: '#3E4144',
  textInverse: '#000000',

  // Overlays
  overlay: 'rgba(0, 0, 0, 0.9)',
  glass: 'rgba(255, 255, 255, 0.04)',
  glassBorder: 'rgba(255, 255, 255, 0.08)',
} as const;

export const LightColors = {
  primary: '#1D9BF0',
  primaryLight: '#1678C1',
  primaryDark: '#0F6AB0',
  accent: '#1D9BF0',
  accentDark: '#0F6AB0',

  success: '#00BA7C',
  warning: '#D97706',
  danger: '#DC2626',
  info: '#1D9BF0',

  // LIGHT mode (major white, minor black)
  background: '#FFFFFF',
  surface: '#F7F9F9',
  surfaceElevated: '#EFF3F4',
  surfaceHighlight: '#E7E7E7',
  border: '#CFD9DE',
  borderLight: '#E2E8F0',

  textPrimary: '#0F1419',
  textSecondary: '#536471',
  textMuted: '#8899A6',
  textInverse: '#FFFFFF',

  overlay: 'rgba(255, 255, 255, 0.9)',
  glass: 'rgba(0, 0, 0, 0.03)',
  glassBorder: 'rgba(0, 0, 0, 0.06)',
} as const;

export const Typography = {
  fontFamily: {
    regular: 'System',
    medium: 'System',
    semiBold: 'System',
    bold: 'System',
  },

  xs: 11,
  sm: 13,
  base: 15,
  md: 17,
  lg: 20,
  xl: 24,
  '2xl': 28,
  '3xl': 34,
  '4xl': 42,

  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 48,
  '5xl': 64,
} as const;

export const Radius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 24,
  full: 9999,
} as const;

export const Shadow = {
  sm: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
} as const;
