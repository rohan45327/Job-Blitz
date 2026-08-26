import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, Alert
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, ApplicationOut } from '../../api/client';
import { Colors, Typography, Spacing, Radius, Shadow } from '../../theme/tokens';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParams } from '../../../App';

const STATUS_STEPS = ['saved', 'applied', 'online_assessment', 'interview', 'offer'];
const STATUS_LABELS: Record<string, string> = {
  saved: 'Saved',
  applied: 'Applied',
  online_assessment: 'OA',
  interview: 'Interview',
  offer: 'Offer 🎉',
  rejected: 'Rejected',
  withdrawn: 'Withdrawn',
};
const STATUS_COLORS: Record<string, string> = {
  saved: Colors.textMuted,
  applied: Colors.info,
  online_assessment: Colors.warning,
  interview: Colors.primary,
  offer: Colors.success,
  rejected: Colors.danger,
  withdrawn: Colors.textMuted,
};

type Nav = NativeStackNavigationProp<RootStackParams>;

function ApplicationCard({ app }: { app: ApplicationOut }) {
  const navigation = useNavigation<Nav>();
  const qc = useQueryClient();
  const statusColor = STATUS_COLORS[app.status] || Colors.textMuted;
  const stepIndex = STATUS_STEPS.indexOf(app.status);

  const updateStatus = useMutation({
    mutationFn: (status: string) => api.updateApplicationStatus(app.id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['applications'] }),
    onError: (e: any) => Alert.alert('Error', e.message),
  });

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('JobDetail', { jobId: app.job.id })}
      activeOpacity={0.85}
    >
      {/* Header */}
      <View style={styles.cardHeader}>
        <View style={styles.companyLogo}>
          <Text style={styles.companyLogoText}>{(app.job.company.name[0] ?? '?').toUpperCase()}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.jobTitle} numberOfLines={1}>{app.job.title}</Text>
          <Text style={styles.companyName}>{app.job.company.name}</Text>
        </View>
        {app.match_score != null && (
          <View style={[styles.scoreBadge, { borderColor: statusColor }]}>
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
              idx <= stepIndex && styles.pipelineStepActive,
              { borderColor: idx <= stepIndex ? Colors.primary : Colors.border },
            ]}
            onPress={() => updateStatus.mutate(step)}
          >
            <Text style={[styles.pipelineText, idx <= stepIndex && styles.pipelineTextActive]}>
              {STATUS_LABELS[step]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Status badge */}
      <View style={[styles.statusBadge, { backgroundColor: statusColor + '22', borderColor: statusColor + '50' }]}>
        <Text style={[styles.statusText, { color: statusColor }]}>
          {STATUS_LABELS[app.status] ?? app.status}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

export function ApplicationsScreen() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['applications'],
    queryFn: () => api.getApplications(),
  });

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Applications</Text>
        <Text style={styles.subtitle}>{data?.length ?? 0} total</Text>
      </View>
      <FlatList
        data={data ?? []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => <ApplicationCard app={item} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>📋</Text>
            <Text style={styles.emptyTitle}>No applications yet</Text>
            <Text style={styles.emptySubtitle}>Save jobs from your feed to track them here.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  loading: { flex: 1, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center' },
  header: { paddingHorizontal: Spacing['2xl'], paddingTop: 60, paddingBottom: Spacing.base },
  title: { fontSize: Typography['2xl'], fontWeight: '800', color: Colors.textPrimary, letterSpacing: -0.5 },
  subtitle: { fontSize: Typography.sm, color: Colors.textMuted, marginTop: 4 },
  list: { paddingHorizontal: Spacing.base, paddingBottom: 100 },
  card: { backgroundColor: Colors.surface, borderRadius: Radius.xl, padding: Spacing.lg, marginVertical: Spacing.sm, borderWidth: 1, borderColor: Colors.border, ...Shadow.sm },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.md },
  companyLogo: { width: 38, height: 38, borderRadius: Radius.md, backgroundColor: Colors.primary + '22', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.primary + '40' },
  companyLogoText: { fontSize: Typography.base, fontWeight: '800', color: Colors.primary },
  jobTitle: { fontSize: Typography.base, fontWeight: '700', color: Colors.textPrimary },
  companyName: { fontSize: Typography.sm, color: Colors.textSecondary },
  scoreBadge: { width: 42, height: 42, borderRadius: Radius.full, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  scoreText: { fontSize: Typography.xs, fontWeight: '800' },
  pipeline: { flexDirection: 'row', gap: 4, marginBottom: Spacing.md },
  pipelineStep: { flex: 1, paddingVertical: 5, alignItems: 'center', borderRadius: Radius.sm, borderWidth: 1, borderColor: Colors.border },
  pipelineStepActive: { backgroundColor: Colors.primary + '20' },
  pipelineText: { fontSize: 8, color: Colors.textMuted, fontWeight: '600', textAlign: 'center' },
  pipelineTextActive: { color: Colors.primaryLight },
  statusBadge: { alignSelf: 'flex-start', paddingHorizontal: Spacing.sm, paddingVertical: 3, borderRadius: Radius.full, borderWidth: 1 },
  statusText: { fontSize: Typography.xs, fontWeight: '700' },
  empty: { alignItems: 'center', paddingTop: 80, gap: Spacing.md },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { fontSize: Typography.xl, fontWeight: '700', color: Colors.textPrimary },
  emptySubtitle: { fontSize: Typography.base, color: Colors.textSecondary, textAlign: 'center', paddingHorizontal: Spacing['2xl'] },
});
