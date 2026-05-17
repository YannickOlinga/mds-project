import { LineChart } from "react-native-chart-kit";
import { Award, BadgeCheck, CalendarCheck, CalendarDays, Clock, Flame, ShieldCheck, Target, Timer } from "lucide-react-native";
import type { ReactNode } from "react";
import { Dimensions, ScrollView, StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Line, Polygon } from "react-native-svg";

import EmptyState from "@/components/ui/EmptyState";
import ErrorState from "@/components/ui/ErrorState";
import LoadingScreen from "@/components/ui/LoadingScreen";
import { colors } from "@/constants/theme/colors";
import { radius, spacing } from "@/constants/theme/spacing";
import { useProgressQuery } from "@/hooks/useApiQueries";

const screenWidth = Dimensions.get("window").width;

export default function ProgressScreen() {
  const progress = useProgressQuery();

  if (progress.isLoading) {
    return <LoadingScreen label="Chargement de vos progrès" />;
  }

  if (progress.isError) {
    return <ErrorState error={progress.error} onRetry={() => void progress.refetch()} />;
  }

  const data = progress.data;
  if (!data) {
    return <EmptyState title="Aucun progrès" message="Terminez une session pour afficher vos statistiques." />;
  }

  const weeklyValues = data.weekly.data.map((item) => item.value);
  const chartValues = weeklyValues.every((value) => value === 0) ? [0, 0, 0, 0, 0, 0, 0] : weeklyValues;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View>
        <Text style={styles.title}>Progrès</Text>
        <Text style={styles.subtitle}>Statistiques synchronisées avec votre historique</Text>
      </View>

      <View style={styles.statsGrid}>
        <Stat icon={<Award size={20} color={colors.plum} />} value={data.overall.sessions_total} label="Sessions" />
        <Stat icon={<Flame size={20} color={colors.plum} />} value={data.overall.streak_days} label="Streak" />
        <Stat icon={<Clock size={20} color={colors.plum} />} value={data.overall.time_total_formatted} label="Temps" />
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Minutes cette semaine</Text>
        <LineChart
          data={{
            labels: data.weekly.data.map((item) => item.day),
            datasets: [{ data: chartValues }],
          }}
          width={screenWidth - 48}
          height={210}
          yAxisSuffix="m"
          chartConfig={{
            backgroundGradientFrom: colors.surface,
            backgroundGradientTo: colors.surface,
            decimalPlaces: 0,
            color: () => colors.coral,
            labelColor: () => colors.textMuted,
            propsForDots: {
              r: "4",
              strokeWidth: "2",
              stroke: colors.plum,
            },
          }}
          bezier
          style={styles.chart}
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Radar d’activité</Text>
        <RadarChart
          values={[
            data.overall.sessions_total,
            data.overall.streak_days,
            data.overall.badges_count,
            data.monthly_goal.percent,
            data.overall.time_total_minutes,
          ]}
        />
      </View>

      <View style={styles.card}>
        <View style={styles.goalHeader}>
          <View>
            <Text style={styles.sectionTitle}>Objectif mensuel</Text>
            <Text style={styles.goalSubtitle}>{data.monthly_goal.remaining} sessions restantes</Text>
          </View>
          <Text style={styles.goalValue}>
            {data.monthly_goal.done}/{data.monthly_goal.target}
          </Text>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${Math.min(100, data.monthly_goal.percent)}%` }]} />
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.rowTitle}>
          <CalendarDays size={20} color={colors.plum} />
          <Text style={styles.sectionTitle}>Heatmap calendrier</Text>
        </View>
        <View style={styles.heatmap}>
          {data.weekly.data.map((item, index) => (
            <View key={`${item.day}-${index}`} style={styles.heatDay}>
              <View style={[styles.heatCell, { opacity: Math.max(0.2, item.value / Math.max(data.weekly.max_value, 1)) }]} />
              <Text style={styles.heatLabel}>{item.day}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Badges</Text>
        <View style={styles.badgeGrid}>
          {data.achievements.map((achievement) => (
            <View key={achievement.id} style={[styles.badge, !achievement.earned && styles.badgeLocked]}>
              <AchievementIcon name={achievement.icon} />
              <Text style={styles.badgeTitle}>{achievement.title}</Text>
              <Text style={styles.badgeDescription}>{achievement.description}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Historique récent</Text>
        {data.history.length === 0 ? (
          <EmptyState title="Aucune session" message="Vos sessions terminées apparaîtront ici." />
        ) : (
          data.history.map((item) => (
            <View key={item.id} style={styles.historyRow}>
              <View>
                <Text style={styles.historyDate}>{item.date}</Text>
                <Text style={styles.historyLevel}>{item.level}</Text>
              </View>
              <Text style={styles.historyMeta}>
                {item.duration} · {item.exercises} exercices
              </Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

function Stat({ icon, value, label }: { icon: ReactNode; value: string | number; label: string }) {
  return (
    <View style={styles.statCard}>
      {icon}
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function RadarChart({ values }: { values: number[] }) {
  const size = 220;
  const center = size / 2;
  const radiusValue = 82;
  const max = Math.max(...values, 1);
  const points = values.map((value, index) => {
    const angle = -Math.PI / 2 + (index * 2 * Math.PI) / values.length;
    const ratio = Math.min(1, value / max);
    return `${center + Math.cos(angle) * radiusValue * ratio},${center + Math.sin(angle) * radiusValue * ratio}`;
  });

  return (
    <View style={styles.radarWrap}>
      <Svg width={size} height={size}>
        {[0.33, 0.66, 1].map((ratio) => (
          <Circle key={ratio} cx={center} cy={center} r={radiusValue * ratio} stroke={colors.border} fill="none" />
        ))}
        {values.map((_, index) => {
          const angle = -Math.PI / 2 + (index * 2 * Math.PI) / values.length;
          return (
            <Line
              key={index}
              x1={center}
              y1={center}
              x2={center + Math.cos(angle) * radiusValue}
              y2={center + Math.sin(angle) * radiusValue}
              stroke={colors.border}
            />
          );
        })}
        <Polygon points={points.join(" ")} fill={`${colors.coral}55`} stroke={colors.plum} strokeWidth={2} />
      </Svg>
    </View>
  );
}

function AchievementIcon({ name }: { name: string }) {
  const props = { size: 24, color: colors.plum };
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
  content: { padding: spacing.xl, paddingTop: 56, paddingBottom: 120, gap: spacing.xl },
  title: { fontSize: 28, fontWeight: "900", color: colors.plum },
  subtitle: { color: colors.textMuted, marginTop: 4 },
  statsGrid: { flexDirection: "row", gap: spacing.md },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
    gap: 6,
  },
  statValue: { color: colors.plum, fontSize: 19, fontWeight: "900", textAlign: "center" },
  statLabel: { color: colors.textMuted, fontSize: 12, fontWeight: "700" },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
  },
  sectionTitle: { color: colors.plum, fontSize: 18, fontWeight: "900" },
  chart: { borderRadius: radius.lg, marginLeft: -18 },
  radarWrap: { alignItems: "center" },
  goalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  goalSubtitle: { color: colors.textMuted, marginTop: 4 },
  goalValue: { color: colors.plum, fontSize: 22, fontWeight: "900" },
  progressTrack: { height: 12, borderRadius: 99, backgroundColor: colors.border, overflow: "hidden" },
  progressFill: { height: "100%", backgroundColor: colors.coral },
  rowTitle: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  heatmap: { flexDirection: "row", gap: spacing.sm, justifyContent: "space-between" },
  heatDay: { flex: 1, alignItems: "center", gap: 6 },
  heatCell: { width: "100%", aspectRatio: 1, borderRadius: 8, backgroundColor: colors.coral },
  heatLabel: { color: colors.textMuted, fontSize: 12, fontWeight: "800" },
  badgeGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md },
  badge: {
    width: "47%",
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: 4,
  },
  badgeLocked: { opacity: 0.45 },
  badgeTitle: { color: colors.plum, fontWeight: "900" },
  badgeDescription: { color: colors.textMuted, fontSize: 12 },
  historyRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.md,
  },
  historyDate: { color: colors.text, fontWeight: "900" },
  historyLevel: { color: colors.textMuted, marginTop: 3 },
  historyMeta: { color: colors.plum, fontWeight: "800", textAlign: "right" },
});
