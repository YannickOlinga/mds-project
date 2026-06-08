import { Platform } from 'react-native';
import { touchSignal } from '@/services/touchSignal';
import type { PeripheralDevice } from '@/types/device';

const SCAN_TIMEOUT = 10000; // 10 secondes
const DISCOVERY_PORT = 81;
const POLLING_INTERVAL = 100; // 100ms entre les polls

let activeIP: string | null = null;
let pollIntervalId: ReturnType<typeof setInterval> | null = null;
let scanAbortController: AbortController | null = null;

/**
 * Scan le réseau local pour trouver les appareils Perinea en émettant des requêtes HTTP
 * à différentes adresses IP potentielles (192.168.1.x, 192.168.0.x, etc).
 */
async function scanLocalNetwork(
  onDevice: (device: PeripheralDevice) => void,
  onError: (error: Error) => void
): Promise<() => void> {
  const subnets = [
    '192.168.1',
    '192.168.0',
    '192.168.100',
    '10.0.0',
  ];

  const discoveredIPs = new Set<string>();
  let activeRequests = 0;
  let scanComplete = false;
  let cancelled = false;

  const cleanup = () => {
    cancelled = true;
  };

  async function probeIP(ip: string) {
    if (cancelled) return;
    activeRequests++;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);

      const response = await fetch(`http://${ip}:81/`, {
        method: 'GET',
        signal: controller.signal,
      }).catch(() => null);

      clearTimeout(timeoutId);

      if (response && response.ok && !discoveredIPs.has(ip)) {
        discoveredIPs.add(ip);
        onDevice({
          id: ip,
          name: `Perinea-${ip.split('.')[3]}`,
          rssi: null,
        });
      }
    } catch (e) {
      // Expected timeouts
    } finally {
      activeRequests--;
    }
  }

  // Lancer les probes pour tous les IPs potentiels
  const promises: Promise<void>[] = [];
  for (const subnet of subnets) {
    for (let i = 1; i <= 254; i++) {
      const ip = `${subnet}.${i}`;
      promises.push(probeIP(ip));
    }
  }

  scanComplete = true;

  // Attendre max 10s ou la fin de tous les probes
  await Promise.race([
    Promise.all(promises),
    new Promise(r => setTimeout(r, SCAN_TIMEOUT)),
  ]).catch(() => {
    /* timeout ok */
  });

  return cleanup;
}

/**
 * Commence le polling HTTP de l'état du capteur tactile toutes les 100ms
 */
function startPolling(ip: string) {
  if (pollIntervalId) clearInterval(pollIntervalId);

  pollIntervalId = setInterval(async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);

      const response = await fetch(`http://${ip}:81/touch`, {
        method: 'GET',
        signal: controller.signal,
      }).catch(() => null);

      clearTimeout(timeoutId);

      if (response && response.ok) {
        const data = await response.json();
        if (data.event === 'touch') {
          touchSignal.isPressed = data.pressed === true;
        }
      }
    } catch (e) {
      // Erreurs de polling silencieuses
      console.warn('[WiFi] Erreur polling :', e);
    }
  }, POLLING_INTERVAL);
}

export const WifiDeviceService = {
  async requestPermissions() {
    return true;
  },

  scan(onDevice: (device: PeripheralDevice) => void, onError: (error: Error) => void) {
    if (Platform.OS === 'web') {
      onError(new Error('Le scan WiFi nécessite l\'application mobile native.'));
      return () => undefined;
    }

    scanAbortController = new AbortController();
    scanLocalNetwork(onDevice, onError).catch(e => onError(e));

    return () => {
      scanAbortController?.abort();
    };
  },

  async connect(deviceId: string): Promise<PeripheralDevice> {
    const ip = deviceId; // l'ID est l'IP

    // Tester la connexion HTTP
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Timeout connexion WiFi à ${ip}`));
      }, 5000);

      fetch(`http://${ip}:81/touch`)
        .then(response => {
          clearTimeout(timeout);
          if (!response.ok) throw new Error('HTTP error');

          activeIP = ip;
          startPolling(ip);

          resolve({
            id: deviceId,
            name: `Perinea-${ip.split('.')[3]}`,
            rssi: null,
          });
        })
        .catch(e => {
          clearTimeout(timeout);
          reject(new Error(`Impossible de connecter à ${ip}`));
        });
    });
  },

  unsubscribeFromSensor() {
    if (pollIntervalId) {
      clearInterval(pollIntervalId);
      pollIntervalId = null;
    }
    activeIP = null;
    touchSignal.reset();
  },

  dispose() {
    this.unsubscribeFromSensor();
  },
};
