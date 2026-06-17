import { StyleSheet, View } from "react-native";

import { colors } from "@/constants/theme/colors";

export default function Skeleton({ height = 20, width = "100%" }: { height?: number; width?: number | `${number}%` }) {
  return <View style={[styles.skeleton, { height, width }]} />;
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: colors.border,
    borderRadius: 12,
    opacity: 0.7,
  },
});
