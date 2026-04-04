import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StatusBar,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Icon from "../components/Icon";
import { useAuth } from "../context/AuthContext";
import { loginUser } from "../api";
import { COLORS, SPACING, RADIUS } from "../theme";
import { Image } from "react-native";

export default function LoginPage({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const { login } = useAuth();

  const handleLogin = async () => {
    setError("");
    if (!email || !password) { setError("Veuillez remplir tous les champs"); return; }
    setLoading(true);
    try {
      const data = await loginUser(email.trim().toLowerCase(), password);
      if (data.token) {
        await login(data.token);
      } else {
        setError(data.message || "Identifiants incorrects");
      }
    } catch {
      setError("Erreur de connexion. Vérifiez votre internet.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={[COLORS.bgPrimary, COLORS.bgSecondary, "#0d1535"]} style={StyleSheet.absoluteFill} />
      <View style={styles.topDecor} />
      <View style={styles.topDecor2} />

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          {/* Logo */}
          <View style={styles.logoArea}>
            <View style={styles.logoBox}>
  <Image
    source={require("../../assets/logo.png")}
    style={{ width: 54, height: 54, borderRadius: 12 }}
    resizeMode="contain"
  />
</View>
            <Text style={styles.appName}>KBApp</Text>
            <Text style={styles.appSub}>Billetterie Premium</Text>
          </View>

          {/* Formulaire */}
          <View style={styles.card}>
            <Text style={styles.title}>Connexion</Text>
            <Text style={styles.subtitle}>Bienvenue ! Connectez-vous à votre compte.</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Adresse email</Text>
              <View style={styles.inputRow}>
                <Icon name="mail" size={18} color={COLORS.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="votre@email.com"
                  placeholderTextColor={COLORS.textMuted}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Mot de passe</Text>
              <View style={styles.inputRow}>
                <Icon name="lock-closed" size={18} color={COLORS.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder="••••••••"
                  placeholderTextColor={COLORS.textMuted}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPass}
                />
                <TouchableOpacity onPress={() => setShowPass(!showPass)} style={styles.eyeBtn}>
                  <Icon name={showPass ? "eye-off" : "eye"} size={20} color={COLORS.textMuted} />
                </TouchableOpacity>
              </View>
            </View>

            {error ? (
              <View style={styles.errorBox}>
                <Icon name="warning" size={16} color={COLORS.error} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <TouchableOpacity style={styles.loginBtn} onPress={handleLogin} disabled={loading} activeOpacity={0.85}>
              <LinearGradient colors={[COLORS.royalBlue, COLORS.royalBlueLight]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.loginBtnGrad}>
                {loading ? <ActivityIndicator color={COLORS.gold} /> : <Text style={styles.loginBtnText}>Se connecter</Text>}
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity
  style={{ alignItems: "center", marginTop: 12 }}
  onPress={() => navigation.navigate("ForgotPassword")}
>
  <Text style={{ color: COLORS.textSecondary, fontSize: 14 }}>
    Mot de passe oublié ?{" "}
    <Text style={{ color: COLORS.gold, fontWeight: "700" }}>Réinitialiser</Text>
  </Text>
</TouchableOpacity>
          </View>

          <View style={styles.registerRow}>
            <Text style={styles.registerText}>Vous n'avez pas encore de compte ? </Text>
            <TouchableOpacity onPress={() => navigation.navigate("Register")}>
              <Text style={styles.registerLink}>Créer un compte.</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgPrimary },
  topDecor: { position: "absolute", top: -80, right: -60, width: 260, height: 260, borderRadius: 130, backgroundColor: COLORS.royalBlue, opacity: 0.12 },
  topDecor2: { position: "absolute", top: 40, left: -80, width: 180, height: 180, borderRadius: 90, backgroundColor: COLORS.gold, opacity: 0.06 },
  scroll: { flexGrow: 1, paddingHorizontal: SPACING.lg, paddingTop: 60, paddingBottom: 40 },
  logoArea: { alignItems: "center", marginBottom: 36 },
  logoBox: {
    width: 80, height: 80, borderRadius: 22,
    backgroundColor: COLORS.royalBlue, borderWidth: 2.5, borderColor: COLORS.gold,
    justifyContent: "center", alignItems: "center", marginBottom: 14,
    shadowColor: COLORS.gold, shadowOpacity: 0.4, shadowRadius: 12, elevation: 12,
  },
  logoText: { color: COLORS.gold, fontSize: 30, fontWeight: "900" },
  appName: { color: COLORS.gold, fontSize: 26, fontWeight: "900", letterSpacing: 3 },
  appSub: { color: COLORS.textSecondary, fontSize: 13, marginTop: 4, letterSpacing: 1 },
  card: {
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.xl,
    borderWidth: 1, borderColor: COLORS.border, padding: SPACING.lg, marginBottom: 24,
  },
  title: { color: COLORS.textPrimary, fontSize: 24, fontWeight: "800", marginBottom: 6 },
  subtitle: { color: COLORS.textSecondary, fontSize: 14, marginBottom: 24, lineHeight: 20 },
  inputGroup: { marginBottom: 18 },
  label: {
    color: COLORS.textSecondary, fontSize: 13, fontWeight: "600",
    marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.8,
  },
  inputRow: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#0d1535", borderWidth: 1.5,
    borderColor: COLORS.border, borderRadius: RADIUS.md,
    paddingHorizontal: 14,
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, color: COLORS.textPrimary, fontSize: 16, paddingVertical: 14 },
  eyeBtn: { padding: 4 },
  errorBox: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "#1a0a0a", borderWidth: 1,
    borderColor: COLORS.error, borderRadius: RADIUS.md,
    padding: 12, marginBottom: 16,
  },
  errorText: { color: COLORS.error, fontSize: 14, flex: 1 },
  loginBtn: { borderRadius: RADIUS.md, overflow: "hidden", marginTop: 4 },
  loginBtnGrad: {
    paddingVertical: 16, alignItems: "center", borderRadius: RADIUS.md,
    borderWidth: 1.5, borderColor: COLORS.gold + "60",
  },
  loginBtnText: { color: COLORS.gold, fontSize: 16, fontWeight: "800", letterSpacing: 1 },
  registerRow: { flexDirection: "row", justifyContent: "center", flexWrap: "wrap", marginTop: 4 },
  registerText: { color: COLORS.textSecondary, fontSize: 14 },
  registerLink: { color: COLORS.gold, fontSize: 14, fontWeight: "700", textDecorationLine: "underline" },
});
