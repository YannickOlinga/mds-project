import { RefreshCcw } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors } from "@/constants/theme/colors";
import { getErrorMessage } from "@/utils/apiError";

export default function ErrorState({
  error,
  onRetry,
  title = "Impossible de charger les données",
}: {
  error: unknown;
  onRetry?: () => void;
  title?: string;
}) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{getErrorMessage(error)}</Text>
      {onRetry ? (
        <Pressable style={styles.button} onPress={onRetry}>
          <RefreshCcw size={18} color={colors.surface} />
          <Text style={styles.buttonText}>Réessayer</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    gap: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    color: colors.plum,
    fontSize: 18,
    fontWeight: "800",
    textAlign: "center",
  },
  message: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
  button: {
    marginTop: 8,
    backgroundColor: colors.plum,
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  buttonText: {
    color: colors.surface,
    fontSize: 14,
    fontWeight: "800",
  },
});
