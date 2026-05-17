import { LinearGradient } from "expo-linear-gradient";
import { Activity, Battery, Cpu, Flame, Play, Signal } from "lucide-react-native";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import type { ReactNode } from "react";

import EmptyState from "@/components/ui/EmptyState";
import ErrorState from "@/components/ui/ErrorState";
import LoadingScreen from "@/components/ui/LoadingScreen";
import { colors, gradients } from "@/constants/theme/colors";
import { radius, spacing } from "@/constants/theme/spacing";
import { useDashboardQuery, useProfileQuery } from "@/hooks/useApiQueries";

function firstNameFromProfile(profileName?: string) {
  return profileName?.trim().split(" ")[0] ?? "Bonjour";
}

export default function DashboardScreen() {
  const dashboard = useDashboardQuery();
  const profile = useProfileQuery();

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

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
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

      {hasActivity ? (
        <View style={styles.statsContainer}>
          <Stat value={data.sessions_this_week} label="Séances" sub="semaine" />
          <Stat value={data.total_minutes} label="Minutes" sub="total" />
          <Stat value={`${data.objective_percent}%`} label="Objectif" sub="mensuel" />
        </View>
      ) : (
        <View style={styles.emptyCard}>
          <EmptyState
            title="Aucune session enregistrée"
            message="Les statistiques, objectifs et historiques apparaîtront uniquement après une session sauvegardée par le backend."
          />
          <LinearGradient colors={gradients.primary} style={styles.quickStartCard}>
            <Pressable style={styles.quickStartContent} onPress={() => router.push("/(tabs)/training")}>
              <View>
                <Text style={styles.quickStartTitle}>Commencer un entraînement</Text>
                <Text style={styles.quickStartSubtitle}>Choisir un programme réel depuis l’API</Text>
              </View>
              <View style={styles.playButton}>
                <Play size={22} color={colors.plum} fill={colors.surface} />
              </View>
            </Pressable>
          </LinearGradient>
        </View>
      )}

      <Section title="Appareil">
        <View style={styles.deviceCard}>
          <View style={styles.deviceIcon}>
            <Cpu size={20} color={colors.surface} />
          </View>
          <View style={styles.flex}>
            <Text style={styles.deviceName}>{data.device.device_name || "Aucune sonde connectée"}</Text>
            <Text style={styles.deviceStatus}>
              {data.device.connected ? `Connecté · ${data.device.battery_pct}%` : "Déconnecté"}
            </Text>
          </View>
          <View style={styles.deviceMetrics}>
            <Battery size={16} color={colors.plum} />
            <Signal size={16} color={colors.plum} />
          </View>
        </View>
        {!data.device.connected ? (
          <Pressable style={styles.connectLaterButton} onPress={() => router.push("/connect")}>
            <Text style={styles.connectLaterText}>Connecter une sonde</Text>
          </Pressable>
        ) : null}
      </Section>

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
      <Text style={styles.statNumber}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statSublabel}>{sub}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.xl, paddingTop: 56, paddingBottom: 120, gap: spacing.xl },
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
  statsContainer: { flexDirection: "row", gap: spacing.md },
  emptyCard: {
    gap: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  statCard: {
    flex: 1,
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingVertical: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statNumber: { fontSize: 23, fontWeight: "900", color: colors.plum },
  statLabel: { fontSize: 13, fontWeight: "800", color: colors.text, marginTop: 4 },
  statSublabel: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  quickStartCard: { borderRadius: radius.xl, overflow: "hidden" },
  quickStartContent: {
    padding: spacing.xl,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  quickStartTitle: { fontSize: 20, fontWeight: "900", color: colors.surface },
  quickStartSubtitle: { fontSize: 14, color: "rgba(255,255,255,0.82)", marginTop: 4 },
  playButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
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
  deviceCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  deviceIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.plum,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  deviceName: { fontSize: 16, fontWeight: "900", color: colors.text },
  deviceStatus: { fontSize: 13, color: colors.textMuted, marginTop: 3 },
  deviceMetrics: { flexDirection: "row", gap: 10 },
  connectLaterButton: {
    backgroundColor: colors.surface,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 12,
    alignItems: "center",
  },
  connectLaterText: {
    color: colors.plum,
    fontWeight: "900",
  },
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
