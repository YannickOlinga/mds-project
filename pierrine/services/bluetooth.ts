import { getDeviceService } from "@/services/device";
import type { PeripheralDevice } from "@/types/device";

const deviceService = getDeviceService("real");

export function requestBluetoothPermissions() {
  return deviceService.requestPermissions();
}

export function scanForPerineaDevices(
  onDevice: (device: PeripheralDevice) => void,
  onError: (error: Error) => void
) {
  return deviceService.scan(onDevice, onError);
}

export function connectPeripheral(deviceId: string): Promise<PeripheralDevice> {
  return deviceService.connect(deviceId);
}

export function unsubscribeFromSensor() {
  deviceService.unsubscribeFromSensor();
}

export function disposeBluetooth() {
  deviceService.dispose();
}
