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

import Watchlist from "../../../components/Watchlist";

export default function OrdersScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        {/* HEADER */}
        <View style={styles.header}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <MaterialIcons name="menu" size={22} color="#111827" />
            <Text style={styles.headerTitle}> Orders</Text>
          </View>
          <MaterialIcons name="search" size={22} color="#111827" />
        </View>

        {/* EMPTY STATE */}
        <View style={styles.emptyContainer}>
          <View style={styles.iconCircle}>
            <MaterialIcons name="receipt-long" size={40} color="#2563eb" />
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

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#f3f4f6",
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
  },

  emptyContainer: {
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 24,
    borderRadius: 20,
    marginBottom: 24,
  },

  iconCircle: {
    width: 150,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#dbeafe",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },

  emptyTitle: {
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 8,
  },

  emptySub: {
    textAlign: "center",
    fontSize: 13,
    color: "#6b7280",
    marginBottom: 20,
  },

  buyButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2563eb",
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 12,
  },

  buyText: {
    color: "#fff",
    fontWeight: "700",
  },
});
