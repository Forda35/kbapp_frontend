import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import NetInfo from "@react-native-community/netinfo";
import { COLORS } from "../theme";

export default function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(false);
  const slideAnim = new Animated.Value(-50);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const offline = !state.isConnected;
      setIsOffline(offline);
      Animated.timing(slideAnim, {
        toValue: offline ? 0 : -50,
        duration: 300,
        useNativeDriver: true,
      }).start();
    });
    return () => unsubscribe();
  }, []);

  if (!isOffline) return null;

  return (
    <Animated.View
      style={[styles.banner, { transform: [{ translateY: slideAnim }] }]}
    >
      <Text style={styles.icon}>📵</Text>
      <Text style={styles.text}>
        Mode hors-ligne — Données mises en cache affichées
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: "#1a1a0a",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.warning,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  icon: { fontSize: 16 },
  text: { color: COLORS.warning, fontSize: 12, fontWeight: "600", flex: 1 },
});
