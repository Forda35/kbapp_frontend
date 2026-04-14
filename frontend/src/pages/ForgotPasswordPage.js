import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Icon from "../components/Icon";
import { COLORS, SPACING, RADIUS } from "../theme";

const API_URL = require("../api").API_URL;

export default function ForgotPasswordPage({ navigation }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!email) { setError("Entrez votre adresse email"); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/users/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const data = await res.json();
      setSent(true);
    } catch {
      setError("Erreur de connexion. Réessayez.");
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={[COLORS.bgPrimary, COLORS.bgSecondary]} style={StyleSheet.absoluteFill} />
        <View style={styles.center}>
          <View style={styles.successIcon}>
            <Icon name="mail" size={48} color={COLORS.gold} />
          </View>
          <Text style={styles.successTitle}>Email envoyé !</Text>
          <Text style={styles.successText}>
            Si cet email existe, vous recevrez un lien de réinitialisation valable 1 heure.
          </Text>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.navigate("Login")}>
            <Text style={styles.backBtnText}>Retour à la connexion</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={[COLORS.bgPrimary, COLORS.bgSecondary]} style={StyleSheet.absoluteFill} />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <View style={styles.inner}>
          <TouchableOpacity style={styles.topBack} onPress={() => navigation.goBack()}>
            <Icon name="arrow-back" size={20} color={COLORS.textSecondary} />
            <Text style={styles.topBackText}>Retour</Text>
          </TouchableOpacity>

          <View style={styles.logoBox}>
            <Icon name="lock-closed" size={36} color={COLORS.gold} />
          </View>
          <Text style={styles.title}>Mot de passe oublié ?</Text>
          <Text style={styles.subtitle}>
            Entrez votre email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
          </Text>

          <View style={styles.inputRow}>
            <Icon name="mail" size={18} color={COLORS.textMuted} />
            <TextInput
              style={styles.input}
              placeholder="votre@email.com"
              placeholderTextColor={COLORS.textMuted}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          {error ? (
            <View style={styles.errorBox}>
              <Icon name="warning" size={16} color={COLORS.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={loading}>
            <LinearGradient colors={[COLORS.royalBlue, COLORS.royalBlueLight]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.submitBtnGrad}>
              {loading ? <ActivityIndicator color={COLORS.gold} /> : <Text style={styles.submitBtnText}>Envoyer le lien</Text>}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgPrimary },
  inner: { flex: 1, padding: SPACING.lg, paddingTop: 60 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: SPACING.lg },
  topBack: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 40 },
  topBackText: { color: COLORS.textSecondary, fontSize: 15 },
  logoBox: { width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.royalBlue + "44", borderWidth: 2, borderColor: COLORS.gold, justifyContent: "center", alignItems: "center", marginBottom: 24 },
  title: { color: COLORS.textPrimary, fontSize: 24, fontWeight: "900", marginBottom: 10 },
  subtitle: { color: COLORS.textSecondary, fontSize: 14, lineHeight: 22, marginBottom: 30 },
  inputRow: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "#0d1535", borderWidth: 1.5, borderColor: COLORS.border, borderRadius: RADIUS.md, paddingHorizontal: 14, marginBottom: 16 },
  input: { flex: 1, color: COLORS.textPrimary, fontSize: 16, paddingVertical: 14 },
  errorBox: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#1a0a0a", borderWidth: 1, borderColor: COLORS.error, borderRadius: RADIUS.md, padding: 12, marginBottom: 16 },
  errorText: { color: COLORS.error, fontSize: 14, flex: 1 },
  submitBtn: { borderRadius: RADIUS.md, overflow: "hidden" },
  submitBtnGrad: { paddingVertical: 16, alignItems: "center", borderWidth: 1.5, borderColor: COLORS.gold + "60", borderRadius: RADIUS.md },
  submitBtnText: { color: COLORS.gold, fontSize: 16, fontWeight: "800" },
  successIcon: { width: 100, height: 100, borderRadius: 50, backgroundColor: COLORS.bgCard, borderWidth: 2, borderColor: COLORS.gold, justifyContent: "center", alignItems: "center", marginBottom: 24 },
  successTitle: { color: COLORS.gold, fontSize: 24, fontWeight: "900", marginBottom: 14, textAlign: "center" },
  successText: { color: COLORS.textSecondary, fontSize: 14, textAlign: "center", lineHeight: 22, marginBottom: 30 },
  backBtn: { backgroundColor: COLORS.royalBlue, borderRadius: RADIUS.md, paddingVertical: 14, paddingHorizontal: 30, borderWidth: 1.5, borderColor: COLORS.gold + "60" },
  backBtnText: { color: COLORS.gold, fontWeight: "800", fontSize: 15 },
});