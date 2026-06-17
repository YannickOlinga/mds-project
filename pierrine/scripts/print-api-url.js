#!/usr/bin/env node
const { getApiBaseUrl, getLocalIpAddress } = require("./get-local-ip");

const baseUrl = getApiBaseUrl();
const ip = getLocalIpAddress();

console.log("");
console.log("Configuration API (dev)");
console.log("  IP locale détectée :", ip);
console.log("  EXPO_PUBLIC_API_BASE_URL :", process.env.EXPO_PUBLIC_API_BASE_URL ?? "(auto)");
console.log("  URL utilisée :", baseUrl);
console.log("");
console.log("Lancer le backend : cd ../backend && python manage.py runserver 0.0.0.0:8000");
console.log("");
