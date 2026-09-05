import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, Alert,
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  api, ApplicationOut, DetailedFunnelAnalyticsOut, FunnelStageMetric,
} from '../../api/client';
import { Typography, Spacing, Radius, Shadow } from '../../theme/tokens';
import { useTheme } from '../../theme/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParams } from '../../../App';
import { ErrorCard } from '../../components/common/ErrorCard';

const STATUS_STEPS = ['saved', 'applied', 'online_assessment', 'interview', 'offer'];
const STATUS_LABELS: Record<string, string> = {
  saved: 'Saved',
  applied: 'Applied',
  online_assessment: 'OA',
  interview: 'Interview',
  offer: 'Offer',
  rejected: 'Rejected',
  withdrawn: 'Withdrawn',
};

type Nav = NativeStackNavigationProp<RootStackParams>;

// ── Funnel Stage Bar ──────────────────────────────────────────────────────────

const STAGE_COLORS_KEYS = ['applied', 'online_assessment', 'interview', 'offer'];

function StageBar({ stage, maxCount, colors }: {
  stage: FunnelStageMetric; maxCount: number; colors: any;
}) {
  const STAGE_COLOR_MAP: Record<string, string> = {
    applied:           colors.info,
    online_assessment: colors.warning,
    interview:         colors.primary,
    offer:             colors.success,
  };
  const color = STAGE_COLOR_MAP[stage.stage] ?? colors.textMuted;
  const barPct = maxCount > 0 ? (stage.count / maxCount) * 100 : 0;
  return (
    <View style={funnelStyles.stageRow}>
      <Text style={[funnelStyles.stageLabel, { color: colors.textSecondary }]} numberOfLines={1}>
        {stage.label}
      </Text>
      <View style={[funnelStyles.track, { backgroundColor: colors.border }]}>
        <View style={[funnelStyles.fill, { width: `${barPct}%` as any, backgroundColor: color }]} />
      </View>
      <View style={funnelStyles.stageMeta}>
        <Text style={[funnelStyles.stageCount, { color: colors.textPrimary }]}>{stage.count}</Text>
        <Text style={[funnelStyles.stageConv, { color }]}>{stage.conversion_from_applied_pct}%</Text>
      </View>
    </View>
  );
}

// ── Funnel Panel ──────────────────────────────────────────────────────────────

function FunnelPanel() {
  const { colors } = useTheme();
  const [expanded, setExpanded] = useState(true);

  const { data, isLoading } = useQuery<DetailedFunnelAnalyticsOut>({
    queryKey: ['funnel-detailed'],
    queryFn: () => api.getDetailedFunnel(),
    retry: 1,
    staleTime: 60_000,
  });

  const maxCount = data ? Math.max(...data.stages.map((s) => s.count), 1) : 1;

  const pills = data
    ? [
        { label: 'Applied',   value: String(data.total_applied),         color: colors.info },
        { label: 'Response',  value: `${data.response_rate_pct}%`,       color: colors.warning },
        { label: 'Interview', value: `${data.interview_rate_pct}%`,      color: colors.primary },
        { label: 'Offer',     value: `${data.offer_rate_pct}%`,          color: colors.success },
      ]
    : [];

  return (
    <View style={[funnelStyles.panel, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <TouchableOpacity
        style={funnelStyles.panelHeader}
        onPress={() => setExpanded((v) => !v)}
        activeOpacity={0.75}
      >
        <View style={funnelStyles.panelTitleRow}>
          <Feather name="bar-chart-2" size={14} color={colors.primary} />
          <Text style={[funnelStyles.panelTitle, { color: colors.textPrimary }]}>Funnel Analytics</Text>
        </View>
        <Feather name={expanded ? 'chevron-up' : 'chevron-down'} size={14} color={colors.textMuted} />
      </TouchableOpacity>

      {expanded && (
        <>
          {isLoading ? (
            <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: 16 }} />
          ) : data ? (
            <>
              {/* Conversion rate pills */}
              <View style={funnelStyles.metricsRow}>
                {pills.map((p) => (
                  <View
                    key={p.label}
                    style={[funnelStyles.metricPill, { borderColor: p.color + '40', backgroundColor: p.color + '12' }]}
                  >
                    <Text style={[funnelStyles.metricValue, { color: p.color }]}>{p.value}</Text>
                    <Text style={[funnelStyles.metricLabel, { color: colors.textMuted }]}>{p.label}</Text>
                  </View>
                ))}
              </View>

              {/* Stage progress bars */}
              <View style={funnelStyles.stageList}>
                {data.stages.map((s) => (
                  <StageBar key={s.stage} stage={s} maxCount={maxCount} colors={colors} />
                ))}
              </View>

              {/* Top insight */}
              <View style={[funnelStyles.insightRow, { backgroundColor: colors.primary + '10', borderColor: colors.primary + '30' }]}>
                <Feather name="zap" size={11} color={colors.primary} />
                <Text style={[funnelStyles.insightText, { color: colors.textSecondary }]}>
                  {data.top_insight}
                </Text>
              </View>
            </>
          ) : null}
        </>
      )}
    </View>
  );
}

