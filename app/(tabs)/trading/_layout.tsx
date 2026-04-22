import { MaterialIcons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { Platform } from "react-native";

export default function TradingLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#0f62fe", // Brand Blue
        tabBarInactiveTintColor: "#94A3B8", // FinTech Slate
        tabBarStyle: {
          backgroundColor: "#FFFFFF",
          borderTopWidth: 1,
          borderTopColor: "#F1F5F9",
          height: 65, // Locked height
          paddingBottom: Platform.OS === 'ios' ? 10 : 10, 
          paddingTop: 8,
          elevation: 5,
          shadowColor: "#000",
          shadowOpacity: 0.05,
          shadowRadius: 5,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "700",
        },
        // THIS IS THE MAGIC FIX FOR THE FLOATING GAP
        safeAreaInsets: { bottom: 0 }, 
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color, size }) => <MaterialIcons name="dashboard" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: "Orders",
          tabBarIcon: ({ color, size }) => <MaterialIcons name="receipt-long" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="holdings"
        options={{
          title: "Holdings",
          tabBarIcon: ({ color, size }) => <MaterialIcons name="account-balance-wallet" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="positions"
        options={{
          title: "Positions",
          tabBarIcon: ({ color, size }) => <MaterialIcons name="bar-chart" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="funds"
        options={{
          title: "Funds",
          tabBarIcon: ({ color, size }) => <MaterialIcons name="account-balance" size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}