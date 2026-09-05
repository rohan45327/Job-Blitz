import React, { useState } from 'react';
import {
  Modal, View, Text, StyleSheet, TouchableOpacity, ScrollView,
  TextInput, ActivityIndicator, Alert
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useMutation } from '@tanstack/react-query';
import { api, STARStoryReviewResponse } from '../../api/client';
import { Typography, Spacing, Radius } from '../../theme/tokens';
import { useTheme } from '../../theme/ThemeContext';

interface Props {
  visible: boolean;
  jobId: string;
  onClose: () => void;
}

export function STARStoryModal({ visible, jobId, onClose }: Props) {
  const { colors } = useTheme();

  const [title, setTitle] = useState('');
  const [situation, setSituation] = useState('');
  const [task, setTask] = useState('');
  const [action, setAction] = useState('');
  const [result, setResult] = useState('');

  const [reviewResult, setReviewResult] = useState<STARStoryReviewResponse | null>(null);

  const reviewMutation = useMutation({
    mutationFn: () => api.reviewSTARStory({
      job_id: jobId,
      title: title.trim() || 'Behavioral Response',
      situation,
      task,
      action,
      result,
    }),
    onSuccess: (data) => setReviewResult(data),
    onError: (e: any) => Alert.alert('Error', e.message || 'Could not review STAR story'),
  });

  const handleReset = () => {
    setReviewResult(null);
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.handle, { backgroundColor: colors.border }]} />

        <View style={styles.header}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, paddingRight: Spacing.sm }}>
            <Feather name="star" size={18} color={colors.primary} />
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]} numberOfLines={1}>
              STAR Story Builder & Evaluator
            </Text>
          </View>
          <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
            <Feather name="x" size={16} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {!reviewResult ? (
            <View style={styles.formContainer}>
              <Text style={[styles.subtitle, { color: colors.textMuted }]}>
                Formulate a structured behavioral answer for technical & leadership interviews:
              </Text>

              {/* Title */}
              <View style={styles.fieldGroup}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Story Title / Question Focus</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.textPrimary }]}
                  placeholder="e.g. Debugging a critical database bottleneck under deadline"
                  placeholderTextColor={colors.textMuted}
                  value={title}
                  onChangeText={setTitle}
                />
              </View>

              {/* Situation */}
              <View style={styles.fieldGroup}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>S — Situation (Context & Challenge)</Text>
                <TextInput
                  style={[styles.textArea, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.textPrimary }]}
                  placeholder="What was the background, project goal, and team situation?"
                  placeholderTextColor={colors.textMuted}
                  value={situation}
                  onChangeText={setSituation}
                  multiline
                />
              </View>

              {/* Task */}
              <View style={styles.fieldGroup}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>T — Task (Your Responsibility)</Text>
                <TextInput
                  style={[styles.textArea, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.textPrimary }]}
                  placeholder="What specific outcome or fix were you responsible for delivering?"
                  placeholderTextColor={colors.textMuted}
                  value={task}
                  onChangeText={setTask}
                  multiline
                />
              </View>

              {/* Action */}
              <View style={styles.fieldGroup}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>A — Action (Technical Execution)</Text>
                <TextInput
                  style={[styles.textArea, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.textPrimary }]}
                  placeholder="Detail step-by-step tools, code choices, profiling, and debugging steps."
                  placeholderTextColor={colors.textMuted}
                  value={action}
                  onChangeText={setAction}
                  multiline
                />
              </View>

              {/* Result */}
              <View style={styles.fieldGroup}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>R — Result (Quantitative Impact)</Text>
                <TextInput
                  style={[styles.textArea, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.textPrimary }]}
                  placeholder="Include concrete numbers (e.g. 35% speedup, 500 req/sec, zero downtime)."
                  placeholderTextColor={colors.textMuted}
                  value={result}
                  onChangeText={setResult}
                  multiline
                />
              </View>

              <TouchableOpacity
                style={[styles.submitBtn, { backgroundColor: colors.primary }]}
                onPress={() => reviewMutation.mutate()}
                disabled={reviewMutation.isPending || !situation.trim() || !action.trim()}
                activeOpacity={0.85}
              >
                {reviewMutation.isPending ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <>
                    <Feather name="zap" size={16} color="#FFFFFF" />
                    <Text style={styles.submitBtnText}>Evaluate STAR Story</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            /* Review Result View */
            <View style={styles.reviewContainer}>
              <View style={[styles.scoreCard, { backgroundColor: colors.surface, borderColor: colors.primary + '40' }]}>
                <Text style={[styles.scoreLabel, { color: colors.textMuted }]}>BEHAVIORAL IMPACT SCORE</Text>
                <Text style={[styles.scoreBig, { color: colors.primary }]}>{reviewResult.star_score} / 100</Text>
              </View>

              {/* Strengths */}
              {reviewResult.strengths.length > 0 && (
                <View style={styles.resultSection}>
                  <Text style={[styles.resultTitle, { color: colors.success }]}>✓ Key Strengths</Text>
                  {reviewResult.strengths.map((str, idx) => (
                    <View key={idx} style={[styles.bulletItem, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
                      <Text style={[styles.bulletText, { color: colors.textSecondary }]}>{str}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Improvements */}
              {reviewResult.improvements.length > 0 && (
                <View style={styles.resultSection}>
                  <Text style={[styles.resultTitle, { color: '#F59E0B' }]}>⚡ Recommended Enhancements</Text>
                  {reviewResult.improvements.map((imp, idx) => (
                    <View key={idx} style={[styles.bulletItem, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
                      <Text style={[styles.bulletText, { color: colors.textSecondary }]}>{imp}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Suggested Rewrite */}
              {reviewResult.suggested_rewrite && (
                <View style={styles.resultSection}>
                  <Text style={[styles.resultTitle, { color: colors.textPrimary }]}>📝 Optimized STAR Template</Text>
                  <View style={[styles.rewriteBox, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
                    <Text style={[styles.rewriteText, { color: colors.textSecondary }]}>{reviewResult.suggested_rewrite}</Text>
                  </View>
                </View>
              )}

              <TouchableOpacity
                style={[styles.resetBtn, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}
                onPress={handleReset}
              >
                <Feather name="refresh-cw" size={14} color={colors.textSecondary} />
                <Text style={[styles.resetBtnText, { color: colors.textSecondary }]}>Edit & Re-Evaluate</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: Spacing['2xl'] },
  handle: { width: 36, height: 4, borderRadius: Radius.full, alignSelf: 'center', marginTop: Spacing.md, marginBottom: Spacing.base },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.md },
  modalTitle: { fontSize: Typography.lg, fontWeight: '800' },
  closeBtn: { width: 32, height: 32, borderRadius: Radius.full, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { paddingBottom: 60 },
  subtitle: { fontSize: Typography.sm, marginBottom: Spacing.lg },
  formContainer: { gap: Spacing.md },
  fieldGroup: { gap: 6 },
  label: { fontSize: Typography.xs, fontWeight: '700' },
  input: { padding: Spacing.md, borderRadius: Radius.lg, borderWidth: 1, fontSize: Typography.sm },
  textArea: { padding: Spacing.md, borderRadius: Radius.lg, borderWidth: 1, fontSize: Typography.sm, minHeight: 64, textAlignVertical: 'top' },
  submitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 14, borderRadius: Radius.xl, marginTop: Spacing.md,
  },
  submitBtnText: { fontSize: Typography.base, fontWeight: '700', color: '#FFFFFF' },
  reviewContainer: { gap: Spacing.lg },
  scoreCard: { padding: Spacing.lg, borderRadius: Radius.xl, borderWidth: 1, alignItems: 'center' },
  scoreLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  scoreBig: { fontSize: 36, fontWeight: '900', marginTop: 4 },
  resultSection: { gap: Spacing.sm },
  resultTitle: { fontSize: Typography.sm, fontWeight: '700' },
  bulletItem: { padding: Spacing.md, borderRadius: Radius.lg, borderWidth: 1 },
  bulletText: { fontSize: Typography.xs, lineHeight: Typography.xs * 1.5 },
  rewriteBox: { padding: Spacing.md, borderRadius: Radius.lg, borderWidth: 1 },
  rewriteText: { fontSize: Typography.xs, lineHeight: Typography.xs * 1.6, fontFamily: 'monospace' },
  resetBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 12, borderRadius: Radius.xl, borderWidth: 1, marginTop: Spacing.md,
  },
  resetBtnText: { fontSize: Typography.sm, fontWeight: '600' },
});
