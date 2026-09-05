import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Image } from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { MatchedJobOut } from '../../api/client';
import { Typography, Spacing, Radius, Shadow } from '../../theme/tokens';
import { useTheme } from '../../theme/ThemeContext';
import { cleanText } from '../../utils/cleanText';

import { ReadinessBadge } from './ReadinessBadge';

interface Props {
  matched: MatchedJobOut;
  onPress: () => void;
  onQuickApply?: () => void;
}

export function JobCard({ matched, onPress, onQuickApply }: Props) {
  const { colors } = useTheme();
  const { job, match_score, readiness_score, freshness, match_breakdown, matched_resume_category, is_high_match } = matched;
  const scorePercent = Math.round(match_score * 100);
  const [logoError, setLogoError] = useState(false);

  const workTypeColor =
    job.work_type === 'remote' ? colors.success : job.work_type === 'hybrid' ? colors.warning : colors.textSecondary;

  const topSkills = job.skills.slice(0, 3);

  const salaryText =
    job.salary_min && job.salary_max
      ? `$${Math.round(job.salary_min / 1000)}k–$${Math.round(job.salary_max / 1000)}k`
      : job.salary_max
      ? `${Math.round(job.salary_max / 1000)}k`
      : null;

  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: is_high_match ? colors.primary + '60' : colors.border,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.82}
    >
      {/* High Match Banner */}
      {is_high_match && (
        <View style={[styles.highMatchBanner, { backgroundColor: colors.primary + '15', borderColor: colors.primary + '40' }]}>
          <Feather name="zap" size={11} color={colors.primary} />
          <Text style={[styles.highMatchText, { color: colors.primary }]}>
            {scorePercent}% Strong Match{matched_resume_category ? `  ·  ${matched_resume_category}` : ''}
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
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              {job.company.is_top_company && (
                <Ionicons name="star" size={11} color="#F5A623" style={{ marginTop: 1 }} />
              )}
              <Text style={[styles.companyName, { color: colors.textSecondary }]}>{cleanText(job.company.name)}</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
              <Feather name="map-pin" size={10} color={colors.textMuted} />
              <Text style={[styles.jobLocation, { color: colors.textMuted }]}>
                {cleanText(job.location) || 'Remote / Flexible'}
              </Text>
            </View>
          </View>
        </View>

        {/* Dual Match & Readiness Badge */}
        <ReadinessBadge matchScore={match_score} readinessScore={readiness_score} freshness={freshness} />
      </View>

      {/* Job Title */}
      <Text style={[styles.jobTitle, { color: colors.textPrimary, flexShrink: 1 }]} numberOfLines={2}>
        {cleanText(job.title)}
      </Text>

      {/* Tags */}
      <View style={styles.tags}>
        {matched.opportunity_score && (
          <View style={[styles.tag, { backgroundColor: colors.primary + '18', borderColor: colors.primary + '40' }]}>
            <Text style={[styles.tagText, { color: colors.primary, fontWeight: '700' }]}>
              🎯 {matched.opportunity_score.overall_score} Opp. Score
            </Text>
          </View>
        )}
        {job.work_type && (
          <View style={[styles.tag, { backgroundColor: colors.surfaceElevated, borderColor: workTypeColor + '50' }]}>
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
            <View key={s.id} style={[styles.skillChip, { backgroundColor: colors.primary + '14' }]}>
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
            activeOpacity={0.82}
          >
            <Feather name="zap" size={12} color="#FFFFFF" />
            <Text style={styles.quickApplyText}>Apply</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.xl,
    padding: Spacing.base,
    marginVertical: 6,
    borderWidth: 1,
    ...Shadow.sm,
  },
  highMatchBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 5,
    borderWidth: 1,
    marginBottom: Spacing.md,
    alignSelf: 'flex-start',
  },
  highMatchText: {
    fontSize: Typography.xs,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  companyInfo: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, flex: 1 },
  companyLogo: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    overflow: 'hidden',
  },
  logoImage: { width: 30, height: 30 },
  companyLogoText: { fontSize: Typography.md, fontWeight: '800' },
  companyName: { fontSize: Typography.sm, fontWeight: '600' },
  jobLocation: { fontSize: Typography.xs },
  scoreBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 5,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 46,
  },
  scoreText: { fontSize: Typography.xs, fontWeight: '800' },
  jobTitle: {
    fontSize: Typography.md,
    fontWeight: '700',
    marginBottom: Spacing.sm,
    letterSpacing: -0.2,
    lineHeight: Typography.md * 1.3,
  },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs, marginBottom: Spacing.sm },
  tag: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  tagText: { fontSize: Typography.xs, fontWeight: '600', textTransform: 'capitalize', flexWrap: 'wrap' },
  skills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
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
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    marginTop: 2,
  },
  matchBreakdown: { flexDirection: 'row', gap: Spacing.md },
  breakdownItem: { alignItems: 'center', gap: 3 },
  breakdownBar: {
    width: 28,
    height: 3,
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  breakdownFill: { height: '100%', borderRadius: Radius.full },
  breakdownLabel: { fontSize: 9, textTransform: 'uppercase', letterSpacing: 0.3 },
  quickApplyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.md,
    paddingVertical: 7,
    borderRadius: Radius.lg,
  },
  quickApplyText: {
    fontSize: Typography.xs,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
