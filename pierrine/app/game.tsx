import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Dimensions, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { touchSignal } from '@/services/touchSignal';
import { useDeviceStore } from '@/store/deviceStore';

const { width: W, height: H } = Dimensions.get('window');

// ─── Constantes physiques ─────────────────────────────────────────────────────
const BIRD_SIZE  = 44;
const BIRD_X     = W * 0.22;
const PIPE_W     = 62;
const GAP        = 190;
const GRAVITY    = 0.44;
const LIFT       = 0.84;
const MAX_VEL    = 13;
const PIPE_SPEED = 2.7;
const FLOOR_H    = 72;
const FPS        = 60;
// Plafond et plancher physiologiques — le papillon y rebondit, ce n'est PAS un échec
const CEILING_Y  = 100;                    // limite haute (contraction max)
const FLOOR_Y    = H - FLOOR_H - 35;      // limite basse  (relâchement max)
const MID_Y      = (CEILING_Y + FLOOR_Y) / 2;

// Durée (ms) que met un obstacle pour atteindre le papillon après son spawn
const TRAVEL_MS  = ((W + PIPE_W - BIRD_X) / PIPE_SPEED) * (1000 / FPS);

// ─── Modèle exercice ──────────────────────────────────────────────────────────
type ExAction = 'breathe' | 'contract' | 'hold' | 'relax' | 'rest';

type ExPhase = {
  name: string;
  action: ExAction;
  duration: number; // secondes
};

type Protocol = {
  id: string;
  label: string;
  description: string;
  cycles: number;
  pipeSpawnMs: number;
  phases: ExPhase[];
};

// Trois programmes de rééducation périnéale
const PROTOCOLS: Protocol[] = [
  {
    id: 'debutant',
    label: 'Débutant',
    description: 'Contractions lentes avec longues pauses',
    cycles: 5,
    pipeSpawnMs: 3200,
    phases: [
      { name: 'Respirez',   action: 'breathe',  duration: 4 },
      { name: 'Contractez', action: 'contract', duration: 3 },
      { name: 'Maintenez',  action: 'hold',     duration: 5 },
      { name: 'Relâchez',   action: 'relax',    duration: 4 },
      { name: 'Reposez',    action: 'rest',     duration: 8 },
    ],
  },
  {
    id: 'intermediaire',
    label: 'Intermédiaire',
    description: 'Contractions rythmées enchaînées',
    cycles: 8,
    pipeSpawnMs: 2400,
    phases: [
      { name: 'Contractez', action: 'contract', duration: 4 },
      { name: 'Relâchez',   action: 'relax',    duration: 4 },
    ],
  },
  {
    id: 'avance',
    label: 'Avancé',
    description: 'Micro-contractions rapides',
    cycles: 12,
    pipeSpawnMs: 1900,
    phases: [
      { name: 'Contractez', action: 'contract', duration: 1.5 },
      { name: 'Relâchez',   action: 'relax',    duration: 2   },
    ],
  },
];

// ─── Helpers exercice ─────────────────────────────────────────────────────────
function cycleDurMs(p: Protocol) {
  return p.phases.reduce((s, ph) => s + ph.duration * 1000, 0);
}
function totalDurMs(p: Protocol) {
  return cycleDurMs(p) * p.cycles;
}
function phaseAt(protocol: Protocol, ms: number): ExPhase | null {
  if (ms >= totalDurMs(protocol)) return null;
  const pos = ms % cycleDurMs(protocol);
  let acc = 0;
  for (const ph of protocol.phases) {
    acc += ph.duration * 1000;
    if (pos < acc) return ph;
  }
  return null;
}

// Deux positions uniquement :
// contraction/maintien → ouverture AU PLAFOND (papillon doit monter au max)
// repos/relâchement    → ouverture AU PLANCHER (papillon doit descendre au max)
function gapYFor(action: ExAction): number {
  const half = GAP / 2;
  if (action === 'contract' || action === 'hold') {
    return CEILING_Y + half;  // haut absolu
  }
  return FLOOR_Y - half;      // bas absolu
}

