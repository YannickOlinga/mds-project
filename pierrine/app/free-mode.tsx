import { Activity, Bluetooth } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";

import { colors } from "@/constants/theme/colors";
import { radius, spacing } from "@/constants/theme/spacing";
import { useDeviceStore } from "@/store/deviceStore";

export default function FreeMode() {
  const connectedDevice = useDeviceStore((state) => state.connectedDevice);

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        {connectedDevice ? (
          <Activity size={42} color={colors.plum} />
        ) : (
          <Bluetooth size={42} color={colors.plum} />
        )}
        <Text style={styles.title}>Mode libre</Text>
        <Text style={styles.message}>
          {connectedDevice
            ? "La lecture temps reel du capteur sera activee lorsque les caracteristiques Bluetooth de la sonde seront documentees."
            : "Connectez une sonde physique pour utiliser le mode libre. Aucune mesure locale n'est simulee."}
        </Text>
        <Pressable style={styles.button} onPress={() => router.push("/connect")}>
          <Text style={styles.buttonText}>Configurer la sonde</Text>
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
