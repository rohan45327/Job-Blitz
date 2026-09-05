import React from 'react';
import {
  Modal, View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../api/client';
import { Typography, Spacing, Radius } from '../../theme/tokens';
import { useTheme } from '../../theme/ThemeContext';
import { ErrorCard } from '../common/ErrorCard';

interface Props {
  visible: boolean;
  jobId: string;
  onClose: () => void;
}

export function EvidenceMapModal({ visible, jobId, onClose }: Props) {
  const { colors } = useTheme();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['evidence-map', jobId],
    queryFn: () => api.getEvidenceMap(jobId),
    enabled: visible && !!jobId,
  });

  const getStrengthColor = (strength: string) => {
    switch (strength) {
      case 'strong':
        return colors.success || '#10b981';
      case 'moderate':
        return colors.warning || '#f59e0b';
      default:
        return colors.danger || '#ef4444';
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.handle, { backgroundColor: colors.border }]} />

        <View style={styles.header}>
          <View style={styles.headerTitleRow}>
            <Feather name="layers" size={18} color={colors.primary} />
            <Text style={[styles.title, { color: colors.textPrimary }]} numberOfLines={1}>Project Evidence Map</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
            <Feather name="x" size={16} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Mapping portfolio projects to requirements...</Text>
          </View>
        ) : error ? (
          <View style={styles.centerBox}>
            <ErrorCard message="Could not load project evidence map." onRetry={refetch} />
          </View>
        ) : !data ? null : (
          <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
            {/* Top Summary Banner */}
            <View style={[styles.summaryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.coverageRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.roleTitle, { color: colors.textSecondary }]}>{data.role_title}</Text>
                  <Text style={[styles.coverageLabel, { color: colors.textPrimary }]}>Requirement Coverage</Text>
                </View>
                <View style={[styles.coverageBadge, { backgroundColor: colors.primary + '18' }]}>
                  <Text style={[styles.coverageValue, { color: colors.primary }]}>{data.coverage_percentage}%</Text>
                </View>
              </View>

              <View style={[styles.takeawayBox, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
                <Feather name="info" size={14} color={colors.primary} style={{ marginTop: 2 }} />
                <Text style={[styles.takeawayText, { color: colors.textPrimary }]}>{data.key_takeaway}</Text>
              </View>
            </View>

            {/* Mapped Projects Section */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
                Project Evidence ({data.mapped_projects.length})
              </Text>

              {data.mapped_projects.length === 0 ? (
                <View style={[styles.emptyBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <Feather name="folder" size={24} color={colors.textMuted} />
                  <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                    No portfolio projects added yet. Add projects to generate evidence mapping.
                  </Text>
                </View>
              ) : (
                data.mapped_projects.map((proj) => {
                  const sColor = getStrengthColor(proj.strength);
                  return (
                    <View key={proj.project_id} style={[styles.projectCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                      <View style={styles.projectHeader}>
                        <Text style={[styles.projectTitle, { color: colors.textPrimary }]}>{proj.project_title}</Text>
                        <View style={[styles.strengthTag, { backgroundColor: sColor + '18', borderColor: sColor + '40' }]}>
                          <Text style={[styles.strengthText, { color: sColor }]}>{proj.strength.toUpperCase()}</Text>
                        </View>
                      </View>

                      {proj.matched_requirements.length > 0 && (
                        <View style={styles.chipSection}>
                          <Text style={[styles.chipLabel, { color: colors.textMuted }]}>Matched Requirements:</Text>
                          <View style={styles.chipRow}>
                            {proj.matched_requirements.map((req, i) => (
                              <View key={i} style={[styles.chip, { backgroundColor: colors.primary + '12' }]}>
                                <Feather name="check" size={10} color={colors.primary} />
                                <Text style={[styles.chipText, { color: colors.primary }]}>{req}</Text>
                              </View>
                            ))}
                          </View>
                        </View>
                      )}

                      {proj.matched_skills.length > 0 && (
                        <View style={styles.chipSection}>
                          <Text style={[styles.chipLabel, { color: colors.textMuted }]}>Matched Skills:</Text>
                          <View style={styles.chipRow}>
                            {proj.matched_skills.map((sk, i) => (
                              <View key={i} style={[styles.chip, { backgroundColor: colors.surfaceElevated }]}>
                                <Text style={[styles.chipText, { color: colors.textSecondary }]}>{sk}</Text>
                              </View>
                            ))}
                          </View>
                        </View>
                      )}

                      {proj.talking_points.length > 0 && (
                        <View style={styles.tpSection}>
                          <Text style={[styles.chipLabel, { color: colors.textMuted }]}>Key Talking Points:</Text>
                          {proj.talking_points.map((tp, i) => (
                            <View key={i} style={styles.tpRow}>
                              <Text style={[styles.bullet, { color: colors.primary }]}>•</Text>
                              <Text style={[styles.tpText, { color: colors.textPrimary }]}>{tp}</Text>
                            </View>
                          ))}
                        </View>
                      )}
                    </View>
                  );
                })
              )}
            </View>

            {/* Unmapped Requirements Section */}
            {data.unmapped_requirements.length > 0 && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
                  Unmapped Requirements & Gap Strategies ({data.unmapped_requirements.length})
                </Text>

                {data.unmapped_requirements.map((unm, i) => (
                  <View key={i} style={[styles.unmappedCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <Feather name="alert-circle" size={14} color={colors.warning || '#f59e0b'} />
                      <Text style={[styles.unmappedReq, { color: colors.textPrimary }]}>{unm.requirement}</Text>
                    </View>
                    <Text style={[styles.unmappedSugg, { color: colors.textSecondary }]}>{unm.suggestion}</Text>
                  </View>
                ))}
              </View>
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
  title: { fontSize: Typography.lg, fontWeight: '700' },
  closeBtn: { width: 32, height: 32, borderRadius: Radius.full, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  centerBox: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: Spacing['3xl'] },
  loadingText: { marginTop: Spacing.md, fontSize: Typography.sm },
  scroll: { paddingBottom: Spacing['3xl'] },
  summaryCard: { padding: Spacing.md, borderRadius: Radius.lg, borderWidth: 1, marginBottom: Spacing.lg },
  coverageRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  roleTitle: { fontSize: Typography.xs, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  coverageLabel: { fontSize: Typography.md, fontWeight: '700', marginTop: 2 },
  coverageBadge: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: Radius.full },
  coverageValue: { fontSize: Typography.lg, fontWeight: '800' },
  takeawayBox: { flexDirection: 'row', gap: 8, padding: Spacing.sm, borderRadius: Radius.md, borderWidth: 1 },
  takeawayText: { flex: 1, fontSize: Typography.xs, lineHeight: 18 },
  section: { marginBottom: Spacing.lg },
  sectionTitle: { fontSize: Typography.xs, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: Spacing.sm },
  emptyBox: { padding: Spacing.xl, borderRadius: Radius.md, borderWidth: 1, alignItems: 'center', gap: 8 },
  emptyText: { fontSize: Typography.sm, textAlign: 'center' },
  projectCard: { padding: Spacing.md, borderRadius: Radius.md, borderWidth: 1, marginBottom: Spacing.md, gap: Spacing.sm },
  projectHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  projectTitle: { fontSize: Typography.base, fontWeight: '700', flex: 1, paddingRight: Spacing.sm },
  strengthTag: { paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: Radius.sm, borderWidth: 1 },
  strengthText: { fontSize: Typography.xs, fontWeight: '700' },
  chipSection: { marginTop: 2 },
  chipLabel: { fontSize: Typography.xs, fontWeight: '600', marginBottom: 4 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radius.sm },
  chipText: { fontSize: Typography.xs, fontWeight: '600' },
  tpSection: { marginTop: 4 },
  tpRow: { flexDirection: 'row', gap: 6, marginTop: 2 },
  bullet: { fontSize: Typography.sm, fontWeight: '700' },
  tpText: { flex: 1, fontSize: Typography.xs, lineHeight: 18 },
  unmappedCard: { padding: Spacing.md, borderRadius: Radius.md, borderWidth: 1, marginBottom: Spacing.sm },
  unmappedReq: { fontSize: Typography.sm, fontWeight: '600', flex: 1 },
  unmappedSugg: { fontSize: Typography.xs, lineHeight: 18, marginTop: 2 },
});
