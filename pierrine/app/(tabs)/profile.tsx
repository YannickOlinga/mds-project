import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Switch,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as SecureStore from 'expo-secure-store';

interface Stats {
  sessions: number;
  xp: number;
  level: number;
  streak: number;
}

interface Settings {
  sound: boolean;
  voice: boolean;
  vibration: boolean;
  biometric: boolean;
}

interface UserData {
  name: string;
  program: string;
  stats: Stats;
}

const STORAGE_KEYS = {
  accessToken: 'accessToken',
  refreshToken: 'refreshToken',
  settings: 'userSettings',
  userData: 'userData',
} as const;

const DEFAULT_SETTINGS: Settings = {
  sound: true,
  voice: true,
  vibration: true,
  biometric: false,
};

export default function ProfileScreen() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // ✅ initials safe
  const initials = useMemo(() => {
    if (!userData?.name) return '';
    const parts = userData.name.trim().split(' ');
    return parts[0]?.[0] + (parts[1]?.[0] || '');
  }, [userData?.name]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      const accessToken = await SecureStore.getItemAsync(STORAGE_KEYS.accessToken);

      if (!accessToken) {
        router.replace('/login');
        return;
      }

      // ✅ settings safe parse
      const settingsString = await SecureStore.getItemAsync(STORAGE_KEYS.settings);
      if (settingsString) {
        try {
          const parsed = JSON.parse(settingsString);
          setSettings({ ...DEFAULT_SETTINGS, ...parsed });
        } catch {
          setSettings(DEFAULT_SETTINGS);
        }
      }

      // ✅ user data safe parse
      const userDataString = await SecureStore.getItemAsync(STORAGE_KEYS.userData);
      if (userDataString) {
        try {
          setUserData(JSON.parse(userDataString));
        } catch {
          setUserData(null);
        }
      } else {
        setUserData({
          name: 'Marie D.',
          program: 'Programme Débutant',
          stats: { sessions: 23, xp: 150, level: 3, streak: 7 },
        });
      }

    } catch (error) {
      console.error('Load error:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // ✅ FIX IMPORTANT : éviter bug toggle
  const saveSetting = useCallback(async (key: keyof Settings, value: boolean) => {
    const previous = settings;

    try {
      setSaving(true);

      const updated = { ...settings, [key]: value };
      setSettings(updated);

      await SecureStore.setItemAsync(
        STORAGE_KEYS.settings,
        JSON.stringify(updated)
      );
    } catch (error) {
      console.error('Save error:', error);
      setSettings(previous); // rollback fiable
    } finally {
      setSaving(false);
    }
  }, [settings]);

  const handleLogout = useCallback(async () => {
    try {
      setSaving(true);

      await Promise.all([
        SecureStore.deleteItemAsync(STORAGE_KEYS.accessToken),
        SecureStore.deleteItemAsync(STORAGE_KEYS.refreshToken),
        SecureStore.deleteItemAsync(STORAGE_KEYS.settings),
        SecureStore.deleteItemAsync(STORAGE_KEYS.userData),
      ]);

      router.replace('/login');
    } catch (error) {
      console.error('Logout error:', error);
      Alert.alert('Erreur', 'Déconnexion échouée');
    } finally {
      setSaving(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#6A1E3A" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.initials}>{initials}</Text>
        </View>
        <Text style={styles.name}>{userData?.name || 'Utilisateur'}</Text>
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <Stat label="Sessions" value={userData?.stats.sessions} />
        <Stat label="XP" value={userData?.stats.xp} />
        <Stat label="Niveau" value={`Lv ${userData?.stats.level}`} />
        <Stat label="Streak" value={userData?.stats.streak} />
      </View>

      {/* Program */}
      {userData?.program && (
        <Pressable style={styles.programCard} onPress={() => router.push('/training')}>
          <LinearGradient colors={['#C75C7A', '#8B1E3F']} style={styles.gradient}>
            <View style={styles.programContent}>
              <Ionicons name="ribbon" size={28} color="white" />
              <View>
                <Text style={styles.programTitle}>{userData.program}</Text>
                <Text style={styles.programSubtitle}>8/12 séances complétées</Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color="white" />
            </View>
          </LinearGradient>
        </Pressable>
      )}

      {/* Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Paramètres</Text>
        <View style={styles.settingCard}>
          {renderSetting('Son', 'volume-high', settings.sound, v => saveSetting('sound', v), saving)}
          {renderSetting('Guidance vocale', 'mic', settings.voice, v => saveSetting('voice', v), saving)}
          {renderSetting('Vibrations', 'notifications', settings.vibration, v => saveSetting('vibration', v), saving)}
          {renderSetting('Biométrie', 'finger-print', settings.biometric, v => saveSetting('biometric', v), saving)}
        </View>
      </View>

      {/* Navigation */}
      <View style={styles.section}>
        <NavRow title="Paramètres appareil" icon="settings-outline" onPress={() => router.push('/device-settings')} />
        <NavRow title="Notifications" icon="notifications-outline" onPress={() => router.push('/notifications')} />
      </View>

      {/* Logout */}
      <Pressable
        style={[styles.logoutButton, saving && styles.disabled]}
        onPress={handleLogout}
        disabled={saving}
      >
        <Ionicons name="log-out-outline" size={24} color="#9B5C6C" />
        <Text style={styles.logoutText}>Se déconnecter</Text>
        {saving && <ActivityIndicator size="small" />}
      </Pressable>

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

// ✅ composants propres

function Stat({ label, value }: any) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statNumber}>{value || 0}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function NavRow({ title, icon, onPress }: any) {
  return (
    <Pressable style={styles.navRow} onPress={onPress}>
      <Ionicons name={icon} size={24} color="#6A1E3A" />
      <Text style={styles.navTitle}>{title}</Text>
      <Ionicons name="chevron-forward" size={20} color="#9B5C6C" />
    </Pressable>
  );
}

function renderSetting(label: string, icon: any, value: boolean, onChange: (v: boolean) => void, disabled: boolean) {
  return (
    <View style={styles.settingRow}>
      <View style={styles.settingLeft}>
        <Ionicons name={icon} size={24} color="#6A1E3A" />
        <Text style={styles.settingTitle}>{label}</Text>
      </View>
      <Switch value={value} onValueChange={onChange} disabled={disabled} />
    </View>
  );
}

// styles = identiques (tu peux garder les tiens)
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5ECEC' },
  center: { justifyContent: 'center', alignItems: 'center' },
  header: { paddingTop: 60, paddingBottom: 32, alignItems: 'center' },
  avatar: {
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: '#6A1E3A',
    justifyContent: 'center', alignItems: 'center',
  },
  initials: { fontSize: 36, color: 'white', fontWeight: '800' },
  name: { fontSize: 24, fontWeight: '800', color: '#5A1A30' },

  statsContainer: { flexDirection: 'row', padding: 24, gap: 12 },
  statCard: { flex: 1, backgroundColor: 'white', padding: 16, borderRadius: 16, alignItems: 'center' },
  statNumber: { fontSize: 22, fontWeight: '800' },
  statLabel: { fontSize: 12 },

  programCard: { margin: 24, borderRadius: 20, overflow: 'hidden' },
  gradient: { padding: 20 },
  programContent: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  programTitle: { color: 'white', fontWeight: '700' },
  programSubtitle: { color: 'rgba(255,255,255,0.7)' },

  section: { paddingHorizontal: 24, marginBottom: 24 },
  sectionTitle: { fontWeight: '700', marginBottom: 12 },

  settingCard: { backgroundColor: 'white', borderRadius: 16 },
  settingRow: { flexDirection: 'row', padding: 16, alignItems: 'center' },
  settingLeft: { flexDirection: 'row', gap: 12, flex: 1 },
  settingTitle: { fontWeight: '600' },

  navRow: { flexDirection: 'row', padding: 16, backgroundColor: 'white', marginBottom: 8 },
  navTitle: { flex: 1 },

  logoutButton: { flexDirection: 'row', padding: 16, margin: 24, backgroundColor: 'white' },
  logoutText: { flex: 1, textAlign: 'center' },
  disabled: { opacity: 0.5 },
});