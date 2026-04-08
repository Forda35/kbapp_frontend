import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StatusBar,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Icon from "../components/Icon";
import { registerUser } from "../api";
import { COLORS, SPACING, RADIUS } from "../theme";
import { Image } from "react-native";

export default function RegisterPage({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleRegister = async () => {
    setError("");
    if (!email || !password || !confirm) { setError("Tous les champs sont obligatoires"); return; }
    if (password !== confirm) { setError("Les mots de passe ne correspondent pas"); return; }
    if (password.length < 6) { setError("Le mot de passe doit contenir au moins 6 caractères"); return; }
    setLoading(true);
    try {
      const data = await registerUser(email.trim().toLowerCase(), password);
      if (data.message?.toLowerCase().includes("vérif") || data.message?.toLowerCase().includes("envoy") || data.message?.toLowerCase().includes("créé")) {
        setSuccess(true);
      } else {
        setError(data.message || "Erreur lors de l'inscription");
      }
    } catch {
      setError("Erreur de connexion. Vérifiez votre internet.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={[COLORS.bgPrimary, COLORS.bgSecondary]} style={StyleSheet.absoluteFill} />
        <View style={styles.successContainer}>
          <View style={styles.successIconBox}>
            <Icon name="mail" size={48} color={COLORS.gold} />
          </View>
          <Text style={styles.successTitle}>Vérifiez votre email !</Text>
          <Text style={styles.successText}>
            Un lien de confirmation a été envoyé à{"\n"}
            <Text style={{ color: COLORS.gold, fontWeight: "700" }}>{email}</Text>
          </Text>
          <Text style={styles.successSub}>
  Cliquez sur le lien dans l'email pour activer votre compte, puis connectez-vous.{"\n\n"}
  <Text style={{ color: COLORS.warning, fontWeight: "700" }}>
    Si vous ne trouvez pas l'email dans votre boîte de réception, vérifiez votre dossier spam ou indésirables.
  </Text>
</Text>
          <TouchableOpacity style={styles.goLoginBtn} onPress={() => navigation.navigate("Login")}>
            <LinearGradient colors={[COLORS.royalBlue, COLORS.royalBlueLight]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.goLoginGrad}>
              <Text style={styles.goLoginText}>Se connecter</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={[COLORS.bgPrimary, COLORS.bgSecondary, "#0d1535"]} style={StyleSheet.absoluteFill} />

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Icon name="arrow-back" size={20} color={COLORS.textSecondary} />
            <Text style={styles.backText}>Retour</Text>
          </TouchableOpacity>

          <View style={styles.logoArea}>
            <View style={styles.logoBox}>
  <Image
    source={require("../../assets/logo.png")}
    style={{ width: 46, height: 46, borderRadius: 10 }}
    resizeMode="contain"
  />
</View>
            <Text style={styles.appName}>KB Events</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.title}>Créer un compte</Text>
            <Text style={styles.subtitle}>Rejoignez KB Events et accédez à tous vos événements.</Text>

            {[
              { label: "Adresse email", value: email, setter: setEmail, icon: "mail-outline", keyboard: "email-address", secure: false },
              { label: "Mot de passe", value: password, setter: setPassword, icon: "lock-closed-outline", keyboard: "default", secure: true },
              { label: "Confirmer le mot de passe", value: confirm, setter: setConfirm, icon: "lock-closed-outline", keyboard: "default", secure: true },
            ].map((field) => (
              <View key={field.label} style={styles.inputGroup}>
                <Text style={styles.label}>{field.label}</Text>
                <View style={styles.inputRow}>
                  <Icon name={field.icon} size={18} color={COLORS.textMuted} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    placeholder={field.label}
                    placeholderTextColor={COLORS.textMuted}
                    value={field.value}
                    onChangeText={field.setter}
                    keyboardType={field.keyboard}
                    autoCapitalize="none"
                    secureTextEntry={field.secure}
                  />
                </View>
              </View>
            ))}

            {error ? (
              <View style={styles.errorBox}>
                <Icon name="warning" size={16} color={COLORS.error} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <TouchableOpacity style={styles.registerBtn} onPress={handleRegister} disabled={loading} activeOpacity={0.85}>
              <LinearGradient colors={[COLORS.royalBlue, COLORS.royalBlueLight]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.registerBtnGrad}>
                {loading ? <ActivityIndicator color={COLORS.gold} /> : <Text style={styles.registerBtnText}>Créer mon compte</Text>}
              </LinearGradient>
            </TouchableOpacity>
          </View>

          <View style={styles.loginRow}>
            <Text style={styles.loginText}>Déjà un compte ? </Text>
            <TouchableOpacity onPress={() => navigation.navigate("Login")}>
              <Text style={styles.loginLink}>Se connecter.</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgPrimary },
  scroll: { flexGrow: 1, paddingHorizontal: SPACING.lg, paddingTop: 50, paddingBottom: 40 },
  backBtn: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 16 },
  backText: { color: COLORS.textSecondary, fontSize: 15 },
  logoArea: { alignItems: "center", marginBottom: 28 },
  logoBox: {
    width: 70, height: 70, borderRadius: 20,
    backgroundColor: COLORS.royalBlue, borderWidth: 2, borderColor: COLORS.gold,
    justifyContent: "center", alignItems: "center", marginBottom: 10,
  },
  logoText: { color: COLORS.gold, fontSize: 26, fontWeight: "900" },
  appName: { color: COLORS.gold, fontSize: 22, fontWeight: "900", letterSpacing: 3 },
  card: {
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.xl,
    borderWidth: 1, borderColor: COLORS.border, padding: SPACING.lg, marginBottom: 24,
  },
  title: { color: COLORS.textPrimary, fontSize: 22, fontWeight: "800", marginBottom: 6 },
  subtitle: { color: COLORS.textSecondary, fontSize: 14, marginBottom: 22, lineHeight: 20 },
  inputGroup: { marginBottom: 16 },
  label: {
    color: COLORS.textSecondary, fontSize: 12, fontWeight: "600",
    marginBottom: 7, textTransform: "uppercase", letterSpacing: 0.8,
  },
  inputRow: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#0d1535", borderWidth: 1.5,
    borderColor: COLORS.border, borderRadius: RADIUS.md, paddingHorizontal: 14,
  },
  inputIcon: { marginRight: 10 },
  input: { color: COLORS.textPrimary, fontSize: 15, paddingVertical: 13 },
  errorBox: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "#1a0a0a", borderWidth: 1,
    borderColor: COLORS.error, borderRadius: RADIUS.md, padding: 12, marginBottom: 14,
  },
  errorText: { color: COLORS.error, fontSize: 14, flex: 1 },
  registerBtn: { borderRadius: RADIUS.md, overflow: "hidden", marginTop: 4 },
  registerBtnGrad: {
    paddingVertical: 16, alignItems: "center",
    borderWidth: 1.5, borderColor: COLORS.gold + "60", borderRadius: RADIUS.md,
  },
  registerBtnText: { color: COLORS.gold, fontSize: 16, fontWeight: "800", letterSpacing: 1 },
  loginRow: { flexDirection: "row", justifyContent: "center", flexWrap: "wrap" },
  loginText: { color: COLORS.textSecondary, fontSize: 14 },
  loginLink: { color: COLORS.gold, fontSize: 14, fontWeight: "700", textDecorationLine: "underline" },
  successContainer: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 36 },
  successIconBox: {
    width: 110, height: 110, borderRadius: 55,
    backgroundColor: COLORS.bgCard, borderWidth: 2, borderColor: COLORS.gold,
    justifyContent: "center", alignItems: "center", marginBottom: 28,
  },
  successTitle: { color: COLORS.gold, fontSize: 24, fontWeight: "900", textAlign: "center", marginBottom: 16 },
  successText: { color: COLORS.textPrimary, fontSize: 15, textAlign: "center", lineHeight: 24, marginBottom: 14 },
  successSub: { color: COLORS.textSecondary, fontSize: 14, textAlign: "center", lineHeight: 22, marginBottom: 36 },
  goLoginBtn: { borderRadius: RADIUS.md, overflow: "hidden", width: "100%" },
  goLoginGrad: { paddingVertical: 16, alignItems: "center", borderRadius: RADIUS.md, borderWidth: 1.5, borderColor: COLORS.gold + "60" },
  goLoginText: { color: COLORS.gold, fontSize: 16, fontWeight: "800", letterSpacing: 1 },
});
