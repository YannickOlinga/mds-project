const os = require("node:os");

const { expo } = require("./app.json");

const DEFAULT_API_PORT = "8000";

function getLocalIpAddress() {
  const interfaces = os.networkInterfaces();

  for (const addresses of Object.values(interfaces)) {
    const address = addresses?.find(
      (item) => item.family === "IPv4" && !item.internal
    );

    if (address) {
      return address.address;
    }
  }

  return "localhost";
}

function getApiBaseUrl() {
  if (process.env.EXPO_PUBLIC_API_BASE_URL) {
    return process.env.EXPO_PUBLIC_API_BASE_URL;
  }

  const host = process.env.EXPO_PUBLIC_API_HOST ?? getLocalIpAddress();
  const port = process.env.EXPO_PUBLIC_API_PORT ?? DEFAULT_API_PORT;

  return `http://${host}:${port}`;
}

const apiBaseUrl = getApiBaseUrl();

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
