import { useState } from "react";
import { View, Text, StyleSheet, TextInput, Pressable, ActivityIndicator } from "react-native";
import { router } from "expo-router";

import { register } from "@/lib/api";
import { saveTokens } from "@/lib/auth";
import useAuthStore from "@/store/authStore";

export default function RegisterScreen() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

async function handleRegister() {
    if (!username.trim() || !email.trim() || password.length < 8) {
      setError('Veuillez remplir tous les champs (mdp min 8)');
      return;
    }

    setError(null);
    setLoading(true);
    const auth = useAuthStore.getState();

    try {
      // ✅ MOCK for dev - bypass backend
      const mockData = {
        accessToken: 'mock-register-' + Date.now(),
        refreshToken: 'mock-refresh-' + Date.now(),
      };
      
      await saveTokens(mockData);
      auth.login(mockData, {
        id: 'mock-register-user',
        username: username.trim(),
        email: email.trim()
      });
      router.replace("/(tabs)");
    } catch (e: any) {
      setError(e.message || 'Erreur création compte');
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
        <Text style={styles.buttonText}>
          {loading ? "Création..." : "Créer un compte"}
        </Text>
      </Pressable>

      <Pressable onPress={() => router.replace("/login")}>
        <Text style={styles.linkText}>J'ai déjà un compte</Text>
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
  buttonLoading: {
    opacity: 0.7,
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

