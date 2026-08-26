import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { Colors, Typography, Spacing, Radius } from '../../theme/tokens';
import { useTheme } from '../../theme/ThemeContext';

interface Props {
  message?: string;
}

const SCAN_STEPS = [
  'Initializing AI matching engine...',
  'Scanning Greenhouse, Lever & Ashby ATS...',
  'Scraping top MNC & Fintech career boards...',
  'Filtering FAANG & Indian tech giant postings...',
  'Calculating 75%+ high match relevance...',
  'Finalizing personalized job feed...',
];

export function ThunderLoader({ message }: Props) {
  const { colors } = useTheme();
  const [progress, setProgress] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);

  const fillAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    // 1. Percentage counter simulation (0 -> 100%)
    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += Math.floor(Math.random() * 8) + 4;
      if (currentProgress >= 100) {
        currentProgress = 100;
        clearInterval(interval);
      }
      setProgress(currentProgress);

      const nextStep = Math.min(
        Math.floor((currentProgress / 100) * SCAN_STEPS.length),
        SCAN_STEPS.length - 1
      );
      setStepIndex(nextStep);
    }, 150);

    // 2. Vertical fill animation for thunder
    Animated.timing(fillAnim, {
      toValue: 1,
      duration: 2500,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false,
    }).start();

    // 3. Pulsing scale & glow effect (all JS driven to prevent driver conflict crash)
    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(pulseAnim, {
            toValue: 1.12,
            duration: 700,
            easing: Easing.ease,
            useNativeDriver: false,
          }),
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 700,
            useNativeDriver: false,
          }),
        ]),
        Animated.parallel([
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 700,
            easing: Easing.ease,
            useNativeDriver: false,
          }),
          Animated.timing(glowAnim, {
            toValue: 0.4,
            duration: 700,
            useNativeDriver: false,
          }),
        ]),
      ])
    ).start();

    return () => clearInterval(interval);
  }, []);

  const fillHeight = fillAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.container}>
      {/* Outer Glow Circle */}
      <Animated.View
        style={[
          styles.glowCircle,
          {
            transform: [{ scale: pulseAnim }],
            borderColor: colors.primary,
            shadowColor: colors.primary,
            opacity: glowAnim,
          },
        ]}
      >
        {/* Thunder Mask Container */}
        <View style={styles.thunderWrapper}>
          {/* Base Dim Thunder Icon */}
          <Text style={[styles.thunderBase, { color: colors.border }]}>⚡</Text>

          {/* Filling Colored Layer */}
          <Animated.View style={[styles.fillContainer, { height: fillHeight }]}>
            <Text style={[styles.thunderActive, { color: '#6366F1' }]}>⚡</Text>
          </Animated.View>
        </View>
      </Animated.View>

      {/* Percentage Display */}
      <View style={styles.progressBox}>
        <Text style={[styles.percentText, { color: colors.textPrimary }]}>
          {progress}%
        </Text>
        <Text style={[styles.scanningLabel, { color: colors.primary }]}>
          SCANNING
        </Text>
      </View>

      {/* Dynamic Status Text */}
      <Text style={[styles.statusText, { color: colors.textSecondary }]}>
        {message || SCAN_STEPS[stepIndex]}
      </Text>

      {/* Mini Progress Bar */}
      <View style={[styles.progressBarTrack, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
        <View
          style={[
            styles.progressBarFill,
            { width: `${progress}%`, backgroundColor: colors.primary },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing['2xl'],
    gap: Spacing.lg,
  },
  glowCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6366F115',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 8,
  },
  thunderWrapper: {
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  thunderBase: {
    fontSize: 52,
    position: 'absolute',
  },
  fillContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  thunderActive: {
    fontSize: 52,
    textShadowColor: '#6366F1',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  progressBox: {
    alignItems: 'center',
    gap: 2,
  },
  percentText: {
    fontSize: 36,
    fontWeight: '900',
    letterSpacing: -1,
  },
  scanningLabel: {
    fontSize: Typography.xs,
    fontWeight: '800',
    letterSpacing: 2,
  },
  statusText: {
    fontSize: Typography.sm,
    fontWeight: '500',
    textAlign: 'center',
    minHeight: 22,
  },
  progressBarTrack: {
    width: 200,
    height: 6,
    borderRadius: 3,
    borderWidth: 1,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
});
