import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Typography, Spacing, Radius, Shadow } from '../../theme/tokens';
import { useTheme } from '../../theme/ThemeContext';

const TAB_ICONS: Record<string, string> = {
  Home: '⚡',
  Applications: '📋',
  Watchlist: '👁',
  Profile: '👤',
};

export function TabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <View style={[styles.bar, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const label = options.tabBarLabel ?? route.name;
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <TouchableOpacity
              key={route.key}
              style={[styles.tab, isFocused && { backgroundColor: colors.primary + '20' }]}
              onPress={onPress}
              activeOpacity={0.8}
            >
              <Text style={[styles.icon, { opacity: isFocused ? 1 : 0.4 }]}>
                {TAB_ICONS[route.name] ?? '●'}
              </Text>
              <Text style={[styles.label, { color: isFocused ? colors.primary : colors.textMuted }]}>
                {String(label)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 24,
    left: 20,
    right: 20,
  },
  bar: {
    flexDirection: 'row',
    borderRadius: Radius['2xl'],
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    borderWidth: 1,
    ...Shadow.lg,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderRadius: Radius.xl,
    gap: 3,
  },
  icon: {
    fontSize: 18,
  },
  label: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
});
