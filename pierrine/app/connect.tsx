import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';

import * as Haptics from 'expo-haptics';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const STATES = {
  idle: {
    icon: 'bluetooth-outline',
    color: '#6A1E3A',
    text1: 'Connectez votre sonde',
    text2: 'Activez le Bluetooth et placez votre sonde à proximité',
  },
  connecting: {
    icon: 'hourglass-outline',
    color: '#C75C7A',
    text1: 'Connexion en cours',
    text2: 'Veuillez patienter...',
  },
  connected: {
    icon: 'checkmark-circle',
    color: '#8B1E3F',
    text1: 'Connectée !',
    text2: 'Votre sonde est prête',
  },
} as const;

// Supprimé : hardcoded mocks
// TODO: récupérer depuis device connecté

export default function ConnectScreen() {
  const [state, setState] = useState<'idle' | 'connecting' | 'connected'>('idle');

  // Pulsing circles
  const pulse1 = useSharedValue(1);
  const pulse2 = useSharedValue(0.8);
  const pulse3 = useSharedValue(1.2);

  const loaderRotation = useSharedValue(0);
  const batteryOpacity = useSharedValue(0);
  const batteryY = useSharedValue(50);

  useEffect(() => {
    pulse1.value = withRepeat(
      withTiming(1.3, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
    pulse2.value = withRepeat(
      withTiming(1.1, { duration: 2500, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
    pulse3.value = withRepeat(
      withTiming(1.4, { duration: 1800, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );

    loaderRotation.value = withRepeat(
      withTiming(360, { duration: 1000 }),
      -1,
      false
    );
  }, []);

// Supprimé : simulation setTimeout
  // TODO: Implémenter BleManager.scanDevices() real async

  useEffect(() => {
    if (state === 'connected') {
      batteryOpacity.value = withTiming(1, { duration: 500 });
      batteryY.value = withTiming(0, { duration: 500 });
    }
  }, [state]);

  const handleConnect = async () => {
    console.log('🔄 Début connexion Bluetooth...');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setState('connecting');
    
    // ✅ Restore mock connect simulation (2s)
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setState('connected');
    console.log('✅ Mock Bluetooth connecté');
  };

  const handleContinue = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    router.replace('/questionnaire');
  };

  const pulseStyle1 = useAnimatedStyle(() => ({
    transform: [{ scale: pulse1.value }],
    opacity: interpolate(pulse1.value, [1, 1.3], [0.3, 0.6], Extrapolate.CLAMP),
  }));

  const pulseStyle2 = useAnimatedStyle(() => ({
    transform: [{ scale: pulse2.value }],
    opacity: interpolate(pulse2.value, [0.8, 1.1], [0.2, 0.5], Extrapolate.CLAMP),
  }));

  const pulseStyle3 = useAnimatedStyle(() => ({
    transform: [{ scale: pulse3.value }],
    opacity: interpolate(pulse3.value, [1, 1.4], [0.4, 0.7], Extrapolate.CLAMP),
  }));

  const loaderStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${loaderRotation.value}deg` }],
  }));

  const batteryStyle = useAnimatedStyle(() => ({
    opacity: batteryOpacity.value,
    transform: [{ translateY: batteryY.value }],
  }));

  const current = STATES[state];

  return (
    <View style={styles.container}>
      {/* Back */}
      <Pressable onPress={() => router.back()} style={styles.backButton}>
        <Text style={styles.backText}>← Retour</Text>
      </Pressable>

      {/* Pulsing backgrounds - décoratifs */}
      <Animated.View pointerEvents="none" style={[styles.pulseCircle1, pulseStyle1]} />
      <Animated.View pointerEvents="none" style={[styles.pulseCircle2, pulseStyle2]} />
      <Animated.View pointerEvents="none" style={[styles.pulseCircle3, pulseStyle3]} />

      {/* Main content */}
      <View style={styles.main}>
        <View style={styles.iconContainer}>
          <View style={[styles.iconBg, { backgroundColor: current.color }]}>
            <Ionicons
              name={current.icon as any}
              size={80}
              color="white"
              style={state === 'connecting' ? loaderStyle : undefined}
            />
          </View>
        </View>

        <Text style={styles.title}>{current.text1}</Text>
        <Text style={styles.subtitle}>{current.text2}</Text>

        {/* Battery Card - caché jusqu'à connexion réelle */}
        {state === 'connected' && (
          <Animated.View pointerEvents="none" style={[styles.batteryCard, batteryStyle]}>
            <Text style={styles.batteryTitle}>Sonde Périnea</Text>
            <Text style={styles.batteryText}>Connectée - Données en temps réel</Text>
            <Text style={styles.batterySubtitle}>Battery & signal via Bluetooth</Text>
          </Animated.View>
        )}

        {/* Button */}
        <Pressable
          pointerEvents={state === 'connecting' ? 'none' : 'auto'}
          onPress={state === 'connected' ? handleContinue : handleConnect}
          style={styles.buttonPressable}
          disabled={state === 'connecting'}
        >
          <LinearGradient
            colors={['#C75C7A', '#8B1E3F']}
            style={[styles.button, state === 'connecting' && styles.buttonDisabled]}
          >
            <Text style={styles.buttonText}>
              {state === 'connected' ? 'Continuer' : 'Connexion automatique'}
            </Text>
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5ECEC',
    position: 'relative',
    overflow: 'hidden',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 24,
    zIndex: 10,
  },
  backText: {
    color: '#9B6A75',
    fontSize: 16,
    fontWeight: '600',
  },
  pulseCircle1: {
    position: 'absolute',
    top: 200,
    left: 50,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(212, 122, 146, 0.2)',
  },
  pulseCircle2: {
    position: 'absolute',
    bottom: 300,
    right: 60,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(199, 92, 122, 0.15)',
  },
  pulseCircle3: {
    position: 'absolute',
    top: 400,
    right: 80,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(139, 30, 63, 0.1)',
  },
  main: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  iconContainer: {
    marginBottom: 32,
  },
  iconBg: {
    width: 140,
    height: 140,
    borderRadius: 70,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#5A1A30',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#8A5A65',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  batteryCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    padding: 24,
    borderRadius: 24,
    alignItems: 'center',
    marginBottom: 32,
    minHeight: 120,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  batteryTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#5A1A30',
    marginBottom: 16,
  },
  batteryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  batteryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#5A1A30',
    marginBottom: 8,
  },
  batterySubtitle: {
    fontSize: 14,
    color: '#8A5A65',
    textAlign: 'center',
  },
  button: {
    borderRadius: 40,
    paddingVertical: 20,
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
    shadowColor: '#C75C7A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
  },
  buttonPressable: {
    width: '100%',
    maxWidth: 320,
  },
  button: {
    borderRadius: 40,
    paddingVertical: 20,
    flex: 1,
    alignItems: 'center',
    shadowColor: '#C75C7A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: 'white',
    fontWeight: '800',
    fontSize: 18,
  },
});

