import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming } from 'react-native-reanimated';

const ChallengesScreen = () => {
  const shine = useSharedValue(0);

  const shineStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shine.value }],
  }));

  React.useEffect(() => {
    shine.value = withRepeat(
      withTiming(100, { duration: 2000 }),
      -1,
      false
    );
  }, []);

  const activeChallenges = [
    {
      id: 1,
      title: '30 jours consécutifs',
      progress: 22,
      target: 30,
      reward: 'Badge Streak d\'or',
    },
    {
      id: 2,
      title: '5 sessions par semaine',
      progress: 4,
      target: 5,
      reward: 'Bonus XP x2',
    },
  ];

  const leaderboard = [
    { rank: 1, name: 'Alice M.', score: 156, color: '#FFD700' },
    { rank: 2, name: 'Bob L.', score: 148, color: '#C0C0C0' },
    { rank: 3, name: 'Claire D.', score: 142, color: '#CD7F32' },
    { rank: 15, name: 'Vous', score: 98, color: '#6A1E3A' },
  ];

  const upcoming = [
    { title: 'Défi 7 jours 100%', date: 'Lun 10 mars' },
    { title: 'Marathon 60min', date: 'Ven 14 mars' },
    { title: 'Défi communauté', date: '1er avril' },
  ];

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Challenges</Text>
      </View>

      {/* Active Challenges */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Challenges actifs</Text>
        {activeChallenges.map((challenge) => (
          <View key={challenge.id} style={styles.challengeCard}>
            <View style={styles.challengeHeader}>
              <Ionicons name="trophy" size={24} color="#6A1E3A" />
              <View>
                <Text style={styles.challengeTitle}>{challenge.title}</Text>
                <Text style={styles.challengeReward}>{challenge.reward}</Text>
              </View>
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${(challenge.progress / challenge.target) * 100}%` }]} />
            </View>
            <Text style={styles.progressText}>{challenge.progress}/{challenge.target}</Text>
          </View>
        ))}
      </View>

      {/* Leaderboard */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Classement</Text>
        <View style={styles.podium}>
          <View style={styles.podiumStand}>
            <View style={styles.podiumBase} />
            <View style={styles.podiumPerson}>
              <View style={styles.avatar1} />
              <Text style={styles.rank1}>1</Text>
              <Text style={styles.name}>Alice M.</Text>
              <Text style={styles.score}>156</Text>
            </View>
          </View>
          <View style={[styles.podiumStand, styles.podiumStand2]}>
            <View style={styles.podiumBase} />
            <View style={styles.podiumPerson}>
              <View style={styles.avatar2} />
              <Text style={styles.rank2}>2</Text>
              <Text style={styles.name}>Bob L.</Text>
              <Text style={styles.score}>148</Text>
            </View>
          </View>
          <View style={[styles.podiumStand, styles.podiumStand3]}>
            <View style={styles.podiumBase} />
            <View style={styles.podiumPerson}>
              <View style={styles.avatar3} />
              <Text style={styles.rank3}>3</Text>
              <Text style={styles.name}>Claire D.</Text>
              <Text style={styles.score}>142</Text>
            </View>
          </View>
        </View>
        <View style={styles.userRankCard}>
          <Text style={styles.yourRank}>Votre rang</Text>
          <View style={styles.userRankRow}>
            <Text style={styles.userRankNumber}>15</Text>
            <Text style={styles.userRankScore}>98 pts</Text>
          </View>
        </View>
      </View>

      {/* Upcoming */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>À venir</Text>
        {upcoming.map((challenge, index) => (
          <View key={index} style={styles.upcomingCard}>
            <Text style={styles.upcomingTitle}>{challenge.title}</Text>
            <Text style={styles.upcomingDate}>{challenge.date}</Text>
          </View>
        ))}
      </View>

      <View style={{ height: 100 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5ECEC',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#5A1A30',
  },
  section: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#5A1A30',
    marginBottom: 16,
  },
  challengeCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  challengeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  challengeTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#5A1A30',
  },
  challengeReward: {
    fontSize: 12,
    color: '#B9657C',
    fontWeight: '600',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#EAD7DA',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#B9657C',
  },
  progressText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6A1E3A',
    textAlign: 'center',
  },
  podium: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
  },
  podiumStand: {
    alignItems: 'center',
  },
  podiumStand2: {
    transform: [{ scale: 0.9 }],
  },
  podiumStand3: {
    transform: [{ scale: 0.8 }],
  },
  podiumBase: {
    width: 60,
    height: 40,
    backgroundColor: '#EAD7DA',
    borderRadius: 8,
  },
  podiumPerson: {
    width: 80,
    height: 140,
    alignItems: 'center',
    marginTop: 8,
  },
  avatar1: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFD700',
    marginBottom: 8,
  },
  avatar2: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#C0C0C0',
    marginBottom: 8,
  },
  avatar3: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#CD7F32',
    marginBottom: 8,
  },
  rank1: {
    fontSize: 24,
    fontWeight: '800',
    color: '#6A1E3A',
    marginBottom: 4,
  },
  rank2: {
    fontSize: 20,
    fontWeight: '700',
    color: '#6A1E3A',
    marginBottom: 4,
  },
  rank3: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6A1E3A',
    marginBottom: 4,
  },
  name: {
    fontSize: 14,
    fontWeight: '700',
    color: '#5A1A30',
    marginBottom: 4,
  },
  score: {
    fontSize: 16,
    fontWeight: '800',
    color: '#6A1E3A',
  },
  userRankCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  yourRank: {
    fontSize: 14,
    color: '#9B5C6C',
    marginBottom: 8,
  },
  userRankRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  userRankNumber: {
    fontSize: 36,
    fontWeight: '800',
    color: '#6A1E3A',
  },
  userRankScore: {
    fontSize: 16,
    color: '#9B5C6C',
  },
  upcomingCard: {
    backgroundColor: '#F0E0E3',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
  },
  upcomingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6A1E3A',
  },
  upcomingDate: {
    fontSize: 14,
    color: '#9B5C6C',
    marginTop: 4,
  },
});

export default ChallengesScreen;

