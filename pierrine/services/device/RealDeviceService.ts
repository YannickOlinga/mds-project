import { PermissionsAndroid, Platform } from "react-native";
import { BleManager, Device } from "react-native-ble-plx";

import { ESP32_SERVICE_UUID, TOUCH_CHAR_UUID } from "@/services/device/bleUUIDs";
import { touchSignal } from "@/services/touchSignal";
import type { PeripheralDevice } from "@/types/device";

let manager: BleManager | null = null;
let activeDevice: Device | null = null;
let touchSubscriptionRemover: (() => void) | null = null;

function assertBluetoothRuntime() {
  if (Platform.OS === "web") {
    throw new Error("Le Bluetooth natif necessite un build iOS ou Android.");
  }
}

function getManager() {
  assertBluetoothRuntime();
  if (!manager) {
    try {
      manager = new BleManager();
    } catch (e) {
      throw new Error(
        "Le module Bluetooth natif est indisponible. Lancez un build de développement (npx expo run:ios / run:android) — le Bluetooth ne fonctionne pas dans Expo Go."
      );
    }
  }
  return manager;
}

/**
 * Décode le premier octet d'une valeur base64 renvoyée par react-native-ble-plx.
 * 0x00 (AA==) → relâché · 0x01 (AQ==) → appuyé
 */
function decodeFirstByte(b64: string): number {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const c0 = alphabet.indexOf(b64[0]);
  const c1 = alphabet.indexOf(b64[1]);
  return ((c0 << 2) | (c1 >> 4)) & 0xff;
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

    return Object.values(results).every((v) => v === PermissionsAndroid.RESULTS.GRANTED);
  },

  scan(onDevice: (device: PeripheralDevice) => void, onError: (error: Error) => void) {
    if (Platform.OS === "web") {
      onError(new Error("Le scan Bluetooth necessite l'application mobile native."));
      return () => undefined;
    }

    const ble = getManager();
    ble.startDeviceScan(null, { allowDuplicates: false }, (error, device) => {
      if (error) { onError(error); return; }
      if (!device?.name) return;

      const name = device.name.toLowerCase();
      if (!name.includes("perinea") && !name.includes("périnea") && !name.includes("esp32")) return;

      onDevice({ id: device.id, name: device.name, rssi: device.rssi });
    });

    return () => ble.stopDeviceScan();
  },

  async connect(deviceId: string): Promise<PeripheralDevice> {
    const device = await getManager().connectToDevice(deviceId, { timeout: 15000 });
    await device.discoverAllServicesAndCharacteristics();
    activeDevice = device;

    // Tente de s'abonner aux notifications de la caractéristique tactile de l'ESP32
    this.subscribeToSensor();

    return {
      id: device.id,
      name: device.name ?? "Périnea",
      rssi: device.rssi,
    };
  },

  subscribeToSensor() {
    if (!activeDevice) return;

    try {
      const sub = activeDevice.monitorCharacteristicForService(
        ESP32_SERVICE_UUID,
        TOUCH_CHAR_UUID,
        (error, characteristic) => {
          if (error) {
            console.log("[BLE] Touch notification error:", error.message);
            return;
          }
          if (!characteristic?.value) return;
          touchSignal.isPressed = decodeFirstByte(characteristic.value) !== 0;
        }
      );
      touchSubscriptionRemover = () => sub.remove();
    } catch (e) {
      // L'appareil ne dispose pas du service ESP32 — mode sonde sans tactile
      console.log("[BLE] Service tactile ESP32 non trouvé sur cet appareil");
    }
  },

  unsubscribeFromSensor() {
    touchSubscriptionRemover?.();
    touchSubscriptionRemover = null;
    touchSignal.reset();
  },

  dispose() {
    this.unsubscribeFromSensor();
    activeDevice = null;
    manager?.destroy();
    manager = null;
  },
};
