import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, Alert, ActivityIndicator
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParams } from '../../../App';
import { useAuthStore } from '../../store/authStore';
import { Colors, Typography, Spacing, Radius } from '../../theme/tokens';

type Props = NativeStackScreenProps<RootStackParams, 'Login'>;

export function LoginScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login } = useAuthStore();

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      setError('Please fill in all fields.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await login(email.trim().toLowerCase(), password);
    } catch (e: any) {
      console.error('Login error:', e);
      const msg = e.message || 'Please check your credentials.';
      setError(msg);
      if (Platform.OS !== 'web') {
        Alert.alert('Login Failed', msg);
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
      <View style={styles.inner}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>⚡ JobBlitz</Text>
          <Text style={styles.title}>Welcome back</Text>
          <Text style={styles.subtitle}>Sign in to continue your job search</Text>
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
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={(txt) => { setEmail(txt); setError(null); }}
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
              onChangeText={(txt) => { setPassword(txt); setError(null); }}
              placeholder="••••••••"
              placeholderTextColor={Colors.textMuted}
              secureTextEntry
            />
          </View>

          <TouchableOpacity
            style={[styles.primaryBtn, loading && styles.primaryBtnDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color={Colors.textPrimary} />
            ) : (
              <Text style={styles.primaryBtnText}>Sign In</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <TouchableOpacity
          onPress={() => navigation.navigate('Register')}
          style={styles.footer}
        >
          <Text style={styles.footerText}>
            Don't have an account?{' '}
            <Text style={styles.footerLink}>Create one</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  inner: {
    flex: 1,
    paddingHorizontal: Spacing['2xl'],
    justifyContent: 'center',
  },
  header: {
    marginBottom: Spacing['3xl'],
  },
  logo: {
    fontSize: Typography.lg,
    fontWeight: '800',
    color: Colors.primary,
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: Typography['3xl'],
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -0.5,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: Typography.base,
    color: Colors.textSecondary,
  },
  errorBanner: {
    backgroundColor: '#3b181e',
    borderColor: '#ef4444',
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.base,
    marginBottom: Spacing.base,
  },
  errorBannerText: {
    color: '#f87171',
    fontSize: Typography.sm,
    fontWeight: '600',
  },
  form: {
    gap: Spacing.base,
    marginBottom: Spacing['2xl'],
  },
  inputGroup: {
    gap: Spacing.xs,
  },
  label: {
    fontSize: Typography.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.base,
    fontSize: Typography.base,
    color: Colors.textPrimary,
  },
  primaryBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.xl,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  primaryBtnDisabled: {
    opacity: 0.6,
  },
  primaryBtnText: {
    fontSize: Typography.md,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
  },
  footerLink: {
    color: Colors.primary,
    fontWeight: '600',
  },
});
