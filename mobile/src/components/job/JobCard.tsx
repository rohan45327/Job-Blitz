import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Image } from 'react-native';
import { MatchedJobOut } from '../../api/client';
import { Typography, Spacing, Radius, Shadow } from '../../theme/tokens';
import { useTheme } from '../../theme/ThemeContext';
import { cleanText } from '../../utils/cleanText';

interface Props {
  matched: MatchedJobOut;
  onPress: () => void;
  onQuickApply?: () => void;
}

export function JobCard({ matched, onPress, onQuickApply }: Props) {
  const { colors } = useTheme();
  const { job, match_score, match_breakdown, matched_resume_category, is_high_match } = matched;
  const scorePercent = Math.round(match_score * 100);
  const [logoError, setLogoError] = useState(false);

  const workTypeColor =
    job.work_type === 'remote' ? colors.success : job.work_type === 'hybrid' ? colors.warning : colors.accent;

  const scoreColor =
    match_score >= 0.75 ? colors.success : match_score >= 0.6 ? colors.warning : colors.textMuted;

  const topSkills = job.skills.slice(0, 3);

  const salaryText =
    job.salary_min && job.salary_max
      ? `$${Math.round(job.salary_min / 1000)}k–$${Math.round(job.salary_max / 1000)}k`
      : job.salary_max
      ? `Up to $${Math.round(job.salary_max / 1000)}k`
      : null;

  return (
    <TouchableOpacity
      style={[
        styles.card,
        { backgroundColor: colors.surface, borderColor: is_high_match ? colors.primary + '80' : colors.border },
        job.company.is_top_company && {
          shadowColor: '#FFD700',
          shadowOpacity: 0.18,
          shadowRadius: 8,
          elevation: 5,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      {/* High Match Banner */}
      {is_high_match && (
        <View style={[styles.highMatchBanner, { backgroundColor: colors.primary + '20', borderColor: colors.primary }]}>
          <Text style={[styles.highMatchText, { color: colors.primary }]}>
            ⚡ 75%+ Strong Match {matched_resume_category ? `• Bound to ${matched_resume_category} Resume` : ''}
          </Text>
        </View>
      )}

      {/* Header row */}
      <View style={styles.cardHeader}>
        <View style={styles.companyInfo}>
          <View style={[styles.companyLogo, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
            {job.company.domain && !logoError ? (
              <Image
                source={{ uri: `https://logo.clearbit.com/${job.company.domain}` }}
                style={styles.logoImage}
                onError={() => setLogoError(true)}
                resizeMode="contain"
              />
            ) : job.company.logo_url && !logoError ? (
              <Image
                source={{ uri: job.company.logo_url }}
                style={styles.logoImage}
                onError={() => setLogoError(true)}
                resizeMode="contain"
              />
            ) : (
              <Text style={[styles.companyLogoText, { color: colors.primary }]}>
                {(job.company.name?.[0] ?? '?').toUpperCase()}
              </Text>
            )}
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              {job.company.is_top_company && <Text style={{ fontSize: 14 }}>👑</Text>}
              <Text style={[styles.companyName, { color: colors.textSecondary }]}>{cleanText(job.company.name)}</Text>
            </View>
            <Text style={[styles.jobLocation, { color: colors.textMuted }]}>{cleanText(job.location) || 'Remote / Flexible'}</Text>
          </View>
        </View>

        {/* Match Score Badge */}
        <View style={[styles.scoreBadge, { backgroundColor: scoreColor + '20', borderColor: scoreColor }]}>
          <Text style={[styles.scoreText, { color: scoreColor }]}>{scorePercent}%</Text>
        </View>
      </View>

      {/* Job Title */}
      <Text style={[styles.jobTitle, { color: colors.textPrimary }]} numberOfLines={2}>
        {cleanText(job.title)}
      </Text>

      {/* Tags */}
      <View style={styles.tags}>
        {job.work_type && (
          <View style={[styles.tag, { backgroundColor: colors.surfaceElevated, borderColor: workTypeColor + '60' }]}>
            <Text style={[styles.tagText, { color: workTypeColor }]}>{job.work_type}</Text>
          </View>
        )}
        {job.experience_level && (
          <View style={[styles.tag, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
            <Text style={[styles.tagText, { color: colors.textSecondary }]}>{job.experience_level}</Text>
          </View>
        )}
        {salaryText && (
          <View style={[styles.tag, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
            <Text style={[styles.tagText, { color: colors.textSecondary }]}>{salaryText}</Text>
          </View>
        )}
      </View>

      {/* Skills */}
      {topSkills.length > 0 && (
        <View style={styles.skills}>
          {topSkills.map((s) => (
            <View key={s.id} style={[styles.skillChip, { backgroundColor: colors.primary + '18' }]}>
              <Text style={[styles.skillText, { color: colors.primaryLight }]}>{s.name}</Text>
            </View>
          ))}
          {job.skills.length > 3 && (
            <Text style={[styles.moreSkills, { color: colors.textMuted }]}>+{job.skills.length - 3}</Text>
          )}
        </View>
      )}

      {/* Bottom Action Bar */}
      <View style={[styles.cardFooter, { borderTopColor: colors.border }]}>
        <View style={styles.matchBreakdown}>
          {Object.entries(match_breakdown)
            .slice(0, 3)
            .map(([key, val]) => (
              <View key={key} style={styles.breakdownItem}>
                <View style={[styles.breakdownBar, { backgroundColor: colors.border }]}>
                  <View style={[styles.breakdownFill, { width: `${Math.round(val * 100)}%` as any, backgroundColor: colors.primary }]} />
                </View>
                <Text style={[styles.breakdownLabel, { color: colors.textMuted }]}>{key}</Text>
              </View>
            ))}
        </View>

        {onQuickApply && (
          <TouchableOpacity
            style={[styles.quickApplyBtn, { backgroundColor: colors.primary }]}
            onPress={onQuickApply}
            activeOpacity={0.85}
          >
            <Text style={styles.quickApplyText}>⚡ One-Click Apply</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    marginVertical: Spacing.sm,
    borderWidth: 1,
    ...Shadow.sm,
  },
  highMatchBanner: {
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderWidth: 1,
    marginBottom: Spacing.md,
  },
  highMatchText: {
    fontSize: Typography.xs,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  companyInfo: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, flex: 1 },
  companyLogo: {
    width: 42,
    height: 42,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    overflow: 'hidden',
  },
  logoImage: {
    width: 32,
    height: 32,
    borderRadius: Radius.md - 2,
  },
  companyLogoText: { fontSize: Typography.md, fontWeight: '800' },
  companyName: { fontSize: Typography.sm, fontWeight: '600' },
  jobLocation: { fontSize: Typography.xs, marginTop: 2 },
  scoreBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreText: { fontSize: Typography.xs, fontWeight: '800' },
  jobTitle: {
    fontSize: Typography.lg,
    fontWeight: '700',
    marginBottom: Spacing.md,
    letterSpacing: -0.3,
  },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.md },
  tag: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  tagText: { fontSize: Typography.xs, fontWeight: '600' },
  skills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginBottom: Spacing.md,
    alignItems: 'center',
  },
  skillChip: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.sm,
  },
  skillText: { fontSize: Typography.xs, fontWeight: '600' },
  moreSkills: { fontSize: Typography.xs },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.md,
    borderTopWidth: 1,
  },
  matchBreakdown: { flexDirection: 'row', gap: Spacing.md },
  breakdownItem: { alignItems: 'center', gap: 3 },
  breakdownBar: {
    width: 32,
    height: 4,
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  breakdownFill: { height: '100%', borderRadius: Radius.full },
  breakdownLabel: { fontSize: 9, textTransform: 'uppercase' },
  quickApplyBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: Radius.lg,
  },
  quickApplyText: {
    fontSize: Typography.xs,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
