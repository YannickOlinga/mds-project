import { WifiDeviceService } from "@/services/device/WifiDeviceService";
import type { PeripheralDevice } from "@/types/device";

const deviceService = WifiDeviceService;

export function requestWifiPermissions() {
  return deviceService.requestPermissions();
}

export function scanForPerineaDevicesWifi(
  onDevice: (device: PeripheralDevice) => void,
  onError: (error: Error) => void
) {
  return deviceService.scan(onDevice, onError);
}

export function connectPeripheralWifi(deviceId: string): Promise<PeripheralDevice> {
  return deviceService.connect(deviceId);
}

export function unsubscribeFromSensorWifi() {
  deviceService.unsubscribeFromSensor();
}

export function disposeWifi() {
  deviceService.dispose();
}
