import React, { useState } from 'react';
import {
  Modal, View, Text, StyleSheet, TouchableOpacity, ScrollView,
} from 'react-native';

// ─── Exact company list the user wants filterable ───────────────────────────
const ALL_FILTER_COMPANIES = [
  // Fintech
  'Paytm', 'PhonePe', 'Razorpay', 'CRED', 'Groww', 'Zeta', 'MobiKwik',
  'Pine Labs', 'PolicyBazaar', 'Acko', 'PayPal', 'Visa', 'Intuit', 'Zerodha', 'BharatPe',
  // Big Tech & Product MNCs
  'Google', 'Microsoft', 'Amazon', 'Adobe', 'Meta', 'Salesforce', 'Oracle',
  'SAP', 'Apple', 'Uber', 'LinkedIn', 'Goldman Sachs', 'Flipkart', 'Zoho', 'Freshworks',
  // IT Services
  'TCS', 'Infosys', 'Wipro', 'HCL Technologies', 'Tech Mahindra',
  'Accenture', 'Cognizant', 'Capgemini', 'Deloitte', 'IBM',
  'LTTS', 'Persistent Systems', 'LTIMindtree', 'Mphasis', 'EPAM Systems',
];

// Fintech companies — shown with gold tint chip + crown
const FINTECH_COMPANIES = new Set([
  'Paytm', 'PhonePe', 'Razorpay', 'CRED', 'Groww', 'MobiKwik',
  'PayPal', 'Visa', 'Intuit', 'Zerodha', 'BharatPe', 'Google', 'Microsoft', 'Amazon', 'Adobe', 'Meta', 'Salesforce', 'Oracle',
  'SAP', 'Apple', 'Uber', 'LinkedIn', 'Goldman Sachs', 'Flipkart', 'Zoho', 'Freshworks', 'TCS', 'Infosys', 'Wipro', 'HCL Technologies', 'Tech Mahindra',
  'Accenture', 'Cognizant', 'Capgemini', 'Deloitte', 'IBM',
  'LTTS'
]);
import { Colors, Typography, Spacing, Radius } from '../../theme/tokens';

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

  const Chips = ({
    options, field, label,
  }: { options: string[]; field: keyof Omit<Filters, 'companies' | 'work_types'>; label: string }) => (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>{label}</Text>
      <View style={styles.chipRow}>
        {options.map((opt) => (
          <TouchableOpacity
            key={opt}
            style={[styles.chip, local[field] === opt && styles.chipActive]}
            onPress={() =>
              setLocal((f) => ({ ...f, [field]: f[field] === opt ? undefined : opt }))
            }
          >
            <Text style={[styles.chipText, local[field] === opt && styles.chipTextActive]}>
              {opt}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.handle} />

        <View style={styles.header}>
          <Text style={styles.title}>Filters</Text>
          <TouchableOpacity onPress={handleReset}>
            <Text style={styles.resetText}>Reset</Text>
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

          {/* ── Company Multi-Select ─────────────────────────────────── */}
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionLabel}>Companies</Text>
              {selectedCompanies.length > 0 && (
                <Text style={styles.selectedCount}>{selectedCompanies.length} selected</Text>
              )}
            </View>
            <View style={styles.chipRow}>
              {ALL_FILTER_COMPANIES.map((name) => {
                const isSelected = selectedCompanies.includes(name);
                const isFintech = FINTECH_COMPANIES.has(name);
                return (
                  <TouchableOpacity
                    key={name}
                    style={[
                      styles.chip,
                      isFintech && styles.chipFintech,
                      isSelected && styles.chipActive,
                    ]}
                    onPress={() => toggleCompany(name)}
                  >
                    <Text style={[
                      styles.chipText,
                      isFintech && styles.chipTextFintech,
                      isSelected && styles.chipTextActive,
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
              <Text style={styles.sectionLabel}>Work Type</Text>
              {selectedWorkTypes.length > 0 && (
                <Text style={styles.selectedCount}>{selectedWorkTypes.length} selected</Text>
              )}
            </View>
            <View style={styles.chipRow}>
              {WORK_TYPES.map((wt) => {
                const isSelected = selectedWorkTypes.includes(wt);
                return (
                  <TouchableOpacity
                    key={wt}
                    style={[styles.chip, isSelected && styles.chipActive]}
                    onPress={() => toggleWorkType(wt)}
                  >
                    <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                      {wt}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* ── Experience Level ─────────────────────────────────────── */}
          <Chips options={EXP_LEVELS} field="experience_level" label="Experience Level" />

          {/* ── Min Salary ───────────────────────────────────────────── */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Min. Salary</Text>
            <View style={styles.chipRow}>
              {SALARY_RANGES.map((r) => (
                <TouchableOpacity
                  key={String(r.value)}
                  style={[styles.chip, local.salary_min === r.value && styles.chipActive]}
                  onPress={() => setLocal((f) => ({ ...f, salary_min: r.value }))}
                >
                  <Text style={[styles.chipText, local.salary_min === r.value && styles.chipTextActive]}>
                    {r.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

        </ScrollView>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.applyBtn} onPress={() => onApply(local)}>
            <Text style={styles.applyBtnText}>Apply Filters</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, paddingHorizontal: Spacing['2xl'] },
  handle: {
    width: 36, height: 4, borderRadius: Radius.full,
    backgroundColor: Colors.border, alignSelf: 'center',
    marginTop: Spacing.md, marginBottom: Spacing.base,
  },
  header: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: Spacing.lg,
  },
  title: { fontSize: Typography.xl, fontWeight: '800', color: Colors.textPrimary },
  resetText: { fontSize: Typography.base, color: Colors.danger, fontWeight: '600' },
  content: { paddingBottom: 120 },
  section: { marginBottom: Spacing.xl },
  sectionHeaderRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: Spacing.md,
  },
  sectionLabel: {
    fontSize: Typography.sm, fontWeight: '700', color: Colors.textMuted,
    textTransform: 'uppercase', letterSpacing: 1,
  },
  selectedCount: {
    fontSize: Typography.xs, fontWeight: '700', color: Colors.primary,
    backgroundColor: Colors.primary + '22', paddingHorizontal: 8,
    paddingVertical: 2, borderRadius: Radius.full,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  chip: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderRadius: Radius.full, borderWidth: 1,
    borderColor: Colors.border, backgroundColor: Colors.surfaceElevated,
  },
  chipFintech: {
    borderColor: '#FFD700' + '70',
    backgroundColor: '#FFD700' + '12',
  },
  chipActive: { borderColor: Colors.primary, backgroundColor: Colors.primary + '22' },
  chipText: { fontSize: Typography.sm, color: Colors.textSecondary, fontWeight: '600', textTransform: 'capitalize' },
  chipTextFintech: { color: '#9A7000' },
  chipTextActive: { color: Colors.primary },
  actions: {
    flexDirection: 'row', gap: Spacing.md,
    paddingBottom: 48, paddingTop: Spacing.base,
  },
  cancelBtn: {
    flex: 1, paddingVertical: 15, borderRadius: Radius.xl,
    borderWidth: 1, borderColor: Colors.border, alignItems: 'center',
  },
  cancelBtnText: { fontSize: Typography.base, fontWeight: '600', color: Colors.textSecondary },
  applyBtn: {
    flex: 2, paddingVertical: 15, borderRadius: Radius.xl,
    backgroundColor: Colors.primary, alignItems: 'center',
  },
  applyBtnText: { fontSize: Typography.base, fontWeight: '700', color: Colors.textPrimary },
});
