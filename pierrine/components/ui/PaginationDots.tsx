import React from 'react';
import { Dimensions, View, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  interpolate,
  Extrapolate,
  SharedValue,
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DOT_COUNT = 3;

interface Props {
  scrollX: SharedValue<number>;
}

const PaginationDots: React.FC<Props> = ({ scrollX }) => {
  return (
    <View style={styles.container}>
      {Array.from({ length: DOT_COUNT }, (_, i) => (
        <PaginationDot key={`dot-${i}`} index={i} scrollX={scrollX} />
      ))}
    </View>
  );
};

function PaginationDot({ index, scrollX }: { index: number; scrollX: SharedValue<number> }) {
  const inputRange = DOT_COUNT > 1
    ? [(index - 1) * SCREEN_WIDTH, index * SCREEN_WIDTH, (index + 1) * SCREEN_WIDTH]
    : [index * SCREEN_WIDTH, (index + 1) * SCREEN_WIDTH];

  const dotStyle = useAnimatedStyle(() => {
    const width = interpolate(scrollX.value, inputRange, [6, 24, 6], Extrapolate.CLAMP);
    const opacity = interpolate(scrollX.value, inputRange, [0.4, 1, 0.4], Extrapolate.CLAMP);

    return {
      width,
      opacity,
      borderRadius: width / 2,
    };
  });

  return <Animated.View style={[styles.dot, dotStyle]} />;
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 28,
    gap: 12,
  },
  dot: {
    height: 8,
    backgroundColor: '#E7B8C4',
  },
});

export default React.memo(PaginationDots);
