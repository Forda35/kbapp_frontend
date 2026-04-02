import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform, Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Icon from "../components/Icon";
import { createEvent } from "../api";
import { useAuth } from "../context/AuthContext";
import { COLORS, SPACING, RADIUS } from "../theme";

export default function CreateEventPage() {
  const { user } = useAuth();
  const [form, setForm] = useState({ title: "", description: "", date: "", price: "", location: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (user?.role !== "admin") {
    return (
      <View style={styles.forbidden}>
        <Icon name="lock-closed" size={52} color={COLORS.error} />
        <Text style={styles.forbiddenText}>Accès réservé à l'administrateur</Text>
      </View>
    );
  }

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const handleCreate = async () => {
    setError("");
    const { title, description, date, price } = form;
    if (!title || !description || !date || !price) { setError("Titre, description, date et prix sont obligatoires"); return; }
    if (isNaN(parseFloat(price)) || parseFloat(price) <= 0) { setError("Le prix doit être un nombre positif"); return; }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) { setError("Format de date invalide (AAAA-MM-JJ)"); return; }
    setLoading(true);
    try {
      const data = await createEvent(form);
      if (data.event) {
        Alert.alert("Succès", `L'événement "${data.event.title}" a été créé !`);
        setForm({ title: "", description: "", date: "", price: "", location: "" });
      } else {
        setError(data.message || "Erreur lors de la création");
      }
    } catch { setError("Erreur de connexion. Réessayez."); }
    finally { setLoading(false); }
  };

  const fields = [
    { key: "title", label: "Titre *", placeholder: "Ex : Concert Jazz Royal", icon: "musical-notes-outline", keyboard: "default", multi: false },
    { key: "description", label: "Description *", placeholder: "Décrivez l'événement...", icon: "document-text-outline", keyboard: "default", multi: true },
    { key: "date", label: "Date * (AAAA-MM-JJ)", placeholder: "Ex : 2025-12-31", icon: "calendar-outline", keyboard: "numbers-and-punctuation", multi: false },
    { key: "price", label: "Prix en Ariary *", placeholder: "Ex : 15000", icon: "cash-outline", keyboard: "numeric", multi: false },
    { key: "location", label: "Lieu (optionnel)", placeholder: "Ex : Salle Rova, Antananarivo", icon: "location-outline", keyboard: "default", multi: false },
  ];

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        <LinearGradient colors={[COLORS.bgPrimary, COLORS.bgSecondary]} style={styles.header}>
          <View style={styles.adminBadge}>
            <Icon name="shield" size={12} color={COLORS.gold} />
            <Text style={styles.adminBadgeText}>ADMIN</Text>
          </View>
          <Text style={styles.headerTitle}>Créer un événement</Text>
          <Text style={styles.headerSub}>Publié immédiatement après création</Text>
        </LinearGradient>

        <View style={styles.formCard}>
          {fields.map((field) => (
            <View key={field.key} style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>{field.label}</Text>
              <View style={[styles.inputRow, field.multi && styles.inputRowMulti]}>
                <Icon name={field.icon} size={18} color={COLORS.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, field.multi && styles.inputMulti]}
                  placeholder={field.placeholder}
                  placeholderTextColor={COLORS.textMuted}
                  value={form[field.key]}
                  onChangeText={(v) => set(field.key, v)}
                  keyboardType={field.keyboard}
                  multiline={field.multi}
                  numberOfLines={field.multi ? 4 : 1}
                  textAlignVertical={field.multi ? "top" : "center"}
                />
              </View>
            </View>
          ))}

          {/* Aperçu du prix */}
          {form.price ? (
            <View style={styles.pricePreview}>
              <Icon name="pricetag" size={16} color={COLORS.gold} />
              <Text style={styles.pricePreviewLabel}>Prix affiché :</Text>
              <Text style={styles.pricePreviewValue}>
                {Number(form.price).toLocaleString("fr-FR")} Ar
              </Text>
            </View>
          ) : null}

          {error ? (
            <View style={styles.errorBox}>
              <Icon name="warning" size={16} color={COLORS.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <TouchableOpacity style={styles.createBtn} onPress={handleCreate} disabled={loading} activeOpacity={0.85}>
            <LinearGradient
              colors={[COLORS.royalBlue, COLORS.royalBlueLight]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={styles.createBtnGrad}
            >
              {loading ? (
                <ActivityIndicator color={COLORS.gold} />
              ) : (
                <>
                  <Icon name="add-circle-outline" size={20} color={COLORS.gold} />
                  <Text style={styles.createBtnText}>Publier l'événement</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgPrimary },
  forbidden: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: COLORS.bgPrimary, gap: 16 },
  forbiddenText: { color: COLORS.error, fontSize: 16, fontWeight: "700" },
  header: { paddingTop: 56, paddingBottom: 24, paddingHorizontal: SPACING.lg },
  adminBadge: {
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: COLORS.gold + "18", borderWidth: 1, borderColor: COLORS.gold + "44",
    borderRadius: RADIUS.full, paddingHorizontal: 10, paddingVertical: 4,
    alignSelf: "flex-start", marginBottom: 10,
  },
  adminBadgeText: { color: COLORS.gold, fontSize: 11, fontWeight: "800", letterSpacing: 2 },
  headerTitle: { color: COLORS.textPrimary, fontSize: 26, fontWeight: "900" },
  headerSub: { color: COLORS.textSecondary, fontSize: 13, marginTop: 4 },
  formCard: {
    margin: SPACING.md, backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.xl, borderWidth: 1, borderColor: COLORS.border, padding: SPACING.lg,
  },
  fieldGroup: { marginBottom: 18 },
  fieldLabel: {
    color: COLORS.textSecondary, fontSize: 12, fontWeight: "700",
    textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8,
  },
  inputRow: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#0d1535", borderWidth: 1.5,
    borderColor: COLORS.border, borderRadius: RADIUS.md, paddingHorizontal: 14,
  },
  inputRowMulti: { alignItems: "flex-start", paddingTop: 12 },
  inputIcon: { marginRight: 10, marginTop: 2 },
  input: { flex: 1, color: COLORS.textPrimary, fontSize: 15, paddingVertical: 13 },
  inputMulti: { minHeight: 90, paddingTop: 0 },
  pricePreview: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: COLORS.bgPrimary, borderRadius: RADIUS.md,
    padding: 12, marginBottom: 16, borderWidth: 1, borderColor: COLORS.borderGold,
  },
  pricePreviewLabel: { color: COLORS.textSecondary, fontSize: 13 },
  pricePreviewValue: { color: COLORS.gold, fontSize: 18, fontWeight: "900" },
  errorBox: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "#1a0a0a", borderWidth: 1,
    borderColor: COLORS.error, borderRadius: RADIUS.md, padding: 12, marginBottom: 14,
  },
  errorText: { color: COLORS.error, fontSize: 14, flex: 1 },
  createBtn: { borderRadius: RADIUS.md, overflow: "hidden" },
  createBtnGrad: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    paddingVertical: 16, borderWidth: 1.5, borderColor: COLORS.gold + "60", borderRadius: RADIUS.md,
  },
  createBtnText: { color: COLORS.gold, fontWeight: "800", fontSize: 16 },
});