import { ApplicationTimelineModal } from '../../components/job/ApplicationTimelineModal';
import { ExecutiveDashboardPanel } from '../../components/dashboard/ExecutiveDashboardPanel';

function ApplicationCard({ app, onOpenTimeline }: { app: ApplicationOut; onOpenTimeline: (id: string) => void }) {
  const navigation = useNavigation<Nav>();
  const { colors } = useTheme();
  const qc = useQueryClient();

  const STATUS_COLORS: Record<string, string> = {
    saved: colors.textMuted,
    applied: colors.info,
    online_assessment: colors.warning,
    interview: colors.primary,
    offer: colors.success,
    rejected: colors.danger,
    withdrawn: colors.textMuted,
  };

  const statusColor = STATUS_COLORS[app.status] || colors.textMuted;
  const stepIndex = STATUS_STEPS.indexOf(app.status);

  const updateStatus = useMutation({
    mutationFn: (status: string) => api.updateApplicationStatus(app.id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['applications'] });
      qc.invalidateQueries({ queryKey: ['funnel-detailed'] });
    },
    onError: (e: any) => Alert.alert('Error', e.message),
  });

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
      onPress={() => navigation.navigate('JobDetail', { jobId: app.job.id })}
      activeOpacity={0.82}
    >
      {/* Header */}
      <View style={styles.cardHeader}>
        <View style={[styles.companyLogo, { backgroundColor: colors.primary + '18', borderColor: colors.primary + '30' }]}>
          <Text style={[styles.companyLogoText, { color: colors.primary }]}>
            {(app.job.company.name[0] ?? '?').toUpperCase()}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.jobTitle, { color: colors.textPrimary }]} numberOfLines={1}>{app.job.title}</Text>
          <Text style={[styles.companyName, { color: colors.textSecondary }]}>{app.job.company.name}</Text>
        </View>
        {app.match_score != null && (
          <View style={[styles.scoreBadge, { backgroundColor: statusColor + '18', borderColor: statusColor + '50' }]}>
            <Text style={[styles.scoreText, { color: statusColor }]}>
              {Math.round(app.match_score * 100)}%
            </Text>
          </View>
        )}
      </View>

      {/* Status pipeline */}
      <View style={styles.pipeline}>
        {STATUS_STEPS.map((step, idx) => (
          <TouchableOpacity
            key={step}
            style={[
              styles.pipelineStep,
              { borderColor: idx <= stepIndex ? colors.primary : colors.border },
              idx <= stepIndex && { backgroundColor: colors.primary + '18' },
            ]}
            onPress={() => updateStatus.mutate(step)}
          >
            <Text style={[styles.pipelineText, { color: idx <= stepIndex ? colors.primaryLight : colors.textMuted }]}>
              {STATUS_LABELS[step]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Status badge & timeline button */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
          {app.status === 'offer' && <Ionicons name="trophy-outline" size={13} color={colors.success} />}
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '18', borderColor: statusColor + '40' }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>
              {STATUS_LABELS[app.status] ?? app.status}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={[styles.timelineBtn, { borderColor: colors.border }]}
          onPress={() => onOpenTimeline(app.id)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Feather name="clock" size={12} color={colors.textMuted} />
          <Text style={[styles.timelineBtnText, { color: colors.textMuted }]}>Timeline</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

export function ApplicationsScreen() {
  const { colors } = useTheme();
  const [activeTimelineId, setActiveTimelineId] = useState<string | null>(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['applications'],
    queryFn: () => api.getApplications(),
    retry: 1,
  });

  if (isLoading) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (isError) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.background }]}>
        <ErrorCard
          fullScreen
          title="Could not load applications"
          message="We could not fetch your application tracker. Please check your connection and try again."
          onRetry={refetch}
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={data ?? []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <ApplicationCard app={item} onOpenTimeline={(id) => setActiveTimelineId(id)} />
        )}
        ListHeaderComponent={
          <>
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
              <Text style={[styles.title, { color: colors.textPrimary }]}>Applications</Text>
              <Text style={[styles.subtitle, { color: colors.textMuted }]}>{data?.length ?? 0} total</Text>
            </View>
            <ExecutiveDashboardPanel />
            <FunnelPanel />
          </>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Feather name="clipboard" size={40} color={colors.textMuted} />
            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No applications yet</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              Save jobs from your feed to track them here.
            </Text>
          </View>
        }
      />
      <ApplicationTimelineModal
        applicationId={activeTimelineId}
        onClose={() => setActiveTimelineId(null)}
      />
    </View>
  );
}


