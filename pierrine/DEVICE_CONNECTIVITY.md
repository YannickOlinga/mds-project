# Guide de Connectivité des Appareils

Périnea supporte **deux modes de connexion** à l'appareil IoT ESP32 :

1. **Bluetooth BLE** — Portée ~10m, basse consommation
2. **WiFi (WebSocket)** — Portée ~100m (selon le routeur), plus stable en intérieur

## Architecture

```
┌─────────────────────┐
│  useDeviceStore     │
│  connectionType:    │
│  ├─ "ble"          │  ← Défaut
│  └─ "wifi"         │
└──────────┬──────────┘
           │ setConnectionType("wifi")
           ▼
    ┌──────────────────────┐
    │ services/device/     │
    │ ├─ bluetooth.ts      │ (BLE)
    │ └─ wifi.ts           │ (WiFi)
    └──────────────────────┘
```

## Utilisation

### 1. Sélectionner le mode de connexion

```typescript
const { setConnectionType, scan } = useDeviceStore();

// Passer en mode WiFi
setConnectionType("wifi");

// Scanner les appareils WiFi disponibles
await scan();
```

### 2. Écouter les changements

```typescript
const connectionType = useDeviceStore(state => state.connectionType);
const connectedDevice = useDeviceStore(state => state.connectedDevice);

useEffect(() => {
  if (connectedDevice?.connectionType === "wifi") {
    console.log("Connecté via WiFi:", connectedDevice.name);
  }
}, [connectedDevice]);
```

### 3. Recevoir les événements tactiles

Les deux modes envoient les événements au store global `touchSignal` :

```typescript
import { touchSignal } from '@/services/touchSignal';

function MyComponent() {
  const [isPressed, setIsPressed] = useState(false);

  useEffect(() => {
    const unsubscribe = touchSignal.subscribe((pressed) => {
      setIsPressed(pressed);
    });
    return unsubscribe;
  }, []);

  return <Text>{isPressed ? "Appuyé" : "Relâché"}</Text>;
}
```

## Pages de Connexion

### app/connect.tsx

Page d'accueil qui permet à l'utilisateur de choisir entre BLE et WiFi :

```
┌─────────────────────────────┐
│   [Modèle 3D de la sonde]   │
│     [État: Bluetooth]       │
│                             │
│  [Bluetooth]    [WiFi]      │ ← Boutons de sélection
│     (actif)                 │
│                             │
│     [Scanner]               │
│  [Passer pour l'instant]    │
│                             │
│  Périphériques détectés:    │
│  ├─ Perinea-ESP32           │
│  └─ Perinea-192             │
└─────────────────────────────┘
```

### Comportement

- **Mode par défaut:** Bluetooth BLE
- **Changement de mode:** Efface la liste des appareils découverts
- **Scan WiFi:** Teste 254 IPs par subnet (~1020 requêtes total, ~10s)
- **Affichage:** Différents messages selon le mode

## Services

### BLE (Bluetooth.ts)

```typescript
scanForPerineaDevices(onDevice, onError) // Scan BLE natif
connectPeripheral(deviceId)               // Connexion BLE
unsubscribeFromSensor()                   // Arrêter écoute
```

### WiFi (wifi.ts)

```typescript
scanForPerineaDevicesWifi(onDevice, onError) // Scan réseau local
connectPeripheralWifi(deviceId)              // Connexion WebSocket
unsubscribeFromSensorWifi()                  // Fermer WS
```

## Détails Techniques

### Scan BLE

- Utilise `react-native-ble-plx`
- Filtre : appareil nommé contenant "perinea", "périnea" ou "esp32"
- Retourne : `{ id, name, rssi }`

### Scan WiFi

- Teste les subnets courants : `192.168.1.x`, `192.168.0.x`, `192.168.100.x`, `10.0.0.x`
- Timeout par IP : 2 secondes
- Timeout global : 10 secondes
- Retourne : `{ id: "192.168.1.42", name: "Perinea-42" }`

### Notification BLE

```
ESP32 → BLE Characteristic (TOUCH_CHAR_UUID)
         ↓
react-native-ble-plx.monitorCharacteristic()
         ↓
touchSignal.isPressed = boolean
```

### Notification WiFi

```
ESP32 → WebSocket message
         ↓
{ event: "touch", pressed: true, timestamp: 123 }
         ↓
touchSignal.isPressed = boolean
```

## Types

```typescript
type ConnectionType = "ble" | "wifi";

type PeripheralDevice = {
  id: string;                          // MAC (BLE) ou IP (WiFi)
  name: string;
  rssi?: number | null;                // Signal strength (BLE)
  batteryPct?: number;
  connectionType?: ConnectionType;     // Nouveau!
};

type DeviceState = {
  state: BluetoothConnectionState;
  devices: PeripheralDevice[];
  connectedDevice: PeripheralDevice | null;
  error: string | null;
  connectionType: ConnectionType;      // Nouveau!
  stopScan?: () => void;
};
```

## Améliorations Futures

- [ ] Requêtes mDNS pour découverte WiFi (au lieu de scan d'IP brute)
- [ ] Reconnexion automatique en cas de déconnexion
- [ ] Indicateur de force du signal WiFi (latence/ping)
- [ ] Support BLE dual (connexion simultanée à plusieurs appareils)
- [ ] Mode "hybrid" : essayer BLE puis WiFi en fallback

## Configuration

### Modifier les ports/UUIDs

**Bluetooth (BLE):**
```cpp
// perinea.ino
#define SERVICE_UUID    "f3641400-00b0-4240-ba50-05ca45bf8abc"
#define TOUCH_CHAR_UUID "f3641401-00b0-4240-ba50-05ca45bf8abc"
```

```typescript
// services/device/bleUUIDs.ts
export const ESP32_SERVICE_UUID = 'f3641400-00b0-4240-ba50-05ca45bf8abc';
export const TOUCH_CHAR_UUID    = 'f3641401-00b0-4240-ba50-05ca45bf8abc';
```

**WiFi:**
```cpp
// perinea.ino
WebSocketsServer webSocket(81);  // Changer le port
```

```typescript
// services/device/WifiDeviceService.ts
const DISCOVERY_PORT = 81;  // Doit correspondre
```

## Dépannage

### L'app plante au scan WiFi

→ Augmenter `SCAN_TIMEOUT` dans `WifiDeviceService.ts`

### Les appareils WiFi n'apparaissent pas

→ Vérifier que `DISCOVERY_PORT` correspond entre ESP32 et app

### Notifications tactiles lentes en WiFi

→ Augmenter la fréquence de loop ESP32 ou réduire le délai

→ Vérifier la latence réseau avec `ping <ESP32_IP>`

### Perte de connexion en WiFi

→ Implémenter une reconnexion automatique avec exponential backoff

→ Ajouter keep-alive message (ping/pong WebSocket)
