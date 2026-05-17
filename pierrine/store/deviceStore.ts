import { create } from "zustand";

import {
  connectPeripheral,
  requestBluetoothPermissions,
  scanForPerineaDevices,
} from "@/services/bluetooth";
import type { BluetoothConnectionState, PeripheralDevice } from "@/types/device";
import { getErrorMessage } from "@/utils/apiError";

type DeviceState = {
  state: BluetoothConnectionState;
  devices: PeripheralDevice[];
  connectedDevice: PeripheralDevice | null;
  error: string | null;
  stopScan?: () => void;
};

type DeviceActions = {
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
};

export const useDeviceStore = create<DeviceState & DeviceActions>((set, get) => ({
  ...initialState,

  scan: async () => {
    get().stopScan?.();
    const granted = await requestBluetoothPermissions();
    if (!granted) {
      set({
        state: "permission-required",
        error: "Bluetooth indisponible ici. Ouvrez l’app dans un build natif iOS/Android pour connecter une sonde.",
      });
      return;
    }

    set({ state: "scanning", devices: [], error: null });
    const stopScan = scanForPerineaDevices(
      (device) =>
        set((state) => ({
          devices: state.devices.some((item) => item.id === device.id)
            ? state.devices
            : [...state.devices, device],
        })),
      (error) => set({ state: "error", error: getErrorMessage(error) })
    );
    set({ stopScan });
  },

  connect: async (deviceId) => {
    get().stopScan?.();
    set({ state: "connecting", error: null });
    try {
      const connectedDevice = await connectPeripheral(deviceId);
      set({ state: "connected", connectedDevice });
    } catch (error) {
      set({ state: "error", error: getErrorMessage(error) });
    }
  },

  disconnectLocal: () => {
    get().stopScan?.();
    set({ state: "disconnected", connectedDevice: null, stopScan: undefined });
  },

  reset: () => {
    get().stopScan?.();
    set({ ...initialState });
  },
}));
