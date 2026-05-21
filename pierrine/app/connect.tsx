import { LinearGradient } from "expo-linear-gradient";
import { Bluetooth, BluetoothConnected, RefreshCcw } from "lucide-react-native";
import { useEffect } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";

import ErrorState from "@/components/ui/ErrorState";
import { useToast } from "@/components/ui/Toast";
import { colors, gradients } from "@/constants/theme/colors";
import { radius, spacing } from "@/constants/theme/spacing";
import { useConnectDeviceMutation } from "@/hooks/useApiQueries";
import useAuthStore from "@/store/authStore";
import { useDeviceStore } from "@/store/deviceStore";
import { getErrorMessage } from "@/utils/apiError";

export default function ConnectScreen() {
  const { state, devices, connectedDevice, error, scan, connect, reset } = useDeviceStore();
  const connectDeviceMutation = useConnectDeviceMutation();
  const showToast = useToast((toast) => toast.show);
  const isAuthenticated = useAuthStore((auth) => auth.isAuthenticated);

  useEffect(() => () => reset(), [reset]);

  async function handleConnect(deviceId: string) {
    await connect(deviceId);
    const latest = useDeviceStore.getState().connectedDevice;
    if (!latest) return;

    connectDeviceMutation.mutate(
      {
        device_name: latest.name,
        connected: true,
      },
      {
        onSuccess: () => {
          showToast("Sonde connectée");
          router.replace("/connected");
        },
        onError: (apiError) => showToast(getErrorMessage(apiError)),
      }
    );
  }

  function skipDeviceConnection() {
    router.replace(isAuthenticated ? "/(tabs)" : "/login");
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Pressable onPress={() => router.back()}>
        <Text style={styles.back}>Retour</Text>
      </Pressable>

      <View style={styles.hero}>
        <LinearGradient colors={gradients.primary} style={styles.iconBubble}>
          {state === "connected" ? (
            <BluetoothConnected size={62} color={colors.surface} />
          ) : (
            <Bluetooth size={62} color={colors.surface} />
          )}
        </LinearGradient>
        <Text style={styles.title}>Connecter la sonde</Text>
        <Text style={styles.subtitle}>
          Cette étape est nécessaire uniquement pour recueillir des mesures réelles. Vous pouvez continuer sans sonde et la connecter plus tard.
        </Text>
      </View>

      {error ? <ErrorState error={new Error(error)} onRetry={() => void scan()} /> : null}

      <LinearGradient colors={gradients.primary} style={styles.scanButton}>
        <Pressable style={styles.scanPressable} onPress={() => void scan()} disabled={state === "scanning"}>
          <RefreshCcw size={19} color={colors.surface} />
          <Text style={styles.scanText}>{state === "scanning" ? "Recherche..." : "Scanner"}</Text>
        </Pressable>
      </LinearGradient>

      <Pressable style={styles.skipButton} onPress={skipDeviceConnection}>
        <Text style={styles.skipText}>Passer pour l’instant</Text>
      </Pressable>

      <View style={styles.list}>
        <Text style={styles.sectionTitle}>Périphériques détectés</Text>
        {devices.length === 0 ? (
          <Text style={styles.emptyText}>
            Aucun périphérique détecté. Vérifiez que la sonde est allumée et proche du téléphone.
          </Text>
        ) : (
          devices.map((device) => (
            <Pressable
              key={device.id}
              style={styles.deviceCard}
              onPress={() => void handleConnect(device.id)}
              disabled={state === "connecting" || connectDeviceMutation.isPending}
            >
              <View>
                <Text style={styles.deviceName}>{device.name}</Text>
                <Text style={styles.deviceMeta}>Signal {device.rssi ?? "indisponible"}</Text>
              </View>
              <Text style={styles.connectText}>Connecter</Text>
            </Pressable>
          ))
        )}
      </View>

      {connectedDevice ? (
        <Text style={styles.connectedText}>Connecté à {connectedDevice.name}</Text>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.xl, paddingTop: 56, paddingBottom: 80, gap: spacing.xl },
  back: { color: colors.plum, fontWeight: "800" },
  hero: { alignItems: "center", gap: spacing.md },
  iconBubble: {
    width: 132,
    height: 132,
    borderRadius: 66,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { color: colors.plum, fontSize: 28, fontWeight: "900", textAlign: "center" },
  subtitle: { color: colors.textMuted, textAlign: "center", lineHeight: 22 },
  scanButton: { borderRadius: 999, overflow: "hidden" },
  scanPressable: {
    paddingVertical: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  scanText: { color: colors.surface, fontSize: 16, fontWeight: "900" },
  skipButton: {
    alignItems: "center",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingVertical: 14,
  },
  skipText: {
    color: colors.plum,
    fontSize: 15,
    fontWeight: "900",
  },
  list: { gap: spacing.md },
  sectionTitle: { color: colors.plum, fontSize: 18, fontWeight: "900" },
  emptyText: {
    color: colors.textMuted,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    lineHeight: 20,
  },
  deviceCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: colors.border,
  },
  deviceName: { color: colors.text, fontWeight: "900", fontSize: 16 },
  deviceMeta: { color: colors.textMuted, marginTop: 3 },
  connectText: { color: colors.coral, fontWeight: "900" },
  connectedText: { color: colors.success, textAlign: "center", fontWeight: "900" },
});
