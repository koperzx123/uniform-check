// screens/RegisterScreen.js
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Dimensions,
  Easing,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "../config/SupabaseClient";

const { width } = Dimensions.get("window");

export default function RegisterScreen({ navigation }) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  // ---- แอนิเมชันดาว (ฟ้าใส) ----
  const starAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.timing(starAnim, {
        toValue: 1,
        duration: 12000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, []);
  const stars = useMemo(() => {
    const count = 32;
    return Array.from({ length: count }).map((_, i) => ({
      key: `star-${i}`,
      x: Math.random() * width,
      y: Math.random() * width, // พอประมาณให้ลอยทั่วจอ
      size: Math.random() * 2 + 1.2,
    }));
  }, []);

  // ---- สมัคร + เก็บชื่อ ----
  async function onRegister() {
    if (loading) return;
    if (!fullName || !email || !password || !confirm) {
      Alert.alert("กรุณากรอกให้ครบ");
      return;
    }
    if (!isValidEmail(email)) {
      Alert.alert("อีเมลไม่ถูกต้อง");
      return;
    }
    if (password !== confirm) {
      Alert.alert("รหัสผ่านไม่ตรงกัน");
      return;
    }
    if (fullName.trim().length < 2) {
      Alert.alert("กรุณากรอกชื่อให้ถูกต้อง");
      return;
    }

    try {
      setLoading(true);

      const { data, error } = await supabase.rpc("app_register", {
        p_username: email.trim(),
        p_password: password,
        p_display_name: fullName.trim(),
      });

      if (error) {
        // ถ้ายังไม่ได้สร้างฟังก์ชัน/เปิด pgcrypto จะได้ 42883
        if (String(error.code) === "42883") {
          Alert.alert(
            "ยังไม่ได้ตั้งค่าในฐานข้อมูล",
            "โปรดรัน SQL: create extension pgcrypto; และสร้างฟังก์ชัน app_register ตามที่ส่งไว้ก่อนหน้านี้"
          );
          return;
        }
        throw error;
      }

      const row = Array.isArray(data) ? data[0] : data;
      const userId =
        (row && (row.user_id || row.id)) ||
        (typeof data === "string" ? data : null);

      const displayName =
        (row && (row.display_name || row.username)) || fullName.trim();

      if (!userId) {
        Alert.alert("สมัครไม่สำเร็จ", "ระบบไม่สามารถคืนค่าได้");
        return;
      }

      Alert.alert("สมัครสำเร็จ", `สร้างบัญชี ${displayName} สำเร็จแล้ว!`, [
        { text: "ไปล็อกอิน", onPress: () => navigation.replace("Login") },
      ]);
    } catch (err) {
      console.error("❌ Register error:", err);
      if (String(err.code) === "23505") {
        Alert.alert(
          "สมัครไม่สำเร็จ",
          "อีเมลนี้ถูกใช้แล้ว ลองล็อกอินหรือตั้งรหัสผ่านใหม่",
          [{ text: "ไปล็อกอิน", onPress: () => navigation.replace("Login") }]
        );
        return;
      }
      Alert.alert("เกิดข้อผิดพลาด", err?.message || "ไม่สามารถสมัครได้");
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      {/* พื้นหลังฟ้าใส */}
      <LinearGradient
        colors={["#E0F7FF", "#BAE6FD", "#A5F3FC"]}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* ออโรร่า */}
      <LinearGradient
        colors={["rgba(186,230,253,0.6)", "rgba(165,243,252,0.45)", "transparent"]}
        start={{ x: 0.3, y: 0.2 }}
        end={{ x: 1, y: 1 }}
        style={styles.aurora}
      />

      {/* ดาว */}
      {stars.map((s) => {
        const translateY = starAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [s.y, s.y - 40],
        });
        const opacity = starAnim.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: [0.3, 0.9, 0.3],
        });
        return (
          <Animated.View
            key={s.key}
            style={[
              styles.star,
              {
                left: s.x,
                transform: [{ translateY }],
                opacity,
                width: s.size,
                height: s.size,
                borderRadius: s.size / 2,
              },
            ]}
          />
        );
      })}

      {/* การ์ด */}
      <View style={styles.centerWrap}>
        <BlurView intensity={Platform.OS === "ios" ? 42 : 28} tint="light" style={styles.card}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>ลงทะเบียนเพื่อใช้งาน UTCC Uniform Check</Text>

          <FuturisticInput
            placeholder="Full name"
            value={fullName}
            onChangeText={setFullName}
            autoCapitalize="words"
          />
          <FuturisticInput
            placeholder="Email address"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <FuturisticInput
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          <FuturisticInput
            placeholder="Confirm password"
            value={confirm}
            onChangeText={setConfirm}
            secureTextEntry
          />

          <TouchableOpacity
            disabled={loading}
            activeOpacity={0.9}
            onPress={onRegister}
            style={[styles.btnShadow, loading ? { opacity: 0.6 } : null]}
          >
            <LinearGradient
              colors={["#A5F3FC", "#7DD3FC", "#38BDF8"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.button}
            >
              <Text style={styles.btnText}>
                {loading ? "CREATING..." : "CREATE ACCOUNT"}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.replace("Login")} style={styles.backLink}>
            <Text style={styles.linkText}>Already have an account? Go back to login</Text>
          </TouchableOpacity>
        </BlurView>

        <LinearGradient
          colors={["transparent", "rgba(56,189,248,0.45)", "transparent"]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.underGlow}
        />
      </View>
    </View>
  );
}

