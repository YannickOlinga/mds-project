import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { AlertCircle, Check, ChevronLeft } from "lucide-react-native";
import React, { useMemo, useState } from "react";
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

import { useUpdateProfileMutation } from "@/hooks/useApiQueries";
import type { LevelKey, ProfileUpdatePayload } from "@/types/api";
import { getErrorMessage } from "@/utils/apiError";

type StepKey = "identity" | "objective" | "symptoms" | "habits" | "health" | "summary";

type Choice<T extends string = string> = {
  label: string;
  value: T;
};

const STEPS: { key: StepKey; title: string; subtitle: string }[] = [
  {
    key: "identity",
    title: "Votre profil",
    subtitle: "Ces informations permettent d'adapter les recommandations.",
  },
  {
    key: "objective",
    title: "Votre objectif",
    subtitle: "Choisissez la raison principale de votre accompagnement.",
  },
  {
    key: "symptoms",
    title: "Votre situation",
    subtitle: "Sélectionnez uniquement ce qui vous concerne.",
  },
  {
    key: "habits",
    title: "Votre rythme",
    subtitle: "Le programme doit rester réaliste dans votre quotidien.",
  },
  {
    key: "health",
    title: "Sécurité",
    subtitle: "Ajoutez une information utile avant de commencer.",
  },
  {
    key: "summary",
    title: "Récapitulatif",
    subtitle: "Vérifiez les informations avant de les enregistrer.",
  },
];

const LEVELS: Choice<LevelKey>[] = [
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
  levelKey: LevelKey | "";
  objective: string;
  symptoms: string[];
  birthContext: string;
  frequency: string;
  monthlyTarget: number;
  hasProbe: boolean | null;
  healthNotes: string;
};

const initialForm: FormState = {
  name: "",
  age: "",
  levelKey: "",
  objective: "",
  symptoms: [],
  birthContext: "",
  frequency: "",
  monthlyTarget: 12,
  hasProbe: null,
  healthNotes: "",
};

