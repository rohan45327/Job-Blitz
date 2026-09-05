import React from 'react';
import {
  Modal, View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, ScrollView,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { api, ApplicationTimelineOut } from '../../api/client';
import { useTheme } from '../../theme/ThemeContext';
import { Typography, Spacing, Radius, Shadow } from '../../theme/tokens';
import { ErrorCard } from '../common/ErrorCard';

interface ApplicationTimelineModalProps {
  applicationId: string | null;
  onClose: () => void;
}

export function ApplicationTimelineModal({ applicationId, onClose }: ApplicationTimelineModalProps) {
  const { colors } = useTheme();

  const { data, isLoading, isError, refetch } = useQuery<ApplicationTimelineOut>({
    queryKey: ['application-timeline', applicationId],
    queryFn: () => api.getApplicationTimeline(applicationId!),
    enabled: Boolean(applicationId),
  });

  if (!applicationId) return null;

  return (
    <Modal visible={Boolean(applicationId)} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={styles.headerLeft}>
              <View style={[styles.iconCircle, { backgroundColor: colors.primary + '18' }]}>
                <Feather name="clock" size={18} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.title, { color: colors.textPrimary }]} numberOfLines={1}>
                  Activity Timeline
                </Text>
                <Text style={[styles.subtitle, { color: colors.textMuted }]} numberOfLines={1}>
                  {data ? `${data.job_title} • ${data.company_name}` : 'Loading...'}
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Feather name="x" size={20} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Content */}
          {isLoading ? (
            <View style={styles.centerContent}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : isError ? (
            <View style={styles.centerContent}>
              <ErrorCard
                title="Could not load timeline"
                message="Unable to fetch activity history for this application."
                onRetry={refetch}
              />
            </View>
          ) : data ? (
            <ScrollView style={styles.body} contentContainerStyle={styles.scrollContent}>
              {/* Stage Days Banner */}
              <View style={[styles.stageBanner, { backgroundColor: colors.info + '14', borderColor: colors.info + '30' }]}>
                <Feather name="calendar" size={14} color={colors.info} />
                <Text style={[styles.stageBannerText, { color: colors.textPrimary }]}>
                  Current stage: <Text style={{ fontWeight: '800', color: colors.info }}>{data.current_status.toUpperCase()}</Text> ({data.days_in_current_stage} {data.days_in_current_stage === 1 ? 'day' : 'days'})
                </Text>
              </View>

              {/* Timeline list */}
              <View style={styles.timelineList}>
                {data.events.map((event, idx) => {
                  const isLast = idx === data.events.length - 1;
                  return (
                    <View key={event.id} style={styles.eventRow}>
                      <View style={styles.lineCol}>
                        <View style={[styles.dot, { backgroundColor: colors.primary }]} />
                        {!isLast && <View style={[styles.verticalLine, { backgroundColor: colors.border }]} />}
                      </View>
                      <View style={[styles.eventCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
                        <View style={styles.eventHeader}>
                          <Text style={[styles.eventTitle, { color: colors.textPrimary }]}>
                            {event.title}
                          </Text>
                          {event.is_auto_generated && (
                            <View style={[styles.autoBadge, { backgroundColor: colors.primary + '18' }]}>
                              <Text style={[styles.autoBadgeText, { color: colors.primary }]}>AUTO</Text>
                            </View>
                          )}
                        </View>
                        {event.description ? (
                          <Text style={[styles.eventDesc, { color: colors.textSecondary }]}>
                            {event.description}
                          </Text>
                        ) : null}
                        <Text style={[styles.eventDate, { color: colors.textMuted }]}>
                          {new Date(event.created_at).toLocaleDateString(undefined, {
                            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                          })}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </ScrollView>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  container: {
    borderTopLeftRadius: Radius['2xl'], borderTopRightRadius: Radius['2xl'],
    maxHeight: '82%', minHeight: '50%', borderWidth: 1, ...Shadow.lg,
  },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, flex: 1 },
  iconCircle: { width: 36, height: 36, borderRadius: Radius.full, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: Typography.lg, fontWeight: '800' },
  subtitle: { fontSize: Typography.xs, marginTop: 2 },
  closeBtn: { padding: 4 },
  centerContent: { padding: Spacing['2xl'], alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1 },
  scrollContent: { padding: Spacing.xl, gap: Spacing.lg },
  stageBanner: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderRadius: Radius.lg, borderWidth: 1,
  },
  stageBannerText: { fontSize: Typography.xs },
  timelineList: { gap: Spacing.md },
  eventRow: { flexDirection: 'row', gap: Spacing.md },
  lineCol: { alignItems: 'center', width: 16 },
  dot: { width: 10, height: 10, borderRadius: 5, marginTop: 6 },
  verticalLine: { flex: 1, width: 2, marginVertical: 4 },
  eventCard: {
    flex: 1, padding: Spacing.md, borderRadius: Radius.lg, borderWidth: 1, gap: 4,
  },
  eventHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  eventTitle: { fontSize: Typography.sm, fontWeight: '700', flex: 1 },
  autoBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: Radius.sm },
  autoBadgeText: { fontSize: 9, fontWeight: '800' },
  eventDesc: { fontSize: Typography.xs, lineHeight: 18 },
  eventDate: { fontSize: 10, marginTop: 2 },
});
