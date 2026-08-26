import React, { createContext, useContext, useState } from 'react';

export interface ThemeColors {
  primary: string;
  primaryLight: string;
  accent: string;
  success: string;
  warning: string;
  danger: string;
  background: string;
  surface: string;
  surfaceElevated: string;
  surfaceHighlight: string;
  border: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  cardBg: string;
  badgeHighMatch: string;
  mode: 'dark' | 'light';
}

const darkColors: ThemeColors = {
  primary: '#6C63FF',
  primaryLight: '#9D96FF',
  accent: '#00D9FF',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  background: '#0A0A0F',
  surface: '#12121A',
  surfaceElevated: '#1C1C28',
  surfaceHighlight: '#252535',
  border: '#2A2A3E',
  textPrimary: '#F0F0FF',
  textSecondary: '#9898B8',
  textMuted: '#5C5C7A',
  cardBg: '#161622',
  badgeHighMatch: '#059669',
  mode: 'dark',
};

const lightColors: ThemeColors = {
  primary: '#4F46E5',
  primaryLight: '#6366F1',
  accent: '#0284C7',
  success: '#059669',
  warning: '#D97706',
  danger: '#DC2626',
  background: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceElevated: '#F1F5F9',
  surfaceHighlight: '#E2E8F0',
  border: '#E2E8F0',
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#64748B',
  cardBg: '#FFFFFF',
  badgeHighMatch: '#047857',
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
