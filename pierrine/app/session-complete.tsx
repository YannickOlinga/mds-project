import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
  Alert,
  Share,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface Props {
  score?: number;
  duration?: number;
  contractions?: number;
}

export default function SessionComplete({
  score = 125,
  duration = 185,
  contractions = 47,
}: Props) {

  // ✅ logique stable
  const xp = Math.floor(score / 10);
  const currentLevel = Math.floor(xp / 100) + 1;
  const progress = (xp % 100) / 100;

  const [levelUp, setLevelUp] = useState(false);

  // ✅ animations
  const trophyScale = useSharedValue(0);
  const shineOffset = useSharedValue(-SCREEN_WIDTH);

  const confettiY = useSharedValue(-50);
  const confettiOpacity = useSharedValue(1);

  useEffect(() => {
    if (xp >= 100) {
      setLevelUp(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    trophyScale.value = withSpring(1, { damping: 8 });

    shineOffset.value = withTiming(SCREEN_WIDTH, { duration: 2000 });

    confettiY.value = withTiming(SCREEN_HEIGHT, { duration: 2500 });
    confettiOpacity.value = withTiming(0, { duration: 2500 });

  }, []);

  const trophyStyle = useAnimatedStyle(() => ({
    transform: [{ scale: trophyScale.value }],
  }));

  const shineStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shineOffset.value }],
  }));

  const confettiStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: confettiY.value }],
    opacity: confettiOpacity.value,
  }));

  const shareScore = async () => {
    try {
      await Haptics.selectionAsync();
      await Share.share({
        title: 'Ma session Périnea',
        message: `Score: ${score} • XP: ${xp} • Niveau ${currentLevel}`,
      });
    } catch {
      Alert.alert('Erreur', 'Impossible de partager');
    }
  };

  return (
    <View style={styles.container}>

      {/* 🎉 Confetti */}
      {Array(30).fill(0).map((_, i) => (
        <Animated.View
          key={i}
          style={[
            styles.confettiParticle,
            confettiStyle,
            { left: Math.random() * SCREEN_WIDTH },
          ]}
        />
      ))}

      {/* Main */}
      <View style={styles.main}>

        {/* Trophy */}
        <View style={styles.trophyContainer}>
          <Animated.View style={trophyStyle}>
            <LinearGradient
              colors={['#FFD700', '#FFA500']}
              style={styles.trophyBg}
            >
              <Ionicons name="trophy" size={120} color="#6A1E3A" />
              <Animated.View style={[styles.shine, shineStyle]} />
            </LinearGradient>
          </Animated.View>
        </View>

        <Text style={styles.title}>Séance terminée !</Text>

        {levelUp && (
          <View style={styles.levelUpCard}>
            <Ionicons name="sparkles" size={24} color="#FFC107" />
            <Text style={styles.levelUpTitle}>
              Niveau {currentLevel} débloqué !
            </Text>
          </View>
        )}

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{score}</Text>
            <Text style={styles.statLabel}>Score</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>
              {Math.floor(duration / 60)}:
              {(duration % 60).toString().padStart(2, '0')}
            </Text>
            <Text style={styles.statLabel}>Durée</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{contractions}</Text>
            <Text style={styles.statLabel}>Contractions</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>+{xp}</Text>
            <Text style={styles.statLabel}>XP</Text>
          </View>
        </View>

        {/* Progress */}
        <View style={styles.levelContainer}>
          <Text style={styles.levelText}>Niveau {currentLevel}</Text>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${progress * 100}%` },
              ]}
            />
          </View>
          <Text style={styles.levelXp}>{xp % 100}/100 XP</Text>
        </View>

        {/* Buttons */}
        <View style={styles.buttonsContainer}>
          <Pressable style={styles.shareButton} onPress={shareScore}>
            <Ionicons name="share-outline" size={24} color="#6A1E3A" />
            <Text style={styles.shareText}>Partager</Text>
          </Pressable>

          <Pressable
            style={styles.backButton}
            onPress={() => router.replace('/(tabs)')}
          >
            <Ionicons name="home" size={24} color="white" />
            <Text style={styles.backText}>Accueil</Text>
          </Pressable>
        </View>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9EDEE',
  },
  main: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  trophyContainer: {
    marginBottom: 32,
  },
  trophyBg: {
    width: 160,
    height: 160,
    borderRadius: 80,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FFD700',
    shadowOpacity: 0.6,
    shadowRadius: 30,
    elevation: 25,
  },
  shine: {
    position: 'absolute',
    top: 20,
    left: 20,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#6A1E3A',
    marginBottom: 24,
  },
  levelUpCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3CD',
    padding: 16,
    borderRadius: 20,
    marginBottom: 24,
    gap: 12,
  },
  levelUpTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#6A1E3A',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 40,
  },
  statCard: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 32,
    fontWeight: '800',
    color: '#6A1E3A',
  },
  statLabel: {
    fontSize: 14,
    color: '#9B5C6C',
  },
  levelContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  levelText: {
    fontSize: 18,
    fontWeight: '700',
  },
  progressBar: {
    width: 280,
    height: 10,
    backgroundColor: '#EDE7E8',
    borderRadius: 5,
    marginVertical: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#6A1E3A',
  },
  levelXp: {
    fontSize: 14,
    color: '#9B5C6C',
  },
  buttonsContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  shareButton: {
    flexDirection: 'row',
    gap: 10,
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 20,
  },
  shareText: {
    fontWeight: '700',
    color: '#6A1E3A',
  },
  backButton: {
    flexDirection: 'row',
    gap: 10,
    padding: 16,
    backgroundColor: '#6A1E3A',
    borderRadius: 20,
  },
  backText: {
    fontWeight: '700',
    color: 'white',
  },
  confettiParticle: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FFD700',
  },
});