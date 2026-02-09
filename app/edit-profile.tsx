import React, { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TextInput,
  TouchableOpacity,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";

export default function EditProfileScreen() {
  const router = useRouter();
  const [name, setName] = useState("Ananya Sharma");
  const [subtitle, setSubtitle] = useState("Aspiring Trader");
  const [avatar] = useState(require("../assets/images/ProfilePage/image 1.png"));

  const handleSave = () => {
    // TODO: wire up real save
    console.log("save profile", { name, subtitle });
    router.back();
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.header}>Edit Profile</Text>

        <View style={styles.avatarWrap}>
          <Image source={avatar} style={styles.avatar} />
          <TouchableOpacity style={styles.editAvatar} onPress={() => console.log("change avatar")}> 
            <MaterialIcons name="camera-alt" size={18} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Full name</Text>
          <TextInput value={name} onChangeText={setName} style={styles.input} />

          <Text style={styles.label}>Subtitle</Text>
          <TextInput value={subtitle} onChangeText={setSubtitle} style={styles.input} />
        </View>

        <View style={styles.actions}>
          <TouchableOpacity style={[styles.button, styles.cancel]} onPress={() => router.back()}>
            <Text style={[styles.buttonText, styles.cancelText]}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.button, styles.save]} onPress={handleSave}>
            <Text style={styles.buttonText}>Save</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: Platform.OS === "web" ? 40 : 20 }} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },
  container: { flex: 1, padding: 20, justifyContent: "flex-start" },
  header: { fontSize: 22, fontWeight: "800", color: "#0f1724", marginBottom: 18 },

  avatarWrap: { alignItems: "center", marginBottom: 20, position: "relative" },
  avatar: { width: 110, height: 110, borderRadius: 60, marginBottom: 8 },
  editAvatar: {
    position: "absolute",
    right: "38%",
    bottom: 8,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#0f62fe",
    alignItems: "center",
    justifyContent: "center",
  },

  form: { marginTop: 6 },
  label: { color: "#6b7280", marginBottom: 6, fontWeight: "600" },
  input: {
    height: 46,
    borderRadius: 10,
    backgroundColor: "#f6f7fb",
    paddingHorizontal: 12,
    marginBottom: 12,
  },

  actions: { flexDirection: "row", justifyContent: "space-between", marginTop: 18 },
  button: {
    flex: 1,
    height: 48,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 6,
  },
  save: { backgroundColor: "#0f62fe" },
  cancel: { backgroundColor: "#fff", borderWidth: 1, borderColor: "#e5e7eb" },
  buttonText: { color: "#fff", fontWeight: "700" },
  cancelText: { color: "#0f1724" },
});
