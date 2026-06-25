import { router } from "expo-router";
import { AtSign, LockKeyhole, UserRound } from "lucide-react-native";
import { useRef, useState } from "react";
import {
  ActivityIndicator,
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

import BrandLogo from "@/components/ui/BrandLogo";
import { colors } from "@/constants/theme/colors";
import { radius, spacing } from "@/constants/theme/spacing";
import { getMeProfile } from "@/services/endpoints";
import useAuthStore from "@/store/authStore";
import { getErrorMessage } from "@/utils/apiError";

export default function RegisterScreen() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const submittingRef = useRef(false);
  const register = useAuthStore((state) => state.register);

  async function handleRegister() {
    if (submittingRef.current) {
      return;
    }

    if (!username.trim() || !email.trim() || password.length < 8) {
      setError("Remplissez tous les champs. Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }

    submittingRef.current = true;
    setError(null);
    setLoading(true);

    try {
      await register(username.trim(), email.trim(), password);
      const profile = await getMeProfile();
      router.replace(profile.onboarding_completed ? "/(tabs)" : "/questionnaire");
    } catch (e: unknown) {
      setError(getErrorMessage(e));
    } finally {
      submittingRef.current = false;
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <BrandLogo />

          <View style={styles.header}>
            <Text style={styles.title}>Créer un compte</Text>
            <Text style={styles.subtitle}>
              Préparez votre profil pour recevoir un parcours adapté à votre situation.
            </Text>
          </View>

          <View style={styles.form}>
            <View style={styles.field}>
              <Text style={styles.label}>Nom d&apos;utilisateur</Text>
              <View style={styles.inputWrap}>
                <UserRound size={19} color={colors.plumMuted} />
                <TextInput
                  value={username}
                  onChangeText={setUsername}
                  placeholder="Votre identifiant"
                  placeholderTextColor="#9F7B88"
                  style={styles.input}
                  autoCapitalize="none"
                  autoCorrect={false}
                  textContentType="username"
                />
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Email</Text>
              <View style={styles.inputWrap}>
                <AtSign size={19} color={colors.plumMuted} />
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="vous@example.com"
                  placeholderTextColor="#9F7B88"
                  style={styles.input}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  textContentType="emailAddress"
                />
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Mot de passe</Text>
              <View style={styles.inputWrap}>
                <LockKeyhole size={19} color={colors.plumMuted} />
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="8 caractères minimum"
                  placeholderTextColor="#9F7B88"
                  style={styles.input}
                  secureTextEntry
                  textContentType="newPassword"
                />
              </View>
            </View>

            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <Pressable
              style={[styles.primaryButton, loading && styles.buttonDisabled]}
              onPress={handleRegister}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={colors.surface} />
              ) : (
                <Text style={styles.primaryButtonText}>Continuer</Text>
              )}
            </Pressable>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Déjà inscrite ?</Text>
            <Pressable onPress={() => router.replace("/login")}>
              <Text style={styles.footerLink}>Se connecter</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboard: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    justifyContent: "center",
    padding: spacing.xl,
    paddingBottom: spacing.xxl,
    gap: spacing.xl,
  },
  header: {
    alignItems: "center",
    gap: spacing.sm,
  },
  title: {
    color: colors.plum,
    fontSize: 34,
    fontWeight: "900",
    letterSpacing: 0,
    textAlign: "center",
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 16,
    lineHeight: 22,
    textAlign: "center",
  },
  form: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.xl,
    borderWidth: 1,
    gap: spacing.lg,
    padding: spacing.xl,
  },
  field: {
    gap: spacing.sm,
  },
  label: {
    color: colors.plum,
    fontSize: 14,
    fontWeight: "800",
  },
  inputWrap: {
    alignItems: "center",
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    minHeight: 54,
    paddingHorizontal: spacing.lg,
  },
  input: {
    color: colors.text,
    flex: 1,
    fontSize: 16,
    minWidth: 0,
  },
  errorBox: {
    backgroundColor: "#FBE7EA",
    borderColor: colors.coral,
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.md,
  },
  errorText: {
    color: colors.plum,
    fontWeight: "700",
    lineHeight: 20,
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: colors.plum,
    borderRadius: radius.md,
    justifyContent: "center",
    minHeight: 56,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: colors.surface,
    fontSize: 16,
    fontWeight: "900",
  },
  footer: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.xs,
    justifyContent: "center",
  },
  footerText: {
    color: colors.textMuted,
    fontWeight: "700",
  },
  footerLink: {
    color: colors.coral,
    fontWeight: "900",
  },
});
