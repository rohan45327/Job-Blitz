import React, { useState } from 'react';
import {
  Modal, View, Text, StyleSheet, TouchableOpacity, ScrollView,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Typography, Spacing, Radius } from '../../theme/tokens';
import { useTheme } from '../../theme/ThemeContext';

// ─── Exact company list the user wants filterable ────────────────────────────
const ALL_FILTER_COMPANIES = [
  // Fintech
  'Paytm', 'PhonePe', 'Razorpay', 'CRED', 'Groww', 'Zeta', 'MobiKwik',
  'Pine Labs', 'PolicyBazaar', 'Acko', 'PayPal', 'Visa', 'Intuit', 'Zerodha', 'BharatPe',
  // Big Tech & Product MNCs
  'Google', 'Microsoft', 'Amazon', 'Adobe', 'Meta', 'Salesforce', 'Oracle',
  'SAP', 'Apple', 'Uber', 'LinkedIn', 'Goldman Sachs', 'Flipkart', 'Zoho', 'Freshworks',
  // Additional Tech Companies
  'Spotify', 'Netflix', 'Dropbox', 'Atlassian', 'Slack', 'Twilio', 'Stripe',
  // IT Services
  'TCS', 'Infosys', 'Wipro', 'HCL Technologies', 'Tech Mahindra',
  'Accenture', 'Cognizant', 'Capgemini', 'Deloitte', 'IBM',
  'LTTS', 'Persistent Systems', 'LTIMindtree', 'Mphasis', 'EPAM Systems',
  'VMware', 'Red Hat', 'Canonical', 'Snowflake', 'Databricks',
];

// Top-tier companies — subtle accent tint
const TOP_COMPANIES = new Set([
  'Google', 'Microsoft', 'Amazon', 'Adobe', 'Meta', 'Apple', 'Salesforce',
  'Goldman Sachs', 'PayPal', 'Visa', 'Uber',
]);

export interface Filters {
  work_type?: string;
  work_types?: string[];
  experience_level?: string;
  salary_min?: number;
  location?: string;
  companies?: string[];
}

interface Props {
  visible: boolean;
  current: Filters;
  onApply: (filters: Filters) => void;
  onClose: () => void;
}

const WORK_TYPES = ['remote', 'hybrid', 'onsite', 'internship', 'apprenticeship', 'research'];
const EXP_LEVELS = ['entry', 'mid', 'senior', 'lead', 'executive'];
const SALARY_RANGES = [
  { label: 'Any', value: undefined },
  { label: '₹10L+', value: 1000000 },
  { label: '₹20L+', value: 2000000 },
  { label: '$80k+', value: 80000 },
  { label: '$100k+', value: 100000 },
  { label: '$150k+', value: 150000 },
];

