#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>
#include <WiFi.h>
#include <WebServer.h>
#include <ArduinoJson.h>

#define BUTTON_PIN 4

// UUIDs identiques à services/device/bleUUIDs.ts
#define SERVICE_UUID    "f3641400-00b0-4240-ba50-05ca45bf8abc"
#define TOUCH_CHAR_UUID "f3641401-00b0-4240-ba50-05ca45bf8abc"

// WiFi credentials
const char* WIFI_SSID = "Yannick";
const char* WIFI_PASSWORD = "00000000";

struct TouchSensor {
  byte wasPressed = LOW;
  byte isPressed  = LOW;
};

// ========== BLE ==========
BLECharacteristic* pTouchChar = nullptr;
bool bleConnected = false;

class ServerCallbacks : public BLEServerCallbacks {
  void onConnect(BLEServer* pServer) {
    bleConnected = true;
    Serial.println("[BLE] App connectée");
  }
  void onDisconnect(BLEServer* pServer) {
    bleConnected = false;
    Serial.println("[BLE] App déconnectée — relance advertising");
    delay(500);
    pServer->startAdvertising();
  }
};

// ========== WiFi + HTTP Server (simple polling) ==========
WebServer server(81);
bool wifiConnected = false;

// Garder l'état du dernier capteur pour polling
struct {
  bool pressed = false;
  unsigned long timestamp = 0;
} lastTouchState;

void handleTouchStatus() {
  StaticJsonDocument<128> doc;
  doc["event"] = "touch";
  doc["pressed"] = lastTouchState.pressed;
  doc["timestamp"] = lastTouchState.timestamp;

  String json;
  serializeJson(doc, json);

  server.sendHeader("Content-Type", "application/json");
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.send(200, "application/json", json);
}

void handleRoot() {
  server.send(200, "text/plain", "Perinea-ESP32 IoT Device\nTouchez /touch pour l'état du capteur tactile");
}

void connectToWiFi() {
  Serial.printf("[WiFi] Connexion à %s...\n", WIFI_SSID);
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  Serial.println();

  if (WiFi.status() == WL_CONNECTED) {
    wifiConnected = true;
    Serial.printf("[WiFi] Connecté! IP: %s\n", WiFi.localIP().toString().c_str());

    // Configurer les routes HTTP
    server.on("/", handleRoot);
    server.on("/touch", handleTouchStatus);
    server.enableCORS();
    server.begin();

    Serial.println("[HTTP] Serveur démarré sur port 81");
  } else {
    wifiConnected = false;
    Serial.println("[WiFi] Échec de la connexion — mode Bluetooth uniquement");
  }
}

bool isTouchPressed(int pin) {
  return digitalRead(pin) == HIGH;
}

void setup() {
  pinMode(BUTTON_PIN, INPUT);
  Serial.begin(115200);
  delay(1000);

  Serial.println("\n\n[Périnea] Initialisation...");

  // ========== BLE Setup ==========
  BLEDevice::init("Perinea-ESP32");
  BLEServer* pServer = BLEDevice::createServer();
  pServer->setCallbacks(new ServerCallbacks());

  BLEService* pService = pServer->createService(SERVICE_UUID);

  pTouchChar = pService->createCharacteristic(
    TOUCH_CHAR_UUID,
    BLECharacteristic::PROPERTY_READ |
    BLECharacteristic::PROPERTY_NOTIFY
  );
  pTouchChar->addDescriptor(new BLE2902());

  uint8_t init = 0;
  pTouchChar->setValue(&init, 1);
  pService->start();

  BLEAdvertising* pAdv = BLEDevice::getAdvertising();
  pAdv->addServiceUUID(SERVICE_UUID);
  pAdv->setScanResponse(true);
  pAdv->setMinPreferred(0x06);
  BLEDevice::startAdvertising();

  Serial.println("[BLE] Prêt — en attente de l'app Pierrine...");

  // ========== WiFi Setup ==========
  connectToWiFi();

  Serial.println("[Périnea] Initialisation complète");
}

void loop() {
  // Gérer les requêtes HTTP
  if (wifiConnected) {
    server.handleClient();
  }

  TouchSensor touch;
  static byte lastPressed = LOW;

  touch.isPressed = isTouchPressed(BUTTON_PIN);

  if (lastPressed != touch.isPressed) {
    Serial.printf("[TOUCH] %s\n", touch.isPressed ? "APPUYÉ" : "RELÂCHÉ");

    // Mettre à jour l'état global (pour HTTP polling)
    lastTouchState.pressed = touch.isPressed;
    lastTouchState.timestamp = millis();

    // Envoyer via BLE
    if (bleConnected && pTouchChar) {
      uint8_t val = touch.isPressed ? 0x01 : 0x00;
      pTouchChar->setValue(&val, 1);
      pTouchChar->notify();
    }
  }

  lastPressed = touch.isPressed;
  delay(10);
}
