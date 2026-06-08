# Firmware Périnea ESP32

Firmware pour l'appareil IoT ESP32 avec support **Bluetooth BLE** et **WiFi**.

## Fonctionnalités

- ✅ **Bluetooth BLE** — Communication avec l'app via le protocole BLE standard
- ✅ **WiFi** — Communication sur réseau local via WebSocket
- ✅ **Capteur tactile** — Notifications des pression du bouton vers l'app
- ✅ **Auto-reconnexion** — Redémarrage du BLE advertising à la déconnexion

## Installation

### 1. Dépendances Arduino

**Seule dépendance optionnelle :**

```
- ArduinoJson (7.0.x ou plus récent) — Pour JSON parsing
```

Les autres bibliothèques sont **intégrées à ESP32** :
- `WiFi.h` ✓
- `WebServer.h` ✓
- `BLE*` ✓

### 2. Configuration WiFi

Éditer les lignes 16-17 du fichier `perinea.ino` :

```cpp
const char* WIFI_SSID = "Votre_SSID";
const char* WIFI_PASSWORD = "Votre_Mot_de_Passe";
```

### 3. Téléchargement

1. Ouvrir `perinea.ino` dans Arduino IDE
2. Sélectionner la carte : **Tools → Board → ESP32 Dev Module**
3. Sélectionner le port : **Tools → Port → /dev/ttyUSB0** (ou équivalent)
4. Cliquer sur **Sketch → Upload**

### 4. Vérification

Ouvrir le moniteur série (115200 baud) pour vérifier :

```
[Périnea] Initialisation...
[BLE] Prêt — en attente de l'app Pierrine...
[WiFi] Connexion à Votre_SSID...
[WiFi] Connecté! IP: 192.168.1.42
[WebSocket] Serveur démarré sur port 81
```

## Architecture

### Bluetooth BLE

- **Service UUID:** `f3641400-00b0-4240-ba50-05ca45bf8abc`
- **Characteristic UUID (Touch):** `f3641401-00b0-4240-ba50-05ca45bf8abc`
- **Valeurs:**
  - `0x00` (AA==) → Bouton relâché
  - `0x01` (AQ==) → Bouton appuyé

### WiFi HTTP Polling

- **Port:** 81
- **Protocole:** HTTP GET
- **Endpoint:** `GET http://<IP_ESP32>:81/touch`
- **Réponse JSON:**
  ```json
  {
    "event": "touch",
    "pressed": true,
    "timestamp": 123456
  }
  ```
- **Fréquence:** L'app poll toutes les 100ms

## Dépannage

### L'ESP32 n'apparaît pas en Bluetooth

1. Vérifier que `SERVICE_UUID` et `TOUCH_CHAR_UUID` correspondent à `services/device/bleUUIDs.ts`
2. Réinitialiser l'ESP32 : appuyer 2 fois sur RST
3. Vérifier les permissions Bluetooth sur le téléphone

### WiFi se connecte mais pas l'app

1. Vérifier les logs du moniteur série
2. Vérifier que l'ESP32 et le téléphone sont sur le même réseau
3. Tester avec `curl http://<IP_ESP32>:81` depuis un autre appareil
4. Augmenter `SCAN_TIMEOUT` dans `services/device/WifiDeviceService.ts` si le réseau est lent

### Bouton tactile ne fonctionne pas

1. Vérifier la broche : `#define BUTTON_PIN 4`
2. Tester le capteur directement sur PIN 4 (GND ← → GPIO4)
3. Vérifier la logique dans `isTouchPressed()`

## Pins de référence

```
GPIO 4  → Capteur tactile (INPUT)
GND     → Masse commune
5V      → Alimentation
```

## Support

Pour modifier les UUIDs ou les ports, éditer :

- **Bluetooth:** `perinea.ino` (lignes 7-8) et `services/device/bleUUIDs.ts`
- **WiFi:** `perinea.ino` (ligne 17) et `services/device/WifiDeviceService.ts`

Toute modification d'UUID/port doit être synchronisée entre le firmware et l'app React Native.
