import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Typography, Spacing, Radius } from '../../theme/tokens';
import { useTheme } from '../../theme/ThemeContext';

interface Props {
  matchScore: number;       // 0.0 to 1.0
  readinessScore?: number;  // 0.0 to 1.0
  freshness?: string;      // VERY_FRESH | FRESH | AGING | STALE
}

export function ReadinessBadge({ matchScore, readinessScore = 0.75, freshness }: Props) {
  const { colors } = useTheme();

  const matchPercent = Math.round(matchScore * 100);
  const readinessPercent = Math.round(readinessScore * 100);

  const matchColor =
    matchScore >= 0.75 ? colors.primary : matchScore >= 0.6 ? colors.warning : colors.textMuted;

  const readinessColor =
    readinessScore >= 0.75 ? colors.success : readinessScore >= 0.6 ? colors.warning : colors.textMuted;

  return (
    <View style={styles.container}>
      {/* Match Badge */}
      <View style={[styles.badge, { backgroundColor: matchColor + '16', borderColor: matchColor + '40' }]}>
        <Text style={[styles.badgeText, { color: matchColor }]}>{matchPercent}% Match</Text>
      </View>

      {/* Readiness Badge */}
      <View style={[styles.badge, { backgroundColor: readinessColor + '16', borderColor: readinessColor + '40' }]}>
        <Feather name="target" size={10} color={readinessColor} />
        <Text style={[styles.badgeText, { color: readinessColor }]}>{readinessPercent}% Ready</Text>
      </View>

      {/* Freshness Badge */}
      {freshness === 'VERY_FRESH' && (
        <View style={[styles.badge, { backgroundColor: colors.accent + '16', borderColor: colors.accent + '40' }]}>
          <Feather name="zap" size={10} color={colors.accent} />
          <Text style={[styles.badgeText, { color: colors.accent }]}>Very Fresh</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    flexWrap: 'wrap',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: Typography.xs - 1,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
});
