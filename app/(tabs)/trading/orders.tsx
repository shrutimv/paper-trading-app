import { MaterialIcons } from "@expo/vector-icons";
import React from "react";
import {
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useTheme } from "../../../context/ThemeContext";
import Watchlist from "../../../components/Watchlist";

export default function OrdersScreen() {
  const { colors } = useTheme();
  const styles = getStyles(colors);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        {/* HEADER */}
        <View style={styles.header}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <MaterialIcons name="menu" size={22} color={colors.text} />
            <Text style={styles.headerTitle}> Orders</Text>
          </View>
          <MaterialIcons name="search" size={22} color={colors.text} />
        </View>

        {/* EMPTY STATE */}
        <View style={styles.emptyContainer}>
          <View style={styles.iconCircle}>
            <MaterialIcons name="receipt-long" size={40} color={colors.accent} />
          </View>

          <Text style={styles.emptyTitle}>No orders placed yet</Text>

          <Text style={styles.emptySub}>
            Start trading by selecting a stock from your watchlist or search for
            a new ticker to place your first order.
          </Text>

          <TouchableOpacity style={styles.buyButton}>
            <MaterialIcons name="shopping-cart" size={18} color="#fff" />
            <Text style={styles.buyText}> Buy</Text>
          </TouchableOpacity>
        </View>

        {/* WATCHLIST COMPONENT */}
        <Watchlist showSearch={false} />
      </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 16,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 30,
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.text,
  },

  emptyContainer: {
    alignItems: "center",
    backgroundColor: colors.card,
    padding: 24,
    borderRadius: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.border,
  },

  iconCircle: {
    width: 150,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.isDark ? 'rgba(59, 130, 246, 0.12)' : '#dbeafe',
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    borderWidth: colors.isDark ? 1 : 0,
    borderColor: colors.accent,
  },

  emptyTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.text,
    marginBottom: 8,
  },

  emptySub: {
    textAlign: "center",
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 20,
  },

  buyButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.accent,
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 12,
  },

  buyText: {
    color: "#fff",
    fontWeight: "700",
  },
});
