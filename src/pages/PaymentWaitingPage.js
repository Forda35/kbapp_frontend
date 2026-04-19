import React, { useState, useEffect, useRef } from "react";
import {
  View, Text, StyleSheet, ActivityIndicator,
  TouchableOpacity, Alert, Animated, TextInput,
  Clipboard, Linking, Platform,
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
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedMotif, setCopiedMotif] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pollingRef = useRef(null);
  const timerRef = useRef(null);

  const getInitialTimeLeft = () => {
    if (payment?.motifExpiry) {
      const remaining = Math.floor((new Date(payment.motifExpiry) - new Date()) / 1000);
      return Math.max(0, remaining);
    }
    return 30 * 60;
  };
  const [timeLeft, setTimeLeft] = useState(getInitialTimeLeft);

  const isOrange = true;
  const destinationLabel = "Numéro Orange";

  // --- Fonctions de Copie ---
  const handleCopyCode = () => {
    Clipboard.setString(payment?.merchantCode || "");
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyMotif = () => {
    Clipboard.setString(payment?.motif || "");
    setCopiedMotif(true);
    setTimeout(() => setCopiedMotif(false), 2000);
  };

  // --- Ouverture des Applications (Correction Package & Fallback) ---
  const handleOpenApp = async () => {
    const packageName = "com.orange.orangemoneyafrique";

    if (Platform.OS === 'android') {
      const intentUrl = `intent:#Intent;package=${packageName};end`;
      const marketUrl = `market://details?id=${packageName}`;

      try {
        // Tentative 1 : Ouverture directe via Intent
        await Linking.openURL(intentUrl);
      } catch (error) {
        // Tentative 2 : Redirection Play Store (Affichera "Ouvrir" si installée)
        try {
          await Linking.openURL(marketUrl);
        } catch (err) {
          Alert.alert("Erreur", "Impossible de trouver l'application.");
        }
      }
    } else {
      // iOS
      const scheme = "orangemoney://";
      try {
        await Linking.openURL(scheme);
      } catch (error) {
        Alert.alert("Note", "L'application n'est pas installée.");
      }
    }
  };

  const handleUSSD = async () => {
    const numero = payment?.merchantCode?.replace(/\s/g, "") || "";
    const montant = Math.round(payment?.amount) || "";
    const ussdCode = `#144*1*1*${numero}*${numero}*${montant}*2#`;
    const url = `tel:${ussdCode.replace(/#/g, '%23')}`;

    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert("Erreur", "Veuillez composer : " + ussdCode);
    }
  };

  const handleOrangeConfirm = async () => {
    const trimmed = transactionId.trim();
    if (trimmed.length < 4) {
      Alert.alert("ID manquant", "Veuillez copier le Transaction ID reçu par SMS et le coller ici.");
      return;
    }
    setConfirmLoading(true);
    try {
      const res = await confirmOrangePayment(payment.id, trimmed);
      if (res.ticket) {
        stopPolling();
        setStatus("completed");
        setTicket(res.ticket);
        onSuccess(res.ticket);
      } else {
        Alert.alert("Erreur", res.message || "Confirmation impossible.");
      }
    } catch (e) {
      Alert.alert("Erreur", "Problème de connexion.");
    } finally {
      setConfirmLoading(false);
    }
  };

  const stopPolling = () => {
    clearInterval(pollingRef.current);
    clearInterval(timerRef.current);
  };

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.05, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    ).start();

    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) { clearInterval(timerRef.current); return 0; }
        return t - 1;
      });
    }, 1000);

    const poll = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        const res = await fetch(`${API_URL}/payments/status/${payment.id}`, {
          headers: { Authorization: "Bearer " + token },
        });
        const data = await res.json();
        if (data.status === "completed" && data.ticket) {
          stopPolling();
          setStatus("completed");
          setTicket(data.ticket);
          onSuccess(data.ticket);
        } else if (data.status === "expired") {
          stopPolling();
          setStatus("expired");
          onExpired();
        }
      } catch (e) { }
    };

    pollingRef.current = setInterval(poll, 5000);
    return () => stopPolling();
  }, []);

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  if (status === "completed" && ticket) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={[COLORS.bgPrimary, COLORS.bgSecondary]} style={StyleSheet.absoluteFill} />
        <View style={styles.successContainer}>
          <Icon name="checkmark-circle" size={80} color={COLORS.success} />
          <Text style={styles.successTitle}>Billet confirmé !</Text>
          <View style={styles.qrBox}>
            <QRCode value={ticket.qrCode} size={180} color={COLORS.bgPrimary} backgroundColor="#fff" />
          </View>
          <TouchableOpacity style={styles.doneBtn} onPress={() => onSuccess(ticket)}>
            <Text style={styles.doneBtnText}>Voir mes billets</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={[COLORS.bgPrimary, COLORS.bgSecondary]} style={StyleSheet.absoluteFill} />
      <View style={styles.header}>
        <TouchableOpacity onPress={onCancel} style={styles.cancelTopBtn}>
          <Icon name="close" size={20} color={COLORS.textMuted} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Paiement en attente</Text>
      </View>

      <View style={styles.content}>
        <View style={[styles.timerBox, timeLeft < 300 && styles.timerBoxUrgent]}>
          <Text style={[styles.timerText, timeLeft < 300 && { color: COLORS.error }]}>{formatTime(timeLeft)}</Text>
          <Text style={styles.timerLabel}>restant</Text>
        </View>

        <View style={styles.infoCard}>
          <Icon name="information-circle-outline" size={18} color={COLORS.gold} />
          <Text style={styles.infoText}>
            {isOrange 
              ? "Notez votre Transaction ID après le transfert, copiez-le et collez-le ci-dessous. Choix entre application ou code USSD."
              : "Il est impératif d'indiquer le motif généré ci-dessous lors du transfert pour une vérification automatique."}
          </Text>
        </View>

        <View style={styles.instructCard}>
          <View style={styles.instructRow}>
            <Text style={styles.instructLabel}>{destinationLabel}</Text>
            <View style={styles.valueWithBtn}>
              <Text numberOfLines={1} ellipsizeMode="tail" style={styles.merchantValue}>{payment.merchantCode}</Text>
              <TouchableOpacity style={styles.copyBtnSmall} onPress={handleCopyCode}>
                <Icon name={copiedCode ? "checkmark" : "copy-outline"} size={12} color={copiedCode ? COLORS.success : COLORS.gold} />
                <Text style={styles.copyBtnTextSmall}>{copiedCode ? "OK" : "Copier"}</Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.instructDivider} />
          <View style={styles.instructRow}>
            <Text style={styles.instructLabel}>Montant</Text>
            <Text style={styles.amountValue}>{formatAriary(payment.amount)}</Text>
          </View>
          {!isOrange && (
            <>
              <View style={styles.instructDivider} />
              <View style={styles.instructRow}>
                <Text style={styles.instructLabel}>Motif</Text>
                <View style={styles.valueWithBtn}>
                  <View style={styles.motifBox}>
                    <Text numberOfLines={1} ellipsizeMode="tail" style={styles.motifText}>{payment.motif}</Text>
                  </View>
                  <TouchableOpacity style={styles.copyBtnSmall} onPress={handleCopyMotif}>
                    <Icon name={copiedMotif ? "checkmark" : "copy-outline"} size={12} color={copiedMotif ? COLORS.success : COLORS.gold} />
                    <Text style={styles.copyBtnTextSmall}>{copiedMotif ? "OK" : "Copier"}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </>
          )}
        </View>

        <View style={styles.payBtnsRow}>
          <TouchableOpacity style={styles.payBtn} onPress={handleOpenApp}>
            <Icon name="apps-outline" size={20} color={COLORS.gold} />
            <Text style={styles.payBtnText}>App Orange</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.payBtn} onPress={handleUSSD}>
            <Icon name="keypad-outline" size={20} color={COLORS.gold} />
            <Text style={styles.payBtnText}>Lancer USSD</Text>
          </TouchableOpacity>
        </View>

        {isOrange && (
          <View style={styles.orangeConfirmBox}>
            <Text style={styles.orangeConfirmTitle}>Collez ici le Transaction ID reçu :</Text>
            <TextInput
              style={styles.txInput}
              placeholder="Ex: MP250101.1234.A000"
              placeholderTextColor={COLORS.textMuted}
              value={transactionId}
              onChangeText={setTransactionId}
              autoCapitalize="characters"
            />
            <TouchableOpacity style={styles.confirmBtn} onPress={handleOrangeConfirm} disabled={confirmLoading}>
              {confirmLoading ? <ActivityIndicator size="small" color={COLORS.gold} /> : <Text style={styles.confirmBtnText}>Vérifier mon paiement</Text>}
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.pollingRow}>
          <ActivityIndicator size="small" color={COLORS.textMuted} />
          <Text style={styles.pollingText}>Vérification automatique...</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgPrimary },
  header: { flexDirection: "row", alignItems: "center", paddingTop: 50, paddingHorizontal: 20, paddingBottom: 10 },
  headerTitle: { color: COLORS.textPrimary, fontSize: 18, fontWeight: "800", marginLeft: 10 },
  content: { flex: 1, paddingHorizontal: 20 },
  timerBox: { flexDirection: "row", alignItems: "baseline", justifyContent: "center", gap: 5, marginBottom: 15 },
  timerBoxUrgent: { backgroundColor: COLORS.error + "15", borderRadius: RADIUS.md },
  timerText: { color: COLORS.gold, fontSize: 32, fontWeight: "900" },
  timerLabel: { color: COLORS.textMuted, fontSize: 14 },
  infoCard: { flexDirection: "row", backgroundColor: COLORS.bgCard, padding: 12, borderRadius: 10, borderLeftWidth: 3, borderLeftColor: COLORS.gold, marginBottom: 15, gap: 10, alignItems: 'flex-start' },
  infoText: { color: COLORS.textSecondary, fontSize: 12, flex: 1, lineHeight: 18 },
  instructCard: { backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg, padding: 15, borderWidth: 1, borderColor: COLORS.border, marginBottom: 15 },
  instructRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 10 },
  instructLabel: { color: COLORS.textMuted, fontSize: 13, flexShrink: 0 },
  valueWithBtn: { flexDirection: "row", alignItems: "center", gap: 8, flex: 1, justifyContent: "flex-end" },
  merchantValue: { color: COLORS.gold, fontSize: 15, fontWeight: "800", flexShrink: 1 },
  copyBtnSmall: { 
    flexDirection: "row", alignItems: "center", gap: 3, 
    backgroundColor: COLORS.royalBlue, paddingHorizontal: 6, 
    paddingVertical: 3, borderRadius: 4, borderWidth: 1, borderColor: COLORS.gold + "44",
    width: 60, justifyContent: "center", flexShrink: 0 
  },
  copyBtnTextSmall: { color: COLORS.gold, fontSize: 10, fontWeight: "700" },
  amountValue: { color: COLORS.success, fontSize: 18, fontWeight: "900" },
  motifBox: { backgroundColor: COLORS.royalBlue, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 5, borderWidth: 1, borderColor: COLORS.gold, flexShrink: 1 },
  motifText: { color: COLORS.gold, fontSize: 14, fontWeight: "900" },
  payBtnsRow: { flexDirection: "row", gap: 10, marginBottom: 15 },
  payBtn: { flex: 1, backgroundColor: COLORS.bgCard, borderRadius: 10, paddingVertical: 12, alignItems: "center", gap: 5, borderWidth: 1, borderColor: COLORS.border },
  payBtnText: { color: COLORS.textPrimary, fontSize: 12, fontWeight: "700" },
  orangeConfirmBox: { backgroundColor: COLORS.bgCard, padding: 15, borderRadius: 12, borderWidth: 1, borderColor: COLORS.warning + "44", marginBottom: 15 },
  orangeConfirmTitle: { color: COLORS.textSecondary, fontSize: 13, marginBottom: 10 },
  txInput: { backgroundColor: COLORS.bgPrimary, borderRadius: 8, padding: 12, color: COLORS.textPrimary, fontWeight: "700", marginBottom: 10, borderWidth: 1, borderColor: COLORS.border },
  confirmBtn: { backgroundColor: COLORS.royalBlue, paddingVertical: 12, borderRadius: 8, alignItems: "center", borderWidth: 1, borderColor: COLORS.gold },
  confirmBtnText: { color: COLORS.gold, fontWeight: "800" },
  pollingRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  pollingText: { color: COLORS.textMuted, fontSize: 11 },
  successContainer: { flex: 1, justifyContent: "center", alignItems: "center", padding: 30 },
  successTitle: { color: COLORS.gold, fontSize: 24, fontWeight: "900", marginBottom: 20 },
  qrBox: { backgroundColor: "#fff", padding: 15, borderRadius: 15, marginBottom: 30 },
  doneBtn: { backgroundColor: COLORS.royalBlue, paddingVertical: 15, paddingHorizontal: 40, borderRadius: 10, borderWidth: 1, borderColor: COLORS.gold },
  doneBtnText: { color: COLORS.gold, fontWeight: "800" },
});