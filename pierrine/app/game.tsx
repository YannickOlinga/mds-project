import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
} from 'react-native';
import { PanGestureHandler } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useFrameCallback,
  useAnimatedGestureHandler,
  runOnJS,
  withTiming,
  withRepeat,
  interpolate,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import Ionicons from '@expo/vector-icons/Ionicons';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const GAME_HEIGHT = SCREEN_HEIGHT * 0.8;
const BIRD_SIZE = 40;
const OBSTACLE_WIDTH = 60;
const OBSTACLE_GAP = 200;
const OBSTACLE_SPEED = 200;
const COLLECT_SIZE = 30;

type GameState = 'playing' | 'paused' | 'finished';

export default function FlappyBirdGame() {
  const [state, setState] = useState<GameState>('playing');
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [timer, setTimer] = useState(0);
  const [, forceRender] = useState(0);

  const contractionLevel = useSharedValue(0.5);
  const birdY = useSharedValue(GAME_HEIGHT / 2);
  const velocity = useSharedValue(0);

  const obstacles = useRef<any[]>([]);
  const collectibles = useRef<any[]>([]);
  const lastSpawn = useRef(0);

  const isPaused = useSharedValue(false);

  // 🎯 Gesture
  const gestureHandler = useAnimatedGestureHandler({
    onActive: (event) => {
      const value = Math.max(0, Math.min(1, event.translationY / 200 + 0.5));
      contractionLevel.value = value;
      velocity.value = -12 * value;
    },
  });

  // 🔥 Game Loop
  useFrameCallback((frame) => {
    if (isPaused.value || state !== 'playing') return;

    const dt = (frame.timeSincePreviousFrame ?? 16) / 1000;

    velocity.value += 600 * dt;
    birdY.value += velocity.value;

    if (birdY.value > GAME_HEIGHT || birdY.value < 0) {
      runOnJS(handleLoseLife)();
      return;
    }

    if (frame.timestamp - lastSpawn.current > 2000) {
      obstacles.current.push({
        id: Date.now(),
        x: SCREEN_WIDTH,
        gapY: Math.random() * (GAME_HEIGHT - OBSTACLE_GAP),
        passed: false,
      });

      collectibles.current.push({
        id: Date.now() + 1,
        x: SCREEN_WIDTH,
        y: Math.random() * GAME_HEIGHT,
        collected: false,
      });

      lastSpawn.current = frame.timestamp;
    }

    obstacles.current.forEach((obs) => {
      obs.x -= OBSTACLE_SPEED * dt;

      const birdX = 100;

      if (
        birdX + BIRD_SIZE > obs.x &&
        birdX < obs.x + OBSTACLE_WIDTH &&
        (birdY.value < obs.gapY || birdY.value > obs.gapY + OBSTACLE_GAP)
      ) {
        runOnJS(handleLoseLife)();
      }

      if (!obs.passed && obs.x < birdX) {
        obs.passed = true;
        runOnJS(addScore)();
      }
    });

    collectibles.current.forEach((c) => {
      c.x -= OBSTACLE_SPEED * 1.2 * dt;

      const dx = c.x - 100;
      const dy = c.y - birdY.value;

      if (!c.collected && Math.sqrt(dx * dx + dy * dy) < 40) {
        c.collected = true;
        runOnJS(addScore)();
      }
    });

    runOnJS(updateTimer)(dt);
    runOnJS(forceRenderTick)();
  });

  const forceRenderTick = () => {
    forceRender((x) => x + 1);
  };

  const updateTimer = (dt: number) => {
    setTimer((t) => t + dt);
  };

  const handleLoseLife = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    setLives((l) => {
      if (l <= 1) {
        setState('finished');
        return 0;
      }
      return l - 1;
    });
  };

  const addScore = () => {
    setScore((s) => s + 1);
    Haptics.selectionAsync();
  };

  const togglePause = () => {
    isPaused.value = !isPaused.value;
    setState(isPaused.value ? 'paused' : 'playing');
  };

  const resetGame = () => {
    setScore(0);
    setLives(3);
    setTimer(0);
    setState('playing');
    obstacles.current = [];
    collectibles.current = [];
  };

  // 🐦 Bird
  const birdStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: birdY.value }],
  }));

  // 🪽 Wings
  const wingAnim = useSharedValue(0);

  useEffect(() => {
    wingAnim.value = withRepeat(withTiming(1, { duration: 200 }), -1, true);
  }, []);

  const wingStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${interpolate(wingAnim.value, [0, 1], [-15, 15])}deg` }],
  }));

  // 🎚 Slider
  const sliderStyle = useAnimatedStyle(() => ({
    height: `${contractionLevel.value * 100}%`,
  }));

  // 🛑 Game Over
  if (state === 'finished') {
    return (
      <View style={styles.overlay}>
        <Text style={styles.gameOverTitle}>Game Over</Text>
        <Text style={styles.scoreText}>Score: {score}</Text>
        <Text style={styles.timerText}>{Math.floor(timer)}s</Text>

        <Pressable style={styles.retryButton} onPress={resetGame}>
          <Text style={styles.retryText}>Rejouer</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* HUD */}
      <View style={styles.hud}>
        <Text style={styles.scoreText}>Score: {score}</Text>
        <Text style={styles.livesText}>❤️ {lives}</Text>
        <Text style={styles.timerText}>{Math.floor(timer)}s</Text>
      </View>

      {/* GAME */}
      <View style={styles.gameArea}>
        <Animated.View style={[styles.bird, birdStyle]}>
          <View style={styles.birdBody} />
          <Animated.View style={[styles.wing, wingStyle]} />
        </Animated.View>

        {obstacles.current.map((obs) => (
          <View key={obs.id}>
            <View style={[styles.obstacle, { height: obs.gapY, left: obs.x }]} />
            <View
              style={[
                styles.obstacle,
                {
                  height: GAME_HEIGHT - obs.gapY - OBSTACLE_GAP,
                  bottom: 0,
                  left: obs.x,
                },
              ]}
            />
          </View>
        ))}

        {collectibles.current.map((c) =>
          !c.collected ? (
            <View key={c.id} style={[styles.collectible, { left: c.x, top: c.y }]} />
          ) : null
        )}
      </View>

      {/* Slider */}
      <PanGestureHandler onGestureEvent={gestureHandler}>
        <Animated.View style={styles.slider}>
          <Animated.View style={[styles.sliderFill, sliderStyle]} />
        </Animated.View>
      </PanGestureHandler>

      {/* Pause */}
      <Pressable style={styles.pauseButton} onPress={togglePause}>
        <Ionicons name="pause" size={28} color="#6A1E3A" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#87CEEB' },

  hud: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 10,
  },

  scoreText: { fontSize: 20, color: 'white' },
  livesText: { fontSize: 20, color: 'white' },
  timerText: { fontSize: 20, color: 'white' },

  gameArea: { flex: 1, marginTop: 100 },

  bird: {
    position: 'absolute',
    left: 100,
    width: BIRD_SIZE,
    height: BIRD_SIZE,
  },

  birdBody: {
    flex: 1,
    backgroundColor: '#FFD700',
    borderRadius: BIRD_SIZE / 2,
  },

  wing: {
    position: 'absolute',
    width: 20,
    height: 10,
    backgroundColor: '#FFA500',
    top: 10,
    right: -5,
  },

  obstacle: {
    position: 'absolute',
    width: OBSTACLE_WIDTH,
    backgroundColor: '#228B22',
  },

  collectible: {
    position: 'absolute',
    width: COLLECT_SIZE,
    height: COLLECT_SIZE,
    borderRadius: COLLECT_SIZE / 2,
    backgroundColor: '#FFD700',
  },

  slider: {
    position: 'absolute',
    bottom: 100,
    left: 30,
    right: 30,
    height: 60,
    backgroundColor: '#eee',
    borderRadius: 30,
    overflow: 'hidden',
  },

  sliderFill: {
    backgroundColor: '#6A1E3A',
    width: '100%',
  },

  pauseButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 20,
  },

  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  gameOverTitle: {
    fontSize: 32,
    fontWeight: '800',
  },

  retryButton: {
    marginTop: 20,
    backgroundColor: '#6A1E3A',
    padding: 20,
    borderRadius: 20,
  },

  retryText: {
    color: 'white',
  },
});