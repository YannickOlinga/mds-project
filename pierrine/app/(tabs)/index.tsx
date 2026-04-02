import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useState } from "react";
import { useEffect } from "react";

import { getDashboard } from "@/lib/api";

interface Session {
  id: number;
  title: string;
  duration: string;
  level: string;
  color: string;
}

export default function DashboardScreen() {
  const [streak, setStreak] = useState(7);
  const [sessionsThisWeek, setSessionsThisWeek] = useState(5);
  const [totalMinutes, setTotalMinutes] = useState(45);
  const [objectivePercent, setObjectivePercent] = useState(85);

  const [upcomingSessions, setUpcomingSessions] = useState<Session[]>([
    {
      id: 1,
      title: "Renforcement de base",
      duration: "15 min",
      level: "Débutant",
      color: "#B9657C",
    },
    {
      id: 2,
      title: "Contrôle musculaire",
      duration: "20 min",
      level: "Intermédiaire",
      color: "#6A1E3A",
    },
    {
      id: 3,
      title: "Endurance avancée",
      duration: "25 min",
      level: "Avancé",
      color: "#D4A5A5",
    },
  ]);

  const [tips, setTips] = useState([
    { id: 1, text: "Respirez profondément pendant les exercices", icon: "🌬️" },
    { id: 2, text: "Maintenez une posture droite", icon: "🧘" },
    { id: 3, text: "Hydratez-vous régulièrement", icon: "💧" },
  ]);

  const [device, setDevice] = useState({
    deviceName: "Périnea #A4F2B",
    batteryPct: 85,
    signalLevel: "Excellent",
    connected: true,
  });

  useEffect(() => {
    getDashboard(1)
      .then((data: any) => {
        setStreak(data.streak_days);
        setSessionsThisWeek(data.sessions_this_week);
        setTotalMinutes(data.total_minutes);
        setObjectivePercent(data.objective_percent);
        setUpcomingSessions(data.upcoming_sessions);
        setTips(data.tips);
        setDevice({
          deviceName: data.device.device_name,
          batteryPct: data.device.battery_pct,
          signalLevel: data.device.signal_level,
          connected: data.device.connected,
        });
      })
      .catch(() => {
        // Fallback: garde les données mock si le backend n'est pas accessible.
      });
  }, []);

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Bonjour !</Text>
          <Text style={styles.subtitle}>Votre allié périnée au quotidien</Text>
        </View>
        <View style={styles.streakBadge}>
          <Text style={styles.streakIcon}>🔥</Text>
          <Text style={styles.streakText}>{streak} jours</Text>
        </View>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{sessionsThisWeek}</Text>
          <Text style={styles.statLabel}>Séances</Text>
          <Text style={styles.statSublabel}>cette semaine</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{totalMinutes}</Text>
          <Text style={styles.statLabel}>Minutes</Text>
          <Text style={styles.statSublabel}>temps total</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{objectivePercent}%</Text>
          <Text style={styles.statLabel}>Objectif</Text>
          <Text style={styles.statSublabel}>atteint</Text>
        </View>
      </View>

      {/* Quick Start Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Commencer l&apos;entraînement</Text>
        <LinearGradient
          colors={["#B9657C", "#6A1E3A"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.quickStartCard}
        >
          <Pressable onPress={() => router.replace("/(tabs)/training" as any)}>
            <View style={styles.quickStartContent}>
              <Text style={styles.quickStartTitle}>Session rapide</Text>
              <Text style={styles.quickStartSubtitle}>10 minutes • Niveau débutants</Text>
              <View style={styles.playButton}>
                <Text style={styles.playIcon}>▶</Text>
              </View>
            </View>
          </Pressable>
        </LinearGradient>
      </View>

      {/* Upcoming Sessions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Séances à venir</Text>
        {upcomingSessions.map((session) => (
          <Pressable key={session.id} style={styles.sessionCard}>
            <View style={[styles.sessionColor, { backgroundColor: session.color }]} />
            <View style={styles.sessionInfo}>
              <Text style={styles.sessionTitle}>{session.title}</Text>
              <Text style={styles.sessionMeta}>
                {session.duration} • {session.level}
              </Text>
            </View>
            <Text style={styles.sessionArrow}>›</Text>
          </Pressable>
        ))}
      </View>

      {/* Daily Tips */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Conseils du jour</Text>
        {tips.map((tip) => (
          <View key={tip.id} style={styles.tipCard}>
            <Text style={styles.tipIcon}>{tip.icon}</Text>
            <Text style={styles.tipText}>{tip.text}</Text>
          </View>
        ))}
      </View>

      {/* Device Status */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Appareil</Text>
        <View style={styles.deviceCard}>
          <View style={styles.deviceIcon}>
            <Text style={styles.deviceIconText}>🦊</Text>
          </View>
          <View style={styles.deviceInfo}>
            <Text style={styles.deviceName}>{device.deviceName}</Text>
            <Text style={styles.deviceStatus}>
              {device.connected ? "Connecté" : "Non connecté"} • Batterie {device.batteryPct}%
            </Text>
          </View>
          <View style={styles.deviceStatusDot} />
        </View>
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
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 20,
  },
  greeting: {
    fontSize: 28,
    fontWeight: "800",
    color: "#5A1A30",
  },
  subtitle: {
    fontSize: 14,
    color: "#8A5A65",
    marginTop: 4,
  },
  streakBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF5F5",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E8D0D5",
  },
  streakIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  streakText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#6A1E3A",
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#FFF5F5",
    borderRadius: 20,
    padding: 16,
    marginHorizontal: 4,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#EAD7DA",
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "800",
    color: "#6A1E3A",
  },
  statLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#5A1A30",
    marginTop: 4,
  },
  statSublabel: {
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
  quickStartCard: {
    borderRadius: 24,
    padding: 20,
  },
  quickStartContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  quickStartTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#FFF5F5",
  },
  quickStartSubtitle: {
    fontSize: 12,
    color: "#F5D5DD",
    marginTop: 4,
  },
  playButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  playIcon: {
    color: "white",
    fontSize: 20,
    marginLeft: 4,
  },
  sessionCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF5F5",
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#EAD7DA",
  },
  sessionColor: {
    width: 4,
    height: 40,
    borderRadius: 2,
    marginRight: 12,
  },
  sessionInfo: {
    flex: 1,
  },
  sessionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#5A1A30",
  },
  sessionMeta: {
    fontSize: 12,
    color: "#8A5A65",
    marginTop: 2,
  },
  sessionArrow: {
    fontSize: 20,
    color: "#B9657C",
  },
  tipCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF5F5",
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
  },
  tipIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: "#5A1A30",
  },
  deviceCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF5F5",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#EAD7DA",
  },
  deviceIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#6A1E3A",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  deviceIconText: {
    fontSize: 20,
  },
  deviceInfo: {
    flex: 1,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#5A1A30",
  },
  deviceStatus: {
    fontSize: 12,
    color: "#6A1E3A",
    marginTop: 2,
  },
  deviceStatusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#4CAF50",
  },
});

