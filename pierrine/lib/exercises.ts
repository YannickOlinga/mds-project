/**
 * Protocoles d'exercices périnéaux partagés entre tous les mini-jeux.
 */

export type ExAction = 'breathe' | 'contract' | 'hold' | 'relax' | 'rest';

export type ExPhase = {
  name: string;
  action: ExAction;
  duration: number; // secondes
};

export type Protocol = {
  id: string;
  label: string;
  description: string;
  cycles: number;
  phases: ExPhase[];
};

export const PROTOCOLS: Protocol[] = [
  {
    id: 'debutant',
    label: 'Débutant',
    description: 'Contractions lentes avec longues pauses',
    cycles: 5,
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
    phases: [
      { name: 'Contractez', action: 'contract', duration: 1.5 },
      { name: 'Relâchez',   action: 'relax',    duration: 2   },
    ],
  },
];

export function cycleDurMs(p: Protocol) {
  return p.phases.reduce((s, ph) => s + ph.duration * 1000, 0);
}

export function totalDurMs(p: Protocol) {
  return cycleDurMs(p) * p.cycles;
}

export function phaseAt(protocol: Protocol, ms: number): ExPhase | null {
  if (ms >= totalDurMs(protocol)) return null;
  const pos = ms % cycleDurMs(protocol);
  let acc = 0;
  for (const ph of protocol.phases) {
    acc += ph.duration * 1000;
    if (pos < acc) return ph;
  }
  return null;
}

export const ACTION_UI: Record<ExAction, { label: string; emoji: string; color: string; light: string }> = {
  breathe:  { label: 'Respirez',   emoji: '🌬️', color: '#4A9B8A', light: '#E0F4F1' },
  contract: { label: 'Contractez', emoji: '💪', color: '#C95F7B', light: '#FFF0F2' },
  hold:     { label: 'Maintenez',  emoji: '🔒', color: '#8B1E4E', light: '#FDE8F0' },
  relax:    { label: 'Relâchez',   emoji: '🌸', color: '#5A77C0', light: '#EBF0FF' },
  rest:     { label: 'Reposez',    emoji: '💤', color: '#7A6670', light: '#F5F0F2' },
};

export function isContractPhase(action: ExAction) {
  return action === 'contract' || action === 'hold';
}
