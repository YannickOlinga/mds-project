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
import type { BluetoothConnectionState, ConnectionType, PeripheralDevice } from "@/types/device";
import { getErrorMessage } from "@/utils/apiError";

type DeviceState = {
  state: BluetoothConnectionState;
  devices: PeripheralDevice[];
  connectedDevice: PeripheralDevice | null;
  error: string | null;
  connectionType: ConnectionType;
  stopScan?: () => void;
};

type DeviceActions = {
  setConnectionType: (type: ConnectionType) => void;
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
};

export const useDeviceStore = create<DeviceState & DeviceActions>((set, get) => ({
  ...initialState,

  setConnectionType: (type: ConnectionType) => {
    set({ connectionType: type, devices: [], error: null });
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
      set({ stopScan });
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
      set({ state: "connected", connectedDevice: { ...connectedDevice, connectionType } });
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
    set({ state: "disconnected", connectedDevice: null, stopScan: undefined });
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
