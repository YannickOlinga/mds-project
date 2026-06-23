/**
 * Détection de l'IP locale pour le dev Expo / React Native.
 * Utilisé par app.config.js au démarrage et par scripts/print-api-url.js.
 */
const os = require("node:os");

const DEFAULT_API_PORT = "8000";

/** Interfaces réseau préférées (Wi‑Fi / Ethernet en premier). */
const PREFERRED_INTERFACES = ["en0", "en1", "wlan0", "eth0"];

/** Préfixes à ignorer (VPN, Docker, loopback virtuel, etc.). */
const IGNORED_INTERFACE = /^(lo|utun|awdl|llw|bridge|docker|veth|vmnet|gif|stf)/i;

function isIPv4(entry) {
  return entry.family === "IPv4" || entry.family === 4;
}

function isUsableAddress(entry) {
  if (!isIPv4(entry) || entry.internal) return false;
  // Link-local APIPA
  if (entry.address.startsWith("169.254.")) return false;
  return true;
}

/**
 * Retourne la première IPv4 non interne de la machine (réseau local).
 * @returns {string}
 */
function getLocalIpAddress() {
  let interfaces;
  try {
    interfaces = os.networkInterfaces();
  } catch {
    return "127.0.0.1";
  }

  if (!interfaces) return "127.0.0.1";

  for (const name of PREFERRED_INTERFACES) {
    const match = interfaces[name]?.find(isUsableAddress);
    if (match) return match.address;
  }

  for (const [name, addresses] of Object.entries(interfaces)) {
    if (IGNORED_INTERFACE.test(name)) continue;
    const match = addresses?.find(isUsableAddress);
    if (match) return match.address;
  }

  return "127.0.0.1";
}

/**
 * URL de base de l'API Django.
 * Priorité : EXPO_PUBLIC_API_BASE_URL > API Scalingo par défaut.
 * @returns {string}
 */
function getApiBaseUrl() {
  if (process.env.EXPO_PUBLIC_API_BASE_URL) {
    return process.env.EXPO_PUBLIC_API_BASE_URL.replace(/\/$/, "");
  }

  // Utiliser l'API Scalingo par défaut (en dev et en prod)
  return "https://perinea.osc-fr1.scalingo.io";
}

module.exports = {
  DEFAULT_API_PORT,
  getLocalIpAddress,
  getApiBaseUrl,
};
