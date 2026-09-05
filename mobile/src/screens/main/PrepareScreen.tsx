import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Modal, TextInput, Alert, FlatList
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { api, MatchedJobOut } from '../../api/client';
import { Typography, Spacing, Radius } from '../../theme/tokens';
import { useTheme } from '../../theme/ThemeContext';
import { CompanyBriefModal } from '../../components/prep/CompanyBriefModal';
import { ResumeDefenseModal } from '../../components/prep/ResumeDefenseModal';
import { STARStoryModal } from '../../components/prep/STARStoryModal';
import { ErrorCard } from '../../components/common/ErrorCard';
import { cleanText } from '../../utils/cleanText';

interface CompanyGroup {
  companyId: string;
  companyName: string;
  isTop: boolean;
  domain: string | null;
  jobs: MatchedJobOut[];
}

export function PrepareScreen() {
  const { colors } = useTheme();

  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [showSelectorModal, setShowSelectorModal] = useState(false);

  // Selector Step: 1 = Company List, 2 = Roles in Selected Company
  const [selectorStep, setSelectorStep] = useState<1 | 2>(1);
  const [selectedCompanyGroup, setSelectedCompanyGroup] = useState<CompanyGroup | null>(null);
  const [companySearchQuery, setCompanySearchQuery] = useState('');

  const [showBriefModal, setShowBriefModal] = useState(false);
  const [showDefenseModal, setShowDefenseModal] = useState(false);
  const [showStarModal, setShowStarModal] = useState(false);

  // Fetch job feed for selector options (page_size 50 for broad choice)
  const { data: feedData, isError: isFeedError, refetch: refetchFeed } = useQuery({
    queryKey: ['job-feed', {}, 1],
    queryFn: () => api.getJobFeed({ page: 1, page_size: 50 }),
    retry: 1,
  });

  const allJobs = feedData?.items ?? [];
  const selectedMatched = allJobs.find((j) => j.job.id === activeJobId) ?? allJobs[0];
  const selectedJob = selectedMatched?.job;
  const targetJobId = selectedJob?.id;

  const { data: benchmarkData } = useQuery({
    queryKey: ['candidate-benchmark', targetJobId],
    queryFn: () => (targetJobId ? api.getCandidateBenchmark(targetJobId) : null),
    enabled: !!targetJobId,
  });

  // Group jobs by Company for Step 1
  const companyGroups = useMemo(() => {
    const map = new Map<string, CompanyGroup>();
    for (const item of allJobs) {
      const compId = item.job.company.id || item.job.company.name;
      if (!map.has(compId)) {
        map.set(compId, {
          companyId: compId,
          companyName: item.job.company.name,
          isTop: item.job.company.is_top_company,
          domain: item.job.company.domain,
          jobs: [],
        });
      }
      map.get(compId)!.jobs.push(item);
    }
    return Array.from(map.values());
  }, [allJobs]);

  // Filter companies in Step 1
  const filteredCompanyGroups = useMemo(() => {
    if (!companySearchQuery.trim()) return companyGroups;
    const q = companySearchQuery.toLowerCase();
    return companyGroups.filter((g) => g.companyName.toLowerCase().includes(q));
  }, [companyGroups, companySearchQuery]);

  // Fetch 7-Day Prep Plan
  const { data: prepPlan, isLoading: isPrepLoading, isError: isPrepError, refetch: refetchPrepPlan } = useQuery({
    queryKey: ['prep-plan', targetJobId],
    queryFn: () => (targetJobId ? api.getPrepPlan(targetJobId) : null),
    enabled: !!targetJobId,
    retry: 1,
  });

  const handleSelectCompany = (group: CompanyGroup) => {
    setSelectedCompanyGroup(group);
    setSelectorStep(2);
  };

  const handleSelectRole = (jobId: string) => {
    setActiveJobId(jobId);
    setShowSelectorModal(false);
    setSelectorStep(1);
    setSelectedCompanyGroup(null);
    setCompanySearchQuery('');
  };

  const handleOpenSelector = () => {
    setSelectorStep(1);
    setSelectedCompanyGroup(null);
    setCompanySearchQuery('');
    setShowSelectorModal(true);
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
        <View style={{ flex: 1 }}>
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
        {/* ── 2-Step Target Opportunity Header Card ─────────────────────────── */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>Target Opportunity</Text>

          {selectedJob ? (
            <View style={[styles.targetCard, { backgroundColor: colors.surface, borderColor: colors.primary + '50' }]}>
              <View style={styles.targetHeader}>
                <View style={{ flex: 1, paddingRight: Spacing.sm }}>
                  <Text style={[styles.targetCompany, { color: colors.textSecondary }]} numberOfLines={1}>
                    {cleanText(selectedJob.company.name)}
                  </Text>
                  <Text style={[styles.targetTitle, { color: colors.textPrimary }]} numberOfLines={2}>
                    {cleanText(selectedJob.title)}
                  </Text>
                </View>
                <TouchableOpacity
                  style={[styles.changeJobBtn, { backgroundColor: colors.primary + '18', borderColor: colors.primary + '40' }]}
                  onPress={handleOpenSelector}
                  activeOpacity={0.8}
                >
                  <Feather name="layers" size={13} color={colors.primary} />
                  <Text style={[styles.changeJobText, { color: colors.primary }]}>Select Role</Text>
                </TouchableOpacity>
              </View>

              {/* Skills summary */}
              {selectedJob.skills.length > 0 && (
                <View style={styles.skillRow}>
                  {selectedJob.skills.slice(0, 4).map((s) => (
                    <View key={s.id} style={[styles.skillChip, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
                      <Text style={[styles.skillText, { color: colors.textSecondary }]} numberOfLines={1}>{s.name}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.selectPromptBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={handleOpenSelector}
            >
              <Feather name="layers" size={18} color={colors.primary} />
              <Text style={[styles.selectPromptText, { color: colors.textPrimary }]}>Select Company & Role</Text>
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

            {/* Tool 3: STAR Story Evaluator */}
            <TouchableOpacity
              style={[styles.toolCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => {
                if (!targetJobId) {
                  Alert.alert('Notice', 'No target job selected yet.');
                  return;
                }
                setShowStarModal(true);
              }}
              activeOpacity={0.8}
            >
              <View style={[styles.toolIconBox, { backgroundColor: '#10B9811A' }]}>
                <Feather name="star" size={20} color="#10B981" />
              </View>
              <Text style={[styles.toolTitle, { color: colors.textPrimary }]}>STAR Builder</Text>
              <Text style={[styles.toolSub, { color: colors.textSecondary }]}>Practice & evaluate behavioral answers</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Candidate Benchmarking Section ────────────────────────────── */}
        {benchmarkData && (
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>Candidate Benchmark vs Top Applicants</Text>
              <Feather name="trending-up" size={14} color={colors.primary} />
            </View>

            <View style={[styles.targetCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.md }}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.targetCompany, { color: colors.textMuted }]}>SKILL COVERAGE</Text>
                  <Text style={[styles.targetTitle, { color: colors.textPrimary }]}>
                    {Math.round(benchmarkData.user_skill_coverage * 100)}% <Text style={{ fontSize: Typography.xs, fontWeight: '400', color: colors.textMuted }}>vs {Math.round(benchmarkData.benchmark_skill_coverage * 100)}% benchmark</Text>
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.targetCompany, { color: colors.textMuted }]}>PORTFOLIO PROJECTS</Text>
                  <Text style={[styles.targetTitle, { color: colors.textPrimary }]}>
                    {benchmarkData.user_project_count} <Text style={{ fontSize: Typography.xs, fontWeight: '400', color: colors.textMuted }}>vs {benchmarkData.benchmark_project_count} recommended</Text>
                  </Text>
                </View>
              </View>

              <Text style={[styles.skillGapLabel, { color: colors.textMuted, marginTop: 4, marginBottom: 6 }]}>
                Top candidate skills for {cleanText(benchmarkData.role_title)}:
              </Text>
              <View style={styles.skillRow}>
                {benchmarkData.top_candidate_skills.map((s, idx) => (
                  <View key={idx} style={[styles.skillChip, { backgroundColor: colors.primary + '14', borderColor: colors.primary + '30', borderWidth: 1 }]}>
                    <Text style={[styles.skillText, { color: colors.primary }]}>{s}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* ── 7-Day Personalized Prep Plan ─────────────────────────────────── */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>7-Day Role Preparation Roadmap</Text>
            <Feather name="calendar" size={14} color={colors.textMuted} />
          </View>

          {isPrepLoading ? (
            <ActivityIndicator color={colors.primary} />
          ) : isPrepError ? (
            <ErrorCard
              title="Could not generate plan"
              message="Failed to generate your preparation roadmap. Please try again."
              onRetry={refetchPrepPlan}
            />
          ) : prepPlan?.days_plan ? (
            <View style={styles.roadmapList}>
              {prepPlan.days_plan.map((dayItem) => (
                <View key={dayItem.day} style={[styles.dayCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <View style={styles.dayHeader}>
                    <View style={[styles.dayBadge, { backgroundColor: colors.primary + '18' }]}>
                      <Text style={[styles.dayBadgeText, { color: colors.primary }]}>DAY {dayItem.day}</Text>
                    </View>
                    {/* Fixed Text Wrapping / Overflow on Day Titles */}
                    <Text style={[styles.dayTitle, { color: colors.textPrimary }]}>
                      {dayItem.title}
                    </Text>
                  </View>
                  <View style={styles.taskList}>
                    {dayItem.tasks.map((task, idx) => (
                      <View key={idx} style={styles.taskItem}>
                        <Feather name="check-circle" size={13} color={colors.primary} style={{ marginTop: 2 }} />
                        <Text style={[styles.taskText, { color: colors.textSecondary }]}>{task}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={[styles.emptyBox, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>Select a target company & role above to generate your customized 7-day preparation roadmap.</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* ── Hierarchical Company → Role Selector Modal ──────────────────────── */}
      <Modal visible={showSelectorModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowSelectorModal(false)}>
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.handle, { backgroundColor: colors.border }]} />

          {/* Modal Header */}
          <View style={styles.modalHeader}>
            {selectorStep === 2 ? (
              <TouchableOpacity style={styles.backStepBtn} onPress={() => setSelectorStep(1)}>
                <Feather name="arrow-left" size={18} color={colors.textPrimary} />
                <Text style={[styles.backStepText, { color: colors.textPrimary }]}>Back to Companies</Text>
              </TouchableOpacity>
            ) : (
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>1. Select Target Company</Text>
            )}

            <TouchableOpacity onPress={() => setShowSelectorModal(false)} style={[styles.closeBtn, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
              <Feather name="x" size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* STEP 1: Select Company */}
          {selectorStep === 1 && (
            <View style={{ flex: 1 }}>
              {/* Search Bar */}
              <View style={[styles.searchBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Feather name="search" size={16} color={colors.textMuted} />
                <TextInput
                  style={[styles.searchInput, { color: colors.textPrimary }]}
                  placeholder="Filter companies by name..."
                  placeholderTextColor={colors.textMuted}
                  value={companySearchQuery}
                  onChangeText={setCompanySearchQuery}
                  autoCapitalize="none"
                />
                {companySearchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setCompanySearchQuery('')}>
                    <Feather name="x-circle" size={14} color={colors.textMuted} />
                  </TouchableOpacity>
                )}
              </View>

              <FlatList
                data={filteredCompanyGroups}
                keyExtractor={(item) => item.companyId}
                contentContainerStyle={styles.modalList}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[styles.companyOptionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                    onPress={() => handleSelectCompany(item)}
                    activeOpacity={0.75}
                  >
                    <View style={[styles.companyInitials, { backgroundColor: colors.primary + '18', borderColor: colors.primary + '40' }]}>
                      <Text style={[styles.companyInitialsText, { color: colors.primary }]}>
                        {(item.companyName[0] ?? '?').toUpperCase()}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                        {item.isTop && <Ionicons name="star" size={11} color="#F5A623" />}
                        <Text style={[styles.companyOptionName, { color: colors.textPrimary }]} numberOfLines={1}>
                          {cleanText(item.companyName)}
                        </Text>
                      </View>
                      <Text style={[styles.openRolesCount, { color: colors.textMuted }]}>
                        {item.jobs.length} {item.jobs.length === 1 ? 'Open Role' : 'Open Roles'}
                      </Text>
                    </View>
                    <Feather name="chevron-right" size={18} color={colors.textMuted} />
                  </TouchableOpacity>
                )}
              />
            </View>
          )}

          {/* STEP 2: Select Open Role in Selected Company */}
          {selectorStep === 2 && selectedCompanyGroup && (
            <View style={{ flex: 1 }}>
              <View style={styles.selectedCompanySubHeader}>
                <Text style={[styles.companyStepTitle, { color: colors.textPrimary }]}>
                  {cleanText(selectedCompanyGroup.companyName)}
                </Text>
                <Text style={[styles.companyStepSub, { color: colors.textMuted }]}>
                  Select an open role below to generate role preparation strategy
                </Text>
              </View>

              <FlatList
                data={selectedCompanyGroup.jobs}
                keyExtractor={(item) => item.job.id}
                contentContainerStyle={styles.modalList}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => {
                  const isSelected = item.job.id === targetJobId;
                  return (
                    <TouchableOpacity
                      style={[
                        styles.roleOptionCard,
                        { backgroundColor: colors.surface, borderColor: colors.border },
                        isSelected && { borderColor: colors.primary, backgroundColor: colors.primary + '15' },
                      ]}
                      onPress={() => handleSelectRole(item.job.id)}
                      activeOpacity={0.75}
                    >
                      <View style={{ flex: 1, paddingRight: Spacing.sm }}>
                        <Text style={[styles.roleOptionTitle, { color: colors.textPrimary }]}>
                          {cleanText(item.job.title)}
                        </Text>
                        <Text style={[styles.roleOptionMeta, { color: colors.textSecondary }]}>
                          {cleanText(item.job.location) || 'Remote / Flexible'}  ·  {Math.round(item.match_score * 100)}% Match
                        </Text>
                      </View>
                      {isSelected ? (
                        <Feather name="check-circle" size={20} color={colors.primary} />
                      ) : (
                        <Feather name="chevron-right" size={18} color={colors.textMuted} />
                      )}
                    </TouchableOpacity>
                  );
                }}
              />
            </View>
          )}
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
          <STARStoryModal
            visible={showStarModal}
            jobId={targetJobId}
            onClose={() => setShowStarModal(false)}
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
  
  // PaddingBottom 160 ensures content is never hidden behind floating bottom TabBar!
  scroll: { paddingHorizontal: Spacing['2xl'], paddingTop: Spacing.lg, paddingBottom: 160 },
  section: { marginBottom: Spacing['2xl'] },
  sectionTitle: { fontSize: Typography.xs, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: Spacing.md },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.md },

  targetCard: { padding: Spacing.base, borderRadius: Radius.xl, borderWidth: 1, gap: Spacing.sm },
  targetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  targetCompany: { fontSize: Typography.xs, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8 },
  targetTitle: { fontSize: Typography.base, fontWeight: '800', marginTop: 2, lineHeight: Typography.base * 1.3 },
  changeJobBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: Spacing.md, paddingVertical: 6, borderRadius: Radius.full, borderWidth: 1 },
  changeJobText: { fontSize: Typography.xs, fontWeight: '700' },

  skillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 2 },
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
  dayHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md, marginBottom: Spacing.sm },
  dayBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radius.full, marginTop: 2 },
  dayBadgeText: { fontSize: 10, fontWeight: '800' },
  
  // Day Title Wrapping Fix
  dayTitle: { flex: 1, fontSize: Typography.base, fontWeight: '700', flexWrap: 'wrap', lineHeight: Typography.base * 1.35 },
  
  taskList: { gap: 8 },
  taskItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  
  // Task Text Wrapping Fix
  taskText: { flex: 1, fontSize: Typography.sm, lineHeight: Typography.sm * 1.55, flexWrap: 'wrap' },

  emptyBox: { padding: Spacing.lg, borderRadius: Radius.xl, borderWidth: 1 },
  emptyText: { fontSize: Typography.sm, textAlign: 'center' },

  modalContainer: { flex: 1, paddingHorizontal: Spacing['2xl'] },
  handle: { width: 36, height: 4, borderRadius: Radius.full, alignSelf: 'center', marginTop: Spacing.md, marginBottom: Spacing.base },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.md },
  modalTitle: { fontSize: Typography.lg, fontWeight: '800' },
  backStepBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  backStepText: { fontSize: Typography.base, fontWeight: '700' },
  closeBtn: { width: 32, height: 32, borderRadius: Radius.full, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  
  searchBox: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: Radius.xl, borderWidth: 1, marginBottom: Spacing.md },
  searchInput: { flex: 1, fontSize: Typography.base, padding: 0 },
  modalList: { paddingBottom: 60, gap: Spacing.sm },

  companyOptionCard: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.base, borderRadius: Radius.xl, borderWidth: 1 },
  companyInitials: { width: 40, height: 40, borderRadius: Radius.lg, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  companyInitialsText: { fontSize: Typography.md, fontWeight: '800' },
  companyOptionName: { fontSize: Typography.base, fontWeight: '700' },
  openRolesCount: { fontSize: Typography.xs, marginTop: 2 },

  selectedCompanySubHeader: { marginBottom: Spacing.md },
  companyStepTitle: { fontSize: Typography.xl, fontWeight: '800' },
  companyStepSub: { fontSize: Typography.xs, marginTop: 2 },

  roleOptionCard: { flexDirection: 'row', alignItems: 'center', padding: Spacing.base, borderRadius: Radius.xl, borderWidth: 1 },
  roleOptionTitle: { fontSize: Typography.base, fontWeight: '700', marginBottom: 2 },
  roleOptionMeta: { fontSize: Typography.xs },
});
