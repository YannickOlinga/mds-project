const { expo } = require("./app.json");
const { getApiBaseUrl, getLocalIpAddress } = require("./scripts/get-local-ip");

const apiBaseUrl = getApiBaseUrl();
const apiHost = process.env.EXPO_PUBLIC_API_HOST ?? getLocalIpAddress();
const apiPort = process.env.EXPO_PUBLIC_API_PORT ?? "8000";

// Disponible dans le bundle client (axios, fetch, etc.)
process.env.EXPO_PUBLIC_API_BASE_URL = apiBaseUrl;

module.exports = {
  expo: {
    ...expo,
    extra: {
      ...expo.extra,
      apiBaseUrl,
      apiHost,
      apiPort,
    },
  },
};
