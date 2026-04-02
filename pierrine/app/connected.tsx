// app/connected.tsx

import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";

import { getDeviceStatus } from "@/lib/api";
import { getAccessToken } from "@/lib/auth";

export default function ConnectedScreen() {
  const router = useRouter();

  const [deviceName, setDeviceName] = useState("Périnea #A4F2B");
  const [batteryPct, setBatteryPct] = useState(85);
  const [signalLevel, setSignalLevel] = useState("Excellent");

  useEffect(() => {
    (async () => {
      const token = await getAccessToken();
      if (!token) {
        router.replace("/login");
        return;
      }

      getDeviceStatus(1)
        .then((data) => {
          setDeviceName(data.device_name);
          setBatteryPct(data.battery_pct);
          setSignalLevel(data.signal_level);
        })
        .catch(() => {
          // fallback mock
        });
    })();
  }, []);

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

      {/* Icône / Bloc central */}
      <View style={styles.iconArea}>
        {/* Ombre / halo */}
        <View style={styles.shadowCircle} />

        {/* Bloc principal */}
        <View style={styles.iconBox}>
          {/* ✅ ou icône Bluetooth selon l’état */}
          <Text style={styles.checkIcon}>✔︎</Text>
        </View>
      </View>

      {/* Texte affichant l’état connecté */}
      <Text style={styles.deviceTitle}>Sonde connectée !</Text>
      <Text style={styles.deviceSubtitle}>{deviceName}</Text>

      {/* Carte batterie + signal */}
      <View style={styles.statusCard}>
        {/* Batterie */}
        <View style={styles.statusBlock}>
          <Text style={styles.statusIcon}>🔋</Text>
          <Text style={styles.statusText}>{batteryPct}%</Text>
        </View>

        {/* Séparateur */}
        <View style={styles.statusSeparator} />

        {/* Signal */}
        <View style={styles.statusBlock}>
          <Text style={styles.statusIcon}>📶</Text>
          <Text style={styles.statusText}>{signalLevel}</Text>
        </View>
      </View>

      {/* Aide / Première utilisation */}
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

      {/* Bouton Continuer */}
      <LinearGradient
        colors={["#B9657C", "#6A1E3A"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.button}
      >
        <Pressable onPress={() => router.replace("/(tabs)")}>
          <Text style={styles.buttonText}>Continuer</Text>
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
    marginTop: Platform.select({ ios: 50, android: 30 }),
    marginBottom: 20,
    fontSize: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#5A1A30",
    marginBottom: 8,
  },
  subtitle: {
    color: "#8A5A65",
    marginBottom: 40,
  },

  /* zone icône centrale */
  iconArea: {
    alignItems: "center",
    marginBottom: 25,
  },
  shadowCircle: {
    position: "absolute",
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: "#EAD7DA",
    top: 20,
  },
  iconBox: {
    width: 130,
    height: 130,
    borderRadius: 30,
    backgroundColor: "#6A1E3A",
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
  },
  checkIcon: {
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
    marginBottom: 30,
  },

  /* carte batterie + signal */
  statusCard: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#EDE7E8",
    borderRadius: 25,
    paddingVertical: 14,
    paddingHorizontal: 24,
    gap: 20,
    marginBottom: 30,
  },
  statusBlock: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statusIcon: {
    fontSize: 20,
    color: "#5A1A30",
  },
  statusText: {
    fontSize: 16,
    color: "#5A1A30",
    fontWeight: "700",
  },
  statusSeparator: {
    width: 1,
    height: 30,
    backgroundColor: "#D8B4BE",
  },

  /* carte aide */
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
    marginBottom: 2,
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
