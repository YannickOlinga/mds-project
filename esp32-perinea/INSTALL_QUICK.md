# 🚀 Installation Rapide — HTTP Polling

## Étape 1 : Installer la dépendance optionnelle

### Dans Arduino IDE :

1. **Ouvrir le gestionnaire :**
   ```
   Sketch → Include Library → Manage Libraries...
   ```

2. **Installer ArduinoJson (optionnel mais recommandé):**
   - Chercher : `ArduinoJson`
   - Cliquer sur **Install**

**C'est tout!** Les autres dépendances (WiFi, WebServer, BLE) sont intégrées à ESP32.

---

## Étape 2 : Copier le fichier firmware

Copier `perinea.ino` de ce dossier vers :
```
Documents/Arduino/perinea/perinea.ino
```

---

## Étape 3 : Configurer le WiFi

Éditer `perinea.ino` lignes 15-16 :

```cpp
const char* WIFI_SSID = "Votre_WiFi";          // ← Remplacer par votre SSID
const char* WIFI_PASSWORD = "VotreMotDePasse"; // ← Remplacer par votre mot de passe
```

**Exemples:**
```cpp
const char* WIFI_SSID = "Livebox-123";
const char* WIFI_PASSWORD = "abc123xyz456";
```

---

## Étape 4 : Télécharger sur ESP32

1. **Connecter l'ESP32** via câble USB
2. **Sélectionner la carte :**
   ```
   Tools → Board → ESP32 → ESP32 Dev Module
   ```
3. **Sélectionner le port :**
   ```
   Tools → Port → /dev/ttyUSB0
   ```
   (ou COM3, COM4, etc. sur Windows)

4. **Cliquer Sketch → Upload**

---

## Étape 5 : Vérifier dans le moniteur série

1. **Ouvrir le moniteur série :**
   ```
   Tools → Serial Monitor
   ```
2. **Vitesse : 115200 baud**

3. **Vous devez voir :**
   ```
   [Périnea] Initialisation...
   [BLE] Prêt — en attente de l'app Pierrine...
   [WiFi] Connexion à Livebox-123...
   [WiFi] Connecté! IP: 192.168.1.42
   [WebSocket] Serveur démarré sur port 81
   ```

---

## ✅ C'est prêt !

L'ESP32 accepte maintenant les connexions :
- **Bluetooth BLE** — nom: `Perinea-ESP32`
- **WiFi WebSocket** — IP: `192.168.1.42:81`

---

## 🐛 Dépannage

### "ArduinoWebsockets.h: No such file or directory"

→ Vérifier que `ArduinoWebsockets by gilmaimon` est installé (pas une autre version!)

→ Tester : `Sketch → Include Library` → `ArduinoWebsockets` doit apparaître

→ Redémarrer Arduino IDE après installation

### "WiFi indisponible" ou IP pas affichée

→ Vérifier le SSID/mot de passe (majuscules/minuscules importants!)

→ Approcher le ESP32 du routeur WiFi

→ Augmenter le timeout : `attempts < 30` au lieu de `20`

### "Connexion BLE ok mais pas de notifications"

→ Vérifier que le capteur tactile est connecté à GPIO4

→ Tester avec un bouton temporaire : GND ← GPIO4 (appuyer)

---

## 📝 Notes

- Port WebSocket: **81** (modifiable dans le code)
- Fréquence tactile: **100 Hz** (délai 10ms)
- Scan réseau: ~10 secondes
- Portée WiFi: ~100m (selon routeur)
- Portée Bluetooth: ~10m

Le code envoie aux deux en parallèle. L'app choisit le mode.
