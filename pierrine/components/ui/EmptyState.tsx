import { StyleSheet, Text, View } from "react-native";

import { colors } from "@/constants/theme/colors";

export default function EmptyState({ title, message }: { title: string; message: string }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    alignItems: "center",
    gap: 8,
  },
  title: {
    color: colors.plum,
    fontSize: 18,
    fontWeight: "800",
  },
  message: {
    color: colors.textMuted,
    textAlign: "center",
  },
});
