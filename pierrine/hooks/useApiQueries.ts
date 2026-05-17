import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  completeTraining,
  connectDevice,
  getDashboard,
  getDeviceStatus,
  getMeProfile,
  getProgress,
  getTrainingProgram,
  updateMeProfileSettings,
} from "@/services/endpoints";
import type { LevelKey } from "@/types/api";

export const queryKeys = {
  dashboard: ["dashboard"] as const,
  device: ["device"] as const,
  profile: ["profile"] as const,
  progress: ["progress"] as const,
  training: (levelKey: LevelKey) => ["training", levelKey] as const,
};

export function useDashboardQuery() {
  return useQuery({ queryKey: queryKeys.dashboard, queryFn: getDashboard });
}

export function useDeviceQuery() {
  return useQuery({ queryKey: queryKeys.device, queryFn: getDeviceStatus });
}

export function useConnectDeviceMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: connectDevice,
    onSuccess: (device) => {
      queryClient.setQueryData(queryKeys.device, device);
      void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });
}

export function useProfileQuery() {
  return useQuery({ queryKey: queryKeys.profile, queryFn: getMeProfile });
}

export function useUpdateProfileSettingsMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateMeProfileSettings,
    onSuccess: (profile) => {
      queryClient.setQueryData(queryKeys.profile, profile);
      void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });
}

export function useProgressQuery() {
  return useQuery({ queryKey: queryKeys.progress, queryFn: getProgress });
}

export function useTrainingProgramQuery(levelKey: LevelKey) {
  return useQuery({
    queryKey: queryKeys.training(levelKey),
    queryFn: () => getTrainingProgram(levelKey),
  });
}

export function useCompleteTrainingMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ levelKey, exercisesCount }: { levelKey: LevelKey; exercisesCount: number }) =>
      completeTraining(levelKey, exercisesCount),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
      void queryClient.invalidateQueries({ queryKey: queryKeys.progress });
      void queryClient.invalidateQueries({ queryKey: ["training"] });
    },
  });
}
