// ─── Design System Tokens ───────────────────────────────────────────────────

export const Colors = {
  // Brand
  primary: '#6C63FF',       // electric violet
  primaryLight: '#9D96FF',
  primaryDark: '#4A43CC',
  accent: '#00D9FF',        // electric cyan
  accentDark: '#00AACC',

  // Status
  success: '#00E096',
  warning: '#FFB938',
  danger: '#FF4D6A',
  info: '#60A5FA',

  // Neutrals (dark theme)
  background: '#0A0A0F',
  surface: '#12121A',
  surfaceElevated: '#1C1C28',
  surfaceHighlight: '#252535',
  border: '#2A2A3E',
  borderLight: '#3A3A54',

  // Text
  textPrimary: '#F0F0FF',
  textSecondary: '#9898B8',
  textMuted: '#5C5C7A',
  textInverse: '#0A0A0F',

  // Overlays
  overlay: 'rgba(10, 10, 15, 0.85)',
  glass: 'rgba(255, 255, 255, 0.05)',
  glassBorder: 'rgba(255, 255, 255, 0.1)',
} as const;

export const Typography = {
  // Font families (requires loading via expo-font or system)
  fontFamily: {
    regular: 'System',
    medium: 'System',
    semiBold: 'System',
    bold: 'System',
  },

  // Font sizes
  xs: 11,
  sm: 13,
  base: 15,
  md: 17,
  lg: 20,
  xl: 24,
  '2xl': 28,
  '3xl': 34,
  '4xl': 42,

  // Line heights
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
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  '2xl': 28,
  full: 9999,
} as const;

export const Shadow = {
  sm: {
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  lg: {
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
} as const;
