import { View, Text, StyleSheet, Pressable } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";

export default function ConnectScreen() {
  return (
    <View style={styles.container}>

      {/* Retour */}
      <Pressable onPress={() => router.back()}>
        <Text style={styles.back}>← Retour</Text>
      </Pressable>

      {/* Titre */}
      <Text style={styles.title}>Connectez votre sonde</Text>
      <Text style={styles.subtitle}>
        Activez le Bluetooth et placez votre sonde à proximité
      </Text>

      {/* Bloc Bluetooth */}
      <View style={styles.bluetoothContainer}>
        <View style={styles.shadowCircle} />

        <Pressable style={styles.bluetoothBox}>
          <Text style={styles.bluetoothIcon}>ᛒ</Text>
        </Pressable>
      </View>

      <Text style={styles.deviceTitle}>Sonde Périnea</Text>
      <Text style={styles.deviceSubtitle}>
        Appuyez pour démarrer la connexion
      </Text>

      {/* Première utilisation */}
      <View style={styles.helpCard}>
        <View style={styles.helpIcon}>
          <Text style={styles.question}>?</Text>
        </View>

        <View>
          <Text style={styles.helpTitle}>Première utilisation ?</Text>
          <Text style={styles.helpSubtitle}>
            Consultez notre guide de démarrage
          </Text>
        </View>
      </View>

      {/* Bouton Connexion */}
      <LinearGradient
        colors={["#B9657C", "#6A1E3A"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.button}
      >
        <Pressable onPress={() => router.replace("/connected")}>
          <Text style={styles.buttonText}>Connexion automatique</Text>
        </Pressable>
      </LinearGradient>

    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5ECEC",
    padding: 24,
  },
  back: {
    color: "#9B6A75",
    marginTop: 50,
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#5A1A30",
    marginBottom: 10,
  },
  subtitle: {
    color: "#8A5A65",
    marginBottom: 40,
  },
  bluetoothContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  shadowCircle: {
    position: "absolute",
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: "#EAD7DA",
    top: 20,
  },
  bluetoothBox: {
    width: 130,
    height: 130,
    borderRadius: 30,
    backgroundColor: "#6A1E3A",
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
  },
  bluetoothIcon: {
    fontSize: 60,
    color: "white",
  },
  deviceTitle: {
    textAlign: "center",
    fontSize: 22,
    fontWeight: "800",
    color: "#5A1A30",
    marginTop: 20,
  },
  deviceSubtitle: {
    textAlign: "center",
    color: "#8A5A65",
    marginBottom: 40,
  },
  helpCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EDE7E8",
    padding: 20,
    borderRadius: 25,
    marginBottom: 30,
  },
  helpIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#D9AEB6",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  question: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#6A1E3A",
  },
  helpTitle: {
    fontWeight: "700",
    color: "#5A1A30",
  },
  helpSubtitle: {
    color: "#8A5A65",
  },
  button: {
    borderRadius: 40,
    paddingVertical: 18,
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontWeight: "800",
    fontSize: 18,
  },
});
