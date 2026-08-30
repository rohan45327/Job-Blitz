import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl, Modal, Alert
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { api, MatchedJobOut, JobDetailOut } from '../../api/client';
import { Typography, Spacing, Radius } from '../../theme/tokens';
import { useTheme } from '../../theme/ThemeContext';
import { JobCard } from '../../components/job/JobCard';
import { FilterSheet, Filters } from '../../components/job/FilterSheet';
import { ThunderLoader } from '../../components/common/ThunderLoader';
import { cleanText } from '../../utils/cleanText';
import { RootStackParams } from '../../../App';

type Nav = NativeStackNavigationProp<RootStackParams>;

export function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const { colors, isDark, toggleTheme } = useTheme();
  const qc = useQueryClient();

  const [filters, setFilters] = useState<Filters>({});
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [activeTab, setActiveTab] = useState<'all' | 'high_match'>('all');
  const [selectedHighMatch, setSelectedHighMatch] = useState<MatchedJobOut | null>(null);

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['job-feed', filters, page],
    queryFn: () => api.getJobFeed({
      ...filters,
      companies: filters.companies,
      page,
      page_size: 50,
    }),
  });

  const applyMutation = useMutation({
    mutationFn: (jobId: string) => api.createApplication(jobId),
    onSuccess: () => {
      Alert.alert('Applied!', 'Your application has been recorded in your tracker.');
      setSelectedHighMatch(null);
      qc.invalidateQueries({ queryKey: ['applications'] });
    },
    onError: (e: any) => Alert.alert('Failed', e.message || 'Please try again.'),
  });

  const handleJobPress = useCallback((jobId: string) => {
    navigation.navigate('JobDetail', { jobId });
  }, [navigation]);

  const handleQuickApply = useCallback((item: MatchedJobOut) => {
    setSelectedHighMatch(item);
  }, []);

  const hasActiveFilters = Object.values(filters).some((v) =>
    Array.isArray(v) ? v.length > 0 : Boolean(v)
  );

  const allItems = data?.items ?? [];
  const highMatchItems = allItems.filter((i) => i.is_high_match || i.match_score >= 0.75);
  const displayItems = activeTab === 'high_match' ? highMatchItems : allItems;
  const totalPages = data?.total_pages ?? 1;
  const totalJobs = data?.total ?? 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Top Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View>
          <Text style={[styles.greeting, { color: colors.textMuted }]}>Live Intelligence</Text>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Job Feed</Text>
        </View>

        <View style={styles.headerActions}>
          {/* Theme Toggle */}
          <TouchableOpacity
            style={[styles.iconBtn, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}
            onPress={toggleTheme}
            activeOpacity={0.8}
          >
            <Feather name={isDark ? 'moon' : 'sun'} size={16} color={colors.textSecondary} />
          </TouchableOpacity>

          {/* Filter Button */}
          <TouchableOpacity
            style={[
              styles.filterBtn,
              { backgroundColor: hasActiveFilters ? colors.primary + '18' : colors.surfaceElevated, borderColor: hasActiveFilters ? colors.primary : colors.border },
            ]}
            onPress={() => setShowFilters(true)}
          >
            <Feather name="sliders" size={14} color={hasActiveFilters ? colors.primary : colors.textSecondary} />
            <Text style={[styles.filterBtnText, { color: hasActiveFilters ? colors.primary : colors.textSecondary }]}>
              {hasActiveFilters ? 'Filtered' : 'Filter'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Navigation Tabs */}
      <View style={[styles.tabBar, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'all' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
          onPress={() => setActiveTab('all')}
        >
          <Text style={[styles.tabText, { color: activeTab === 'all' ? colors.textPrimary : colors.textMuted }]}>
            All  <Text style={{ color: colors.textMuted, fontWeight: '400' }}>{totalJobs}</Text>
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'high_match' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
          onPress={() => setActiveTab('high_match')}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <Feather name="target" size={13} color={activeTab === 'high_match' ? colors.primary : colors.textMuted} />
            <Text style={[styles.tabText, { color: activeTab === 'high_match' ? colors.textPrimary : colors.textMuted }]}>
              75%+ Match  <Text style={{ color: colors.textMuted, fontWeight: '400' }}>{highMatchItems.length}</Text>
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* List content */}
      <View style={{ flex: 1 }}>
        {(isLoading || (isFetching && !data)) ? (
          <ThunderLoader message={isFetching ? "Connecting to server & fetching real-time postings..." : undefined} />
        ) : (
          <FlatList
            data={displayItems}
            keyExtractor={(item) => item.job.id}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={isFetching}
                onRefresh={refetch}
                tintColor={colors.primary}
              />
            }
            renderItem={({ item }) => (
              <JobCard
                matched={item}
                onPress={() => handleJobPress(item.job.id)}
                onQuickApply={() => handleQuickApply(item)}
              />
            )}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Feather name="briefcase" size={40} color={colors.textMuted} />
                <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
                  {activeTab === 'high_match' ? 'No 75%+ matches yet' : 'No jobs found'}
                </Text>
                <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                  {activeTab === 'high_match'
                    ? 'Add category resumes and keywords in your profile to boost match precision.'
                    : 'Check back soon — new postings are ingested continuously.'}
                </Text>
              </View>
            }
          />
        )}
      </View>

      {/* Pagination */}
      {activeTab === 'all' && totalPages > 1 && (
        <View style={[styles.paginationFooter, { backgroundColor: colors.surfaceElevated, borderTopColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.pageBtn, page === 1 && { opacity: 0.3 }]}
            disabled={page === 1 || isFetching}
            onPress={() => { setPage((p) => Math.max(1, p - 1)); }}
          >
            <Feather name="chevron-left" size={18} color={colors.primary} />
            <Text style={[styles.pageBtnText, { color: colors.primary }]}>Prev</Text>
          </TouchableOpacity>

          <Text style={[styles.pageIndicator, { color: colors.textSecondary }]}>
            <Text style={{ color: colors.textPrimary, fontWeight: '700' }}>{page}</Text> / {totalPages}
          </Text>

          <TouchableOpacity
            style={[styles.pageBtn, page >= totalPages && { opacity: 0.3 }]}
            disabled={page >= totalPages || isFetching}
            onPress={() => { setPage((p) => Math.min(totalPages, p + 1)); }}
          >
            <Text style={[styles.pageBtnText, { color: colors.primary }]}>Next</Text>
            <Feather name="chevron-right" size={18} color={colors.primary} />
          </TouchableOpacity>
        </View>
      )}

      {/* High-Match Popup Modal */}
      {selectedHighMatch && (
        <Modal
          animationType="slide"
          transparent
          visible={!!selectedHighMatch}
          onRequestClose={() => setSelectedHighMatch(null)}
        >
          <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.88)' }]}>
            <View style={[styles.modalContent, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={[styles.modalHeader, { backgroundColor: colors.primary + '18' }]}>
                <Feather name="zap" size={12} color={colors.primary} />
                <Text style={[styles.modalBadgeText, { color: colors.primary }]}>
                  {Math.round(selectedHighMatch.match_score * 100)}% Match
                </Text>
              </View>

              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                {cleanText(selectedHighMatch.job.title)}
              </Text>
              <Text style={[styles.modalCompany, { color: colors.textSecondary }]}>
                {cleanText(selectedHighMatch.job.company.name)} · {cleanText(selectedHighMatch.job.location) || 'Remote'}
              </Text>

              {selectedHighMatch.matched_resume_category && (
                <View style={[styles.boundResumeBox, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
                  <Feather name="file-text" size={12} color={colors.primary} />
                  <Text style={[styles.boundResumeText, { color: colors.textSecondary }]}>
                    Matched: <Text style={{ color: colors.primary, fontWeight: '700' }}>{selectedHighMatch.matched_resume_category}</Text>
                  </Text>
                </View>
              )}

              <Text style={[styles.modalDesc, { color: colors.textSecondary }]} numberOfLines={4}>
                {cleanText((selectedHighMatch.job as JobDetailOut).description) ||
                  `Full role at ${cleanText(selectedHighMatch.job.company.name)}. Tap to review and apply.`}
              </Text>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalCancelBtn, { borderColor: colors.border }]}
                  onPress={() => setSelectedHighMatch(null)}
                >
                  <Text style={[styles.modalCancelText, { color: colors.textMuted }]}>Dismiss</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalApplyBtn, { backgroundColor: colors.primary }]}
                  onPress={() => applyMutation.mutate(selectedHighMatch.job.id)}
                  disabled={applyMutation.isPending}
                >
                  {applyMutation.isPending ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <>
                      <Feather name="zap" size={14} color="#FFFFFF" />
                      <Text style={styles.modalApplyText}>One-Click Apply</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Filter sheet */}
      <FilterSheet
        visible={showFilters}
        current={filters}
        onApply={(f) => {
          setFilters(f);
          setPage(1);
          setShowFilters(false);
        }}
        onClose={() => setShowFilters(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingBottom: 100 },
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
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: Radius.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  filterBtnText: { fontSize: Typography.sm, fontWeight: '600' },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: Spacing['2xl'],
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  tabItem: {
    paddingVertical: Spacing.md,
    marginRight: Spacing.xl,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabText: {
    fontSize: Typography.sm,
    fontWeight: '700',
  },
  list: { paddingHorizontal: Spacing.base, paddingBottom: 160 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: Spacing.base },
  emptyTitle: { fontSize: Typography.lg, fontWeight: '700' },
  emptySubtitle: { fontSize: Typography.sm, textAlign: 'center', paddingHorizontal: Spacing['2xl'], lineHeight: Typography.sm * 1.6 },

  paginationFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  pageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  pageBtnText: { fontSize: Typography.sm, fontWeight: '700' },
  pageIndicator: { fontSize: Typography.sm },

  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
  },
  modalContent: {
    width: '100%',
    borderRadius: Radius['2xl'],
    borderWidth: 1,
    padding: Spacing.xl,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 5,
    borderRadius: Radius.full,
    marginBottom: Spacing.md,
  },
  modalBadgeText: { fontSize: Typography.xs, fontWeight: '800' },
  modalTitle: { fontSize: Typography.xl, fontWeight: '800', marginBottom: 4 },
  modalCompany: { fontSize: Typography.sm, fontWeight: '600', marginBottom: Spacing.md },
  boundResumeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
    marginBottom: Spacing.md,
  },
  boundResumeText: { fontSize: Typography.xs },
  modalDesc: {
    fontSize: Typography.sm,
    lineHeight: Typography.sm * 1.6,
    marginBottom: Spacing.xl,
  },
  modalActions: { flexDirection: 'row', gap: Spacing.md },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: Radius.xl,
    borderWidth: 1,
    alignItems: 'center',
  },
  modalCancelText: { fontSize: Typography.sm, fontWeight: '600' },
  modalApplyBtn: {
    flex: 2,
    paddingVertical: 13,
    borderRadius: Radius.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  modalApplyText: { fontSize: Typography.sm, fontWeight: '800', color: '#FFFFFF' },
});
