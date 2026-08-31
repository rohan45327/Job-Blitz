import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Dimensions, ScrollView
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParams } from '../../../App';
import { useTheme } from '../../theme/ThemeContext';
import { Typography, Spacing, Radius } from '../../theme/tokens';
import ParticleBackground from '../../components/ParticleBackground';

const { width } = Dimensions.get('window');

type Props = NativeStackScreenProps<RootStackParams, 'Onboarding'>;

type FeatherName = React.ComponentProps<typeof Feather>['name'];
type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

const slides: { icon: string; iconLib: 'Feather' | 'Ionicons'; title: string; subtitle: string }[] = [
  {
    icon: 'zap',
    iconLib: 'Feather',
    title: 'Find Jobs at\nBlitz Speed',
    subtitle: 'JobBlitz monitors 1000s of companies and surfaces only the roles that match your exact profile.',
  },
  {
    icon: 'target',
    iconLib: 'Feather',
    title: 'AI Matching\nEngine',
    subtitle: 'We score every job across 5 dimensions — role, skills, experience, location, and salary.',
  },
  {
    icon: 'edit-2',
    iconLib: 'Feather',
    title: 'Apply Smarter,\nNot Harder',
    subtitle: 'One-tap AI cover letters, profile autofill, and a built-in application tracker.',
  },
];

export function OnboardingScreen({ navigation }: Props) {
  const [activeSlide, setActiveSlide] = React.useState(0);
  const scrollRef = React.useRef<ScrollView>(null);
  const { colors } = useTheme();

  const handleNext = () => {
    if (activeSlide < slides.length - 1) {
      const next = activeSlide + 1;
      scrollRef.current?.scrollTo({ x: next * width, animated: true });
      setActiveSlide(next);
    } else {
      navigation.replace('Login');
    }
  };

  const isLastSlide = activeSlide === slides.length - 1;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ParticleBackground />

      {/* Logo */}
      <View style={styles.header}>
        <View style={styles.logoRow}>
          <Ionicons name="flash" size={20} color={colors.primary} />
          <Text style={[styles.logo, { color: colors.textPrimary }]}>JobBlitz</Text>
        </View>
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
            <View style={[styles.iconContainer, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
              {slide.iconLib === 'Feather' ? (
                <Feather name={slide.icon as FeatherName} size={44} color={colors.primary} />
              ) : (
                <Ionicons name={slide.icon as IoniconName} size={44} color={colors.primary} />
              )}
            </View>
            <Text style={[styles.title, { color: colors.textPrimary }]}>{slide.title}</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{slide.subtitle}</Text>
          </View>
        ))}
      </ScrollView>

      {/* Dots */}
      <View style={styles.dots}>
        {slides.map((_, idx) => (
          <View
            key={idx}
            style={[
              styles.dot,
              { backgroundColor: colors.border },
              activeSlide === idx && [styles.dotActive, { backgroundColor: colors.primary }],
            ]}
          />
        ))}
      </View>

      {/* CTA */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
          onPress={handleNext}
          activeOpacity={0.85}
        >
          <Text style={styles.primaryBtnText}>
            {activeSlide === slides.length - 1 ? 'Get Started' : 'Next'}
          </Text>
          <Feather name="arrow-right" size={16} color="#FFFFFF" />
        </TouchableOpacity>
        {activeSlide === slides.length - 1 && (
          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={[styles.secondaryBtnText, { color: colors.textSecondary }]}>
              Already have an account? Sign in
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: 60, paddingHorizontal: Spacing['2xl'], alignItems: 'center' },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logo: { fontSize: Typography.xl, fontWeight: '800', letterSpacing: -0.5 },
  slider: { flex: 1, marginTop: Spacing.lg },
  slide: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: Spacing['3xl'], paddingBottom: 80,
  },
  iconContainer: {
    width: 110, height: 110, borderRadius: Radius['2xl'],
    alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing['2xl'], borderWidth: 1,
  },
  title: {
    fontSize: Typography['3xl'], fontWeight: '800',
    textAlign: 'center', lineHeight: Typography['3xl'] * 1.25,
    marginBottom: Spacing.base, letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: Typography.base, textAlign: 'center',
    lineHeight: Typography.base * 1.6,
  },
  dots: {
    flexDirection: 'row', justifyContent: 'center',
    gap: Spacing.sm, marginBottom: Spacing['2xl'],
  },
  dot: { width: 6, height: 6, borderRadius: Radius.full },
  dotActive: { width: 24 },
  footer: { paddingHorizontal: Spacing['2xl'], paddingBottom: 48, gap: Spacing.md },
  primaryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, borderRadius: Radius.xl, paddingVertical: 16,
  },
  primaryBtnText: { fontSize: Typography.md, fontWeight: '700', color: '#FFFFFF' },
  secondaryBtn: { alignItems: 'center', paddingVertical: Spacing.sm },
  secondaryBtnText: { fontSize: Typography.sm },
});
