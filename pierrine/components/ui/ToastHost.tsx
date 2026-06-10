import { StyleSheet, Text } from "react-native";
import Animated, { FadeInDown, FadeOutDown } from "react-native-reanimated";

import { colors } from "@/constants/theme/colors";
import { useToast } from "@/components/ui/Toast";

export default function ToastHost() {
  const message = useToast((state) => state.message);

  if (!message) return null;

  return (
    <Animated.View entering={FadeInDown} exiting={FadeOutDown} style={styles.toast}>
      <Text style={styles.text}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: "absolute",
    left: 24,
    right: 24,
    bottom: 36,
    backgroundColor: colors.plum,
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 14,
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  text: {
    color: colors.surface,
    fontWeight: "700",
    textAlign: "center",
  },
});
