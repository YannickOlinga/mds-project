import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { router } from "expo-router";

interface StatData {
  day: string;
  value: number;
}

interface Achievement {
  id: number;
  title: string;
  description: string;
  icon: string;
  earned: boolean;
}

export default function ProgressScreen() {
  const weeklyData: StatData[] = [
    { day: "L", value: 60 },
    { day: "M", value: 80 },
    { day: "M", value: 45 },
    { day: "J", value: 90 },
    { day: "V", value: 70 },
    { day: "S", value: 30 },
    { day: "D", value: 50 },
  ];

  const achievements: Achievement[] = [
    { id: 1, title: "Premiers pas", description: "Première session complétée", icon: "🎯", earned: true },
    { id: 2, title: "Régularité", description: "7 jours consécutifs", icon: "🔥", earned: true },
    { id: 3, title: "Athlète", description: "10 sessions complétées", icon: "🏆", earned: true },
    { id: 4, title: "Maître", description: "50 sessions complétées", icon: "👑", earned: false },
    { id: 5, title: "Éclair", description: "Session rapide terminée", icon: "⚡", earned: true },
    { id: 6, title: "Persévérance", description: "30 jours d'entraînement", icon: "💎", earned: false },
  ];

  const history = [
    { id: 1, date: "Aujourd'hui", duration: "15 min", exercises: 4, level: "Débutant" },
    { id: 2, date: "Hier", duration: "20 min", exercises: 5, level: "Intermédiaire" },
    { id: 3, date: "Il y a 2 jours", duration: "15 min", exercises: 4, level: "Débutant" },
    { id: 4, date: "Il y a 3 jours", duration: "10 min", exercises: 3, level: "Débutant" },
    { id: 5, date: "Il y a 4 jours", duration: "25 min", exercises: 6, level: "Intermédiaire" },
  ];

  const maxValue = Math.max(...weeklyData.map((d) => d.value));

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Progrès</Text>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.back}>← Retour</Text>
        </Pressable>
      </View>

      {/* Overall Stats */}
      <View style={styles.overallStats}>
        <View style={styles.overallCard}>
          <Text style={styles.overallNumber}>23</Text>
          <Text style={styles.overallLabel}>Sessions</Text>
          <Text style={styles.overallSublabel}>totales</Text>
        </View>
        <View style={styles.overallCard}>
          <Text style={styles.overallNumber}>7</Text>
          <Text style={styles.overallLabel}>Jours</Text>
          <Text style={styles.overallSublabel}>consécutifs</Text>
        </View>
        <View style={styles.overallCard}>
          <Text style={styles.overallNumber}>6h 45</Text>
          <Text style={styles.overallLabel}>Temps</Text>
          <Text style={styles.overallSublabel}>total</Text>
        </View>
      </View>

      {/* Weekly Chart */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Cette semaine</Text>
        <View style={styles.chartCard}>
          <View style={styles.chart}>
            {weeklyData.map((item, index) => (
              <View key={index} style={styles.chartColumn}>
                <View style={styles.chartBarContainer}>
                  <View
                    style={[
                      styles.chartBar,
                      {
                        height: (item.value / maxValue) * 100,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.chartLabel}>{item.day}</Text>
              </View>
            ))}
          </View>
          <View style={styles.chartLegend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: "#B9657C" }]} />
              <Text style={styles.legendText}>Minutes d'exercice</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Monthly Goal */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Objectif mensuel</Text>
        <View style={styles.goalCard}>
          <View style={styles.goalHeader}>
            <Text style={styles.goalTitle}>Sessions complétées</Text>
            <Text style={styles.goalValue}>18 / 25</Text>
          </View>
          <View style={styles.goalProgress}>
            <View style={styles.goalProgressBar}>
              <View style={[styles.goalProgressFill, { width: "72%" }]} />
            </View>
          </View>
          <Text style={styles.goalSubtitle}>7 sessions restantes ce mois-ci</Text>
        </View>
      </View>

      {/* Achievements */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Badges obtenus</Text>
        <View style={styles.achievementsGrid}>
          {achievements.slice(0, 4).map((achievement) => (
            <View
              key={achievement.id}
              style={[
                styles.achievementCard,
                !achievement.earned && styles.achievementLocked,
              ]}
            >
              <Text style={styles.achievementIcon}>{achievement.icon}</Text>
              <Text
                style={[
                  styles.achievementTitle,
                  !achievement.earned && styles.achievementTitleLocked,
                ]}
              >
                {achievement.title}
              </Text>
            </View>
          ))}
        </View>
        <Pressable style={styles.viewAllButton}>
          <Text style={styles.viewAllText}>Voir tous les badges →</Text>
        </Pressable>
      </View>

      {/* History */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Historique récent</Text>
        {history.map((item, index) => (
          <View key={item.id} style={styles.historyCard}>
            <View style={styles.historyLeft}>
              <Text style={styles.historyDate}>{item.date}</Text>
              <Text style={styles.historyLevel}>{item.level}</Text>
            </View>
            <View style={styles.historyRight}>
              <View style={styles.historyStat}>
                <Text style={styles.historyStatIcon}>⏱️</Text>
                <Text style={styles.historyStatText}>{item.duration}</Text>
              </View>
              <View style={styles.historyStat}>
                <Text style={styles.historyStatIcon}>💪</Text>
                <Text style={styles.historyStatText}>{item.exercises}</Text>
              </View>
            </View>
          </View>
        ))}
      </View>

      {/* Bottom spacing */}
      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5ECEC",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 50,
    paddingBottom: 20,
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 20,
    fontWeight: "800",
    color: "#5A1A30",
    marginRight: 40,
  },
  back: {
    color: "#9B6A75",
    fontSize: 16,
  },
  overallStats: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  overallCard: {
    flex: 1,
    backgroundColor: "#FFF5F5",
    borderRadius: 20,
    padding: 16,
    marginHorizontal: 4,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#EAD7DA",
  },
  overallNumber: {
    fontSize: 24,
    fontWeight: "800",
    color: "#6A1E3A",
  },
  overallLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#5A1A30",
    marginTop: 4,
  },
  overallSublabel: {
    fontSize: 10,
    color: "#8A5A65",
  },
  section: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#5A1A30",
    marginBottom: 12,
  },
  chartCard: {
    backgroundColor: "#FFF5F5",
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: "#EAD7DA",
  },
  chart: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    height: 120,
    paddingBottom: 12,
  },
  chartColumn: {
    alignItems: "center",
    flex: 1,
  },
  chartBarContainer: {
    height: 100,
    justifyContent: "flex-end",
  },
  chartBar: {
    width: 24,
    backgroundColor: "#B9657C",
    borderRadius: 8,
    minHeight: 8,
  },
  chartLabel: {
    fontSize: 11,
    color: "#8A5A65",
    marginTop: 8,
    fontWeight: "600",
  },
  chartLegend: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#EAD7DA",
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    color: "#8A5A65",
  },
  goalCard: {
    backgroundColor: "#FFF5F5",
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: "#EAD7DA",
  },
  goalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  goalTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#5A1A30",
  },
  goalValue: {
    fontSize: 16,
    fontWeight: "800",
    color: "#6A1E3A",
  },
  goalProgress: {
    marginBottom: 8,
  },
  goalProgressBar: {
    height: 12,
    backgroundColor: "#EAD7DA",
    borderRadius: 6,
    overflow: "hidden",
  },
  goalProgressFill: {
    height: "100%",
    backgroundColor: "#B9657C",
    borderRadius: 6,
  },
  goalSubtitle: {
    fontSize: 12,
    color: "#8A5A65",
  },
  achievementsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  achievementCard: {
    width: "47%",
    backgroundColor: "#FFF5F5",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#EAD7DA",
  },
  achievementLocked: {
    opacity: 0.5,
    backgroundColor: "#F0E0E3",
  },
  achievementIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  achievementTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#5A1A30",
    textAlign: "center",
  },
  achievementTitleLocked: {
    color: "#8A5A65",
  },
  viewAllButton: {
    marginTop: 16,
    alignItems: "center",
    padding: 10,
  },
  viewAllText: {
    fontSize: 14,
    color: "#B9657C",
    fontWeight: "600",
  },
  historyCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FFF5F5",
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#EAD7DA",
  },
  historyLeft: {},
  historyDate: {
    fontSize: 14,
    fontWeight: "600",
    color: "#5A1A30",
  },
  historyLevel: {
    fontSize: 12,
    color: "#8A5A65",
    marginTop: 2,
  },
  historyRight: {
    flexDirection: "row",
    gap: 16,
  },
  historyStat: {
    flexDirection: "row",
    alignItems: "center",
  },
  historyStatIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  historyStatText: {
    fontSize: 13,
    color: "#6A1E3A",
    fontWeight: "600",
  },
});

