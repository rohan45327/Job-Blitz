import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Modal, TextInput, Alert, FlatList
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api, MatchedJobOut } from '../../api/client';
import { Typography, Spacing, Radius } from '../../theme/tokens';
import { useTheme } from '../../theme/ThemeContext';
import { CompanyBriefModal } from '../../components/prep/CompanyBriefModal';
import { ResumeDefenseModal } from '../../components/prep/ResumeDefenseModal';
import { cleanText } from '../../utils/cleanText';

export function PrepareScreen() {
  const { colors } = useTheme();
  const qc = useQueryClient();

  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [showSelectorModal, setShowSelectorModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showBriefModal, setShowBriefModal] = useState(false);
  const [showDefenseModal, setShowDefenseModal] = useState(false);

  // Fetch job feed for selector options (page_size 50 for broad choice)
  const { data: feedData, isLoading: isFeedLoading } = useQuery({
    queryKey: ['job-feed', {}, 1],
    queryFn: () => api.getJobFeed({ page: 1, page_size: 50 }),
  });

  const allJobs = feedData?.items ?? [];
  const selectedMatched = allJobs.find((j) => j.job.id === activeJobId) ?? allJobs[0];
  const selectedJob = selectedMatched?.job;
  const targetJobId = selectedJob?.id;

  // Filter jobs in search modal
  const filteredJobs = allJobs.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const titleMatch = item.job.title.toLowerCase().includes(q);
    const companyMatch = item.job.company.name.toLowerCase().includes(q);
    return titleMatch || companyMatch;
  });

  // Fetch 7-Day Prep Plan
  const { data: prepPlan, isLoading: isPrepLoading } = useQuery({
    queryKey: ['prep-plan', targetJobId],
    queryFn: () => (targetJobId ? api.getPrepPlan(targetJobId) : null),
    enabled: !!targetJobId,
  });

  const handleSelectJob = (jobId: string) => {
    setActiveJobId(jobId);
    setShowSelectorModal(false);
    setSearchQuery('');
  };

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
        {/* ── Searchable Target Opportunity Card ────────────────────────────── */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>Target Opportunity</Text>

          {selectedJob ? (
            <View style={[styles.targetCard, { backgroundColor: colors.surface, borderColor: colors.primary + '50' }]}>
              <View style={styles.targetHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.targetCompany, { color: colors.textSecondary }]}>
                    {cleanText(selectedJob.company.name)}
                  </Text>
                  <Text style={[styles.targetTitle, { color: colors.textPrimary }]}>
                    {cleanText(selectedJob.title)}
                  </Text>
                </View>
                <TouchableOpacity
                  style={[styles.changeJobBtn, { backgroundColor: colors.primary + '18', borderColor: colors.primary + '40' }]}
                  onPress={() => setShowSelectorModal(true)}
                >
                  <Feather name="search" size={13} color={colors.primary} />
                  <Text style={[styles.changeJobText, { color: colors.primary }]}>Select Job</Text>
                </TouchableOpacity>
              </View>

              {/* Skills summary */}
              {selectedJob.skills.length > 0 && (
                <View style={styles.skillRow}>
                  {selectedJob.skills.slice(0, 4).map((s) => (
                    <View key={s.id} style={[styles.skillChip, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
                      <Text style={[styles.skillText, { color: colors.textSecondary }]}>{s.name}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.selectPromptBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => setShowSelectorModal(true)}
            >
              <Feather name="search" size={18} color={colors.primary} />
              <Text style={[styles.selectPromptText, { color: colors.textPrimary }]}>Search & Select Target Opportunity</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ── Interview Readiness Tools ──────────────────────────────────────── */}
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

        {/* ── 7-Day Personalized Prep Plan ─────────────────────────────────── */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>7-Day Role Preparation Roadmap</Text>
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

      {/* ── Target Opportunity Search Modal ─────────────────────────────────── */}
      <Modal visible={showSelectorModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowSelectorModal(false)}>
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.handle, { backgroundColor: colors.border }]} />

          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Select Target Opportunity</Text>
            <TouchableOpacity onPress={() => setShowSelectorModal(false)} style={[styles.closeBtn, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
              <Feather name="x" size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Search Bar */}
          <View style={[styles.searchBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Feather name="search" size={16} color={colors.textMuted} />
            <TextInput
              style={[styles.searchInput, { color: colors.textPrimary }]}
              placeholder="Search company or job title..."
              placeholderTextColor={colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Feather name="x-circle" size={14} color={colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>

          {/* Opportunity List */}
          <FlatList
            data={filteredJobs}
            keyExtractor={(item) => item.job.id}
            contentContainerStyle={styles.modalList}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => {
              const isSelected = item.job.id === targetJobId;
              return (
                <TouchableOpacity
                  style={[
                    styles.optionItem,
                    { backgroundColor: colors.surface, borderColor: colors.border },
                    isSelected && { borderColor: colors.primary, backgroundColor: colors.primary + '12' },
                  ]}
                  onPress={() => handleSelectJob(item.job.id)}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.optionCompany, { color: colors.textMuted }]}>{cleanText(item.job.company.name)}</Text>
                    <Text style={[styles.optionTitle, { color: colors.textPrimary }]}>{cleanText(item.job.title)}</Text>
                    <Text style={[styles.optionMeta, { color: colors.textSecondary }]}>
                      {cleanText(item.job.location) || 'Remote'}  ·  {Math.round(item.match_score * 100)}% Match
                    </Text>
                  </View>
                  {isSelected ? (
                    <Feather name="check-circle" size={18} color={colors.primary} />
                  ) : (
                    <Feather name="chevron-right" size={18} color={colors.textMuted} />
                  )}
                </TouchableOpacity>
              );
            }}
          />
        </View>
      </Modal>

      {/* Preparation Modals */}
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

  targetCard: { padding: Spacing.base, borderRadius: Radius.xl, borderWidth: 1, gap: Spacing.sm },
  targetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.md },
  targetCompany: { fontSize: Typography.xs, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8 },
  targetTitle: { fontSize: Typography.lg, fontWeight: '800', marginTop: 2 },
  changeJobBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: Spacing.md, paddingVertical: 6, borderRadius: Radius.full, borderWidth: 1 },
  changeJobText: { fontSize: Typography.xs, fontWeight: '700' },

  skillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  skillChip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radius.full, borderWidth: 1 },
  skillText: { fontSize: 10, fontWeight: '600' },

  selectPromptBtn: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.lg, borderRadius: Radius.xl, borderWidth: 1 },
  selectPromptText: { fontSize: Typography.base, fontWeight: '700' },

  toolsGrid: { flexDirection: 'row', gap: Spacing.md },
  toolCard: { flex: 1, padding: Spacing.base, borderRadius: Radius.xl, borderWidth: 1 },
  toolIconBox: { width: 38, height: 38, borderRadius: Radius.lg, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.sm },
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

  modalContainer: { flex: 1, paddingHorizontal: Spacing['2xl'] },
  handle: { width: 36, height: 4, borderRadius: Radius.full, alignSelf: 'center', marginTop: Spacing.md, marginBottom: Spacing.base },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.md },
  modalTitle: { fontSize: Typography.xl, fontWeight: '800' },
  closeBtn: { width: 32, height: 32, borderRadius: Radius.full, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  searchBox: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: Radius.xl, borderWidth: 1, marginBottom: Spacing.md },
  searchInput: { flex: 1, fontSize: Typography.base, padding: 0 },
  modalList: { paddingBottom: 60, gap: Spacing.sm },
  optionItem: { flexDirection: 'row', alignItems: 'center', padding: Spacing.base, borderRadius: Radius.xl, borderWidth: 1 },
  optionCompany: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  optionTitle: { fontSize: Typography.base, fontWeight: '700', marginVertical: 2 },
  optionMeta: { fontSize: Typography.xs },
});
