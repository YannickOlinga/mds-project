/**
 * SignalBars — petite jauge de signal (4 barres) à partir du RSSI BLE.
 * RSSI null (cas WiFi) → affiché comme plein (réseau local).
 */
import { View, StyleSheet } from 'react-native';
import { colors } from '@/constants/theme/colors';

type Props = {
  rssi?: number | null;
  activeColor?: string;
};

function rssiToLevel(rssi?: number | null): number {
  if (rssi == null) return 4;        // WiFi / inconnu → plein
  if (rssi >= -55) return 4;
  if (rssi >= -67) return 3;
  if (rssi >= -78) return 2;
  return 1;
}

export default function SignalBars({ rssi, activeColor = colors.success }: Props) {
  const level = rssiToLevel(rssi);
  const heights = [7, 11, 15, 19];

  return (
    <View style={styles.row}>
      {heights.map((h, i) => (
        <View
          key={i}
          style={[
            styles.bar,
            { height: h, backgroundColor: i < level ? activeColor : colors.border },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: 3, height: 20 },
  bar: { width: 4, borderRadius: 2 },
});