export default function Questionnaire() {
  const [stepIndex, setStepIndex] = useState(0);
  const [form, setForm] = useState<FormState>(initialForm);
  const updateProfile = useUpdateProfileMutation();

  const step = STEPS[stepIndex];
  const progress = ((stepIndex + 1) / STEPS.length) * 100;

  const canContinue = useMemo(() => {
    if (step.key === "identity") {
      const age = Number(form.age);
      return form.name.trim().length >= 2 && Number.isInteger(age) && age >= 13 && age <= 100;
    }
    if (step.key === "objective") {
      return Boolean(form.objective && form.levelKey);
    }
    if (step.key === "symptoms") {
      return form.symptoms.length > 0 && Boolean(form.birthContext);
    }
    if (step.key === "habits") {
      return Boolean(form.frequency && form.hasProbe !== null);
    }
    return true;
  }, [form, step.key]);

  const setValue = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const toggleSymptom = (symptom: string) => {
    void Haptics.selectionAsync();
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

  const goNext = () => {
    if (!canContinue) return;
    void Haptics.selectionAsync();
    if (stepIndex < STEPS.length - 1) {
      setStepIndex((current) => current + 1);
      return;
    }
    void submit();
  };

  const goBack = () => {
    if (stepIndex === 0) {
      router.back();
      return;
    }
    setStepIndex((current) => current - 1);
  };

  const submit = async () => {
    const payload: ProfileUpdatePayload = {
      name: form.name.trim(),
      age: Number(form.age),
      objective: form.objective,
      level_key: form.levelKey || "debutant",
      symptoms: form.symptoms,
      birth_context: form.birthContext,
      training_frequency: form.frequency,
      monthly_goal_sessions_target: form.monthlyTarget,
      has_probe: form.hasProbe ?? false,
      health_notes: form.healthNotes.trim(),
      onboarding_completed: true,
    };

    try {
      await updateProfile.mutateAsync(payload);
      router.replace("/(tabs)");
    } catch {
      // The error is rendered below and the user can retry.
    }
  };

  const renderChoice = <T extends string>(
    choice: Choice<T> | string,
    selected: boolean,
    onPress: () => void
  ) => {
    const label = typeof choice === "string" ? choice : choice.label;
    return (
      <Pressable
        key={label}
        style={[styles.choice, selected && styles.choiceSelected]}
        onPress={onPress}
      >
        <Text style={[styles.choiceText, selected && styles.choiceTextSelected]}>{label}</Text>
        {selected ? <Check size={18} color="#571534" strokeWidth={2.5} /> : null}
      </Pressable>
    );
  };

  const errorMessage = updateProfile.error ? getErrorMessage(updateProfile.error) : "";

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable style={styles.iconButton} onPress={goBack}>
          <ChevronLeft size={22} color="#571534" />
        </Pressable>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
        <Text style={styles.stepCount}>
          {stepIndex + 1}/{STEPS.length}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>{step.title}</Text>
        <Text style={styles.subtitle}>{step.subtitle}</Text>

        {step.key === "identity" ? (
          <View style={styles.section}>
            <View style={styles.field}>
              <Text style={styles.label}>{"Prénom ou nom d'usage"}</Text>
              <TextInput
                value={form.name}
                onChangeText={(value) => setValue("name", value)}
                placeholder="Exemple : Sarah"
                placeholderTextColor="#9F7B88"
                style={styles.input}
                autoCapitalize="words"
              />
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>Âge</Text>
              <TextInput
                value={form.age}
                onChangeText={(value) => setValue("age", value.replace(/[^0-9]/g, ""))}
                placeholder="Exemple : 32"
                placeholderTextColor="#9F7B88"
                style={styles.input}
                keyboardType="number-pad"
                maxLength={3}
              />
            </View>
          </View>
        ) : null}

        {step.key === "objective" ? (
          <View style={styles.section}>
            <Text style={styles.label}>Objectif principal</Text>
            {OBJECTIVES.map((objective) =>
              renderChoice(objective, form.objective === objective, () => setValue("objective", objective))
            )}

            <Text style={[styles.label, styles.groupLabel]}>Niveau actuel</Text>
            {LEVELS.map((level) =>
              renderChoice(level, form.levelKey === level.value, () => setValue("levelKey", level.value))
            )}
          </View>
        ) : null}

        {step.key === "symptoms" ? (
          <View style={styles.section}>
            <Text style={styles.label}>Symptômes ou situation actuelle</Text>
            {SYMPTOMS.map((symptom) =>
              renderChoice(symptom, form.symptoms.includes(symptom), () => toggleSymptom(symptom))
            )}

            <Text style={[styles.label, styles.groupLabel]}>Contexte</Text>
            {BIRTH_CONTEXT.map((context) =>
              renderChoice(context, form.birthContext === context, () => setValue("birthContext", context))
            )}
          </View>
        ) : null}

        {step.key === "habits" ? (
          <View style={styles.section}>
            <Text style={styles.label}>Fréquence souhaitée</Text>
            {FREQUENCIES.map((frequency) =>
              renderChoice(frequency.label, form.frequency === frequency.label, () => {
                setForm((current) => ({
                  ...current,
                  frequency: frequency.label,
                  monthlyTarget: frequency.target,
                }));
              })
            )}

            <Text style={[styles.label, styles.groupLabel]}>Avez-vous déjà une sonde Périnea ?</Text>
            {renderChoice("Oui, je veux la connecter", form.hasProbe === true, () =>
              setValue("hasProbe", true)
            )}
            {renderChoice("Pas encore, je commencerai sans sonde", form.hasProbe === false, () =>
              setValue("hasProbe", false)
            )}
          </View>
        ) : null}

        {step.key === "health" ? (
          <View style={styles.section}>
            <View style={styles.notice}>
              <AlertCircle size={20} color="#C95F7B" />
              <Text style={styles.noticeText}>
                En cas de douleur, grossesse à risque, chirurgie récente ou doute médical, demandez
                {"l'avis d'un professionnel de santé avant de commencer."}
              </Text>
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>Information utile pour votre suivi</Text>
              <TextInput
                value={form.healthNotes}
                onChangeText={(value) => setValue("healthNotes", value)}
                placeholder="Optionnel"
                placeholderTextColor="#9F7B88"
                style={[styles.input, styles.textArea]}
                multiline
                textAlignVertical="top"
              />
            </View>
          </View>
        ) : null}

        {step.key === "summary" ? (
          <View style={styles.summary}>
            {[
              ["Nom", form.name],
              ["Âge", `${form.age} ans`],
              ["Objectif", form.objective],
              ["Niveau", LEVELS.find((level) => level.value === form.levelKey)?.label ?? ""],
              ["Symptômes", form.symptoms.join(", ")],
              ["Contexte", form.birthContext],
              ["Rythme", form.frequency],
              ["Sonde", form.hasProbe ? "Disponible" : "Pas encore"],
            ].map(([label, value]) => (
              <View key={label} style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>{label}</Text>
                <Text style={styles.summaryValue}>{value}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {errorMessage ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          style={[styles.primaryButton, (!canContinue || updateProfile.isPending) && styles.buttonDisabled]}
          disabled={!canContinue || updateProfile.isPending}
          onPress={goNext}
        >
          {updateProfile.isPending ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.primaryButtonText}>
              {step.key === "summary" ? "Enregistrer mon profil" : "Continuer"}
            </Text>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FCF7F4",
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  iconButton: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  progressTrack: {
    backgroundColor: "#F7C5C8",
    borderRadius: 999,
    flex: 1,
    height: 8,
    overflow: "hidden",
  },
  progressFill: {
    backgroundColor: "#C95F7B",
    height: "100%",
  },
  stepCount: {
    color: "#571534",
    fontSize: 13,
    fontWeight: "700",
    width: 40,
  },
  content: {
    padding: 24,
    paddingBottom: 120,
  },
  title: {
    color: "#571534",
    fontSize: 30,
    fontWeight: "800",
    letterSpacing: 0,
    lineHeight: 36,
  },
  subtitle: {
    color: "#7B5564",
    fontSize: 16,
    lineHeight: 23,
    marginTop: 8,
    marginBottom: 28,
  },
  section: {
    gap: 12,
  },
  field: {
    gap: 8,
  },
  label: {
    color: "#571534",
    fontSize: 15,
    fontWeight: "800",
  },
  groupLabel: {
    marginTop: 20,
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderColor: "#F0D6DC",
    borderRadius: 12,
    borderWidth: 1,
    color: "#571534",
    fontSize: 17,
    minHeight: 54,
    paddingHorizontal: 16,
  },
  textArea: {
    minHeight: 120,
    paddingTop: 14,
  },
  choice: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "#F0D6DC",
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
    minHeight: 58,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  choiceSelected: {
    backgroundColor: "#F9E6EA",
    borderColor: "#C95F7B",
  },
  choiceText: {
    color: "#571534",
    flex: 1,
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 21,
  },
  choiceTextSelected: {
    color: "#571534",
  },
  notice: {
    alignItems: "flex-start",
    backgroundColor: "#FFFFFF",
    borderColor: "#F0D6DC",
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    padding: 16,
  },
  noticeText: {
    color: "#6A3F4E",
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  summary: {
    backgroundColor: "#FFFFFF",
    borderColor: "#F0D6DC",
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
  },
  summaryRow: {
    borderBottomColor: "#F0D6DC",
    borderBottomWidth: 1,
    gap: 6,
    padding: 16,
  },
  summaryLabel: {
    color: "#8C6A75",
    fontSize: 13,
    fontWeight: "700",
  },
  summaryValue: {
    color: "#571534",
    fontSize: 16,
    fontWeight: "800",
    lineHeight: 22,
  },
  errorBox: {
    backgroundColor: "#FBE7EA",
    borderColor: "#C95F7B",
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 20,
    padding: 14,
  },
  errorText: {
    color: "#571534",
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 20,
  },
  footer: {
    backgroundColor: "#FCF7F4",
    borderTopColor: "#F0D6DC",
    borderTopWidth: 1,
    bottom: 0,
    left: 0,
    padding: 20,
    position: "absolute",
    right: 0,
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: "#571534",
    borderRadius: 14,
    minHeight: 56,
    justifyContent: "center",
  },
  buttonDisabled: {
    opacity: 0.45,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
  },
});
