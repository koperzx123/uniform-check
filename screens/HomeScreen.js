import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { ImageBackground, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function HomeScreen({ navigation }) {
  return (
    <ImageBackground
      source={{
        uri: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1400&q=80",
      }}
      style={styles.bg}
      blurRadius={10}
    >
      {/* 🔥 เลเยอร์มืดทับพื้นหลัง เพื่อให้ไอคอนเด่นขึ้น */}
      <LinearGradient
        colors={[
          "rgba(0,0,0,0.50)",
          "rgba(0,0,0,0.35)",
          "rgba(0,0,0,0.20)"
        ]}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.container}>
        
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>UTCC • Uniform Check</Text>
          <Text style={styles.subtitle}>ระบบตรวจสอบชุดนักศึกษา ✦</Text>
        </View>

        {/* ปุ่มต่างๆ */}
        <View style={styles.cardGrid}>
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => navigation.navigate("เช็คชุดนักศึกษา")}
          >
            <BlurView intensity={30} tint="dark" style={styles.card}>
              <Ionicons name="shirt-outline" size={44} color="#38BDF8" />
              <Text style={styles.cardText}>เช็คเครื่องแต่งกาย</Text>
            </BlurView>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => navigation.navigate("ระเบียบการแต่งกาย")}
          >
            <BlurView intensity={30} tint="dark" style={styles.card}>
              <Ionicons name="book-outline" size={44} color="#60A5FA" />
              <Text style={styles.cardText}>อ่านระเบียบ</Text>
            </BlurView>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => navigation.navigate("โปรไฟล์")}
          >
            <BlurView intensity={30} tint="dark" style={styles.card}>
              <Ionicons name="person-outline" size={44} color="#7DD3FC" />
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
    marginBottom: 28,
  },

  // 🟦 ข้อความอ่านง่ายขึ้น (เป็นสีขาว)
  title: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: 0.5,
    textAlign: "center",
  },
  subtitle: {
    color: "rgba(255,255,255,0.85)",
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

    backgroundColor: "rgba(255,255,255,0.10)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.30)",

    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },

    overflow: "hidden",
  },

  // 🟦 ปรับเป็นขาว อ่านชัดขึ้น
  cardText: {
    color: "#FFFFFF",
    fontSize: 14,
    marginTop: 10,
    textAlign: "center",
    fontWeight: "700",
  },
});
