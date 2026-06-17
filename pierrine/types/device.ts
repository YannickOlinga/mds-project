export type BluetoothConnectionState =
  | "idle"
  | "permission-required"
  | "scanning"
  | "connecting"
  | "connected"
  | "disconnected"
  | "error";

export type ConnectionType = "ble" | "wifi";

/**
 * Source d'entrée choisie par le joueur pour piloter les jeux :
 * - "iot"   → la sonde ESP32 (signal BLE/WiFi)
 * - "phone" → le toucher de l'écran du téléphone
 */
export type InputMode = "iot" | "phone";

export type PeripheralDevice = {
  id: string;
  name: string;
  rssi?: number | null;
  batteryPct?: number;
  connectionType?: ConnectionType;
};
