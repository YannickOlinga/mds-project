import { PermissionsAndroid, Platform } from "react-native";
import { BleManager, Device } from "react-native-ble-plx";

import type { PeripheralDevice } from "@/types/device";

let manager: BleManager | null = null;

function assertBluetoothRuntime() {
  if (Platform.OS === "web") {
    throw new Error("Le Bluetooth natif necessite un build iOS ou Android.");
  }
}

function getManager() {
  assertBluetoothRuntime();
  manager = manager ?? new BleManager();
  return manager;
}

export const RealDeviceService = {
  async requestPermissions() {
    if (Platform.OS === "web") return false;

    if (Platform.OS !== "android") return true;

    if (Platform.Version < 31) {
      const result = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
      );
      return result === PermissionsAndroid.RESULTS.GRANTED;
    }

    const results = await PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    ]);

    return Object.values(results).every((value) => value === PermissionsAndroid.RESULTS.GRANTED);
  },

  scan(onDevice: (device: PeripheralDevice) => void, onError: (error: Error) => void) {
    if (Platform.OS === "web") {
      onError(new Error("Le scan Bluetooth necessite l'application mobile native."));
      return () => undefined;
    }

    const ble = getManager();
    ble.startDeviceScan(null, { allowDuplicates: false }, (error, device) => {
      if (error) {
        onError(error);
        return;
      }

      if (!device?.name) return;

      const lowerName = device.name.toLowerCase();
      if (!lowerName.includes("perinea") && !lowerName.includes("périnea")) return;

      onDevice({
        id: device.id,
        name: device.name,
        rssi: device.rssi,
      });
    });

    return () => ble.stopDeviceScan();
  },

  async connect(deviceId: string) {
    const device: Device = await getManager().connectToDevice(deviceId, { timeout: 15000 });
    await device.discoverAllServicesAndCharacteristics();
    return {
      id: device.id,
      name: device.name ?? "Périnea",
      rssi: device.rssi,
    };
  },

  dispose() {
    manager?.destroy();
    manager = null;
  },
};
