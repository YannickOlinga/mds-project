import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import InputModeSelector from '@/components/ui/InputModeSelector';

type GameCard = {
  id: string;
  emoji: string;
  title: string;
  description: string;
  objective: string;
  route: string;
  gradient: [string, string];
  isNew?: boolean;
};

const GAMES: GameCard[] = [
  {
    id: 'papillon',
    emoji: '🦋',
    title: 'Papillon',
    description: 'Guide le papillon à travers les obstacles',
    objective: 'Coordination & navigation',
    route: '/game',
    gradient: ['#C95F7B', '#C95F7B'],
  },
  {
    id: 'bulles',
    emoji: '🫧',
    title: 'Bulles de Lumière',
    description: 'Attrape les bulles en ajustant ta contraction',
    objective: 'Précision & positionnement',
    route: '/game-bulles',
    gradient: ['#1A3A5C', '#1A3A5C'],
    isNew: true,
  },
  {
    id: 'eclipse',
    emoji: '🌑',
    title: 'Éclipse',
    description: 'Synchronise tes contractions avec les anneaux',
    objective: 'Rythme & timing',
    route: '/game-eclipse',
    gradient: ['#2C0A3E', '#2C0A3E'],
    isNew: true,
  },
  {
    id: 'source',
    emoji: '💧',
    title: 'La Source',
    description: 'Maintiens le niveau d\'eau dans la zone cible',
    objective: 'Endurance & contrôle',
    route: '/game-source',
    gradient: ['#0D3B2E', '#0D3B2E'],
    isNew: true,
  },
];

export default function GameHub() {
  return (
    <LinearGradient colors={['#4A1060', '#9B2855', '#FCF0F3']} style={s.screen}>
      <Pressable style={s.backBtn} onPress={() => router.back()} hitSlop={12}>
        <Text style={s.backText}>←</Text>
      </Pressable>

      <Text style={s.title}>Exercices Interactifs</Text>
      <Text style={s.subtitle}>
        Choisis ton mode de jeu, puis sélectionne un exercice
      </Text>

      <ScrollView
        style={s.list}
        contentContainerStyle={s.listContent}
        showsVerticalScrollIndicator={false}
      >
        <InputModeSelector />

        {GAMES.map((game) => (
          <Pressable key={game.id} onPress={() => router.push(game.route as never)}>
            <LinearGradient colors={game.gradient} style={s.card}>
              {game.isNew && (
                <View style={s.newBadge}>
                  <Text style={s.newBadgeText}>Nouveau</Text>
                </View>
              )}
              <View style={s.cardTop}>
                <Text style={s.cardEmoji}>{game.emoji}</Text>
                <View style={s.cardText}>
                  <Text style={s.cardTitle}>{game.title}</Text>
                  <Text style={s.cardDesc}>{game.description}</Text>
                </View>
                <Text style={s.cardArrow}>›</Text>
              </View>
              <View style={s.objectivePill}>
                <Text style={s.objectiveText}>{game.objective}</Text>
              </View>
            </LinearGradient>
          </Pressable>
        ))}

        <View style={s.tip}>
          <Text style={s.tipText}>
             Maintenez appuyé = contraction · Relâchez = repos
          </Text>
          <Text style={s.tipSub}>
            Mode sonde IoT (Bluetooth/WiFi) ou écran tactile, au choix
          </Text>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, paddingTop: 60 },
  backBtn: {
    position: 'absolute', top: 52, left: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 999, width: 40, height: 40,
    alignItems: 'center', justifyContent: 'center',
    zIndex: 10,
  },
  backText: { color: 'white', fontSize: 20, fontWeight: '900' },
  title: {
    fontSize: 28, fontWeight: '900', color: 'white',
    textAlign: 'center', marginTop: 16, paddingHorizontal: 24,
  },
  subtitle: {
    fontSize: 14, color: 'rgba(255,255,255,0.7)',
    textAlign: 'center', marginTop: 6, marginBottom: 8,
    paddingHorizontal: 32,
  },
  list: { flex: 1 },
  listContent: { padding: 20, gap: 14, paddingBottom: 40 },
  card: {
    borderRadius: 22, padding: 20,
    gap: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25, shadowRadius: 12, elevation: 8,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  cardEmoji: { fontSize: 40 },
  cardText: { flex: 1, minWidth: 0 },
  cardTitle: { fontSize: 20, fontWeight: '900', color: 'white' },
  cardDesc: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 3, lineHeight: 18 },
  cardArrow: { fontSize: 28, color: 'rgba(255,255,255,0.6)', fontWeight: '300' },
  objectivePill: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 999, paddingHorizontal: 14, paddingVertical: 5,
    alignSelf: 'flex-start',
  },
  objectiveText: { fontSize: 12, color: 'rgba(255,255,255,0.9)', fontWeight: '700' },
  newBadge: {
    position: 'absolute', top: 12, right: 12,
    backgroundColor: '#FFD700',
    borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3,
  },
  newBadgeText: { fontSize: 10, fontWeight: '900', color: '#1A1A1A' },
  tip: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 16, padding: 16,
    alignItems: 'center', gap: 4, marginTop: 4,
  },
  tipText: { fontSize: 13, color: 'rgba(255,255,255,0.85)', textAlign: 'center', fontWeight: '700' },
  tipSub: { fontSize: 11, color: 'rgba(255,255,255,0.5)', textAlign: 'center' },
});
