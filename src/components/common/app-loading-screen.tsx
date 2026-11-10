import React, { useEffect, useState } from 'react';
import {
  Animated,
  Easing,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Radius, Spacing } from '@/constants/theme';
import { CURRENCY_SYMBOL } from '@/services/currency';

interface AppLoadingScreenProps {
  message?: string;
  isDark?: boolean;
}

export function AppLoadingScreen({
  message = 'Preparing your finances...',
  isDark = false,
}: AppLoadingScreenProps) {
  const [pulseAnim] = useState(() => new Animated.Value(1));
  const [ringScaleAnim] = useState(() => new Animated.Value(1));
  const [ringOpacityAnim] = useState(() => new Animated.Value(0.4));
  const [progressAnim] = useState(() => new Animated.Value(0));

  useEffect(() => {
    // Pulse animation for the central icon
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.08,
          duration: 1100,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1100,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    // Glowing ring animation
    const ringLoop = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(ringScaleAnim, {
            toValue: 1.35,
            duration: 1600,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(ringScaleAnim, {
            toValue: 1,
            duration: 0,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(ringOpacityAnim, {
            toValue: 0,
            duration: 1600,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(ringOpacityAnim, {
            toValue: 0.5,
            duration: 0,
            useNativeDriver: true,
          }),
        ]),
      ])
    );

    // Infinite progress bar animation
    const progressLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(progressAnim, {
          toValue: 1,
          duration: 1400,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(progressAnim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    );

    pulseLoop.start();
    ringLoop.start();
    progressLoop.start();

    return () => {
      pulseLoop.stop();
      ringLoop.stop();
      progressLoop.stop();
    };
  }, [pulseAnim, ringScaleAnim, ringOpacityAnim, progressAnim]);

  const bgColor = isDark ? '#121214' : '#F8FAF9';
  const textColor = isDark ? '#FFFFFF' : '#172B4D';
  const subtextColor = isDark ? '#A5ADBA' : '#5E6C84';
  const barBg = isDark ? '#26282D' : '#E2E8F0';

  const translateX = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-120, 120],
  });

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      {/* Central Animated Emblem */}
      <View style={styles.emblemWrapper}>
        {/* Animated Expanding Glow Ring */}
        <Animated.View
          style={[
            styles.glowRing,
            {
              transform: [{ scale: ringScaleAnim }],
              opacity: ringOpacityAnim,
            },
          ]}
        />

        {/* Pulsing Core Badge */}
        <Animated.View
          style={[
            styles.coreBadge,
            {
              transform: [{ scale: pulseAnim }],
            },
          ]}>
          <Text style={styles.currencySymbol}>{CURRENCY_SYMBOL}</Text>
        </Animated.View>
      </View>

      {/* Brand Header */}
      <View style={styles.textContainer}>
        <Text style={[styles.title, { color: textColor }]}>Rupee Tracker</Text>
        <Text style={[styles.subtitle, { color: subtextColor }]}>
          Smart Offline Expense Manager
        </Text>
      </View>

      {/* Modern Indeterminate Progress Bar */}
      <View style={[styles.progressTrack, { backgroundColor: barBg }]}>
        <Animated.View
          style={[
            styles.progressIndicator,
            {
              transform: [{ translateX }],
            },
          ]}
        />
      </View>

      <Text style={[styles.statusText, { color: subtextColor }]}>
        {message}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
  },
  emblemWrapper: {
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.four,
  },
  glowRing: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: Radius.full,
    backgroundColor: '#00875A',
  },
  coreBadge: {
    width: 84,
    height: 84,
    borderRadius: 24,
    backgroundColor: '#00875A',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#00875A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  currencySymbol: {
    fontSize: 44,
    fontWeight: '900',
    color: '#FFFFFF',
    includeFontPadding: false,
  },
  textContainer: {
    alignItems: 'center',
    gap: 6,
    marginBottom: Spacing.four,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  progressTrack: {
    width: 140,
    height: 4,
    borderRadius: Radius.full,
    overflow: 'hidden',
    marginTop: Spacing.two,
  },
  progressIndicator: {
    width: 60,
    height: '100%',
    backgroundColor: '#00875A',
    borderRadius: Radius.full,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: Spacing.three,
  },
});
