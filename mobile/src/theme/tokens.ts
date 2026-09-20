// ─── Design System Tokens ───────────────────────────────────────────────────
// Twitter/X-inspired minimalist: pure black (dark) ↔ pure white (light)

export const Colors = {
  // Brand — iQOO Cyber Gold & Deep Purple
  primary: '#FFB800',
  primaryLight: '#FFC837',
  primaryDark: '#D49800',
  accent: '#8B5CF6',
  accentDark: '#7C3AED',
  iqooGold: '#FFB800',
  iqooYellow: '#F5C518',
  cyberBlue: '#00E5FF',

  // Status
  success: '#00BA7C',
  warning: '#FFB938',
  danger: '#F4212E',
  info: '#00E5FF',

  // Neutrals — DARK mode (major cyber black, minor gold)
  background: '#08080A',
  surface: '#111116',
  surfaceElevated: '#1A1A22',
  surfaceHighlight: '#262632',
  border: '#2A2A38',
  borderLight: '#3D3D52',

  // Text — dark mode
  textPrimary: '#F3F4F6',
  textSecondary: '#9CA3AF',
  textMuted: '#6B7280',
  textInverse: '#08080A',

  // Overlays & Glass
  overlay: 'rgba(8, 8, 10, 0.92)',
  glass: 'rgba(255, 184, 0, 0.05)',
  glassBorder: 'rgba(255, 184, 0, 0.2)',
} as const;

export const LightColors = {
  primary: '#8B5CF6',
  primaryLight: '#7C3AED',
  primaryDark: '#6D28D9',
  accent: '#8B5CF6',
  accentDark: '#6D28D9',

  success: '#00BA7C',
  warning: '#D97706',
  danger: '#DC2626',
  info: '#8B5CF6',

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
