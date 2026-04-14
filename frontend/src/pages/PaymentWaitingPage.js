import React, { useState, useEffect, useRef } from "react";
import {
  View, Text, StyleSheet, ActivityIndicator,
  TouchableOpacity, Alert, Animated, TextInput,
  KeyboardAvoidingView, Platform, ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Icon from "../components/Icon";
import QRCode from "react-native-qrcode-svg";
import { COLORS, SPACING, RADIUS } from "../theme";
import { API_URL, cacheTickets, getCachedTickets, confirmOrangePayment } from "../api";
import AsyncStorage from "@react-native-async-storage/async-storage";

const formatAriary = (a) => `${Number(a).toLocaleString("fr-FR")} Ar`;

export default function PaymentWaitingPage({ payment, onSuccess, onExpired, onCancel }) {
  const [status, setStatus] = useState("pending");
  const [ticket, setTicket] = useState(null);
  const [transactionId, setTransactionId] = useState("");
  const [confirmLoading, setConfirmLoading] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pollingRef = useRef(null);
  const timerRef = useRef(null);

  // Calculer le temps restant réel
  const getInitialTimeLeft = () => {
    if (payment?.motifExpiry) {
      const remaining = Math.floor((new Date(payment.motifExpiry) - new Date()) / 1000);
      return Math.max(0, remaining);
    }
    return 30 * 60;
  };
  const [timeLeft, setTimeLeft] = useState(getInitialTimeLeft);

  // Orange = numéro de téléphone | Airtel = code marchand
  const isOrange = payment?.method === "Orange Money";
  const destinationLabel = isOrange ? "Numéro Orange Money" : "Code marchand Airtel";
  const instructionText = isOrange
    ? `Ouvrez Orange Money → "Envoyer de l'argent" → Numéro ${payment?.merchantCode} → Montant exact ${formatAriary(payment?.amount)}`
    : `Ouvrez Airtel Money → "Paiement marchand" → Code ${payment?.merchantCode} → Montant exact ${formatAriary(payment?.amount)} → Motif obligatoire : ${payment?.motif}`;

  // Confirmation manuelle Orange Money
  const handleOrangeConfirm = async () => {
    const trimmed = transactionId.trim();
    if (trimmed.length < 4) {
      Alert.alert("ID invalide", "Veuillez entrer un ID de transaction Orange Money valide.");
      return;
    }
    setConfirmLoading(true);
    try {
      const res = await confirmOrangePayment(payment.id, trimmed);
      if (res.ticket) {
        clearInterval(pollingRef.current);
        clearInterval(timerRef.current);
        setStatus("completed");
        setTicket(res.ticket);
        const cached = await getCachedTickets();
        const updated = [...cached.filter((t) => t.id !== res.ticket.id), res.ticket];
        await cacheTickets(updated);
        Alert.alert("🎉 Billet acheté !", "Votre paiement Orange Money a été confirmé !", [
          { text: "Voir mon billet", onPress: () => onSuccess(res.ticket) },
        ]);
      } else {
        Alert.alert("Erreur", res.message || "Impossible de confirmer ce paiement.");
      }
    } catch (e) {
      Alert.alert("Erreur", "Une erreur est survenue. Vérifiez votre ID de transaction.");
    } finally {
      setConfirmLoading(false);
    }
  };

  // Animation pulsation
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.1, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  // Minuteur
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) { clearInterval(timerRef.current); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  // Polling toutes les 5 secondes — Orange ET Airtel (détection automatique par SMS)
  useEffect(() => {
    const poll = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        const res = await fetch(`${API_URL}/payments/status/${payment.id}`, {
          headers: { Authorization: "Bearer " + token },
        });
        const data = await res.json();

        if (data.status === "completed" && data.ticket) {
          clearInterval(pollingRef.current);
          clearInterval(timerRef.current);
          setStatus("completed");
          setTicket(data.ticket);

          const cached = await getCachedTickets();
          const updated = [...cached.filter((t) => t.id !== data.ticket.id), data.ticket];
          await cacheTickets(updated);

          Alert.alert("🎉 Billet acheté !", "Votre billet a été confirmé avec succès !", [
            { text: "Voir mon billet", onPress: () => onSuccess(data.ticket) },
          ]);
        } else if (data.status === "expired") {
          clearInterval(pollingRef.current);
          clearInterval(timerRef.current);
          setStatus("expired");
          const cached = await getCachedTickets();
          const cleaned = cached.filter((t) => t.id !== data.ticket?.id);
          await cacheTickets(cleaned);
          onExpired();
        }
      } catch (e) { console.error("Polling error:", e); }
    };

    pollingRef.current = setInterval(poll, 5000);
    poll();
    return () => clearInterval(pollingRef.current);
  }, []);

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const isUrgent = timeLeft < 5 * 60;

  // ── Succès ──
  if (status === "completed" && ticket) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={[COLORS.bgPrimary, COLORS.bgSecondary]} style={StyleSheet.absoluteFill} />
        <View style={styles.successContainer}>
          <View style={styles.successIconBox}>
            <Icon name="checkmark-circle" size={60} color={COLORS.success} />
          </View>
          <Text style={styles.successTitle}>Billet confirmé !</Text>
          <Text style={styles.successSub}>{ticket.event?.title}</Text>
          <View style={styles.qrBox}>
            <QRCode value={ticket.qrCode} size={180} color={COLORS.bgPrimary} backgroundColor="#fff" />
          </View>
          <Text style={styles.qrNote}>Conservez ce QR code précieusement</Text>
          <TouchableOpacity style={styles.doneBtn} onPress={() => onSuccess(ticket)}>
            <Text style={styles.doneBtnText}>Voir mes billets</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── Expiré ──
  if (status === "expired" || timeLeft === 0) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={[COLORS.bgPrimary, COLORS.bgSecondary]} style={StyleSheet.absoluteFill} />
        <View style={styles.successContainer}>
          <View style={[styles.successIconBox, { borderColor: COLORS.error }]}>
            <Icon name="close-circle" size={60} color={COLORS.error} />
          </View>
          <Text style={[styles.successTitle, { color: COLORS.error }]}>Paiement annulé</Text>
          <Text style={styles.successSub}>
            Le délai de 30 minutes est écoulé. Votre réservation a été annulée.
          </Text>
          <TouchableOpacity style={[styles.doneBtn, { backgroundColor: COLORS.error }]} onPress={onCancel}>
            <Text style={styles.doneBtnText}>Retour aux événements</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── Attente ──
  return (
    <View style={styles.container}>
      <LinearGradient colors={[COLORS.bgPrimary, COLORS.bgSecondary]} style={StyleSheet.absoluteFill} />

      <View style={styles.header}>
        <TouchableOpacity onPress={onCancel} style={styles.cancelTopBtn}>
          <Icon name="close" size={20} color={COLORS.textMuted} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>En attente de paiement</Text>
      </View>

      <View style={styles.content}>
        {/* Minuteur */}
        <View style={[styles.timerBox, isUrgent && styles.timerBoxUrgent]}>
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <Icon name="warning" size={24} color={isUrgent ? COLORS.error : COLORS.gold} />
          </Animated.View>
          <Text style={[styles.timerText, isUrgent && { color: COLORS.error }]}>
            {formatTime(timeLeft)}
          </Text>
          <Text style={styles.timerLabel}>Temps restant</Text>
        </View>

        {/* Card instructions */}
        <View style={styles.instructCard}>
          <Text style={styles.instructTitle}>Instructions de paiement</Text>

          <View style={styles.instructRow}>
            <Text style={styles.instructLabel}>Méthode</Text>
            <Text style={styles.instructValue}>{payment.method}</Text>
          </View>

          <View style={styles.instructDivider} />

          <View style={styles.instructRow}>
            <Text style={styles.instructLabel}>{destinationLabel}</Text>
            <Text style={[styles.instructValue, { color: COLORS.gold, fontSize: 20, fontWeight: "900" }]}>
              {payment.merchantCode}
            </Text>
          </View>

          <View style={styles.instructDivider} />

          <View style={styles.instructRow}>
            <Text style={styles.instructLabel}>Montant exact</Text>
            <Text style={[styles.instructValue, { color: COLORS.success, fontSize: 20, fontWeight: "900" }]}>
              {formatAriary(payment.amount)}
            </Text>
          </View>

          {/* Motif uniquement pour Airtel */}
          {!isOrange && (
            <>
              <View style={styles.instructDivider} />
              <View style={styles.instructRow}>
                <Text style={styles.instructLabel}>Motif de paiement</Text>
                <View style={styles.motifBox}>
                  <Text style={styles.motifText}>{payment.motif}</Text>
                </View>
              </View>
            </>
          )}
        </View>

        {/* Résumé étapes */}
        <View style={styles.stepsBox}>
          <Icon name="information-circle" size={16} color={COLORS.royalBlueLight} />
          <Text style={styles.stepsText}>{instructionText}</Text>
        </View>

        {/* Avertissement motif Airtel uniquement */}
        {!isOrange && (
          <View style={styles.noteBox}>
            <Icon name="warning" size={16} color={COLORS.warning} />
            <Text style={styles.noteText}>
              Le motif{" "}
              <Text style={{ fontWeight: "900", color: COLORS.gold }}>{payment.motif}</Text>
              {" "}est <Text style={{ fontWeight: "900", color: COLORS.gold }}>obligatoire</Text>.
              Sans lui, votre paiement ne sera pas détecté.
            </Text>
          </View>
        )}

        {/* Confirmation manuelle Orange Money */}
        {isOrange && (
          <View style={styles.orangeConfirmBox}>
            <Icon name="checkmark-circle-outline" size={18} color={COLORS.warning} />
            <Text style={styles.orangeConfirmTitle}>
              Après avoir effectué le virement, entrez ici votre ID de transaction Orange Money :
            </Text>
            <TextInput
              style={styles.txInput}
              placeholder="Ex: MP250414.1234.AB1234"
              placeholderTextColor={COLORS.textMuted}
              value={transactionId}
              onChangeText={setTransactionId}
              autoCapitalize="characters"
              autoCorrect={false}
            />
            <TouchableOpacity
              style={[styles.confirmBtn, confirmLoading && { opacity: 0.6 }]}
              onPress={handleOrangeConfirm}
              disabled={confirmLoading}
            >
              {confirmLoading
                ? <ActivityIndicator size="small" color={COLORS.gold} />
                : <Text style={styles.confirmBtnText}>Confirmer le paiement</Text>
              }
            </TouchableOpacity>
          </View>
        )}

        {/* Polling indicator */}
        <View style={styles.pollingRow}>
          <ActivityIndicator size="small" color={COLORS.textMuted} />
          <Text style={styles.pollingText}>
            {isOrange
              ? "En attente de votre confirmation..."
              : "Détection automatique du paiement toutes les 5 secondes..."}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgPrimary },
  header: {
    flexDirection: "row", alignItems: "center",
    paddingTop: 56, paddingHorizontal: SPACING.lg,
    paddingBottom: 16, gap: 12,
  },
  cancelTopBtn: { padding: 8 },
  headerTitle: { color: COLORS.textPrimary, fontSize: 18, fontWeight: "800", flex: 1 },
  content: { flex: 1, padding: SPACING.lg },
  timerBox: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 12, backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg,
    borderWidth: 2, borderColor: COLORS.gold, padding: SPACING.md, marginBottom: 14,
  },
  timerBoxUrgent: { borderColor: COLORS.error, backgroundColor: COLORS.error + "11" },
  timerText: { color: COLORS.gold, fontSize: 36, fontWeight: "900" },
  timerLabel: { color: COLORS.textSecondary, fontSize: 12 },
  instructCard: {
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg,
    borderWidth: 1, borderColor: COLORS.borderGold,
    padding: SPACING.md, marginBottom: 10,
  },
  instructTitle: { color: COLORS.textPrimary, fontSize: 15, fontWeight: "800", marginBottom: 14 },
  instructRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 3 },
  instructLabel: { color: COLORS.textMuted, fontSize: 13 },
  instructValue: { color: COLORS.textPrimary, fontSize: 15, fontWeight: "700" },
  instructDivider: { height: 1, backgroundColor: COLORS.border, marginVertical: 8 },
  motifBox: {
    backgroundColor: COLORS.royalBlue, borderRadius: RADIUS.md,
    paddingHorizontal: 12, paddingVertical: 6,
    borderWidth: 2, borderColor: COLORS.gold,
  },
  motifText: { color: COLORS.gold, fontSize: 17, fontWeight: "900", letterSpacing: 3 },
  stepsBox: {
    flexDirection: "row", alignItems: "flex-start", gap: 8,
    backgroundColor: COLORS.royalBlue + "18", borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: COLORS.border,
    padding: 11, marginBottom: 10,
  },
  stepsText: { color: COLORS.textSecondary, fontSize: 12, lineHeight: 18, flex: 1 },
  noteBox: {
    flexDirection: "row", alignItems: "flex-start", gap: 8,
    backgroundColor: COLORS.warning + "15", borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: COLORS.warning + "44",
    padding: 11, marginBottom: 14,
  },
  noteText: { color: COLORS.textSecondary, fontSize: 13, lineHeight: 20, flex: 1 },
  pollingRow: {
    flexDirection: "row", alignItems: "center",
    justifyContent: "center", gap: 8,
  },
  pollingText: { color: COLORS.textMuted, fontSize: 11 },
  successContainer: { flex: 1, justifyContent: "center", alignItems: "center", padding: SPACING.lg },
  successIconBox: {
    width: 110, height: 110, borderRadius: 55,
    backgroundColor: COLORS.bgCard, borderWidth: 2, borderColor: COLORS.success,
    justifyContent: "center", alignItems: "center", marginBottom: 20,
  },
  successTitle: { color: COLORS.gold, fontSize: 26, fontWeight: "900", textAlign: "center", marginBottom: 8 },
  successSub: { color: COLORS.textSecondary, fontSize: 14, textAlign: "center", marginBottom: 24 },
  qrBox: {
    backgroundColor: "#fff", borderRadius: RADIUS.lg,
    padding: 20, borderWidth: 3, borderColor: COLORS.gold, marginBottom: 16,
  },
  qrNote: { color: COLORS.textMuted, fontSize: 12, textAlign: "center", marginBottom: 24 },
  doneBtn: {
    backgroundColor: COLORS.royalBlue, borderRadius: RADIUS.md,
    paddingVertical: 15, paddingHorizontal: 40,
    borderWidth: 1.5, borderColor: COLORS.gold + "60",
  },
  doneBtnText: { color: COLORS.gold, fontWeight: "800", fontSize: 15 },
  orangeConfirmBox: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    borderColor: COLORS.warning + "66",
    padding: SPACING.md,
    marginBottom: 14,
    gap: 10,
  },
  orangeConfirmTitle: {
    color: COLORS.textSecondary,
    fontSize: 13,
    lineHeight: 19,
  },
  txInput: {
    backgroundColor: COLORS.bgPrimary,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.gold + "88",
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: "700",
    paddingHorizontal: 14,
    paddingVertical: 12,
    letterSpacing: 1,
  },
  confirmBtn: {
    backgroundColor: COLORS.royalBlue,
    borderRadius: RADIUS.md,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: COLORS.gold + "60",
  },
  confirmBtnText: { color: COLORS.gold, fontWeight: "800", fontSize: 15 },
});
