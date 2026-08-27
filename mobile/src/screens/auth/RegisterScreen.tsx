import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, Alert, ActivityIndicator, ScrollView
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParams } from '../../../App';
import { useAuthStore } from '../../store/authStore';
import { useTheme } from '../../theme/ThemeContext';
import { Typography, Spacing, Radius } from '../../theme/tokens';

type Props = NativeStackScreenProps<RootStackParams, 'Register'>;

export function RegisterScreen({ navigation }: Props) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { register } = useAuthStore();
  const { colors } = useTheme();

  const handleRegister = async () => {
    if (!email.trim() || !password) {
      setError('Please fill in all required fields.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await register(email.trim().toLowerCase(), password, fullName.trim() || undefined);
    } catch (e: any) {
      console.error('Register error:', e);
      const msg = e.message || 'Registration failed. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoRow}>
            <Ionicons name="flash" size={22} color={colors.primary} />
            <Text style={[styles.logo, { color: colors.textPrimary }]}>JobBlitz</Text>
          </View>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Create account</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Your personal AI job co-pilot awaits</Text>
        </View>

        {/* Error Banner */}
        {error && (
          <View style={[styles.errorBanner, { backgroundColor: colors.danger + '18', borderColor: colors.danger + '50' }]}>
            <Feather name="alert-circle" size={14} color={colors.danger} />
            <Text style={[styles.errorBannerText, { color: colors.danger }]}>{error}</Text>
          </View>
        )}

        {/* Form */}
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textMuted }]}>Full Name</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surfaceElevated, borderColor: colors.border, color: colors.textPrimary }]}
              value={fullName}
              onChangeText={setFullName}
              placeholder="Jane Smith"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="words"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textMuted }]}>Email</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surfaceElevated, borderColor: colors.border, color: colors.textPrimary }]}
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              placeholderTextColor={colors.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textMuted }]}>Password</Text>
            <View style={[styles.inputWrapper, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
              <TextInput
                style={[styles.inputInner, { color: colors.textPrimary }]}
                value={password}
                onChangeText={setPassword}
                placeholder="Min. 8 characters"
                placeholderTextColor={colors.textMuted}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword((v) => !v)} style={styles.eyeBtn}>
                <Feather name={showPassword ? 'eye-off' : 'eye'} size={16} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textMuted }]}>Confirm Password</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surfaceElevated, borderColor: colors.border, color: colors.textPrimary }]}
              value={confirm}
              onChangeText={setConfirm}
              placeholder="Repeat password"
              placeholderTextColor={colors.textMuted}
              secureTextEntry
            />
          </View>

          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: colors.primary }, loading && styles.primaryBtnDisabled]}
            onPress={handleRegister}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.primaryBtnText}>Create Account</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <TouchableOpacity
          onPress={() => navigation.navigate('Login')}
          style={styles.footer}
        >
          <Text style={[styles.footerText, { color: colors.textSecondary }]}>
            Already have an account?{' '}
            <Text style={[styles.footerLink, { color: colors.primary }]}>Sign in</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: { flexGrow: 1, paddingHorizontal: Spacing['2xl'], paddingTop: 80, paddingBottom: 48 },
  header: { marginBottom: Spacing['3xl'] },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: Spacing.lg },
  logo: { fontSize: Typography.xl, fontWeight: '800', letterSpacing: -0.5 },
  title: { fontSize: Typography['3xl'], fontWeight: '800', letterSpacing: -0.5, marginBottom: Spacing.sm },
  subtitle: { fontSize: Typography.base },
  errorBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderWidth: 1, borderRadius: Radius.lg,
    padding: Spacing.base, marginBottom: Spacing.base,
  },
  errorBannerText: { fontSize: Typography.sm, fontWeight: '600', flex: 1 },
  form: { gap: Spacing.base, marginBottom: Spacing['2xl'] },
  inputGroup: { gap: Spacing.xs },
  label: { fontSize: Typography.xs, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8 },
  input: { borderRadius: Radius.lg, borderWidth: 1, padding: Spacing.base, fontSize: Typography.base },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: Radius.lg, borderWidth: 1, overflow: 'hidden',
  },
  inputInner: { flex: 1, padding: Spacing.base, fontSize: Typography.base },
  eyeBtn: { paddingHorizontal: Spacing.base, paddingVertical: Spacing.base },
  primaryBtn: {
    borderRadius: Radius.xl, paddingVertical: 15,
    alignItems: 'center', marginTop: Spacing.sm,
  },
  primaryBtnDisabled: { opacity: 0.6 },
  primaryBtnText: { fontSize: Typography.md, fontWeight: '700', color: '#FFFFFF' },
  footer: { alignItems: 'center' },
  footerText: { fontSize: Typography.sm },
  footerLink: { fontWeight: '700' },
});
