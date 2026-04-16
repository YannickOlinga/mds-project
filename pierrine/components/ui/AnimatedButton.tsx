import React from 'react';
import { Pressable, Text, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

interface Props {
  onPress: () => void;
  isFinish: boolean;
  disabled?: boolean;
}

const AnimatedButton: React.FC<Props> = ({
  onPress,
  isFinish,
  disabled = false,
}) => {
  const scale = useSharedValue(1);

  const handlePressIn = () => {
    if (disabled) return;
    scale.value = withTiming(0.97, { duration: 120 });
  };

  const handlePressOut = async () => {
    if (disabled) return;

    scale.value = withTiming(1, { duration: 120 });

    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}

    onPress();
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <View style={styles.container}>
      {/* Glow */}
      <View style={styles.glow} />

      <Animated.View style={animatedStyle}>
        <LinearGradient
          colors={['#C75C7A', '#8B1E3F']}
          style={[
            styles.gradient,
            disabled && styles.disabled,
          ]}
        >
          <Pressable
            style={styles.pressable}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            disabled={disabled}
          >
            <Text style={styles.text}>
              {isFinish ? 'Commencer mon parcours' : 'Suivant'}
            </Text>
          </Pressable>
        </LinearGradient>
      </Animated.View>
    </View>
  );
};

export default React.memo(AnimatedButton);

const styles = StyleSheet.create({
  container: {
    margin: 32,
    borderRadius: 32,
  },

  glow: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(199, 92, 122, 0.2)',
    borderRadius: 32,
    shadowColor: '#C75C7A',
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
  },

  gradient: {
    borderRadius: 32,
  },

  pressable: {
    paddingVertical: 20,
    alignItems: 'center',
  },

  text: {
    color: 'white',
    fontWeight: '800',
    fontSize: 18,
    letterSpacing: 0.5,
  },

  disabled: {
    opacity: 0.5,
  },
});