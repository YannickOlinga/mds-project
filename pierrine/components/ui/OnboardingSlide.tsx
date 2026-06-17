import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useAnimatedStyle,
  interpolate,
  Extrapolate,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
  createAnimatedComponent,
} from 'react-native-reanimated';

const AnimatedText = createAnimatedComponent(Text);


const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface SlideData {
  title: string;
  description: string;
  icon: string;
  color: string;
}

interface Props {
  data: SlideData;
  index: number;
  scrollX: any;

}


const OnboardingSlide: React.FC<Props> = React.memo(({ data, index, scrollX }) => {
  // Local loops
  const pulseScale = useSharedValue(1);
  const floatOffset = useSharedValue(0);

  React.useEffect(() => {
    pulseScale.value = withRepeat(
      withTiming(1.1, { duration: 4000 }),
      -1,
      true
    );
    floatOffset.value = withRepeat(
      withTiming(5, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, [floatOffset, pulseScale]);

  const animatedStyle = useAnimatedStyle(() => {
    const inputRange = [(index - 1) * SCREEN_WIDTH, index * SCREEN_WIDTH, (index + 1) * SCREEN_WIDTH];
    const slideScale = interpolate(scrollX.value, inputRange, [0.92, 1, 0.92], Extrapolate.CLAMP);
    return {
      transform: [{ scale: slideScale }],
    };
  });


  const blobAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const iconAnimStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatOffset.value }],
  }));

  const contentAnimStyle = useAnimatedStyle(() => {
    const inputRange = [(index - 1) * SCREEN_WIDTH, index * SCREEN_WIDTH, (index + 1) * SCREEN_WIDTH];
    return {
      opacity: interpolate(scrollX.value, inputRange, [0.8, 1, 0.8], Extrapolate.CLAMP),
    };
  });

  return (
    <Animated.View style={[styles.slide, animatedStyle]}>
      {/* Blur circles */}
      <View style={styles.blurCircle1} />
      <View style={styles.blurCircle2} />
      <View style={styles.blurCircle3} />

      {/* Blob */}
      <Animated.View style={[styles.blob, { backgroundColor: data.color }, blobAnimStyle]}>
        <AnimatedText style={[styles.icon, iconAnimStyle]}>
          {data.icon}
        </AnimatedText>

      </Animated.View>

      {/* Content */}
      <Animated.View style={[styles.content, contentAnimStyle]}>
        <Text style={styles.title}>{data.title}</Text>
        <Text style={styles.description}>{data.description}</Text>
      </Animated.View>
    </Animated.View>
  );
}, () => true);

OnboardingSlide.displayName = 'OnboardingSlide';

const styles = StyleSheet.create({
  slide: {
    width: Dimensions.get('window').width,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 0,
    paddingTop: 120,
  },
  blurCircle1: {
    position: 'absolute',
    top: 100,
    left: 40,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(212, 122, 146, 0.1)',
    shadowColor: '#D47A92',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 40,
    elevation: 20,
  },
  blurCircle2: {
    position: 'absolute',
    bottom: 200,
    right: 60,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(212, 122, 146, 0.08)',
    shadowColor: '#D47A92',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 30,
    elevation: 15,
  },
  blurCircle3: {
    position: 'absolute',
    top: '50%',
    left: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(212, 122, 146, 0.06)',
    shadowColor: '#D47A92',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 25,
    elevation: 10,
  },
  blob: {
    width: 180,
    height: 180,
    borderRadius: 90,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 48,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 25,
    elevation: 15,
  },
  icon: {
    fontSize: 72,
  },
  content: {
    alignItems: 'center',
    maxWidth: 280,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: '#6A1E3A',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 34,
  },
  description: {
    fontSize: 17,
    color: '#571534B3',
    textAlign: 'center',
    lineHeight: 26,
  },
});

export default OnboardingSlide;
