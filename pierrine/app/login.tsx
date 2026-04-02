import { useState } from "react";
import { View, Text, StyleSheet, TextInput, Pressable } from "react-native";
import { router } from "expo-router";

import { login } from "@/lib/api";
import { saveTokens } from "@/lib/auth";

export default function LoginScreen() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    setError(null);
    setLoading(true);
    try {
      const data: any = await login(username.trim(), password);
      await saveTokens({
        accessToken: data.access,
        refreshToken: data.refresh,
      });
      router.replace("/(tabs)");
    } catch (e: any) {
      setError(e?.message ?? "Connexion impossible");
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Connexion</Text>

      <TextInput
        value={username}
        onChangeText={setUsername}
        placeholder="Nom d'utilisateur"
        style={styles.input}
        autoCapitalize="none"
      />
      <TextInput
        value={password}
        onChangeText={setPassword}
        placeholder="Mot de passe"
        style={styles.input}
        secureTextEntry
      />

      {error && <Text style={styles.errorText}>{error}</Text>}

      <Pressable style={styles.button} onPress={handleLogin} disabled={loading}>
        <Text style={styles.buttonText}>
          {loading ? "Connexion..." : "Se connecter"}
        </Text>
      </Pressable>

      <Pressable onPress={() => router.replace("/register")}>
        <Text style={styles.linkText}>Créer un compte</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5ECEC",
    padding: 24,
    justifyContent: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#5A1A30",
    marginBottom: 24,
  },
  input: {
    backgroundColor: "#FFF5F5",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#EAD7DA",
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 12,
  },
  button: {
    backgroundColor: "#6A1E3A",
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
  },
  buttonText: {
    color: "#FFF5F5",
    fontWeight: "800",
    fontSize: 16,
  },
  errorText: {
    color: "#B00020",
    marginTop: 8,
    marginBottom: 8,
  },
  linkText: {
    marginTop: 18,
    color: "#B9657C",
    fontWeight: "700",
    textAlign: "center",
  },
});