// ─── UI par action ────────────────────────────────────────────────────────────
const ACTION_UI: Record<ExAction, { label: string; emoji: string; color: string; light: string }> = {
  breathe:  { label: 'Respirez',   emoji: '🌬️', color: '#4A9B8A', light: '#E0F4F1' },
  contract: { label: 'Contractez', emoji: '💪', color: '#C95F7B', light: '#FFF0F2' },
  hold:     { label: 'Maintenez',  emoji: '🔒', color: '#8B1E4E', light: '#FDE8F0' },
  relax:    { label: 'Relâchez',   emoji: '🌸', color: '#5A77C0', light: '#EBF0FF' },
  rest:     { label: 'Reposez',    emoji: '💤', color: '#7A6670', light: '#F5F0F2' },
};

// ─── Types jeu ────────────────────────────────────────────────────────────────
type Pipe      = { id: number; x: number; gapY: number; passed: boolean };
type GameState = 'select' | 'playing' | 'complete';

// Messages d'encouragement affichés quand le papillon touche un obstacle
const CONTRACT_MSGS = [
  '💪 Contractez fort, vous y êtes presque !',
  'Serrez les muscles ! Montez ! 💪',
  'Allez, une bonne contraction ! 💪',
  'Maintenez la pression ! Vous pouvez ! 💪',
];
const RELAX_MSGS = [
  '🌸 Relâchez doucement, descendez !',
  'Soufflez et relâchez ! 🌸',
  'Détendez-vous, laissez descendre 🌸',
  'Respirez et relâchez les muscles ! 🌸',
];

const CLOUDS = [
  { x: W * 0.08, y: H * 0.10, size: 30 },
  { x: W * 0.55, y: H * 0.17, size: 24 },
  { x: W * 0.74, y: H * 0.06, size: 36 },
  { x: W * 0.32, y: H * 0.27, size: 20 },
];

