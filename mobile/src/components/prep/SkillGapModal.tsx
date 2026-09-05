import React, { useState } from 'react';
import {
  Modal, View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { api, SkillRemediation } from '../../api/client';
import { Typography, Spacing, Radius } from '../../theme/tokens';
import { useTheme } from '../../theme/ThemeContext';
import { ErrorCard } from '../common/ErrorCard';

interface Props {
  visible: boolean;
  jobId: string;
  onClose: () => void;
}

export function SkillGapModal({ visible, jobId, onClose }: Props) {
  const { colors } = useTheme();
  const [activeTab, setActiveTab] = useState<'critical' | 'secondary'>('critical');

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['skill-gaps', jobId],
    queryFn: () => api.getSkillGaps(jobId),
    enabled: visible && !!jobId,
  });

  const criticalCount = data?.critical_gaps.length ?? 0;
  const secondaryCount = data?.secondary_gaps.length ?? 0;

  const renderGapCard = (item: SkillRemediation, index: number) => {
    const isCritical = item.category === 'critical';
    const badgeColor = isCritical ? (colors.error || '#EF4444') : (colors.primary || '#6366F1');

    return (
      <View key={index} style={[styles.gapCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.gapHeader}>
          <View style={styles.skillTitleRow}>
            <View style={[styles.dot, { backgroundColor: badgeColor }]} />
            <Text style={[styles.skillName, { color: colors.textPrimary }]}>{item.skill_name}</Text>
          </View>

          <View style={styles.tagRow}>
            <View style={[styles.priorityBadge, { backgroundColor: badgeColor + '18', borderColor: badgeColor + '40' }]}>
              <Text style={[styles.priorityText, { color: badgeColor }]}>{item.priority.toUpperCase()}</Text>
            </View>

            <View style={[styles.hoursBadge, { backgroundColor: colors.surfaceElevated }]}>
              <Feather name="clock" size={11} color={colors.textMuted} />
              <Text style={[styles.hoursText, { color: colors.textSecondary }]}>~{item.estimated_hours}h</Text>
            </View>
          </View>
        </View>

        <View style={[styles.strategyBox, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
          <Feather name="zap" size={13} color={colors.primary} style={{ marginTop: 2 }} />
          <Text style={[styles.strategyText, { color: colors.textPrimary }]}>{item.remediation_strategy}</Text>
        </View>
      </View>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.handle, { backgroundColor: colors.border }]} />

        <View style={styles.header}>
          <View style={styles.headerTitleRow}>
            <Feather name="target" size={18} color={colors.primary} />
            <Text style={[styles.title, { color: colors.textPrimary }]} numberOfLines={1}>Skill Gap Classifier</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
            <Feather name="x" size={16} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Classifying skill gaps & remediation strategies...</Text>
          </View>
        ) : error ? (
          <View style={styles.centerBox}>
            <ErrorCard message="Could not load skill gap classification." onRetry={refetch} />
          </View>
        ) : !data ? null : (
          <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
            {/* Top Summary Banner */}
            <View style={[styles.summaryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.roleTitle, { color: colors.textMuted }]}>{data.role_title.toUpperCase()}</Text>
              <Text style={[styles.summaryHeadline, { color: colors.textPrimary }]}>{data.summary}</Text>
            </View>

            {/* Tab Selector */}
            <View style={[styles.tabRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <TouchableOpacity
                style={[
                  styles.tab,
                  activeTab === 'critical' && [styles.activeTab, { backgroundColor: colors.primary + '18' }],
                ]}
                onPress={() => setActiveTab('critical')}
              >
                <Text style={[styles.tabText, { color: activeTab === 'critical' ? colors.primary : colors.textMuted }]}>
                  Critical Gaps ({criticalCount})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.tab,
                  activeTab === 'secondary' && [styles.activeTab, { backgroundColor: colors.primary + '18' }],
                ]}
                onPress={() => setActiveTab('secondary')}
              >
                <Text style={[styles.tabText, { color: activeTab === 'secondary' ? colors.primary : colors.textMuted }]}>
                  Secondary Tools ({secondaryCount})
                </Text>
              </TouchableOpacity>
            </View>

            {/* Gap List */}
            {activeTab === 'critical' ? (
              criticalCount === 0 ? (
                <View style={[styles.emptyBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <Feather name="check-circle" size={24} color={colors.success || '#10B981'} />
                  <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                    No critical skill gaps! You match all essential requirements for this role.
                  </Text>
                </View>
              ) : (
                data.critical_gaps.map((item, idx) => renderGapCard(item, idx))
              )
            ) : (
              secondaryCount === 0 ? (
                <View style={[styles.emptyBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <Feather name="check-circle" size={24} color={colors.success || '#10B981'} />
                  <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                    No secondary tool gaps found.
                  </Text>
                </View>
              ) : (
                data.secondary_gaps.map((item, idx) => renderGapCard(item, idx))
              )
            )}
          </ScrollView>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: Spacing['2xl'] },
  handle: { width: 36, height: 4, borderRadius: Radius.full, alignSelf: 'center', marginTop: Spacing.md, marginBottom: Spacing.base },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, paddingRight: Spacing.sm },
  title: { fontSize: Typography.fontSize.lg, fontWeight: Typography.fontWeight.semibold },
  closeBtn: { width: 32, height: 32, borderRadius: Radius.full, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  centerBox: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: Spacing['3xl'] },
  loadingText: { marginTop: Spacing.md, fontSize: Typography.fontSize.sm },
  scroll: { paddingBottom: Spacing['3xl'] },
  summaryCard: { padding: Spacing.md, borderRadius: Radius.lg, borderWidth: 1, marginBottom: Spacing.md },
  roleTitle: { fontSize: Typography.fontSize.xs, fontWeight: Typography.fontWeight.bold, letterSpacing: 0.8, marginBottom: 4 },
  summaryHeadline: { fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.medium, lineHeight: 20 },
  tabRow: { flexDirection: 'row', padding: 4, borderRadius: Radius.md, borderWidth: 1, marginBottom: Spacing.md },
  tab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: Radius.sm },
  activeTab: { borderRadius: Radius.sm },
  tabText: { fontSize: Typography.fontSize.xs, fontWeight: Typography.fontWeight.bold },
  gapCard: { padding: Spacing.md, borderRadius: Radius.md, borderWidth: 1, marginBottom: Spacing.md, gap: Spacing.sm },
  gapHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  skillTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, paddingRight: Spacing.xs },
  dot: { width: 8, height: 8, borderRadius: Radius.full },
  skillName: { fontSize: Typography.fontSize.base, fontWeight: Typography.fontWeight.bold },
  tagRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  priorityBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: Radius.sm, borderWidth: 1 },
  priorityText: { fontSize: Typography.fontSize.xs, fontWeight: Typography.fontWeight.bold },
  hoursBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 6, paddingVertical: 2, borderRadius: Radius.sm },
  hoursText: { fontSize: Typography.fontSize.xs, fontWeight: Typography.fontWeight.medium },
  strategyBox: { flexDirection: 'row', gap: 8, padding: Spacing.sm, borderRadius: Radius.sm, borderWidth: 1 },
  strategyText: { flex: 1, fontSize: Typography.fontSize.xs, lineHeight: 18 },
  emptyBox: { padding: Spacing.xl, borderRadius: Radius.md, borderWidth: 1, alignItems: 'center', gap: 8 },
  emptyText: { fontSize: Typography.fontSize.sm, textAlign: 'center' },
});
