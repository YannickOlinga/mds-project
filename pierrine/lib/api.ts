export {
  completeTraining,
  connectDevice,
  getDashboard,
  getDeviceStatus,
  getMeProfile,
  getProgress,
  getTrainingProgram,
  loginRequest as login,
  registerRequest as register,
  updateMeProfileSettings,
} from "@/services/endpoints";

export { api, publicApi, refreshAccessToken, setUnauthorizedHandler } from "@/services/api";
