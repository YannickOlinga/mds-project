import Constants from "expo-constants";
import { router } from "expo-router";
import {
  Activity,
  Bell,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  HeartPulse,
  LogOut,
  Moon,
  ShieldCheck,
  Smartphone,
  UserRound,
  Wifi,
} from "lucide-react-native";
import type { ReactNode } from "react";
import { Alert, Linking, Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native";

import ErrorState from "@/components/ui/ErrorState";
import LoadingScreen from "@/components/ui/LoadingScreen";
import { useToast } from "@/components/ui/Toast";
import { colors } from "@/constants/theme/colors";
import { radius, spacing } from "@/constants/theme/spacing";
import { useProfileQuery, useUpdateProfileSettingsMutation } from "@/hooks/useApiQueries";
import useAuthStore from "@/store/authStore";
import { useDeviceStore } from "@/store/deviceStore";
import { getErrorMessage } from "@/utils/apiError";

export default function SettingsScreen() {
  const profile = useProfileQuery();
  const updateSettings = useUpdateProfileSettingsMutation();
  const logout = useAuthStore((state) => state.logout);
  const showToast = useToast((state) => state.show);
  const deviceState = useDeviceStore((state) => state.state);
  const connectedDevice = useDeviceStore((state) => state.connectedDevice);
  const connectionType = useDeviceStore((state) => state.connectionType);
  const setConnectionType = useDeviceStore((state) => state.setConnectionType);
  const disconnectLocal = useDeviceStore((state) => state.disconnectLocal);

  if (profile.isLoading) {
    return <LoadingScreen label="Chargement des paramètres" />;
  }

  if (profile.isError) {
    return <ErrorState error={profile.error} onRetry={() => void profile.refetch()} />;
  }

  const data = profile.data;
  if (!data) {
    return <ErrorState error={new Error("Paramètres indisponibles.")} onRetry={() => void profile.refetch()} />;
  }

  const name = data.profile_fields?.name || data.personalInfo.find((item) => item.label === "Nom")?.value || "Compte";
  const email = data.personalInfo.find((item) => item.label === "Email")?.value || "";
  const appVersion = Constants.expoConfig?.version ?? "1.0.0";
  const isDeviceConnected = deviceState === "connected" && Boolean(connectedDevice);

  function saveSetting(payload: { reminders?: boolean; notifications?: boolean; darkMode?: boolean }) {
    updateSettings.mutate(payload, {
      onSuccess: () => showToast("Paramètre enregistré"),
      onError: (error) => {
        showToast(getErrorMessage(error));
        void profile.refetch();
      },
    });
  }

  function showMedicalNotice() {
    Alert.alert(
      "Santé et sécurité",
      "Périnéa accompagne vos séances, mais ne remplace pas un avis médical. Arrêtez l’exercice en cas de douleur, saignement, gêne inhabituelle ou doute, puis contactez un professionnel de santé."
    );
  }

  function showPrivacyNotice() {
    Alert.alert(
      "Confidentialité",
      "Vos informations de profil et vos séances servent uniquement au suivi dans l’application. Les mesures liées à une sonde doivent rester rattachées à votre compte et protégées par votre session."
    );
  }

  function confirmLogout() {
    Alert.alert("Déconnexion", "Voulez-vous fermer votre session sur cet appareil ?", [
      { text: "Annuler", style: "cancel" },
      { text: "Se déconnecter", style: "destructive", onPress: () => void logout() },
    ]);
  }

  function contactSupport() {
    void Linking.openURL("mailto:support@perinea.app?subject=Aide%20P%C3%A9rin%C3%A9a");
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()} accessibilityRole="button">
          <ChevronLeft size={26} color={colors.plum} />
        </Pressable>
        <View>
          <Text style={styles.title}>Paramètres</Text>
          <Text style={styles.subtitle}>Compte, appareil et confidentialité</Text>
        </View>
      </View>

      <View style={styles.accountCard}>
        <View style={styles.accountIcon}>
          <UserRound size={28} color={colors.surface} />
        </View>
        <View style={styles.accountText}>
          <Text style={styles.accountName}>{name}</Text>
          {email ? <Text style={styles.accountEmail}>{email}</Text> : null}
        </View>
      </View>

      <SettingsSection title="Compte">
        <ActionRow
          icon={<UserRound size={21} color={colors.plum} />}
          title="Informations personnelles"
          description="Nom, objectif, niveau et données de suivi"
          onPress={() => router.push("/edit-profile")}
        />
        <ActionRow
          icon={<Activity size={21} color={colors.plum} />}
          title="Questionnaire santé"
          description={data.onboarding_completed ? "Réponses enregistrées" : "À compléter"}
          onPress={() => router.push("/questionnaire")}
        />
      </SettingsSection>

      <SettingsSection title="Notifications">
        <SwitchRow
          icon={<Bell size={21} color={colors.plum} />}
          title="Notifications"
          description="Autoriser les rappels et messages importants"
          value={data.settings.notifications}
          disabled={updateSettings.isPending}
          onValueChange={(notifications) => saveSetting({ notifications })}
        />
        <SwitchRow
          icon={<Bell size={21} color={colors.plum} />}
          title={"Rappels d'entraînement"}
          description="Recevoir un rappel pour garder une régularité"
          value={data.settings.reminders}
          disabled={updateSettings.isPending || !data.settings.notifications}
          onValueChange={(reminders) => saveSetting({ reminders })}
        />
      </SettingsSection>

      <SettingsSection title="Appareil">
        <View style={styles.deviceCard}>
          <View style={styles.deviceTop}>
            <View style={[styles.statusDot, isDeviceConnected ? styles.statusConnected : styles.statusDisconnected]} />
            <View style={styles.deviceInfo}>
              <Text style={styles.deviceTitle}>
                {isDeviceConnected ? connectedDevice?.name : "Aucune sonde connectée"}
              </Text>
              <Text style={styles.deviceDescription}>
                {isDeviceConnected
                  ? `Connectée en ${connectionType === "wifi" ? "Wi-Fi" : "Bluetooth"}`
                  : "Vous pouvez connecter une sonde maintenant ou continuer en mode sans sonde."}
              </Text>
            </View>
          </View>

          <View style={styles.segmented}>
            <Pressable
              style={[styles.segment, connectionType === "ble" && styles.segmentActive]}
              onPress={() => setConnectionType("ble")}
            >
              <Smartphone size={16} color={connectionType === "ble" ? colors.surface : colors.plum} />
              <Text style={[styles.segmentText, connectionType === "ble" && styles.segmentTextActive]}>Bluetooth</Text>
            </Pressable>
            <Pressable
              style={[styles.segment, connectionType === "wifi" && styles.segmentActive]}
              onPress={() => setConnectionType("wifi")}
            >
              <Wifi size={16} color={connectionType === "wifi" ? colors.surface : colors.plum} />
              <Text style={[styles.segmentText, connectionType === "wifi" && styles.segmentTextActive]}>Wi-Fi</Text>
            </Pressable>
          </View>

          <View style={styles.deviceActions}>
            <Pressable style={styles.primaryButton} onPress={() => router.push("/connect")}>
              <Text style={styles.primaryButtonText}>{isDeviceConnected ? "Changer de sonde" : "Connecter une sonde"}</Text>
            </Pressable>
            {isDeviceConnected ? (
              <Pressable style={styles.secondaryButton} onPress={disconnectLocal}>
                <Text style={styles.secondaryButtonText}>Déconnecter</Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      </SettingsSection>

      <SettingsSection title="Affichage">
        <SwitchRow
          icon={<Moon size={21} color={colors.plum} />}
          title="Mode sombre"
          description="Préférence enregistrée dans votre profil"
          value={data.settings.darkMode}
          disabled={updateSettings.isPending}
          onValueChange={(darkMode) => saveSetting({ darkMode })}
        />
      </SettingsSection>

      <SettingsSection title="Santé et confidentialité">
        <ActionRow
          icon={<HeartPulse size={21} color={colors.plum} />}
          title="Avertissement médical"
          description={"Consignes d'arrêt et limites de l'application"}
          onPress={showMedicalNotice}
        />
        <ActionRow
          icon={<ShieldCheck size={21} color={colors.plum} />}
          title="Confidentialité des données"
          description="Rappel sur la protection des données de santé"
          onPress={showPrivacyNotice}
        />
      </SettingsSection>

      <SettingsSection title="Aide">
        <ActionRow
          icon={<CircleHelp size={21} color={colors.plum} />}
          title="Contacter le support"
          description="Envoyer une demande depuis votre messagerie"
          onPress={contactSupport}
        />
        <View style={styles.versionRow}>
          <Text style={styles.versionLabel}>{"Version de l'application"}</Text>
          <Text style={styles.versionValue}>{appVersion}</Text>
        </View>
      </SettingsSection>

      <Pressable style={styles.logoutButton} onPress={confirmLogout}>
        <LogOut size={22} color={colors.danger} />
        <Text style={styles.logoutText}>Se déconnecter</Text>
      </Pressable>
    </ScrollView>
  );
}

function SettingsSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionCard}>{children}</View>
    </View>
  );
}

