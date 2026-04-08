import React from "react";
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Icon from "../components/Icon";
import { COLORS, SPACING, RADIUS } from "../theme";

export default function TermsPage({ navigation, route }) {
  const isPrivacy = route?.params?.type === "privacy";

  const title = isPrivacy ? "Politique de Confidentialité" : "Conditions d'Utilisation";

  return (
    <View style={styles.container}>
      <LinearGradient colors={[COLORS.bgPrimary, COLORS.bgSecondary]} style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={20} color={COLORS.textSecondary} />
          <Text style={styles.backText}>Retour</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{title}</Text>
        <Text style={styles.headerVersion}>Version 1.0 — Avril 2024</Text>
      </LinearGradient>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {isPrivacy ? <PrivacyContent /> : <TermsContent />}
        </View>
      </ScrollView>
    </View>
  );
}

const TermsContent = () => (
  <>
    <Section title="1. Présentation de la plateforme">
      KBApp est une plateforme de billetterie mobile permettant aux utilisateurs d'acheter des billets pour des événements organisés par des administrateurs indépendants.
    </Section>

    <Section title="2. Responsabilité des événements">
      Les événements publiés sur la plateforme sont créés et organisés par des administrateurs indépendants. KBApp n'est pas responsable de l'organisation, du contenu, du déroulement ou de l'annulation des événements. Les administrateurs responsables de la création d'événements sont seuls responsables du contenu, de l'organisation et du déroulement de leurs événements. La plateforme agit uniquement comme outil de gestion et de distribution de billets.
    </Section>

    <Section title="3. Paiement et billets">
      Les billets sont générés automatiquement après confirmation du paiement via un système de code marchand externe (Mobile Money). La plateforme ne traite ni ne stocke les informations de paiement. Chaque billet est unique, personnel et non transférable. En cas de perte ou de vol, KBApp décline toute responsabilité.
    </Section>

    <Section title="4. Obligations des administrateurs">
      Tout administrateur s'engage à : respecter la non-violence et l'ordre public lors de ses événements, assumer l'entière responsabilité de l'organisation de ses événements, respecter les lois et réglementations en vigueur à Madagascar, fournir des informations exactes sur ses événements.
    </Section>

    <Section title="5. Fraude et abus">
      Toute tentative de fraude, duplication de billets, ou utilisation abusive de la plateforme engage l'entière responsabilité légale de l'utilisateur et peut faire l'objet de poursuites judiciaires.
    </Section>

    <Section title="6. Suppression de compte">
      Vous pouvez supprimer votre compte à tout moment depuis la section Compte. La suppression est irréversible et entraîne la perte de tous vos billets non utilisés.
    </Section>

    <Section title="7. Contact">
      Pour toute question ou signalement d'un événement illégal, contactez-nous via la section Compte de l'application.
    </Section>
  </>
);

const PrivacyContent = () => (
  <>
    <Section title="1. Données collectées">
      Nous collectons uniquement les données nécessaires au fonctionnement de l'application : adresse email, billets achetés, et date d'acceptation des conditions d'utilisation.
    </Section>

    <Section title="2. Utilisation des données">
      Vos données sont utilisées exclusivement pour : la gestion de votre compte, l'envoi de billets et de confirmations par email, l'amélioration de l'application.
    </Section>

    <Section title="3. Protection des données">
      Vos données sont stockées de manière sécurisée. Nous ne vendons ni ne partageons vos données personnelles avec des tiers. Les mots de passe sont chiffrés et ne sont jamais accessibles en clair.
    </Section>

    <Section title="4. Paiements">
      KBApp ne stocke aucune information bancaire ou de paiement. Les paiements sont effectués directement via les opérateurs Mobile Money (MVola, Orange Money, Airtel Money).
    </Section>

    <Section title="5. Vos droits">
      Vous disposez d'un droit d'accès, de rectification et de suppression de vos données personnelles. Pour exercer ces droits, supprimez votre compte depuis la section Compte ou contactez-nous.
    </Section>

    <Section title="6. Cookies">
      L'application n'utilise pas de cookies. Les données de session sont stockées localement sur votre appareil de manière sécurisée.
    </Section>

    <Section title="7. Contact">
      Pour toute question relative à vos données personnelles, contactez-nous via la section Compte de l'application.
    </Section>
  </>
);

const Section = ({ title, children }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    <Text style={styles.sectionText}>{children}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgPrimary },
  header: { paddingTop: 56, paddingBottom: 20, paddingHorizontal: SPACING.lg },
  backBtn: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 16 },
  backText: { color: COLORS.textSecondary, fontSize: 15 },
  headerTitle: { color: COLORS.gold, fontSize: 22, fontWeight: "900", marginBottom: 4 },
  headerVersion: { color: COLORS.textMuted, fontSize: 12 },
  scroll: { flex: 1 },
  content: { padding: SPACING.lg, paddingBottom: 60 },
  section: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    marginBottom: 12,
  },
  sectionTitle: {
    color: COLORS.gold,
    fontSize: 15,
    fontWeight: "800",
    marginBottom: 10,
  },
  sectionText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    lineHeight: 22,
  },
});