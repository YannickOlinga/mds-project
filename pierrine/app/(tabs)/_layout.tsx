import { Tabs } from "expo-router";
import React from "react";
import { Platform, StyleSheet, View, Text } from "react-native";

export default function TabLayout() {
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
    </Tabs>
  );
}

function TabIcon({ name, color }: { name: string; color: string }) {
  const icons: { [key: string]: string } = {
    home: "🏠",
    dumbbell: "💪",
    chart: "📊",
    user: "👤",
  };

  return (
    <View style={styles.iconContainer}>
      <Text style={[styles.icon, { color }]}>{icons[name]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 4,
  },
  icon: {
    fontSize: 22,
  },
});

