import React, { useState, useEffect } from "react";
import {
  View, Text, StyleSheet, ScrollView,
  ActivityIndicator, RefreshControl, Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Icon from "../components/Icon";
import { BarChart } from "react-native-chart-kit";
import { getAdminStats } from "../api";
import { useAuth } from "../context/AuthContext";
import { COLORS, SPACING, RADIUS } from "../theme";

const { width } = Dimensions.get("window");
const formatAriary = (a) => `${Number(a || 0).toLocaleString("fr-FR")} Ar`;
const formatDate = (d) => new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });

const StatCard = ({ iconName, label, value, color }) => (
  <View style={[styles.statCard, { borderColor: color + "44" }]}>
    <LinearGradient colors={[color + "18", COLORS.bgCard]} style={styles.statCardGrad}>
      <View style={[styles.statIconBox, { backgroundColor: color + "22" }]}>
        <Icon name={iconName} size={22} color={color} />
      </View>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </LinearGradient>
  </View>
);

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const loadStats = async () => {
    try { const data = await getAdminStats(); setStats(data); }
    catch (e) { console.error(e); }
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { loadStats(); }, []);

  if (user?.role !== "admin") {
    return (
      <View style={styles.forbidden}>
        <Icon name="lock-closed" size={52} color={COLORS.error} />
        <Text style={styles.forbiddenText}>Accès réservé à l'administrateur</Text>
      </View>
    );
  }

  
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.gold} />
        <Text style={{ color: COLORS.textSecondary, marginTop: 12 }}>Chargement...</Text>
      </View>
    );
  }

  const chartData = (stats?.monthlySales || []).slice(-6);
  const hasChart = chartData.length > 0;

  const chartConfig = {
    backgroundGradientFrom: COLORS.bgCard,
    backgroundGradientTo: COLORS.bgCard,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(255, 215, 0, ${opacity})`,
    labelColor: () => COLORS.textSecondary,
    propsForBars: { rx: 4, ry: 4 },
    propsForBackgroundLines: { stroke: COLORS.border },
  };

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadStats(); }} tintColor={COLORS.gold} />
      }
    >
      <LinearGradient colors={[COLORS.bgPrimary, COLORS.bgSecondary]} style={styles.header}>
        <View style={styles.adminBadge}>
          <Icon name="shield" size={12} color={COLORS.gold} />
          <Text style={styles.adminBadgeText}>ADMIN</Text>
        </View>
        <Text style={styles.headerTitle}>Dashboard</Text>
        <Text style={styles.headerSub}>Vue d'ensemble de votre billetterie</Text>
      </LinearGradient>

      <View style={{ padding: SPACING.md }}>
        {/* KPI */}
        <View style={styles.statsGrid}>
          <StatCard iconName="calendar" label="Événements" value={stats?.summary?.totalEvents || 0} color={COLORS.royalBlueLight} />
          <StatCard iconName="people" label="Utilisateurs" value={stats?.summary?.totalUsers || 0} color={COLORS.gold} />
          <StatCard iconName="ticket" label="Billets vendus" value={stats?.summary?.totalTickets || 0} color={COLORS.success} />
          <StatCard iconName="cash" label="Revenus" value={formatAriary(stats?.summary?.totalRevenue)} color="#a855f7" />
        </View>

        {/* Graphique */}
        {hasChart && (
          <View style={styles.chartCard}>
            <View style={styles.chartHeader}>
              <Icon name="bar-chart" size={18} color={COLORS.gold} />
              <Text style={styles.sectionTitle}>Ventes par mois</Text>
            </View>
            <BarChart
              data={{
                labels: chartData.map((d) => d.month.split(" ")[0]),
                datasets: [{ data: chartData.map((d) => d.count) }],
              }}
              width={width - SPACING.md * 2 - 32}
              height={200}
              chartConfig={chartConfig}
              style={styles.chart}
              showValuesOnTopOfBars
              withInnerLines
              fromZero
            />
          </View>
        )}

        {/* Événements */}
        <View style={styles.sectionHeader}>
          <Icon name="calendar" size={18} color={COLORS.gold} />
          <Text style={styles.sectionTitle}>Détail par événement</Text>
        </View>

        {(stats?.events || []).map((event) => (
          <View key={event.id} style={styles.eventCard}>
            <LinearGradient colors={["#1a2440", COLORS.bgCard]} style={styles.eventCardGrad}>
              <View style={styles.eventCardHeader}>
                <Text style={styles.eventTitle} numberOfLines={2}>{event.title}</Text>
                <Text style={styles.eventDate}>{formatDate(event.date)}</Text>
              </View>

              <View style={styles.eventMetaRow}>
                <View style={styles.eventMetaItem}>
                  <Icon name="ticket" size={16} color={COLORS.textMuted} />
                  <Text style={styles.eventMetaLabel}>Vendus</Text>
                  <Text style={styles.eventMetaValue}>{event.sold}</Text>
                </View>
                <View style={styles.eventMetaItem}>
                  <Icon name="checkmark-done" size={16} color={COLORS.success} />
                  <Text style={styles.eventMetaLabel}>Utilisés</Text>
                  <Text style={[styles.eventMetaValue, { color: COLORS.success }]}>{event.usedTickets}</Text>
                </View>
                <View style={styles.eventMetaItem}>
                  <Icon name="cash" size={16} color={COLORS.gold} />
                  <Text style={styles.eventMetaLabel}>Revenus</Text>
                  <Text style={[styles.eventMetaValue, { color: COLORS.gold, fontSize: 13 }]}>{formatAriary(event.revenue)}</Text>
                </View>
              </View>

              <View style={styles.progressBg}>
                <View style={[styles.progressFill, { width: event.sold > 0 ? "100%" : "0%" }]} />
              </View>
              <Text style={styles.progressLabel}>{event.sold} billet{event.sold > 1 ? "s" : ""} vendu{event.sold > 1 ? "s" : ""}</Text>
            </LinearGradient>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgPrimary },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  forbidden: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: COLORS.bgPrimary, gap: 16 },
  forbiddenText: { color: COLORS.error, fontSize: 16, fontWeight: "700", textAlign: "center" },
  header: { paddingTop: 56, paddingBottom: 24, paddingHorizontal: SPACING.lg },
  adminBadge: {
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: COLORS.gold + "18", borderWidth: 1, borderColor: COLORS.gold + "44",
    borderRadius: RADIUS.full, paddingHorizontal: 10, paddingVertical: 4,
    alignSelf: "flex-start", marginBottom: 10,
  },
  adminBadgeText: { color: COLORS.gold, fontSize: 11, fontWeight: "800", letterSpacing: 2 },
  headerTitle: { color: COLORS.textPrimary, fontSize: 28, fontWeight: "900" },
  headerSub: { color: COLORS.textSecondary, fontSize: 14, marginTop: 4 },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 20 },
  statCard: { width: (width - SPACING.md * 2 - 12) / 2, borderRadius: RADIUS.lg, borderWidth: 1, overflow: "hidden" },
  statCardGrad: { padding: SPACING.md, alignItems: "center" },
  statIconBox: { width: 44, height: 44, borderRadius: 12, justifyContent: "center", alignItems: "center", marginBottom: 10 },
  statValue: { fontSize: 22, fontWeight: "900", marginBottom: 2 },
  statLabel: { color: COLORS.textSecondary, fontSize: 12, textAlign: "center" },
  chartCard: {
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg,
    borderWidth: 1, borderColor: COLORS.border, padding: SPACING.md, marginBottom: 20,
  },
  chartHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  chart: { borderRadius: RADIUS.md },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  sectionTitle: { color: COLORS.textPrimary, fontSize: 18, fontWeight: "800" },
  eventCard: { borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.borderGold, marginBottom: 14, overflow: "hidden" },
  eventCardGrad: { padding: SPACING.md },
  eventCardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 },
  eventTitle: { color: COLORS.textPrimary, fontSize: 16, fontWeight: "800", flex: 1, paddingRight: 8 },
  eventDate: { color: COLORS.textMuted, fontSize: 12 },
  eventMetaRow: { flexDirection: "row", gap: 8, marginBottom: 14 },
  eventMetaItem: { flex: 1, alignItems: "center", gap: 3 },
  eventMetaLabel: { color: COLORS.textMuted, fontSize: 10, textTransform: "uppercase", letterSpacing: 0.6 },
  eventMetaValue: { color: COLORS.textPrimary, fontSize: 16, fontWeight: "800" },
  progressBg: { height: 6, backgroundColor: COLORS.bgPrimary, borderRadius: RADIUS.full, overflow: "hidden", marginBottom: 6 },
  progressFill: { height: "100%", backgroundColor: COLORS.gold, borderRadius: RADIUS.full },
  progressLabel: { color: COLORS.textMuted, fontSize: 11 },
});
