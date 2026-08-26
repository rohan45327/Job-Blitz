import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, ActivityIndicator, TextInput, Modal
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as DocumentPicker from 'expo-document-picker';
import { useAuthStore } from '../../store/authStore';
import { api, ResumeOut } from '../../api/client';
import { Typography, Spacing, Radius } from '../../theme/tokens';
import { useTheme } from '../../theme/ThemeContext';

const WORK_TYPE_OPTIONS = ['remote', 'hybrid', 'onsite'];
const EXP_OPTIONS = ['entry', 'mid', 'senior', 'lead', 'executive'];
const CATEGORY_OPTIONS = ['AI/ML', 'SDE', 'Data Analysis', 'Product', 'Internship'];

interface FieldInputProps {
  label: string;
  value: string;
  field: string;
  editing: boolean;
  keyboardType?: 'default' | 'numeric' | 'email-address';
  onChangeText: (field: string, value: string) => void;
}

const FieldInput = React.memo(({ label, value, field, editing, keyboardType = 'default', onChangeText }: FieldInputProps) => {
  const { colors } = useTheme();
  return (
    <View style={[styles.field, { borderBottomColor: colors.border }]}>
      <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>{label}</Text>
      {editing ? (
        <TextInput
          style={[styles.input, { color: colors.textPrimary }]}
          value={value}
          onChangeText={(v) => onChangeText(field, v)}
          placeholder={label}
          placeholderTextColor={colors.textMuted}
          keyboardType={keyboardType}
        />
      ) : (
        <Text style={[styles.fieldValue, { color: colors.textPrimary }]}>{value || '—'}</Text>
      )}
    </View>
  );
});

