import { LinearGradient } from "expo-linear-gradient";
import {
  Bluetooth,
  BluetoothConnected,
  Check,
  Gamepad2,
  Power,
  RefreshCcw,
  Wifi,
} from "lucide-react-native";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";

import SondeViewer from "@/components/SondeViewer";
import ErrorState from "@/components/ui/ErrorState";
import ScanningPulse from "@/components/ui/ScanningPulse";
import SignalBars from "@/components/ui/SignalBars";
import { useToast } from "@/components/ui/Toast";
import { colors, gradients } from "@/constants/theme/colors";
import { radius, spacing } from "@/constants/theme/spacing";
import { useConnectDeviceMutation } from "@/hooks/useApiQueries";
import useAuthStore from "@/store/authStore";
import { useDeviceStore } from "@/store/deviceStore";
import { getErrorMessage } from "@/utils/apiError";

const MODE_HINTS = {
  ble: "À portée Bluetooth (~10 m), aucune configuration réseau.",
  wifi: "Sonde et téléphone sur le même réseau WiFi (portée maison).",
} as const;

export default function ConnectScreen() {
  const { state, devices, connectedDevice, error, connectionType, scan, connect, disconnectLocal, setConnectionType } =
    useDeviceStore();
  const connectDeviceMutation = useConnectDeviceMutation();
  const showToast = useToast((toast) => toast.show);
  const isAuthenticated = useAuthStore((auth) => auth.isAuthenticated);

  const [connectingId, setConnectingId] = useState<string | null>(null);

  // En quittant l'écran : on stoppe un éventuel scan en cours, mais on
  // CONSERVE la connexion active (sonde + polling) pour que les jeux la voient.
  useEffect(() => {
    return () => {
      useDeviceStore.getState().stopScan?.();
    };
  }, []);

  const isScanning = state === "scanning";
  const isConnected = state === "connected" && connectedDevice !== null;
  const busy = state === "connecting" || connectDeviceMutation.isPending;
  const lockMode = isScanning || busy || isConnected;

  async function handleConnect(deviceId: string) {
    setConnectingId(deviceId);
    await connect(deviceId);
    const latest = useDeviceStore.getState().connectedDevice;
    if (!latest) {
      setConnectingId(null);
      return;
    }

    connectDeviceMutation.mutate(
      { device_name: latest.name, connected: true },
      {
        onSuccess: () => {
          setConnectingId(null);
          showToast("Sonde connectée 🎉");
        },
        onError: (apiError) => {
          setConnectingId(null);
          showToast(getErrorMessage(apiError));
        },
      }
    );
  }

  function handleDisconnect() {
    disconnectLocal();
    showToast("Sonde déconnectée");
  }

  function skipDeviceConnection() {
    router.replace(isAuthenticated ? "/(tabs)" : "/login");
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Pressable onPress={() => router.back()} hitSlop={10}>
        <Text style={styles.back}>← Retour</Text>
      </Pressable>

      {/* ───────── Héros : sonde 3D + état ───────── */}
      <View style={styles.hero}>
        <View style={styles.modelContainer}>
          {isScanning ? (
            <View style={styles.pulseWrap}>
              <ScanningPulse size={200} />
            </View>
          ) : (
            <SondeViewer variant="violet" size={240} />
          )}
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: isConnected ? colors.success : isScanning ? colors.coral : colors.plum },
            ]}
          >
            {isConnected ? (
              <BluetoothConnected size={18} color={colors.surface} />
            ) : (
              <Bluetooth size={18} color={colors.surface} />
            )}
          </View>
        </View>

        <Text style={styles.title}>
          {isConnected ? "Sonde connectée" : isScanning ? "Recherche en cours…" : "Connecter la sonde"}
        </Text>
        <Text style={styles.subtitle}>
          {isConnected
            ? "Tout est prêt. Lance un exercice pour jouer avec ta sonde."
            : "Connecte ta sonde pour des mesures réelles, ou passe cette étape et joue à l'écran tactile."}
        </Text>
      </View>

      {error && !isConnected ? <ErrorState error={new Error(error)} onRetry={() => void scan()} /> : null}

      {/* ───────── Mode connecté : carte + accès jeux ───────── */}
      {isConnected ? (
        <View style={styles.connectedSection}>
          <View style={styles.connectedCard}>
            <View style={styles.connectedIcon}>
              <Check size={22} color={colors.surface} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.connectedName}>{connectedDevice.name}</Text>
              <View style={styles.connectedMetaRow}>
                {connectionType === "wifi" ? (
                  <Wifi size={14} color={colors.success} />
                ) : (
                  <Bluetooth size={14} color={colors.success} />
                )}
                <Text style={styles.connectedMeta}>
                  {connectionType === "wifi" ? "WiFi" : "Bluetooth"} · actif
                </Text>
                <SignalBars rssi={connectedDevice.rssi} />
              </View>
            </View>
            <Pressable style={styles.disconnectBtn} onPress={handleDisconnect} hitSlop={8}>
              <Power size={18} color={colors.danger} />
            </Pressable>
          </View>

          <LinearGradient colors={gradients.primary} style={styles.primaryCta}>
            <Pressable style={styles.primaryCtaInner} onPress={() => router.replace("/game-hub")}>
              <Gamepad2 size={20} color={colors.surface} />
              <Text style={styles.primaryCtaText}>Aller aux exercices</Text>
            </Pressable>
          </LinearGradient>

          <Pressable style={styles.ghostBtn} onPress={() => router.replace("/(tabs)")}>
            <Text style={styles.ghostText}>Plus tard</Text>
          </Pressable>
        </View>
      ) : (
        <>
          {/* ───────── Sélecteur de mode ───────── */}
          <View>
            <View style={styles.modeSelector}>
              <Pressable
                style={[styles.modeButton, connectionType === "ble" && styles.modeButtonActive]}
                onPress={() => setConnectionType("ble")}
                disabled={lockMode}
              >
                <Bluetooth size={18} color={connectionType === "ble" ? colors.surface : colors.plum} />
                <Text style={[styles.modeButtonText, connectionType === "ble" && styles.modeButtonTextActive]}>
                  Bluetooth
                </Text>
              </Pressable>

              <Pressable
                style={[styles.modeButton, connectionType === "wifi" && styles.modeButtonActive]}
                onPress={() => setConnectionType("wifi")}
                disabled={lockMode}
              >
                <Wifi size={18} color={connectionType === "wifi" ? colors.surface : colors.plum} />
                <Text style={[styles.modeButtonText, connectionType === "wifi" && styles.modeButtonTextActive]}>
                  WiFi
                </Text>
              </Pressable>
            </View>
            <Text style={styles.modeHint}>{MODE_HINTS[connectionType]}</Text>
          </View>

          {/* ───────── Bouton scan ───────── */}
          <LinearGradient colors={gradients.primary} style={styles.scanButton}>
            <Pressable style={styles.scanPressable} onPress={() => void scan()} disabled={isScanning}>
              {isScanning ? (
                <ActivityIndicator color={colors.surface} />
              ) : (
                <RefreshCcw size={19} color={colors.surface} />
              )}
              <Text style={styles.scanText}>{isScanning ? "Recherche…" : "Scanner les sondes"}</Text>
            </Pressable>
          </LinearGradient>

          {/* ───────── Liste des appareils ───────── */}
          <View style={styles.list}>
            <View style={styles.listHeader}>
              <Text style={styles.sectionTitle}>Sondes détectées</Text>
              {devices.length > 0 && (
                <View style={styles.countPill}>
                  <Text style={styles.countText}>{devices.length}</Text>
                </View>
              )}
            </View>

            {devices.length === 0 ? (
              <View style={styles.emptyBox}>
                {isScanning ? (
                  <Text style={styles.emptyText}>Recherche de sondes Périnéa autour de toi…</Text>
                ) : (
                  <Text style={styles.emptyText}>
                    {connectionType === "wifi"
                      ? "Aucune sonde. Vérifie qu'elle est sur le même WiFi que le téléphone, puis relance le scan."
                      : "Aucune sonde. Vérifie qu'elle est allumée et proche du téléphone, puis relance le scan."}
                  </Text>
                )}
              </View>
            ) : (
              devices.map((device) => {
                const cardBusy = connectingId === device.id;
                return (
                  <Pressable
                    key={device.id}
                    style={[styles.deviceCard, cardBusy && styles.deviceCardBusy]}
                    onPress={() => void handleConnect(device.id)}
                    disabled={busy}
                  >
                    <View style={styles.deviceLeft}>
                      <View style={styles.deviceIcon}>
                        {connectionType === "wifi" ? (
                          <Wifi size={20} color={colors.coral} />
                        ) : (
                          <Bluetooth size={20} color={colors.coral} />
                        )}
                      </View>
                      <View>
                        <Text style={styles.deviceName}>{device.name}</Text>
                        <View style={styles.deviceMetaRow}>
                          <SignalBars rssi={device.rssi} activeColor={colors.coral} />
                          <Text style={styles.deviceMeta}>
                            {device.rssi != null ? `${device.rssi} dBm` : "réseau local"}
                          </Text>
                        </View>
                      </View>
                    </View>
                    {cardBusy ? (
                      <ActivityIndicator color={colors.coral} />
                    ) : (
                      <Text style={styles.connectText}>Connecter</Text>
                    )}
                  </Pressable>
                );
              })
            )}
          </View>

          <Pressable style={styles.skipButton} onPress={skipDeviceConnection}>
            <Text style={styles.skipText}>Passer pour l'instant</Text>
          </Pressable>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.xl, paddingTop: 56, paddingBottom: 80, gap: spacing.xl },
  back: { color: colors.plum, fontWeight: "800" },

  hero: { alignItems: "center", gap: spacing.md },
  modelContainer: { width: 240, height: 240, position: "relative", alignItems: "center", justifyContent: "center" },
  pulseWrap: { width: 240, height: 240, alignItems: "center", justifyContent: "center" },
  statusBadge: {
    position: "absolute",
    bottom: 14,
    right: 14,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  title: { color: colors.plum, fontSize: 28, fontWeight: "900", textAlign: "center" },
  subtitle: { color: colors.textMuted, textAlign: "center", lineHeight: 22, paddingHorizontal: spacing.sm },

  // Mode connecté
  connectedSection: { gap: spacing.md },
  connectedCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: "#CDEBDD",
  },
  connectedIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.success,
    alignItems: "center",
    justifyContent: "center",
  },
  connectedName: { color: colors.text, fontWeight: "900", fontSize: 17 },
  connectedMetaRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginTop: 4 },
  connectedMeta: { color: colors.success, fontWeight: "700", fontSize: 13 },
  disconnectBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FDECEC",
    alignItems: "center",
    justifyContent: "center",
  },
  primaryCta: { borderRadius: 999, overflow: "hidden" },
  primaryCtaInner: {
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  primaryCtaText: { color: colors.surface, fontSize: 16, fontWeight: "900" },
  ghostBtn: { alignItems: "center", paddingVertical: 12 },
  ghostText: { color: colors.textMuted, fontWeight: "800" },

  // Sélecteur de mode
  modeSelector: { flexDirection: "row", gap: spacing.md },
  modeButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingVertical: 12,
  },
  modeButtonActive: { backgroundColor: colors.plum, borderColor: colors.plum },
  modeButtonText: { color: colors.plum, fontSize: 14, fontWeight: "900" },
  modeButtonTextActive: { color: colors.surface },
  modeHint: { color: colors.textMuted, fontSize: 12, textAlign: "center", marginTop: spacing.sm, lineHeight: 17 },

  // Scan
  scanButton: { borderRadius: 999, overflow: "hidden" },
  scanPressable: {
    paddingVertical: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  scanText: { color: colors.surface, fontSize: 16, fontWeight: "900" },

  // Liste
  list: { gap: spacing.md },
  listHeader: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  sectionTitle: { color: colors.plum, fontSize: 18, fontWeight: "900" },
  countPill: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    paddingHorizontal: 6,
    backgroundColor: colors.coral,
    alignItems: "center",
    justifyContent: "center",
  },
  countText: { color: colors.surface, fontWeight: "900", fontSize: 12 },
  emptyBox: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyText: { color: colors.textMuted, lineHeight: 20, textAlign: "center" },
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
  deviceCardBusy: { borderColor: colors.coral, backgroundColor: colors.surfaceAlt },
  deviceLeft: { flexDirection: "row", alignItems: "center", gap: spacing.md, flex: 1 },
  deviceIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
  },
  deviceName: { color: colors.text, fontWeight: "900", fontSize: 16 },
  deviceMetaRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginTop: 4 },
  deviceMeta: { color: colors.textMuted, fontSize: 12 },
  connectText: { color: colors.coral, fontWeight: "900" },

  skipButton: {
    alignItems: "center",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingVertical: 14,
  },
  skipText: { color: colors.plum, fontSize: 15, fontWeight: "900" },
});
