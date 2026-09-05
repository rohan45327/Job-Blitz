import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { api, ExecutiveSummaryOut } from '../../api/client';
import { useTheme } from '../../theme/ThemeContext';
import { Typography, Spacing, Radius, Shadow } from '../../theme/tokens';

export function ExecutiveDashboardPanel() {
  const { colors } = useTheme();

  const { data, isLoading } = useQuery<ExecutiveSummaryOut>({
    queryKey: ['executive-summary'],
    queryFn: () => api.getExecutiveSummary(),
    staleTime: 120_000,
  });

  if (isLoading) {
    return (
      <View style={[styles.panel, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <ActivityIndicator size="small" color={colors.primary} style={{ padding: Spacing.xl }} />
      </View>
    );
  }

  if (!data) return null;

  return (
    <View style={[styles.panel, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      {/* Panel Header */}
      <View style={styles.headerRow}>
        <View style={styles.titleGroup}>
          <Feather name="shield" size={16} color={colors.primary} />
          <Text style={[styles.title, { color: colors.textPrimary }]}>Executive Dashboard</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: colors.success + '18' }]}>
          <Text style={[styles.badgeText, { color: colors.success }]}>ACTIVE PIPELINE</Text>
        </View>
      </View>

      {/* KPI Grid */}
      <View style={styles.kpiGrid}>
        {data.kpis.map((kpi) => {
          const isPos = kpi.status_level === 'positive';
          const isWarn = kpi.status_level === 'warning';
          const badgeColor = isPos ? colors.success : isWarn ? colors.danger : colors.textMuted;
          return (
            <View
              key={kpi.label}
              style={[styles.kpiCard, { backgroundColor: colors.background, borderColor: colors.border }]}
            >
              <Text style={[styles.kpiLabel, { color: colors.textMuted }]}>{kpi.label}</Text>
              <Text style={[styles.kpiValue, { color: colors.textPrimary }]}>{kpi.value}</Text>
              <Text style={[styles.kpiChange, { color: badgeColor }]}>{kpi.change}</Text>
            </View>
          );
        })}
      </View>

      {/* Strategic Recommendation */}
      <View style={[styles.recBox, { backgroundColor: colors.primary + '0D', borderColor: colors.primary + '25' }]}>
        <Feather name="compass" size={14} color={colors.primary} style={{ marginTop: 2 }} />
        <View style={{ flex: 1 }}>
          <Text style={[styles.recTitle, { color: colors.primary }]}>Strategic Directive</Text>
          <Text style={[styles.recText, { color: colors.textSecondary }]}>{data.strategic_recommendation}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    marginHorizontal: Spacing.base,
    marginBottom: Spacing.base,
    borderRadius: Radius.xl,
    padding: Spacing.base,
    borderWidth: 1,
    ...Shadow.sm,
    gap: Spacing.md,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  titleGroup: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  title: { fontSize: Typography.base, fontWeight: '800', letterSpacing: -0.2 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radius.full },
  badgeText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  kpiCard: {
    width: '48%',
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
    gap: 2,
  },
  kpiLabel: { fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.3 },
  kpiValue: { fontSize: Typography.xl, fontWeight: '800' },
  kpiChange: { fontSize: 10, fontWeight: '700' },
  recBox: {
    flexDirection: 'row',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
  },
  recTitle: { fontSize: Typography.xs, fontWeight: '800', marginBottom: 2 },
  recText: { fontSize: Typography.xs, lineHeight: 17 },
});
