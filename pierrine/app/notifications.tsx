import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  ScrollView,
  Pressable,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

const NotificationsScreen = () => {
  const [globalEnabled, setGlobalEnabled] = useState(true);
  const [time, setTime] = useState('09:00');
  const [days, setDays] = useState(['Lun', 'Mar', 'Mer', 'Jeu', 'Ven']);

  const toggles = {
    trainingReminders: true,
    motivation: true,
    updates: false,
    social: true,
  };

  const toggle = (key: keyof typeof toggles) => {
    // persist
    console.log(`Toggle ${key}`);
  };

  const dayList = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

  const timeSlots = ['09:00', '12:00', '18:00', '20:00'];

  return (
    <ScrollView style={styles.container}>
      {/* Global Toggle */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notifications globales</Text>
        <View style={styles.globalRow}>
          <Text style={styles.globalTitle}>Notifications activées</Text>
          <Switch value={globalEnabled} onValueChange={setGlobalEnabled} />
        </View>
      </View>

      {/* Time Selector */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Heure de rappel</Text>
        <View style={styles.timeButtons}>
          {timeSlots.map((t) => (
            <Pressable
              key={t}
              style={[
                styles.timeButton,
                time === t && styles.timeButtonActive
              ]}
              onPress={() => setTime(t)}
            >
              <Text
                style={[
                  styles.timeButtonText,
                  time === t && styles.timeButtonTextActive
                ]}
              >
                {t}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Day Selector */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Jours</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dayScroll}>
          {dayList.map((day) => (
            <Pressable
              key={day}
              style={[
                styles.dayChip,
                days.includes(day) && styles.dayChipActive,
              ]}
              onPress={() => {
                if (days.includes(day)) {
                  setDays(days.filter((d) => d !== day));
                } else {
                  setDays([...days, day]);
                }
              }}
            >
              <Text
                style={[
                  styles.dayText,
                  days.includes(day) && styles.dayTextActive,
                ]}
              >
                {day}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* Category Toggles */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Catégories</Text>
        <View style={styles.toggleCard}>
          <Pressable style={styles.toggleRow}>
            <Ionicons name="time-outline" size={24} color="#6A1E3A" />
            <Text style={styles.toggleTitle}>Rappels entraînement</Text>
            <Switch value={toggles.trainingReminders as any} onValueChange={() => toggle('trainingReminders')} />
          </Pressable>
          <Pressable style={styles.toggleRow}>
            <Ionicons name="sparkles-outline" size={24} color="#6A1E3A" />
            <Text style={styles.toggleTitle}>Motivation</Text>
            <Switch value={toggles.motivation as any} onValueChange={() => toggle('motivation')} />
          </Pressable>
          <Pressable style={styles.toggleRow}>
            <Ionicons name="download-outline" size={24} color="#6A1E3A" />
            <Text style={styles.toggleTitle}>Mises à jour</Text>
            <Switch value={toggles.updates as any} onValueChange={() => toggle('updates')} />
          </Pressable>
          <Pressable style={styles.toggleRow}>
            <Ionicons name="people-outline" size={24} color="#6A1E3A" />
            <Text style={styles.toggleTitle}>Social</Text>
            <Switch value={toggles.social as any} onValueChange={() => toggle('social')} />
          </Pressable>
        </View>
      </View>

      {/* Preview Card */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Aperçu</Text>
        <View style={styles.previewCard}>
          <View style={styles.previewHeader}>
            <Ionicons name="notifications-outline" size={20} color="#9B5C6C" />
            <Text style={styles.previewTime}>{"Aujourd'hui 09:00"}</Text>
          </View>
          <Text style={styles.previewTitle}>Rappel entraînement</Text>
          <Text style={styles.previewBody}>{"N'oubliez pas votre séance quotidienne !"}</Text>
        </View>
      </View>

      <View style={{ height: 100 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5ECEC',
  },
  section: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#5A1A30',
    marginBottom: 16,
  },
  globalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  globalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#5A1A30',
  },
  timeButtons: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    padding: 4,
    gap: 4,
  },
  timeButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: 'rgba(234, 215, 218, 0.5)',
    alignItems: 'center',
  },
  timeButtonActive: {
    backgroundColor: '#B9657C',
  },
  timeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6A1E3A',
  },
  timeButtonTextActive: {
    color: 'white',
  },
  dayScroll: {
    flexDirection: 'row',
  },
  dayChip: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#EAD7DA',
    backgroundColor: 'white',
  },
  dayChipActive: {
    borderColor: '#B9657C',
    backgroundColor: '#FFF5F5',
  },
  dayText: {
    fontWeight: '600',
    color: '#8A5A65',
  },
  dayTextActive: {
    color: '#B9657C',
    fontWeight: '700',
  },
  toggleCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#EAD7DA',
  },
  toggleTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#5A1A30',
    marginLeft: 16,
  },
  previewCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  previewTime: {
    fontSize: 12,
    color: '#9B5C6C',
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#5A1A30',
    marginBottom: 4,
  },
  previewBody: {
    fontSize: 14,
    color: '#8A5A65',
    lineHeight: 20,
  },
});

export default NotificationsScreen;
