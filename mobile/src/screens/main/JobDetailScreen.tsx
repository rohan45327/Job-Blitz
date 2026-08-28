import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Linking, Alert, Share
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParams } from '../../../App';
import { api } from '../../api/client';
import { Typography, Spacing, Radius, Shadow } from '../../theme/tokens';
import { useTheme } from '../../theme/ThemeContext';
import { CoverLetterModal } from '../../components/job/CoverLetterModal';
import { cleanText } from '../../utils/cleanText';

type Props = NativeStackScreenProps<RootStackParams, 'JobDetail'>;

export function JobDetailScreen({ route, navigation }: Props) {
  const { jobId } = route.params;
  const { colors } = useTheme();
  const qc = useQueryClient();
  const [showCoverLetter, setShowCoverLetter] = useState(false);

  const { data: job, isLoading } = useQuery({
    queryKey: ['job', jobId],
    queryFn: () => api.getJobDetail(jobId),
  });

  const applyMutation = useMutation({
    mutationFn: () => api.createApplication(jobId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['applications'] });
      Alert.alert('Saved', 'Job added to your tracker.');
    },
    onError: (e: any) => Alert.alert('Error', e.message),
  });

  const { data: readinessData } = useQuery({
    queryKey: ['readiness', jobId],
    queryFn: () => api.getJobReadiness(jobId),
  });

  if (isLoading || !job) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const salaryText = job.salary_min && job.salary_max
    ? `$${Math.round(job.salary_min / 1000)}k – $${Math.round(job.salary_max / 1000)}k / yr`
    : 'Salary not disclosed';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Back button */}
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Feather name="arrow-left" size={20} color={colors.textSecondary} />
      </TouchableOpacity>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Company Header */}
        <View style={styles.companyHeader}>
          <View style={[styles.companyLogo, { backgroundColor: colors.primary + '18', borderColor: colors.primary + '30' }]}>
            <Text style={[styles.companyLogoText, { color: colors.primary }]}>
              {(job.company.name?.[0] ?? '?').toUpperCase()}
            </Text>
          </View>
          <View style={styles.companyMeta}>
            <Text style={[styles.companyName, { color: colors.textPrimary }]}>{cleanText(job.company.name)}</Text>
            <Text style={[styles.companyDomain, { color: colors.textMuted }]}>{job.company.domain ?? ''}</Text>
          </View>
          <TouchableOpacity
            style={[styles.shareBtn, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}
            onPress={() => Share.share({ message: `${cleanText(job.title)} at ${cleanText(job.company.name)}: ${job.apply_url}` })}
          >
            <Feather name="share" size={15} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Job Title */}
        <Text style={[styles.jobTitle, { color: colors.textPrimary }]}>{cleanText(job.title)}</Text>

        {/* Company Intelligence CTA button */}
        <TouchableOpacity
          style={[styles.compIntelBtn, { backgroundColor: colors.surfaceElevated, borderColor: colors.primary + '40' }]}
          onPress={() => navigation.navigate('CompanyIntelligence', { jobId })}
        >
          <Feather name="shield" size={14} color={colors.primary} />
          <Text style={[styles.compIntelBtnText, { color: colors.primary }]}>View Company Hiring Intelligence & Funnel</Text>
          <Feather name="chevron-right" size={14} color={colors.primary} />
        </TouchableOpacity>

        {/* Meta pills */}
        <View style={styles.pills}>
          {job.location && (
            <View style={[styles.pill, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
              <Feather name="map-pin" size={11} color={colors.textMuted} />
              <Text style={[styles.pillText, { color: colors.textSecondary }]}>{cleanText(job.location)}</Text>
            </View>
          )}
          {job.work_type && (
            <View style={[styles.pill, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
              <Feather name="home" size={11} color={colors.textMuted} />
              <Text style={[styles.pillText, { color: colors.textSecondary }]}>{job.work_type}</Text>
            </View>
          )}
          {job.experience_level && (
            <View style={[styles.pill, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
              <Feather name="trending-up" size={11} color={colors.textMuted} />
              <Text style={[styles.pillText, { color: colors.textSecondary }]}>{job.experience_level}</Text>
            </View>
          )}
          <View style={[styles.pill, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
            <Feather name="dollar-sign" size={11} color={colors.textMuted} />
            <Text style={[styles.pillText, { color: colors.textSecondary }]}>{salaryText}</Text>
          </View>
        </View>

        {/* Readiness Breakdown Section */}
        {readinessData && (
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>AI Readiness Score</Text>
              <Text style={[styles.readinessScoreText, { color: colors.success }]}>
                {Math.round(readinessData.overall_readiness * 100)}% READY
              </Text>
            </View>
            <View style={[styles.readinessBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              {Object.entries(readinessData.breakdown).map(([k, v]) => (
                <View key={k} style={styles.readinessItem}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.readinessItemLabel, { color: colors.textSecondary }]}>
                      {k.replace(/_/g, ' ').toUpperCase()}
                    </Text>
                  </View>
                  <View style={[styles.readinessBarTrack, { backgroundColor: colors.surfaceElevated }]}>
                    <View style={[styles.readinessBarFill, { width: `${Math.round(v * 100)}%` as any, backgroundColor: colors.primary }]} />
                  </View>
                  <Text style={[styles.readinessItemVal, { color: colors.textPrimary }]}>{Math.round(v * 100)}%</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Skills */}
        {job.skills.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>Skills Required</Text>
            <View style={styles.skills}>
              {job.skills.map((s) => (
                <View key={s.id} style={[styles.skillChip, { backgroundColor: colors.primary + '14' }]}>
                  <Text style={[styles.skillText, { color: colors.primaryLight }]}>{s.name}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Description */}
        {job.description && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>Job Description</Text>
            <Text style={[styles.description, { color: colors.textSecondary }]}>{cleanText(job.description)}</Text>
          </View>
        )}
      </ScrollView>

      {/* Bottom CTA */}
      <View style={[styles.bottomBar, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.secondaryBtn, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}
          onPress={() => setShowCoverLetter(true)}
        >
          <Feather name="edit-2" size={14} color={colors.textSecondary} />
          <Text style={[styles.secondaryBtnText, { color: colors.textSecondary }]}>Cover Letter</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
          onPress={() => Linking.openURL(job.apply_url)}
          activeOpacity={0.85}
        >
          <Text style={styles.primaryBtnText}>Apply Now</Text>
          <Feather name="arrow-right" size={15} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Save to tracker */}
      <TouchableOpacity style={styles.saveBtn} onPress={() => applyMutation.mutate()}>
        {applyMutation.isPending
          ? <ActivityIndicator size="small" color={colors.primary} />
          : (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Feather name="bookmark" size={13} color={colors.textMuted} />
              <Text style={[styles.saveBtnText, { color: colors.textMuted }]}>Save to Tracker</Text>
            </View>
          )
        }
      </TouchableOpacity>

      <CoverLetterModal
        visible={showCoverLetter}
        jobId={jobId}
        onClose={() => setShowCoverLetter(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  backBtn: { paddingHorizontal: Spacing['2xl'], paddingTop: 56, paddingBottom: Spacing.base, alignSelf: 'flex-start' },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: Spacing['2xl'], paddingBottom: 160 },
  companyHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.lg },
  companyLogo: {
    width: 48, height: 48, borderRadius: Radius.lg,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1,
  },
  companyLogoText: { fontSize: Typography.xl, fontWeight: '800' },
  companyMeta: { flex: 1 },
  companyName: { fontSize: Typography.md, fontWeight: '700' },
  companyDomain: { fontSize: Typography.sm, marginTop: 1 },
  shareBtn: {
    width: 34, height: 34, borderRadius: Radius.full,
    borderWidth: 1, alignItems: 'center', justifyContent: 'center',
  },
  jobTitle: {
    fontSize: Typography['2xl'], fontWeight: '800',
    letterSpacing: -0.5, marginBottom: Spacing.lg,
    lineHeight: Typography['2xl'] * 1.25,
  },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.xl },
  pill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: Spacing.md, paddingVertical: 6,
    borderRadius: Radius.full, borderWidth: 1,
  },
  pillText: { fontSize: Typography.sm },
  section: { marginBottom: Spacing.xl },
  sectionTitle: {
    fontSize: Typography.xs, fontWeight: '700',
    textTransform: 'uppercase', letterSpacing: 1.2,
    marginBottom: Spacing.md,
  },
  skills: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  skillChip: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: Radius.sm },
  skillText: { fontSize: Typography.sm, fontWeight: '600' },
  description: { fontSize: Typography.base, lineHeight: Typography.base * 1.7 },
  bottomBar: {
    position: 'absolute',
    bottom: 48,
    left: Spacing['2xl'],
    right: Spacing['2xl'],
    flexDirection: 'row',
    gap: Spacing.md,
  },
  primaryBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, borderRadius: Radius.xl, paddingVertical: 14,
  },
  primaryBtnText: { fontSize: Typography.base, fontWeight: '700', color: '#FFFFFF' },
  secondaryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    borderRadius: Radius.xl, paddingVertical: 14, paddingHorizontal: Spacing.base,
    borderWidth: 1,
  },
  secondaryBtnText: { fontSize: Typography.sm, fontWeight: '600' },
  saveBtn: {
    position: 'absolute', bottom: 16, alignSelf: 'center',
    paddingVertical: Spacing.xs, paddingHorizontal: Spacing.lg,
  },
  saveBtnText: { fontSize: Typography.sm, fontWeight: '600' },
  compIntelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderRadius: Radius.xl,
    borderWidth: 1,
    marginBottom: Spacing.lg,
  },
  compIntelBtnText: { fontSize: Typography.xs, fontWeight: '700', flex: 1, marginHorizontal: 8 },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.md },
  readinessScoreText: { fontSize: Typography.xs, fontWeight: '800' },
  readinessBox: { padding: Spacing.base, borderRadius: Radius.xl, borderWidth: 1, gap: 10 },
  readinessItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  readinessItemLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  readinessBarTrack: { flex: 1.5, height: 6, borderRadius: Radius.full, overflow: 'hidden' },
  readinessBarFill: { height: '100%', borderRadius: Radius.full },
  readinessItemVal: { fontSize: Typography.xs, fontWeight: '800', width: 34, textAlign: 'right' },
});
