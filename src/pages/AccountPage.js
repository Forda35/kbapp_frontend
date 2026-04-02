import React, { useState, useEffect } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Icon from "../components/Icon";
import { useAuth } from "../context/AuthContext";
import { getMyTickets, getCachedTickets } from "../api";
import { COLORS, SPACING, RADIUS } from "../theme";

const MenuItem = ({ iconName, label, value, onPress, danger }) => (
  <TouchableOpacity
    style={styles.menuItem}
    onPress={onPress}
    activeOpacity={onPress ? 0.75 : 1}
  >
    <View style={[styles.menuIconBox, danger && styles.menuIconBoxDanger]}>
      <Icon
        name={iconName}
        size={18}
        color={danger ? COLORS.error : COLORS.gold}
      />
    </View>
    <View style={{ flex: 1 }}>
      <Text style={[styles.menuLabel, danger && { color: COLORS.error }]}>
        {label}
      </Text>
      {value ? <Text style={styles.menuValue}>{value}</Text> : null}
    </View>
    {onPress && (
      <Icon name="chevron-forward" size={16} color={COLORS.textMuted} />
    )}
  </TouchableOpacity>
);

export default function AccountPage() {
  const { user, logout } = useAuth();
  const [ticketCount, setTicketCount] = useState(0);

  useEffect(() => {
    const load = async () => {
      try {
        const t = await getMyTickets();
        setTicketCount(Array.isArray(t) ? t.length : 0);
      } catch {
        const cached = await getCachedTickets();
        setTicketCount(cached.length);
      }
    };
    load();
  }, []);

  const handleLogout = () => {
    Alert.alert(
      "Déconnexion",
      "Êtes-vous sûr de vouloir vous déconnecter ?",
      [
        { text: "Annuler", style: "cancel" },
        { text: "Se déconnecter", style: "destructive", onPress: logout },
      ]
    );
  };

  const roleLabel =
    user?.role === "admin" ? "Administrateur" :
    user?.role === "agent" ? "Agent" : "Utilisateur";

  const roleIcon =
    user?.role === "admin" ? "shield-checkmark" :
    user?.role === "agent" ? "search" : "person";

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

      {/* Header profil */}
      <LinearGradient
        colors={[COLORS.bgPrimary, COLORS.bgSecondary, "#0d1535"]}
        style={styles.header}
      >
        <View style={styles.avatarContainer}>
          <LinearGradient
            colors={[COLORS.royalBlue, COLORS.royalBlueLight]}
            style={styles.avatar}
          >
            <Text style={styles.avatarText}>
              {user?.email?.charAt(0).toUpperCase() || "U"}
            </Text>
          </LinearGradient>
          <View style={styles.roleBadge}>
            <Icon name={roleIcon} size={10} color={COLORS.gold} />
            <Text style={styles.roleBadgeText}>{roleLabel}</Text>
          </View>
        </View>
        <Text style={styles.userName} numberOfLines={1}>
          {user?.email?.split("@")[0]}
        </Text>
        <Text style={styles.userEmail}>{user?.email}</Text>
      </LinearGradient>

      {/* Stats rapides */}
      <View style={styles.quickStats}>
        <View style={styles.quickStatItem}>
          <Text style={styles.quickStatValue}>{ticketCount}</Text>
          <Text style={styles.quickStatLabel}>
            Billet{ticketCount > 1 ? "s" : ""} acheté{ticketCount > 1 ? "s" : ""}
          </Text>
        </View>
        <View style={styles.quickStatDivider} />
        <View style={styles.quickStatItem}>
          <Icon name="checkmark-circle" size={24} color={COLORS.success} />
          <Text style={styles.quickStatLabel}>Compte vérifié</Text>
        </View>
        <View style={styles.quickStatDivider} />
        <View style={styles.quickStatItem}>
          <Icon name="lock-closed" size={22} color={COLORS.gold} />
          <Text style={styles.quickStatLabel}>QR protégé</Text>
        </View>
      </View>

      {/* Mon compte */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Mon compte</Text>
        <View style={styles.menuCard}>
          <MenuItem iconName="mail" label="Adresse email" value={user?.email} />
          <View style={styles.divider} />
          <MenuItem iconName={roleIcon} label="Rôle" value={roleLabel} />
          <View style={styles.divider} />
          <MenuItem
            iconName="ticket"
            label="Mes billets"
            value={`${ticketCount} billet${ticketCount > 1 ? "s" : ""}`}
          />
        </View>
      </View>

      {/* Sécurité */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Sécurité & Confidentialité</Text>
        <View style={styles.menuCard}>
          <MenuItem iconName="camera-off" label="Capture d'écran QR" value="Désactivée" />
          <View style={styles.divider} />
          <MenuItem iconName="shield" label="Données chiffrées" value="Connexion sécurisée" />
          <View style={styles.divider} />
          <MenuItem iconName="cloud-offline" label="Mode hors-ligne" value="Billets disponibles sans internet" />
        </View>
      </View>

      {/* À propos */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>À propos</Text>
        <View style={styles.menuCard}>
          <MenuItem iconName="information-circle" label="Version de l'app" value="1.0.0" />
          <View style={styles.divider} />
          <MenuItem iconName="document-text" label="Conditions d'utilisation" onPress={() => {}} />
          <View style={styles.divider} />
          <MenuItem iconName="lock-closed" label="Politique de confidentialité" onPress={() => {}} />
        </View>
      </View>

      {/* Déconnexion */}
      <View style={[styles.section, { marginBottom: 40 }]}>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Icon name="log-out" size={20} color={COLORS.error} />
          <Text style={styles.logoutText}>Se déconnecter</Text>
        </TouchableOpacity>
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgPrimary },
  header: {
    paddingTop: 60, paddingBottom: 30,
    alignItems: "center", paddingHorizontal: SPACING.lg,
  },
  avatarContainer: { alignItems: "center", marginBottom: 14, position: "relative" },
  avatar: {
    width: 84, height: 84, borderRadius: 42,
    justifyContent: "center", alignItems: "center",
    borderWidth: 3, borderColor: COLORS.gold,
  },
  avatarText: { color: COLORS.gold, fontSize: 36, fontWeight: "900" },
  roleBadge: {
    position: "absolute", bottom: -6,
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: COLORS.bgCard,
    borderWidth: 1.5, borderColor: COLORS.gold,
    borderRadius: RADIUS.full,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  roleBadgeText: { color: COLORS.gold, fontSize: 10, fontWeight: "700" },
  userName: {
    color: COLORS.textPrimary, fontSize: 22,
    fontWeight: "800", marginBottom: 4, marginTop: 10,
  },
  userEmail: { color: COLORS.textSecondary, fontSize: 14 },
  quickStats: {
    flexDirection: "row", backgroundColor: COLORS.bgCard,
    marginHorizontal: SPACING.md, marginTop: -1,
    borderRadius: RADIUS.lg, borderWidth: 1,
    borderColor: COLORS.borderGold, paddingVertical: 16, marginBottom: 20,
  },
  quickStatItem: { flex: 1, alignItems: "center", gap: 4 },
  quickStatValue: { color: COLORS.gold, fontSize: 22, fontWeight: "900" },
  quickStatLabel: { color: COLORS.textMuted, fontSize: 11, textAlign: "center" },
  quickStatDivider: { width: 1, backgroundColor: COLORS.border },
  section: { paddingHorizontal: SPACING.md, marginBottom: 16 },
  sectionTitle: {
    color: COLORS.textSecondary, fontSize: 12, fontWeight: "700",
    textTransform: "uppercase", letterSpacing: 1,
    marginBottom: 10, paddingLeft: 4,
  },
  menuCard: {
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg,
    borderWidth: 1, borderColor: COLORS.border, overflow: "hidden",
  },
  menuItem: {
    flexDirection: "row", alignItems: "center",
    padding: SPACING.md, gap: 14,
  },
  menuIconBox: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: COLORS.royalBlue + "33",
    justifyContent: "center", alignItems: "center",
  },
  menuIconBoxDanger: { backgroundColor: COLORS.error + "22" },
  menuLabel: { color: COLORS.textPrimary, fontSize: 15, fontWeight: "600" },
  menuValue: { color: COLORS.textMuted, fontSize: 13, marginTop: 1 },
  divider: { height: 1, backgroundColor: COLORS.border, marginLeft: 62 },
  logoutBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10,
    backgroundColor: COLORS.error + "15", borderWidth: 1.5,
    borderColor: COLORS.error + "60", borderRadius: RADIUS.lg, paddingVertical: 16,
  },
  logoutText: { color: COLORS.error, fontSize: 16, fontWeight: "800" },
});
