import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, Alert
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, ApplicationOut } from '../../api/client';
import { Typography, Spacing, Radius, Shadow } from '../../theme/tokens';
import { useTheme } from '../../theme/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParams } from '../../../App';

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

function ApplicationCard({ app }: { app: ApplicationOut }) {
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
    onSuccess: () => qc.invalidateQueries({ queryKey: ['applications'] }),
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

      {/* Status badge */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
        {app.status === 'offer' && <Ionicons name="trophy-outline" size={13} color={colors.success} />}
        <View style={[styles.statusBadge, { backgroundColor: statusColor + '18', borderColor: statusColor + '40' }]}>
          <Text style={[styles.statusText, { color: statusColor }]}>
            {STATUS_LABELS[app.status] ?? app.status}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export function ApplicationsScreen() {
  const { colors } = useTheme();
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['applications'],
    queryFn: () => api.getApplications(),
  });

  if (isLoading) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Applications</Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>{data?.length ?? 0} total</Text>
      </View>
      <FlatList
        data={data ?? []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => <ApplicationCard app={item} />}
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
  list: { paddingHorizontal: Spacing.base, paddingBottom: 100 },
  card: {
    borderRadius: Radius.xl,
    padding: Spacing.base,
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
  jobTitle: { fontSize: Typography.base, fontWeight: '700' },
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
  empty: { alignItems: 'center', paddingTop: 80, gap: Spacing.base },
  emptyTitle: { fontSize: Typography.xl, fontWeight: '700' },
  emptySubtitle: {
    fontSize: Typography.base, textAlign: 'center',
    paddingHorizontal: Spacing['2xl'], lineHeight: Typography.base * 1.6,
  },
});
