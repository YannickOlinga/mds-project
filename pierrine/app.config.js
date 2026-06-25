const PRODUCTION_API_URL = "https://perinea.osc-fr1.scalingo.io";

function resolveApiBaseUrl() {
  const fromEnv = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();
  if (fromEnv) {
    return fromEnv.replace(/\/$/, "");
  }

  // Par défaut : API Scalingo (backend + BDD en ligne), y compris en dev Expo.
  return PRODUCTION_API_URL;
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
