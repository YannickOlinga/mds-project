import axios from "axios";

import type { ApiErrorPayload } from "@/types/api";

export class AppError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "AppError";
    this.status = status;
  }
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof AppError) {
    return error.message;
  }

  if (axios.isAxiosError<ApiErrorPayload>(error)) {
    const data = error.response?.data;
    if (typeof data?.detail === "string") return data.detail;
    if (typeof data?.message === "string") return data.message;
    if (Array.isArray(data?.non_field_errors)) return data.non_field_errors.join("\n");
    if (!error.response) return "Connexion au serveur impossible. Vérifiez votre réseau.";
    return `Erreur serveur (${error.response.status}).`;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Une erreur inattendue est survenue.";
}
