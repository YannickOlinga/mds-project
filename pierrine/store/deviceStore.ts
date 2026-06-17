import { create } from "zustand";

import {
  connectPeripheral,
  requestBluetoothPermissions,
  scanForPerineaDevices,
  unsubscribeFromSensor,
} from "@/services/bluetooth";
import {
  connectPeripheralWifi,
  requestWifiPermissions,
  scanForPerineaDevicesWifi,
  unsubscribeFromSensorWifi,
} from "@/services/wifi";
import { touchSignal } from "@/services/touchSignal";
import type {
  BluetoothConnectionState,
  ConnectionType,
  InputMode,
  PeripheralDevice,
} from "@/types/device";
import { getErrorMessage } from "@/utils/apiError";

const SCAN_DURATION_MS = 15000;

type DeviceState = {
  state: BluetoothConnectionState;
  devices: PeripheralDevice[];
  connectedDevice: PeripheralDevice | null;
  error: string | null;
  connectionType: ConnectionType;
  inputMode: InputMode;
  stopScan?: () => void;
};

type DeviceActions = {
  setConnectionType: (type: ConnectionType) => void;
  setInputMode: (mode: InputMode) => void;
  scan: () => Promise<void>;
  connect: (deviceId: string) => Promise<void>;
  disconnectLocal: () => void;
  reset: () => void;
};

const initialState: DeviceState = {
  state: "idle",
  devices: [],
  connectedDevice: null,
  error: null,
  connectionType: "ble",
  inputMode: "phone",
};

export const useDeviceStore = create<DeviceState & DeviceActions>((set, get) => ({
  ...initialState,

  setConnectionType: (type: ConnectionType) => {
    set({ connectionType: type, devices: [], error: null });
  },

  setInputMode: (mode: InputMode) => {
    set({ inputMode: mode });
  },

  scan: async () => {
    const { connectionType } = get();
    get().stopScan?.();

    const isWifi = connectionType === "wifi";
    const requestPerms = isWifi ? requestWifiPermissions : requestBluetoothPermissions;
    const scanFn = isWifi ? scanForPerineaDevicesWifi : scanForPerineaDevices;

    const granted = await requestPerms();
    if (!granted) {
      const errMsg = isWifi
        ? "WiFi indisponible. Vérifiez la connexion réseau."
        : "Bluetooth indisponible ici. Ouvrez l’app dans un build natif iOS/Android pour connecter une sonde.";
      set({
        state: "permission-required",
        error: errMsg,
      });
      return;
    }

    set({ state: "scanning", devices: [], error: null });
    try {
      const stopScan = scanFn(
        (device) => {
          const withType = { ...device, connectionType };
          set((state) => ({
            devices: state.devices.some((item) => item.id === device.id)
              ? state.devices
              : [...state.devices, withType],
          }));
        },
        (error) => set({ state: "error", error: getErrorMessage(error) })
      );

      // Fin automatique du scan après 15 s : on arrête la recherche et on
      // revient à un état stable (les sondes trouvées restent affichées).
      const scanTimer = setTimeout(() => {
        const current = get();
        if (current.state === "scanning") {
          current.stopScan?.();
          set({ state: current.devices.length > 0 ? "idle" : "disconnected", stopScan: undefined });
        }
      }, SCAN_DURATION_MS);

      set({
        stopScan: () => {
          clearTimeout(scanTimer);
          stopScan();
        },
      });
    } catch (error) {
      set({ state: "error", error: getErrorMessage(error) });
    }
  },

  connect: async (deviceId) => {
    const { connectionType } = get();
    get().stopScan?.();
    set({ state: "connecting", error: null });
    try {
      const isWifi = connectionType === "wifi";
      const connectFn = isWifi ? connectPeripheralWifi : connectPeripheral;
      const connectedDevice = await connectFn(deviceId);
      // La sonde vient d'être connectée → on bascule sur le mode IoT par défaut.
      set({
        state: "connected",
        connectedDevice: { ...connectedDevice, connectionType },
        inputMode: "iot",
      });
    } catch (error) {
      set({ state: "error", error: getErrorMessage(error) });
    }
  },

  disconnectLocal: () => {
    const { connectionType } = get();
    const isWifi = connectionType === "wifi";
    const unsubscribe = isWifi ? unsubscribeFromSensorWifi : unsubscribeFromSensor;

    get().stopScan?.();
    unsubscribe();
    touchSignal.reset();
    // Plus de sonde → on repasse au toucher écran pour que les jeux restent jouables.
    set({ state: "disconnected", connectedDevice: null, stopScan: undefined, inputMode: "phone" });
  },

  reset: () => {
    const { connectionType } = get();
    const isWifi = connectionType === "wifi";
    const unsubscribe = isWifi ? unsubscribeFromSensorWifi : unsubscribeFromSensor;

    get().stopScan?.();
    unsubscribe();
    touchSignal.reset();
    set({ ...initialState });
  },
}));
