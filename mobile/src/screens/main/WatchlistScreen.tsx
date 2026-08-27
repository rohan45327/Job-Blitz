import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/client';
import { Typography, Spacing, Radius, Shadow } from '../../theme/tokens';
import { useTheme } from '../../theme/ThemeContext';

export function WatchlistScreen() {
  const { colors } = useTheme();
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['watchlist'],
    queryFn: () => api.getWatchlist(),
  });

  const remove = useMutation({
    mutationFn: (companyId: string) => api.removeFromWatchlist(companyId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['watchlist'] }),
    onError: (e: any) => Alert.alert('Error', e.message),
  });

  if (isLoading) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Watchlist</Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>Notified when matched jobs appear</Text>
      </View>
      <FlatList
        data={data ?? []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[styles.companyLogo, { backgroundColor: colors.primary + '18', borderColor: colors.primary + '30' }]}>
              <Text style={[styles.companyLogoText, { color: colors.primary }]}>
                {(item.company.name[0] ?? '?').toUpperCase()}
              </Text>
            </View>
            <View style={styles.companyInfo}>
              <Text style={[styles.companyName, { color: colors.textPrimary }]}>{item.company.name}</Text>
              <Text style={[styles.companyDomain, { color: colors.textMuted }]}>{item.company.domain ?? 'No domain'}</Text>
            </View>
            <TouchableOpacity
              style={[styles.removeBtn, { backgroundColor: colors.danger + '12', borderColor: colors.danger + '30' }]}
              onPress={() => Alert.alert(
                'Remove?',
                `Stop watching ${item.company.name}?`,
                [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Remove', style: 'destructive', onPress: () => remove.mutate(item.company.id) },
                ]
              )}
            >
              <Feather name="x" size={14} color={colors.danger} />
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Feather name="eye-off" size={40} color={colors.textMuted} />
            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>Nothing in your watchlist</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              Tap the watch icon on any company's job to add them here.
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    paddingHorizontal: Spacing['2xl'],
    paddingTop: 60,
    paddingBottom: Spacing.base,
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginBottom: Spacing.sm,
  },
  title: { fontSize: Typography['2xl'], fontWeight: '800', letterSpacing: -0.5 },
  subtitle: { fontSize: Typography.sm, marginTop: 3 },
  list: { paddingHorizontal: Spacing.base, paddingBottom: 100 },
  card: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    borderRadius: Radius.xl,
    padding: Spacing.base, marginVertical: 6,
    borderWidth: 1, ...Shadow.sm,
  },
  companyLogo: {
    width: 42, height: 42, borderRadius: Radius.md,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1,
  },
  companyLogoText: { fontSize: Typography.lg, fontWeight: '800' },
  companyInfo: { flex: 1 },
  companyName: { fontSize: Typography.base, fontWeight: '700' },
  companyDomain: { fontSize: Typography.sm, marginTop: 1 },
  removeBtn: {
    width: 30, height: 30, borderRadius: Radius.full,
    borderWidth: 1, alignItems: 'center', justifyContent: 'center',
  },
  empty: { alignItems: 'center', paddingTop: 80, gap: Spacing.base },
  emptyTitle: { fontSize: Typography.xl, fontWeight: '700' },
  emptySubtitle: {
    fontSize: Typography.base, textAlign: 'center',
    paddingHorizontal: Spacing['2xl'], lineHeight: Typography.base * 1.6,
  },
});
