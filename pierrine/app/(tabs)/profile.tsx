import { LinearGradient } from "expo-linear-gradient";
import { Bell, Edit3, LogOut, Moon, Settings, Trophy } from "lucide-react-native";
import type { ReactNode } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { router } from "expo-router";

import ErrorState from "@/components/ui/ErrorState";
import LoadingScreen from "@/components/ui/LoadingScreen";
import { useToast } from "@/components/ui/Toast";
import { colors, gradients } from "@/constants/theme/colors";
import { radius, spacing } from "@/constants/theme/spacing";
import { useProfileQuery, useUpdateProfileSettingsMutation } from "@/hooks/useApiQueries";
import useAuthStore from "@/store/authStore";
import { getErrorMessage } from "@/utils/apiError";

export default function ProfileScreen() {
  const profile = useProfileQuery();
  const updateSettings = useUpdateProfileSettingsMutation();
  const logout = useAuthStore((state) => state.logout);
  const showToast = useToast((state) => state.show);

  if (profile.isLoading) {
    return <LoadingScreen label="Chargement du profil" />;
  }

  if (profile.isError) {
    return <ErrorState error={profile.error} onRetry={() => void profile.refetch()} />;
  }

  const data = profile.data;
  if (!data) {
    return <ErrorState error={new Error("Profil indisponible.")} onRetry={() => void profile.refetch()} />;
  }

  const name = data.personalInfo.find((item) => item.label === "Nom")?.value ?? "Utilisateur";
  const email = data.personalInfo.find((item) => item.label === "Email")?.value ?? "";
  const objective = data.personalInfo.find((item) => item.label === "Objectif")?.value ?? "";
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  function saveSetting(payload: { reminders?: boolean; notifications?: boolean; darkMode?: boolean }) {
    updateSettings.mutate(payload, {
      onSuccess: () => showToast("Paramètres enregistrés"),
      onError: (error) => {
        showToast(getErrorMessage(error));
        void profile.refetch();
      },
    });
  }

  function confirmLogout() {
    Alert.alert("Déconnexion", "Voulez-vous fermer votre session ?", [
      { text: "Annuler", style: "cancel" },
      { text: "Se déconnecter", style: "destructive", onPress: () => void logout() },
    ]);
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <LinearGradient colors={gradients.primary} style={styles.avatar}>
          <Text style={styles.initials}>{initials}</Text>
        </LinearGradient>
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.email}>{email}</Text>
        <Text style={styles.level}>
          {objective ? `Programme ${data.level.label}` : "Profil non personnalisé"}
        </Text>
      </View>

      <View style={styles.statsContainer}>
        <Stat label="Sessions" value={data.stats.sessions_total} />
        <Stat label="Temps" value={data.stats.time_total_formatted} />
        <Stat label="Streak" value={data.stats.streak_days} />
        <Stat label="Badges" value={data.stats.badges_count} />
      </View>

      <View style={styles.card}>
        <View style={styles.rowTitle}>
          <Trophy size={20} color={colors.plum} />
          <Text style={styles.sectionTitle}>Informations</Text>
        </View>
        {data.personalInfo.filter((item) => item.value).map((item) => (
          <View key={item.label} style={styles.infoRow}>
            <Text style={styles.infoLabel}>{item.label}</Text>
            <Text style={styles.infoValue}>{item.value}</Text>
          </View>
        ))}
        <Pressable style={styles.secondaryButton} onPress={() => router.push("/edit-profile")}>
          <Edit3 size={18} color={colors.plum} />
          <Text style={styles.secondaryText}>Modifier mes informations</Text>
        </Pressable>
      </View>

      <View style={styles.card}>
        <View style={styles.rowTitle}>
          <Settings size={20} color={colors.plum} />
          <Text style={styles.sectionTitle}>Paramètres</Text>
        </View>
        <SettingRow
          icon={<Bell size={20} color={colors.plum} />}
          label="Rappels"
          value={data.settings.reminders}
          disabled={updateSettings.isPending}
          onValueChange={(reminders) => saveSetting({ reminders })}
        />
        <SettingRow
          icon={<Bell size={20} color={colors.plum} />}
          label="Notifications"
          value={data.settings.notifications}
          disabled={updateSettings.isPending}
          onValueChange={(notifications) => saveSetting({ notifications })}
        />
        <SettingRow
          icon={<Moon size={20} color={colors.plum} />}
          label="Mode sombre"
          value={data.settings.darkMode}
          disabled={updateSettings.isPending}
          onValueChange={(darkMode) => saveSetting({ darkMode })}
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Appareil</Text>
        <Text style={styles.deviceName}>{data.device.device_name || "Aucune sonde connectée"}</Text>
        <Text style={styles.deviceMeta}>
          {data.device.connected ? `Connecté · ${data.device.battery_pct}%` : "Déconnecté"}
        </Text>
        <Pressable style={styles.secondaryButton} onPress={() => router.push("/device-settings")}>
          <Text style={styles.secondaryText}>Paramètres appareil</Text>
        </Pressable>
      </View>

      <Pressable style={styles.logoutButton} onPress={confirmLogout}>
        <LogOut size={22} color={colors.danger} />
        <Text style={styles.logoutText}>Se déconnecter</Text>
      </Pressable>
    </ScrollView>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function SettingRow({
  icon,
  label,
  value,
  disabled,
  onValueChange,
}: {
  icon: ReactNode;
  label: string;
  value: boolean;
  disabled: boolean;
  onValueChange: (value: boolean) => void;
}) {
  return (
    <View style={styles.settingRow}>
      <View style={styles.settingLeft}>
        {icon}
        <Text style={styles.settingLabel}>{label}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        trackColor={{ false: colors.border, true: colors.blush }}
        thumbColor={value ? colors.coral : colors.surface}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.xl, paddingTop: 56, paddingBottom: 120, gap: spacing.xl },
  header: { alignItems: "center", gap: 8 },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  initials: { color: colors.surface, fontSize: 34, fontWeight: "900" },
  name: { color: colors.plum, fontSize: 25, fontWeight: "900" },
  email: { color: colors.textMuted },
  level: {
    color: colors.plum,
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    fontWeight: "800",
  },
  statsContainer: { flexDirection: "row", gap: spacing.sm },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  statValue: { color: colors.plum, fontSize: 17, fontWeight: "900", textAlign: "center" },
  statLabel: { color: colors.textMuted, fontSize: 11, fontWeight: "700", marginTop: 3 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
  },
  rowTitle: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  sectionTitle: { color: colors.plum, fontSize: 18, fontWeight: "900" },
  infoRow: { flexDirection: "row", justifyContent: "space-between", gap: spacing.md },
  infoLabel: { color: colors.textMuted, fontWeight: "700" },
  infoValue: { color: colors.text, fontWeight: "800", flex: 1, textAlign: "right" },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.sm,
  },
  settingLeft: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  settingLabel: { color: colors.text, fontWeight: "800" },
  deviceName: { color: colors.text, fontWeight: "900", fontSize: 16 },
  deviceMeta: { color: colors.textMuted },
  secondaryButton: {
    borderRadius: 999,
    backgroundColor: colors.surfaceAlt,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: spacing.sm,
  },
  secondaryText: { color: colors.plum, fontWeight: "900" },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  logoutText: { color: colors.danger, fontWeight: "900", fontSize: 16 },
});
