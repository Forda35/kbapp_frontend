import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, FlatList, StyleSheet, ActivityIndicator,
  RefreshControl, Modal, ScrollView, Alert, StatusBar, TextInput, TouchableOpacity,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Icon from "../components/Icon";
import {
  getEvents, getCachedEvents, cacheEvents,
  getMyTickets, getCachedTickets, cacheTickets, initiatePayment, checkPendingPayment,
} from "../api";
import { useAuth } from "../context/AuthContext";
import { COLORS, SPACING, RADIUS } from "../theme";
import EventCard from "../components/EventCard";
import PaymentWaitingPage from "./PaymentWaitingPage";
import { useFocusEffect } from "@react-navigation/native";

const formatAriary = (a) => `${Number(a).toLocaleString("fr-FR")} Ar`;

export default function EventsPage() {
  const [events, setEvents] = useState([]);
  const [myTickets, setMyTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [legalModal, setLegalModal] = useState(false);
  const [payModal, setPayModal] = useState(false);
  const [pendingEvent, setPendingEvent] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [phone, setPhone] = useState("");
  const [payMethod, setPayMethod] = useState("MVola");
  const [paying, setPaying] = useState(false);
  const [payResult, setPayResult] = useState(null);
  const [paymentData, setPaymentData] = useState(null);
  const [showWaiting, setShowWaiting] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [evts, tickets] = await Promise.allSettled([getEvents(), getMyTickets()]);
      if (evts.status === "fulfilled" && Array.isArray(evts.value)) { setEvents(evts.value); await cacheEvents(evts.value); }
      else setEvents(await getCachedEvents());
      if (tickets.status === "fulfilled" && Array.isArray(tickets.value)) { setMyTickets(tickets.value); await cacheTickets(tickets.value); }
      else setMyTickets(await getCachedTickets());
    } catch {
      const [a, b] = await Promise.all([getCachedEvents(), getCachedTickets()]);
      setEvents(a); setMyTickets(b);
    } finally { setLoading(false); setRefreshing(false); }
  }, []);

  useFocusEffect(
  useCallback(() => { loadData(); }, [loadData])
);

  const hasTicket = (eventId) =>
  myTickets.some((t) => t.eventId === eventId && (t.status === "confirmed" || t.qrCode));

  const onBuyPress = async (event) => {
  try {
    // Vérifier si un paiement en attente existe déjà
    const { hasPending, payment } = await checkPendingPayment(event.id);

    if (hasPending && payment) {
      // Rediriger directement vers l'écran de polling
      setPaymentData(payment);
      setSelectedEvent(event);
      setShowWaiting(true);
      return;
    }
  } catch {
    // Si erreur réseau, continuer normalement
  }

  // Pas de paiement en attente → flux normal
  setPendingEvent(event);
  setLegalModal(true);
};
  const onAcceptLegal = () => { setLegalModal(false); setSelectedEvent(pendingEvent); setPayModal(true); };

  const handlePay = async () => {
  if (!phone.replace(/\s/g, "") || phone.replace(/\s/g, "").length < 9) {
    Alert.alert("Numéro invalide", "Entrez un numéro valide (min. 9 chiffres)"); return;
  }
  setPaying(true);
  try {
    const data = await initiatePayment(selectedEvent.id, phone, payMethod);
    if (data.payment) {
      // Fermer le modal paiement et ouvrir l'écran d'attente
      setPayModal(false);
      setPaymentData(data.payment);
      setShowWaiting(true);
      setPhone("");
    } else {
      Alert.alert("Erreur", data.message || "Erreur de paiement");
    }
  } catch {
    Alert.alert("Erreur", "Connexion impossible. Réessayez.");
  } finally {
    setPaying(false);
  }
};

  const closePayModal = () => { setPayModal(false); setPayResult(null); setPhone(""); setSelectedEvent(null); setPendingEvent(null); };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bgPrimary} />

      <LinearGradient colors={[COLORS.bgPrimary, COLORS.bgSecondary]} style={styles.header}>
        <Text style={styles.headerTitle}>Événements</Text>
        <Text style={styles.headerSub}>
          {events.length > 0 ? `${events.length} événement${events.length > 1 ? "s" : ""} à venir` : "Découvrez et réservez vos billets"}
        </Text>
      </LinearGradient>

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color={COLORS.gold} /></View>
      ) : events.length === 0 ? (
        <View style={styles.center}>
          <Icon name="calendar" size={64} color={COLORS.textMuted} />
          <Text style={styles.emptyTitle}>Aucun événement disponible</Text>
          <Text style={styles.emptyText}>Revenez bientôt !</Text>
        </View>
      ) : (
        <FlatList
          data={events}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <EventCard event={item} bought={hasTicket(item.id)} onPress={onBuyPress} />}
          contentContainerStyle={{ padding: SPACING.md, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} tintColor={COLORS.gold} />}
        />
      )}

      {/* Modal légal */}
      <Modal visible={legalModal} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.legalModal}>
            <View style={styles.legalIconBox}>
              <Icon name="warning" size={32} color={COLORS.warning} />
            </View>
            <Text style={styles.legalTitle}>Informations importantes</Text>
            <ScrollView style={styles.legalScroll} showsVerticalScrollIndicator={false}>
              {[
                { icon: "key", title: "Billet unique et personnel", text: "Chaque billet est unique et lié à votre compte. Il n'est pas transférable." },
                { icon: "ban", title: "Perte ou vol non couverts", text: "En cas de perte ou de vol, nous déclinons toute responsabilité. Conservez-le précieusement." },
                { icon: "scale", title: "Fraude interdite", text: "Toute tentative de fraude ou duplication engage votre responsabilité légale." },
                { icon: "camera-off", title: "Capture d'écran désactivée", text: "La capture d'écran de votre QR code est bloquée pour protéger votre billet." },
                { icon: "warning", title: "Paiement — motif obligatoire", text: "Un code motif unique valable 30 minutes vous sera donné. Vous devez l'indiquer lors de votre paiement Mobile Money, sinon le paiement ne sera pas détecté et votre billet annulé." },
              ].map((item) => (
                <View key={item.icon} style={styles.legalItem}>
                  <View style={styles.legalItemIconBox}>
                    <Icon name={item.icon} size={18} color={COLORS.gold} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.legalItemTitle}>{item.title}</Text>
                    <Text style={styles.legalItemText}>{item.text}</Text>
                  </View>
                </View>
              ))}
            </ScrollView>
            <TouchableOpacity style={styles.acceptBtn} onPress={onAcceptLegal}>
              <LinearGradient colors={[COLORS.royalBlue, COLORS.royalBlueLight]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.acceptBtnGrad}>
                <Icon name="checkmark-circle" size={18} color={COLORS.gold} />
                <Text style={styles.acceptBtnText}>J'accepte et je continue</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setLegalModal(false)}>
              <Text style={styles.cancelText}>Annuler</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal paiement */}
      <Modal visible={payModal} transparent animationType="slide">
        <View style={styles.overlayBottom}>
          <View style={styles.payModal}>
            {payResult ? (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.paySuccessIconBox}>
                  <Icon name="checkmark-circle" size={52} color={COLORS.success} />
                </View>
                <Text style={styles.paySuccessTitle}>Paiement initié !</Text>
                <Text style={styles.paySuccessSub}>Votre billet est réservé. Suivez les instructions.</Text>
                <View style={styles.instructBox}>
                  <InfoRow label="Méthode" value={payResult.method} />
                  <View style={styles.instructDivider} />
                  <InfoRow label="Code marchand" value={payResult.merchantCode} valueStyle={{ color: COLORS.gold, fontSize: 24, fontWeight: "900" }} />
                  <View style={styles.instructDivider} />
                  <InfoRow label="Montant à envoyer" value={formatAriary(payResult.amount)} valueStyle={{ color: COLORS.success, fontSize: 20, fontWeight: "900" }} />
                  <View style={styles.instructDivider} />
                  <InfoRow label="Référence" value={payResult.id?.slice(0, 8).toUpperCase()} />
                </View>
                <View style={styles.noteBox}>
                  <Icon name="phone-portrait" size={16} color={COLORS.textSecondary} />
                  <Text style={styles.noteText}>
                    Ouvrez {payResult.method} → "Paiement marchand" → Code{" "}
                    <Text style={{ color: COLORS.gold, fontWeight: "800" }}>{payResult.merchantCode}</Text>
                    {" "}→ Envoyez{" "}
                    <Text style={{ color: COLORS.success, fontWeight: "800" }}>{formatAriary(payResult.amount)}</Text>
                  </Text>
                </View>
                <TouchableOpacity style={styles.doneBtn} onPress={closePayModal}>
                  <Text style={styles.doneBtnText}>Terminer</Text>
                </TouchableOpacity>
              </ScrollView>
            ) : (
              <>
                <View style={styles.payTitleRow}>
                  <Icon name="card" size={22} color={COLORS.gold} />
                  <Text style={styles.payTitle}>Paiement Mobile Money</Text>
                </View>
                {selectedEvent && (
                  <>
                    <Text style={styles.payEventName}>{selectedEvent.title}</Text>
                    <Text style={styles.payAmount}>{formatAriary(selectedEvent.price)}</Text>
                  </>
                )}
                <Text style={styles.payLabel}>Méthode de paiement</Text>
                <View style={styles.methodRow}>
                  {["MVola", "Orange Money", "Airtel Money"].map((m) => (
                    <TouchableOpacity key={m} style={[styles.methodBtn, payMethod === m && styles.methodBtnActive]} onPress={() => setPayMethod(m)}>
                      <Text style={[styles.methodText, payMethod === m && styles.methodTextActive]}>{m}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <Text style={styles.payLabel}>Numéro de téléphone</Text>
                <View style={styles.phoneRow}>
                  <View style={styles.phonePrefixBox}>
                    <Icon name="call" size={16} color={COLORS.textSecondary} />
                    <Text style={styles.phonePrefix}>+261</Text>
                  </View>
                  <TextInput
                    style={styles.phoneInput}
                    placeholder="34 00 000 00"
                    placeholderTextColor={COLORS.textMuted}
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
                    maxLength={13}
                  />
                </View>
                <TouchableOpacity style={styles.payBtn} onPress={handlePay} disabled={paying} activeOpacity={0.85}>
                  <LinearGradient colors={[COLORS.royalBlue, COLORS.royalBlueLight]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.payBtnGrad}>
                    {paying ? <ActivityIndicator color={COLORS.gold} /> : (
                      <>
                        <Icon name="checkmark-circle" size={18} color={COLORS.gold} />
                        <Text style={styles.payBtnText}>Confirmer le paiement</Text>
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
                <TouchableOpacity style={styles.cancelBtn} onPress={closePayModal}>
                  <Text style={styles.cancelText}>Annuler</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    {/* Modal attente paiement - plein écran */}
      <Modal visible={showWaiting} animationType="slide">
        {paymentData && (
          <PaymentWaitingPage
            payment={paymentData}
            onSuccess={(ticket) => {
              setShowWaiting(false);
              setPaymentData(null);
              setSelectedEvent(null);
              setPendingEvent(null);
              loadData();
            }}
            onExpired={() => {
              setShowWaiting(false);
              setPaymentData(null);
              setSelectedEvent(null);
              setPendingEvent(null);
            }}
            onCancel={() => {
              setShowWaiting(false);
              setPaymentData(null);
              setSelectedEvent(null);
              setPendingEvent(null);
            }}
          />
        )}
      </Modal>

    </View>
  );
}

const InfoRow = ({ label, value, valueStyle }) => (
  <View style={{ marginBottom: 4 }}>
    <Text style={{ color: COLORS.textMuted, fontSize: 11, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 3 }}>{label}</Text>
    <Text style={[{ color: COLORS.textPrimary, fontSize: 16, fontWeight: "700" }, valueStyle]}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgPrimary },
  header: { paddingTop: 56, paddingBottom: 20, paddingHorizontal: SPACING.lg },
  headerTitle: { color: COLORS.gold, fontSize: 26, fontWeight: "900", letterSpacing: 1 },
  headerSub: { color: COLORS.textSecondary, fontSize: 14, marginTop: 4 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", gap: 12 },
  emptyTitle: { color: COLORS.textPrimary, fontSize: 20, fontWeight: "700" },
  emptyText: { color: COLORS.textSecondary, fontSize: 14 },
  overlay: { flex: 1, backgroundColor: "rgba(6,9,20,0.93)", justifyContent: "center", alignItems: "center", padding: SPACING.lg },
  overlayBottom: { flex: 1, backgroundColor: "rgba(6,9,20,0.93)", justifyContent: "flex-end" },
  legalModal: { backgroundColor: COLORS.bgCard, borderRadius: RADIUS.xl, borderWidth: 1, borderColor: COLORS.borderGold, padding: SPACING.lg, width: "100%" },
  legalIconBox: { width: 60, height: 60, borderRadius: 30, backgroundColor: COLORS.warning + "18", justifyContent: "center", alignItems: "center", alignSelf: "center", marginBottom: 12 },
  legalTitle: { color: COLORS.gold, fontSize: 19, fontWeight: "900", textAlign: "center", marginBottom: 18 },
  legalScroll: { maxHeight: 250, marginBottom: 18 },
  legalItem: { flexDirection: "row", gap: 12, marginBottom: 14, alignItems: "flex-start" },
  legalItemIconBox: { width: 34, height: 34, borderRadius: 10, backgroundColor: COLORS.royalBlue + "33", justifyContent: "center", alignItems: "center" },
  legalItemTitle: { color: COLORS.textPrimary, fontSize: 14, fontWeight: "700", marginBottom: 3 },
  legalItemText: { color: COLORS.textSecondary, fontSize: 13, lineHeight: 19 },
  acceptBtn: { borderRadius: RADIUS.md, overflow: "hidden", marginBottom: 4 },
  acceptBtnGrad: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 15, borderWidth: 1.5, borderColor: COLORS.gold + "55", borderRadius: RADIUS.md },
  acceptBtnText: { color: COLORS.gold, fontWeight: "800", fontSize: 15 },
  cancelBtn: { paddingVertical: 14, alignItems: "center" },
  cancelText: { color: COLORS.textMuted, fontSize: 14 },
  payModal: { backgroundColor: COLORS.bgCard, borderTopLeftRadius: 28, borderTopRightRadius: 28, borderWidth: 1, borderColor: COLORS.border, padding: SPACING.lg, maxHeight: "90%", paddingBottom: 40 },
  payTitleRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 6 },
  payTitle: { color: COLORS.textPrimary, fontSize: 20, fontWeight: "900" },
  payEventName: { color: COLORS.textSecondary, fontSize: 14, marginBottom: 4 },
  payAmount: { color: COLORS.gold, fontSize: 28, fontWeight: "900", marginBottom: 20 },
  payLabel: { color: COLORS.textSecondary, fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 10, marginTop: 14 },
  methodRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  methodBtn: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: RADIUS.md, borderWidth: 1.5, borderColor: COLORS.border },
  methodBtnActive: { borderColor: COLORS.gold, backgroundColor: COLORS.royalBlue + "44" },
  methodText: { color: COLORS.textMuted, fontSize: 13, fontWeight: "600" },
  methodTextActive: { color: COLORS.gold, fontWeight: "700" },
  phoneRow: { flexDirection: "row", borderWidth: 1.5, borderColor: COLORS.border, borderRadius: RADIUS.md, overflow: "hidden", marginBottom: 20 },
  phonePrefixBox: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: COLORS.royalBlue + "33", paddingHorizontal: 12, borderRightWidth: 1, borderRightColor: COLORS.border },
  phonePrefix: { color: COLORS.textSecondary, fontSize: 14, fontWeight: "600" },
  phoneInput: { flex: 1, color: COLORS.textPrimary, fontSize: 16, paddingHorizontal: 14, paddingVertical: 14 },
  payBtn: { borderRadius: RADIUS.md, overflow: "hidden", marginBottom: 4 },
  payBtnGrad: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 15, borderWidth: 1, borderColor: COLORS.gold + "55", borderRadius: RADIUS.md },
  payBtnText: { color: COLORS.gold, fontWeight: "800", fontSize: 15 },
  paySuccessIconBox: { alignItems: "center", marginBottom: 12 },
  paySuccessTitle: { color: COLORS.gold, fontSize: 20, fontWeight: "900", textAlign: "center", marginBottom: 6 },
  paySuccessSub: { color: COLORS.textSecondary, fontSize: 13, textAlign: "center", marginBottom: 18, lineHeight: 20 },
  instructBox: { backgroundColor: COLORS.bgPrimary, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.borderGold, padding: SPACING.md, marginBottom: 14 },
  instructDivider: { height: 1, backgroundColor: COLORS.border, marginVertical: 10 },
  noteBox: { flexDirection: "row", alignItems: "flex-start", gap: 8, backgroundColor: COLORS.royalBlue + "18", borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border, padding: 14, marginBottom: 18 },
  noteText: { color: COLORS.textSecondary, fontSize: 13, lineHeight: 20, flex: 1 },
  doneBtn: { backgroundColor: COLORS.royalBlue, borderRadius: RADIUS.md, paddingVertical: 15, alignItems: "center", borderWidth: 1.5, borderColor: COLORS.gold + "55" },
  doneBtnText: { color: COLORS.gold, fontWeight: "800", fontSize: 15 },
});