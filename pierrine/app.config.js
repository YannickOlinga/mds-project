const { expo } = require("./app.json");
const { getApiBaseUrl } = require("./scripts/get-local-ip");

// Ne pas écraser si déjà défini dans .env
const apiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL ?? getApiBaseUrl();

// Disponible dans le bundle client (axios, fetch, etc.)
process.env.EXPO_PUBLIC_API_BASE_URL = apiBaseUrl;

module.exports = {
  expo: {
    ...expo,
    extra: {
      ...expo.extra,
      apiBaseUrl,
    },
  },
};
