import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, StyleSheet, View } from 'react-native';

interface ParticleBackgroundProps {
  color1?: string;
  color2?: string;
  color3?: string;
  speed?: number;
  opacity?: number;
}

const { width, height } = Dimensions.get('window');

function AnimatedBlob({
  color,
  size,
  start,
  end,
  duration,
}: {
  color: string;
  size: number;
  start: { x: number; y: number };
  end: { x: number; y: number };
  duration: number;
}) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(progress, {
          toValue: 1,
          duration,
          useNativeDriver: true,
        }),
        Animated.timing(progress, {
          toValue: 0,
          duration,
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();
    return () => animation.stop();
  }, [duration, progress]);

  const translateX = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [start.x, end.x],
  });
  const translateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [start.y, end.y],
  });

  return (
    <Animated.View
      style={[
        styles.blob,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          transform: [{ translateX }, { translateY }],
        },
      ]}
    />
  );
}

export default function ParticleBackground({
  color1 = '#3108ff',
  color2 = '#ffc100',
  color3 = '#fffbfb',
  speed = 0.35,
  opacity = 1,
}: ParticleBackgroundProps) {
  const duration = Math.max(3500, 9000 / Math.max(speed, 0.05));

  return (
    <View pointerEvents="none" style={[styles.container, { opacity }]}>
      <AnimatedBlob
        color={color1}
        size={width * 0.9}
        start={{ x: -width * 0.45, y: height * 0.05 }}
        end={{ x: width * 0.15, y: height * 0.2 }}
        duration={duration}
      />
      <AnimatedBlob
        color={color2}
        size={width * 0.7}
        start={{ x: width * 0.55, y: height * 0.42 }}
        end={{ x: width * 0.1, y: height * 0.58 }}
        duration={duration * 1.2}
      />
      <AnimatedBlob
        color={color3}
        size={width * 0.55}
        start={{ x: width * 0.1, y: height * 0.72 }}
        end={{ x: width * 0.45, y: height * 0.62 }}
        duration={duration * 0.85}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  blob: {
    position: 'absolute',
    opacity: 0.16,
  },
});
