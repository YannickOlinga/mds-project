/**
 * Signal de contraction musculaire provenant de l'ESP32 via BLE.
 * Stocké hors de React pour éviter des re-renders à chaque notification BLE (≈100Hz).
 * Le jeu lit `touchSignal.isPressed` directement dans sa boucle.
 */

type Listener = (pressed: boolean) => void;

let _isPressed = false;
const _listeners: Set<Listener> = new Set();

export const touchSignal = {
  get isPressed() {
    return _isPressed;
  },

  set isPressed(val: boolean) {
    if (_isPressed === val) return;
    _isPressed = val;
    _listeners.forEach((fn) => fn(val));
  },

  subscribe(fn: Listener): () => void {
    _listeners.add(fn);
    return () => _listeners.delete(fn);
  },

  reset() {
    _isPressed = false;
  },
};
