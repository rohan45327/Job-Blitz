import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Feather, Ionicons } from '@expo/vector-icons';
import { Typography, Spacing, Radius, Shadow } from '../../theme/tokens';
import { useTheme } from '../../theme/ThemeContext';

type FeatherName = React.ComponentProps<typeof Feather>['name'];
type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

const TAB_CONFIG: Record<string, { icon: FeatherName | IoniconName; lib: 'Feather' | 'Ionicons'; label: string }> = {
  Home:         { icon: 'briefcase',  lib: 'Feather',   label: 'Feed' },
  Prepare:      { icon: 'target',     lib: 'Feather',   label: 'Prepare' },
  Applications: { icon: 'file-text',  lib: 'Feather',   label: 'Applied' },
  Watchlist:    { icon: 'eye',        lib: 'Feather',   label: 'Watch' },
  Profile:      { icon: 'user',       lib: 'Feather',   label: 'Profile' },
};

export function TabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <View style={[styles.bar, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
        {state.routes.map((route, index) => {
          const isFocused = state.index === index;
          const cfg = TAB_CONFIG[route.name];
          const iconColor = isFocused ? colors.primary : colors.textMuted;

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
              style={[styles.tab, isFocused && { backgroundColor: colors.primary + '18' }]}
              onPress={onPress}
              activeOpacity={0.75}
            >
              {cfg?.lib === 'Feather' ? (
                <Feather name={cfg.icon as FeatherName} size={20} color={iconColor} />
              ) : (
                <Ionicons name={cfg?.icon as IoniconName} size={20} color={iconColor} />
              )}
              <Text style={[styles.label, { color: iconColor }]}>
                {cfg?.label ?? route.name}
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
    bottom: 20,
    left: 16,
    right: 16,
  },
  bar: {
    flexDirection: 'row',
    borderRadius: Radius['2xl'],
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.xs,
    borderWidth: 1,
    ...Shadow.md,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderRadius: Radius.xl,
    gap: 3,
  },
  label: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
});
