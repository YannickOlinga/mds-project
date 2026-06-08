import {
  Award,
  BadgeCheck,
  CalendarCheck,
  CheckCircle2,
  Gamepad2,
  Lock,
  Medal,
  ShieldCheck,
  Target,
  Timer,
} from "lucide-react-native";
import type { ReactNode } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";

import EmptyState from "@/components/ui/EmptyState";
import ErrorState from "@/components/ui/ErrorState";
import LoadingScreen from "@/components/ui/LoadingScreen";
import { colors } from "@/constants/theme/colors";
import { radius, spacing } from "@/constants/theme/spacing";
import { useProgressQuery } from "@/hooks/useApiQueries";
import type { Achievement } from "@/types/api";

export default function ChallengesScreen() {
  const progress = useProgressQuery();

  if (progress.isLoading) {
    return <LoadingScreen label="Chargement des challenges" />;
  }

  if (progress.isError) {
    return <ErrorState error={progress.error} onRetry={() => void progress.refetch()} />;
  }

  const data = progress.data;
  if (!data || data.achievements.length === 0) {
    return (
      <EmptyState
        title="Aucun challenge"
        message="Les challenges apparaîtront après vos premières séances terminées."
      />
    );
  }

  const earned = data.achievements.filter((item) => item.earned);
  const inProgress = data.achievements.filter((item) => !item.earned);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.title}>Challenges</Text>
          <Text style={styles.subtitle}>
            {"Badges gagnés uniquement avec vos vraies sessions enregistrées."}
          </Text>
        </View>
      </View>

      {/* Hub des mini-jeux */}
      <Pressable style={styles.gameCard} onPress={() => router.push("/game-hub")}>
        <View style={styles.gameIconWrap}>
          <Gamepad2 size={26} color="#FFFFFF" />
        </View>
        <View style={styles.gameText}>
          <Text style={styles.gameTitle}>Exercices Interactifs</Text>
          <Text style={styles.gameSub}>4 jeux · Papillon · Bulles · Éclipse · La Source</Text>
        </View>
        <Text style={styles.gameArrow}>›</Text>
      </Pressable>

      <View style={styles.summaryCard}>
        <SummaryItem value={earned.length} label="Badges gagnés" icon={<Medal size={20} color={colors.plum} />} />
        <SummaryItem
          value={inProgress.length}
          label="À débloquer"
          icon={<Lock size={20} color={colors.plum} />}
        />
        <SummaryItem
          value={data.overall.sessions_total}
          label="Sessions"
          icon={<CheckCircle2 size={20} color={colors.plum} />}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>À débloquer</Text>
        {inProgress.length === 0 ? (
          <View style={styles.doneCard}>
            <BadgeCheck size={22} color={colors.plum} />
            <Text style={styles.doneText}>Tous les badges disponibles sont gagnés.</Text>
          </View>
        ) : (
          inProgress.map((achievement) => (
            <ChallengeCard key={achievement.id} achievement={achievement} />
          ))
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Badges gagnés</Text>
        {earned.length === 0 ? (
          <View style={styles.doneCard}>
            <Lock size={22} color={colors.plum} />
            <Text style={styles.doneText}>
              Terminez une première session pour gagner votre premier badge.
            </Text>
          </View>
        ) : (
          earned.map((achievement) => (
            <ChallengeCard key={achievement.id} achievement={achievement} />
          ))
        )}
      </View>
    </ScrollView>
  );
}

function SummaryItem({ value, label, icon }: { value: string | number; label: string; icon: ReactNode }) {
  return (
    <View style={styles.summaryItem}>
      {icon}
      <Text style={styles.summaryValue}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

function ChallengeCard({ achievement }: { achievement: Achievement }) {
  const progress = achievement.progress ?? (achievement.earned ? 1 : 0);
  const target = achievement.target ?? 1;
  const percent = Math.max(0, Math.min(100, achievement.percent ?? Math.round((progress / target) * 100)));

  return (
    <View style={[styles.challengeCard, achievement.earned && styles.challengeCardEarned]}>
      <View style={styles.challengeTop}>
        <View style={[styles.badgeIcon, achievement.earned && styles.badgeIconEarned]}>
          <AchievementIcon name={achievement.icon} earned={achievement.earned} />
        </View>
        <View style={styles.challengeText}>
          <Text style={styles.challengeTitle}>{achievement.title}</Text>
          <Text style={styles.challengeDescription}>{achievement.description}</Text>
        </View>
        {achievement.earned ? (
          <CheckCircle2 size={22} color={colors.success} />
        ) : (
          <Lock size={20} color={colors.textMuted} />
        )}
      </View>

      <View style={styles.progressRow}>
        <Text style={styles.progressText}>
          {achievement.earned ? "Badge gagné" : `${progress}/${target}`}
        </Text>
        <Text style={styles.progressText}>{percent}%</Text>
      </View>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${percent}%` }]} />
      </View>
    </View>
  );
}

function AchievementIcon({ name, earned }: { name: string; earned: boolean }) {
  const props = { size: 23, color: earned ? colors.surface : colors.plum, strokeWidth: 2.4 };
  switch (name) {
    case "target":
      return <Target {...props} />;
    case "calendar-check":
      return <CalendarCheck {...props} />;
    case "award":
      return <Award {...props} />;
    case "shield-check":
      return <ShieldCheck {...props} />;
    case "timer":
      return <Timer {...props} />;
    default:
      return <BadgeCheck {...props} />;
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.xl, paddingTop: 58, paddingBottom: 120, gap: spacing.xl },
  header: {
    gap: spacing.sm,
  },
  headerText: {
    flex: 1,
  },
  title: { color: colors.plum, fontSize: 32, fontWeight: "900", letterSpacing: 0 },
  subtitle: { color: colors.textMuted, marginTop: 4, lineHeight: 20 },
  summaryCard: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    padding: spacing.lg,
  },
  summaryItem: { flex: 1, alignItems: "center", gap: 5 },
  summaryValue: { color: colors.plum, fontSize: 20, fontWeight: "900" },
  summaryLabel: { color: colors.textMuted, fontSize: 11, fontWeight: "800", textAlign: "center" },
  section: { gap: spacing.md },
  sectionTitle: { color: colors.plum, fontSize: 20, fontWeight: "900" },
  challengeCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    padding: spacing.lg,
    gap: spacing.md,
  },
  challengeCardEarned: {
    backgroundColor: colors.surfaceAlt,
    borderColor: colors.blush,
  },
  challengeTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  badgeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeIconEarned: {
    backgroundColor: colors.plum,
  },
  challengeText: { flex: 1, minWidth: 0 },
  challengeTitle: { color: colors.text, fontSize: 17, fontWeight: "900" },
  challengeDescription: { color: colors.textMuted, marginTop: 3, lineHeight: 19 },
  progressRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  progressText: { color: colors.plum, fontSize: 13, fontWeight: "900" },
  progressTrack: {
    height: 10,
    backgroundColor: colors.border,
    borderRadius: 99,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: colors.coral,
    borderRadius: 99,
  },
  doneCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  doneText: { color: colors.textMuted, flex: 1, fontWeight: "700", lineHeight: 20 },
  gameCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.plum,
    borderRadius: radius.xl,
    padding: spacing.lg,
  },
  gameIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  gameText: { flex: 1, minWidth: 0 },
  gameTitle: { color: "#FFFFFF", fontSize: 18, fontWeight: "900" },
  gameSub: { color: "rgba(255,255,255,0.72)", fontSize: 13, marginTop: 3 },
  gameArrow: { color: "rgba(255,255,255,0.6)", fontSize: 28, fontWeight: "300" },
});
