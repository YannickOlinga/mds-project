import { View, Text, StyleSheet, ScrollView, Pressable, Animated, Easing } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useState, useEffect, useRef } from "react";

interface Exercise {
  id: number;
  name: string;
  description: string;
  duration: number;
  icon: string;
}

export default function TrainingScreen() {
  const [selectedLevel, setSelectedLevel] = useState<"debutant" | "intermediaire" | "avance">("debutant");
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentExercise, setCurrentExercise] = useState(0);
  const [timeLeft, setTimeLeft] = useState(10);
  const progressAnim = useRef(new Animated.Value(0)).current;

  const exercises: Exercise[] = [
    { id: 1, name: "Contraction douce", description: "Contractez les muscles du plancher pelvien", duration: 10, icon: "💪" },
    { id: 2, name: "Relâchement", description: "Détendez complètement les muscles", duration: 10, icon: "🧘" },
    { id: 3, name: "Contraction longue", description: "Maintenez la contraction 5 secondes", duration: 10, icon: "⏱️" },
    { id: 4, name: "Répétition rapide", description: "Contractions courtes et rapides", duration: 15, icon: "⚡" },
  ];

  const levels = [
    { key: "debutant", label: "Débutant", color: "#B9657C", sessions: "5 sessions" },
    { key: "intermediaire", label: "Intermédiaire", color: "#6A1E3A", sessions: "12 sessions" },
    { key: "avance", label: "Avancé", color: "#5A1A30", sessions: "20 sessions" },
  ];

  const progress = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ["0%", "100%"],
  });

  const startExercise = () => {
    setIsPlaying(true);
    setCurrentExercise(0);
    setTimeLeft(exercises[0].duration);
    Animated.loop(
      Animated.timing(progressAnim, {
        toValue: 100,
        duration: exercises[0].duration * 1000,
        easing: Easing.linear,
        useNativeDriver: false,
      })
    ).start();
  };

  useEffect(() => {
    if (isPlaying && timeLeft > 0) {
      const timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (isPlaying && timeLeft === 0) {
      if (currentExercise < exercises.length - 1) {
        setCurrentExercise(currentExercise + 1);
        setTimeLeft(exercises[currentExercise + 1].duration);
        progressAnim.setValue(0);
      } else {
        setIsPlaying(false);
        progressAnim.setValue(0);
      }
    }
  }, [isPlaying, timeLeft]);

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.back}>← Retour</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Entraînement</Text>
      </View>

      {/* Level Selection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Choisir votre niveau</Text>
        <View style={styles.levelContainer}>
          {levels.map((level) => (
            <Pressable
              key={level.key}
              style={[
                styles.levelCard,
                selectedLevel === level.key && { backgroundColor: level.color },
              ]}
              onPress={() => setSelectedLevel(level.key as "debutant" | "intermediaire" | "avance")}
            >
              <Text
                style={[
                  styles.levelLabel,
                  selectedLevel === level.key && { color: "#FFF5F5" },
                ]}
              >
                {level.label}
              </Text>
              <Text
                style={[
                  styles.levelSessions,
                  selectedLevel === level.key && { color: "#F5D5DD" },
                ]}
              >
                {level.sessions}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Exercise Preview */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Programme du jour</Text>
        <View style={styles.exerciseList}>
          {exercises.map((exercise, index) => (
            <View
              key={exercise.id}
              style={[
                styles.exerciseCard,
                currentExercise === index && isPlaying && styles.activeExercise,
              ]}
            >
              <View style={styles.exerciseIcon}>
                <Text style={styles.exerciseIconText}>{exercise.icon}</Text>
              </View>
              <View style={styles.exerciseInfo}>
                <Text style={styles.exerciseName}>{exercise.name}</Text>
                <Text style={styles.exerciseDesc}>{exercise.description}</Text>
              </View>
              <View style={styles.exerciseDuration}>
                <Text style={styles.durationText}>{exercise.duration}s</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Training Summary */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryIcon}>⏱️</Text>
          <Text style={styles.summaryValue}>45 min</Text>
          <Text style={styles.summaryLabel}>Durée totale</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryIcon}>📊</Text>
          <Text style={styles.summaryValue}>4</Text>
          <Text style={styles.summaryLabel}>Exercices</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryIcon}>🎯</Text>
          <Text style={styles.summaryValue}>85%</Text>
          <Text style={styles.summaryLabel}>Objectif</Text>
        </View>
      </View>

      {/* Start Button */}
      <View style={styles.buttonContainer}>
        <LinearGradient
          colors={["#B9657C", "#6A1E3A"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.startButton}
        >
          <Pressable onPress={startExercise}>
            <Text style={styles.startButtonText}>
              {isPlaying ? "En cours..." : "Commencer l'entraînement"}
            </Text>
          </Pressable>
        </LinearGradient>
      </View>

      {/* Progress Indicator */}
      {isPlaying && (
        <View style={styles.progressSection}>
          <View style={styles.currentExerciseCard}>
            <Text style={styles.currentExerciseLabel}>Exercice en cours</Text>
            <Text style={styles.currentExerciseName}>
              {exercises[currentExercise].name}
            </Text>
            <Text style={styles.currentExerciseIcon}>
              {exercises[currentExercise].icon}
            </Text>
            <View style={styles.timerCircle}>
              <Text style={styles.timerText}>{timeLeft}s</Text>
            </View>
            <View style={styles.progressBar}>
              <Animated.View
                style={[styles.progressFill, { width: progress }]}
              />
            </View>
          </View>
        </View>
      )}

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
  back: {
    color: "#9B6A75",
    fontSize: 16,
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 20,
    fontWeight: "800",
    color: "#5A1A30",
    marginRight: 40,
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
  levelContainer: {
    flexDirection: "row",
    gap: 10,
  },
  levelCard: {
    flex: 1,
    backgroundColor: "#FFF5F5",
    borderRadius: 16,
    padding: 14,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  levelLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#5A1A30",
  },
  levelSessions: {
    fontSize: 11,
    color: "#8A5A65",
    marginTop: 4,
  },
  exerciseList: {
    gap: 10,
  },
  exerciseCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF5F5",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#EAD7DA",
  },
  activeExercise: {
    borderColor: "#B9657C",
    backgroundColor: "#FFF0F3",
  },
  exerciseIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#EAD7DA",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  exerciseIconText: {
    fontSize: 20,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#5A1A30",
  },
  exerciseDesc: {
    fontSize: 12,
    color: "#8A5A65",
    marginTop: 2,
  },
  exerciseDuration: {
    backgroundColor: "#EAD7DA",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  durationText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6A1E3A",
  },
  summaryCard: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "#6A1E3A",
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 24,
    marginBottom: 24,
  },
  summaryItem: {
    alignItems: "center",
  },
  summaryIcon: {
    fontSize: 20,
    marginBottom: 6,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: "800",
    color: "#FFF5F5",
  },
  summaryLabel: {
    fontSize: 11,
    color: "#F5D5DD",
    marginTop: 2,
  },
  summaryDivider: {
    width: 1,
    height: 40,
    backgroundColor: "#8A3A5A",
  },
  buttonContainer: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  startButton: {
    borderRadius: 40,
    paddingVertical: 18,
    alignItems: "center",
  },
  startButtonText: {
    color: "white",
    fontWeight: "800",
    fontSize: 18,
  },
  progressSection: {
    paddingHorizontal: 24,
  },
  currentExerciseCard: {
    backgroundColor: "#FFF5F5",
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#B9657C",
  },
  currentExerciseLabel: {
    fontSize: 12,
    color: "#8A5A65",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  currentExerciseName: {
    fontSize: 22,
    fontWeight: "800",
    color: "#5A1A30",
    marginTop: 8,
    marginBottom: 16,
  },
  currentExerciseIcon: {
    fontSize: 48,
    marginBottom: 20,
  },
  timerCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: "#B9657C",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  timerText: {
    fontSize: 28,
    fontWeight: "800",
    color: "#6A1E3A",
  },
  progressBar: {
    width: "100%",
    height: 8,
    backgroundColor: "#EAD7DA",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#B9657C",
    borderRadius: 4,
  },
});

