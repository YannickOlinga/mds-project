import { router } from "expo-router";
import { Check, ChevronLeft } from "lucide-react-native";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import ErrorState from "@/components/ui/ErrorState";
import LoadingScreen from "@/components/ui/LoadingScreen";
import { useToast } from "@/components/ui/Toast";
import { colors } from "@/constants/theme/colors";
import { radius, spacing } from "@/constants/theme/spacing";
import { useProfileQuery, useUpdateProfileMutation } from "@/hooks/useApiQueries";
import type { LevelKey, ProfileUpdatePayload } from "@/types/api";
import { getErrorMessage } from "@/utils/apiError";

const LEVELS: { label: string; value: LevelKey }[] = [
  { label: "Débutant", value: "debutant" },
  { label: "Intermédiaire", value: "intermediaire" },
  { label: "Avancé", value: "avance" },
];

const OBJECTIVES = [
  "Rééducation post-partum",
  "Réduire les fuites urinaires",
  "Renforcement du périnée",
  "Reprise du sport",
  "Prévention et entretien",
];

const SYMPTOMS = [
  "Fuites urinaires",
  "Sensation de lourdeur",
  "Difficulté à contracter",
  "Douleurs pelviennes",
  "Aucun symptôme actuel",
];

const BIRTH_CONTEXT = [
  "Pas concernée",
  "Grossesse en cours",
  "Post-partum récent",
  "Post-partum ancien",
  "Ménopause",
];

const FREQUENCIES = [
  { label: "2 séances par semaine", target: 8 },
  { label: "3 séances par semaine", target: 12 },
  { label: "4 séances par semaine", target: 16 },
  { label: "Quotidien", target: 25 },
];

type FormState = {
  name: string;
  age: string;
  objective: string;
  levelKey: LevelKey;
  symptoms: string[];
  birthContext: string;
  frequency: string;
  monthlyTarget: number;
  hasProbe: boolean;
  healthNotes: string;
};