// ─── Composant principal ──────────────────────────────────────────────────────
export default function GameScreen() {
  const [, tick]          = useState(0);
  const [gameState, setGameState]       = useState<GameState>('select');
  const [score, setScore]               = useState(0);
  const [selectedProtocol, setSelected] = useState<Protocol>(PROTOCOLS[0]);
  const [currentPhase, setCurrentPhase] = useState<ExPhase | null>(null);
  const [exProgress, setExProgress]     = useState(0);

  // Sonde physique connectée → signal BLE prioritaire sur le tactile
  const connectedDevice = useDeviceStore((s) => s.connectedDevice);

  const birdY     = useRef(H / 2);
  const [encouragement, setEncouragement] = useState<string | null>(null);

  const vel            = useRef(0);
  const pressed        = useRef(false);
  const contLevel      = useRef(0);
  const pipes          = useRef<Pipe[]>([]);
  const pipeId         = useRef(0);
  const running        = useRef(false);
  const exMs           = useRef(0);
  const lastHitMs      = useRef(0);
  const encourageTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const blockedPipeId  = useRef<number | null>(null); // obstacle figé jusqu'au passage
  const protoRef  = useRef(selectedProtocol);
  protoRef.current = selectedProtocol;

  const gameLoopRef    = useRef<ReturnType<typeof setInterval> | null>(null);
  const pipeLoopRef    = useRef<ReturnType<typeof setInterval> | null>(null);
  const pipeTimeoutRef = useRef<ReturnType<typeof setTimeout>  | null>(null);

  const stop = useCallback(() => {
    running.current = false;
    if (gameLoopRef.current)    { clearInterval(gameLoopRef.current);    gameLoopRef.current    = null; }
    if (pipeLoopRef.current)    { clearInterval(pipeLoopRef.current);    pipeLoopRef.current    = null; }
    if (pipeTimeoutRef.current) { clearTimeout(pipeTimeoutRef.current);  pipeTimeoutRef.current = null; }
    if (encourageTimer.current) { clearTimeout(encourageTimer.current);  encourageTimer.current = null; }
  }, []);

  useEffect(() => () => stop(), [stop]);

  // Obstacle positionné d'après la phase active à son arrivée (look-ahead)
  const addPipe = useCallback(() => {
    const arrivalMs = exMs.current + TRAVEL_MS;
    const phase     = phaseAt(protoRef.current, arrivalMs);
    const gapY      = phase ? gapYFor(phase.action) : MID_Y;
    pipes.current   = [...pipes.current, { id: pipeId.current++, x: W + PIPE_W, gapY, passed: false }];
  }, []);

  const startGame = useCallback(() => {
    const proto = protoRef.current;
    stop();
    birdY.current     = MID_Y;
    vel.current       = -2;
    contLevel.current = 0;
    pipes.current     = [];
    exMs.current      = 0;
    running.current      = true;
    lastHitMs.current    = 0;
    blockedPipeId.current = null;
    setScore(0);
    setEncouragement(null);
    setCurrentPhase(proto.phases[0] ?? null);
    setExProgress(0);
    setGameState('playing');

    pipeTimeoutRef.current = setTimeout(() => {
      if (!running.current) return;
      if (blockedPipeId.current === null) addPipe();
      pipeLoopRef.current = setInterval(() => {
        // Ne spawner un nouvel obstacle que si le jeu n'est pas en pause
        if (running.current && blockedPipeId.current === null) addPipe();
      }, proto.pipeSpawnMs);
    }, 1300);

    gameLoopRef.current = setInterval(() => {
      if (!running.current) return;

      const isBleConn = useDeviceStore.getState().connectedDevice !== null;
      const isActive  = isBleConn ? touchSignal.isPressed : pressed.current;
      const half      = BIRD_SIZE / 2;
      const bL        = BIRD_X - half + 8;
      const bR        = BIRD_X + half - 8;

      // ── MODE PAUSE : obstacle bloquant ─────────────────────────────────────
      // Timer, obstacles et physique normale sont suspendus.
      // Seul l'input joueur déplace lentement le papillon vers l'ouverture.
      if (blockedPipeId.current !== null) {
        vel.current = 0;
        if (isActive) {
          birdY.current = Math.max(CEILING_Y + half, birdY.current - 3);
        } else {
          birdY.current = Math.min(FLOOR_Y   - half, birdY.current + 2);
        }
        contLevel.current += ((isActive ? 1 : 0) - contLevel.current) * 0.14;

        // Déblocage : centre du papillon dans le quart central de l'ouverture
        const bp = pipes.current.find((p) => p.id === blockedPipeId.current);
        if (bp && Math.abs(birdY.current - bp.gapY) < GAP / 4) {
          blockedPipeId.current = null;
          if (!bp.passed) {
            bp.passed = true;
            setScore((s) => s + 1);
            void Haptics.selectionAsync();
          }
          setEncouragement(null);
          if (encourageTimer.current) { clearTimeout(encourageTimer.current); encourageTimer.current = null; }
        }

        tick((n) => n + 1);
        return; // ← tout le reste (timer, physique, obstacles) est suspendu
      }

      // ── MODE NORMAL ─────────────────────────────────────────────────────────

      // Avancement de l'exercice
      exMs.current += 1000 / FPS;
      const exPhase = phaseAt(proto, exMs.current);

      if (exPhase === null) {
        stop();
        setGameState('complete');
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        return;
      }

      if (Math.floor(exMs.current) % 3 === 0) {
        setCurrentPhase(exPhase);
        setExProgress(Math.min(1, exMs.current / totalDurMs(proto)));
      }

      // Physique
      if (isActive) vel.current = Math.max(vel.current - LIFT, -MAX_VEL);
      vel.current   = Math.min(vel.current + GRAVITY, MAX_VEL);
      birdY.current += vel.current;
      contLevel.current += ((isActive ? 1 : 0) - contLevel.current) * 0.14;

      // Déplacer tous les obstacles
      const moved = pipes.current
        .map((p) => ({ ...p, x: p.x - PIPE_SPEED }))
        .filter((p) => p.x > -PIPE_W - 10);

      // Score (obstacles passés sans blocage)
      let pts = 0;
      for (const p of moved) {
        if (!p.passed && p.x + PIPE_W < BIRD_X - half) {
          p.passed = true;
          pts++;
        }
      }
      pipes.current = moved;
      if (pts > 0) {
        setScore((s) => s + pts);
        void Haptics.selectionAsync();
      }

      // Limites physiologiques
      if (birdY.current - half < CEILING_Y) {
        birdY.current = CEILING_Y + half;
        if (vel.current < 0) vel.current = 0;
      }
      if (birdY.current + half > FLOOR_Y) {
        birdY.current = FLOOR_Y - half;
        if (vel.current > 0) vel.current = 0;
      }

      // Collision → passer en mode pause
      for (const p of pipes.current) {
        if (bR > p.x + 4 && bL < p.x + PIPE_W - 4) {
          const hitTop    = birdY.current - half + 8 < p.gapY - GAP / 2;
          const hitBottom = birdY.current + half - 8 > p.gapY + GAP / 2;
          if (hitTop || hitBottom) {
            blockedPipeId.current = p.id;
            vel.current = 0;
            // Supprimer tous les autres obstacles : un seul à l'écran pendant la pause
            pipes.current = pipes.current.filter((pipe) => pipe.id === p.id);

            if (exMs.current - lastHitMs.current > 900) {
              lastHitMs.current = exMs.current;
              const needsContract = p.gapY < MID_Y;
              const pool = needsContract ? CONTRACT_MSGS : RELAX_MSGS;
              setEncouragement(pool[Math.floor(Math.random() * pool.length)]);
              if (encourageTimer.current) { clearTimeout(encourageTimer.current); encourageTimer.current = null; }
              // Le message reste visible jusqu'au passage (effacé dans le déblocage)
            }
            break;
          }
        }
      }

      tick((n) => n + 1);
    }, 1000 / FPS);
  }, [stop, addPipe]);

  // Quand une sonde est connectée, le signal tactile est ignoré (BLE prioritaire)
  const onPressIn  = () => { if (!connectedDevice) pressed.current = true; };
  const onPressOut = () => { if (!connectedDevice) pressed.current = false; };

  const birdRot = Math.max(-30, Math.min(45, vel.current * 4));
  const phaseUI = currentPhase ? ACTION_UI[currentPhase.action] : null;

  if (gameState === 'select') {
    return (
      <ProtocolSelect
        protocols={PROTOCOLS}
        selected={selectedProtocol}
        onSelect={setSelected}
        onStart={startGame}
      />
    );
  }

  return (
    <View style={s.root}>
      <Pressable style={s.area} onPressIn={onPressIn} onPressOut={onPressOut}>
        <LinearGradient colors={['#4A1060', '#9B2855', '#D97E9A', '#FCF0F3']} style={StyleSheet.absoluteFill} />

        {CLOUDS.map((c, i) => (
          <Text key={i} style={[s.cloud, { top: c.y, left: c.x, fontSize: c.size }]}>☁️</Text>
        ))}

        {/* Zone interdite haute (contraction max) */}
        <View style={[s.limitZone, { top: 0, height: CEILING_Y, backgroundColor: 'rgba(201,95,123,0.10)' }]} />
        <View style={[s.limitLine, { top: CEILING_Y - 1, backgroundColor: 'rgba(201,95,123,0.55)' }]} />
        {gameState === 'playing' && (
          <Text style={[s.limitLabel, { top: CEILING_Y + 3, color: 'rgba(255,200,210,0.80)' }]}>
            {'💪 contraction max'}
          </Text>
        )}

        {/* Zone interdite basse (relâchement max) */}
        <View style={[s.limitZone, { top: FLOOR_Y, bottom: FLOOR_H, backgroundColor: 'rgba(90,119,192,0.10)' }]} />
        <View style={[s.limitLine, { top: FLOOR_Y, backgroundColor: 'rgba(90,119,192,0.55)' }]} />
        {gameState === 'playing' && (
          <Text style={[s.limitLabel, { top: FLOOR_Y - 16, color: 'rgba(180,200,255,0.80)' }]}>
            {'🌸 relâchement max'}
          </Text>
        )}

        {/* Zone cible colorée */}
        {currentPhase && (
          <View style={[s.targetZone, { top: gapYFor(currentPhase.action) - GAP / 2, height: GAP, backgroundColor: ACTION_UI[currentPhase.action].color + '18' }]} />
        )}

        {/* Obstacles */}
        {pipes.current.map((p) => (
          <React.Fragment key={p.id}>
            <View style={[s.pipe, { left: p.x, top: 0, height: p.gapY - GAP / 2 }]}>
              <LinearGradient colors={['#571534', '#8B1E4E', '#C95F7B']} style={StyleSheet.absoluteFill} />
              <View style={[s.pipeCap, { bottom: -3 }]} />
            </View>
            <View style={[s.pipe, { left: p.x, top: p.gapY + GAP / 2, height: H - FLOOR_H - (p.gapY + GAP / 2) }]}>
              <LinearGradient colors={['#C95F7B', '#8B1E4E', '#571534']} style={StyleSheet.absoluteFill} />
              <View style={[s.pipeCap, { top: -3 }]} />
            </View>
          </React.Fragment>
        ))}

        {/* Papillon */}
        <View style={[s.bird, { left: BIRD_X - BIRD_SIZE / 2, top: birdY.current - BIRD_SIZE / 2, transform: [{ rotate: `${birdRot}deg` }] }]}>
          <Text style={s.birdEmoji}>🦋</Text>
        </View>

        <View style={s.ground} />

        {/* Badge BLE sonde connectée */}
        {connectedDevice && gameState === 'playing' && (
          <View style={s.bleBadge} pointerEvents="none">
            <Text style={s.bleText}>🔵 {connectedDevice.name}</Text>
          </View>
        )}

        {/* HUD exercice */}
        {gameState === 'playing' && phaseUI && (
          <View style={s.hud} pointerEvents="none">
            <View style={[s.phaseBadge, { backgroundColor: phaseUI.light }]}>
              <Text style={s.phaseEmoji}>{phaseUI.emoji}</Text>
              <Text style={[s.phaseLabel, { color: phaseUI.color }]}>{phaseUI.label}</Text>
            </View>
            <View style={s.exProgressTrack}>
              <View style={[s.exProgressFill, { width: `${exProgress * 100}%`, backgroundColor: phaseUI.color }]} />
            </View>
            <Text style={s.scoreHUD}>{score}</Text>
          </View>
        )}

        {/* Compteur de contraction */}
        {gameState === 'playing' && (
          <View style={s.meterWrap} pointerEvents="none">
            <View style={s.meterBg}>
              <View style={[s.meterFill, { height: `${contLevel.current * 100}%`, backgroundColor: contLevel.current > 0.5 ? '#C95F7B' : 'rgba(255,255,255,0.3)' }]} />
            </View>
            <Text style={s.meterLabel}>💪</Text>
          </View>
        )}

        {/* Bannière d'encouragement (obstacle touché) */}
        {encouragement && gameState === 'playing' && (
          <EncouragementBanner message={encouragement} />
        )}

        {gameState === 'complete' && (
          <CompleteOverlay score={score} protocol={selectedProtocol} onRestart={() => { stop(); setGameState('select'); }} />
        )}

        <Pressable style={s.backBtn} onPress={() => { stop(); router.back(); }} hitSlop={12}>
          <Text style={s.backBtnText}>←</Text>
        </Pressable>
      </Pressable>
    </View>
  );
}

