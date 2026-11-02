import { router } from "expo-router";
import { ChevronLeft, Trash2 } from "lucide-react-native";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useToast } from "@/components/ui/Toast";
import { colors } from "@/constants/theme/colors";
import { radius, spacing } from "@/constants/theme/spacing";
import { RequireAuth } from "@/hooks/useRequireAuth";
import { deleteAccountRequest } from "@/services/endpoints";
import { queryClient } from "@/services/queryClient";
import useAuthStore from "@/store/authStore";
import { getErrorMessage } from "@/utils/apiError";

/** Droit à l'effacement (RGPD art. 17) : suppression définitive du compte et des données. */
export default function DeleteAccountScreen() {
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const clearSession = useAuthStore((state) => state.clearSession);
  const showToast = useToast((state) => state.show);

  async function performDelete() {
    setPending(true);
    setError(null);
    try {
      await deleteAccountRequest(password);
      queryClient.clear();
      await clearSession();
      showToast("Votre compte et vos données ont été supprimés");
      router.replace("/login");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setPending(false);
      setPassword("");
    }
  }

  function confirm() {
    Alert.alert(
      "Suppression définitive",
      "Votre compte, votre profil, vos données de santé et votre historique de séances seront supprimés. Cette action est irréversible.",
      [
        { text: "Annuler", style: "cancel" },
        { text: "Supprimer", style: "destructive", onPress: () => void performDelete() },
      ]
    );
  }

  return (
    <RequireAuth>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Pressable style={styles.iconButton} onPress={() => router.back()} accessibilityRole="button">
            <ChevronLeft size={22} color={colors.plum} />
          </Pressable>
          <Text style={styles.title}>Supprimer mon compte</Text>
        </View>

        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <View style={styles.card}>
              <Trash2 size={28} color={colors.danger} />
              <Text style={styles.text}>
                {"Toutes vos données seront définitivement effacées de nos serveurs : profil, données de santé, " +
                  "historique des séances et état de la sonde. Cette action ne peut pas être annulée."}
              </Text>
            </View>

            <Text style={styles.label}>Confirmez avec votre mot de passe</Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="password"
              placeholder="Mot de passe"
              placeholderTextColor="#9F7B88"
              style={styles.input}
            />

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <Pressable
              style={[styles.deleteButton, (!password || pending) && styles.disabled]}
              disabled={!password || pending}
              onPress={confirm}
              accessibilityRole="button"
            >
              {pending ? (
                <ActivityIndicator color={colors.surface} />
              ) : (
                <Text style={styles.deleteText}>Supprimer définitivement</Text>
              )}
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </RequireAuth>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { color: colors.plum, fontSize: 22, fontWeight: "900" },
  content: { padding: spacing.lg, gap: spacing.md },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
  },
  text: { color: colors.text, fontSize: 15, lineHeight: 22 },
  label: { color: colors.text, fontWeight: "800", marginTop: spacing.sm },
  input: {
    minHeight: 52,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    color: colors.text,
    fontSize: 16,
  },
  error: { color: colors.danger, fontWeight: "700" },
  deleteButton: {
    minHeight: 56,
    borderRadius: radius.lg,
    backgroundColor: colors.danger,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.md,
  },
  disabled: { opacity: 0.5 },
  deleteText: { color: colors.surface, fontSize: 16, fontWeight: "900" },
});
