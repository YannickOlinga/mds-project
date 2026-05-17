import { RealDeviceService } from "@/services/device/RealDeviceService";
import { SimulatedDeviceService } from "@/services/device/SimulatedDeviceService";

export type DeviceServiceMode = "real" | "simulation";

export function getDeviceService(mode: DeviceServiceMode = "real") {
  return mode === "simulation" ? SimulatedDeviceService : RealDeviceService;
}
