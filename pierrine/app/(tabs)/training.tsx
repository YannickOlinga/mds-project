import { LinearGradient } from "expo-linear-gradient";
import { CheckCircle2, ChevronRight, Clock, Gamepad2, Info, Play, Square } from "lucide-react-native";
import { router } from "expo-router";
import type { ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";

import EmptyState from "@/components/ui/EmptyState";
import ErrorState from "@/components/ui/ErrorState";
import LoadingScreen from "@/components/ui/LoadingScreen";
import { useToast } from "@/components/ui/Toast";
import { colors, gradients } from "@/constants/theme/colors";
import { radius, spacing } from "@/constants/theme/spacing";
import { useCompleteTrainingMutation, useProfileQuery, useTrainingProgramQuery } from "@/hooks/useApiQueries";
import type { LevelKey } from "@/types/api";
import { getErrorMessage } from "@/utils/apiError";

function formatSeconds(seconds: number) {
  if (seconds < 60) return `${seconds} s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return remainingSeconds > 0 ? `${minutes} min ${remainingSeconds} s` : `${minutes} min`;
}

export default function TrainingScreen() {
  const [selectedLevel, setSelectedLevel] = useState<LevelKey>("debutant");
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentExercise, setCurrentExercise] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const didCompleteRef = useRef(false);
  const progress = useSharedValue(0);
  const showToast = useToast((state) => state.show);

  const program = useTrainingProgramQuery(selectedLevel);
  const profile = useProfileQuery();
  const complete = useCompleteTrainingMutation();
  const exercises = useMemo(() => program.data?.exercises ?? [], [program.data?.exercises]);
  const activeExercise = exercises[currentExercise];
  const noProbeMode = profile.data?.device.connected === false;
  const selectedLevelLabel = program.data?.selected_level.label ?? "Programme";

  const totalSessionSeconds = useMemo(
    () => exercises.reduce((sum, exercise) => sum + exercise.timer_duration_seconds, 0),
    [exercises]
  );

  useEffect(() => {
    setIsPlaying(false);
    setCurrentExercise(0);
    didCompleteRef.current = false;
    progress.value = 0;
    setTimeLeft(exercises[0]?.timer_duration_seconds ?? 0);
  }, [exercises, progress]);

  useEffect(() => {
    if (!isPlaying || !activeExercise) return;

    if (timeLeft <= 0) {
      if (currentExercise < exercises.length - 1) {
        const nextIndex = currentExercise + 1;
        setCurrentExercise(nextIndex);
        setTimeLeft(exercises[nextIndex].timer_duration_seconds);
        return;
      }

      setIsPlaying(false);
      progress.value = 0;

      if (!didCompleteRef.current) {
        didCompleteRef.current = true;
        complete.mutate(
          { levelKey: selectedLevel, exercisesCount: exercises.length },
          {
            onSuccess: () => showToast("Session enregistrée"),
            onError: (error) => showToast(getErrorMessage(error)),
          }
        );
      }
      return;
    }

    const timer = setTimeout(() => setTimeLeft((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [activeExercise, complete, currentExercise, exercises, isPlaying, progress, selectedLevel, showToast, timeLeft]);

  useEffect(() => {
    if (!isPlaying || totalSessionSeconds === 0) return;
    progress.value = withTiming(1, {
      duration: totalSessionSeconds * 1000,
      easing: Easing.linear,
    });
  }, [isPlaying, progress, totalSessionSeconds]);

  const progressStyle = useAnimatedStyle(() => ({
    width: `${Math.max(0, Math.min(1, progress.value)) * 100}%`,
  }));

  if (program.isLoading || profile.isLoading) {
    return <LoadingScreen label="Chargement du programme" />;
  }

  if (program.isError) {
    return <ErrorState error={program.error} onRetry={() => void program.refetch()} />;
  }

  if (!program.data || exercises.length === 0) {
    return <EmptyState title="Aucun entraînement" message="Aucun exercice n’est disponible pour ce niveau." />;
  }

  function startSession() {
    if (exercises.length === 0) return;
    didCompleteRef.current = false;
    setCurrentExercise(0);
    setTimeLeft(exercises[0].timer_duration_seconds);
    progress.value = 0;
    setIsPlaying(true);
  }

  function stopSession() {
    setIsPlaying(false);
    progress.value = 0;
    setTimeLeft(activeExercise?.timer_duration_seconds ?? 0);
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Entraînement</Text>
        <Text style={styles.subtitle}>
          {noProbeMode
            ? "Choisissez une séance guidée ou un exercice interactif sans mesure capteur."
            : "Choisissez entre une séance guidée et un exercice interactif avec la sonde."}
        </Text>
      </View>

      {noProbeMode ? (
        <View style={styles.modeCard}>
          <Info size={20} color={colors.coral} />
          <View style={styles.flex}>
            <Text style={styles.modeTitle}>Alternative sans sonde</Text>
            <Text style={styles.modeText}>
              {
                "La séance est guidée au minuteur et sauvegardée comme activité réelle. Aucun score de force, d'endurance ou de contraction n'est calculé sans capteur."
              }
            </Text>
          </View>
        </View>
      ) : null}

      <Pressable style={styles.gameCard} onPress={() => router.push("/game-hub" as never)}>
        <View style={styles.gameIconWrap}>
          <Gamepad2 size={26} color={colors.surface} />
        </View>
        <View style={styles.gameText}>
          <Text style={styles.gameEyebrow}>Mode jeu</Text>
          <Text style={styles.gameTitle}>Exercices interactifs</Text>
          <Text style={styles.gameSub}>Jouer avec la sonde connectée ou en mode tactile</Text>
        </View>
        <ChevronRight size={24} color="rgba(255,255,255,0.72)" />
      </Pressable>

      <View style={styles.guidedCard}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionEyebrow}>Séance guidée</Text>
          <Text style={styles.sectionTitle}>Programme {selectedLevelLabel}</Text>
          <Text style={styles.sectionSubtitle}>
            {"La séance suit un minuteur. Elle est enregistrée uniquement si toutes les étapes sont terminées."}
          </Text>
        </View>

        <View style={styles.levelContainer}>
          {program.data.levels.map((level) => (
            <Pressable
              key={level.key}
              style={[styles.levelCard, selectedLevel === level.key && styles.levelCardActive]}
              onPress={() => setSelectedLevel(level.key)}
              disabled={isPlaying}
            >
              <Text style={[styles.levelLabel, selectedLevel === level.key && styles.levelLabelActive]}>
                {level.label}
              </Text>
              <Text style={[styles.levelSessions, selectedLevel === level.key && styles.levelSessionsActive]}>
                {level.sessions} sessions
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.summaryCard}>
        <Summary icon={<Clock size={18} color={colors.plum} />} value={formatSeconds(program.data.summary.total_duration_seconds)} label="Temps total" />
        <Summary icon={<CheckCircle2 size={18} color={colors.plum} />} value={exercises.length} label="Étapes" />
        <Summary icon={<Play size={18} color={colors.plum} />} value={`${program.data.summary.objective_percent}%`} label="Objectif" />
      </View>

      <View style={styles.sectionHeaderCompact}>
        <Text style={styles.sectionTitle}>Déroulé de la séance</Text>
        <Text style={styles.sectionSubtitle}>Suivez les étapes dans l’ordre. Le minuteur passe automatiquement à la suite.</Text>
      </View>

      <View style={styles.exerciseList}>
        {exercises.map((exercise, index) => {
          const active = isPlaying && currentExercise === index;
          return (
            <View key={exercise.id} style={[styles.exerciseCard, active && styles.exerciseCardActive]}>
              <View style={[styles.exerciseIndex, active && styles.exerciseIndexActive]}>
                <Text style={[styles.exerciseIndexText, active && styles.exerciseIndexTextActive]}>{index + 1}</Text>
              </View>
              <View style={styles.flex}>
                <View style={styles.exerciseTitleRow}>
                  <Text style={styles.exerciseName}>{exercise.name}</Text>
                  {active ? <Text style={styles.activePill}>En cours</Text> : null}
                </View>
                <Text style={styles.exerciseDescription}>{exercise.description}</Text>
              </View>
              <Text style={styles.exerciseDuration}>{formatSeconds(exercise.timer_duration_seconds)}</Text>
            </View>
          );
        })}
      </View>

      {isPlaying && activeExercise ? (
        <View style={styles.playerCard}>
          <Text style={styles.playerLabel}>Étape {currentExercise + 1} sur {exercises.length}</Text>
          <Text style={styles.playerTitle}>{activeExercise.name}</Text>
          <Text style={styles.playerDescription}>{activeExercise.description}</Text>
          <Text style={styles.timer}>{formatSeconds(timeLeft)}</Text>
          <View style={styles.progressTrack}>
            <Animated.View style={[styles.progressFill, progressStyle]} />
          </View>
        </View>
      ) : null}

      <LinearGradient colors={gradients.primary} style={styles.actionButton}>
        <Pressable style={styles.actionPressable} onPress={isPlaying ? stopSession : startSession}>
          {isPlaying ? <Square size={20} color={colors.surface} /> : <Play size={20} color={colors.surface} />}
          <Text style={styles.actionText}>{isPlaying ? "Arrêter la séance" : "Démarrer la séance guidée"}</Text>
        </Pressable>
      </LinearGradient>

      {!isPlaying ? (
        <Text style={styles.footerNote}>
          {"La session sera ajoutée à votre suivi lorsque le minuteur arrive à la fin."}
        </Text>
      ) : null}
    </ScrollView>
  );
}

function Summary({ icon, value, label }: { icon: ReactNode; value: string | number; label: string }) {
  return (
    <View style={styles.summaryItem}>
      {icon}
      <Text style={styles.summaryValue}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.xl, paddingTop: 56, paddingBottom: 120, gap: spacing.xl },
  header: { gap: spacing.xs },
  title: { fontSize: 28, fontWeight: "900", color: colors.plum },
  subtitle: { color: colors.textMuted, marginTop: 4, lineHeight: 20, fontWeight: "600" },
  guidedCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.lg,
  },
  sectionHeader: { gap: spacing.xs },
  sectionHeaderCompact: { gap: spacing.xs, marginTop: spacing.xs },
  sectionEyebrow: {
    color: colors.coral,
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  sectionTitle: { color: colors.plum, fontSize: 20, fontWeight: "900" },
  sectionSubtitle: { color: colors.textMuted, lineHeight: 20, fontWeight: "600" },
  levelContainer: { flexDirection: "row", gap: spacing.sm },
  levelCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  levelCardActive: { backgroundColor: colors.plum, borderColor: colors.plum },
  levelLabel: { color: colors.plum, fontWeight: "900", fontSize: 13 },
  levelLabelActive: { color: colors.surface },
  levelSessions: { color: colors.textMuted, fontSize: 11, marginTop: 4 },
  levelSessionsActive: { color: colors.blush },
  summaryCard: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  modeCard: {
    flexDirection: "row",
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  modeTitle: { color: colors.plum, fontSize: 16, fontWeight: "900" },
  modeText: { color: colors.textMuted, marginTop: 4, lineHeight: 20 },
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
  gameEyebrow: { color: colors.blush, fontSize: 12, fontWeight: "900", textTransform: "uppercase" },
  gameTitle: { color: colors.surface, fontSize: 18, fontWeight: "900" },
  gameSub: { color: "rgba(255,255,255,0.72)", fontSize: 13, marginTop: 3, lineHeight: 18 },
  summaryItem: { flex: 1, alignItems: "center", gap: 4 },
  summaryValue: { color: colors.plum, fontSize: 18, fontWeight: "900" },
  summaryLabel: { color: colors.textMuted, fontSize: 11, fontWeight: "700" },
  exerciseList: { gap: spacing.md },
  exerciseCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  exerciseCardActive: { borderColor: colors.coral, backgroundColor: colors.surfaceAlt },
  exerciseIndex: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  exerciseIndexActive: {
    backgroundColor: colors.plum,
    borderColor: colors.plum,
  },
  exerciseIndexText: {
    color: colors.plum,
    fontWeight: "900",
  },
  exerciseIndexTextActive: {
    color: colors.surface,
  },
  exerciseTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  exerciseName: { color: colors.text, fontSize: 16, fontWeight: "900" },
  exerciseDescription: { color: colors.textMuted, fontSize: 13, marginTop: 3 },
  exerciseDuration: {
    color: colors.plum,
    fontWeight: "900",
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: 999,
    overflow: "hidden",
  },
  activePill: {
    color: colors.surface,
    backgroundColor: colors.coral,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 999,
    overflow: "hidden",
    fontSize: 11,
    fontWeight: "900",
  },
  playerCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.xl,
    alignItems: "center",
    gap: spacing.sm,
  },
  playerLabel: { color: colors.textMuted, fontWeight: "700" },
  playerTitle: { color: colors.plum, fontSize: 22, fontWeight: "900", textAlign: "center" },
  playerDescription: { color: colors.textMuted, textAlign: "center", lineHeight: 20, fontWeight: "600" },
  timer: { color: colors.coral, fontSize: 36, fontWeight: "900" },
  progressTrack: { width: "100%", height: 10, backgroundColor: colors.border, borderRadius: 999, overflow: "hidden" },
  progressFill: { height: "100%", backgroundColor: colors.coral, borderRadius: 999 },
  actionButton: { borderRadius: 999, overflow: "hidden" },
  actionPressable: {
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: spacing.sm,
  },
  actionText: { color: colors.surface, fontSize: 17, fontWeight: "900" },
  footerNote: {
    color: colors.textMuted,
    textAlign: "center",
    lineHeight: 20,
    fontWeight: "600",
    paddingHorizontal: spacing.lg,
  },
  flex: { flex: 1 },
});
