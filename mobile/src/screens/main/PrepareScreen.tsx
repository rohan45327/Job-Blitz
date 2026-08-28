import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Modal, TextInput, Alert
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, ProjectOut, CompanyBriefOut, ResumeDefenseResponse } from '../../api/client';
import { Typography, Spacing, Radius } from '../../theme/tokens';
import { useTheme } from '../../theme/ThemeContext';
import { CompanyBriefModal } from '../../components/prep/CompanyBriefModal';
import { ResumeDefenseModal } from '../../components/prep/ResumeDefenseModal';

export function PrepareScreen() {
  const { colors } = useTheme();
  const qc = useQueryClient();

  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [showBriefModal, setShowBriefModal] = useState(false);
  const [showDefenseModal, setShowDefenseModal] = useState(false);

  // Fetch recent feed jobs to select active target job
  const { data: feedData } = useQuery({
    queryKey: ['job-feed', {}, 1],
    queryFn: () => api.getJobFeed({ page: 1, page_size: 10 }),
  });

  const recentJobs = feedData?.items ?? [];
  const selectedJob = recentJobs.find((j) => j.job.id === activeJobId) ?? recentJobs[0];
  const targetJobId = selectedJob?.job.id;

  // Fetch 7-Day Prep Plan
  const { data: prepPlan, isLoading: isPrepLoading } = useQuery({
    queryKey: ['prep-plan', targetJobId],
    queryFn: () => (targetJobId ? api.getPrepPlan(targetJobId) : null),
    enabled: !!targetJobId,
  });

  // Fetch User Projects
  const { data: projects } = useQuery({
    queryKey: ['projects'],
    queryFn: () => api.getUserProjects(),
  });

  const handleOpenBrief = () => {
    if (!targetJobId) {
      Alert.alert('Notice', 'No target job selected yet.');
      return;
    }
    setShowBriefModal(true);
  };

  const handleOpenDefense = () => {
    if (!targetJobId) {
      Alert.alert('Notice', 'No target job selected yet.');
      return;
    }
    setShowDefenseModal(true);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View>
          <Text style={[styles.greeting, { color: colors.textMuted }]}>AI Readiness Engine</Text>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Preparation Hub</Text>
        </View>
        <View style={[styles.readinessTag, { backgroundColor: colors.success + '18', borderColor: colors.success + '40' }]}>
          <Feather name="target" size={13} color={colors.success} />
          <Text style={[styles.readinessTagText, { color: colors.success }]}>
            {prepPlan ? `${Math.round(prepPlan.overall_readiness * 100)}% Ready` : '78% Ready'}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Target Job Selector Selector */}
        {recentJobs.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>Target Opportunity</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.jobChipRow}>
              {recentJobs.map((item) => {
                const isSelected = item.job.id === targetJobId;
                return (
                  <TouchableOpacity
                    key={item.job.id}
                    style={[
                      styles.jobChip,
                      { backgroundColor: colors.surfaceElevated, borderColor: colors.border },
                      isSelected && { borderColor: colors.primary, backgroundColor: colors.primary + '18' },
                    ]}
                    onPress={() => setActiveJobId(item.job.id)}
                  >
                    <Text style={[styles.jobChipText, { color: colors.textPrimary }, isSelected && { color: colors.primary, fontWeight: '700' }]}>
                      {item.job.title}
                    </Text>
                    <Text style={[styles.companyChipText, { color: colors.textMuted }]}>
                      {item.job.company.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Action Tools Grid */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>Interview Readiness Tools</Text>

          <View style={styles.toolsGrid}>
            {/* Tool 1: 5-Min Company Brief */}
            <TouchableOpacity
              style={[styles.toolCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={handleOpenBrief}
              activeOpacity={0.8}
            >
              <View style={[styles.toolIconBox, { backgroundColor: colors.primary + '18' }]}>
                <Feather name="file-text" size={20} color={colors.primary} />
              </View>
              <Text style={[styles.toolTitle, { color: colors.textPrimary }]}>5-Min Brief</Text>
              <Text style={[styles.toolSub, { color: colors.textSecondary }]}>Cheat sheet & smart questions to ask</Text>
            </TouchableOpacity>

            {/* Tool 2: Resume Defense Mode */}
            <TouchableOpacity
              style={[styles.toolCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={handleOpenDefense}
              activeOpacity={0.8}
            >
              <View style={[styles.toolIconBox, { backgroundColor: colors.accent + '18' }]}>
                <Feather name="shield" size={20} color={colors.accent} />
              </View>
              <Text style={[styles.toolTitle, { color: colors.textPrimary }]}>Resume Defense</Text>
              <Text style={[styles.toolSub, { color: colors.textSecondary }]}>Practice tough project deep-dive Qs</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 7-Day Prep Plan Roadmap */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>7-Day Preparation Roadmap</Text>
            <Feather name="calendar" size={14} color={colors.textMuted} />
          </View>

          {isPrepLoading ? (
            <ActivityIndicator color={colors.primary} />
          ) : prepPlan?.days_plan ? (
            <View style={styles.roadmapList}>
              {prepPlan.days_plan.map((dayItem) => (
                <View key={dayItem.day} style={[styles.dayCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <View style={styles.dayHeader}>
                    <View style={[styles.dayBadge, { backgroundColor: colors.primary + '18' }]}>
                      <Text style={[styles.dayBadgeText, { color: colors.primary }]}>DAY {dayItem.day}</Text>
                    </View>
                    <Text style={[styles.dayTitle, { color: colors.textPrimary }]}>{dayItem.title}</Text>
                  </View>
                  <View style={styles.taskList}>
                    {dayItem.tasks.map((task, idx) => (
                      <View key={idx} style={styles.taskItem}>
                        <Feather name="check-circle" size={13} color={colors.primary} />
                        <Text style={[styles.taskText, { color: colors.textSecondary }]}>{task}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={[styles.emptyBox, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>Select a target job above to generate your customized 7-day preparation roadmap.</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Modals */}
      {targetJobId && (
        <>
          <CompanyBriefModal
            visible={showBriefModal}
            jobId={targetJobId}
            onClose={() => setShowBriefModal(false)}
          />
          <ResumeDefenseModal
            visible={showDefenseModal}
            jobId={targetJobId}
            onClose={() => setShowDefenseModal(false)}
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing['2xl'],
    paddingTop: 56,
    paddingBottom: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  greeting: { fontSize: Typography.xs, textTransform: 'uppercase', letterSpacing: 1.2, fontWeight: '600' },
  title: { fontSize: Typography['2xl'], fontWeight: '800', letterSpacing: -0.5, marginTop: 2 },
  readinessTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  readinessTagText: { fontSize: Typography.xs, fontWeight: '800' },
  scroll: { paddingHorizontal: Spacing['2xl'], paddingTop: Spacing.lg, paddingBottom: 120 },
  section: { marginBottom: Spacing['2xl'] },
  sectionTitle: { fontSize: Typography.xs, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: Spacing.md },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.md },
  jobChipRow: { gap: Spacing.sm },
  jobChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.xl,
    borderWidth: 1,
  },
  jobChipText: { fontSize: Typography.sm },
  companyChipText: { fontSize: Typography.xs, marginTop: 1 },

  toolsGrid: { flexDirection: 'row', gap: Spacing.md },
  toolCard: {
    flex: 1,
    padding: Spacing.base,
    borderRadius: Radius.xl,
    borderWidth: 1,
  },
  toolIconBox: {
    width: 38,
    height: 38,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  toolTitle: { fontSize: Typography.base, fontWeight: '700', marginBottom: 2 },
  toolSub: { fontSize: Typography.xs, lineHeight: Typography.xs * 1.5 },

  roadmapList: { gap: Spacing.md },
  dayCard: { padding: Spacing.base, borderRadius: Radius.xl, borderWidth: 1 },
  dayHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.sm },
  dayBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radius.full },
  dayBadgeText: { fontSize: 10, fontWeight: '800' },
  dayTitle: { fontSize: Typography.base, fontWeight: '700' },
  taskList: { gap: 6 },
  taskItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  taskText: { fontSize: Typography.sm, flex: 1, lineHeight: Typography.sm * 1.5 },

  emptyBox: { padding: Spacing.lg, borderRadius: Radius.xl, borderWidth: 1 },
  emptyText: { fontSize: Typography.sm, textAlign: 'center' },
});
