import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParams } from '../../../App';
import { api } from '../../api/client';
import { Typography, Spacing, Radius } from '../../theme/tokens';
import { useTheme } from '../../theme/ThemeContext';

type Props = NativeStackScreenProps<RootStackParams, 'CompanyIntelligence'>;

export function CompanyIntelligenceScreen({ route, navigation }: Props) {
  const { jobId } = route.params;
  const { colors } = useTheme();

  const { data: compData, isLoading: isCompLoading } = useQuery({
    queryKey: ['company-intelligence', jobId],
    queryFn: () => api.getCompanyIntelligence(jobId),
  });

  const { data: benchData } = useQuery({
    queryKey: ['candidate-benchmark', jobId],
    queryFn: () => api.getCandidateBenchmark(jobId),
  });

  if (isCompLoading || !compData) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Back button */}
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Feather name="arrow-left" size={20} color={colors.textSecondary} />
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.companyName, { color: colors.textPrimary }]}>{compData.company_name}</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>Company & Hiring Intelligence</Text>

          <View style={[styles.sentimentTag, { backgroundColor: colors.success + '16', borderColor: colors.success + '40' }]}>
            <Feather name="trending-up" size={12} color={colors.success} />
            <Text style={[styles.sentimentText, { color: colors.success }]}>{compData.public_sentiment}</Text>
          </View>
        </View>

        {/* Hiring Funnel Stages */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>How This Company Hires</Text>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {compData.hiring_funnel.map((stage, idx) => (
              <View key={idx} style={styles.funnelItem}>
                <View style={[styles.funnelIndex, { backgroundColor: colors.primary + '18' }]}>
                  <Text style={[styles.funnelIndexText, { color: colors.primary }]}>{idx + 1}</Text>
                </View>
                <Text style={[styles.funnelText, { color: colors.textPrimary }]}>{stage}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* What the Team Values */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>What This Team Values</Text>
          <View style={{ gap: Spacing.sm }}>
            {compData.what_team_values.map((val, idx) => (
              <View key={idx} style={[styles.valueCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Feather name="check" size={14} color={colors.primary} />
                <Text style={[styles.valueText, { color: colors.textSecondary }]}>{val}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Candidate Benchmark */}
        {benchData && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>What Successful Candidates Look Like</Text>
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.benchRow}>
                <Text style={[styles.benchLabel, { color: colors.textSecondary }]}>Skill Coverage</Text>
                <Text style={[styles.benchValue, { color: colors.primary }]}>{Math.round(benchData.user_skill_coverage * 100)}% (You) vs 85% (Benchmark)</Text>
              </View>
              <View style={styles.benchRow}>
                <Text style={[styles.benchLabel, { color: colors.textSecondary }]}>Project Count</Text>
                <Text style={[styles.benchValue, { color: colors.primary }]}>{benchData.user_project_count} Projects (You) vs {benchData.benchmark_project_count} (Benchmark)</Text>
              </View>
              <Text style={[styles.benchMeta, { color: colors.textMuted }]}>{benchData.data_label}</Text>
            </View>
          </View>
        )}

        {/* Tech Stack */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>Tech Stack & Tools</Text>
          <View style={styles.chipRow}>
            {compData.tech_stack.map((t, i) => (
              <View key={i} style={[styles.chip, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
                <Text style={[styles.chipText, { color: colors.textPrimary }]}>{t}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Provenance */}
        <View style={styles.provenanceTag}>
          <Feather name="shield" size={12} color={colors.textMuted} />
          <Text style={[styles.provenanceText, { color: colors.textMuted }]}>Evidence Source: {compData.provenance}</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  backBtn: { paddingHorizontal: Spacing['2xl'], paddingTop: 56, paddingBottom: Spacing.base, alignSelf: 'flex-start' },
  scroll: { paddingHorizontal: Spacing['2xl'], paddingBottom: 100 },
  header: { marginBottom: Spacing.xl },
  companyName: { fontSize: Typography['3xl'], fontWeight: '800' },
  subtitle: { fontSize: Typography.sm, marginTop: 2, marginBottom: Spacing.sm },
  sentimentTag: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: Spacing.md, paddingVertical: 5, borderRadius: Radius.full, borderWidth: 1, alignSelf: 'flex-start' },
  sentimentText: { fontSize: Typography.xs, fontWeight: '700' },
  section: { marginBottom: Spacing['2xl'] },
  sectionTitle: { fontSize: Typography.xs, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: Spacing.md },
  card: { padding: Spacing.base, borderRadius: Radius.xl, borderWidth: 1, gap: Spacing.sm },
  funnelItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  funnelIndex: { width: 26, height: 26, borderRadius: Radius.full, alignItems: 'center', justifyContent: 'center' },
  funnelIndexText: { fontSize: Typography.xs, fontWeight: '800' },
  funnelText: { fontSize: Typography.sm, fontWeight: '600' },
  valueCard: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: Spacing.md, borderRadius: Radius.lg, borderWidth: 1 },
  valueText: { fontSize: Typography.sm, flex: 1 },
  benchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  benchLabel: { fontSize: Typography.sm },
  benchValue: { fontSize: Typography.sm, fontWeight: '700' },
  benchMeta: { fontSize: Typography.xs, marginTop: 4 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  chip: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: Radius.full, borderWidth: 1 },
  chipText: { fontSize: Typography.sm, fontWeight: '600' },
  provenanceTag: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: Spacing.md, alignSelf: 'center' },
  provenanceText: { fontSize: Typography.xs },
});
