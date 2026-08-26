import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl, Modal, Alert
} from 'react-native';
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

  // Automated High-Match Alert Popup Modal state
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
      Alert.alert('⚡ Application Submitted!', 'Your application has been recorded in your tracker.');
      setSelectedHighMatch(null);
      qc.invalidateQueries({ queryKey: ['applications'] });
    },
    onError: (e: any) => Alert.alert('Application Failed', e.message || 'Please try again.'),
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

  // Backend already sorts: top companies first, then by score
  const allItems = data?.items ?? [];
  const highMatchItems = allItems.filter((i) => i.is_high_match || i.match_score >= 0.75);

  const displayItems = activeTab === 'high_match' ? highMatchItems : allItems;
  const totalPages = data?.total_pages ?? 1;
  const totalJobs = data?.total ?? 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Top Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.greeting, { color: colors.textMuted }]}>⚡ Live Job Intelligence</Text>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Software Feed</Text>
        </View>

        <View style={styles.headerActions}>
          {/* Theme Toggle Button */}
          <TouchableOpacity
            style={[styles.themeToggleBtn, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}
            onPress={toggleTheme}
            activeOpacity={0.8}
          >
            <Text style={{ fontSize: 16 }}>{isDark ? '🌙' : '☀️'}</Text>
          </TouchableOpacity>

          {/* Filter Button */}
          <TouchableOpacity
            style={[
              styles.filterBtn,
              { backgroundColor: colors.surfaceElevated, borderColor: hasActiveFilters ? colors.primary : colors.border },
              hasActiveFilters && { backgroundColor: colors.primary + '22' }
            ]}
            onPress={() => setShowFilters(true)}
          >
            <Text style={[styles.filterBtnText, { color: hasActiveFilters ? colors.primary : colors.textSecondary }]}>
              {hasActiveFilters ? '● Filters' : 'Filter'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Navigation Tabs (All Feed vs 75%+ High Matches) */}
      <View style={[styles.tabBar, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'all' && { borderBottomColor: colors.primary, borderBottomWidth: 3 }]}
          onPress={() => setActiveTab('all')}
        >
          <Text style={[styles.tabText, { color: activeTab === 'all' ? colors.primary : colors.textMuted }]}>
            All Jobs ({totalJobs})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'high_match' && { borderBottomColor: colors.primary, borderBottomWidth: 3 }]}
          onPress={() => setActiveTab('high_match')}
        >
          <Text style={[styles.tabText, { color: activeTab === 'high_match' ? colors.primary : colors.textMuted }]}>
            🎯 75%+ Suggested ({highMatchItems.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* List content */}
      <View style={{ flex: 1 }}>
        {isLoading && !data ? (
          <ThunderLoader />
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
                <Text style={styles.emptyEmoji}>⚡</Text>
                <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
                  {activeTab === 'high_match' ? 'No 75%+ matches yet' : 'No jobs found'}
                </Text>
                <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                  {activeTab === 'high_match'
                    ? 'Add category resumes and search keywords in your profile to boost match precision.'
                    : 'Check back soon as new tech postings are ingested continuously.'}
                </Text>
              </View>
            }
          />
        )}
      </View>

      {/* Pagination Controls — always above the tab bar */}
      {activeTab === 'all' && totalPages > 1 && (
        <View style={[styles.paginationFooter, { backgroundColor: colors.surfaceElevated, borderTopColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.pageBtn, page === 1 && { opacity: 0.3 }]}
            disabled={page === 1 || isFetching}
            onPress={() => { setPage((p) => Math.max(1, p - 1)); }}
          >
            <Text style={[styles.pageBtnText, { color: colors.primary }]}>‹ Prev</Text>
          </TouchableOpacity>

          <Text style={[styles.pageIndicator, { color: colors.textSecondary }]}>
            Page <Text style={{ color: colors.textPrimary, fontWeight: '700' }}>{page}</Text> of {totalPages}
            {'  '}({totalJobs} total jobs)
          </Text>

          <TouchableOpacity
            style={[styles.pageBtn, page >= totalPages && { opacity: 0.3 }]}
            disabled={page >= totalPages || isFetching}
            onPress={() => { setPage((p) => Math.min(totalPages, p + 1)); }}
          >
            <Text style={[styles.pageBtnText, { color: colors.primary }]}>Next ›</Text>
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
          <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.8)' }]}>
            <View style={[styles.modalContent, { backgroundColor: colors.surface, borderColor: colors.primary }]}>
              <View style={[styles.modalHeader, { backgroundColor: colors.primary + '20' }]}>
                <Text style={[styles.modalBadgeText, { color: colors.primary }]}>
                  🎉 Desired High Match ({Math.round(selectedHighMatch.match_score * 100)}%)
                </Text>
              </View>

              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                {cleanText(selectedHighMatch.job.title)}
              </Text>
              <Text style={[styles.modalCompany, { color: colors.primary }]}>
                {cleanText(selectedHighMatch.job.company.name)} • {cleanText(selectedHighMatch.job.location) || 'Remote'}
              </Text>

              {selectedHighMatch.matched_resume_category && (
                <View style={[styles.boundResumeBox, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
                  <Text style={[styles.boundResumeText, { color: colors.textSecondary }]}>
                    📄 Matched with: <Text style={{ color: colors.primary, fontWeight: '700' }}>{selectedHighMatch.matched_resume_category} Resume</Text>
                  </Text>
                </View>
              )}

              {((selectedHighMatch.job as JobDetailOut).description) ? (
                <Text style={[styles.modalDesc, { color: colors.textSecondary }]} numberOfLines={5}>
                  {cleanText((selectedHighMatch.job as JobDetailOut).description)}
                </Text>
              ) : (
                <Text style={[styles.modalDesc, { color: colors.textSecondary }]} numberOfLines={4}>
                  Full software engineering role at {cleanText(selectedHighMatch.job.company.name)}. Tap to review complete details and apply.
                </Text>
              )}

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
                    <Text style={styles.modalApplyText}>⚡ One-Click Apply</Text>
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
  container: { flex: 1, paddingBottom: 110 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing['2xl'],
    paddingTop: 56,
    paddingBottom: Spacing.base,
  },
  greeting: { fontSize: Typography.xs, textTransform: 'uppercase', letterSpacing: 1 },
  title: { fontSize: Typography['2xl'], fontWeight: '800', letterSpacing: -0.5 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  themeToggleBtn: {
    width: 38,
    height: 38,
    borderRadius: Radius.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBtn: {
    paddingHorizontal: Spacing.base,
    paddingVertical: 8,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  filterBtnText: { fontSize: Typography.sm, fontWeight: '600' },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: Spacing['2xl'],
    borderBottomWidth: 1,
    marginBottom: Spacing.xs,
  },
  tabItem: {
    paddingVertical: Spacing.md,
    marginRight: Spacing.xl,
  },
  tabText: {
    fontSize: Typography.sm,
    fontWeight: '700',
  },
  list: { paddingHorizontal: Spacing.base, paddingBottom: Spacing['2xl'] },
  loadingCenter: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.base },
  loadingText: { fontSize: Typography.base },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: Spacing.base },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { fontSize: Typography.xl, fontWeight: '700' },
  emptySubtitle: { fontSize: Typography.base, textAlign: 'center', paddingHorizontal: Spacing['2xl'] },

  // Pagination styles
  paginationFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: 12,
    borderTopWidth: 1,
    marginBottom: 4,
  },
  pageBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  pageBtnText: {
    fontSize: Typography.md,
    fontWeight: '800',
  },
  pageIndicator: {
    fontSize: Typography.sm,
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
  },
  modalContent: {
    width: '100%',
    borderRadius: Radius['2xl'],
    borderWidth: 1.5,
    padding: Spacing.xl,
  },
  modalHeader: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radius.full,
    marginBottom: Spacing.md,
  },
  modalBadgeText: {
    fontSize: Typography.xs,
    fontWeight: '800',
  },
  modalTitle: {
    fontSize: Typography.xl,
    fontWeight: '800',
    marginBottom: 4,
  },
  modalCompany: {
    fontSize: Typography.sm,
    fontWeight: '700',
    marginBottom: Spacing.md,
  },
  boundResumeBox: {
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
    marginBottom: Spacing.md,
  },
  boundResumeText: {
    fontSize: Typography.xs,
  },
  modalDesc: {
    fontSize: Typography.sm,
    lineHeight: Typography.sm * 1.5,
    marginBottom: Spacing.xl,
  },
  modalActions: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: Radius.xl,
    borderWidth: 1,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: Typography.sm,
    fontWeight: '600',
  },
  modalApplyBtn: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: Radius.xl,
    alignItems: 'center',
  },
  modalApplyText: {
    fontSize: Typography.sm,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
