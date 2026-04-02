import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  Modal, ActivityIndicator, RefreshControl, Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Icon from "../components/Icon";
import QRCode from "react-native-qrcode-svg";
import { getMyTickets, getCachedTickets, cacheTickets } from "../api";
import { COLORS, SPACING, RADIUS } from "../theme";

const ScreenCapture = {
  preventScreenCaptureAsync: async () => {},
  allowScreenCaptureAsync: async () => {},
};

const formatAriary = (a) => `${Number(a).toLocaleString("fr-FR")} Ar`;
const formatDate = (d) =>
  new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

export default function MyTicketsPage() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);

  const loadTickets = useCallback(async () => {
    try {
      const data = await getMyTickets();
      if (Array.isArray(data)) { setTickets(data); await cacheTickets(data); }
      else throw new Error();
    } catch {
      const cached = await getCachedTickets();
      setTickets(cached);
    } finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { loadTickets(); }, []);

  useEffect(() => {
    if (selectedTicket) ScreenCapture.preventScreenCaptureAsync();
    else ScreenCapture.allowScreenCaptureAsync();
    return () => { ScreenCapture.allowScreenCaptureAsync(); };
  }, [selectedTicket]);

  const renderTicket = ({ item }) => (
    <TouchableOpacity style={styles.card} onPress={() => setSelectedTicket(item)} activeOpacity={0.85}>
      <LinearGradient colors={["#1a2440", COLORS.bgCard]} style={styles.cardGrad}>
        <View style={styles.goldBar} />
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle} numberOfLines={2}>{item.event?.title}</Text>
          <View style={styles.cardMeta}>
            <Icon name="calendar" size={13} color={COLORS.textMuted} />
            <Text style={styles.cardDate}>{formatDate(item.event?.date)}</Text>
          </View>
          {item.event?.location ? (
            <View style={styles.cardMeta}>
              <Icon name="location" size={13} color={COLORS.textMuted} />
              <Text style={styles.cardLocation}>{item.event.location}</Text>
            </View>
          ) : null}
          <Text style={styles.cardPrice}>{formatAriary(item.event?.price)}</Text>
        </View>
        <View style={styles.cardRight}>
          <View style={[styles.statusBadge, item.used && styles.statusUsed]}>
            <Icon
              name={item.used ? "close-circle" : "checkmark-circle"}
              size={12}
              color={item.used ? COLORS.error : COLORS.success}
            />
            <Text style={[styles.statusText, item.used && { color: COLORS.error }]}>
              {item.used ? "Utilisé" : "Valide"}
            </Text>
          </View>
          <Icon name="qr-code" size={28} color={COLORS.gold} style={{ opacity: 0.7 }} />
          <Text style={styles.qrHint}>Voir QR</Text>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <LinearGradient colors={[COLORS.bgPrimary, COLORS.bgSecondary]} style={styles.header}>
        <Text style={styles.headerTitle}>Mes Billets</Text>
        <Text style={styles.headerSub}>Disponibles hors-ligne</Text>
      </LinearGradient>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.gold} />
        </View>
      ) : tickets.length === 0 ? (
        <View style={styles.center}>
          <Icon name="ticket" size={64} color={COLORS.textMuted} />
          <Text style={styles.emptyTitle}>Aucun billet</Text>
          <Text style={styles.emptyText}>Achetez vos billets depuis l'onglet Événements</Text>
        </View>
      ) : (
        <FlatList
          data={tickets}
          keyExtractor={(item) => item.id}
          renderItem={renderTicket}
          contentContainerStyle={{ padding: SPACING.md }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadTickets(); }} tintColor={COLORS.gold} />
          }
        />
      )}

      {/* Modal QR */}
      <Modal visible={!!selectedTicket} transparent animationType="slide" onRequestClose={() => setSelectedTicket(null)}>
        <View style={styles.overlay}>
          <View style={styles.qrModal}>
            <LinearGradient colors={[COLORS.royalBlue, COLORS.royalBlueDark]} style={styles.qrHeader}>
              <Text style={styles.qrHeaderTitle}>{selectedTicket?.event?.title}</Text>
              <Text style={styles.qrHeaderDate}>
                {selectedTicket?.event?.date ? formatDate(selectedTicket.event.date) : ""}
              </Text>
            </LinearGradient>

            <View style={styles.qrZone}>
              {selectedTicket && (
                <QRCode value={selectedTicket.qrCode} size={200} color={COLORS.bgPrimary} backgroundColor="#fff" />
              )}
            </View>

            <View style={styles.qrInfoRow}>
              <View style={styles.qrInfoItem}>
                <Text style={styles.qrInfoLabel}>Statut</Text>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                  <Icon
                    name={selectedTicket?.used ? "close-circle" : "checkmark-circle"}
                    size={16}
                    color={selectedTicket?.used ? COLORS.error : COLORS.success}
                  />
                  <Text style={[styles.qrInfoValue, { color: selectedTicket?.used ? COLORS.error : COLORS.success }]}>
                    {selectedTicket?.used ? "Utilisé" : "Valide"}
                  </Text>
                </View>
              </View>
              <View style={styles.qrInfoItem}>
                <Text style={styles.qrInfoLabel}>Prix payé</Text>
                <Text style={styles.qrInfoValue}>
                  {selectedTicket?.event?.price ? formatAriary(selectedTicket.event.price) : "—"}
                </Text>
              </View>
            </View>

            <View style={styles.qrWarning}>
              <Icon name="lock-closed" size={14} color={COLORS.textSecondary} />
              <Text style={styles.qrWarningText}>
                La capture d'écran est désactivée pour protéger votre billet. Ce QR code est unique et personnel.
              </Text>
            </View>

            <TouchableOpacity style={styles.closeQrBtn} onPress={() => setSelectedTicket(null)}>
              <Icon name="close" size={18} color={COLORS.gold} />
              <Text style={styles.closeQrText}>Fermer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgPrimary },
  header: { paddingTop: 56, paddingBottom: 20, paddingHorizontal: SPACING.lg },
  headerTitle: { color: COLORS.gold, fontSize: 26, fontWeight: "900", letterSpacing: 1 },
  headerSub: { color: COLORS.textSecondary, fontSize: 13, marginTop: 4 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", gap: 12 },
  emptyTitle: { color: COLORS.textPrimary, fontSize: 20, fontWeight: "700" },
  emptyText: { color: COLORS.textSecondary, fontSize: 14, textAlign: "center", paddingHorizontal: 40 },
  card: { borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.borderGold, marginBottom: 14, overflow: "hidden" },
  cardGrad: { flexDirection: "row", padding: SPACING.md, gap: 12, alignItems: "center" },
  goldBar: { width: 4, borderRadius: 2, backgroundColor: COLORS.gold, alignSelf: "stretch", marginRight: 4 },
  cardTitle: { color: COLORS.textPrimary, fontSize: 16, fontWeight: "800", marginBottom: 6 },
  cardMeta: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 3 },
  cardDate: { color: COLORS.textSecondary, fontSize: 13 },
  cardLocation: { color: COLORS.textMuted, fontSize: 12 },
  cardPrice: { color: COLORS.gold, fontSize: 16, fontWeight: "900", marginTop: 4 },
  cardRight: { alignItems: "center", gap: 6 },
  statusBadge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: COLORS.success + "22", borderWidth: 1, borderColor: COLORS.success,
    borderRadius: RADIUS.full, paddingHorizontal: 8, paddingVertical: 4,
  },
  statusUsed: { backgroundColor: COLORS.error + "22", borderColor: COLORS.error },
  statusText: { color: COLORS.success, fontSize: 11, fontWeight: "700" },
  qrHint: { color: COLORS.textMuted, fontSize: 10 },
  overlay: { flex: 1, backgroundColor: "rgba(6,9,20,0.95)", justifyContent: "flex-end" },
  qrModal: {
    backgroundColor: COLORS.bgCard, borderTopLeftRadius: 28, borderTopRightRadius: 28,
    borderWidth: 1, borderColor: COLORS.borderGold, paddingBottom: 40, overflow: "hidden",
  },
  qrHeader: { padding: SPACING.lg, alignItems: "center" },
  qrHeaderTitle: { color: COLORS.gold, fontSize: 18, fontWeight: "900", textAlign: "center", marginBottom: 4 },
  qrHeaderDate: { color: COLORS.textSecondary, fontSize: 13 },
  qrZone: {
    alignItems: "center", backgroundColor: "#fff",
    margin: 24, borderRadius: RADIUS.lg, padding: 20,
    borderWidth: 3, borderColor: COLORS.gold,
  },
  qrInfoRow: { flexDirection: "row", justifyContent: "space-around", paddingHorizontal: SPACING.lg, marginBottom: 16 },
  qrInfoItem: { alignItems: "center", gap: 4 },
  qrInfoLabel: { color: COLORS.textMuted, fontSize: 11, textTransform: "uppercase", letterSpacing: 0.8 },
  qrInfoValue: { color: COLORS.textPrimary, fontSize: 15, fontWeight: "700" },
  qrWarning: {
    flexDirection: "row", alignItems: "flex-start", gap: 8,
    marginHorizontal: SPACING.lg, padding: 12,
    backgroundColor: COLORS.royalBlue + "22", borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: COLORS.border, marginBottom: 16,
  },
  qrWarningText: { color: COLORS.textSecondary, fontSize: 12, flex: 1, lineHeight: 18 },
  closeQrBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    marginHorizontal: SPACING.lg, backgroundColor: COLORS.royalBlue,
    borderRadius: RADIUS.md, paddingVertical: 14,
    borderWidth: 1.5, borderColor: COLORS.gold + "60",
  },
  closeQrText: { color: COLORS.gold, fontWeight: "800", fontSize: 15 },
});
