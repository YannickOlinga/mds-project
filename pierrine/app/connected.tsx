import { LinearGradient } from "expo-linear-gradient";
import { Battery, CheckCircle2, Signal } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";

import ErrorState from "@/components/ui/ErrorState";
import LoadingScreen from "@/components/ui/LoadingScreen";
import { colors, gradients } from "@/constants/theme/colors";
import { radius, spacing } from "@/constants/theme/spacing";
import { useDeviceQuery } from "@/hooks/useApiQueries";

export default function ConnectedScreen() {
  const device = useDeviceQuery();

  if (device.isLoading) {
    return <LoadingScreen label="Lecture de l’état appareil" />;
  }

  if (device.isError) {
    return <ErrorState error={device.error} onRetry={() => void device.refetch()} />;
  }

  if (!device.data) {
    return <ErrorState error={new Error("État appareil indisponible.")} onRetry={() => void device.refetch()} />;
  }

  return (
    <View style={styles.container}>
      <Pressable onPress={() => router.back()}>
        <Text style={styles.back}>Retour</Text>
      </Pressable>

      <View style={styles.content}>
        <LinearGradient colors={gradients.primary} style={styles.iconBox}>
          <CheckCircle2 size={72} color={colors.surface} />
        </LinearGradient>

        <Text style={styles.title}>{device.data.connected ? "Sonde connectée" : "Sonde déconnectée"}</Text>
        <Text style={styles.subtitle}>{device.data.device_name}</Text>

        <View style={styles.statusCard}>
          <View style={styles.statusBlock}>
            <Battery size={22} color={colors.plum} />
            <Text style={styles.statusText}>{device.data.battery_pct}%</Text>
          </View>
          <View style={styles.separator} />
          <View style={styles.statusBlock}>
            <Signal size={22} color={colors.plum} />
            <Text style={styles.statusText}>{device.data.signal_level ?? "Signal inconnu"}</Text>
          </View>
        </View>
      </View>

      <LinearGradient colors={gradients.primary} style={styles.button}>
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
    backgroundColor: colors.background,
    padding: spacing.xl,
    paddingTop: 56,
  },
  back: { color: colors.plum, fontWeight: "800" },
  content: { flex: 1, alignItems: "center", justifyContent: "center", gap: spacing.lg },
  iconBox: {
    width: 132,
    height: 132,
    borderRadius: 38,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { color: colors.plum, fontSize: 28, fontWeight: "900", textAlign: "center" },
  subtitle: { color: colors.textMuted, fontSize: 16, fontWeight: "700" },
  statusCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    gap: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statusBlock: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  statusText: { color: colors.plum, fontWeight: "900" },
  separator: { width: 1, height: 28, backgroundColor: colors.border },
  button: { borderRadius: 999, overflow: "hidden" },
  buttonText: {
    color: colors.surface,
    fontSize: 17,
    fontWeight: "900",
    textAlign: "center",
    paddingVertical: 16,
  },
});