export default function EditProfileScreen() {
  const profile = useProfileQuery();
  const updateProfile = useUpdateProfileMutation();
  const showToast = useToast((state) => state.show);
  const [form, setForm] = useState<FormState>({
    name: "",
    age: "",
    objective: "",
    levelKey: "debutant",
    symptoms: [],
    birthContext: "",
    frequency: "",
    monthlyTarget: 12,
    hasProbe: false,
    healthNotes: "",
  });

  useEffect(() => {
    const fields = profile.data?.profile_fields;
    if (!fields) return;
    setForm({
      name: fields.name ?? "",
      age: fields.age ? String(fields.age) : "",
      objective: fields.objective ?? "",
      levelKey: fields.level_key ?? "debutant",
      symptoms: fields.symptoms ?? [],
      birthContext: fields.birth_context ?? "",
      frequency: fields.training_frequency ?? "",
      monthlyTarget: fields.monthly_goal_sessions_target ?? 12,
      hasProbe: fields.has_probe === true,
      healthNotes: fields.health_notes ?? "",
    });
  }, [profile.data?.profile_fields]);

  const canSave = useMemo(() => {
    const age = Number(form.age);
    return form.name.trim().length >= 2 && Number.isInteger(age) && age >= 13 && age <= 100;
  }, [form.age, form.name]);

  if (profile.isLoading) {
    return <LoadingScreen label="Chargement de vos informations" />;
  }

  if (profile.isError) {
    return <ErrorState error={profile.error} onRetry={() => void profile.refetch()} />;
  }

  const setValue = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const toggleSymptom = (symptom: string) => {
    setForm((current) => {
      const exists = current.symptoms.includes(symptom);
      if (symptom === "Aucun symptôme actuel") {
        return { ...current, symptoms: exists ? [] : [symptom] };
      }
      const withoutNone = current.symptoms.filter((item) => item !== "Aucun symptôme actuel");
      return {
        ...current,
        symptoms: exists
          ? withoutNone.filter((item) => item !== symptom)
          : [...withoutNone, symptom],
      };
    });
  };

  async function save() {
    if (!canSave) return;

    const payload: ProfileUpdatePayload = {
      name: form.name.trim(),
      age: Number(form.age),
      objective: form.objective,
      level_key: form.levelKey,
      symptoms: form.symptoms,
      birth_context: form.birthContext,
      training_frequency: form.frequency,
      monthly_goal_sessions_target: form.monthlyTarget,
      has_probe: form.hasProbe,
      health_notes: form.healthNotes.trim(),
      onboarding_completed: true,
    };

    try {
      await updateProfile.mutateAsync(payload);
      showToast("Informations mises à jour");
      router.back();
    } catch (error) {
      showToast(getErrorMessage(error));
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable style={styles.iconButton} onPress={() => router.back()}>
          <ChevronLeft size={22} color={colors.plum} />
        </Pressable>
        <View style={styles.headerText}>
          <Text style={styles.title}>Modifier mes informations</Text>
          <Text style={styles.subtitle}>Ces informations ajustent votre parcours.</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <Field label="Prénom ou nom d'usage">
            <TextInput
              value={form.name}
              onChangeText={(value) => setValue("name", value)}
              placeholder="Votre prénom"
              placeholderTextColor="#9F7B88"
              style={styles.input}
              autoCapitalize="words"
            />
          </Field>
          <Field label="Âge">
            <TextInput
              value={form.age}
              onChangeText={(value) => setValue("age", value.replace(/[^0-9]/g, ""))}
              placeholder="Votre âge"
              placeholderTextColor="#9F7B88"
              style={styles.input}
              keyboardType="number-pad"
              maxLength={3}
            />
          </Field>
        </View>

        <ChoiceGroup title="Objectif principal" values={OBJECTIVES} selected={form.objective} onSelect={(value) => setValue("objective", value)} />
        <ChoiceGroup title="Niveau" values={LEVELS} selected={form.levelKey} onSelect={(value) => setValue("levelKey", value as LevelKey)} />
        <ChoiceGroup title="Contexte" values={BIRTH_CONTEXT} selected={form.birthContext} onSelect={(value) => setValue("birthContext", value)} />

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Symptômes</Text>
          {SYMPTOMS.map((symptom) => (
            <Choice key={symptom} label={symptom} selected={form.symptoms.includes(symptom)} onPress={() => toggleSymptom(symptom)} />
          ))}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Rythme</Text>
          {FREQUENCIES.map((frequency) => (
            <Choice
              key={frequency.label}
              label={frequency.label}
              selected={form.frequency === frequency.label}
              onPress={() =>
                setForm((current) => ({
                  ...current,
                  frequency: frequency.label,
                  monthlyTarget: frequency.target,
                }))
              }
            />
          ))}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Sonde</Text>
          <Choice label="J'ai une sonde" selected={form.hasProbe} onPress={() => setValue("hasProbe", true)} />
          <Choice label="Je n'ai pas encore de sonde" selected={!form.hasProbe} onPress={() => setValue("hasProbe", false)} />
        </View>

        <View style={styles.card}>
          <Field label="Notes santé">
            <TextInput
              value={form.healthNotes}
              onChangeText={(value) => setValue("healthNotes", value)}
              placeholder="Optionnel"
              placeholderTextColor="#9F7B88"
              style={[styles.input, styles.textArea]}
              multiline
              textAlignVertical="top"
            />
          </Field>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          style={[styles.saveButton, (!canSave || updateProfile.isPending) && styles.saveButtonDisabled]}
          onPress={() => void save()}
          disabled={!canSave || updateProfile.isPending}
        >
          {updateProfile.isPending ? (
            <ActivityIndicator color={colors.surface} />
          ) : (
            <Text style={styles.saveText}>Enregistrer</Text>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}

function ChoiceGroup({
  title,
  values,
  selected,
  onSelect,
}: {
  title: string;
  values: (string | { label: string; value: string })[];
  selected: string;
  onSelect: (value: string) => void;
}) {
  return (
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {values.map((item) => {
        const label = typeof item === "string" ? item : item.label;
        const value = typeof item === "string" ? item : item.value;
        return <Choice key={value} label={label} selected={selected === value} onPress={() => onSelect(value)} />;
      })}
    </View>
  );
}

function Choice({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable style={[styles.choice, selected && styles.choiceSelected]} onPress={onPress}>
      <Text style={[styles.choiceText, selected && styles.choiceTextSelected]}>{label}</Text>
      {selected ? <Check size={18} color={colors.plum} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  headerText: { flex: 1 },
  title: { color: colors.plum, fontSize: 24, fontWeight: "900" },
  subtitle: { color: colors.textMuted, marginTop: 3 },
  content: {
    paddingHorizontal: spacing.xl,
    paddingBottom: 112,
    gap: spacing.lg,
  },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.xl,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.lg,
  },
  sectionTitle: { color: colors.plum, fontSize: 17, fontWeight: "900" },
  field: { gap: spacing.sm },
  label: { color: colors.plum, fontWeight: "800" },
  input: {
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    color: colors.text,
    fontSize: 16,
    minHeight: 52,
    paddingHorizontal: spacing.lg,
  },
  textArea: { minHeight: 110, paddingTop: spacing.md },
  choice: {
    alignItems: "center",
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between",
    minHeight: 52,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  choiceSelected: {
    backgroundColor: colors.surfaceAlt,
    borderColor: colors.coral,
  },
  choiceText: { color: colors.text, flex: 1, fontWeight: "800" },
  choiceTextSelected: { color: colors.plum },
  footer: {
    backgroundColor: colors.background,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    bottom: 0,
    left: 0,
    padding: spacing.xl,
    position: "absolute",
    right: 0,
  },
  saveButton: {
    alignItems: "center",
    backgroundColor: colors.plum,
    borderRadius: radius.md,
    minHeight: 56,
    justifyContent: "center",
  },
  saveButtonDisabled: { opacity: 0.5 },
  saveText: { color: colors.surface, fontSize: 16, fontWeight: "900" },
});
