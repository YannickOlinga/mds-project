
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Dimensions, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { ACTION_UI, PROTOCOLS, isContractPhase, phaseAt, totalDurMs, type ExPhase, type Protocol } from '@/lib/exercises';
import { touchSignal } from '@/services/touchSignal';
import { useDeviceStore } from '@/store/deviceStore';

const { width: W, height: H } = Dimensions.get('window');

const GRAVITY      = 0.38;
const LIFT         = 0.78;
const MAX_VEL      = 11;
const BUBBLE_SPEED = 2.2;
const CATCH_R      = 38;  // rayon de capture
const BUBBLE_R     = 22;  // rayon visuel
const PLAYER_X     = W * 0.18;
const CEILING_Y    = 95;
const FLOOR_Y      = H - 75;
const FPS          = 60;

type Bubble = { id: number; x: number; y: number; caught: boolean; color: string };
type GameState = 'select' | 'playing' | 'complete';

const BUBBLE_COLORS = ['#7EC8E3', '#A8E6CF', '#FFD3E0', '#C3B1E1', '#FFE5B4'];
const PROTOCOLS_WITH_SPAWN = PROTOCOLS.map((p) => ({ ...p, bubbleSpawnMs: p.id === 'avance' ? 1400 : p.id === 'intermediaire' ? 1900 : 2600 }));

export default function BullesGame() {
  const [, tick]        = useState(0);
  const [gameState, setGameState]     = useState<GameState>('select');
  const [protocol, setProtocol]       = useState(PROTOCOLS_WITH_SPAWN[0]);
  const [score, setScore]             = useState(0);
  const [missed, setMissed]           = useState(0);
  const [currentPhase, setCurrentPhase] = useState<ExPhase | null>(null);
  const [exProgress, setExProgress]   = useState(0);

  const inputMode = useDeviceStore((s) => s.inputMode);

  const playerY   = useRef(H / 2);
  const vel       = useRef(0);
  const pressed   = useRef(false);
  const bubbles   = useRef<Bubble[]>([]);
  const bubbleId  = useRef(0);
  const running   = useRef(false);
  const exMs      = useRef(0);
  const protoRef  = useRef(protocol);
  protoRef.current = protocol;

  const gameLoopRef   = useRef<ReturnType<typeof setInterval> | null>(null);
  const spawnLoopRef  = useRef<ReturnType<typeof setInterval> | null>(null);
  const spawnTimeout  = useRef<ReturnType<typeof setTimeout>  | null>(null);

  const stop = useCallback(() => {
    running.current = false;
    if (gameLoopRef.current)  { clearInterval(gameLoopRef.current);  gameLoopRef.current  = null; }
    if (spawnLoopRef.current) { clearInterval(spawnLoopRef.current); spawnLoopRef.current = null; }
    if (spawnTimeout.current) { clearTimeout(spawnTimeout.current);  spawnTimeout.current = null; }
  }, []);

  useEffect(() => () => stop(), [stop]);

  const spawnBubble = useCallback(() => {
    const proto = protoRef.current;
    const arrival = exMs.current + (W / BUBBLE_SPEED) * (1000 / FPS);
    const phase   = phaseAt(proto, arrival);
    const isHigh  = phase ? isContractPhase(phase.action) : true;
    const range   = FLOOR_Y - CEILING_Y;
    const base    = isHigh ? CEILING_Y + range * 0.1 : CEILING_Y + range * 0.7;
    const y       = base + Math.random() * range * 0.2;
    const color   = BUBBLE_COLORS[Math.floor(Math.random() * BUBBLE_COLORS.length)];
    bubbles.current = [...bubbles.current, { id: bubbleId.current++, x: W + BUBBLE_R, y, caught: false, color }];
  }, []);

  const startGame = useCallback(() => {
    stop();
    const proto = protoRef.current;
    playerY.current = H / 2;
    vel.current     = 0;
    bubbles.current = [];
    exMs.current    = 0;
    running.current = true;
    setScore(0); setMissed(0);
    setCurrentPhase(proto.phases[0] ?? null);
    setExProgress(0);
    setGameState('playing');

    spawnTimeout.current = setTimeout(() => {
      if (!running.current) return;
      spawnBubble();
      spawnLoopRef.current = setInterval(() => {
        if (running.current) spawnBubble();
      }, proto.bubbleSpawnMs);
    }, 1200);

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

      if (isActive) vel.current = Math.max(vel.current - LIFT, -MAX_VEL);
      vel.current    = Math.min(vel.current + GRAVITY, MAX_VEL);
      playerY.current += vel.current;

      const half = 22;
      if (playerY.current - half < CEILING_Y) { playerY.current = CEILING_Y + half; if (vel.current < 0) vel.current = 0; }
      if (playerY.current + half > FLOOR_Y)   { playerY.current = FLOOR_Y   - half; if (vel.current > 0) vel.current = 0; }

      // Déplacer les bulles
      const moved = bubbles.current.map((b) => ({ ...b, x: b.x - BUBBLE_SPEED }));

      // Vérifier les captures et les sorties
      let caught = 0, newMissed = 0;
      const alive = moved.filter((b) => {
        if (b.caught) return b.x > -BUBBLE_R * 2;
        if (b.x < PLAYER_X - CATCH_R) { newMissed++; return false; }
        const dist = Math.hypot(b.x - PLAYER_X, b.y - playerY.current);
        if (dist < CATCH_R + BUBBLE_R) {
          b.caught = true;
          caught++;
          return true;
        }
        return b.x > -BUBBLE_R * 2;
      });

      bubbles.current = alive;
      if (caught > 0) {
        setScore((s) => s + caught);
        void Haptics.selectionAsync();
      }
      if (newMissed > 0) setMissed((m) => m + newMissed);

      tick((n) => n + 1);
    }, 1000 / FPS);
  }, [stop, spawnBubble]);

  const onPressIn  = () => { if (inputMode === 'phone') pressed.current = true; };
  const onPressOut = () => { if (inputMode === 'phone') pressed.current = false; };

  if (gameState === 'select') {
    return <ProtocolSelect protocols={PROTOCOLS_WITH_SPAWN} selected={protocol} onSelect={setProtocol} onStart={startGame} />;
  }

  const phaseUI = currentPhase ? ACTION_UI[currentPhase.action] : null;

  return (
    <View style={s.root}>
      <Pressable style={s.area} onPressIn={onPressIn} onPressOut={onPressOut}>
        <LinearGradient colors={['#0A1628', '#1A3A5C', '#2C5F8A']} style={StyleSheet.absoluteFill} />

        {/* Étoiles décoratives */}
        {STARS.map((st, i) => (
          <View key={i} style={[s.star, { top: st.y, left: st.x, width: st.s, height: st.s, borderRadius: st.s / 2 }]} />
        ))}

        {/* Bulles */}
        {bubbles.current.map((b) => (
          <View
            key={b.id}
            style={[
              s.bubble,
              {
                left: b.x - BUBBLE_R,
                top: b.y - BUBBLE_R,
                width: BUBBLE_R * 2,
                height: BUBBLE_R * 2,
                borderRadius: BUBBLE_R,
                backgroundColor: b.caught ? 'transparent' : b.color + '40',
                borderColor: b.caught ? b.color + '20' : b.color,
                transform: [{ scale: b.caught ? 1.4 : 1 }],
              },
            ]}
          />
        ))}

        {/* Joueur */}
        <View style={[s.player, { left: PLAYER_X - 22, top: playerY.current - 22 }]}>
          <Text style={s.playerEmoji}>🦋</Text>
        </View>

        {/* Lignes de hauteur guide */}
        <View style={[s.guideLine, { top: CEILING_Y + (FLOOR_Y - CEILING_Y) * 0.2 }]} />
        <View style={[s.guideLine, { top: CEILING_Y + (FLOOR_Y - CEILING_Y) * 0.8 }]} />

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
          <Text style={s.scoreLbl}>bulles</Text>
        </View>

        {gameState === 'complete' && (
          <CompleteOverlay score={score} missed={missed} protocol={protocol} onRestart={() => { stop(); setGameState('select'); }} />
        )}

        <Pressable style={s.backBtn} onPress={() => { stop(); router.back(); }} hitSlop={12}>
          <Text style={s.backBtnText}>←</Text>
        </Pressable>
      </Pressable>
    </View>
  );
}