export function FilterSheet({ visible, current, onApply, onClose }: Props) {
  const [local, setLocal] = useState<Filters>(current);
  const { colors } = useTheme();

  const handleReset = () => setLocal({});

  const toggleCompany = (name: string) => {
    setLocal((f) => {
      const prev = f.companies ?? [];
      const next = prev.includes(name) ? prev.filter((c) => c !== name) : [...prev, name];
      return { ...f, companies: next.length > 0 ? next : undefined };
    });
  };

  const toggleWorkType = (wt: string) => {
    setLocal((f) => {
      const prev = f.work_types ?? (f.work_type ? [f.work_type] : []);
      const next = prev.includes(wt) ? prev.filter((c) => c !== wt) : [...prev, wt];
      return { ...f, work_types: next.length > 0 ? next : undefined, work_type: undefined };
    });
  };

  const selectedCompanies = local.companies ?? [];
  const selectedWorkTypes = local.work_types ?? (local.work_type ? [local.work_type] : []);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.handle, { backgroundColor: colors.border }]} />

        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Filters</Text>
          <TouchableOpacity onPress={handleReset}>
            <Text style={[styles.resetText, { color: colors.danger }]}>Reset</Text>
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

          {/* ── Company Multi-Select ─────────────────────────────────── */}
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>Companies</Text>
              {selectedCompanies.length > 0 && (
                <View style={[styles.selectedBadge, { backgroundColor: colors.primary + '18' }]}>
                  <Text style={[styles.selectedCount, { color: colors.primary }]}>{selectedCompanies.length}</Text>
                </View>
              )}
            </View>
            <View style={styles.chipRow}>
              {ALL_FILTER_COMPANIES.map((name) => {
                const isSelected = selectedCompanies.includes(name);
                const isTop = TOP_COMPANIES.has(name);
                return (
                  <TouchableOpacity
                    key={name}
                    style={[
                      styles.chip,
                      { borderColor: colors.border, backgroundColor: colors.surfaceElevated },
                      isTop && !isSelected && { borderColor: colors.primary + '40', backgroundColor: colors.primary + '08' },
                      isSelected && { borderColor: colors.primary, backgroundColor: colors.primary + '22' },
                    ]}
                    onPress={() => toggleCompany(name)}
                  >
                    <Text style={[
                      styles.chipText,
                      { color: colors.textSecondary },
                      isSelected && { color: colors.primary },
                    ]}>
                      {name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* ── Work Type (Multi-Select) ───────────────────────────── */}
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>Work Type</Text>
              {selectedWorkTypes.length > 0 && (
                <View style={[styles.selectedBadge, { backgroundColor: colors.primary + '18' }]}>
                  <Text style={[styles.selectedCount, { color: colors.primary }]}>{selectedWorkTypes.length}</Text>
                </View>
              )}
            </View>
            <View style={styles.chipRow}>
              {WORK_TYPES.map((wt) => {
                const isSelected = selectedWorkTypes.includes(wt);
                return (
                  <TouchableOpacity
                    key={wt}
                    style={[
                      styles.chip,
                      { borderColor: colors.border, backgroundColor: colors.surfaceElevated },
                      isSelected && { borderColor: colors.primary, backgroundColor: colors.primary + '22' },
                    ]}
                    onPress={() => toggleWorkType(wt)}
                  >
                    <Text style={[
                      styles.chipText,
                      { color: colors.textSecondary },
                      isSelected && { color: colors.primary },
                    ]}>{wt}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* ── Experience Level ─────────────────────────────────────── */}
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>Experience Level</Text>
            <View style={styles.chipRow}>
              {EXP_LEVELS.map((opt) => (
                <TouchableOpacity
                  key={opt}
                  style={[
                    styles.chip,
                    { borderColor: colors.border, backgroundColor: colors.surfaceElevated },
                    local.experience_level === opt && { borderColor: colors.primary, backgroundColor: colors.primary + '22' },
                  ]}
                  onPress={() =>
                    setLocal((f) => ({ ...f, experience_level: f.experience_level === opt ? undefined : opt }))
                  }
                >
                  <Text style={[
                    styles.chipText,
                    { color: colors.textSecondary },
                    local.experience_level === opt && { color: colors.primary },
                  ]}>{opt}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* ── Min Salary ───────────────────────────────────────────── */}
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>Min. Salary</Text>
            <View style={styles.chipRow}>
              {SALARY_RANGES.map((r) => (
                <TouchableOpacity
                  key={String(r.value)}
                  style={[
                    styles.chip,
                    { borderColor: colors.border, backgroundColor: colors.surfaceElevated },
                    local.salary_min === r.value && { borderColor: colors.primary, backgroundColor: colors.primary + '22' },
                  ]}
                  onPress={() => setLocal((f) => ({ ...f, salary_min: r.value }))}
                >
                  <Text style={[
                    styles.chipText,
                    { color: colors.textSecondary },
                    local.salary_min === r.value && { color: colors.primary },
                  ]}>{r.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

        </ScrollView>

        <View style={[styles.actions, { borderTopColor: colors.border }]}>
          <TouchableOpacity style={[styles.cancelBtn, { borderColor: colors.border }]} onPress={onClose}>
            <Text style={[styles.cancelBtnText, { color: colors.textSecondary }]}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.applyBtn, { backgroundColor: colors.primary }]} onPress={() => onApply(local)}>
            <Feather name="check" size={15} color="#FFFFFF" />
            <Text style={styles.applyBtnText}>Apply Filters</Text>
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
  resetText: { fontSize: Typography.sm, fontWeight: '600' },
  content: { paddingBottom: 120 },
  section: { marginBottom: Spacing.xl },
  sectionHeaderRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: Spacing.md,
  },
  sectionLabel: {
    fontSize: Typography.xs, fontWeight: '700',
    textTransform: 'uppercase', letterSpacing: 1.2,
  },
  selectedBadge: {
    paddingHorizontal: 8, paddingVertical: 2,
    borderRadius: Radius.full,
  },
  selectedCount: { fontSize: Typography.xs, fontWeight: '800' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, alignItems: 'center' },
  chip: {
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderRadius: Radius.full, borderWidth: 1,
  },
  chipText: { fontSize: Typography.sm, fontWeight: '600', textTransform: 'capitalize' },
  actions: {
    flexDirection: 'row', gap: Spacing.md,
    paddingBottom: 48, paddingTop: Spacing.base,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  cancelBtn: {
    flex: 1, paddingVertical: 14, borderRadius: Radius.xl,
    borderWidth: 1, alignItems: 'center',
  },
  cancelBtnText: { fontSize: Typography.base, fontWeight: '600' },
  applyBtn: {
    flex: 2, paddingVertical: 14, borderRadius: Radius.xl,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
  },
  applyBtnText: { fontSize: Typography.base, fontWeight: '700', color: '#FFFFFF' },
});
