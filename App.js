import React, { useState, useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated, StatusBar, AppRegistry } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider, useAuth } from "./src/context/AuthContext";
import { Image } from "react-native";

import LoginPage from "./src/pages/LoginPage";
import RegisterPage from "./src/pages/RegisterPage";
import MainTabs from "./src/pages/MainTabs";
import ForgotPasswordPage from "./src/pages/ForgotPasswordPage";
import TermsPage from "./src/pages/TermsPage";

const COLORS = {
  bgPrimary: "#060914",
  bgSecondary: "#0d1124",
  gold: "#FFD700",
  royalBlue: "#1E3A8A",
  textSecondary: "#9CA3AF",
};

const Stack = createStackNavigator();

// ── Splash ──────────────────────────────────────────────────
function SplashScreen({ onFinish }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.7)).current;
  const goldAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1, tension: 80, friction: 7, useNativeDriver: true }),
      ]),
      Animated.timing(goldAnim, { toValue: 1, duration: 500, delay: 200, useNativeDriver: true }),
      Animated.delay(1200),
      Animated.timing(fadeAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start(() => onFinish());
  }, []);

  return (
    <View style={styles.splash}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bgPrimary} />
      <Animated.View style={[styles.splashContent, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
        <View style={styles.logoContainer}>
  <Image
    source={require("./assets/logo.png")}
    style={{ width: 80, height: 80, borderRadius: 20 }}
    resizeMode="contain"
  />
</View>
        <Animated.View style={{ opacity: goldAnim }}>
          <Text style={styles.splashTitle}>KB Events</Text>
          <Text style={styles.splashTagline}>Votre billetterie premium</Text>
        </Animated.View>
      </Animated.View>
      <View style={styles.shimmer1} />
      <View style={styles.shimmer2} />
    </View>
  );
}

// ── Navigator ────────────────────────────────────────────────
function AppNavigator() {
  const { token, loading } = useAuth();
  if (loading) return null;

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!token ? (
        // Pages non connecté
        <>
          <Stack.Screen name="Login" component={LoginPage} />
          <Stack.Screen name="Register" component={RegisterPage} />
          <Stack.Screen name="ForgotPassword" component={ForgotPasswordPage} />
          <Stack.Screen name="Terms" component={TermsPage} />
        </>
      ) : (
        // Pages connecté
        <>
        <Stack.Screen name="Main" component={MainTabs} />
        <Stack.Screen name="Terms" component={TermsPage} />
        </>
      )}
    </Stack.Navigator>
  );
}

// ── Root ─────────────────────────────────────────────────────
function App() {
  const [showSplash, setShowSplash] = useState(true);

  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NavigationContainer>
          <StatusBar barStyle="light-content" backgroundColor={COLORS.bgPrimary} />
          <AppNavigator />
        </NavigationContainer>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

AppRegistry.registerComponent("main", () => App);
export default App;

const styles = StyleSheet.create({
  splash: {
    flex: 1, backgroundColor: COLORS.bgPrimary,
    justifyContent: "center", alignItems: "center", overflow: "hidden",
  },
  splashContent: { alignItems: "center", zIndex: 10 },
  logoContainer: {
    width: 110, height: 110, borderRadius: 30,
    backgroundColor: COLORS.royalBlue,
    borderWidth: 3, borderColor: COLORS.gold,
    justifyContent: "center", alignItems: "center", marginBottom: 24,
    shadowColor: COLORS.gold, shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6, shadowRadius: 20, elevation: 20,
  },
  logoText: { color: COLORS.gold, fontSize: 42, fontWeight: "900" },
  splashTitle: {
    color: COLORS.gold, fontSize: 36, fontWeight: "900",
    letterSpacing: 4, textAlign: "center", marginBottom: 8,
  },
  splashTagline: { color: COLORS.textSecondary, fontSize: 15, textAlign: "center" },
  shimmer1: {
    position: "absolute", top: "20%", left: -60,
    width: 200, height: 200, borderRadius: 100,
    backgroundColor: COLORS.royalBlue, opacity: 0.08,
  },
  shimmer2: {
    position: "absolute", bottom: "15%", right: -80,
    width: 280, height: 280, borderRadius: 140,
    backgroundColor: COLORS.gold, opacity: 0.05,
  },
});