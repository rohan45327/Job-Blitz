import React from 'react';
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

export function CompanyBriefModal({ visible, jobId, onClose }: Props) {
  const { colors } = useTheme();

  const { data, isLoading } = useQuery({
    queryKey: ['company-brief', jobId],
    queryFn: () => api.getCompanyBrief(jobId),
    enabled: visible && !!jobId,
  });

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.handle, { backgroundColor: colors.border }]} />

        <View style={styles.header}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, paddingRight: Spacing.sm }}>
            <Feather name="file-text" size={18} color={colors.primary} />
            <Text style={[styles.title, { color: colors.textPrimary }]} numberOfLines={1}>5-Minute Company Brief</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
            <Feather name="x" size={16} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {isLoading || !data ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Synthesizing company signals...</Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
            {/* Overview */}
            <View style={styles.section}>
              <Text style={[styles.companyName, { color: colors.textPrimary }]}>{data.company_name}</Text>
              <Text style={[styles.roleTitle, { color: colors.textSecondary }]}>{data.role_title}</Text>
              <Text style={[styles.summaryText, { color: colors.textPrimary }]}>{data.summary_5min}</Text>
            </View>

            {/* Why role exists */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>Why This Role Exists</Text>
              <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.cardText, { color: colors.textSecondary }]}>{data.why_role_exists}</Text>
              </View>
            </View>

            {/* Tech signals */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>Key Technology Signals</Text>
              <View style={styles.chipRow}>
                {data.tech_signals.map((tech, i) => (
                  <View key={i} style={[styles.chip, { backgroundColor: colors.primary + '16', borderColor: colors.primary + '30' }]}>
                    <Text style={[styles.chipText, { color: colors.primary }]}>{tech}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Questions to ask */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>Smart Questions to Ask Interviewers</Text>
              {data.questions_to_ask_interviewer.map((q, i) => (
                <View key={i} style={[styles.qItem, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <Feather name="help-circle" size={14} color={colors.primary} />
                  <Text style={[styles.qText, { color: colors.textPrimary }]}>{q}</Text>
                </View>
              ))}
            </View>

            {/* Provenance */}
            <View style={styles.provenanceTag}>
              <Feather name="info" size={12} color={colors.textMuted} />
              <Text style={[styles.provenanceText, { color: colors.textMuted }]}>Source: {data.provenance}</Text>
            </View>
          </ScrollView>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: Spacing['2xl'] },
  handle: { width: 36, height: 4, borderRadius: Radius.full, alignSelf: 'center', marginTop: Spacing.md, marginBottom: Spacing.base },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.lg },
  title: { fontSize: Typography.xl, fontWeight: '800' },
  closeBtn: { width: 32, height: 32, borderRadius: Radius.full, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  loadingBox: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md },
  loadingText: { fontSize: Typography.base },
  scroll: { paddingBottom: 60 },
  section: { marginBottom: Spacing.xl },
  companyName: { fontSize: Typography['2xl'], fontWeight: '800' },
  roleTitle: { fontSize: Typography.base, marginBottom: Spacing.sm },
  summaryText: { fontSize: Typography.base, lineHeight: Typography.base * 1.6 },
  sectionTitle: { fontSize: Typography.xs, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: Spacing.md },
  card: { padding: Spacing.base, borderRadius: Radius.xl, borderWidth: 1 },
  cardText: { fontSize: Typography.sm, lineHeight: Typography.sm * 1.6 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  chip: { paddingHorizontal: Spacing.md, paddingVertical: 6, borderRadius: Radius.full, borderWidth: 1 },
  chipText: { fontSize: Typography.xs, fontWeight: '700' },
  qItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: Spacing.base, borderRadius: Radius.xl, borderWidth: 1, marginBottom: Spacing.sm },
  qText: { fontSize: Typography.sm, flex: 1, lineHeight: Typography.sm * 1.5, fontWeight: '600' },
  provenanceTag: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: Spacing.md, alignSelf: 'center' },
  provenanceText: { fontSize: Typography.xs },
});
