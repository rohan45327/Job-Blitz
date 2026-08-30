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

export function ResumeDefenseModal({ visible, jobId, onClose }: Props) {
  const { colors } = useTheme();

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
            <Text style={[styles.subtitle, { color: colors.textMuted }]}>
              Questions an interviewer is likely to ask about your projects & experience:
            </Text>

            <View style={styles.qList}>
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
  subtitle: { fontSize: Typography.sm, marginBottom: Spacing.lg },
  qList: { gap: Spacing.lg },
  card: { padding: Spacing.base, borderRadius: Radius.xl, borderWidth: 1 },
  focusTag: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radius.full, borderWidth: 1, marginBottom: Spacing.sm },
  focusTagText: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
  qText: { fontSize: Typography.base, fontWeight: '700', lineHeight: Typography.base * 1.5, marginBottom: Spacing.md },
  defenseBox: { padding: Spacing.md, borderRadius: Radius.lg, borderWidth: 1 },
  defenseLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 0.8, marginBottom: 4 },
  defenseText: { fontSize: Typography.xs, lineHeight: Typography.xs * 1.6 },
});
