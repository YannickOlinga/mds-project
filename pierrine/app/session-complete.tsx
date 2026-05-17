import { CheckCircle2 } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";

import { colors } from "@/constants/theme/colors";
import { radius, spacing } from "@/constants/theme/spacing";

export default function SessionComplete() {
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <CheckCircle2 size={48} color={colors.success} />
        <Text style={styles.title}>Session enregistree</Text>
        <Text style={styles.message}>
          {"Les resultats affiches dans l'application proviennent uniquement de l'historique backend."}
        </Text>
        <Pressable style={styles.button} onPress={() => router.replace("/(tabs)/progress")}>
          <Text style={styles.buttonText}>Voir la progression</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: "center",
    padding: spacing.xl,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.xl,
    alignItems: "center",
    gap: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: {
    color: colors.plum,
    fontSize: 26,
    fontWeight: "900",
  },
  message: {
    color: colors.textMuted,
    textAlign: "center",
    lineHeight: 22,
  },
  button: {
    backgroundColor: colors.plum,
    borderRadius: 999,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  buttonText: {
    color: colors.surface,
    fontWeight: "900",
  },
});