// ─── Écran sélection programme ────────────────────────────────────────────────
function ProtocolSelect({ protocols, selected, onSelect, onStart }: {
  protocols: (Protocol & { bubbleSpawnMs: number })[];
  selected: Protocol & { bubbleSpawnMs: number };
  onSelect: (p: Protocol & { bubbleSpawnMs: number }) => void;
  onStart: () => void;
}) {
  return (
    <LinearGradient colors={['#0A1628', '#1A3A5C', '#2C5F8A']} style={s.selectScreen}>
      <Pressable style={s.selectBack} onPress={() => router.back()} hitSlop={12}>
        <Text style={s.backBtnText}>←</Text>
      </Pressable>
      <Text style={s.selectEmoji}>🫧</Text>
      <Text style={s.selectTitle}>Bulles de Lumière</Text>
      <Text style={s.selectSub}>Attrape les bulles en ajustant ta contraction</Text>
      <View style={{ width: '100%', gap: 10 }}>
        {protocols.map((p) => {
          const active = p.id === selected.id;
          return (
            <Pressable key={p.id} style={[s.protoCard, active && s.protoCardActive]} onPress={() => onSelect(p)}>
              <Text style={[s.protoLabel, active && s.protoLabelActive]}>{p.label}</Text>
              <Text style={[s.protoDesc, active && s.protoDescActive]}>{p.description}</Text>
            </Pressable>
          );
        })}
      </View>
      <Pressable style={s.startBtn} onPress={onStart}>
        <Text style={s.startBtnText}>Commencer</Text>
      </Pressable>
      <Text style={s.hint}>Maintenez = monter · Relâchez = descendre</Text>
    </LinearGradient>
  );
}

