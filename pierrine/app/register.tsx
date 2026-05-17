import { useState } from "react";
import { View, Text, StyleSheet, TextInput, Pressable, ActivityIndicator } from "react-native";
import { router } from "expo-router";

import { colors } from "@/constants/theme/colors";
import useAuthStore from "@/store/authStore";
import { getErrorMessage } from "@/utils/apiError";

export default function RegisterScreen() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const register = useAuthStore((state) => state.register);

  async function handleRegister() {
    if (!username.trim() || !email.trim() || password.length < 8) {
      setError('Veuillez remplir tous les champs (mdp min 8)');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      await register(username.trim(), email.trim(), password);
      router.replace("/questionnaire");
    } catch (e: unknown) {
      setError(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Inscription</Text>

      <TextInput
        value={username}
        onChangeText={setUsername}
        placeholder="Nom d'utilisateur"
        style={styles.input}
        autoCapitalize="none"
      />
      <TextInput
        value={email}
        onChangeText={setEmail}
        placeholder="Email"
        style={styles.input}
        autoCapitalize="none"
      />
      <TextInput
        value={password}
        onChangeText={setPassword}
        placeholder="Mot de passe (min 8)"
        style={styles.input}
        secureTextEntry
      />

      {error && <Text style={styles.errorText}>{error}</Text>}

      <Pressable style={[styles.button, loading && styles.buttonLoading]} onPress={handleRegister}>
        {loading ? <ActivityIndicator color={colors.surface} /> : <Text style={styles.buttonText}>Créer un compte</Text>}
      </Pressable>

      <Pressable onPress={() => router.replace("/login")}>
        <Text style={styles.linkText}>J&apos;ai déjà un compte</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 24,
    justifyContent: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.plum,
    marginBottom: 24,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 12,
  },
  button: {
    backgroundColor: colors.plum,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
  },
  buttonLoading: {
    opacity: 0.7,
  },
  buttonText: {
    color: colors.surface,
    fontWeight: "800",
    fontSize: 16,
  },
  errorText: {
    color: colors.danger,
    marginTop: 8,
    marginBottom: 8,
  },
  linkText: {
    marginTop: 18,
    color: colors.coral,
    fontWeight: "700",
    textAlign: "center",
  },
});
