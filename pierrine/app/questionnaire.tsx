import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Question {
  id: string;
  title: string;
  subtitle: string;
  options: string[];
  multi?: boolean;
  isSummary?: boolean;
}

const QUESTIONS: Question[] = [
  {
    id: 'experience',
    title: 'Quel est votre niveau d\'expérience ?',
    subtitle: 'Sélectionnez l\'option qui vous correspond le mieux',
    options: ['Débutant', 'Intermédiaire', 'Avancé'],
  },
  {
    id: 'objectif',
    title: 'Quel est votre objectif principal ?',
    subtitle: 'Choisissez votre priorité',
    options: ['Renforcement', 'Maintien', 'Rééducation post-accouchement'],
  },
  {
    id: 'frequence',
    title: 'Quelle fréquence par semaine ?',
    subtitle: 'Séances idéales',
    options: ['3 fois/semaine', '4-5 fois/semaine', 'Quotidien'],
  },
  {
    id: 'symptomes',
    title: 'Quels symptômes rencontrez-vous ?',
    subtitle: 'Sélectionnez tous les cas (multi-sélection)',
    options: ['Fuites urinaires', 'Faiblesse générale', 'Douleurs pelviennes', 'Aucun'],
    multi: true,
  },
  {
    id: 'resume',
    title: 'Confirmation',
    subtitle: 'Revoyez vos réponses avant de commencer',
    options: [],
    isSummary: true,
  },
];

type Answer = string | string[];
type Answers = Partial<Record<typeof QUESTIONS[number]['id'], Answer>>;

import useAuthStore from '@/store/authStore';

export default function Questionnaire() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const authStore = useAuthStore();

  const currentQuestion = QUESTIONS[step];

  // ✅ FIX : le résumé est toujours considéré comme "répondu"
  const hasAnswer = currentQuestion.isSummary || !!answers[currentQuestion.id];

  const updateAnswer = useCallback((selected: string | string[]) => {
    Haptics.selectionAsync();
    setAnswers(prev => ({ ...prev, [currentQuestion.id]: selected }));
  }, [currentQuestion.id]);

  const handleNext = () => {
    if (step === QUESTIONS.length - 1) {
      console.log('Réponses:', answers);
      
      // Mock auth to prevent white screen / auth redirect
      authStore.login({
        accessToken: 'mock-qnr-token-' + Date.now(),
        refreshToken: 'mock-refresh-' + Date.now(),
      }, {
        id: 'mock-qnr-user',
        username: 'questionnaire-user',
        email: 'qnr@example.com',
      });
      
      router.push('/(tabs)');
    } else if (hasAnswer) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
  };

  const translateX = useSharedValue(0);
  const opacity = useSharedValue(1);

  const contentStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateX: translateX.value }],
  }));

  React.useEffect(() => {
    translateX.value = withTiming(0, { duration: 300 });
    opacity.value = withTiming(1, { duration: 300 });
  }, [step]);

  const summaryContent = (
    <View style={styles.summary}>
      {QUESTIONS.slice(0, -1).map((q) => (
        <View key={q.id} style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>{q.title.slice(0, 20)}...</Text>
          <Text style={styles.summaryValue}>
            {Array.isArray(answers[q.id as keyof Answers])
              ? (answers[q.id as keyof Answers] as string[]).join(', ')
              : (answers[q.id as keyof Answers] as string) || 'Non répondu'
            }
          </Text>
        </View>
      ))}
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Progress */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${((step + 1) / QUESTIONS.length) * 100}%` }]} />
          </View>
          <Text style={styles.progressText}>{step + 1} / {QUESTIONS.length}</Text>
        </View>

        <Animated.View style={[styles.content, contentStyle]}>
          <Text style={styles.title}>{currentQuestion.title}</Text>
          <Text style={styles.subtitle}>{currentQuestion.subtitle}</Text>

          {currentQuestion.isSummary ? (
            summaryContent
          ) : (
            <View style={styles.optionsContainer}>
              {currentQuestion.options.map((option: string) => {
                const answer = answers[currentQuestion.id as keyof Answers] as string | string[] | undefined;
                const isSelected = Array.isArray(answer)
                  ? answer.includes(option)
                  : answer === option;

                return (
                  <Pressable
                    key={option}
                    style={[
                      styles.optionButton,
                      isSelected && styles.optionButtonSelected,
                    ]}
                    onPress={() => {
                      if (currentQuestion.multi) {
                        const current = Array.isArray(answer) ? answer : [];
                        const newSelected = current.includes(option)
                          ? current.filter((o: string) => o !== option)
                          : [...current, option];
                        updateAnswer(newSelected.length ? newSelected : '');
                      } else {
                        updateAnswer(option);
                      }
                    }}
                  >
                    <Text style={[
                      styles.optionText,
                      isSelected && styles.optionTextSelected,
                    ]}>
                      {option}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          )}
        </Animated.View>
      </ScrollView>

      {/* Buttons */}
      <View style={styles.buttonsContainer}>
        {step > 0 && (
          <Pressable style={styles.backButton} onPress={handleBack}>
            <Text style={styles.backText}>Retour</Text>
          </Pressable>
        )}
        <LinearGradient
          colors={['#C75C7A', '#8B1E3F']}
          style={[
            styles.nextButton,
            !hasAnswer && styles.nextButtonDisabled,
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <Pressable
            style={styles.nextPressable}
            onPress={handleNext}
            disabled={!hasAnswer}
          >
            <Text style={styles.nextText}>
              {step === QUESTIONS.length - 1 ? 'Commencer' : 'Suivant'}
            </Text>
          </Pressable>
        </LinearGradient>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9EDEE',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 32,
    paddingTop: 60,
  },
  progressContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  progressBar: {
    width: SCREEN_WIDTH * 0.8,
    height: 6,
    backgroundColor: '#EDE7E8',
    borderRadius: 3,
    marginBottom: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#6A1E3A',
  },
  progressText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6A1E3A',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#6A1E3A',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 32,
  },
  subtitle: {
    fontSize: 16,
    color: '#9B5C6C',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  optionsContainer: {
    gap: 16,
  },
  optionButton: {
    paddingVertical: 20,
    paddingHorizontal: 24,
    backgroundColor: 'white',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'rgba(106, 30, 58, 0.1)',
  },
  optionButtonSelected: {
    borderColor: '#6A1E3A',
    backgroundColor: 'rgba(106, 30, 58, 0.05)',
  },
  optionText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6A1E3A',
    textAlign: 'center',
  },
  optionTextSelected: {
    color: '#8B1E3F',
    fontWeight: '800',
  },
  summary: {
    gap: 16,
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#6A1E3A',
  },
  summaryLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#6A1E3A',
  },
  summaryValue: {
    fontSize: 16,
    color: '#8B1E3F',
    fontWeight: '700',
  },
  buttonsContainer: {
    flexDirection: 'row',
    padding: 32,
    gap: 16,
    backgroundColor: '#F9EDEE',
  },
  backButton: {
    flex: 1,
    paddingVertical: 18,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: '#EDE7E8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#9B5C6C',
  },
  nextButton: {
    flex: 1,
    borderRadius: 28,
    overflow: 'hidden',
  },
  nextButtonDisabled: {
    opacity: 0.6,
  },
  nextPressable: {
    flex: 1,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextText: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
  },
});