export type BluetoothConnectionState =
  | "idle"
  | "permission-required"
  | "scanning"
  | "connecting"
  | "connected"
  | "disconnected"
  | "error";

export type PeripheralDevice = {
  id: string;
  name: string;
  rssi?: number | null;
  batteryPct?: number;
};
