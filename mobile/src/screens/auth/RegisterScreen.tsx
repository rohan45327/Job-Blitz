import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, Alert, ActivityIndicator, ScrollView
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParams } from '../../../App';
import { useAuthStore } from '../../store/authStore';
import { Colors, Typography, Spacing, Radius } from '../../theme/tokens';

type Props = NativeStackScreenProps<RootStackParams, 'Register'>;

export function RegisterScreen({ navigation }: Props) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { register } = useAuthStore();

  const handleRegister = async () => {
    if (!email.trim() || !password) {
      setError('Please fill in all required fields.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      if (Platform.OS !== 'web') Alert.alert('Password Mismatch', 'Passwords do not match.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      if (Platform.OS !== 'web') Alert.alert('Weak Password', 'Password must be at least 8 characters.');
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
      if (Platform.OS !== 'web') {
        Alert.alert('Registration Failed', msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>⚡ JobBlitz</Text>
          <Text style={styles.title}>Create account</Text>
          <Text style={styles.subtitle}>Your personal AI job co-pilot awaits</Text>
        </View>

        {/* Error Banner */}
        {error && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>⚠️ {error}</Text>
          </View>
        )}

        {/* Form */}
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={styles.input}
              value={fullName}
              onChangeText={setFullName}
              placeholder="Jane Smith"
              placeholderTextColor={Colors.textMuted}
              autoCapitalize="words"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              placeholderTextColor={Colors.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="Min. 8 characters"
              placeholderTextColor={Colors.textMuted}
              secureTextEntry
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Confirm Password</Text>
            <TextInput
              style={styles.input}
              value={confirm}
              onChangeText={setConfirm}
              placeholder="Repeat password"
              placeholderTextColor={Colors.textMuted}
              secureTextEntry
            />
          </View>

          <TouchableOpacity
            style={[styles.primaryBtn, loading && styles.primaryBtnDisabled]}
            onPress={handleRegister}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color={Colors.textPrimary} />
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
          <Text style={styles.footerText}>
            Already have an account?{' '}
            <Text style={styles.footerLink}>Sign in</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  inner: { flexGrow: 1, paddingHorizontal: Spacing['2xl'], paddingTop: 80, paddingBottom: 48 },
  header: { marginBottom: Spacing['3xl'] },
  logo: { fontSize: Typography.lg, fontWeight: '800', color: Colors.primary, marginBottom: Spacing.lg },
  title: { fontSize: Typography['3xl'], fontWeight: '800', color: Colors.textPrimary, letterSpacing: -0.5, marginBottom: Spacing.sm },
  subtitle: { fontSize: Typography.base, color: Colors.textSecondary },
  errorBanner: { backgroundColor: '#3b181e', borderColor: '#ef4444', borderWidth: 1, borderRadius: Radius.md, padding: Spacing.base, marginBottom: Spacing.base },
  errorBannerText: { color: '#f87171', fontSize: Typography.sm, fontWeight: '600' },
  form: { gap: Spacing.base, marginBottom: Spacing['2xl'] },
  inputGroup: { gap: Spacing.xs },
  label: { fontSize: Typography.sm, fontWeight: '600', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { backgroundColor: Colors.surfaceElevated, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border, padding: Spacing.base, fontSize: Typography.base, color: Colors.textPrimary },
  primaryBtn: { backgroundColor: Colors.primary, borderRadius: Radius.xl, paddingVertical: 16, alignItems: 'center', marginTop: Spacing.sm },
  primaryBtnDisabled: { opacity: 0.6 },
  primaryBtnText: { fontSize: Typography.md, fontWeight: '700', color: Colors.textPrimary },
  footer: { alignItems: 'center' },
  footerText: { fontSize: Typography.sm, color: Colors.textSecondary },
  footerLink: { color: Colors.primary, fontWeight: '600' },
});
