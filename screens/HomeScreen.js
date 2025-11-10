import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { ImageBackground, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function HomeScreen({ navigation }) {
  return (
    <ImageBackground
      source={{ uri: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1400&q=80" }}
      style={styles.bg}
      blurRadius={8} // เบลอเล็กน้อย ให้ภาพยังดูมีมิติ
    >
      {/* ใส/โปร่งแสง: gradient บางๆ เพื่อให้อ่านตัวหนังสือชัดขึ้น */}
      <LinearGradient
        colors={["rgba(255,255,255,0.20)", "rgba(255,255,255,0.10)", "rgba(255,255,255,0.05)"]}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.container}>
        {/* แถบไฮไลต์บางๆ ใต้หัวเรื่อง */}
        <View style={styles.header}>
          <Text style={styles.title}>UTCC • Uniform Check</Text>
          <Text style={styles.subtitle}>ระบบตรวจสอบชุดนักศึกษา ✦</Text>
        </View>

        <View style={styles.cardGrid}>
          <TouchableOpacity activeOpacity={0.9} onPress={() => navigation.navigate("เช็คชุดนักศึกษา")}>
            <BlurView intensity={26} tint="light" style={styles.card}>
              <Ionicons name="shirt-outline" size={44} color="#0891B2" />
              <Text style={styles.cardText}>เช็คเครื่องแต่งกาย</Text>
            </BlurView>
          </TouchableOpacity>

          <TouchableOpacity activeOpacity={0.9} onPress={() => navigation.navigate("ระเบียบการแต่งกาย")}>
            <BlurView intensity={26} tint="light" style={styles.card}>
              <Ionicons name="book-outline" size={44} color="#0284C7" />
              <Text style={styles.cardText}>อ่านระเบียบ</Text>
            </BlurView>
          </TouchableOpacity>

          <TouchableOpacity activeOpacity={0.9} onPress={() => navigation.navigate("โปรไฟล์")}>
            <BlurView intensity={26} tint="light" style={styles.card}>
              <Ionicons name="person-outline" size={44} color="#06B6D4" />
              <Text style={styles.cardText}>โปรไฟล์ผู้ใช้</Text>
            </BlurView>
          </TouchableOpacity>
        </View>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: {
    flex: 1,
    resizeMode: "cover",
  },
  container: {
    flex: 1,
    paddingHorizontal: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: 24,
  },
  title: {
    color: "#0F172A",
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: 0.5,
    textAlign: "center",
  },
  subtitle: {
    color: "rgba(15,23,42,0.75)",
    fontSize: 16,
    marginTop: 6,
    textAlign: "center",
  },
  cardGrid: {
    width: "100%",
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 16,
  },
  card: {
    width: 140,
    height: 140,
    borderRadius: 20,
    padding: 14,
    justifyContent: "center",
    alignItems: "center",

    // กระจกใส
    backgroundColor: "rgba(255,255,255,0.20)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.35)",

    // เงานุ่มๆ ให้ลอยจากพื้นหลัง
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    overflow: "hidden",
  },
  cardText: {
    color: "#0F172A",
    fontSize: 14,
    marginTop: 10,
    textAlign: "center",
    fontWeight: "700",
  },
});
