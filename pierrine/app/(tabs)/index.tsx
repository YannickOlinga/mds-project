import { LinearGradient } from "expo-linear-gradient";
import {
  Activity,
  Bluetooth,
  BluetoothConnected,
  CalendarCheck2,
  ChevronRight,
  Flame,
  Gamepad2,
  Play,
} from "lucide-react-native";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import type { ReactNode } from "react";

import BrandLogo from "@/components/ui/BrandLogo";
import SondeViewer from "@/components/SondeViewer";
import EmptyState from "@/components/ui/EmptyState";
import ErrorState from "@/components/ui/ErrorState";
import LoadingScreen from "@/components/ui/LoadingScreen";
import { colors, gradients } from "@/constants/theme/colors";
import { radius, spacing } from "@/constants/theme/spacing";
import { useDashboardQuery, useProfileQuery } from "@/hooks/useApiQueries";
import { useDeviceStore } from "@/store/deviceStore";

function firstNameFromProfile(profileName?: string) {
  return profileName?.trim().split(" ")[0] ?? "Bonjour";
}

export default function DashboardScreen() {
  const dashboard = useDashboardQuery();
  const profile = useProfileQuery();
  const localDeviceState = useDeviceStore((state) => state.state);
  const localDevice = useDeviceStore((state) => state.connectedDevice);
  const connectionType = useDeviceStore((state) => state.connectionType);

  if (dashboard.isLoading || profile.isLoading) {
    return <LoadingScreen label="Chargement de votre tableau de bord" />;
  }

  if (dashboard.isError) {
    return <ErrorState error={dashboard.error} onRetry={() => void dashboard.refetch()} />;
  }

  const data = dashboard.data;
  if (!data) {
    return <EmptyState title="Aucune donnée" message="Votre tableau de bord sera disponible après connexion." />;
  }

  const name = profile.data?.personalInfo.find((item) => item.label === "Nom")?.value;
  const totalSessions = profile.data?.stats.sessions_total ?? 0;
  const hasActivity = totalSessions > 0;
  const isProbeConnected = localDeviceState === "connected" || data.device.connected;
  const deviceName = localDevice?.name || data.device.device_name;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.logoWrap}>
        <BrandLogo />
      </View>

      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Bonjour {firstNameFromProfile(name)}</Text>
          <Text style={styles.subtitle}>
            {hasActivity ? "Suivi basé sur vos sessions enregistrées" : "Aucune donnée de suivi enregistrée"}
          </Text>
        </View>
        {hasActivity ? (
          <View style={styles.streakBadge}>
            <Flame size={17} color={colors.plum} />
            <Text style={styles.streakText}>{data.streak_days} j</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.probeHeroCard}>
        <View style={styles.probeVisual}>
          <SondeViewer variant="violet" size={150} />
          <View style={[styles.probeStatusBadge, isProbeConnected ? styles.probeStatusConnected : styles.probeStatusIdle]}>
            {isProbeConnected ? (
              <BluetoothConnected size={18} color={colors.surface} />
            ) : (
              <Bluetooth size={18} color={colors.surface} />
            )}
          </View>
        </View>

        <View style={styles.probeContent}>
          <Text style={styles.probeEyebrow}>Sonde Périnéa</Text>
          <Text style={styles.probeTitle}>
            {isProbeConnected ? deviceName || "Sonde connectée" : "Aucune sonde connectée"}
          </Text>
          <Text style={styles.probeText}>
            {isProbeConnected
              ? `Connexion ${connectionType === "wifi" ? "Wi-Fi" : "Bluetooth"} active. Les exercices interactifs peuvent utiliser la sonde.`
              : "Connectez votre sonde pour mesurer les exercices, ou continuez avec le mode tactile sans score musculaire."}
          </Text>

          <View style={styles.probeActions}>
            <Pressable style={styles.probePrimaryButton} onPress={() => router.push("/connect")}>
              <Bluetooth size={18} color={colors.surface} />
              <Text style={styles.probePrimaryText}>
                {isProbeConnected ? "Gérer la sonde" : "Connecter la sonde"}
              </Text>
              <ChevronRight size={18} color={colors.surface} />
            </Pressable>
            <Pressable style={styles.probeSecondaryButton} onPress={() => router.push("/game-hub" as never)}>
              <Gamepad2 size={17} color={colors.plum} />
              <Text style={styles.probeSecondaryText}>Mode tactile</Text>
            </Pressable>
          </View>
        </View>
      </View>

      {hasActivity ? (
        <View style={styles.statsContainer}>
          <Stat value={data.sessions_this_week} label="Séances" sub="semaine" />
          <Stat value={data.total_time_formatted} label="Temps" sub="total" />
          <Stat value={`${data.objective_percent}%`} label="Objectif" sub="mensuel" />
        </View>
      ) : (
        <View style={styles.emptyCard}>
          <EmptyState
            title="Aucune session enregistrée"
            message="Vos statistiques, objectifs et historiques apparaîtront après votre première séance terminée."
          />
          <LinearGradient colors={gradients.primary} style={styles.quickStartCard}>
            <Pressable style={styles.quickStartContent} onPress={() => router.push("/(tabs)/training")}>
              <View style={styles.quickStartTextBlock}>
                <Text style={styles.quickStartTitle}>Commencer un entraînement</Text>
                <Text style={styles.quickStartSubtitle}>Choisir un programme adapté à mon profil</Text>
              </View>
              <View style={styles.playButton}>
                <Play size={22} color={colors.plum} fill={colors.surface} />
              </View>
            </Pressable>
          </LinearGradient>
        </View>
      )}

      {!isProbeConnected ? (
        <View style={styles.noProbeCard}>
          <View style={styles.noProbeIcon}>
            <CalendarCheck2 size={22} color={colors.surface} />
          </View>
          <View style={styles.flex}>
            <Text style={styles.noProbeTitle}>Mode sans sonde</Text>
            <Text style={styles.noProbeText}>
              {
                "Vous pouvez suivre des séances guidées au minuteur. L'app enregistre uniquement les sessions réalisées, le temps d'entraînement et la régularité."
              }
            </Text>
          </View>
        </View>
      ) : null}

      <Section title="Conseils">
        {data.tips.map((tip) => (
          <View key={tip.id} style={styles.tipCard}>
            <Activity size={18} color={colors.plum} />
            <Text style={styles.tipText}>{tip.text}</Text>
          </View>
        ))}
      </Section>
    </ScrollView>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function Stat({ value, label, sub }: { value: string | number; label: string; sub: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statNumber} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.7}>
        {value}
      </Text>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statSublabel}>{sub}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.xl, paddingTop: 44, paddingBottom: 120, gap: spacing.xl },
  logoWrap: {
    alignItems: "center",
    marginBottom: -8,
  },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  greeting: { fontSize: 28, fontWeight: "900", color: colors.plum },
  subtitle: { fontSize: 14, color: colors.textMuted, marginTop: 4 },
  streakBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 999,
  },
  streakText: { fontWeight: "800", color: colors.plum },
  statsContainer: { flexDirection: "row", gap: spacing.sm },
  probeHeroCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.lg,
    overflow: "hidden",
  },
  probeVisual: {
    height: 164,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.xl,
    position: "relative",
  },
  probeStatusBadge: {
    position: "absolute",
    right: spacing.md,
    bottom: spacing.md,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  probeStatusConnected: {
    backgroundColor: colors.success,
  },
  probeStatusIdle: {
    backgroundColor: colors.plum,
  },
  probeContent: {
    gap: spacing.sm,
  },
  probeEyebrow: {
    color: colors.coral,
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  probeTitle: {
    color: colors.plum,
    fontSize: 22,
    fontWeight: "900",
  },
  probeText: {
    color: colors.textMuted,
    lineHeight: 21,
    fontWeight: "600",
  },
  probeActions: {
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  probePrimaryButton: {
    minHeight: 54,
    borderRadius: 999,
    backgroundColor: colors.plum,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  probePrimaryText: {
    color: colors.surface,
    fontWeight: "900",
    fontSize: 15,
    flexShrink: 1,
    textAlign: "center",
  },
  probeSecondaryButton: {
    minHeight: 48,
    borderRadius: 999,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  probeSecondaryText: {
    color: colors.plum,
    fontWeight: "900",
    fontSize: 14,
  },
  emptyCard: {
    gap: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  noProbeCard: {
    flexDirection: "row",
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  noProbeIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.coral,
    alignItems: "center",
    justifyContent: "center",
  },
  noProbeTitle: { color: colors.plum, fontSize: 17, fontWeight: "900" },
  noProbeText: { color: colors.textMuted, marginTop: 5, lineHeight: 20 },
  statCard: {
    flex: 1,
    minWidth: 0,
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statNumber: {
    color: colors.plum,
    fontSize: 22,
    fontWeight: "900",
    lineHeight: 25,
    minHeight: 52,
    textAlign: "center",
    width: "100%",
  },
  statLabel: { fontSize: 13, fontWeight: "800", color: colors.text, marginTop: 4 },
  statSublabel: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  quickStartCard: { borderRadius: radius.xl, overflow: "hidden" },
  quickStartContent: {
    padding: spacing.xl,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  quickStartTextBlock: {
    flex: 1,
    minWidth: 0,
  },
  quickStartTitle: { fontSize: 20, fontWeight: "900", color: colors.surface, lineHeight: 24 },
  quickStartSubtitle: { fontSize: 14, color: "rgba(255,255,255,0.82)", marginTop: 4 },
  playButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  section: { gap: spacing.md },
  sectionTitle: { fontSize: 18, fontWeight: "900", color: colors.plum },
  sessionCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sessionColor: { width: 5, height: 44, borderRadius: 99 },
  sessionTitle: { fontSize: 16, fontWeight: "800", color: colors.text },
  sessionMeta: { fontSize: 13, color: colors.textMuted, marginTop: 3 },
  tipCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: radius.lg,
  },
  tipText: { flex: 1, color: colors.text, fontWeight: "600" },
  flex: { flex: 1 },
});
