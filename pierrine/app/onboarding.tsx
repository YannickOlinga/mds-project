import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
} from 'react-native';
import { router } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedRef,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  interpolate,
  Extrapolate,
  runOnJS,
  useAnimatedReaction,
} from 'react-native-reanimated';

import * as Haptics from 'expo-haptics';
import BrandLogo from '../components/ui/BrandLogo';
import OnboardingSlide from '../components/ui/OnboardingSlide';
import PaginationDots from '../components/ui/PaginationDots';
import AnimatedButton from '../components/ui/AnimatedButton';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const SLIDES = [
  {
    title: 'Construisez un suivi fiable',
    description: 'Votre espace reste vide tant qu’aucune session réelle n’est enregistrée.',
    icon: '',
    color: '#C95F7B',
  },
  {
    title: 'Connectez la sonde quand vous êtes prêt',
    description: 'Les mesures du périnée ne sont affichées que lorsqu’un capteur physique transmet des données.',
    icon: '',
    color: '#571534',
  },
  {
    title: 'Gardez le contrôle du parcours',
    description: 'Vous pouvez créer votre compte maintenant et connecter la sonde plus tard.',
    icon: '',
    color: '#F7C5C8',
  },
];

const OnboardingScreen = () => {
  const scrollX = useSharedValue(0);
  const scrollViewRef = useAnimatedRef<Animated.ScrollView>();


  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      'worklet';
      scrollX.value = event.contentOffset.x;
    },
    onMomentumEnd: (event) => {
      'worklet';
      runOnJS((pageIndex) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      })(Math.round(event.contentOffset.x / SCREEN_WIDTH));
    },
  });


  const skipOpacity = useAnimatedStyle(() => ({
    opacity: interpolate(
      scrollX.value,
      [0, SCREEN_WIDTH * 1.5],
      [1, 0.2],
      Extrapolate.CLAMP
    ),
  }));

  const [isFinishState, setIsFinishState] = React.useState(false);
  useAnimatedReaction(
    () => Math.round(scrollX.value / SCREEN_WIDTH) === SLIDES.length - 1,
    (finish) => {
      runOnJS(setIsFinishState)(finish);
    }
  );


  const scrollNext = () => {
    const currentIndex = Math.round(scrollX.value / SCREEN_WIDTH);
    const nextPage = currentIndex + 1;
    if (nextPage < SLIDES.length) {
      scrollViewRef.current?.scrollTo({
        x: nextPage * SCREEN_WIDTH,
        animated: true,
      });
    }
  };

const goToLogin = () => {
    router.replace('/login');
  };

  const onSkipPress = () => {
    Haptics.selectionAsync();
    goToLogin();
  };

  const onButtonPress = () => {
    if (isFinishState) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      goToLogin();
    } else {
      scrollNext();
    }
  };


  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <BrandLogo compact />
      </View>

      {/* Skip Button */}
      <Animated.View style={[styles.skipContainer, skipOpacity]}>
        <Pressable style={styles.skip} onPress={onSkipPress}>
          <Text style={styles.skipText}>Passer</Text>
        </Pressable>
      </Animated.View>

      {/* ScrollView Pager */}
      <Animated.ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        decelerationRate="fast"
        onScroll={scrollHandler}
        contentContainerStyle={{ width: SLIDES.length * SCREEN_WIDTH }}
        snapToOffsets={SLIDES.map((_, i) => i * SCREEN_WIDTH)}
        snapToAlignment="start"
        style={styles.scrollView}
      >
        {SLIDES.map((slide, index) => (
          <OnboardingSlide
            key={index}
            data={slide}
            index={index}
            scrollX={scrollX}
          />
        ))}
      </Animated.ScrollView>

      {/* Pagination */}
      <PaginationDots scrollX={scrollX} />

      {/* Button */}
        <AnimatedButton
        onPress={onButtonPress}
        isFinish={isFinishState}
      />

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9EDEE',
  },
  skipContainer: {
    position: 'absolute',
    top: 60,
    right: 32,
    zIndex: 100,
  },
  logoContainer: {
    position: 'absolute',
    top: 48,
    left: 24,
    zIndex: 100,
  },
  skip: {
    padding: 8,
  },
  skipText: {
    color: '#9B5C6C',
    fontSize: 16,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    alignItems: 'center',
  },
});

export default OnboardingScreen;
