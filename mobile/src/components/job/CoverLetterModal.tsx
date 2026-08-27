import React, { useState } from 'react';
import {
  Modal, View, Text, StyleSheet, TouchableOpacity,
  ScrollView, ActivityIndicator
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

const TONE_OPTIONS = ['professional', 'enthusiastic', 'casual'];

export function CoverLetterModal({ visible, jobId, onClose }: Props) {
  const [tone, setTone] = useState('professional');
  const [enabled, setEnabled] = useState(false);
  const { colors } = useTheme();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['cover-letter', jobId, tone],
    queryFn: () => api.generateCoverLetter(jobId, tone),
    enabled,
  });

  const handleGenerate = () => {
    setEnabled(true);
    setTimeout(() => refetch(), 100);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Handle */}
        <View style={[styles.handle, { backgroundColor: colors.border }]} />

        {/* Header */}
        <View style={styles.header}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Feather name="edit-2" size={18} color={colors.textPrimary} />
            <Text style={[styles.title, { color: colors.textPrimary }]}>Cover Letter</Text>
          </View>
          <TouchableOpacity
            onPress={onClose}
            style={[styles.closeBtn, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}
          >
            <Feather name="x" size={16} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Tone selection */}
        <View style={styles.toneSection}>
          <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>Tone</Text>
          <View style={styles.toneRow}>
            {TONE_OPTIONS.map((t) => (
              <TouchableOpacity
                key={t}
                style={[
                  styles.toneChip,
                  { borderColor: colors.border, backgroundColor: colors.surfaceElevated },
                  tone === t && { borderColor: colors.primary, backgroundColor: colors.primary + '18' },
                ]}
                onPress={() => { setTone(t); setEnabled(false); }}
              >
                <Text style={[
                  styles.toneText,
                  { color: colors.textSecondary },
                  tone === t && { color: colors.primary },
                ]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Content */}
        <ScrollView style={styles.contentArea} showsVerticalScrollIndicator={false}>
          {!enabled && !data ? (
            <View style={styles.placeholder}>
              <Feather name="cpu" size={40} color={colors.textMuted} />
              <Text style={[styles.placeholderText, { color: colors.textSecondary }]}>
                Press "Generate" to create an AI-powered cover letter for this role.
              </Text>
            </View>
          ) : isLoading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles.loadingText, { color: colors.textSecondary }]}>AI is writing your letter...</Text>
            </View>
          ) : data?.cover_letter ? (
            <Text style={[styles.letterText, { color: colors.textPrimary }]}>{data.cover_letter}</Text>
          ) : null}
        </ScrollView>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.generateBtn, { backgroundColor: colors.primary }]}
            onPress={handleGenerate}
            disabled={isLoading}
            activeOpacity={0.85}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Feather name={data ? 'refresh-cw' : 'zap'} size={15} color="#FFFFFF" />
                <Text style={styles.generateBtnText}>
                  {data ? 'Regenerate' : 'Generate'}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: Spacing['2xl'] },
  handle: {
    width: 36, height: 4, borderRadius: Radius.full,
    alignSelf: 'center', marginTop: Spacing.md, marginBottom: Spacing.base,
  },
  header: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: Spacing.lg,
  },
  title: { fontSize: Typography.xl, fontWeight: '800' },
  closeBtn: {
    width: 32, height: 32, borderRadius: Radius.full,
    borderWidth: 1, alignItems: 'center', justifyContent: 'center',
  },
  toneSection: { marginBottom: Spacing.xl },
  sectionLabel: {
    fontSize: Typography.xs, fontWeight: '700',
    textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: Spacing.sm,
  },
  toneRow: { flexDirection: 'row', gap: Spacing.sm },
  toneChip: {
    flex: 1, paddingVertical: Spacing.sm, borderRadius: Radius.full,
    borderWidth: 1, alignItems: 'center',
  },
  toneText: { fontSize: Typography.sm, fontWeight: '600', textTransform: 'capitalize' },
  contentArea: { flex: 1, marginBottom: Spacing.lg },
  placeholder: { alignItems: 'center', paddingTop: 60, gap: Spacing.base },
  placeholderText: {
    fontSize: Typography.base, textAlign: 'center',
    lineHeight: Typography.base * 1.6, paddingHorizontal: Spacing.xl,
  },
  loadingBox: { alignItems: 'center', paddingTop: 60, gap: Spacing.lg },
  loadingText: { fontSize: Typography.base },
  letterText: { fontSize: Typography.base, lineHeight: Typography.base * 1.75 },
  actions: { paddingBottom: 36 },
  generateBtn: { borderRadius: Radius.xl, paddingVertical: 15, alignItems: 'center' },
  generateBtnText: { fontSize: Typography.md, fontWeight: '700', color: '#FFFFFF' },
});