function CompleteOverlay({ score, missed, protocol, onRestart }: { score: number; missed: number; protocol: Protocol; onRestart: () => void }) {
  const rate = score + missed > 0 ? Math.round((score / (score + missed)) * 100) : 0;
  return (
    <View style={s.overlay}>
      <View style={s.card}>
        <Text style={s.cardEmoji}>{rate >= 70 ? '🏆' : '✨'}</Text>
        <Text style={s.cardTitle}>Exercice terminé !</Text>
        <Text style={s.cardSub}>{protocol.label} · {protocol.cycles} cycles</Text>
        <View style={s.resultRow}>
          <View style={s.resultItem}><Text style={s.resultNum}>{score}</Text><Text style={s.resultLbl}>Attrappées</Text></View>
          <View style={s.resultSep} />
          <View style={s.resultItem}><Text style={s.resultNum}>{rate}%</Text><Text style={s.resultLbl}>Précision</Text></View>
        </View>
        <Pressable style={s.cta} onPress={onRestart}><Text style={s.ctaText}>Rejouer</Text></Pressable>
      </View>
    </View>
  );
}
 
const STARS = Array.from({ length: 40 }, () => ({
  x: Math.random() * W,
  y: Math.random() * H,
  s: Math.random() * 2.5 + 0.5,
}));

const s = StyleSheet.create({
  root: { flex: 1 }, area: { flex: 1 },
  star: { position: 'absolute', backgroundColor: 'rgba(255,255,255,0.5)' },
  bubble: { position: 'absolute', borderWidth: 2 },
  player: { position: 'absolute', width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  playerEmoji: { fontSize: 36 },
  guideLine: { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: 'rgba(255,255,255,0.08)' },
  hud: { position: 'absolute', top: 48, left: 56, right: 16, gap: 6, alignItems: 'flex-end' },
  phaseBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 5 },
  phaseEmoji: { fontSize: 14 }, phaseLabel: { fontSize: 14, fontWeight: '900' },
  progressTrack: { width: '100%', height: 4, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 999, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 999 },
  scoreArea: { position: 'absolute', top: 50, right: 16, alignItems: 'center' },
  scoreNum: { fontSize: 42, fontWeight: '900', color: 'white', textShadowColor: 'rgba(0,0,0,0.4)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 6 },
  scoreLbl: { fontSize: 11, color: 'rgba(255,255,255,0.6)', fontWeight: '700' },
  backBtn: { position: 'absolute', top: 52, left: 16, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 999, width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  backBtnText: { color: 'white', fontSize: 20, fontWeight: '900' },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(10,22,40,0.7)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: { backgroundColor: 'white', borderRadius: 28, padding: 28, alignItems: 'center', gap: 12, width: '100%', maxWidth: 340, shadowColor: '#000', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.3, shadowRadius: 24, elevation: 20 },
  cardEmoji: { fontSize: 48 }, cardTitle: { fontSize: 24, fontWeight: '900', color: '#1A3A5C' }, cardSub: { fontSize: 13, color: '#7A8A9A', textAlign: 'center' },
  resultRow: { flexDirection: 'row', alignItems: 'center', width: '100%', paddingVertical: 8 },
  resultItem: { flex: 1, alignItems: 'center', gap: 4 }, resultSep: { width: 1, height: 60, backgroundColor: '#E0E8F0' },
  resultNum: { fontSize: 38, fontWeight: '900', color: '#1A3A5C' }, resultLbl: { fontSize: 12, color: '#7A8A9A', fontWeight: '700', textAlign: 'center' },
  cta: { marginTop: 4, backgroundColor: '#1A3A5C', borderRadius: 999, paddingHorizontal: 28, paddingVertical: 14 },
  ctaText: { color: 'white', fontWeight: '900', fontSize: 16 },
  selectScreen: { flex: 1, alignItems: 'center', paddingTop: 72, paddingBottom: 40, paddingHorizontal: 24, gap: 12 },
  selectBack: { position: 'absolute', top: 52, left: 16, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 999, width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  selectEmoji: { fontSize: 56 }, selectTitle: { fontSize: 30, fontWeight: '900', color: 'white' },
  selectSub: { fontSize: 14, color: 'rgba(255,255,255,0.7)', textAlign: 'center', marginBottom: 8 },
  protoCard: { backgroundColor: 'rgba(255,255,255,0.10)', borderRadius: 18, padding: 16, borderWidth: 2, borderColor: 'rgba(255,255,255,0.15)', gap: 4 },
  protoCardActive: { backgroundColor: 'white', borderColor: 'white' },
  protoLabel: { fontSize: 18, fontWeight: '900', color: 'rgba(255,255,255,0.9)' }, protoLabelActive: { color: '#1A3A5C' },
  protoDesc: { fontSize: 13, color: 'rgba(255,255,255,0.6)' }, protoDescActive: { color: '#5A7A9A' },
  startBtn: { marginTop: 8, backgroundColor: '#7EC8E3', borderRadius: 999, paddingHorizontal: 36, paddingVertical: 16, width: '100%', alignItems: 'center' },
  startBtnText: { fontSize: 17, fontWeight: '900', color: '#0A1628' },
  hint: { fontSize: 12, color: 'rgba(255,255,255,0.4)', textAlign: 'center' },
});
