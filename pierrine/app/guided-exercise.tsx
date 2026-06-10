import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';

const CIRCLE_SIZE = 280;

const PHASES = [
  { name: 'Respirez', duration: 5, scale: 1.0 },
  { name: 'Contractez', duration: 3, scale: 0.8 },
  { name: 'Maintenez', duration: 5, scale: 0.7 },
  { name: 'Relâchez', duration: 3, scale: 1.1 },
  { name: 'Reposez', duration: 10, scale: 0.9 },
];

export default function GuidedExercise() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [currentPhase, setCurrentPhase] = useState(0);
  const [cycles, setCycles] = useState(0);
  const [timeLeft, setTimeLeft] = useState(PHASES[0].duration);

  const progress = useSharedValue(0);
  const circleScale = useSharedValue(1);
  const countdownSweep = useSharedValue(0);

  useEffect(() => {
    if (isPlaying) {
      const interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            const nextPhase = (currentPhase + 1) % PHASES.length;
            const nextCycle = nextPhase === 0 ? cycles + 1 : cycles;
            setCurrentPhase(nextPhase);
            setCycles(nextCycle);
            if (nextCycle >= 5) {
              setIsPlaying(false);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              return 0;
            }
            return PHASES[nextPhase].duration;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isPlaying, currentPhase, cycles]);

  useEffect(() => {
    circleScale.value = withTiming(PHASES[currentPhase].scale, { duration: 500 });
    countdownSweep.value = withTiming(1, { duration: 500 });
  }, [circleScale, countdownSweep, currentPhase]);

  const togglePlay = () => {
    Haptics.selectionAsync();
    setIsPlaying(!isPlaying);
    if (!isPlaying) {
      progress.value = 0;
    }
  };

  const toggleSound = () => {
    setSoundEnabled(!soundEnabled);
    Haptics.selectionAsync();
  };

  const circleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: circleScale.value }],
  }));

  const countdownStyle = useAnimatedStyle(() => ({
    transform: [
      {
        rotate: `${interpolate(countdownSweep.value, [0, 1], [0, 6.28], Extrapolate.CLAMP)}rad`,
      },
    ],
  }));

  if (cycles >= 5 && !isPlaying) {
    return (
      <View style={styles.overlay}>
        <Pressable style={styles.completeCard} onPress={() => router.push('/session-complete')}>
          <Ionicons name="checkmark-circle" size={80} color="#6A1E3A" />
          <Text style={styles.completeTitle}>Séance terminée !</Text>
          <Text style={styles.completeSubtitle}>Voir les résultats</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#9B5C6C" />
        </Pressable>
        <Text style={styles.title}>Exercice guidé</Text>
        <Pressable onPress={toggleSound}>
          <Ionicons name={soundEnabled ? 'volume-high' : 'volume-mute'} size={24} color="#9B5C6C" />
        </Pressable>
      </View>

      {/* Progress Cycle */}
      <View style={styles.progressContainer}>
        <Text style={styles.cyclesText}>Cycle {cycles + 1}/5</Text>
        <Animated.View style={[styles.circleContainer, circleStyle]}>
          <View style={styles.circleBg} />
          <Animated.View style={[styles.countdownRing, countdownStyle]} />
          <Text style={styles.phaseText}>{PHASES[currentPhase].name}</Text>
          <Text style={styles.timerText}>{timeLeft}s</Text>
        </Animated.View>
      </View>

      {/* Controls */}
      <Pressable style={styles.playButton} onPress={togglePlay}>
        <Ionicons name={isPlaying ? 'pause' : 'play'} size={64} color="white" />
      </Pressable>

      <Text style={styles.instruction}>
        {isPlaying ? PHASES[currentPhase].name : 'Appuyez pour démarrer'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5ECEC',
  },
  header: {
    flexDirection: 'row',
    paddingTop: 60,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#5A1A30',
  },
  progressContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cyclesText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#6A1E3A',
    marginBottom: 24,
  },
  circleContainer: {
    position: 'relative',
  },
  circleBg: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    backgroundColor: 'rgba(106, 30, 58, 0.1)',
    borderWidth: 4,
    borderColor: 'rgba(106, 30, 58, 0.3)',
  },
  countdownRing: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: CIRCLE_SIZE - 16,
    height: CIRCLE_SIZE - 16,
    borderRadius: (CIRCLE_SIZE - 16) / 2,
    borderWidth: 4,
    borderColor: '#C75C7A',
  },
  phaseText: {
    position: 'absolute',
    top: '35%',
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '800',
    color: '#6A1E3A',
  },
  timerText: {
    position: 'absolute',
    bottom: '25%',
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: 48,
    fontWeight: '800',
    color: '#8B1E3F',
  },
  playButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#6A1E3A',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  instruction: {
    fontSize: 18,
    textAlign: 'center',
    color: '#9B5C6C',
    fontWeight: '600',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  completeCard: {
    backgroundColor: 'white',
    padding: 48,
    borderRadius: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.4,
    shadowRadius: 32,
    elevation: 30,
  },
  completeTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#6A1E3A',
    marginTop: 16,
    marginBottom: 8,
  },
  completeSubtitle: {
    fontSize: 18,
    color: '#9B5C6C',
  },
});