const styles = StyleSheet.create({
  container: { flex: 1 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    paddingHorizontal: Spacing['2xl'],
    paddingTop: 60,
    paddingBottom: Spacing.base,
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginBottom: Spacing.sm,
  },
  title: { fontSize: Typography['2xl'], fontWeight: '800', letterSpacing: -0.5 },
  subtitle: { fontSize: Typography.sm, marginTop: 3 },
  list: { paddingBottom: 160 },
  card: {
    borderRadius: Radius.xl,
    padding: Spacing.base,
    marginHorizontal: Spacing.base,
    marginVertical: 6,
    borderWidth: 1,
    ...Shadow.sm,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.md },
  companyLogo: {
    width: 36, height: 36, borderRadius: Radius.md,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1,
  },
  companyLogoText: { fontSize: Typography.base, fontWeight: '800' },
  jobTitle: { fontSize: Typography.base, fontWeight: '700', flex: 1, flexWrap: 'wrap' },
  companyName: { fontSize: Typography.sm, marginTop: 1 },
  scoreBadge: {
    paddingHorizontal: Spacing.sm, paddingVertical: 4,
    borderRadius: Radius.full, borderWidth: 1.5,
    minWidth: 42, alignItems: 'center',
  },
  scoreText: { fontSize: Typography.xs, fontWeight: '800' },
  pipeline: { flexDirection: 'row', gap: 4, marginBottom: Spacing.md },
  pipelineStep: {
    flex: 1, paddingVertical: 5, alignItems: 'center',
    borderRadius: Radius.sm, borderWidth: 1,
  },
  pipelineText: { fontSize: 8, fontWeight: '600', textAlign: 'center', textTransform: 'uppercase' },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.sm, paddingVertical: 3,
    borderRadius: Radius.full, borderWidth: 1,
  },
  statusText: { fontSize: Typography.xs, fontWeight: '700' },
  timelineBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: Radius.full, borderWidth: 1,
  },
  timelineBtnText: { fontSize: 10, fontWeight: '600' },
  empty: { alignItems: 'center', paddingTop: 80, gap: Spacing.base },
  emptyTitle: { fontSize: Typography.xl, fontWeight: '700' },
  emptySubtitle: {
    fontSize: Typography.base, textAlign: 'center',
    paddingHorizontal: Spacing['2xl'], lineHeight: Typography.base * 1.6,
  },
});


const funnelStyles = StyleSheet.create({
  panel: {
    marginHorizontal: Spacing.base,
    marginBottom: Spacing.base,
    borderRadius: Radius.xl,
    borderWidth: 1,
    overflow: 'hidden',
    ...Shadow.sm,
  },
  panelHeader: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base, paddingVertical: 12,
  },
  panelTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  panelTitle: { fontSize: Typography.sm, fontWeight: '700', letterSpacing: 0.2 },
  metricsRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.base,
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  metricPill: {
    flex: 1, alignItems: 'center', paddingVertical: 8,
    borderRadius: Radius.md, borderWidth: 1,
  },
  metricValue: { fontSize: Typography.base, fontWeight: '800' },
  metricLabel: { fontSize: 9, fontWeight: '600', marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.5 },
  stageList: {
    paddingHorizontal: Spacing.base, paddingBottom: Spacing.sm, gap: 6,
  },
  stageRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  stageLabel: { fontSize: Typography.xs, fontWeight: '600', width: 72 },
  track: { flex: 1, height: 6, borderRadius: 999, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 999 },
  stageMeta: { flexDirection: 'row', gap: 4, minWidth: 64, justifyContent: 'flex-end' },
  stageCount: { fontSize: Typography.xs, fontWeight: '700', width: 20, textAlign: 'right' },
  stageConv: { fontSize: Typography.xs, fontWeight: '600', width: 40, textAlign: 'right' },
  insightRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 6,
    marginHorizontal: Spacing.base, marginBottom: 12,
    paddingHorizontal: 10, paddingVertical: 8,
    borderRadius: Radius.md, borderWidth: 1,
  },
  insightText: { flex: 1, fontSize: Typography.xs, lineHeight: 16, fontStyle: 'italic' },
});