/** อินพุตโปร่งแสง */
function FuturisticInput(props) {
  const [focused, setFocused] = useState(false);
  const glow = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(glow, {
      toValue: focused ? 1 : 0,
      duration: 220,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false,
    }).start();
  }, [focused]);

  const borderColor = glow.interpolate({
    inputRange: [0, 1],
    outputRange: ["rgba(3,105,161,0.18)", "rgba(56,189,248,0.9)"],
  });
  const backgroundColor = glow.interpolate({
    inputRange: [0, 1],
    outputRange: ["rgba(255,255,255,0.28)", "rgba(255,255,255,0.4)"],
  });

  return (
    <View style={{ width: "100%", marginBottom: 14 }}>
      <Animated.View style={[styles.inputWrap, { borderColor, backgroundColor }]}>
        <TextInput
          placeholderTextColor="rgba(15,23,42,0.45)"
          style={styles.input}
          {...props}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
      </Animated.View>
      <Animated.View style={[styles.inputGlowLine, { opacity: glow }]} />
    </View>
  );
}

function isValidEmail(e) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#E0F7FF" },
  aurora: {
    position: "absolute",
    width: width * 1.2,
    height: width * 1.2,
    borderRadius: width * 0.6,
    top: -width * 0.3,
    right: -width * 0.3,
    opacity: 0.8,
    backgroundColor: "#CFFAFE",
  },
  star: { position: "absolute", backgroundColor: "#CFFAFE" },
  centerWrap: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 22 },

  card: {
    width: "100%",
    borderRadius: 24,
    padding: 26,
    borderWidth: 1,
    borderColor: "rgba(147,197,253,0.55)",
    backgroundColor: "rgba(255,255,255,0.26)",
    overflow: "hidden",
    shadowColor: "#7DD3FC",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
  },

  title: {
    color: "#0F172A",
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: 0.5,
    textAlign: "center",
  },
  subtitle: {
    color: "rgba(15,23,42,0.65)",
    marginBottom: 18,
    marginTop: 4,
    textAlign: "center",
  },

  inputWrap: {
    borderWidth: 1,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.28)",
    borderColor: "#7DD3FC",
    shadowColor: "#67E8F9",
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 10,
  },
  input: { color: "#0F172A", paddingHorizontal: 14, paddingVertical: 12, fontSize: 16 },
  inputGlowLine: { height: 2, width: "100%", borderRadius: 2, backgroundColor: "#67E8F9" },

  btnShadow: {
    borderRadius: 14,
    overflow: "hidden",
    marginTop: 12,
    shadowColor: "#38BDF8",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 12,
    elevation: 8,
  },
  button: { paddingVertical: 14, borderRadius: 14, alignItems: "center" },
  btnText: { color: "#0F172A", fontWeight: "800", letterSpacing: 1 },

  backLink: { alignItems: "center", marginTop: 12 },
  linkText: { color: "#0369A1", fontWeight: "700" },

  underGlow: {
    width: "70%",
    height: 2,
    marginTop: 12,
    borderRadius: 2,
    backgroundColor: "#67E8F9",
  },
});
