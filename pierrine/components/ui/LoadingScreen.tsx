import { ActivityIndicator, StyleSheet, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { colors } from "@/constants/theme/colors";

export default function LoadingScreen({ label = "Chargement" }: { label?: string }) {
  return (
    <SafeAreaView style={styles.container}>
      <ActivityIndicator size="large" color={colors.plum} />
      <Text style={styles.label}>{label}</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    backgroundColor: colors.background,
    padding: 24,
  },
  label: {
    color: colors.plum,
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
  },
});
