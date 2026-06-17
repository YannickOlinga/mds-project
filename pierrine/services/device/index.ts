import { RealDeviceService } from "@/services/device/RealDeviceService";
import { SimulatedDeviceService } from "@/services/device/SimulatedDeviceService";
import { WifiDeviceService } from "@/services/device/WifiDeviceService";
import type { ConnectionType } from "@/types/device";

export type DeviceServiceMode = "real" | "simulation";

export function getDeviceService(
  mode: DeviceServiceMode = "real",
  connectionType: ConnectionType = "ble"
) {
  if (mode === "simulation") return SimulatedDeviceService;
  return connectionType === "wifi" ? WifiDeviceService : RealDeviceService;
}
