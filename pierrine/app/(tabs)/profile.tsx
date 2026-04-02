import { View, Text, StyleSheet, ScrollView, Pressable, Switch } from "react-native";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";

import { getMeProfile, updateMeProfileSettings } from "@/lib/api";

interface SettingItem {
  id: number;
  title: string;
  subtitle: string;
  icon: string;
  type: "info" | "toggle" | "navigate";
}

export default function ProfileScreen() {
  const [reminders, setReminders] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  const [personalInfo, setPersonalInfo] = useState([
    { label: "Nom", value: "Marie Dupont" },
    { label: "Email", value: "marie.dupont@email.com" },
    { label: "Âge", value: "34 ans" },
    { label: "Objectif", value: "Renforcement du périnée" },
  ]);

  const [profileName, setProfileName] = useState("Marie Dupont");
  const [profileEmail, setProfileEmail] = useState("marie.dupont@email.com");
  const [levelLabel, setLevelLabel] = useState("Débutante");

  const [stats, setStats] = useState({
    sessions_total: 23,
    time_total_formatted: "6h 45",
    streak_days: 7,
    badges_count: 4,
  });

  const [device, setDevice] = useState({
    device_name: "Périnea #A4F2B",
    battery_pct: 85,
    connected: true,
  });

  const settings: SettingItem[] = [
    { id: 1, title: "Rappels quotidiens", subtitle: "Recevez des rappels pour vos séances", icon: "🔔", type: "toggle" },
    { id: 2, title: "Notifications", subtitle: "Gérez vos notifications", icon: "📱", type: "toggle" },
    { id: 3, title: "Objectifs personnels", subtitle: "Définissez vos objectifs", icon: "🎯", type: "navigate" },
    { id: 4, title: "Historique complet", subtitle: "Voir tout l'historique", icon: "📊", type: "navigate" },
    { id: 5, title: "Guide de démarrage", subtitle: "Apprenez à utiliser l'app", icon: "📖", type: "navigate" },
    { id: 6, title: "FAQ", subtitle: "Questions fréquentes", icon: "❓", type: "navigate" },
    { id: 7, title: "Confidentialité", subtitle: "Gérer vos données", icon: "🔒", type: "navigate" },
    { id: 8, title: "Nous contacter", subtitle: "Support et assistance", icon: "✉️", type: "navigate" },
  ];

  const initials = useMemo(() => {
    const parts = profileName.split(" ").filter(Boolean);
    const a = parts[0]?.[0] ?? "M";
    const b = parts[1]?.[0] ?? "D";
    return `${a}${b}`.toUpperCase();
  }, [profileName]);

  useEffect(() => {
    getMeProfile(1)
      .then((data) => {
        setPersonalInfo(data.personalInfo);
        setReminders(data.settings.reminders);
        setNotifications(data.settings.notifications);
        setDarkMode(data.settings.darkMode);
        setStats(data.stats);
        setLevelLabel(data.level.label);
        if (data.device) setDevice(data.device);

        const nameRow = data.personalInfo.find((x: any) => x.label === "Nom");
        const emailRow = data.personalInfo.find((x: any) => x.label === "Email");
        if (nameRow?.value) setProfileName(nameRow.value);
        if (emailRow?.value) setProfileEmail(emailRow.value);
      })
      .catch(() => {
        // fallback: conserve la démo locale
      });
  }, []);

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profil</Text>
      </View>

      {/* Profile Card */}
      <View style={styles.profileCard}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <Text style={styles.userName}>{profileName}</Text>
        <Text style={styles.userEmail}>{profileEmail}</Text>
        <View style={styles.levelBadge}>
          <Text style={styles.levelText}>Niveau: {levelLabel}</Text>
        </View>
      </View>

      {/* Personal Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Informations personnelles</Text>
        <View style={styles.infoCard}>
          {personalInfo.map((item, index) => (
            <View
              key={index}
              style={[styles.infoRow, index !== personalInfo.length - 1 && styles.infoRowBorder]}
            >
              <Text style={styles.infoLabel}>{item.label}</Text>
              <Text style={styles.infoValue}>{item.value}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Stats Summary */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Vos statistiques</Text>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.sessions_total}</Text>
            <Text style={styles.statLabel}>Sessions</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.time_total_formatted}</Text>
            <Text style={styles.statLabel}>Temps</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.streak_days}</Text>
            <Text style={styles.statLabel}>Jours</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.badges_count}</Text>
            <Text style={styles.statLabel}>Badges</Text>
          </View>
        </View>
      </View>

      {/* Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Paramètres</Text>
        <View style={styles.settingsCard}>
          {settings.map((setting, index) => (
            <Pressable
              key={setting.id}
              style={[styles.settingRow, index !== settings.length - 1 && styles.settingRowBorder]}
            >
              <View style={styles.settingLeft}>
                <Text style={styles.settingIcon}>{setting.icon}</Text>
                <View style={styles.settingText}>
                  <Text style={styles.settingTitle}>{setting.title}</Text>
                  <Text style={styles.settingSubtitle}>{setting.subtitle}</Text>
                </View>
              </View>
              <View style={styles.settingRight}>
                {setting.type === "toggle" && (
                  <Switch
                    value={setting.id === 1 ? reminders : notifications}
                    onValueChange={(value) => {
                      if (setting.id === 1) {
                        setReminders(value);
                        updateMeProfileSettings({ reminders: value }, 1).catch(() => {});
                      } else {
                        setNotifications(value);
                        updateMeProfileSettings({ notifications: value }, 1).catch(() => {});
                      }
                    }}
                    trackColor={{ false: "#EAD7DA", true: "#B9657C" }}
                    thumbColor={"#FFF5F5"}
                  />
                )}
                {setting.type === "navigate" && (
                  <Text style={styles.navigateArrow}>›</Text>
                )}
              </View>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Device Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Appareil connecté</Text>
        <View style={styles.deviceCard}>
          <View style={styles.deviceIcon}>
            <Text style={styles.deviceIconText}>🦊</Text>
          </View>
          <View style={styles.deviceInfo}>
            <Text style={styles.deviceName}>{device.device_name}</Text>
            <Text style={styles.deviceStatus}>
              {device.connected ? "Connecté" : "Non connecté"} • Batterie {device.battery_pct}%
            </Text>
          </View>
          <View style={styles.deviceActions}>
            <Pressable style={styles.deviceButton}>
              <Text style={styles.deviceButtonText}>Gérer</Text>
            </Pressable>
          </View>
        </View>
      </View>

      {/* Version Info */}
      <View style={styles.footer}>
        <Text style={styles.versionText}>Pierrine v1.0.0</Text>
        <Text style={styles.copyrightText}>© 2024 Pierrine. Tous droits réservés.</Text>
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
    paddingHorizontal: 24,
    paddingTop: 50,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#5A1A30",
    textAlign: "center",
  },
  profileCard: {
    alignItems: "center",
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#6A1E3A",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: "700",
    color: "#FFF5F5",
  },
  userName: {
    fontSize: 22,
    fontWeight: "800",
    color: "#5A1A30",
  },
  userEmail: {
    fontSize: 14,
    color: "#8A5A65",
    marginTop: 4,
  },
  levelBadge: {
    backgroundColor: "#B9657C",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 6,
    marginTop: 12,
  },
  levelText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FFF5F5",
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
  infoCard: {
    backgroundColor: "#FFF5F5",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "#EAD7DA",
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  infoRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#EAD7DA",
  },
  infoLabel: {
    fontSize: 14,
    color: "#8A5A65",
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#5A1A30",
  },
  statsRow: {
    flexDirection: "row",
    backgroundColor: "#FFF5F5",
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: "#EAD7DA",
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statNumber: {
    fontSize: 20,
    fontWeight: "800",
    color: "#6A1E3A",
  },
  statLabel: {
    fontSize: 11,
    color: "#8A5A65",
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: "#EAD7DA",
    marginHorizontal: 8,
  },
  settingsCard: {
    backgroundColor: "#FFF5F5",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#EAD7DA",
  },
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
  },
  settingRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#EAD7DA",
  },
  settingLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  settingIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#5A1A30",
  },
  settingSubtitle: {
    fontSize: 12,
    color: "#8A5A65",
    marginTop: 2,
  },
  settingRight: {
    marginLeft: 12,
  },
  navigateArrow: {
    fontSize: 20,
    color: "#B9657C",
    fontWeight: "600",
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
    fontSize: 15,
    fontWeight: "700",
    color: "#5A1A30",
  },
  deviceStatus: {
    fontSize: 12,
    color: "#6A1E3A",
    marginTop: 2,
  },
  deviceActions: {},
  deviceButton: {
    backgroundColor: "#B9657C",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  deviceButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FFF5F5",
  },
  footer: {
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  versionText: {
    fontSize: 12,
    color: "#8A5A65",
  },
  copyrightText: {
    fontSize: 10,
    color: "#B9657C",
    marginTop: 4,
  },
});

