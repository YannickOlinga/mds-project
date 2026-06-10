/**
 * InputModeSelector — laisse le joueur choisir comment piloter les jeux :
 *   • Sonde IoT (ESP32, signal BLE/WiFi)
 *   • Écran tactile du téléphone
 * La sélection est stockée dans le deviceStore (inputMode).
 */
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Smartphone, Activity } from 'lucide-react-native';

import { useDeviceStore } from '@/store/deviceStore';

export default function InputModeSelector() {
  const inputMode = useDeviceStore((s) => s.inputMode);
  const setInputMode = useDeviceStore((s) => s.setInputMode);
  const connectedDevice = useDeviceStore((s) => s.connectedDevice);

  const isConnected = connectedDevice !== null;

  return (
    <View style={s.wrapper}>
      <Text style={s.label}>Comment veux-tu jouer ?</Text>

      <View style={s.row}>
        {/* Écran tactile */}
        <Pressable
          style={[s.option, inputMode === 'phone' && s.optionActive]}
          onPress={() => setInputMode('phone')}
        >
          <Smartphone
            size={26}
            color={inputMode === 'phone' ? '#571534' : 'rgba(255,255,255,0.85)'}
          />
          <Text style={[s.optionTitle, inputMode === 'phone' && s.optionTitleActive]}>
            Écran tactile
          </Text>
          <Text style={[s.optionSub, inputMode === 'phone' && s.optionSubActive]}>
            Appuie sur l'écran
          </Text>
        </Pressable>

        {/* Sonde IoT */}
        <Pressable
          style={[s.option, inputMode === 'iot' && s.optionActive]}
          onPress={() => setInputMode('iot')}
        >
          <View style={s.iconRow}>
            <Activity
              size={26}
              color={inputMode === 'iot' ? '#571534' : 'rgba(255,255,255,0.85)'}
            />
            <View style={[s.dot, { backgroundColor: isConnected ? '#37D67A' : '#E0556B' }]} />
          </View>
          <Text style={[s.optionTitle, inputMode === 'iot' && s.optionTitleActive]}>
            Sonde IoT
          </Text>
          <Text style={[s.optionSub, inputMode === 'iot' && s.optionSubActive]}>
            {isConnected ? 'Connectée' : 'Non connectée'}
          </Text>
        </Pressable>
      </View>

      {/* Aide si IoT choisi mais sonde absente */}
      {inputMode === 'iot' && !isConnected && (
        <Pressable style={s.connectHint} onPress={() => router.push('/connect' as never)}>
          <Text style={s.connectHintText}>
            ⚠️ Aucune sonde connectée — appuie ici pour la connecter
          </Text>
        </Pressable>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  wrapper: { paddingHorizontal: 20, marginBottom: 6 },
  label: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '700',
    marginBottom: 10,
    textAlign: 'center',
  },
  row: { flexDirection: 'row', gap: 12 },
  option: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: 'center',
    gap: 4,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionActive: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderColor: '#FFD700',
  },
  iconRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 9, height: 9, borderRadius: 999 },
  optionTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: 'white',
    marginTop: 4,
  },
  optionTitleActive: { color: '#571534' },
  optionSub: { fontSize: 11, color: 'rgba(255,255,255,0.6)' },
  optionSubActive: { color: '#9B2855' },
  connectHint: {
    marginTop: 10,
    backgroundColor: 'rgba(224,85,107,0.2)',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  connectHintText: {
    fontSize: 12,
    color: '#FFD7DD',
    textAlign: 'center',
    fontWeight: '600',
  },
});
