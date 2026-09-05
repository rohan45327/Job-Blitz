import React, { useState } from 'react';
import {
  Modal, View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../api/client';
import { Typography, Spacing, Radius } from '../../theme/tokens';
import { useTheme } from '../../theme/ThemeContext';

interface Props {
  visible: boolean;
  jobId: string;
  onClose: () => void;
}

export function ResumeDefenseModal({ visible, jobId, onClose }: Props) {
  const { colors } = useTheme();
  const [activeTab, setActiveTab] = useState<'questions' | 'vulnerabilities'>('questions');

  const { data, isLoading } = useQuery({
    queryKey: ['resume-defense', jobId],
    queryFn: () => api.getResumeDefense(jobId),
    enabled: visible && !!jobId,
  });

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.handle, { backgroundColor: colors.border }]} />

        <View style={styles.header}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, paddingRight: Spacing.sm }}>
            <Feather name="shield" size={18} color={colors.accent} />
            <Text style={[styles.title, { color: colors.textPrimary }]} numberOfLines={1}>Resume Defense Mode</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
            <Feather name="x" size={16} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {isLoading || !data ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={colors.accent} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Analyzing your resume & projects...</Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
            {/* Recommended Resume Category Banner */}
            {data.recommended_resume_category && (
              <View style={[styles.recBanner, { backgroundColor: colors.primary + '18', borderColor: colors.primary + '40' }]}>
                <Feather name="file-text" size={14} color={colors.primary} />
                <Text style={[styles.recBannerText, { color: colors.primary }]}>
                  Optimal Resume Variant: <Text style={{ fontWeight: '800' }}>{data.recommended_resume_category}</Text>
                </Text>
              </View>
            )}

            {/* Segmented Control */}
            <View style={[styles.tabSegment, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
              <TouchableOpacity
                style={[styles.tabBtn, activeTab === 'questions' && { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }]}
                onPress={() => setActiveTab('questions')}
              >
                <Text style={[styles.tabBtnText, { color: activeTab === 'questions' ? colors.textPrimary : colors.textMuted }]}>
                  🎯 Grilling Questions ({data.potential_questions.length})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.tabBtn, activeTab === 'vulnerabilities' && { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }]}
                onPress={() => setActiveTab('vulnerabilities')}
              >
                <Text style={[styles.tabBtnText, { color: activeTab === 'vulnerabilities' ? colors.textPrimary : colors.textMuted }]}>
                  ⚡ Vulnerabilities ({data.vulnerabilities?.length ?? 0})
                </Text>
              </TouchableOpacity>
            </View>

            {activeTab === 'questions' ? (
              <View style={styles.qList}>
                <Text style={[styles.subtitle, { color: colors.textMuted }]}>
                  Questions an interviewer is likely to ask about your projects & experience:
                </Text>
                {data.potential_questions.map((qItem, idx) => (
                  <View key={idx} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <View style={[styles.focusTag, { backgroundColor: colors.accent + '16', borderColor: colors.accent + '40' }]}>
                      <Text style={[styles.focusTagText, { color: colors.accent }]}>{qItem.focus}</Text>
                    </View>
                    <Text style={[styles.qText, { color: colors.textPrimary }]}>{qItem.question}</Text>

                    <View style={[styles.defenseBox, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
                      <Text style={[styles.defenseLabel, { color: colors.textMuted }]}>SUGGESTED DEFENSE STRATEGY</Text>
                      <Text style={[styles.defenseText, { color: colors.textSecondary }]}>{qItem.suggested_defense}</Text>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.qList}>
                <Text style={[styles.subtitle, { color: colors.textMuted }]}>
                  Potential weak spots in your resume & how to defend them proactively:
                </Text>
                {(data.vulnerabilities ?? []).map((vItem, idx) => (
                  <View key={idx} style={[styles.card, { backgroundColor: colors.surface, borderColor: '#F59E0B40' }]}>
                    <View style={[styles.focusTag, { backgroundColor: '#F59E0B1A', borderColor: '#F59E0B40' }]}>
                      <Text style={[styles.focusTagText, { color: '#F59E0B' }]}>{vItem.area}</Text>
                    </View>
                    <Text style={[styles.vulnText, { color: colors.textPrimary }]}>{vItem.vulnerability}</Text>

                    <View style={[styles.defenseBox, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
                      <Text style={[styles.defenseLabel, { color: colors.success }]}>PROACTIVE MITIGATION</Text>
                      <Text style={[styles.defenseText, { color: colors.textSecondary }]}>{vItem.mitigation}</Text>
                    </View>
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
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.md },
  title: { fontSize: Typography.xl, fontWeight: '800' },
  closeBtn: { width: 32, height: 32, borderRadius: Radius.full, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  loadingBox: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md },
  loadingText: { fontSize: Typography.base },
  scroll: { paddingBottom: 60 },
  recBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    padding: Spacing.md, borderRadius: Radius.lg, borderWidth: 1,
    marginBottom: Spacing.md,
  },
  recBannerText: { fontSize: Typography.xs, fontWeight: '600' },
  tabSegment: {
    flexDirection: 'row', padding: 4, borderRadius: Radius.xl, borderWidth: 1, marginBottom: Spacing.lg,
  },
  tabBtn: { flex: 1, paddingVertical: 8, borderRadius: Radius.lg, alignItems: 'center' },
  tabBtnText: { fontSize: Typography.xs, fontWeight: '700' },
  subtitle: { fontSize: Typography.sm, marginBottom: Spacing.md },
  qList: { gap: Spacing.md },
  card: { padding: Spacing.base, borderRadius: Radius.xl, borderWidth: 1 },
  focusTag: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radius.full, borderWidth: 1, marginBottom: Spacing.sm },
  focusTagText: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
  qText: { fontSize: Typography.base, fontWeight: '700', lineHeight: Typography.base * 1.5, marginBottom: Spacing.md },
  vulnText: { fontSize: Typography.base, fontWeight: '600', lineHeight: Typography.base * 1.4, marginBottom: Spacing.md },
  defenseBox: { padding: Spacing.md, borderRadius: Radius.lg, borderWidth: 1 },
  defenseLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 0.8, marginBottom: 4 },
  defenseText: { fontSize: Typography.xs, lineHeight: Typography.xs * 1.6 },
});
