import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Icon from "../components/Icon";
import { COLORS, RADIUS, SPACING } from "../theme";

const formatAriary = (a) => `${Number(a).toLocaleString("fr-FR")} Ar`;

// Seuil : description considérée "longue" au-delà de 100 caractères
const DESC_THRESHOLD = 100;

export default function EventCard({ event, bought, onPress }) {
  const [expanded, setExpanded] = useState(false);

  const date = new Date(event.date);
  const day = date.getDate();
  const month = date.toLocaleDateString("fr-FR", { month: "short" }).toUpperCase();
  const fullDate = date.toLocaleDateString("fr-FR", {
    weekday: "short", day: "numeric", month: "long", year: "numeric",
  });

  const isLong = event.description && event.description.length > DESC_THRESHOLD;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => !bought && onPress && onPress(event)}
      activeOpacity={bought ? 1 : 0.85}
    >
      <LinearGradient
        colors={[COLORS.royalBlue, COLORS.royalBlueDark]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
        style={styles.topBar}
      />

      <View style={styles.body}>
        <View style={styles.dateBox}>
          <Text style={styles.dateDay}>{day}</Text>
          <Text style={styles.dateMonth}>{month}</Text>
        </View>

        <View style={styles.content}>
          <Text style={styles.title} numberOfLines={2}>{event.title}</Text>

          {event.location ? (
            <View style={styles.row}>
              <Icon name="location" size={13} color={COLORS.textMuted} />
              <Text style={styles.locationText} numberOfLines={1}>{event.location}</Text>
            </View>
          ) : null}

          <View style={styles.row}>
            <Icon name="calendar" size={13} color={COLORS.textMuted} />
            <Text style={styles.dateText}>{fullDate}</Text>
          </View>

          {/* Description — tronquée par défaut si longue */}
          <Text
            style={styles.desc}
            numberOfLines={expanded ? undefined : 2}
          >
            {event.description}
          </Text>

          {/* Bouton Voir plus / Voir moins — uniquement si description longue */}
          {isLong && (
            <TouchableOpacity
              style={styles.expandBtn}
              onPress={(e) => {
                e.stopPropagation?.();
                setExpanded((v) => !v);
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.expandBtnText}>
                {expanded ? "Voir moins" : "Voir plus"}
              </Text>
              <Icon
                name={expanded ? "close-circle" : "information-circle"}
                size={13}
                color={COLORS.royalBlueLight}
              />
            </TouchableOpacity>
          )}

          <View style={styles.footer}>
            <Text style={styles.price}>{formatAriary(event.price)}</Text>

            {bought ? (
              <View style={styles.boughtBadge}>
                <Icon name="checkmark-circle" size={14} color={COLORS.success} />
                <Text style={styles.boughtText}>Billet obtenu</Text>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.buyBtn}
                onPress={() => onPress && onPress(event)}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={[COLORS.royalBlue, COLORS.royalBlueLight]}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={styles.buyBtnGrad}
                >
                  <Icon name="cart" size={14} color={COLORS.gold} />
                  <Text style={styles.buyBtnText}>Acheter</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      <View style={styles.perforated}>
        <View style={styles.hole} />
        <View style={styles.dashedLine} />
        <View style={styles.hole} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg,
    borderWidth: 1, borderColor: COLORS.borderGold,
    marginBottom: 16, overflow: "hidden",
  },
  topBar: { height: 4 },
  body: { flexDirection: "row", padding: SPACING.md, gap: 14 },
  dateBox: {
    width: 52, backgroundColor: COLORS.royalBlue + "33",
    borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border,
    padding: 8, alignItems: "center", justifyContent: "center",
  },
  dateDay: { color: COLORS.gold, fontSize: 22, fontWeight: "900", lineHeight: 26 },
  dateMonth: { color: COLORS.textSecondary, fontSize: 11, fontWeight: "700", letterSpacing: 1 },
  content: { flex: 1 },
  title: { color: COLORS.textPrimary, fontSize: 16, fontWeight: "800", marginBottom: 6 },
  row: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 4 },
  locationText: { color: COLORS.textMuted, fontSize: 12, flex: 1 },
  dateText: { color: COLORS.textMuted, fontSize: 12, flex: 1 },
  desc: {
    color: COLORS.textSecondary, fontSize: 13,
    lineHeight: 18, marginTop: 2, marginBottom: 4,
  },
  expandBtn: {
    flexDirection: "row", alignItems: "center", gap: 4,
    marginBottom: 8, alignSelf: "flex-start",
    paddingVertical: 2,
  },
  expandBtnText: {
    color: COLORS.royalBlueLight, fontSize: 12, fontWeight: "700",
  },
  footer: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "center", marginTop: 8,
  },
  price: { color: COLORS.gold, fontSize: 18, fontWeight: "900" },
  boughtBadge: {
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: COLORS.success + "22", borderWidth: 1,
    borderColor: COLORS.success, borderRadius: RADIUS.full,
    paddingHorizontal: 12, paddingVertical: 6,
  },
  boughtText: { color: COLORS.success, fontSize: 12, fontWeight: "700" },
  buyBtn: { borderRadius: RADIUS.md, overflow: "hidden" },
  buyBtnGrad: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 14, paddingVertical: 9,
    borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.gold + "55",
  },
  buyBtnText: { color: COLORS.gold, fontWeight: "800", fontSize: 13 },
  perforated: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 8, paddingBottom: 8,
  },
  hole: {
    width: 12, height: 12, borderRadius: 6,
    backgroundColor: COLORS.bgPrimary,
    borderWidth: 1, borderColor: COLORS.border,
  },
  dashedLine: {
    flex: 1, height: 1, borderWidth: 1,
    borderColor: COLORS.border, borderStyle: "dashed", marginHorizontal: 4,
  },
});