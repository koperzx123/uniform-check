import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import * as Linking from "expo-linking";
import { useEffect, useMemo, useRef, useState } from "react";
import { Alert, Animated, Dimensions, Easing, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { supabase } from "../config/SupabaseClient";

const { width, height } = Dimensions.get("window");

export default function ForgotScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  // ดาวลอยช้า ๆ
  const starAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.timing(starAnim, { toValue: 1, duration: 12000, easing: Easing.linear, useNativeDriver: true })
    ).start();
  }, []);
  const stars = useMemo(() => {
    const count = 36;
    return Array.from({ length: count }).map((_, i) => ({
      key: `star-${i}`,
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 2 + 1.2
    }));
  }, []);

  async function onSend() {
    if (!email) return Alert.alert("กรุณากรอกอีเมล");

    try {
      setLoading(true);

      // สร้าง redirect URL ให้เหมาะกับแอป (แนะนำใช้ scheme ของคุณเอง)
      // 1) ตั้งค่าใน app.json > scheme เช่น "utccuniform"
      // 2) ใน Supabase Authentication > URL ให้ใส่ลิงก์นี้
      // ตัวอย่าง:
      const redirectTo = Linking.createURL("/auth/callback"); 
      // ถ้าใช้เว็บ ให้เปลี่ยนเป็น https://YOURDOMAIN.com/auth/callback

      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });

      if (error) return Alert.alert("ส่งลิงก์ไม่สำเร็จ", error.message);
      Alert.alert("สำเร็จ", "ส่งลิงก์รีเซ็ตรหัสผ่านแล้ว โปรดตรวจอีเมลของคุณ");
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      {/* พื้นหลังกาแล็กซี */}
      <LinearGradient
        colors={["#060816", "#0b0f2d", "#1a1f4d"]}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {/* ออโรร่า */}
      <LinearGradient
        colors={["rgba(0,255,255,0.25)", "rgba(138,43,226,0.22)", "transparent"]}
        start={{ x: 0.2, y: 0.1 }}
        end={{ x: 1, y: 1 }}
        style={styles.aurora}
      />

      {/* ดาว */}
      {stars.map((s, idx) => {
        const translateY = starAnim.interpolate({ inputRange: [0, 1], outputRange: [s.y, s.y - 40] });
        const opacity = starAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.4, 1, 0.4] });
        return (
          <Animated.View
            key={s.key}
            style={[styles.star, { left: s.x, transform: [{ translateY }], opacity, width: s.size, height: s.size, borderRadius: s.size / 2 }]}
          />
        );
      })}

      {/* การ์ดกระจก */}
      <View style={styles.centerWrap}>
        <BlurView intensity={Platform.OS === "ios" ? 35 : 20} tint="dark" style={styles.card}>
          <Text style={styles.title}>Recover Access</Text>
          <Text style={styles.subtitle}>ป้อนอีเมลเพื่อรับลิงก์รีเซ็ตรหัสผ่าน</Text>

          <FuturisticInput
            placeholder="Email address"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <TouchableOpacity disabled={loading} onPress={onSend} activeOpacity={0.9} style={styles.btnShadow}>
            <LinearGradient colors={["#6EE7F9", "#8B5CF6", "#EC4899"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.button}>
              <Text style={styles.btnText}>{loading ? "SENDING..." : "SEND RESET LINK"}</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backLink}>
            <Text style={styles.linkText}>ย้อนกลับไปหน้าเข้าสู่ระบบ</Text>
          </TouchableOpacity>
        </BlurView>

        <LinearGradient
          colors={["transparent", "rgba(110,231,249,0.35)", "transparent"]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.underGlow}
        />
      </View>
    </View>
  );
}

function FuturisticInput(props) {
  const [focused, setFocused] = useState(false);
  const glow = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(glow, { toValue: focused ? 1 : 0, duration: 220, easing: Easing.out(Easing.quad), useNativeDriver: false }).start();
  }, [focused]);

  const borderColor = glow.interpolate({ inputRange: [0, 1], outputRange: ["rgba(255,255,255,0.12)", "rgba(110,231,249,0.9)"] });
  const shadowOpacity = glow.interpolate({ inputRange: [0, 1], outputRange: [0, 0.6] });

  return (
    <View style={{ width: "100%", marginBottom: 14 }}>
      <Animated.View style={[styles.inputWrap, { borderColor, shadowOpacity }]}>
        <TextInput placeholderTextColor="rgba(255,255,255,0.5)" style={styles.input} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} {...props} />
      </Animated.View>
      <Animated.View style={[styles.inputGlowLine, { opacity: glow }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#060816" },
  aurora: {
    position: "absolute",
    width: width * 1.2,
    height: width * 1.2,
    borderRadius: width * 0.6,
    top: -width * 0.3,
    right: -width * 0.3,
    opacity: 0.5,
    transform: [{ rotate: "25deg" }],
  },
  star: { position: "absolute", backgroundColor: "#fff" },
  centerWrap: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 22 },
  card: {
    width: "100%",
    borderRadius: 22,
    padding: 22,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(10,14,28,0.45)",
    overflow: "hidden",
  },
  title: { color: "#E5E7EB", fontSize: 22, fontWeight: "700", letterSpacing: 0.5 },
  subtitle: { color: "rgba(229,231,235,0.65)", marginBottom: 18, marginTop: 6 },
  inputWrap: {
    borderWidth: 1,
    borderRadius: 14,
    backgroundColor: "rgba(18,24,38,0.65)",
    shadowColor: "#6EE7F9",
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 8,
  },
  input: { color: "#fff", paddingHorizontal: 14, paddingVertical: 12, fontSize: 16 },
  inputGlowLine: { height: 2, width: "100%", borderRadius: 2, backgroundColor: "rgba(110,231,249,0.8)" },
  btnShadow: {
    borderRadius: 14,
    overflow: "hidden",
    marginTop: 8,
    shadowColor: "#8B5CF6",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 14,
    elevation: 8,
  },
  button: { paddingVertical: 14, borderRadius: 14, alignItems: "center" },
  btnText: { color: "#0b0f1f", fontWeight: "800", letterSpacing: 1 },
  backLink: { alignItems: "center", marginTop: 12 },
  linkText: { color: "#A5B4FC", fontWeight: "600" },
  underGlow: { width: "70%", height: 2, marginTop: 12, borderRadius: 2 },
});
