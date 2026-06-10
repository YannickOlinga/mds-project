/**
 * Éclipse — Jeu de rythme
 *
 * Des anneaux s'expandent depuis le centre vers l'extérieur.
 * Le joueur doit être dans le bon état (contracté / relâché) au moment
 * où chaque anneau atteint la zone de validation.
 *
 * Anneau rose  = Contractez (maintenez appuyé)
 * Anneau bleu  = Relâchez   (lâchez le bouton)
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Dimensions, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { ACTION_UI, PROTOCOLS, isContractPhase, phaseAt, totalDurMs, type ExPhase, type Protocol } from '@/lib/exercises';
import { touchSignal } from '@/services/touchSignal';
import { useDeviceStore } from '@/store/deviceStore';

const { width: W, height: H } = Dimensions.get('window');

const CENTER_X   = W / 2;
const CENTER_Y   = H / 2;
const HIT_RADIUS = W * 0.38;     // rayon de la zone de validation
const RING_SPEED = 2.8;          // px/frame d'expansion
const HIT_WINDOW = 22;           // marge de tolérance (px) sur le rayon
const FPS        = 60;

type Ring = {
  id: number;
  radius: number;
  type: 'contract' | 'relax';
  scored: boolean;
  missed: boolean;
};

type GameState = 'select' | 'playing' | 'complete';
const RING_COLORS = { contract: '#C95F7B', relax: '#5A77C0' };
const RING_LABELS = { contract: '', relax: '' };

export default function EclipseGame() {
  const [, tick]        = useState(0);
  const [gameState, setGameState]       = useState<GameState>('select');
  const [protocol, setProtocol]         = useState(PROTOCOLS[0]);
  const [score, setScore]               = useState(0);
  const [combo, setCombo]               = useState(0);
  const [currentPhase, setCurrentPhase] = useState<ExPhase | null>(null);
  const [exProgress, setExProgress]     = useState(0);
  const [feedback, setFeedback]         = useState<'good' | 'miss' | null>(null);

  const inputMode = useDeviceStore((s) => s.inputMode);

  const pressed    = useRef(false);
  const rings      = useRef<Ring[]>([]);
  const ringId     = useRef(0);
  const running    = useRef(false);
  const exMs       = useRef(0);
  const contLevel  = useRef(0);
  const protoRef   = useRef(protocol);
  protoRef.current = protocol;

  const gameLoopRef  = useRef<ReturnType<typeof setInterval> | null>(null);
  const spawnLoopRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stop = useCallback(() => {
    running.current = false;
    if (gameLoopRef.current)   { clearInterval(gameLoopRef.current);   gameLoopRef.current  = null; }
    if (spawnLoopRef.current)  { clearInterval(spawnLoopRef.current);  spawnLoopRef.current = null; }
    if (feedbackTimer.current) { clearTimeout(feedbackTimer.current);  feedbackTimer.current = null; }
  }, []);

  useEffect(() => () => stop(), [stop]);

  const spawnRing = useCallback(() => {
    const proto    = protoRef.current;
    const travelMs = (HIT_RADIUS / RING_SPEED) * (1000 / FPS);
    const arrival  = exMs.current + travelMs;
    const phase    = phaseAt(proto, arrival);
    const type     = phase && isContractPhase(phase.action) ? 'contract' : 'relax';
    rings.current  = [...rings.current, { id: ringId.current++, radius: 20, type, scored: false, missed: false }];
  }, []);

  const startGame = useCallback(() => {
    stop();
    const proto = protoRef.current;
    rings.current  = [];
    exMs.current   = 0;
    running.current = true;
    setScore(0); setCombo(0); setFeedback(null);
    setCurrentPhase(proto.phases[0] ?? null);
    setExProgress(0);
    setGameState('playing');

    const spawnInterval = proto.id === 'avance' ? 1600 : proto.id === 'intermediaire' ? 2200 : 3000;
    setTimeout(() => {
      if (!running.current) return;
      spawnRing();
      spawnLoopRef.current = setInterval(() => {
        if (running.current) spawnRing();
      }, spawnInterval);
    }, 1000);

    gameLoopRef.current = setInterval(() => {
      if (!running.current) return;

      exMs.current += 1000 / FPS;
      const exPhase = phaseAt(proto, exMs.current);
      if (exPhase === null) {
        stop(); setGameState('complete');
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        return;
      }
      if (Math.floor(exMs.current) % 3 === 0) {
        setCurrentPhase(exPhase);
        setExProgress(Math.min(1, exMs.current / totalDurMs(proto)));
      }

      const isIot    = useDeviceStore.getState().inputMode === 'iot';
      const isActive = isIot ? touchSignal.isPressed : pressed.current;
      contLevel.current += ((isActive ? 1 : 0) - contLevel.current) * 0.12;

      // Expansion des anneaux
      const expanded = rings.current.map((r) => ({ ...r, radius: r.radius + RING_SPEED }));

      // Vérification hit / miss dans la fenêtre de validation
      let pts = 0, newCombo = combo;
      for (const r of expanded) {
        if (r.scored || r.missed) continue;
        const dist = Math.abs(r.radius - HIT_RADIUS);
        if (dist < HIT_WINDOW) {
          const correct = (r.type === 'contract' && isActive) || (r.type === 'relax' && !isActive);
          if (correct) {
            r.scored = true;
            pts++;
            newCombo++;
            setFeedback('good');
            if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
            feedbackTimer.current = setTimeout(() => setFeedback(null), 500);
            void Haptics.selectionAsync();
          }
        }
        // Fenêtre dépassée sans score → miss
        if (r.radius > HIT_RADIUS + HIT_WINDOW && !r.scored) {
          r.missed = true;
          newCombo = 0;
          setFeedback('miss');
          if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
          feedbackTimer.current = setTimeout(() => setFeedback(null), 500);
        }
      }

      rings.current = expanded.filter((r) => r.radius < W * 0.7);
      if (pts > 0) {
        setScore((s) => s + pts * (1 + Math.floor(newCombo / 3)));
        setCombo(newCombo);
      } else if (newCombo !== combo) {
        setCombo(newCombo);
      }

      tick((n) => n + 1);
    }, 1000 / FPS);
  }, [stop, spawnRing, combo]);

  const onPressIn  = () => { if (inputMode === 'phone') pressed.current = true; };
  const onPressOut = () => { if (inputMode === 'phone') pressed.current = false; };

  if (gameState === 'select') {
    return (
      <LinearGradient colors={['#0D0020', '#2C0A3E', '#4A1060']} style={s.selectScreen}>
        <Pressable style={s.backBtn} onPress={() => router.back()} hitSlop={12}>
          <Text style={s.backBtnText}>←</Text>
        </Pressable>
        <Text style={s.selectEmoji}>🌑</Text>
        <Text style={s.selectTitle}>Éclipse</Text>
        <Text style={s.selectSub}>Synchronise tes contractions avec les anneaux</Text>
        <View style={s.legend}>
          <View style={s.legendItem}><View style={[s.legendDot, { backgroundColor: RING_COLORS.contract }]} /><Text style={s.legendText}>💪 Anneau rose → Contractez</Text></View>
          <View style={s.legendItem}><View style={[s.legendDot, { backgroundColor: RING_COLORS.relax }]} /><Text style={s.legendText}>🌸 Anneau bleu → Relâchez</Text></View>
        </View>
        <View style={{ width: '100%', gap: 10 }}>
          {PROTOCOLS.map((p) => {
            const active = p.id === protocol.id;
            return (
              <Pressable key={p.id} style={[s.protoCard, active && s.protoCardActive]} onPress={() => setProtocol(p)}>
                <Text style={[s.protoLabel, active && s.protoLabelActive]}>{p.label}</Text>
                <Text style={[s.protoDesc, active && s.protoDescActive]}>{p.description}</Text>
              </Pressable>
            );
          })}
        </View>
        <Pressable style={s.startBtn} onPress={startGame}>
          <Text style={s.startBtnText}>Commencer</Text>
        </Pressable>
      </LinearGradient>
    );
  }

  const isActive = inputMode === 'iot' ? touchSignal.isPressed : pressed.current;
  const phaseUI  = currentPhase ? ACTION_UI[currentPhase.action] : null;

  return (
    <View style={s.root}>
      <Pressable style={s.area} onPressIn={onPressIn} onPressOut={onPressOut}>
        <LinearGradient colors={['#0D0020', '#2C0A3E', '#4A1060']} style={StyleSheet.absoluteFill} />

        {/* Anneaux de validation */}
        <View style={[s.hitRing, { borderColor: 'rgba(255,255,255,0.12)', width: HIT_RADIUS * 2, height: HIT_RADIUS * 2, borderRadius: HIT_RADIUS, left: CENTER_X - HIT_RADIUS, top: CENTER_Y - HIT_RADIUS }]} />

        {/* Anneaux en expansion */}
        {rings.current.map((r) => (
          <View
            key={r.id}
            style={[
              s.ring,
              {
                width: r.radius * 2,
                height: r.radius * 2,
                borderRadius: r.radius,
                left: CENTER_X - r.radius,
                top: CENTER_Y - r.radius,
                borderColor: r.scored ? RING_COLORS[r.type] + '30' : r.missed ? 'rgba(255,255,255,0.15)' : RING_COLORS[r.type],
                opacity: r.scored ? 0.3 : r.missed ? 0.2 : 1,
              },
            ]}
          />
        ))}

        {/* Centre — état contraction */}
        <View
          style={[
            s.center,
            {
              left: CENTER_X - 50,
              top: CENTER_Y - 50,
              backgroundColor: isActive ? '#C95F7B' : '#5A77C0',
              shadowColor: isActive ? '#C95F7B' : '#5A77C0',
              transform: [{ scale: isActive ? 1 + contLevel.current * 0.2 : 1 }],
            },
          ]}
        >
          <Text style={s.centerEmoji}>{isActive ? '💪' : '🌸'}</Text>
        </View>

        {/* Feedback */}
        {feedback === 'good' && <View style={s.feedbackGood}><Text style={s.feedbackText}>✓</Text></View>}
        {feedback === 'miss' && <View style={s.feedbackMiss}><Text style={s.feedbackText}>✗</Text></View>}

        {/* HUD */}
        {phaseUI && (
          <View style={s.hud} pointerEvents="none">
            <View style={[s.phaseBadge, { backgroundColor: phaseUI.light }]}>
              <Text style={s.phaseEmoji}>{phaseUI.emoji}</Text>
              <Text style={[s.phaseLabel, { color: phaseUI.color }]}>{phaseUI.label}</Text>
            </View>
            <View style={s.progressTrack}>
              <View style={[s.progressFill, { width: `${exProgress * 100}%`, backgroundColor: phaseUI.color }]} />
            </View>
          </View>
        )}

        <View style={s.scoreArea} pointerEvents="none">
          <Text style={s.scoreNum}>{score}</Text>
          {combo >= 3 && <Text style={s.comboText}>×{1 + Math.floor(combo / 3)} combo</Text>}
        </View>

        {/* Instruction suivante */}
        {rings.current.length > 0 && !rings.current[0].scored && !rings.current[0].missed && (
          <View style={s.nextHint} pointerEvents="none">
            <Text style={s.nextHintText}>{RING_LABELS[rings.current[0].type]} {rings.current[0].type === 'contract' ? 'Contractez !' : 'Relâchez !'}</Text>
          </View>
        )}

        {gameState === 'complete' && (
          <View style={s.overlay}>
            <View style={s.card}>
              <Text style={s.cardEmoji}>🏆</Text>
              <Text style={s.cardTitle}>Exercice terminé !</Text>
              <Text style={s.cardSub}>{protocol.label} · {protocol.cycles} cycles</Text>
              <View style={s.resultRow}>
                <View style={s.resultItem}><Text style={s.resultNum}>{score}</Text><Text style={s.resultLbl}>Points</Text></View>
                <View style={s.resultSep} />
                <View style={s.resultItem}><Text style={s.resultNum}>{combo}</Text><Text style={s.resultLbl}>Combo max</Text></View>
              </View>
              <Pressable style={[s.cta, { backgroundColor: '#4A1060' }]} onPress={() => { stop(); setGameState('select'); }}>
                <Text style={s.ctaText}>Rejouer</Text>
              </Pressable>
            </View>
          </View>
        )}

        <Pressable style={s.backBtn} onPress={() => { stop(); router.back(); }} hitSlop={12}>
          <Text style={s.backBtnText}>←</Text>
        </Pressable>
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 }, area: { flex: 1 },
  ring: { position: 'absolute', borderWidth: 2.5 },
  hitRing: { position: 'absolute', borderWidth: 2, borderStyle: 'dashed' },
  center: { position: 'absolute', width: 100, height: 100, borderRadius: 50, alignItems: 'center', justifyContent: 'center', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.6, shadowRadius: 20, elevation: 10 },
  centerEmoji: { fontSize: 42 },
  feedbackGood: { position: 'absolute', alignSelf: 'center', top: CENTER_Y - 80, backgroundColor: '#27AE60', borderRadius: 999, width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  feedbackMiss: { position: 'absolute', alignSelf: 'center', top: CENTER_Y - 80, backgroundColor: '#E74C3C', borderRadius: 999, width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  feedbackText: { color: 'white', fontSize: 22, fontWeight: '900' },
  hud: { position: 'absolute', top: 48, left: 56, right: 16, gap: 6, alignItems: 'flex-end' },
  phaseBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 5 },
  phaseEmoji: { fontSize: 14 }, phaseLabel: { fontSize: 14, fontWeight: '900' },
  progressTrack: { width: '100%', height: 4, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 999, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 999 },
  scoreArea: { position: 'absolute', top: 50, right: 16, alignItems: 'center' },
  scoreNum: { fontSize: 42, fontWeight: '900', color: 'white', textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 6 },
  comboText: { fontSize: 13, color: '#FFD700', fontWeight: '900', textAlign: 'center' },
  nextHint: { position: 'absolute', bottom: 100, left: 0, right: 0, alignItems: 'center' },
  nextHintText: { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 999, paddingHorizontal: 20, paddingVertical: 8, color: 'white', fontSize: 15, fontWeight: '800' },
  backBtn: { position: 'absolute', top: 52, left: 16, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 999, width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  backBtnText: { color: 'white', fontSize: 20, fontWeight: '900' },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(13,0,32,0.7)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: { backgroundColor: 'white', borderRadius: 28, padding: 28, alignItems: 'center', gap: 12, width: '100%', maxWidth: 340, shadowColor: '#000', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.3, shadowRadius: 24, elevation: 20 },
  cardEmoji: { fontSize: 48 }, cardTitle: { fontSize: 24, fontWeight: '900', color: '#2C0A3E' }, cardSub: { fontSize: 13, color: '#7A6680', textAlign: 'center' },
  resultRow: { flexDirection: 'row', alignItems: 'center', width: '100%', paddingVertical: 8 },
  resultItem: { flex: 1, alignItems: 'center', gap: 4 }, resultSep: { width: 1, height: 60, backgroundColor: '#E8D0F0' },
  resultNum: { fontSize: 38, fontWeight: '900', color: '#2C0A3E' }, resultLbl: { fontSize: 12, color: '#7A6680', fontWeight: '700', textAlign: 'center' },
  cta: { marginTop: 4, borderRadius: 999, paddingHorizontal: 28, paddingVertical: 14 },
  ctaText: { color: 'white', fontWeight: '900', fontSize: 16 },
  legend: { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 16, padding: 16, gap: 10, width: '100%' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  legendDot: { width: 14, height: 14, borderRadius: 7 },
  legendText: { color: 'white', fontSize: 14, fontWeight: '700' },
  selectScreen: { flex: 1, alignItems: 'center', paddingTop: 72, paddingBottom: 40, paddingHorizontal: 24, gap: 14 },
  selectEmoji: { fontSize: 56 }, selectTitle: { fontSize: 30, fontWeight: '900', color: 'white' },
  selectSub: { fontSize: 14, color: 'rgba(255,255,255,0.7)', textAlign: 'center' },
  protoCard: { backgroundColor: 'rgba(255,255,255,0.10)', borderRadius: 18, padding: 16, borderWidth: 2, borderColor: 'rgba(255,255,255,0.15)', gap: 4 },
  protoCardActive: { backgroundColor: 'white', borderColor: 'white' },
  protoLabel: { fontSize: 18, fontWeight: '900', color: 'rgba(255,255,255,0.9)' }, protoLabelActive: { color: '#2C0A3E' },
  protoDesc: { fontSize: 13, color: 'rgba(255,255,255,0.6)' }, protoDescActive: { color: '#7A6680' },
  startBtn: { marginTop: 8, backgroundColor: '#7B2FBE', borderRadius: 999, paddingHorizontal: 36, paddingVertical: 16, width: '100%', alignItems: 'center' },
  startBtnText: { fontSize: 17, fontWeight: '900', color: 'white' },
});
