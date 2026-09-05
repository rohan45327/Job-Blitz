import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Typography, Spacing, Radius } from '../../theme/tokens';
import { useTheme } from '../../theme/ThemeContext';

interface Props {
  title?: string;
  message?: string;
  onRetry?: () => void;
  /** Make the card fill the whole screen (used as a page-level error) */
  fullScreen?: boolean;
}

/**
 * Reusable error state component.
 * Shows a clear error message and an optional retry button.
 * Supports both full-screen and inline card modes.
 */
export function ErrorCard({
  title = 'Something went wrong',
  message = 'We could not load this content. Please check your connection and try again.',
  onRetry,
  fullScreen = false,
}: Props) {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.container,
        fullScreen && styles.fullScreen,
        { backgroundColor: fullScreen ? colors.background : colors.surface },
      ]}
    >
      {/* Icon */}
      <View style={[styles.iconWrap, { backgroundColor: colors.danger + '14', borderColor: colors.danger + '30' }]}>
        <Feather name="alert-circle" size={28} color={colors.danger} />
      </View>

      {/* Title */}
      <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>

      {/* Message */}
      <Text style={[styles.message, { color: colors.textSecondary }]}>{message}</Text>

      {/* Retry button */}
      {onRetry && (
        <TouchableOpacity
          style={[styles.retryBtn, { backgroundColor: colors.primary + '18', borderColor: colors.primary + '40' }]}
          onPress={onRetry}
          activeOpacity={0.8}
        >
          <Feather name="refresh-cw" size={14} color={colors.primary} />
          <Text style={[styles.retryText, { color: colors.primary }]}>Try Again</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: Radius.xl,
    padding: Spacing['2xl'],
    alignItems: 'center',
    gap: Spacing.md,
    marginHorizontal: Spacing.base,
    marginVertical: Spacing.lg,
    borderWidth: 1,
  },
  fullScreen: {
    flex: 1,
    borderWidth: 0,
    borderRadius: 0,
    marginHorizontal: 0,
    marginVertical: 0,
    justifyContent: 'center',
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  title: {
    fontSize: Typography.lg,
    fontWeight: '700',
    textAlign: 'center',
  },
  message: {
    fontSize: Typography.sm,
    textAlign: 'center',
    lineHeight: Typography.sm * 1.6,
    paddingHorizontal: Spacing.md,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    marginTop: Spacing.sm,
  },
  retryText: {
    fontSize: Typography.sm,
    fontWeight: '700',
  },
});
