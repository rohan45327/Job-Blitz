import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { EvidenceItem } from '../../api/modelRouter';
import { Typography, Spacing, Radius } from '../../theme/tokens';
import { useTheme } from '../../theme/ThemeContext';

interface Props {
  visible: boolean;
  onClose: () => void;
  jobTitle: string;
  companyName: string;
  evidenceItems: EvidenceItem[];
  matchScore: number;
  readinessScore: number;
}

export function EvidencePanelModal({
  visible,
  onClose,
  jobTitle,
  companyName,
  evidenceItems,
  matchScore,
  readinessScore,
}: Props) {
  const { colors } = useTheme();

  const getPillStyle = (type: EvidenceItem['sourceType']) => {
    switch (type) {
      case 'OFFICIAL':
        return { bg: '#1D9BF01F', border: '#1D9BF0', text: '#1D9BF0', label: 'OFFICIAL' };
      case 'PUBLIC_SIGNAL':
        return { bg: '#FFB9381F', border: '#FFB938', text: '#FFB938', label: 'PUBLIC SIGNAL' };
      case 'USER_CONTRIBUTION':
        return { bg: '#A855F71F', border: '#A855F7', text: '#A855F7', label: 'USER CONTRIB' };
      case 'AI_INFERENCE':
      default:
        return { bg: '#00BA7C1F', border: '#00BA7C', text: '#00BA7C', label: 'AI INFERENCE' };
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleGroup}>
              <Text style={[styles.title, { color: colors.textPrimary }]}>Intelligence Evidence Panel</Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                {jobTitle} • {companyName}
              </Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Feather name="x" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Score Badges Summary */}
          <View style={styles.scoresRow}>
            <View style={[styles.scoreCard, { backgroundColor: '#1D9BF010', borderColor: '#1D9BF040' }]}>
              <Text style={[styles.scoreVal, { color: '#1D9BF0' }]}>{matchScore}%</Text>
              <Text style={[styles.scoreLabel, { color: colors.textSecondary }]}>MATCH FIT</Text>
            </View>
            <View style={[styles.scoreCard, { backgroundColor: '#00BA7C10', borderColor: '#00BA7C40' }]}>
              <Text style={[styles.scoreVal, { color: '#00BA7C' }]}>{readinessScore}%</Text>
              <Text style={[styles.scoreLabel, { color: colors.textSecondary }]}>INTERVIEW READY</Text>
            </View>
          </View>

          {/* Evidence List */}
          <ScrollView style={styles.scroll} contentContainerStyle={{ paddingBottom: Spacing.xl }}>
            <Text style={[styles.sectionHeading, { color: colors.textPrimary }]}>
              Fact & Signal Attribution ({evidenceItems.length})
            </Text>

            {evidenceItems.length === 0 ? (
              <View style={[styles.emptyBox, { borderColor: colors.border }]}>
                <Feather name="info" size={24} color={colors.textMuted} />
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  Not enough verified provenance data available for this job yet.
                </Text>
              </View>
            ) : (
              evidenceItems.map((item, idx) => {
                const pill = getPillStyle(item.sourceType);
                return (
                  <View
                    key={idx}
                    style={[styles.itemCard, { backgroundColor: colors.background, borderColor: colors.border }]}
                  >
                    <View style={styles.itemTopRow}>
                      <View style={[styles.badge, { backgroundColor: pill.bg, borderColor: pill.border }]}>
                        <Text style={[styles.badgeText, { color: pill.text }]}>{pill.label}</Text>
                      </View>
                      <Text style={[styles.confText, { color: colors.textMuted }]}>
                        Confidence {Math.round(item.confidence * 100)}%
                      </Text>
                    </View>
                    <Text style={[styles.claimText, { color: colors.textPrimary }]}>{item.claim}</Text>
                  </View>
                );
              })
            )}
          </ScrollView>
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
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  titleGroup: {
    flex: 1,
  },
  title: {
    fontSize: Typography.lg,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: Typography.xs,
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
  },
  scoresRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  scoreCard: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
    alignItems: 'center',
  },
  scoreVal: {
    fontSize: Typography['2xl'],
    fontWeight: '900',
  },
  scoreLabel: {
    fontSize: Typography.xs,
    fontWeight: '700',
    marginTop: 2,
    letterSpacing: 0.5,
  },
  sectionHeading: {
    fontSize: Typography.sm,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: Spacing.md,
  },
  scroll: {
    flexGrow: 0,
  },
  itemCard: {
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    marginBottom: Spacing.md,
    gap: Spacing.xs,
  },
  itemTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.sm,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: Typography.xs,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  confText: {
    fontSize: Typography.xs,
  },
  claimText: {
    fontSize: Typography.sm,
    fontWeight: '600',
    lineHeight: 20,
    marginTop: 4,
  },
  emptyBox: {
    padding: Spacing.xl,
    borderRadius: Radius.md,
    borderWidth: 1,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  emptyText: {
    fontSize: Typography.sm,
    textAlign: 'center',
  },
});
