/**
 * La Source — Jeu d'endurance et de contrôle
 *
 * Maintiens le niveau d'eau dans la zone cible qui se déplace
 * en fonction du protocole d'exercice.
 *
 * Zone haute  = Contractez (maintenez appuyé)
 * Zone basse  = Relâchez   (lâchez le bouton)
 * Zone centre = Reposez
 *
 * Score = secondes passées dans la zone cible
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

const BAR_W      = W * 0.28;
const BAR_H      = H * 0.55;
const BAR_X      = W / 2 - BAR_W / 2;
const BAR_TOP    = H * 0.18;
const RISE_RATE  = 0.016;  // par frame quand on appuie
const FALL_RATE  = 0.009;  // par frame quand on relâche
const ZONE_H     = 0.28;   // hauteur de la zone cible (fraction de la barre)
const FPS        = 60;

// Fraction (0=bas, 1=haut) du CENTRE de la zone cible selon la phase
function targetCenter(action: ExPhase['action']): number {
  if (isContractPhase(action)) return 0.82;
  if (action === 'relax')      return 0.18;
  return 0.50;
}

type GameState = 'select' | 'playing' | 'complete';

export default function SourceGame() {
  const [, tick]        = useState(0);
  const [gameState, setGameState]       = useState<GameState>('select');
  const [protocol, setProtocol]         = useState(PROTOCOLS[0]);
  const [timeInZone, setTimeInZone]     = useState(0);
  const [currentPhase, setCurrentPhase] = useState<ExPhase | null>(null);
  const [exProgress, setExProgress]     = useState(0);
  const [inZone, setInZone]             = useState(false);

  const connectedDevice = useDeviceStore((s) => s.connectedDevice);

  const waterLevel = useRef(0.4);  // 0–1
  const pressed    = useRef(false);
  const running    = useRef(false);
  const exMs       = useRef(0);
  const protoRef   = useRef(protocol);
  protoRef.current = protocol;

  const gameLoopRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stop = useCallback(() => {
    running.current = false;
    if (gameLoopRef.current) { clearInterval(gameLoopRef.current); gameLoopRef.current = null; }
  }, []);

  useEffect(() => () => stop(), [stop]);

  const startGame = useCallback(() => {
    stop();
    const proto = protoRef.current;
    waterLevel.current = 0.4;
    exMs.current       = 0;
    running.current    = true;
    setTimeInZone(0); setInZone(false);
    setCurrentPhase(proto.phases[0] ?? null);
    setExProgress(0);
    setGameState('playing');

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

      const isBle    = useDeviceStore.getState().connectedDevice !== null;
      const isActive = isBle ? touchSignal.isPressed : pressed.current;

      // Niveau d'eau
      if (isActive) {
        waterLevel.current = Math.min(1, waterLevel.current + RISE_RATE);
      } else {
        waterLevel.current = Math.max(0, waterLevel.current - FALL_RATE);
      }

      // Zone cible
      const tc = targetCenter(exPhase.action);
      const zoneMin = tc - ZONE_H / 2;
      const zoneMax = tc + ZONE_H / 2;
      const isInZone = waterLevel.current >= zoneMin && waterLevel.current <= zoneMax;

      if (isInZone) {
        setTimeInZone((t) => t + 1 / FPS);
      }
      setInZone(isInZone);

      tick((n) => n + 1);
    }, 1000 / FPS);
  }, [stop]);

  const onPressIn  = () => { if (!connectedDevice) pressed.current = true; };
  const onPressOut = () => { if (!connectedDevice) pressed.current = false; };

  if (gameState === 'select') {
    return (
      <LinearGradient colors={['#0D3B2E', '#1A6B4A', '#27AE60']} style={s.selectScreen}>
        <Pressable style={s.backBtn} onPress={() => router.back()} hitSlop={12}>
          <Text style={s.backBtnText}>←</Text>
        </Pressable>
        <Text style={s.selectEmoji}>💧</Text>
        <Text style={s.selectTitle}>La Source</Text>
        <Text style={s.selectSub}>Maintiens le niveau d'eau dans la zone cible</Text>
        <View style={s.legend}>
          <View style={s.legendItem}><Text style={s.legendText}>💪 Zone haute → Contractez</Text></View>
          <View style={s.legendItem}><Text style={s.legendText}>💤 Zone centre → Reposez</Text></View>
          <View style={s.legendItem}><Text style={s.legendText}>🌸 Zone basse → Relâchez</Text></View>
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
        <Text style={s.hint}>Maintenez = niveau monte · Relâchez = niveau descend</Text>
      </LinearGradient>
    );
  }

  const phaseUI = currentPhase ? ACTION_UI[currentPhase.action] : null;
  const tc      = currentPhase ? targetCenter(currentPhase.action) : 0.5;
  const zoneMin = tc - ZONE_H / 2;
  const zoneMax = tc + ZONE_H / 2;
  const wl      = waterLevel.current;

  // Positions en pixels dans la barre
  const pxFromLevel = (lvl: number) => BAR_TOP + BAR_H * (1 - lvl);
  const waterPx  = pxFromLevel(wl);
  const zoneTopPx = pxFromLevel(zoneMax);
  const zoneHPx   = BAR_H * ZONE_H;
  const waterFillH = BAR_H * wl;

  return (
    <View style={s.root}>
      <Pressable style={s.area} onPressIn={onPressIn} onPressOut={onPressOut}>
        <LinearGradient colors={['#0D3B2E', '#1A6B4A', '#E8F5E9']} style={StyleSheet.absoluteFill} />

        {/* Décorations fond */}
        {LEAVES.map((l, i) => (
          <Text key={i} style={[s.leaf, { top: l.y, left: l.x, fontSize: l.s, opacity: l.o }]}>{l.e}</Text>
        ))}

        {/* Barre d'eau */}
        <View style={[s.barContainer, { left: BAR_X, top: BAR_TOP, width: BAR_W, height: BAR_H }]}>
          {/* Fond barre */}
          <View style={s.barBg} />

          {/* Zone cible */}
          <View
            style={[
              s.targetZone,
              {
                top: zoneTopPx - BAR_TOP,
                height: zoneHPx,
                backgroundColor: inZone ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.15)',
                borderColor: inZone ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.3)',
              },
            ]}
          />

          {/* Eau */}
          <View
            style={[
              s.water,
              {
                height: waterFillH,
                backgroundColor: inZone ? '#27AE60' : '#2E86C1',
              },
            ]}
          />

          {/* Étiquette zone cible */}
          <View style={[s.zoneLabel, { top: zoneTopPx - BAR_TOP + zoneHPx / 2 - 12 }]}>
            <Text style={s.zoneLabelText}>{currentPhase ? ACTION_UI[currentPhase.action].emoji : '○'}</Text>
          </View>
        </View>

        {/* Indicateur inZone */}
        {inZone && (
          <View style={s.inZoneBadge} pointerEvents="none">
            <Text style={s.inZoneText}>✓ Dans la zone !</Text>
          </View>
        )}

        {/* Score temps */}
        <View style={s.scoreArea} pointerEvents="none">
          <Text style={s.scoreNum}>{Math.floor(timeInZone)}</Text>
          <Text style={s.scoreLbl}>secondes</Text>
        </View>

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

        {gameState === 'complete' && (
          <View style={s.overlay}>
            <View style={s.card}>
              <Text style={s.cardEmoji}>🌿</Text>
              <Text style={s.cardTitle}>Exercice terminé !</Text>
              <Text style={s.cardSub}>{protocol.label} · {protocol.cycles} cycles</Text>
              <View style={s.resultRow}>
                <View style={s.resultItem}>
                  <Text style={s.resultNum}>{Math.floor(timeInZone)}s</Text>
                  <Text style={s.resultLbl}>Temps en zone</Text>
                </View>
                <View style={s.resultSep} />
                <View style={s.resultItem}>
                  <Text style={s.resultNum}>{Math.round((timeInZone / (totalDurMs(protocol) / 1000)) * 100)}%</Text>
                  <Text style={s.resultLbl}>Précision</Text>
                </View>
              </View>
              <Pressable style={[s.cta, { backgroundColor: '#0D3B2E' }]} onPress={() => { stop(); setGameState('select'); }}>
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

const LEAVES = [
  { x: W*0.05, y: H*0.12, s: 28, o: 0.3, e: '🌿' }, { x: W*0.78, y: H*0.08, s: 22, o: 0.25, e: '🍃' },
  { x: W*0.85, y: H*0.35, s: 18, o: 0.2, e: '🌿' }, { x: W*0.08, y: H*0.55, s: 24, o: 0.25, e: '🍃' },
  { x: W*0.80, y: H*0.65, s: 20, o: 0.2, e: '🌿' }, { x: W*0.05, y: H*0.80, s: 26, o: 0.3, e: '🍃' },
];

const s = StyleSheet.create({
  root: { flex: 1 }, area: { flex: 1 },
  leaf: { position: 'absolute' },
  barContainer: { position: 'absolute' },
  barBg: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 20, borderWidth: 2, borderColor: 'rgba(255,255,255,0.2)', overflow: 'hidden' },
  targetZone: { position: 'absolute', left: 0, right: 0, borderWidth: 2, borderRadius: 4 },
  water: { position: 'absolute', bottom: 0, left: 0, right: 0, borderRadius: 16, opacity: 0.85 },
  zoneLabel: { position: 'absolute', right: -36, alignItems: 'center', justifyContent: 'center', width: 28, height: 24 },
  zoneLabelText: { fontSize: 18 },
  inZoneBadge: { position: 'absolute', bottom: 110, left: 0, right: 0, alignItems: 'center' },
  inZoneText: { backgroundColor: 'rgba(39,174,96,0.85)', color: 'white', fontWeight: '900', fontSize: 15, borderRadius: 999, paddingHorizontal: 18, paddingVertical: 7 },
  hud: { position: 'absolute', top: 48, left: 56, right: 16, gap: 6, alignItems: 'flex-end' },
  phaseBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 5 },
  phaseEmoji: { fontSize: 14 }, phaseLabel: { fontSize: 14, fontWeight: '900' },
  progressTrack: { width: '100%', height: 4, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 999, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 999 },
  scoreArea: { position: 'absolute', top: 50, right: 16, alignItems: 'center' },
  scoreNum: { fontSize: 42, fontWeight: '900', color: 'white', textShadowColor: 'rgba(0,0,0,0.3)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 6 },
  scoreLbl: { fontSize: 11, color: 'rgba(255,255,255,0.6)', fontWeight: '700' },
  backBtn: { position: 'absolute', top: 52, left: 16, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 999, width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  backBtnText: { color: 'white', fontSize: 20, fontWeight: '900' },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(13,59,46,0.75)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: { backgroundColor: 'white', borderRadius: 28, padding: 28, alignItems: 'center', gap: 12, width: '100%', maxWidth: 340, shadowColor: '#000', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.3, shadowRadius: 24, elevation: 20 },
  cardEmoji: { fontSize: 48 }, cardTitle: { fontSize: 24, fontWeight: '900', color: '#0D3B2E' }, cardSub: { fontSize: 13, color: '#5A8A7A', textAlign: 'center' },
  resultRow: { flexDirection: 'row', alignItems: 'center', width: '100%', paddingVertical: 8 },
  resultItem: { flex: 1, alignItems: 'center', gap: 4 }, resultSep: { width: 1, height: 60, backgroundColor: '#C8E6C9' },
  resultNum: { fontSize: 36, fontWeight: '900', color: '#0D3B2E' }, resultLbl: { fontSize: 12, color: '#5A8A7A', fontWeight: '700', textAlign: 'center' },
  cta: { marginTop: 4, borderRadius: 999, paddingHorizontal: 28, paddingVertical: 14 },
  ctaText: { color: 'white', fontWeight: '900', fontSize: 16 },
  legend: { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 16, padding: 16, gap: 8, width: '100%' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  legendText: { color: 'white', fontSize: 14, fontWeight: '700' },
  selectScreen: { flex: 1, alignItems: 'center', paddingTop: 72, paddingBottom: 40, paddingHorizontal: 24, gap: 14 },
  selectEmoji: { fontSize: 56 }, selectTitle: { fontSize: 30, fontWeight: '900', color: 'white' },
  selectSub: { fontSize: 14, color: 'rgba(255,255,255,0.7)', textAlign: 'center' },
  protoCard: { backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 18, padding: 16, borderWidth: 2, borderColor: 'rgba(255,255,255,0.15)', gap: 4 },
  protoCardActive: { backgroundColor: 'white', borderColor: 'white' },
  protoLabel: { fontSize: 18, fontWeight: '900', color: 'rgba(255,255,255,0.9)' }, protoLabelActive: { color: '#0D3B2E' },
  protoDesc: { fontSize: 13, color: 'rgba(255,255,255,0.6)' }, protoDescActive: { color: '#5A8A7A' },
  startBtn: { marginTop: 8, backgroundColor: '#27AE60', borderRadius: 999, paddingHorizontal: 36, paddingVertical: 16, width: '100%', alignItems: 'center' },
  startBtnText: { fontSize: 17, fontWeight: '900', color: 'white' },
  hint: { fontSize: 12, color: 'rgba(255,255,255,0.4)', textAlign: 'center' },
});