export function ProfileScreen() {
  const { user, logout, updateUser } = useAuthStore();
  const { colors, isDark, toggleTheme } = useTheme();
  const qc = useQueryClient();

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    full_name: user?.full_name ?? '',
    title: user?.title ?? '',
    location: user?.location ?? '',
    bio: user?.bio ?? '',
    experience_years: String(user?.experience_years ?? ''),
    experience_level: user?.experience_level ?? '',
    preferred_work_type: user?.preferred_work_type ?? '',
    salary_expectation_min: String(user?.salary_expectation_min ?? ''),
    salary_expectation_max: String(user?.salary_expectation_max ?? ''),
    open_to_relocation: user?.open_to_relocation ?? false,
  });

  // Resume Modal State
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [resumeCategory, setResumeCategory] = useState('AI/ML');
  const [resumeTitle, setResumeTitle] = useState('');
  const [resumeKeywords, setResumeKeywords] = useState('');

  const [resumeFile, setResumeFile] = useState<{uri: string, name: string, type: string} | null>(null);

  // Fetch Resumes
  const { data: resumes, isLoading: isResumesLoading } = useQuery({
    queryKey: ['resumes'],
    queryFn: () => api.getResumes(),
  });

  const createResumeMutation = useMutation({
    mutationFn: async () => {
      if (resumeFile) {
        return api.uploadResume(
          resumeFile,
          resumeCategory,
          resumeTitle.trim() || `${resumeCategory} Profile`,
          resumeKeywords
        );
      }
      const kwList = resumeKeywords.split(',').map((k) => k.trim()).filter(Boolean);
      return api.createResume(resumeCategory, resumeTitle.trim() || `${resumeCategory} Profile`, '', kwList);
    },
    onSuccess: (data: any) => {
      setShowResumeModal(false);
      setResumeTitle('');
      setResumeKeywords('');
      setResumeFile(null);
      qc.invalidateQueries({ queryKey: ['resumes'] });
      qc.invalidateQueries({ queryKey: ['job-feed'] });
      if (data?.extracted_keywords) {
        Alert.alert('Success', `Resume uploaded! Extracted ${data.extracted_keywords.length} skills automatically.`);
      } else {
        Alert.alert('Success', 'Category resume & search keywords added!');
      }
    },
    onError: (e: any) => Alert.alert('Error', e.message || 'Could not save resume profile.'),
  });

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        copyToCacheDirectory: true,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        setResumeFile({
          uri: file.uri,
          name: file.name,
          type: file.mimeType || 'application/pdf',
        });
      }
    } catch (e) {
      console.log(e);
    }
  };

  const deleteResumeMutation = useMutation({
    mutationFn: (resumeId: string) => api.deleteResume(resumeId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['resumes'] });
      qc.invalidateQueries({ queryKey: ['job-feed'] });
    },
  });

  const handleFieldChange = React.useCallback((field: string, value: string) => {
    setForm((f) => ({ ...f, [field]: value }));
  }, []);

  const updateMutation = useMutation({
    mutationFn: () =>
      api.updateMe({
        full_name: form.full_name || undefined,
        title: form.title || undefined,
        location: form.location || undefined,
        bio: form.bio || undefined,
        experience_years: form.experience_years ? parseInt(form.experience_years) : undefined,
        experience_level: (form.experience_level || undefined) as any,
        preferred_work_type: (form.preferred_work_type || undefined) as any,
        salary_expectation_min: form.salary_expectation_min ? parseFloat(form.salary_expectation_min) : undefined,
        salary_expectation_max: form.salary_expectation_max ? parseFloat(form.salary_expectation_max) : undefined,
        open_to_relocation: form.open_to_relocation,
      }),
    onSuccess: (data) => {
      updateUser(data);
      setEditing(false);
      qc.invalidateQueries({ queryKey: ['me'] });
      qc.invalidateQueries({ queryKey: ['job-feed'] });
    },
    onError: (e: any) => Alert.alert('Error', e.message),
  });

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* Top Header */}
        <View style={styles.header}>
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            <Text style={styles.avatarText}>
              {(user?.full_name?.[0] ?? user?.email?.[0] ?? '?').toUpperCase()}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.name, { color: colors.textPrimary }]}>{user?.full_name ?? 'Your Name'}</Text>
            <Text style={[styles.email, { color: colors.textMuted }]}>{user?.email}</Text>
          </View>

          <TouchableOpacity
            style={[styles.themeToggle, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}
            onPress={toggleTheme}
          >
            <Text style={{ fontSize: 16 }}>{isDark ? '🌙' : '☀️'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.editBtn, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }, editing && { borderColor: colors.primary, backgroundColor: colors.primary + '22' }]}
            onPress={() => editing ? updateMutation.mutate() : setEditing(true)}
          >
            {updateMutation.isPending
              ? <ActivityIndicator size="small" color={colors.primary} />
              : <Text style={[styles.editBtnText, { color: colors.primary }]}>{editing ? 'Save' : 'Edit'}</Text>
            }
          </TouchableOpacity>
        </View>

        {/* Multi-Resume Management Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>📁 Categorized Search Resumes</Text>
            <TouchableOpacity
              style={[styles.addResumeBtn, { backgroundColor: colors.primary }]}
              onPress={() => setShowResumeModal(true)}
            >
              <Text style={styles.addResumeBtnText}>+ Add Resume</Text>
            </TouchableOpacity>
          </View>

          {isResumesLoading ? (
            <ActivityIndicator color={colors.primary} />
          ) : !resumes || resumes.length === 0 ? (
            <View style={[styles.emptyResumeBox, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
              <Text style={[styles.emptyResumeTitle, { color: colors.textPrimary }]}>No Role Resumes Added</Text>
              <Text style={[styles.emptyResumeSub, { color: colors.textMuted }]}>
                Add resumes for specific roles (e.g. AI/ML, SDE, Data Analysis) and enter search keywords to automatically fetch 75%+ matched jobs.
              </Text>
            </View>
          ) : (
            <View style={{ gap: Spacing.md }}>
              {resumes.map((res: ResumeOut) => (
                <View key={res.id} style={[styles.resumeCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <View style={styles.resumeHeader}>
                    <View style={[styles.categoryTag, { backgroundColor: colors.primary + '20', borderColor: colors.primary }]}>
                      <Text style={[styles.categoryTagText, { color: colors.primary }]}>{res.category}</Text>
                    </View>
                    <TouchableOpacity onPress={() => deleteResumeMutation.mutate(res.id)}>
                      <Text style={{ fontSize: 16 }}>🗑️</Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={[styles.resumeTitle, { color: colors.textPrimary }]}>{res.title}</Text>
                  {res.defining_keywords && res.defining_keywords.length > 0 && (
                    <View style={styles.kwRow}>
                      {res.defining_keywords.map((kw, i) => (
                        <View key={i} style={[styles.kwChip, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
                          <Text style={[styles.kwText, { color: colors.textSecondary }]}>#{kw}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Profile section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>Personal Info</Text>
          <FieldInput label="Full Name" value={form.full_name} field="full_name" editing={editing} onChangeText={handleFieldChange} />
          <FieldInput label="Current Title" value={form.title} field="title" editing={editing} onChangeText={handleFieldChange} />
          <FieldInput label="Location" value={form.location} field="location" editing={editing} onChangeText={handleFieldChange} />
          <FieldInput label="Bio" value={form.bio} field="bio" editing={editing} onChangeText={handleFieldChange} />
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>Experience</Text>
          <FieldInput label="Years of Experience" value={form.experience_years} field="experience_years" editing={editing} keyboardType="numeric" onChangeText={handleFieldChange} />

          {/* Experience Level Picker */}
          <View style={[styles.field, { borderBottomColor: colors.border }]}>
            <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>Experience Level</Text>
            {editing ? (
              <View style={styles.optionRow}>
                {EXP_OPTIONS.map((opt) => (
                  <TouchableOpacity
                    key={opt}
                    style={[styles.optionChip, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }, form.experience_level === opt && { borderColor: colors.primary, backgroundColor: colors.primary + '22' }]}
                    onPress={() => setForm((f) => ({ ...f, experience_level: opt }))}
                  >
                    <Text style={[styles.optionText, { color: colors.textSecondary }, form.experience_level === opt && { color: colors.primary, fontWeight: '700' }]}>{opt}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <Text style={[styles.fieldValue, { color: colors.textPrimary }]}>{form.experience_level || '—'}</Text>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>Preferences</Text>

          <View style={[styles.field, { borderBottomColor: colors.border }]}>
            <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>Work Type</Text>
            {editing ? (
              <View style={styles.optionRow}>
                {WORK_TYPE_OPTIONS.map((opt) => (
                  <TouchableOpacity
                    key={opt}
                    style={[styles.optionChip, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }, form.preferred_work_type === opt && { borderColor: colors.primary, backgroundColor: colors.primary + '22' }]}
                    onPress={() => setForm((f) => ({ ...f, preferred_work_type: opt }))}
                  >
                    <Text style={[styles.optionText, { color: colors.textSecondary }, form.preferred_work_type === opt && { color: colors.primary, fontWeight: '700' }]}>{opt}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <Text style={[styles.fieldValue, { color: colors.textPrimary }]}>{form.preferred_work_type || '—'}</Text>
            )}
          </View>

          <FieldInput label="Min. Salary ($)" value={form.salary_expectation_min} field="salary_expectation_min" editing={editing} keyboardType="numeric" onChangeText={handleFieldChange} />
          <FieldInput label="Max. Salary ($)" value={form.salary_expectation_max} field="salary_expectation_max" editing={editing} keyboardType="numeric" onChangeText={handleFieldChange} />
        </View>

        {/* Sign out */}
        <TouchableOpacity style={[styles.logoutBtn, { borderColor: colors.danger + '40' }]} onPress={handleLogout}>
          <Text style={[styles.logoutText, { color: colors.danger }]}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Add Resume Modal */}
      <Modal
        animationType="fade"
        transparent
        visible={showResumeModal}
        onRequestClose={() => setShowResumeModal(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.85)' }]}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Add Category Resume</Text>
            <Text style={[styles.modalSub, { color: colors.textMuted }]}>
              Enter role category and defining search keywords for automated 75%+ job matching.
            </Text>

            {/* Category Select */}
            <Text style={[styles.inputLabel, { color: colors.textMuted }]}>Target Category</Text>
            <View style={styles.optionRow}>
              {CATEGORY_OPTIONS.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.optionChip, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }, resumeCategory === cat && { borderColor: colors.primary, backgroundColor: colors.primary + '22' }]}
                  onPress={() => setResumeCategory(cat)}
                >
                  <Text style={[styles.optionText, { color: colors.textSecondary }, resumeCategory === cat && { color: colors.primary, fontWeight: '700' }]}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Title */}
            <Text style={[styles.inputLabel, { color: colors.textMuted, marginTop: Spacing.md }]}>Resume Title</Text>
            <TextInput
              style={[styles.modalInput, { backgroundColor: colors.surfaceElevated, borderColor: colors.border, color: colors.textPrimary }]}
              placeholder="e.g. Senior AI / ML Resume 2026"
              placeholderTextColor={colors.textMuted}
              value={resumeTitle}
              onChangeText={setResumeTitle}
            />

            {/* File Upload */}
            <Text style={[styles.inputLabel, { color: colors.textMuted, marginTop: Spacing.md }]}>Resume File (PDF/DOCX)</Text>
            <TouchableOpacity 
              style={[styles.fileUploadBtn, { backgroundColor: colors.surfaceElevated, borderColor: resumeFile ? colors.primary : colors.border }]} 
              onPress={pickDocument}
            >
              <Text style={{ fontSize: 20, marginBottom: 4 }}>📄</Text>
              <Text style={[styles.fileUploadText, { color: resumeFile ? colors.primary : colors.textSecondary }]}>
                {resumeFile ? resumeFile.name : 'Tap to select a file'}
              </Text>
            </TouchableOpacity>

            {/* Defining Search Keywords */}
            <Text style={[styles.inputLabel, { color: colors.textMuted, marginTop: Spacing.md }]}>Defining Search Keywords (comma separated)</Text>
            <TextInput
              style={[styles.modalInput, { backgroundColor: colors.surfaceElevated, borderColor: colors.border, color: colors.textPrimary }]}
              placeholder="e.g. PyTorch, LLM, RAG, CUDA, Computer Vision"
              placeholderTextColor={colors.textMuted}
              value={resumeKeywords}
              onChangeText={setResumeKeywords}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalCancelBtn, { borderColor: colors.border }]}
                onPress={() => setShowResumeModal(false)}
              >
                <Text style={[styles.modalCancelText, { color: colors.textMuted }]}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalSaveBtn, { backgroundColor: colors.primary }]}
                onPress={() => createResumeMutation.mutate()}
                disabled={createResumeMutation.isPending}
              >
                {createResumeMutation.isPending ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.modalSaveText}>Save Resume</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: Spacing['2xl'], paddingTop: 56, paddingBottom: 120 },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing['2xl'] },
  avatar: { width: 56, height: 56, borderRadius: Radius.full, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: Typography.xl, fontWeight: '800', color: '#FFFFFF' },
  name: { fontSize: Typography.lg, fontWeight: '800' },
  email: { fontSize: Typography.sm },
  themeToggle: { width: 38, height: 38, borderRadius: Radius.full, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  editBtn: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: Radius.full, borderWidth: 1 },
  editBtnText: { fontSize: Typography.sm, fontWeight: '600' },
  section: { marginBottom: Spacing['2xl'] },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.md },
  sectionTitle: { fontSize: Typography.xs, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  addResumeBtn: { paddingHorizontal: Spacing.md, paddingVertical: 6, borderRadius: Radius.full },
  addResumeBtnText: { fontSize: Typography.xs, fontWeight: '700', color: '#FFFFFF' },
  emptyResumeBox: { padding: Spacing.lg, borderRadius: Radius.xl, borderWidth: 1 },
  emptyResumeTitle: { fontSize: Typography.md, fontWeight: '700', marginBottom: 4 },
  emptyResumeSub: { fontSize: Typography.xs, lineHeight: Typography.xs * 1.5 },
  resumeCard: { padding: Spacing.lg, borderRadius: Radius.xl, borderWidth: 1 },
  resumeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.xs },
  categoryTag: { paddingHorizontal: Spacing.sm, paddingVertical: 3, borderRadius: Radius.full, borderWidth: 1 },
  categoryTagText: { fontSize: 10, fontWeight: '800' },
  resumeTitle: { fontSize: Typography.base, fontWeight: '700', marginBottom: Spacing.sm },
  kwRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  kwChip: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: Radius.sm, borderWidth: 1 },
  kwText: { fontSize: 11 },
  field: { paddingVertical: Spacing.md, borderBottomWidth: 1 },
  fieldLabel: { fontSize: Typography.xs, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  fieldValue: { fontSize: Typography.base },
  input: { fontSize: Typography.base, padding: 0 },
  optionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginTop: 4 },
  optionChip: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: Radius.full, borderWidth: 1 },
  optionText: { fontSize: Typography.sm },
  logoutBtn: { alignItems: 'center', paddingVertical: Spacing.lg, borderWidth: 1, borderRadius: Radius.xl, marginTop: Spacing['2xl'] },
  logoutText: { fontSize: Typography.base, fontWeight: '700' },

  // Modal
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: Spacing.lg },
  modalContent: { width: '100%', borderRadius: Radius['2xl'], borderWidth: 1, padding: Spacing.xl },
  modalTitle: { fontSize: Typography.xl, fontWeight: '800', marginBottom: 4 },
  modalSub: { fontSize: Typography.xs, marginBottom: Spacing.lg },
  inputLabel: { fontSize: Typography.xs, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  modalInput: { borderRadius: Radius.lg, borderWidth: 1, padding: Spacing.md, fontSize: Typography.base },
  modalActions: { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.xl },
  modalCancelBtn: { flex: 1, paddingVertical: 14, borderRadius: Radius.xl, borderWidth: 1, alignItems: 'center' },
  modalCancelText: { fontSize: Typography.sm, fontWeight: '600' },
  modalSaveBtn: { flex: 2, paddingVertical: 14, borderRadius: Radius.xl, alignItems: 'center' },
  modalSaveText: { fontSize: Typography.sm, fontWeight: '800', color: '#FFFFFF' },
  fileUploadBtn: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  fileUploadText: {
    fontSize: Typography.sm,
    fontWeight: '600',
    textAlign: 'center',
  }
});
