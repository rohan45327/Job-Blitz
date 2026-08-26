import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Linking, Alert, Share
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParams } from '../../../App';
import { api } from '../../api/client';
import { Colors, Typography, Spacing, Radius, Shadow } from '../../theme/tokens';
import { CoverLetterModal } from '../../components/job/CoverLetterModal';
import { cleanText } from '../../utils/cleanText';

type Props = NativeStackScreenProps<RootStackParams, 'JobDetail'>;

export function JobDetailScreen({ route, navigation }: Props) {
  const { jobId } = route.params;
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
      Alert.alert('✅ Saved!', 'Job added to your tracker.');
    },
    onError: (e: any) => Alert.alert('Error', e.message),
  });

  if (isLoading || !job) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const salaryText = job.salary_min && job.salary_max
    ? `$${Math.round(job.salary_min / 1000)}k – $${Math.round(job.salary_max / 1000)}k / yr`
    : 'Salary not disclosed';

  return (
    <View style={styles.container}>
      {/* Back button */}
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Text style={styles.backBtnText}>← Back</Text>
      </TouchableOpacity>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Company Header */}
        <View style={styles.companyHeader}>
          <View style={styles.companyLogo}>
            <Text style={styles.companyLogoText}>
              {(job.company.name?.[0] ?? '?').toUpperCase()}
            </Text>
          </View>
          <View style={styles.companyMeta}>
            <Text style={styles.companyName}>{cleanText(job.company.name)}</Text>
            <Text style={styles.companyDomain}>{job.company.domain ?? ''}</Text>
          </View>
          <TouchableOpacity
            onPress={() => Share.share({ message: `${cleanText(job.title)} at ${cleanText(job.company.name)}: ${job.apply_url}` })}
          >
            <Text style={styles.shareIcon}>↑</Text>
          </TouchableOpacity>
        </View>

        {/* Job Title */}
        <Text style={styles.jobTitle}>{cleanText(job.title)}</Text>

        {/* Meta pills */}
        <View style={styles.pills}>
          {job.location && <View style={styles.pill}><Text style={styles.pillText}>📍 {cleanText(job.location)}</Text></View>}
          {job.work_type && <View style={styles.pill}><Text style={styles.pillText}>🏠 {job.work_type}</Text></View>}
          {job.experience_level && <View style={styles.pill}><Text style={styles.pillText}>📈 {job.experience_level}</Text></View>}
          <View style={styles.pill}><Text style={styles.pillText}>💰 {salaryText}</Text></View>
        </View>

        {/* Skills */}
        {job.skills.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Skills Required</Text>
            <View style={styles.skills}>
              {job.skills.map((s) => (
                <View key={s.id} style={styles.skillChip}>
                  <Text style={styles.skillText}>{s.name}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Description */}
        {job.description && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Job Description</Text>
            <Text style={styles.description}>{cleanText(job.description)}</Text>
          </View>
        )}
      </ScrollView>

      {/* Bottom CTA */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={() => setShowCoverLetter(true)}
        >
          <Text style={styles.secondaryBtnText}>✍️ Cover Letter</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => Linking.openURL(job.apply_url)}
          activeOpacity={0.85}
        >
          <Text style={styles.primaryBtnText}>Apply Now →</Text>
        </TouchableOpacity>
      </View>

      {/* Save to tracker */}
      <TouchableOpacity style={styles.saveBtn} onPress={() => applyMutation.mutate()}>
        {applyMutation.isPending
          ? <ActivityIndicator size="small" color={Colors.primary} />
          : <Text style={styles.saveBtnText}>+ Save to Tracker</Text>
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
  container: { flex: 1, backgroundColor: Colors.background },
  loading: { flex: 1, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center' },
  backBtn: { paddingHorizontal: Spacing['2xl'], paddingTop: 56, paddingBottom: Spacing.base },
  backBtnText: { fontSize: Typography.base, color: Colors.primary, fontWeight: '600' },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: Spacing['2xl'], paddingBottom: 160 },
  companyHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.lg },
  companyLogo: {
    width: 52, height: 52, borderRadius: Radius.lg,
    backgroundColor: Colors.primary + '22', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.primary + '40',
  },
  companyLogoText: { fontSize: Typography.xl, fontWeight: '800', color: Colors.primary },
  companyMeta: { flex: 1 },
  companyName: { fontSize: Typography.md, fontWeight: '700', color: Colors.textPrimary },
  companyDomain: { fontSize: Typography.sm, color: Colors.textMuted },
  shareIcon: { fontSize: Typography.lg, color: Colors.textSecondary },
  jobTitle: { fontSize: Typography['2xl'], fontWeight: '800', color: Colors.textPrimary, letterSpacing: -0.5, marginBottom: Spacing.lg, lineHeight: Typography['2xl'] * 1.25 },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.xl },
  pill: { backgroundColor: Colors.surfaceElevated, paddingHorizontal: Spacing.md, paddingVertical: 6, borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.border },
  pillText: { fontSize: Typography.sm, color: Colors.textSecondary },
  section: { marginBottom: Spacing.xl },
  sectionTitle: { fontSize: Typography.sm, fontWeight: '700', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: Spacing.md },
  skills: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  skillChip: { backgroundColor: Colors.primary + '15', paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: Radius.sm },
  skillText: { fontSize: Typography.sm, color: Colors.primaryLight, fontWeight: '600' },
  description: { fontSize: Typography.base, color: Colors.textSecondary, lineHeight: Typography.base * 1.7 },
  bottomBar: { position: 'absolute', bottom: 48, left: Spacing['2xl'], right: Spacing['2xl'], flexDirection: 'row', gap: Spacing.md },
  primaryBtn: { flex: 1, backgroundColor: Colors.primary, borderRadius: Radius.xl, paddingVertical: 15, alignItems: 'center' },
  primaryBtnText: { fontSize: Typography.base, fontWeight: '700', color: Colors.textPrimary },
  secondaryBtn: { backgroundColor: Colors.surfaceElevated, borderRadius: Radius.xl, paddingVertical: 15, paddingHorizontal: Spacing.lg, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  secondaryBtnText: { fontSize: Typography.sm, fontWeight: '600', color: Colors.textSecondary },
  saveBtn: { position: 'absolute', bottom: 14, alignSelf: 'center', paddingVertical: Spacing.xs, paddingHorizontal: Spacing.lg },
  saveBtnText: { fontSize: Typography.sm, color: Colors.textMuted, fontWeight: '600' },
});
