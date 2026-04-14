import React from "react";
import { View, Text, StyleSheet, Platform } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import Icon from "../components/Icon";
import { useAuth } from "../context/AuthContext";
import { COLORS, RADIUS } from "../theme";

import EventsPage from "./EventsPage";
import MyTicketsPage from "./MyTicketsPage";
import AccountPage from "./AccountPage";
import AdminDashboardPage from "./AdminDashboardPage";
import CreateEventPage from "./CreateEventPage";

const Tab = createBottomTabNavigator();

const TabIcon = ({ name, label, focused }) => (
  <View style={[styles.tabItem, focused && styles.tabItemFocused]}>
    <Icon name={name} size={22} color={focused ? COLORS.gold : COLORS.textMuted} />
    <Text style={[styles.tabLabel, focused && styles.tabLabelFocused]}>{label}</Text>
    {focused && <View style={styles.tabDot} />}
  </View>
);

export default function MainTabs() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: false,
      }}
    >
      <Tab.Screen
        name="Events"
        component={EventsPage}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon name="calendar" label="Événements" focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Tickets"
        component={MyTicketsPage}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon name="ticket" label="Mes billets" focused={focused} />
          ),
        }}
      />
      {isAdmin && (
        <Tab.Screen
          name="CreateEvent"
          component={CreateEventPage}
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon name="add-circle" label="Créer" focused={focused} />
            ),
          }}
        />
      )}
      {isAdmin && (
        <Tab.Screen
          name="Dashboard"
          component={AdminDashboardPage}
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon name="bar-chart" label="Dashboard" focused={focused} />
            ),
          }}
        />
      )}
      <Tab.Screen
        name="Account"
        component={AccountPage}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon name="person" label="Compte" focused={focused} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: COLORS.bgCard,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    height: Platform.OS === "ios" ? 85 : 68,
    paddingBottom: Platform.OS === "ios" ? 20 : 8,
    paddingTop: 8,
    elevation: 20,
    shadowColor: COLORS.royalBlue,
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  tabItem: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
    position: "relative",
  },
  tabItemFocused: {},
  tabLabel: { fontSize: 10, color: COLORS.textMuted, fontWeight: "500", marginTop: 2 },
  tabLabelFocused: { color: COLORS.gold, fontWeight: "700" },
  tabDot: {
    position: "absolute",
    bottom: -8,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.gold,
  },
});
