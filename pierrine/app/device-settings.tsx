import { View, Text, StyleSheet } from 'react-native';

export default function DeviceSettings() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Paramètres Appareil</Text>
      <Text>Configuration sonde Périnea coming soon...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9EDEE',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#6A1E3A',
    marginBottom: 16,
  },
});

