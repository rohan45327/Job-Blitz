import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Dimensions, ScrollView
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParams } from '../../../App';
import { Colors, Typography, Spacing, Radius } from '../../theme/tokens';

const { width, height } = Dimensions.get('window');

type Props = NativeStackScreenProps<RootStackParams, 'Onboarding'>;

const slides = [
  {
    emoji: '⚡',
    title: 'Find Jobs at\nBlitz Speed',
    subtitle: 'JobBlitz monitors 1000s of companies and surfaces only the roles that match your exact profile.',
  },
  {
    emoji: '🎯',
    title: 'AI Matching\nEngine',
    subtitle: 'We score every job across 5 dimensions — role, skills, experience, location, and salary.',
  },
  {
    emoji: '✍️',
    title: 'Apply Smarter,\nNot Harder',
    subtitle: 'One-tap AI cover letters, profile autofill, and a built-in application tracker.',
  },
];

export function OnboardingScreen({ navigation }: Props) {
  const [activeSlide, setActiveSlide] = React.useState(0);
  const scrollRef = React.useRef<ScrollView>(null);

  const handleNext = () => {
    if (activeSlide < slides.length - 1) {
      const next = activeSlide + 1;
      scrollRef.current?.scrollTo({ x: next * width, animated: true });
      setActiveSlide(next);
    } else {
      navigation.replace('Login');
    }
  };

  return (
    <View style={styles.container}>
      {/* Logo */}
      <View style={styles.header}>
        <Text style={styles.logo}>⚡ JobBlitz</Text>
      </View>

      {/* Slides */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEnabled={false}
        style={styles.slider}
      >
        {slides.map((slide, idx) => (
          <View key={idx} style={[styles.slide, { width }]}>
            <View style={styles.emojiContainer}>
              <Text style={styles.emoji}>{slide.emoji}</Text>
            </View>
            <Text style={styles.title}>{slide.title}</Text>
            <Text style={styles.subtitle}>{slide.subtitle}</Text>
          </View>
        ))}
      </ScrollView>

      {/* Dots */}
      <View style={styles.dots}>
        {slides.map((_, idx) => (
          <View
            key={idx}
            style={[styles.dot, activeSlide === idx && styles.dotActive]}
          />
        ))}
      </View>

      {/* CTA */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.primaryBtn} onPress={handleNext} activeOpacity={0.85}>
          <Text style={styles.primaryBtnText}>
            {activeSlide === slides.length - 1 ? 'Get Started' : 'Next'}
          </Text>
        </TouchableOpacity>
        {activeSlide === slides.length - 1 && (
          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.secondaryBtnText}>Already have an account? Sign in</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: Spacing['2xl'],
    alignItems: 'center',
  },
  logo: {
    fontSize: Typography.xl,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: -0.5,
  },
  slider: {
    flex: 1,
    marginTop: Spacing.lg,
  },
  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing['3xl'],
    paddingBottom: 80,
  },
  emojiContainer: {
    width: 120,
    height: 120,
    borderRadius: Radius['2xl'],
    backgroundColor: Colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing['2xl'],
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emoji: {
    fontSize: 52,
  },
  title: {
    fontSize: Typography['3xl'],
    fontWeight: '800',
    color: Colors.textPrimary,
    textAlign: 'center',
    lineHeight: Typography['3xl'] * 1.25,
    marginBottom: Spacing.base,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: Typography.base,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: Typography.base * 1.6,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing['2xl'],
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: Radius.full,
    backgroundColor: Colors.border,
  },
  dotActive: {
    width: 22,
    backgroundColor: Colors.primary,
  },
  footer: {
    paddingHorizontal: Spacing['2xl'],
    paddingBottom: 48,
    gap: Spacing.md,
  },
  primaryBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.xl,
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryBtnText: {
    fontSize: Typography.md,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  secondaryBtn: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  secondaryBtnText: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
  },
});
