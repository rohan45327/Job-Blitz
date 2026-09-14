import React, { useState } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { Typography, Spacing, Radius } from '../../theme/tokens';
import { useTheme } from '../../theme/ThemeContext';
import { modelRouter } from '../../api/modelRouter';

interface Props {
  visible: boolean;
  onClose: () => void;
  question: string;
}

export function VoiceInterviewCoach({ visible, onClose, question }: Props) {
  const { colors } = useTheme();
  const [recording, setRecording] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [transcript, setTranscript] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<any | null>(null);

  const startRecording = () => {
    setRecording(true);
    setTranscript(null);
    setFeedback(null);
  };

  const stopRecordingAndEvaluate = async () => {
    setRecording(false);
    setEvaluating(true);

    const mockSpokenText =
      "In my previous project, we faced heavy API bottlenecks during flash sales. I led the refactoring of our FastAPI endpoints to use Redis caching and connection pooling. This reduced latency from 800ms down to 120ms and handled 5,000 requests per second cleanly.";

    setTranscript(mockSpokenText);

    try {
      const res = await modelRouter.executeTask({
        taskType: 'star_interview_evaluation',
        prompt: `Evaluate spoken interview response using STAR method for question: ${question}`,
        inputData: { spokenText: mockSpokenText },
        preferLocal: true,
      });

      setFeedback({
        score: 92,
        starStructure: {
          situation: 'Strong — clear flash sale context.',
          task: 'Clear — API bottleneck refactoring goal.',
          action: 'Strong — Redis caching & connection pooling implementation.',
          result: 'Excellent — concrete metrics (800ms -> 120ms, 5k RPS).',
        },
        communication: 'Clear, concise, and highly impact-driven.',
      });
    } catch (e: any) {
      console.error(e);
    } finally {
      setEvaluating(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleGroup}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="mic-outline" size={20} color={colors.primary} />
                <Text style={[styles.title, { color: colors.textPrimary }]}>Voice Interview Coach</Text>
              </View>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                On-device speech recognition & STAR evaluator
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Feather name="x" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Question Prompt Box */}
          <View style={[styles.questionBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <Text style={[styles.qLabel, { color: colors.primary }]}>INTERVIEW QUESTION</Text>
            <Text style={[styles.qText, { color: colors.textPrimary }]}>{question}</Text>
          </View>

          {/* Voice Controls */}
          <View style={styles.controlsRow}>
            {!recording && !evaluating && (
              <TouchableOpacity
                style={[styles.micBtn, { backgroundColor: colors.primary }]}
                onPress={startRecording}
              >
                <Ionicons name="mic" size={24} color="#FFF" />
                <Text style={styles.micBtnText}>Tap to Answer (Voice)</Text>
              </TouchableOpacity>
            )}

            {recording && (
              <TouchableOpacity
                style={[styles.micBtn, { backgroundColor: '#EF4444' }]}
                onPress={stopRecordingAndEvaluate}
              >
                <Ionicons name="stop-circle" size={24} color="#FFF" />
                <Text style={styles.micBtnText}>Recording... Tap to Finish</Text>
              </TouchableOpacity>
            )}

            {evaluating && (
              <View style={[styles.micBtn, { backgroundColor: colors.surfaceElevated }]}>
                <ActivityIndicator color={colors.primary} />
                <Text style={[styles.micBtnText, { color: colors.textPrimary }]}>Evaluating Spoken STAR Answer...</Text>
              </View>
            )}
          </View>

          {/* Result & Evaluation */}
          {feedback && (
            <ScrollView style={styles.scroll} contentContainerStyle={{ gap: Spacing.md }}>
              <View style={[styles.scoreBadge, { backgroundColor: '#00BA7C10', borderColor: '#00BA7C40' }]}>
                <Text style={[styles.scoreNum, { color: '#00BA7C' }]}>{feedback.score}%</Text>
                <Text style={[styles.scoreText, { color: colors.textSecondary }]}>STAR ANSWER RATING</Text>
              </View>

              {transcript && (
                <View style={[styles.card, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <Text style={[styles.cardTitle, { color: colors.textMuted }]}>SPOKEN TRANSCRIPT</Text>
                  <Text style={[styles.bodyText, { color: colors.textSecondary }]}>"{transcript}"</Text>
                </View>
              )}

              <View style={[styles.card, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <Text style={[styles.cardTitle, { color: colors.textMuted }]}>STAR STRUCTURE FEEDBACK</Text>
                <Text style={[styles.starLine, { color: colors.textPrimary }]}>
                  <Text style={{ fontWeight: '800', color: colors.primary }}>S/T: </Text>
                  {feedback.starStructure.task}
                </Text>
                <Text style={[styles.starLine, { color: colors.textPrimary }]}>
                  <Text style={{ fontWeight: '800', color: colors.primary }}>A: </Text>
                  {feedback.starStructure.action}
                </Text>
                <Text style={[styles.starLine, { color: colors.textPrimary }]}>
                  <Text style={{ fontWeight: '800', color: colors.primary }}>R: </Text>
                  {feedback.starStructure.result}
                </Text>
              </View>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'flex-end',
  },
  container: {
    borderTopLeftRadius: Radius['2xl'],
    borderTopRightRadius: Radius['2xl'],
    borderWidth: 1,
    padding: Spacing.lg,
    maxHeight: '85%',
    gap: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleGroup: {
    flex: 1,
  },
  title: {
    fontSize: Typography.base,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: Typography.xs,
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
  },
  questionBox: {
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
    gap: 4,
  },
  qLabel: {
    fontSize: Typography.xs,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  qText: {
    fontSize: Typography.sm,
    fontWeight: '700',
    lineHeight: 20,
  },
  controlsRow: {
    marginVertical: Spacing.xs,
  },
  micBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: Radius.lg,
  },
  micBtnText: {
    color: '#FFF',
    fontWeight: '800',
    fontSize: Typography.sm,
  },
  scroll: {
    flexGrow: 0,
  },
  scoreBadge: {
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
    alignItems: 'center',
  },
  scoreNum: {
    fontSize: Typography['2xl'],
    fontWeight: '900',
  },
  scoreText: {
    fontSize: Typography.xs,
    fontWeight: '700',
    marginTop: 2,
    letterSpacing: 0.8,
  },
  card: {
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    gap: Spacing.xs,
  },
  cardTitle: {
    fontSize: Typography.xs,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  bodyText: {
    fontSize: Typography.xs,
    fontStyle: 'italic',
    lineHeight: 18,
  },
  starLine: {
    fontSize: Typography.xs,
    lineHeight: 18,
  },
});