function ActionRow({
  icon,
  title,
  description,
  onPress,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.row} onPress={onPress} accessibilityRole="button">
      <View style={styles.rowIcon}>{icon}</View>
      <View style={styles.rowText}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowDescription}>{description}</Text>
      </View>
      <ChevronRight size={20} color={colors.plumMuted} />
    </Pressable>
  );
}

function SwitchRow({
  icon,
  title,
  description,
  value,
  disabled,
  onValueChange,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  value: boolean;
  disabled: boolean;
  onValueChange: (value: boolean) => void;
}) {
  return (
    <View style={styles.row}>
      <View style={styles.rowIcon}>{icon}</View>
      <View style={styles.rowText}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowDescription}>{description}</Text>
      </View>
      <Switch
        value={value}
        disabled={disabled}
        onValueChange={onValueChange}
        trackColor={{ false: colors.border, true: colors.blush }}
        thumbColor={value ? colors.coral : colors.surface}
      />
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
    paddingBottom: 120,
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
  accountCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  accountIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.plum,
    alignItems: "center",
    justifyContent: "center",
  },
  accountText: {
    flex: 1,
  },
  accountName: {
    color: colors.text,
    fontSize: 19,
    fontWeight: "900",
  },
  accountEmail: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: "600",
    marginTop: 3,
  },
  section: {
    gap: spacing.md,
  },
  sectionTitle: {
    color: colors.plum,
    fontSize: 20,
    fontWeight: "900",
  },
  sectionCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  row: {
    minHeight: 78,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
  },
  rowText: {
    flex: 1,
    gap: 3,
  },
  rowTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "900",
  },
  rowDescription: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "600",
  },
  deviceCard: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  deviceTop: {
    flexDirection: "row",
    gap: spacing.md,
  },
  statusDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginTop: 5,
  },
  statusConnected: {
    backgroundColor: colors.success,
  },
  statusDisconnected: {
    backgroundColor: colors.textMuted,
  },
  deviceInfo: {
    flex: 1,
  },
  deviceTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: "900",
  },
  deviceDescription: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600",
    marginTop: 4,
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
    minHeight: 42,
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
    fontSize: 13,
  },
  segmentTextActive: {
    color: colors.surface,
  },
  deviceActions: {
    gap: spacing.sm,
  },
  primaryButton: {
    minHeight: 48,
    borderRadius: 999,
    backgroundColor: colors.plum,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
  },
  primaryButtonText: {
    color: colors.surface,
    fontWeight: "900",
    fontSize: 15,
  },
  secondaryButton: {
    minHeight: 46,
    borderRadius: 999,
    backgroundColor: colors.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
  },
  secondaryButtonText: {
    color: colors.plum,
    fontWeight: "900",
    fontSize: 15,
  },
  versionRow: {
    minHeight: 58,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  versionLabel: {
    color: colors.text,
    fontWeight: "800",
  },
  versionValue: {
    color: colors.textMuted,
    fontWeight: "800",
  },
  logoutButton: {
    minHeight: 56,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  logoutText: {
    color: colors.danger,
    fontSize: 16,
    fontWeight: "900",
  },
});