// ─── Sélection du programme ───────────────────────────────────────────────────
function ProtocolSelect({ protocols, selected, onSelect, onStart }: {
  protocols: Protocol[];
  selected: Protocol;
  onSelect: (p: Protocol) => void;
  onStart: () => void;
}) {
  return (
    <LinearGradient colors={['#4A1060', '#9B2855', '#FCF0F3']} style={s.selectScreen}>
      <Pressable style={s.selectBackBtn} onPress={() => router.back()} hitSlop={12}>
        <Text style={s.backBtnText}>←</Text>
      </Pressable>

      <Text style={s.selectEmoji}>🦋</Text>
      <Text style={s.selectTitle}>Papillon</Text>
      <Text style={s.selectSub}>Choisissez votre programme de rééducation</Text>

      <View style={s.protoList}>
        {protocols.map((p) => {
          const active = p.id === selected.id;
          return (
            <Pressable key={p.id} style={[s.protoCard, active && s.protoCardActive]} onPress={() => onSelect(p)}>
              <View style={s.protoHeader}>
                <Text style={[s.protoLabel, active && s.protoLabelActive]}>{p.label}</Text>
                {active && <Text style={s.checkMark}>✓</Text>}
              </View>
              <Text style={[s.protoDesc, active && s.protoDescActive]}>{p.description}</Text>
              <View style={s.phaseRow}>
                {p.phases.map((ph, i) => {
                  const ui = ACTION_UI[ph.action];
                  return (
                    <View key={i} style={[s.phasePill, { backgroundColor: ui.light }]}>
                      <Text style={s.phasePillText}>{ui.emoji} {ph.name} {ph.duration}s</Text>
                    </View>
                  );
                })}
              </View>
              <Text style={[s.protoCycles, active && s.protoCyclesActive]}>
                {p.cycles} cycles · ~{Math.round(totalDurMs(p) / 60000)} min
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Pressable style={s.startBtn} onPress={onStart}>
        <Text style={s.startBtnText}>Commencer l'exercice</Text>
      </Pressable>

      <Text style={s.hint}>Maintenez = contraction  ·  Relâchez = repos</Text>
    </LinearGradient>
  );
}

// ─── Bannière d'encouragement ─────────────────────────────────────────────────
function EncouragementBanner({ message }: { message: string }) {
  return (
    <View style={s.encourageBanner} pointerEvents="none">
      <Text style={s.encourageText}>{message}</Text>
    </View>
  );
}

// ─── Overlay exercice terminé ─────────────────────────────────────────────────
function CompleteOverlay({ score, protocol, onRestart }: { score: number; protocol: Protocol; onRestart: () => void }) {
  return (
    <View style={s.overlay}>
      <View style={s.card}>
        <Text style={s.cardEmoji}>🏆</Text>
        <Text style={s.cardTitle}>Exercice terminé !</Text>
        <Text style={s.cardSub}>{protocol.label} · {protocol.cycles} cycles complets</Text>
        <View style={s.resultRow}>
          <View style={s.resultItem}>
            <Text style={s.resultNum}>{score}</Text>
            <Text style={s.resultLbl}>Obstacles passés</Text>
          </View>
          <View style={s.resultSep} />
          <View style={s.resultItem}>
            <Text style={s.resultNum}>{protocol.cycles}</Text>
            <Text style={s.resultLbl}>Cycles réalisés</Text>
          </View>
        </View>
        <View style={s.bravo}>
          <Text style={s.bravoText}>Excellent travail 💪</Text>
        </View>
        <Pressable style={s.cta} onPress={onRestart}>
          <Text style={s.ctaText}>Rejouer</Text>
        </Pressable>
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1 },
  area: { flex: 1 },
  cloud: { position: 'absolute', opacity: 0.55 },

  targetZone: { position: 'absolute', left: 0, right: 0 },

  limitZone: { position: 'absolute', left: 0, right: 0 },
  limitLine: { position: 'absolute', left: 0, right: 0, height: 2 },
  limitLabel: { position: 'absolute', left: 65, fontSize: 10, fontWeight: '700' },

  pipe: { position: 'absolute', width: PIPE_W },
  pipeCap: {
    position: 'absolute', left: -7, right: -7, height: 20,
    backgroundColor: '#E8799A', borderRadius: 6, zIndex: 2,
  },

  bird: { position: 'absolute', width: BIRD_SIZE, height: BIRD_SIZE, alignItems: 'center', justifyContent: 'center' },
  birdEmoji: { fontSize: BIRD_SIZE - 6 },

  ground: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    height: FLOOR_H, backgroundColor: '#2D5A27',
    borderTopWidth: 3, borderTopColor: '#4A8A42',
  },

  hud: { position: 'absolute', top: 48, left: 56, right: 16, alignItems: 'flex-end', gap: 6 },
  phaseBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 5 },
  phaseEmoji: { fontSize: 15 },
  phaseLabel: { fontSize: 14, fontWeight: '900' },
  exProgressTrack: { width: '100%', height: 5, backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: 999, overflow: 'hidden' },
  exProgressFill:  { height: '100%', borderRadius: 999 },
  scoreHUD: {
    fontSize: 40, fontWeight: '900', color: 'white',
    textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 8,
  },

  meterWrap:  { position: 'absolute', left: 12, top: H * 0.40, alignItems: 'center', gap: 4 },
  meterBg:    { width: 12, height: 100, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 6, overflow: 'hidden', justifyContent: 'flex-end' },
  meterFill:  { width: '100%', borderRadius: 6 },
  meterLabel: { fontSize: 14 },

  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(55,8,28,0.55)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: {
    backgroundColor: 'white', borderRadius: 28, padding: 28,
    alignItems: 'center', gap: 12, width: '100%', maxWidth: 340,
    shadowColor: '#000', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.25, shadowRadius: 24, elevation: 20,
  },
  cardEmoji:  { fontSize: 48 },
  cardTitle:  { fontSize: 26, fontWeight: '900', color: '#571534' },
  cardSub:    { fontSize: 13, color: '#7A6670', textAlign: 'center' },
  resultRow:  { flexDirection: 'row', alignItems: 'center', width: '100%', paddingVertical: 8 },
  resultItem: { flex: 1, alignItems: 'center', gap: 4 },
  resultSep:  { width: 1, height: 60, backgroundColor: '#F0D9DC' },
  resultNum:  { fontSize: 38, fontWeight: '900', color: '#571534' },
  resultLbl:  { fontSize: 12, color: '#7A6670', fontWeight: '700', textAlign: 'center' },
  cta:        { marginTop: 4, backgroundColor: '#571534', borderRadius: 999, paddingHorizontal: 28, paddingVertical: 14 },
  ctaText:    { color: 'white', fontWeight: '900', fontSize: 16 },
  bravo:      { backgroundColor: '#FFF0F2', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10 },
  bravoText:  { color: '#8B1E4E', fontWeight: '800', fontSize: 15 },

  encourageBanner: {
    position: 'absolute',
    bottom: FLOOR_H + 18,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255,255,255,0.93)',
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 12,
  },
  encourageText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#571534',
    textAlign: 'center',
    lineHeight: 21,
  },

  bleBadge: {
    position: 'absolute', top: 52, left: 60,
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5,
  },
  bleText: { color: 'white', fontSize: 11, fontWeight: '700' },

  backBtn: {
    position: 'absolute', top: 52, left: 16,
    backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 999, width: 40, height: 40,
    alignItems: 'center', justifyContent: 'center',
  },
  backBtnText: { color: 'white', fontSize: 20, fontWeight: '900' },

  selectScreen:     { flex: 1, alignItems: 'center', paddingTop: 72, paddingBottom: 40, paddingHorizontal: 24, gap: 12 },
  selectBackBtn:    { position: 'absolute', top: 52, left: 16, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 999, width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  selectEmoji:      { fontSize: 52, marginBottom: -4 },
  selectTitle:      { fontSize: 32, fontWeight: '900', color: 'white' },
  selectSub:        { fontSize: 14, color: 'rgba(255,255,255,0.72)', textAlign: 'center', marginBottom: 8 },
  protoList:        { width: '100%', gap: 10 },
  protoCard:        { backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 20, padding: 16, borderWidth: 2, borderColor: 'rgba(255,255,255,0.15)', gap: 8 },
  protoCardActive:  { backgroundColor: 'white', borderColor: 'white' },
  protoHeader:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  protoLabel:       { fontSize: 18, fontWeight: '900', color: 'rgba(255,255,255,0.9)' },
  protoLabelActive: { color: '#571534' },
  checkMark:        { fontSize: 18, color: '#571534' },
  protoDesc:        { fontSize: 13, color: 'rgba(255,255,255,0.65)' },
  protoDescActive:  { color: '#7A6670' },
  phaseRow:         { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  phasePill:        { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
  phasePillText:    { fontSize: 11, fontWeight: '700', color: '#2A1820' },
  protoCycles:      { fontSize: 12, color: 'rgba(255,255,255,0.5)', fontWeight: '700', marginTop: 2 },
  protoCyclesActive:{ color: '#9B5C6C' },
  startBtn:         { marginTop: 8, backgroundColor: 'white', borderRadius: 999, paddingHorizontal: 36, paddingVertical: 16, width: '100%', alignItems: 'center' },
  startBtnText:     { fontSize: 17, fontWeight: '900', color: '#571534' },
  hint:             { fontSize: 12, color: 'rgba(255,255,255,0.5)', textAlign: 'center', marginTop: 4 },
});
