import { router } from "expo-router";
import { Battery, Bluetooth, ChevronLeft, Info, Power, Wifi } from "lucide-react-native";
import type { ReactNode } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { colors } from "@/constants/theme/colors";
import { radius, spacing } from "@/constants/theme/spacing";
import { useDeviceStore } from "@/store/deviceStore";

export default function DeviceSettings() {
  const state = useDeviceStore((store) => store.state);
  const connectedDevice = useDeviceStore((store) => store.connectedDevice);
  const connectionType = useDeviceStore((store) => store.connectionType);
  const setConnectionType = useDeviceStore((store) => store.setConnectionType);
  const disconnectLocal = useDeviceStore((store) => store.disconnectLocal);
  const isConnected = state === "connected" && Boolean(connectedDevice);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()} accessibilityRole="button">
          <ChevronLeft size={26} color={colors.plum} />
        </Pressable>
        <View>
          <Text style={styles.title}>Appareil</Text>
          <Text style={styles.subtitle}>Connexion de la sonde Périnéa</Text>
        </View>
      </View>

      <View style={styles.statusCard}>
        <View style={[styles.statusIcon, isConnected ? styles.connectedIcon : styles.disconnectedIcon]}>
          {connectionType === "wifi" ? (
            <Wifi size={28} color={colors.surface} />
          ) : (
            <Bluetooth size={28} color={colors.surface} />
          )}
        </View>
        <View style={styles.statusText}>
          <Text style={styles.statusTitle}>{isConnected ? connectedDevice?.name : "Aucune sonde connectée"}</Text>
          <Text style={styles.statusDescription}>
            {isConnected
              ? `Connectée en ${connectionType === "wifi" ? "Wi-Fi" : "Bluetooth"}`
              : "Connectez une sonde pour récupérer des mesures en direct pendant l'entraînement."}
          </Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Type de connexion</Text>
        <View style={styles.segmented}>
          <Pressable
            style={[styles.segment, connectionType === "ble" && styles.segmentActive]}
            onPress={() => setConnectionType("ble")}
          >
            <Bluetooth size={18} color={connectionType === "ble" ? colors.surface : colors.plum} />
            <Text style={[styles.segmentText, connectionType === "ble" && styles.segmentTextActive]}>Bluetooth</Text>
          </Pressable>
          <Pressable
            style={[styles.segment, connectionType === "wifi" && styles.segmentActive]}
            onPress={() => setConnectionType("wifi")}
          >
            <Wifi size={18} color={connectionType === "wifi" ? colors.surface : colors.plum} />
            <Text style={[styles.segmentText, connectionType === "wifi" && styles.segmentTextActive]}>Wi-Fi</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Informations</Text>
        <InfoRow
          icon={<Power size={20} color={colors.plum} />}
          label="État"
          value={isConnected ? "Connectée" : "Déconnectée"}
        />
        <InfoRow
          icon={<Battery size={20} color={colors.plum} />}
          label="Batterie"
          value={connectedDevice?.batteryPct ? `${connectedDevice.batteryPct}%` : "Non disponible"}
        />
        <InfoRow
          icon={<Info size={20} color={colors.plum} />}
          label="Signal"
          value={connectedDevice?.rssi ? `${connectedDevice.rssi} dBm` : "Non disponible"}
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Avant de connecter</Text>
        <Text style={styles.paragraph}>
          Activez la sonde, rapprochez-la du téléphone et vérifiez que les autorisations Bluetooth ou réseau sont
          {"acceptées. Sans sonde connectée, l'application garde le mode guidé sans mesure musculaire."}
        </Text>
      </View>

      <Pressable style={styles.primaryButton} onPress={() => router.push("/connect")}>
        <Text style={styles.primaryButtonText}>{isConnected ? "Changer de sonde" : "Connecter une sonde"}</Text>
      </Pressable>

      {isConnected ? (
        <Pressable style={styles.secondaryButton} onPress={disconnectLocal}>
          <Text style={styles.secondaryButtonText}>Déconnecter la sonde</Text>
        </Pressable>
      ) : null}
    </ScrollView>
  );
}

function InfoRow({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoLeft}>
        <View style={styles.infoIcon}>{icon}</View>
        <Text style={styles.infoLabel}>{label}</Text>
      </View>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: spacing.xl,
    paddingTop: 56,
    paddingBottom: 96,
    gap: spacing.xl,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    color: colors.plum,
    fontSize: 32,
    fontWeight: "900",
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 15,
    fontWeight: "600",
    marginTop: 2,
  },
  statusCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  statusIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  connectedIcon: {
    backgroundColor: colors.success,
  },
  disconnectedIcon: {
    backgroundColor: colors.plum,
  },
  statusText: {
    flex: 1,
  },
  statusTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "900",
  },
  statusDescription: {
    color: colors.textMuted,
    lineHeight: 20,
    fontWeight: "600",
    marginTop: 4,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
  },
  sectionTitle: {
    color: colors.plum,
    fontSize: 19,
    fontWeight: "900",
  },
  segmented: {
    flexDirection: "row",
    backgroundColor: colors.surfaceAlt,
    borderRadius: 999,
    padding: 4,
    gap: 4,
  },
  segment: {
    flex: 1,
    minHeight: 44,
    borderRadius: 999,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  segmentActive: {
    backgroundColor: colors.plum,
  },
  segmentText: {
    color: colors.plum,
    fontWeight: "900",
  },
  segmentTextActive: {
    color: colors.surface,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  infoLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  infoIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
  },
  infoLabel: {
    color: colors.text,
    fontWeight: "800",
  },
  infoValue: {
    color: colors.textMuted,
    fontWeight: "800",
    textAlign: "right",
    flexShrink: 1,
  },
  paragraph: {
    color: colors.textMuted,
    lineHeight: 22,
    fontWeight: "600",
  },
  primaryButton: {
    minHeight: 56,
    borderRadius: 999,
    backgroundColor: colors.plum,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
  },
  primaryButtonText: {
    color: colors.surface,
    fontSize: 16,
    fontWeight: "900",
  },
  secondaryButton: {
    minHeight: 54,
    borderRadius: 999,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
  },
  secondaryButtonText: {
    color: colors.danger,
    fontSize: 16,
    fontWeight: "900",
  },
});
