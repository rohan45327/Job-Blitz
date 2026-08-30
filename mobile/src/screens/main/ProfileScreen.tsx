import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, ActivityIndicator, TextInput, Modal
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as DocumentPicker from 'expo-document-picker';
import { useAuthStore } from '../../store/authStore';
import { api, ResumeOut, ProjectOut } from '../../api/client';
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

  const [showResumeModal, setShowResumeModal] = useState(false);
  const [resumeCategory, setResumeCategory] = useState('AI/ML');
  const [resumeTitle, setResumeTitle] = useState('');
  const [resumeKeywords, setResumeKeywords] = useState('');
  const [resumeFile, setResumeFile] = useState<{uri: string, name: string, type: string} | null>(null);

  const { data: resumes, isLoading: isResumesLoading } = useQuery({
    queryKey: ['resumes'],
    queryFn: () => api.getResumes(),
  });

  const { data: projects } = useQuery({
    queryKey: ['projects'],
    queryFn: () => api.getUserProjects(),
  });

  const [showProjectModal, setShowProjectModal] = useState(false);
  const [projTitle, setProjTitle] = useState('');
  const [projDesc, setProjDesc] = useState('');
  const [projSkills, setProjSkills] = useState('');
  const [projGithub, setProjGithub] = useState('');

  const createProjectMutation = useMutation({
    mutationFn: () => api.createProject({
      title: projTitle.trim(),
      description: projDesc.trim(),
      skills: projSkills.split(',').map(s => s.trim()).filter(Boolean),
      github_url: projGithub.trim() || undefined,
    }),
    onSuccess: () => {
      setShowProjectModal(false);
      setProjTitle('');
      setProjDesc('');
      setProjSkills('');
      setProjGithub('');
      qc.invalidateQueries({ queryKey: ['projects'] });
    },
    onError: (e: any) => Alert.alert('Error', e.message),
  });

  const deleteProjectMutation = useMutation({
    mutationFn: (projId: string) => api.deleteProject(projId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects'] }),
  });

  const createResumeMutation = useMutation({
    mutationFn: async () => {
      if (resumeFile) {
        return api.uploadResume(resumeFile, resumeCategory, resumeTitle.trim() || `${resumeCategory} Profile`, resumeKeywords);
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
        Alert.alert('Done', `Resume uploaded! Extracted ${data.extracted_keywords.length} skills.`);
      } else {
        Alert.alert('Done', 'Category resume & search keywords added!');
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
        setResumeFile({ uri: file.uri, name: file.name, type: file.mimeType || 'application/pdf' });
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
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            <Text style={styles.avatarText}>
              {(user?.full_name?.[0] ?? user?.email?.[0] ?? '?').toUpperCase()}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.name, { color: colors.textPrimary }]}>{user?.full_name ?? 'Your Name'}</Text>
            <Text style={[styles.email, { color: colors.textMuted }]}>{user?.email}</Text>
          </View>

          {/* Theme toggle */}
          <TouchableOpacity
            style={[styles.iconBtn, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}
            onPress={toggleTheme}
          >
            <Feather name={isDark ? 'moon' : 'sun'} size={15} color={colors.textSecondary} />
          </TouchableOpacity>

          {/* Edit / Save */}
          <TouchableOpacity
            style={[
              styles.editBtn,
              { backgroundColor: colors.surfaceElevated, borderColor: colors.border },
              editing && { borderColor: colors.primary, backgroundColor: colors.primary + '18' },
            ]}
            onPress={() => editing ? updateMutation.mutate() : setEditing(true)}
          >
            {updateMutation.isPending
              ? <ActivityIndicator size="small" color={colors.primary} />
              : editing
                ? <Feather name="check" size={15} color={colors.primary} />
                : <Feather name="edit-2" size={15} color={colors.textSecondary} />
            }
          </TouchableOpacity>
        </View>

        {/* Resumes Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Feather name="folder" size={13} color={colors.textMuted} />
              <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>Search Resumes</Text>
            </View>
            <TouchableOpacity
              style={[styles.addResumeBtn, { backgroundColor: colors.primary }]}
              onPress={() => setShowResumeModal(true)}
            >
              <Feather name="plus" size={13} color="#FFFFFF" />
              <Text style={styles.addResumeBtnText}>Add Resume</Text>
            </TouchableOpacity>
          </View>

          {isResumesLoading ? (
            <ActivityIndicator color={colors.primary} />
          ) : !resumes || resumes.length === 0 ? (
            <View style={[styles.emptyResumeBox, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
              <Text style={[styles.emptyResumeTitle, { color: colors.textPrimary }]}>No Role Resumes Added</Text>
              <Text style={[styles.emptyResumeSub, { color: colors.textMuted }]}>
                Add resumes for specific roles (AI/ML, SDE, Data Analysis) to get 75%+ matched jobs.
              </Text>
            </View>
          ) : (
            <View style={{ gap: Spacing.md }}>
              {resumes.map((res: ResumeOut) => (
                <View key={res.id} style={[styles.resumeCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <View style={styles.resumeHeader}>
                    <View style={[styles.categoryTag, { backgroundColor: colors.primary + '18', borderColor: colors.primary + '50' }]}>
                      <Text style={[styles.categoryTagText, { color: colors.primary }]}>{res.category}</Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => deleteResumeMutation.mutate(res.id)}
                      style={[styles.deleteBtn, { backgroundColor: colors.danger + '14', borderColor: colors.danger + '30' }]}
                    >
                      <Feather name="trash-2" size={13} color={colors.danger} />
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

        {/* Portfolio Projects Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Feather name="code" size={13} color={colors.textMuted} />
              <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>Portfolio Projects</Text>
            </View>
            <TouchableOpacity
              style={[styles.addResumeBtn, { backgroundColor: colors.accent }]}
              onPress={() => setShowProjectModal(true)}
            >
              <Feather name="plus" size={13} color="#FFFFFF" />
              <Text style={styles.addResumeBtnText}>Add Project</Text>
            </TouchableOpacity>
          </View>

          {!projects || projects.length === 0 ? (
            <View style={[styles.emptyResumeBox, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
              <Text style={[styles.emptyResumeTitle, { color: colors.textPrimary }]}>No Technical Projects Added</Text>
              <Text style={[styles.emptyResumeSub, { color: colors.textMuted }]}>
                Add projects to enable AI Resume Defense Mode & Technical Interview simulations.
              </Text>
            </View>
          ) : (
            <View style={{ gap: Spacing.md }}>
              {projects.map((proj: ProjectOut) => (
                <View key={proj.id} style={[styles.resumeCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <View style={styles.resumeHeader}>
                    <Text style={[styles.resumeTitle, { color: colors.textPrimary }]}>{proj.title}</Text>
                    <TouchableOpacity
                      onPress={() => deleteProjectMutation.mutate(proj.id)}
                      style={[styles.deleteBtn, { backgroundColor: colors.danger + '14', borderColor: colors.danger + '30' }]}
                    >
                      <Feather name="trash-2" size={13} color={colors.danger} />
                    </TouchableOpacity>
                  </View>
                  {proj.description && (
                    <Text style={[styles.emptyResumeSub, { color: colors.textSecondary, marginBottom: 6 }]}>{proj.description}</Text>
                  )}
                  {proj.skills && proj.skills.length > 0 && (
                    <View style={styles.kwRow}>
                      {proj.skills.map((s: string, i: number) => (
                        <View key={i} style={[styles.kwChip, { backgroundColor: colors.primary + '18', borderColor: colors.primary + '30' }]}>
                          <Text style={[styles.kwText, { color: colors.primary }]}>{s}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Personal Info */}
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

          <View style={[styles.field, { borderBottomColor: colors.border }]}>
            <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>Experience Level</Text>
            {editing ? (
              <View style={styles.optionRow}>
                {EXP_OPTIONS.map((opt) => (
                  <TouchableOpacity
                    key={opt}
                    style={[styles.optionChip, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }, form.experience_level === opt && { borderColor: colors.primary, backgroundColor: colors.primary + '18' }]}
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
                    style={[styles.optionChip, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }, form.preferred_work_type === opt && { borderColor: colors.primary, backgroundColor: colors.primary + '18' }]}
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
        <TouchableOpacity
          style={[styles.logoutBtn, { borderColor: colors.danger + '40' }]}
          onPress={handleLogout}
        >
          <Feather name="log-out" size={15} color={colors.danger} />
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
        <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.88)' }]}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Add Resume</Text>
            <Text style={[styles.modalSub, { color: colors.textMuted }]}>
              Set role category and keywords for automated 75%+ job matching.
            </Text>

            <Text style={[styles.inputLabel, { color: colors.textMuted }]}>Target Category</Text>
            <View style={styles.optionRow}>
              {CATEGORY_OPTIONS.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.optionChip, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }, resumeCategory === cat && { borderColor: colors.primary, backgroundColor: colors.primary + '18' }]}
                  onPress={() => setResumeCategory(cat)}
                >
                  <Text style={[styles.optionText, { color: colors.textSecondary }, resumeCategory === cat && { color: colors.primary, fontWeight: '700' }]}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.inputLabel, { color: colors.textMuted, marginTop: Spacing.md }]}>Resume Title</Text>
            <TextInput
              style={[styles.modalInput, { backgroundColor: colors.surfaceElevated, borderColor: colors.border, color: colors.textPrimary }]}
              placeholder="e.g. Senior AI / ML Resume 2026"
              placeholderTextColor={colors.textMuted}
              value={resumeTitle}
              onChangeText={setResumeTitle}
            />

            <Text style={[styles.inputLabel, { color: colors.textMuted, marginTop: Spacing.md }]}>Resume File (PDF/DOCX)</Text>
            <TouchableOpacity
              style={[styles.fileUploadBtn, { backgroundColor: colors.surfaceElevated, borderColor: resumeFile ? colors.primary : colors.border }]}
              onPress={pickDocument}
            >
              <Feather name="upload" size={20} color={resumeFile ? colors.primary : colors.textMuted} />
              <Text style={[styles.fileUploadText, { color: resumeFile ? colors.primary : colors.textSecondary }]}>
                {resumeFile ? resumeFile.name : 'Tap to select a file'}
              </Text>
            </TouchableOpacity>

            <Text style={[styles.inputLabel, { color: colors.textMuted, marginTop: Spacing.md }]}>Keywords (comma separated)</Text>
            <TextInput
              style={[styles.modalInput, { backgroundColor: colors.surfaceElevated, borderColor: colors.border, color: colors.textPrimary }]}
              placeholder="e.g. PyTorch, LLM, RAG, CUDA"
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

      {/* Add Project Modal */}
      <Modal
        animationType="fade"
        transparent
        visible={showProjectModal}
        onRequestClose={() => setShowProjectModal(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.88)' }]}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Add Technical Project</Text>
            <Text style={[styles.modalSub, { color: colors.textMuted }]}>
              Enter project details for AI Resume Defense & Interview Simulation.
            </Text>

            <Text style={[styles.inputLabel, { color: colors.textMuted }]}>Project Title</Text>
            <TextInput
              style={[styles.modalInput, { backgroundColor: colors.surfaceElevated, borderColor: colors.border, color: colors.textPrimary }]}
              placeholder="e.g. Distributed Log Parser & Indexer"
              placeholderTextColor={colors.textMuted}
              value={projTitle}
              onChangeText={setProjTitle}
            />

            <Text style={[styles.inputLabel, { color: colors.textMuted, marginTop: Spacing.md }]}>Description / Overview</Text>
            <TextInput
              style={[styles.modalInput, { backgroundColor: colors.surfaceElevated, borderColor: colors.border, color: colors.textPrimary }]}
              placeholder="e.g. High-throughput log parsing engine using FastAPI & Redis."
              placeholderTextColor={colors.textMuted}
              value={projDesc}
              onChangeText={setProjDesc}
            />

            <Text style={[styles.inputLabel, { color: colors.textMuted, marginTop: Spacing.md }]}>Technologies & Skills (comma separated)</Text>
            <TextInput
              style={[styles.modalInput, { backgroundColor: colors.surfaceElevated, borderColor: colors.border, color: colors.textPrimary }]}
              placeholder="e.g. Python, FastAPI, Redis, Docker, SQL"
              placeholderTextColor={colors.textMuted}
              value={projSkills}
              onChangeText={setProjSkills}
            />

            <Text style={[styles.inputLabel, { color: colors.textMuted, marginTop: Spacing.md }]}>GitHub / Code URL</Text>
            <TextInput
              style={[styles.modalInput, { backgroundColor: colors.surfaceElevated, borderColor: colors.border, color: colors.textPrimary }]}
              placeholder="e.g. https://github.com/username/project"
              placeholderTextColor={colors.textMuted}
              value={projGithub}
              onChangeText={setProjGithub}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalCancelBtn, { borderColor: colors.border }]}
                onPress={() => setShowProjectModal(false)}
              >
                <Text style={[styles.modalCancelText, { color: colors.textMuted }]}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalSaveBtn, { backgroundColor: colors.accent }]}
                onPress={() => createProjectMutation.mutate()}
                disabled={createProjectMutation.isPending}
              >
                {createProjectMutation.isPending ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.modalSaveText}>Save Project</Text>
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
  scroll: { paddingBottom: 160 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing['2xl'],
    paddingTop: 56,
    paddingBottom: Spacing.base,
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginBottom: Spacing.lg,
  },
  avatar: { width: 48, height: 48, borderRadius: Radius.full, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: Typography.lg, fontWeight: '800', color: '#FFFFFF' },
  name: { fontSize: Typography.md, fontWeight: '800', flex: 1, flexWrap: 'wrap' },
  email: { fontSize: Typography.sm, marginTop: 1, flex: 1, flexWrap: 'wrap' },
  iconBtn: { width: 34, height: 34, borderRadius: Radius.full, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  editBtn: { width: 34, height: 34, borderRadius: Radius.full, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  section: { marginBottom: Spacing['2xl'], paddingHorizontal: Spacing['2xl'] },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.md },
  sectionTitle: { fontSize: Typography.xs, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: Spacing.md },
  addResumeBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: Spacing.md, paddingVertical: 6, borderRadius: Radius.full },
  addResumeBtnText: { fontSize: Typography.xs, fontWeight: '700', color: '#FFFFFF' },
  emptyResumeBox: { padding: Spacing.lg, borderRadius: Radius.xl, borderWidth: 1 },
  emptyResumeTitle: { fontSize: Typography.base, fontWeight: '700', marginBottom: 4 },
  emptyResumeSub: { fontSize: Typography.xs, lineHeight: Typography.xs * 1.6 },
  resumeCard: { padding: Spacing.base, borderRadius: Radius.xl, borderWidth: 1 },
  resumeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.xs },
  categoryTag: { paddingHorizontal: Spacing.sm, paddingVertical: 3, borderRadius: Radius.full, borderWidth: 1 },
  categoryTagText: { fontSize: 11, fontWeight: '700' },
  deleteBtn: { width: 28, height: 28, borderRadius: Radius.full, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  resumeTitle: { fontSize: Typography.base, fontWeight: '700', marginBottom: Spacing.sm },
  kwRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  kwChip: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: Radius.sm, borderWidth: 1 },
  kwText: { fontSize: 11 },
  field: { paddingVertical: Spacing.md, borderBottomWidth: StyleSheet.hairlineWidth },
  fieldLabel: { fontSize: Typography.xs, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: '600' },
  fieldValue: { fontSize: Typography.base },
  input: { fontSize: Typography.base, padding: 0 },
  optionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginTop: 6 },
  optionChip: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: Radius.full, borderWidth: 1 },
  optionText: { fontSize: Typography.sm },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: Spacing['2xl'],
    paddingVertical: Spacing.lg,
    borderWidth: 1,
    borderRadius: Radius.xl,
    marginTop: Spacing.lg,
  },
  logoutText: { fontSize: Typography.base, fontWeight: '700' },

  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: Spacing.lg },
  modalContent: { width: '100%', borderRadius: Radius['2xl'], borderWidth: 1, padding: Spacing.xl },
  modalTitle: { fontSize: Typography.xl, fontWeight: '800', marginBottom: 4 },
  modalSub: { fontSize: Typography.xs, marginBottom: Spacing.lg, lineHeight: Typography.xs * 1.6 },
  inputLabel: { fontSize: Typography.xs, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 4 },
  modalInput: { borderRadius: Radius.lg, borderWidth: 1, padding: Spacing.md, fontSize: Typography.base },
  modalActions: { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.xl },
  modalCancelBtn: { flex: 1, paddingVertical: 13, borderRadius: Radius.xl, borderWidth: 1, alignItems: 'center' },
  modalCancelText: { fontSize: Typography.sm, fontWeight: '600' },
  modalSaveBtn: { flex: 2, paddingVertical: 13, borderRadius: Radius.xl, alignItems: 'center' },
  modalSaveText: { fontSize: Typography.sm, fontWeight: '800', color: '#FFFFFF' },
  fileUploadBtn: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: Spacing.sm,
  },
  fileUploadText: { fontSize: Typography.sm, fontWeight: '600', textAlign: 'center' },
});
