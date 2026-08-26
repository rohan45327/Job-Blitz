import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/client';
import { Colors, Typography, Spacing, Radius, Shadow } from '../../theme/tokens';

export function WatchlistScreen() {
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
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Company Watchlist</Text>
        <Text style={styles.subtitle}>Get notified when matched jobs appear</Text>
      </View>
      <FlatList
        data={data ?? []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.companyLogo}>
              <Text style={styles.companyLogoText}>
                {(item.company.name[0] ?? '?').toUpperCase()}
              </Text>
            </View>
            <View style={styles.companyInfo}>
              <Text style={styles.companyName}>{item.company.name}</Text>
              <Text style={styles.companyDomain}>{item.company.domain ?? 'No domain'}</Text>
            </View>
            <TouchableOpacity
              style={styles.removeBtn}
              onPress={() => Alert.alert(
                'Remove from watchlist?',
                `Stop watching ${item.company.name}?`,
                [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Remove', style: 'destructive', onPress: () => remove.mutate(item.company.id) },
                ]
              )}
            >
              <Text style={styles.removeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>👁️</Text>
            <Text style={styles.emptyTitle}>Nothing in your watchlist</Text>
            <Text style={styles.emptySubtitle}>
              Tap the watch icon on any company's job to add them here.
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  loading: { flex: 1, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center' },
  header: { paddingHorizontal: Spacing['2xl'], paddingTop: 60, paddingBottom: Spacing.base },
  title: { fontSize: Typography['2xl'], fontWeight: '800', color: Colors.textPrimary, letterSpacing: -0.5 },
  subtitle: { fontSize: Typography.sm, color: Colors.textMuted, marginTop: 4 },
  list: { paddingHorizontal: Spacing.base, paddingBottom: 100 },
  card: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.surface, borderRadius: Radius.xl,
    padding: Spacing.lg, marginVertical: Spacing.sm,
    borderWidth: 1, borderColor: Colors.border, ...Shadow.sm
  },
  companyLogo: {
    width: 44, height: 44, borderRadius: Radius.md,
    backgroundColor: Colors.primary + '22', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.primary + '40'
  },
  companyLogoText: { fontSize: Typography.lg, fontWeight: '800', color: Colors.primary },
  companyInfo: { flex: 1 },
  companyName: { fontSize: Typography.base, fontWeight: '700', color: Colors.textPrimary },
  companyDomain: { fontSize: Typography.sm, color: Colors.textMuted },
  removeBtn: { width: 32, height: 32, borderRadius: Radius.full, backgroundColor: Colors.danger + '22', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.danger + '40' },
  removeBtnText: { fontSize: Typography.sm, color: Colors.danger, fontWeight: '700' },
  empty: { alignItems: 'center', paddingTop: 80, gap: Spacing.md },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { fontSize: Typography.xl, fontWeight: '700', color: Colors.textPrimary },
  emptySubtitle: { fontSize: Typography.base, color: Colors.textSecondary, textAlign: 'center', paddingHorizontal: Spacing['2xl'] },
});
