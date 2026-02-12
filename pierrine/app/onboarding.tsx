import { View, Text, StyleSheet, Pressable } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";

export default function Onboarding() {
  return (
    <View style={styles.container}>
      
      {/* Passer */}
      <Pressable onPress={() => router.replace("/connect")} style={styles.skip}>
        <Text style={styles.skipText}>Passer</Text>
      </Pressable>

      {/* Logo + titre */}
      <Text style={styles.brand}>Périnea</Text>
      <Text style={styles.tagline}>Votre allié périnée au quotidien</Text>

      {/* Illustration */}
      <View style={styles.illustration}>
        <View style={styles.blob}>
          <Text style={styles.star}>✦</Text>
        </View>
      </View>

      {/* Texte principal */}
      <Text style={styles.title}>
        Renforcez votre périnée en jouant
      </Text>

      <Text style={styles.subtitle}>
        Des exercices ludiques et efficaces pour retrouver tonus et confiance, à votre rythme.
      </Text>

      {/* Indicateurs */}
      <View style={styles.dots}>
        <View style={[styles.dot, styles.activeDot]} />
        <View style={styles.dot} />
        <View style={styles.dot} />
      </View>

      {/* Bouton */}
      <LinearGradient
        colors={["#C75C7A", "#8B1E3F"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.button}
      >
        <Pressable onPress={() => router.replace("/connect")}>
          <Text style={styles.buttonText}>Suivant</Text>
        </Pressable>
      </LinearGradient>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9EDEE",
    padding: 24,
    justifyContent: "center",
  },
  skip: {
    position: "absolute",
    top: 50,
    right: 24,
  },
  skipText: {
    color: "#9B5C6C",
    fontWeight: "600",
  },
  brand: {
    textAlign: "center",
    fontSize: 26,
    fontWeight: "800",
    color: "#6A1E3A",
    marginTop: 60,
  },
  tagline: {
    textAlign: "center",
    color: "#B16C7C",
    marginBottom: 40,
  },
  illustration: {
    alignItems: "center",
    marginBottom: 30,
  },
  blob: {
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: "#D47A92",
    justifyContent: "center",
    alignItems: "center",
  },
  star: {
    fontSize: 60,
    color: "white",
  },
  title: {
    textAlign: "center",
    fontSize: 20,
    fontWeight: "800",
    color: "#6A1E3A",
    marginBottom: 10,
  },
  subtitle: {
    textAlign: "center",
    color: "#9B5C6C",
    fontSize: 14,
    marginBottom: 30,
  },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 30,
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#E7B8C4",
  },
  activeDot: {
    width: 20,
    backgroundColor: "#8B1E3F",
  },
  button: {
    borderRadius: 30,
    paddingVertical: 16,
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontWeight: "700",
    fontSize: 16,
  },
});

