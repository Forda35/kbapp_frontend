import React from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { COLORS, RADIUS } from "../theme";

export default function GoldButton({
  label,
  onPress,
  loading = false,
  disabled = false,
  variant = "primary", // "primary" | "outline" | "danger"
  icon,
  style,
}) {
  const isOutline = variant === "outline";
  const isDanger = variant === "danger";

  if (isOutline) {
    return (
      <TouchableOpacity
        style={[styles.outline, style]}
        onPress={onPress}
        disabled={disabled || loading}
        activeOpacity={0.75}
      >
        {loading ? (
          <ActivityIndicator color={COLORS.gold} size="small" />
        ) : (
          <Text style={styles.outlineText}>
            {icon ? `${icon}  ` : ""}
            {label}
          </Text>
        )}
      </TouchableOpacity>
    );
  }

  if (isDanger) {
    return (
      <TouchableOpacity
        style={[styles.danger, style]}
        onPress={onPress}
        disabled={disabled || loading}
        activeOpacity={0.75}
      >
        {loading ? (
          <ActivityIndicator color={COLORS.error} size="small" />
        ) : (
          <Text style={styles.dangerText}>
            {icon ? `${icon}  ` : ""}
            {label}
          </Text>
        )}
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[styles.wrapper, (disabled || loading) && styles.disabled, style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.85}
    >
      <LinearGradient
        colors={
          disabled || loading
            ? [COLORS.bgCard, COLORS.bgCard]
            : [COLORS.royalBlue, COLORS.royalBlueLight]
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.gradient}
      >
        {loading ? (
          <ActivityIndicator color={COLORS.gold} size="small" />
        ) : (
          <Text style={[styles.text, disabled && styles.textDisabled]}>
            {icon ? `${icon}  ` : ""}
            {label}
          </Text>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: RADIUS.md,
    overflow: "hidden",
  },
  gradient: {
    paddingVertical: 15,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.gold + "55",
  },
  text: {
    color: COLORS.gold,
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  textDisabled: { color: COLORS.textMuted },
  disabled: { opacity: 0.5 },
  outline: {
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingVertical: 14,
    alignItems: "center",
  },
  outlineText: { color: COLORS.textSecondary, fontSize: 15, fontWeight: "600" },
  danger: {
    borderWidth: 1.5,
    borderColor: COLORS.error + "66",
    borderRadius: RADIUS.md,
    paddingVertical: 14,
    alignItems: "center",
    backgroundColor: COLORS.error + "15",
  },
  dangerText: { color: COLORS.error, fontSize: 15, fontWeight: "700" },
});
