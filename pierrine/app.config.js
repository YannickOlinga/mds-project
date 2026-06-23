const { getApiBaseUrl } = require("./scripts/get-local-ip");

const PRODUCTION_API_URL = "https://perinea.osc-fr1.scalingo.io";

function resolveApiBaseUrl() {
  if (process.env.EXPO_PUBLIC_API_BASE_URL) {
    return process.env.EXPO_PUBLIC_API_BASE_URL.replace(/\/$/, "");
  }

  if (process.env.EAS_BUILD_PROFILE === "production") {
    return PRODUCTION_API_URL;
  }

  try {
    return getApiBaseUrl();
  } catch {
    return PRODUCTION_API_URL;
  }
}

/** @param {{ config: import("@expo/config-types").ExpoConfig }} ctx */
module.exports = ({ config }) => {
  const apiBaseUrl = resolveApiBaseUrl();
  process.env.EXPO_PUBLIC_API_BASE_URL = apiBaseUrl;

  return {
    ...config,
    extra: {
      ...config.extra,
      apiBaseUrl,
      eas: {
        projectId: "a53b1077-052e-4d85-9765-f47dfe04781d",
      },
    },
  };
};
