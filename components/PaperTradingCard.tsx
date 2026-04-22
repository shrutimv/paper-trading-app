// components/PaperTradingCard.tsx (replace the whole file with this)
import { MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import React from "react";
import { Dimensions, StyleSheet, Text, View } from "react-native";
import { LineChart } from "react-native-chart-kit";

const { width: SCREEN_W } = Dimensions.get("window");
const HORIZONTAL_MARGIN = 32;      // overall horizontal padding used around the card
const CARD_PADDING = 16;           // internal card padding
const CARD_WIDTH = SCREEN_W - HORIZONTAL_MARGIN; // card outer width
const INNER_WIDTH = CARD_WIDTH - CARD_PADDING * 2; // width available for content inside the card

export default function PaperTradingCard() {
  const data = {
    labels: ["", "", "", "", "", ""],
    datasets: [{ data: [100000, 100500, 99800, 101200, 102000, 102350], strokeWidth: 2 }]
  };

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View>
          <Text style={styles.smallLabel}>Current Cash</Text>
          <Text style={styles.cash}>₳1,00,000</Text>
        </View>

        <View style={{ alignItems: "flex-end" }}>
          <Text style={styles.smallLabel}>Today's P&L</Text>
          <View style={styles.pnlBubble}><Text style={styles.pnlText}>+₳2,3660</Text></View>
        </View>
      </View>

      <View style={{ marginTop: 10, overflow: "hidden", borderRadius: 12 }}>
        <LineChart
          data={data}
          width={INNER_WIDTH}      // <= ensure chart fits inside card padding
          height={120}
          withDots={false}
          withInnerLines={false}
          withOuterLines={false}
          withHorizontalLabels={false}
          withVerticalLabels={false}
          fromZero={false}
          chartConfig={{
            backgroundGradientFrom: "#ffffff",
            backgroundGradientTo: "#ffffff",
            color: (opacity = 1) => `rgba(34,197,94, ${opacity})`,
            strokeWidth: 4,
            propsForBackgroundLines: { strokeWidth: 4 },
          }}
          bezier
          style={{ marginLeft: CARD_PADDING * -1 }} // compensate chart-kit internal padding on some platforms
        />
      </View>

      <View style={styles.divider} />

      <View style={styles.actionsRow}>
        <ActionItem icon={<MaterialCommunityIcons name="briefcase-outline" size={20} />} label="Open Positions" />
        <ActionItem icon={<MaterialIcons name="star-outline" size={20} />} label="Watchlist" />
        <ActionItem icon={<MaterialIcons name="shopping-cart" size={20} />} label="New Trade" />
        <ActionItem icon={<MaterialIcons name="notes" size={20} />} label="Journal" />
      </View>
    </View>
  );
}

function ActionItem({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <View style={styles.actionItem}>
      <View style={styles.iconWrap}>{icon}</View>
      <Text style={styles.actionLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: "#fff", borderRadius: 16, padding: 16, marginTop: 12, shadowColor: "#000", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4 },
  topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  smallLabel: { color: "#6b7280", fontSize: 13 },
  cash: { fontSize: 20, fontWeight: "800", marginTop: 6, color: "#0f1724" },
  pnlBubble: { marginTop: 6, backgroundColor: "#dcfce7", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
  pnlText: { color: "#065f46", fontWeight: "700" },

  divider: { height: 1, backgroundColor: "#f0f1f5", marginTop: 16 },
  actionsRow: { flexDirection: "row", justifyContent: "space-around", paddingVertical: 12, alignItems: "center" },
  actionItem: { alignItems: "center", width: "25%" },
  iconWrap: { width: 44, height: 44, borderRadius: 10, backgroundColor: "#f8fafb", alignItems: "center", justifyContent: "center", marginBottom: 6, borderWidth: 0.5, borderColor: "#eef2f7" },
  actionLabel: { fontSize: 12, color: "#0f62fe", fontWeight: "600", textAlign: "center" },
});
