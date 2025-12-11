// components/Header.tsx
import { useRouter } from "expo-router";
import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

type Props = {
  name: string;
  onAvatarPress?: () => void; // optional override
};

export default function Header({ name, onAvatarPress }: Props) {
  const router = useRouter();

  // Default action when avatar is pressed
  const goToProfile = () => {
    // Using a small cast because expo-router type typing is strict
    router.push("/profile" as any);
  };

  const handlePress = () => {
    if (onAvatarPress) {
      onAvatarPress(); // custom handler from parent
    } else {
      goToProfile(); // fallback
    }
  };

  return (
    <View style={styles.header}>
      <View>
        <Text style={styles.greeting}>Hello,</Text>
        <Text style={styles.name}>{name}</Text>
      </View>

      {/* Avatar Button */}
      <TouchableOpacity onPress={handlePress} style={styles.avatarButton}>
        <Image
          source={require("../assets/images/profile/Avatar.png")}
          style={styles.avatar}
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  greeting: {
    fontSize: 14,
    color: "#6b7280",
  },
  name: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0f1724",
  },
  avatarButton: {
    padding: 4,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
  },
});
