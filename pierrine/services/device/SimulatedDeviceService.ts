import type { PeripheralDevice } from "@/types/device";

export const SimulatedDeviceService = {
  async requestPermissions() {
    return true;
  },

  scan(_onDevice: (device: PeripheralDevice) => void, onError: (error: Error) => void) {
    onError(new Error("Mode simulation indisponible tant qu'il n'est pas active explicitement."));
    return () => undefined;
  },

  async connect(): Promise<PeripheralDevice> {
    throw new Error("Mode simulation indisponible tant qu'il n'est pas active explicitement.");
  },

  dispose() {
    return undefined;
  },
};
