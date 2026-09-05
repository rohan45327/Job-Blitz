import React from 'react';
import {
  Modal, View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../api/client';
import { Typography, Spacing, Radius } from '../../theme/tokens';
import { useTheme } from '../../theme/ThemeContext';
import { ErrorCard } from '../common/ErrorCard';

interface Props {
  visible: boolean;
  jobId: string;
  onClose: () => void;
}

export function RoleFitDiagnosticsModal({ visible, jobId, onClose }: Props) {
  const { colors } = useTheme();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['role-fit-diagnostics', jobId],
    queryFn: () => api.getRoleFitDiagnostics(jobId),
    enabled: visible && !!jobId,
  });

  const renderFitBar = (label: string, pct: number, iconName: any) => {
    let barColor = colors.primary;
    if (pct >= 80) barColor = colors.success || '#10B981';
    else if (pct < 50) barColor = colors.warning || '#F59E0B';

    return (
      <View style={styles.fitBarItem} key={label}>
        <View style={styles.fitBarHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Feather name={iconName} size={14} color={colors.textMuted} />
            <Text style={[styles.fitBarLabel, { color: colors.textPrimary }]}>{label}</Text>
          </View>
          <Text style={[styles.fitBarPct, { color: barColor }]}>{pct}%</Text>
        </View>

        <View style={[styles.barTrack, { backgroundColor: colors.surfaceElevated }]}>
          <View style={[styles.barFill, { width: `${Math.min(100, Math.max(0, pct))}%`, backgroundColor: barColor }]} />
        </View>
      </View>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.handle, { backgroundColor: colors.border }]} />

        <View style={styles.header}>
          <View style={styles.headerTitleRow}>
            <Feather name="bar-chart-2" size={18} color={colors.primary} />
            <Text style={[styles.title, { color: colors.textPrimary }]} numberOfLines={1}>Role Fit Diagnostics</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
            <Feather name="x" size={16} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Analyzing multi-dimensional role fit...</Text>
          </View>
        ) : error ? (
          <View style={styles.centerBox}>
            <ErrorCard message="Could not load role fit diagnostics." onRetry={refetch} />
          </View>
        ) : !data ? null : (
          <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
            {/* Top Score Banner */}
            <View style={[styles.summaryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.scoreRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.roleTitle, { color: colors.textMuted }]}>{data.company_name.toUpperCase()}</Text>
                  <Text style={[styles.roleName, { color: colors.textPrimary }]} numberOfLines={1}>{data.role_title}</Text>
                </View>
                <View style={[styles.scoreBadge, { backgroundColor: colors.primary + '18' }]}>
                  <Text style={[styles.scoreValue, { color: colors.primary }]}>{data.overall_fit_score}%</Text>
                  <Text style={[styles.scoreLabel, { color: colors.primary }]}>FIT</Text>
                </View>
              </View>

              <View style={[styles.verdictBox, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
                <Feather name="check-square" size={14} color={colors.primary} style={{ marginTop: 2 }} />
                <Text style={[styles.verdictText, { color: colors.textPrimary }]}>{data.executive_verdict}</Text>
              </View>
            </View>

            {/* Dimensional Fit Breakdown */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>Dimensional Fit Breakdown</Text>
              <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                {renderFitBar('Skills & Keyword Overlap', data.skills_fit_pct, 'code')}
                {renderFitBar('Experience Level Tier', data.experience_fit_pct, 'award')}
                {renderFitBar('Title & Domain Relevance', data.title_relevance_pct, 'briefcase')}
                {renderFitBar('Work Type & Location Alignment', data.work_type_location_pct, 'map-pin')}
              </View>
            </View>

            {/* Matching Strengths */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>Key Matching Strengths ({data.matching_strengths.length})</Text>
              {data.matching_strengths.map((str, idx) => (
                <View key={idx} style={[styles.listItem, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <Feather name="check-circle" size={14} color={colors.success || '#10B981'} />
                  <Text style={[styles.listText, { color: colors.textPrimary }]}>{str}</Text>
                </View>
              ))}
            </View>

            {/* Risk Factors */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>Potential Risks & Gaps ({data.risk_factors.length})</Text>
              {data.risk_factors.map((risk, idx) => (
                <View key={idx} style={[styles.listItem, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <Feather name="alert-triangle" size={14} color={colors.warning || '#F59E0B'} />
                  <Text style={[styles.listText, { color: colors.textPrimary }]}>{risk}</Text>
                </View>
              ))}
            </View>
          </ScrollView>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: Spacing['2xl'] },
  handle: { width: 36, height: 4, borderRadius: Radius.full, alignSelf: 'center', marginTop: Spacing.md, marginBottom: Spacing.base },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, paddingRight: Spacing.sm },
  title: { fontSize: Typography.fontSize.lg, fontWeight: Typography.fontWeight.semibold },
  closeBtn: { width: 32, height: 32, borderRadius: Radius.full, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  centerBox: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: Spacing['3xl'] },
  loadingText: { marginTop: Spacing.md, fontSize: Typography.fontSize.sm },
  scroll: { paddingBottom: Spacing['3xl'] },
  summaryCard: { padding: Spacing.md, borderRadius: Radius.lg, borderWidth: 1, marginBottom: Spacing.lg },
  scoreRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  roleTitle: { fontSize: Typography.fontSize.xs, fontWeight: Typography.fontWeight.bold, letterSpacing: 0.8 },
  roleName: { fontSize: Typography.fontSize.base, fontWeight: Typography.fontWeight.bold, marginTop: 2 },
  scoreBadge: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: Radius.lg, alignItems: 'center' },
  scoreValue: { fontSize: Typography.fontSize.xl, fontWeight: Typography.fontWeight.bold },
  scoreLabel: { fontSize: 10, fontWeight: Typography.fontWeight.bold, letterSpacing: 0.5 },
  verdictBox: { flexDirection: 'row', gap: 8, padding: Spacing.sm, borderRadius: Radius.md, borderWidth: 1 },
  verdictText: { flex: 1, fontSize: Typography.fontSize.xs, lineHeight: 18 },
  section: { marginBottom: Spacing.lg },
  sectionTitle: { fontSize: Typography.fontSize.xs, fontWeight: Typography.fontWeight.bold, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: Spacing.sm },
  card: { padding: Spacing.md, borderRadius: Radius.md, borderWidth: 1, gap: Spacing.md },
  fitBarItem: { gap: 4 },
  fitBarHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  fitBarLabel: { fontSize: Typography.fontSize.xs, fontWeight: Typography.fontWeight.semibold },
  fitBarPct: { fontSize: Typography.fontSize.xs, fontWeight: Typography.fontWeight.bold },
  barTrack: { height: 6, borderRadius: Radius.full, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: Radius.full },
  listItem: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: Spacing.sm, borderRadius: Radius.md, borderWidth: 1, marginBottom: Spacing.xs },
  listText: { flex: 1, fontSize: Typography.fontSize.xs, lineHeight: 18 },
});
