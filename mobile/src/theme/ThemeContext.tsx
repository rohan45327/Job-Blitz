import React, { createContext, useContext, useState } from 'react';
import { Colors, LightColors } from './tokens';

export interface ThemeColors {
  primary: string;
  primaryLight: string;
  primaryDark: string;
  accent: string;
  success: string;
  warning: string;
  danger: string;
  info: string;
  background: string;
  surface: string;
  surfaceElevated: string;
  surfaceHighlight: string;
  border: string;
  borderLight: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textInverse: string;
  overlay: string;
  glass: string;
  glassBorder: string;
  cardBg: string;
  badgeHighMatch: string;
  mode: 'dark' | 'light';
}

const darkColors: ThemeColors = {
  ...Colors,
  cardBg: Colors.surface,
  badgeHighMatch: Colors.success,
  mode: 'dark',
};

const lightColors: ThemeColors = {
  ...LightColors,
  cardBg: LightColors.surface,
  badgeHighMatch: LightColors.success,
  mode: 'light',
};

interface ThemeContextType {
  colors: ThemeColors;
  isDark: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  colors: darkColors,
  isDark: true,
  toggleTheme: () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDark, setIsDark] = useState(true);

  const toggleTheme = () => setIsDark((prev) => !prev);
  const colors = isDark ? darkColors : lightColors;

  return (
    <ThemeContext.Provider value={{ colors, isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
