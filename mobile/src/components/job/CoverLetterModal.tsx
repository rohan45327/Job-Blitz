import React, { useState } from 'react';
import {
  Modal, View, Text, StyleSheet, TouchableOpacity,
  ScrollView, ActivityIndicator, Alert
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../api/client';
import { Colors, Typography, Spacing, Radius } from '../../theme/tokens';

interface Props {
  visible: boolean;
  jobId: string;
  onClose: () => void;
}

const TONE_OPTIONS = ['professional', 'enthusiastic', 'casual'];

export function CoverLetterModal({ visible, jobId, onClose }: Props) {
  const [tone, setTone] = useState('professional');
  const [enabled, setEnabled] = useState(false);

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
      <View style={styles.container}>
        {/* Handle */}
        <View style={styles.handle} />

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>✍️ Cover Letter</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.closeBtn}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Tone selection */}
        <View style={styles.toneSection}>
          <Text style={styles.sectionLabel}>Tone</Text>
          <View style={styles.toneRow}>
            {TONE_OPTIONS.map((t) => (
              <TouchableOpacity
                key={t}
                style={[styles.toneChip, tone === t && styles.toneChipActive]}
                onPress={() => { setTone(t); setEnabled(false); }}
              >
                <Text style={[styles.toneText, tone === t && styles.toneTextActive]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Content */}
        <ScrollView style={styles.contentArea} showsVerticalScrollIndicator={false}>
          {!enabled && !data ? (
            <View style={styles.placeholder}>
              <Text style={styles.placeholderEmoji}>🤖</Text>
              <Text style={styles.placeholderText}>
                Press "Generate" to create an AI-powered cover letter for this role.
              </Text>
            </View>
          ) : isLoading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text style={styles.loadingText}>AI is writing your letter...</Text>
            </View>
          ) : data?.cover_letter ? (
            <Text style={styles.letterText}>{data.cover_letter}</Text>
          ) : null}
        </ScrollView>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.generateBtn}
            onPress={handleGenerate}
            disabled={isLoading}
            activeOpacity={0.85}
          >
            {isLoading
              ? <ActivityIndicator color={Colors.textPrimary} />
              : <Text style={styles.generateBtnText}>
                  {data ? 'Regenerate' : 'Generate ⚡'}
                </Text>
            }
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, paddingHorizontal: Spacing['2xl'] },
  handle: { width: 36, height: 4, borderRadius: Radius.full, backgroundColor: Colors.border, alignSelf: 'center', marginTop: Spacing.md, marginBottom: Spacing.base },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.lg },
  title: { fontSize: Typography.xl, fontWeight: '800', color: Colors.textPrimary },
  closeBtn: { fontSize: Typography.lg, color: Colors.textMuted },
  toneSection: { marginBottom: Spacing.xl },
  sectionLabel: { fontSize: Typography.sm, fontWeight: '700', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: Spacing.sm },
  toneRow: { flexDirection: 'row', gap: Spacing.sm },
  toneChip: { flex: 1, paddingVertical: Spacing.sm, borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surfaceElevated, alignItems: 'center' },
  toneChipActive: { borderColor: Colors.primary, backgroundColor: Colors.primary + '22' },
  toneText: { fontSize: Typography.sm, fontWeight: '600', color: Colors.textSecondary, textTransform: 'capitalize' },
  toneTextActive: { color: Colors.primary },
  contentArea: { flex: 1, marginBottom: Spacing.lg },
  placeholder: { alignItems: 'center', paddingTop: 60, gap: Spacing.base },
  placeholderEmoji: { fontSize: 48 },
  placeholderText: { fontSize: Typography.base, color: Colors.textSecondary, textAlign: 'center', lineHeight: Typography.base * 1.6 },
  loadingBox: { alignItems: 'center', paddingTop: 60, gap: Spacing.lg },
  loadingText: { fontSize: Typography.base, color: Colors.textSecondary },
  letterText: { fontSize: Typography.base, color: Colors.textPrimary, lineHeight: Typography.base * 1.75 },
  actions: { paddingBottom: 36 },
  generateBtn: { backgroundColor: Colors.primary, borderRadius: Radius.xl, paddingVertical: 16, alignItems: 'center' },
  generateBtnText: { fontSize: Typography.md, fontWeight: '700', color: Colors.textPrimary },
});
