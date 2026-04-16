import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  interpolate,
  Extrapolate,
  runOnJS,
} from 'react-native-reanimated';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const PETAL_COUNT = 8;

export default function FreeMode() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [contractionCount, setContractionCount] = useState(0);
  const [intensityAvg, setIntensityAvg] = useState(0);
  const [intensityMax, setIntensityMax] = useState(0);

  const contraction = useSharedValue(0);
  const petalScale = useSharedValue(1);
  const centerPulse = useSharedValue(1);

  const intensities = useRef<number[]>([]);

  // ✅ boucle propre
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      const value =
        Math.sin(Date.now() / 300) * 0.5 +
        0.5 +
        (Math.random() - 0.5) * 0.2;

      contraction.value = value;

      // 👉 stock intensité
      intensities.current.push(value);

      const avg =
        intensities.current.reduce((a, b) => a + b, 0) /
        intensities.current.length;

      setIntensityAvg(avg);
      setIntensityMax((prev) => Math.max(prev, value));

      // 👉 count contraction
      if (value > 0.6) {
        setContractionCount((c) => c + 1);
      }

      // 👉 anim
      petalScale.value = withTiming(value * 1.5 + 0.5, { duration: 200 });
      centerPulse.value = withTiming(value * 0.4 + 1, { duration: 300 });

      setDuration((d) => d + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isPlaying]);

  const togglePlay = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsPlaying((p) => !p);
  };

  const endSession = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    router.push(
      `/session-complete?score=${contractionCount * 10}&duration=${duration}&contractions=${contractionCount}`
    );
  };

  // ✅ styles animés FIXES
  const petalStyles = Array.from({ length: PETAL_COUNT }).map((_, i) => {
    const rot = (i / PETAL_COUNT) * 360;
    return useAnimatedStyle(() => ({
      transform: [
        { rotate: `${rot}deg` },
        { scale: petalScale.value },
      ],
    }));
  });

  const centerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: centerPulse.value }],
  }));

  const intensityText = Math.floor(intensityAvg * 100);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#9B5C6C" />
        </Pressable>
        <Text style={styles.title}>Mode Libre</Text>
        <Pressable onPress={togglePlay}>
          <Ionicons
            name={isPlaying ? 'pause' : 'play'}
            size={28}
            color="#6A1E3A"
          />
        </Pressable>
      </View>

      {/* Flower */}
      <View style={styles.flowerContainer}>
        <View style={styles.flower}>
          {petalStyles.map((style, i) => (
            <Animated.View key={i} style={[styles.petal, style]} />
          ))}
          <Animated.View style={[styles.center, centerStyle]} />
        </View>

        <Text style={styles.intensityText}>
          Intensité: {intensityText}%
        </Text>
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <Stat label="Durée" value={`${Math.floor(duration / 60)}m ${duration % 60}s`} />
        <Stat label="Contractions" value={contractionCount} />
        <Stat label="Moy." value={`${Math.floor(intensityAvg * 100)}%`} />
        <Stat label="Max" value={`${Math.floor(intensityMax * 100)}%`} />
      </View>

      {/* Controls */}
      {!isPlaying ? (
        <Pressable style={styles.startButton} onPress={togglePlay}>
          <Ionicons name="play-circle" size={72} color="#6A1E3A" />
          <Text style={styles.startText}>Démarrer</Text>
        </Pressable>
      ) : (
        <Pressable style={styles.endButton} onPress={endSession}>
          <Text style={styles.endText}>Terminer séance</Text>
        </Pressable>
      )}
    </View>
  );
}

// ✅ composant stat
function Stat({ label, value }: any) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statNumber}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5ECEC' },

  header: {
    flexDirection: 'row',
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  title: { fontSize: 20, fontWeight: '800', color: '#5A1E3A' },

  flowerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  flower: { position: 'relative' },

  petal: {
    position: 'absolute',
    width: 80,
    height: 120,
    backgroundColor: '#D47A92',
    borderRadius: 40,
    top: 90,
    left: (SCREEN_WIDTH - 80) / 2,
  },

  center: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#C75C7A',
    top: 100,
    left: (SCREEN_WIDTH - 100) / 2,
  },

  intensityText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#6A1E3A',
    marginTop: 24,
  },

  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    gap: 12,
  },

  statCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
  },

  statNumber: {
    fontSize: 20,
    fontWeight: '800',
    color: '#6A1E3A',
  },

  statLabel: {
    fontSize: 12,
    color: '#9B5C6C',
  },

  startButton: {
    alignItems: 'center',
    marginBottom: 32,
  },

  startText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#6A1E3A',
  },

  endButton: {
    backgroundColor: '#9B5C6C',
    padding: 20,
    borderRadius: 32,
    alignItems: 'center',
    margin: 24,
  },

  endText: {
    color: 'white',
    fontWeight: '800',
  },
});