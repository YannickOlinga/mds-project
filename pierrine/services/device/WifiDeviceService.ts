import { Platform } from 'react-native';
import * as Network from 'expo-network';
import { touchSignal } from '@/services/touchSignal';
import type { PeripheralDevice } from '@/types/device';

const SCAN_TIMEOUT = 15000; // 15 secondes
const DISCOVERY_PORT = 81;
const POLLING_INTERVAL = 100; // 100ms entre les polls
const PROBE_TIMEOUT = 1500;   // timeout par IP
const MAX_CONCURRENT = 40;    // requêtes simultanées max

/**
 * Récupère l'IP locale du téléphone et en déduit le préfixe /24 (ex: "10.144.158").
 * Permet de scanner le bon sous-réseau quel que soit le réseau (box, hotspot...).
 */
async function getLocalSubnet(): Promise<string | null> {
  try {
    const ip = await Network.getIpAddressAsync();
    if (!ip || ip === '0.0.0.0') return null;
    const parts = ip.split('.');
    if (parts.length !== 4) return null;
    return `${parts[0]}.${parts[1]}.${parts[2]}`;
  } catch {
    return null;
  }
}

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
  let cancelled = false;
  const cleanup = () => {
    cancelled = true;
  };

  // Sous-réseau du téléphone détecté automatiquement, en priorité.
  const detected = await getLocalSubnet();
  const fallbacks = [
    '172.20.10',   // Partage de connexion iPhone
    '192.168.43',  // Partage de connexion Android
    '192.168.1',
    '192.168.0',
  ];
  const subnets = [...new Set([detected, ...fallbacks].filter(Boolean) as string[])];

  if (detected) {
    console.log(`[WiFi] Sous-réseau détecté : ${detected}.x — scan en cours...`);
  } else {
    console.warn('[WiFi] IP du téléphone introuvable — scan des sous-réseaux courants.');
  }

  const discoveredIPs = new Set<string>();

  async function probeIP(ip: string): Promise<boolean> {
    if (cancelled) return false;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), PROBE_TIMEOUT);

    const response = await fetch(`http://${ip}:${DISCOVERY_PORT}/`, {
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
      return true;
    }
    return false;
  }

  // Liste de toutes les IP à sonder
  const targets: string[] = [];
  for (const subnet of subnets) {
    for (let i = 1; i <= 254; i++) targets.push(`${subnet}.${i}`);
  }

  // Scan par lots pour ne pas saturer la pile réseau de React Native
  const runScan = async () => {
    for (let i = 0; i < targets.length && !cancelled; i += MAX_CONCURRENT) {
      const batch = targets.slice(i, i + MAX_CONCURRENT);
      await Promise.all(batch.map(probeIP));
    }
  };

  await Promise.race([
    runScan(),
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
