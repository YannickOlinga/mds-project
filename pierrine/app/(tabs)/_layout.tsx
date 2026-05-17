import React from "react";
import { Platform, StyleSheet, View, Text, ActivityIndicator } from "react-native";
import Ionicons from '@expo/vector-icons/Ionicons';
import { Redirect, Tabs } from "expo-router";
import useAuthStore from "@/store/authStore";

export default function TabLayout() {
  const auth = useAuthStore();
  
if (auth.loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6A1E3A" />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }
  
  if (!auth.isAuthenticated) {
    return <Redirect href="/login" />;
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#6A1E3A",
        tabBarInactiveTintColor: "#B9657C",
        tabBarStyle: {
          backgroundColor: "#FFF5F5",
          borderTopWidth: 1,
          borderTopColor: "#EAD7DA",
          height: Platform.OS === "ios" ? 88 : 68,
          paddingBottom: Platform.OS === "ios" ? 28 : 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Accueil",
          tabBarIcon: ({ color }) => <TabIcon name="home" color={color} />,
        }}
      />
      <Tabs.Screen
        name="training"
        options={{
          title: "Entraînement",
          tabBarIcon: ({ color }) => <TabIcon name="dumbbell" color={color} />,
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: "Progrès",
          tabBarIcon: ({ color }) => <TabIcon name="chart" color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profil",
          tabBarIcon: ({ color }) => <TabIcon name="user" color={color} />,
        }}
      />
      <Tabs.Screen
        name="challenges"
        options={{
          title: "Challenges",
          tabBarIcon: ({ color }) => <TabIcon name="trophy" color={color} />,
        }}
      />
    </Tabs>
  );
}

function TabIcon({ name, color }: { name: string; color: string }) {
  const icons: { [key: string]: string } = {
    home: "home-outline",
    dumbbell: "barbell-outline",
    chart: "trending-up-outline",
    user: "person-outline",
    trophy: "trophy-outline",
  };

  return (
    <Ionicons name={icons[name] as any} size={24} color={color} />
  );
}

const styles = StyleSheet.create({
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#F5ECEC',
      gap: 16,
      padding: 32,
    },
    loadingText: {
      fontSize: 18,
      color: '#6A1E3A',
      fontWeight: '600',
    },
    redirectText: {
      fontSize: 16,
      color: '#6A1E3A',
      fontWeight: '600',
    },
  });
