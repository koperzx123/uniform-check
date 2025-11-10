// screens/LoginScreen.js
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Easing,
  Image,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { setAppUserId, supabase } from "../config/SupabaseClient";

const { width, height } = Dimensions.get("window");

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // ==== ดาวระยิบ ====
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
    const count = 40;
    return Array.from({ length: count }).map((_, i) => ({
      key: `star-${i}`,
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 2 + 1.2,
    }));
  }, []);

  // ==== shimmer น้ำ ====
  const waterAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.timing(waterAnim, {
        toValue: 1,
        duration: 8000,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: true,
      })
    ).start();
  }, []);
  const shimmerTranslate = waterAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-width * 0.6, width * 0.6],
  });

  // ==== Extract User ====
  function extractUser(data) {
    const row = Array.isArray(data) ? data[0] : data;
    if (!row) return null;
    if (typeof row === "object") {
      const id = row.id || row.user_id || null;
      const username = row.username || row.email || null;
      return id ? { id, username } : null;
    }
    if (typeof row === "string") {
      return { id: row, username: email.trim() };
    }
    return null;
  }

  async function onLogin() {
    if (!email || !password) return alert("กรุณากรอกอีเมลและรหัสผ่าน");
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc("app_login", {
        p_username: email.trim(),
        p_password: password,
      });
      if (error) return alert(error.message || "ล็อกอินไม่สำเร็จ");
      const user = extractUser(data);
      if (!user?.id) return alert("ไม่พบผู้ใช้หรือรหัสผ่านไม่ถูกต้อง");
      setAppUserId(user.id);
      navigation.replace("Main");
    } catch (e) {
      alert(e?.message || "เกิดข้อผิดพลาดขณะล็อกอิน");
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

      {/* ดาวระยิบ */}
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

      <View style={styles.centerWrap}>
        {/* โลโก้อยู่ข้างบนกรอบขาว (ลอยเหนือการ์ด) */}
        <View style={styles.logoContainer}>
          <LinearGradient
            colors={["rgba(165,243,252,0.8)", "rgba(186,230,253,0.2)"]}
            style={styles.logoAura}
          />
          <View style={styles.logoOuter}>
            <Image
              source={{
                uri: "https://img2.pic.in.th/pic/111111111111111134d90c6a83575ca9.png",
              }}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
        </View>

        {/* การ์ดโปร่งแสงเหมือนน้ำ */}
        <BlurView intensity={Platform.OS === "ios" ? 42 : 28} tint="light" style={styles.card}>
          {/* shimmer น้ำ */}
          <Animated.View
            pointerEvents="none"
            style={[
              styles.waterShimmer,
              {
                transform: [{ translateX: shimmerTranslate }, { rotate: "8deg" }],
              },
            ]}
          >
            <LinearGradient
              colors={[
                "rgba(255,255,255,0.00)",
                "rgba(255,255,255,0.25)",
                "rgba(255,255,255,0.00)",
              ]}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={{ flex: 1 }}
            />
          </Animated.View>

          {/* Title */}
          <Text style={styles.title}>UTCC • </Text>
          <Text style={styles.subtitle}>uniform-check</Text>

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

          <TouchableOpacity
            activeOpacity={0.9}
            onPress={onLogin}
            disabled={loading}
            style={[styles.btnShadow, loading && { opacity: 0.6 }]}
          >
            <LinearGradient
              colors={["#A5F3FC", "#7DD3FC", "#38BDF8"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.button}
            >
              {loading ? (
                <ActivityIndicator color="#0F172A" />
              ) : (
                <Text style={styles.btnText}>ENTER THE UTCC CHECK</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.row}>
            <TouchableOpacity onPress={() => navigation.navigate("Register")}>
              <Text style={styles.link}>Create access</Text>
            </TouchableOpacity>
            <Text style={styles.dot}>•</Text>
            <TouchableOpacity onPress={() => navigation.navigate("Forgot")}>
              <Text style={styles.link}>Recover key</Text>
            </TouchableOpacity>
          </View>
        </BlurView>
      </View>
    </View>
  );
}

/** อินพุตสไตล์นีออน (ฟ้าใส) */
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
      <Animated.View
        style={[styles.inputWrap, { borderColor, backgroundColor }]}
      >
        <TextInput
          placeholderTextColor="rgba(15,23,42,0.45)"
          style={styles.input}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          {...props}
        />
      </Animated.View>
      <Animated.View style={[styles.inputGlowLine, { opacity: glow }]} />
    </View>
  );
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

  centerWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-start", // ดันทุกอย่างขึ้นบน
    paddingHorizontal: 22,
    paddingTop: 60, // ระยะห่างจากขอบบนหน้าจอ
  },

  // ===== โลโก้อยู่ข้างบนสุด =====
  logoContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20, // เว้นระยะจากการ์ด
  },
  logoAura: {
    position: "absolute",
    width: 240,
    height: 240,
    borderRadius: 120,
    opacity: 0.4,
  },
  logoOuter: {
    width: 170, // ใหญ่ขึ้น
    height: 170,
    borderRadius: 85,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#60A5FA",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(56,189,248,0.25)",
  },
  logo: {
    width: 135, // เพิ่มขนาดโลโก้ให้เด่นชัด
    height: 135,
  },

  // ===== การ์ดโปร่งแสง (เต็มและอยู่กลางหน้าจอ) =====
  card: {
    width: "95%",                  // กว้างเกือบเต็มจอ
    borderRadius: 28,
    paddingVertical: 40,
    paddingHorizontal: 28,
    borderWidth: 1,
    borderColor: "rgba(147,197,253,0.55)",
    backgroundColor: "rgba(255,255,255,0.26)", // โปร่งใส
    overflow: "hidden",
    shadowColor: "#7DD3FC",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    alignSelf: "center",
  },

  // ===== เอฟเฟกต์ shimmer น้ำ =====
  waterShimmer: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: "65%",
    opacity: 0.25,
  },

  // ===== ข้อความ =====
  title: {
    color: "#0F172A",
    fontSize: 23,
    fontWeight: "800",
    textAlign: "center",
  },
  subtitle: {
    color: "rgba(15,23,42,0.65)",
    marginBottom: 22,
    marginTop: 6,
    textAlign: "center",
  },

  // ===== ช่องกรอกข้อมูล (โปร่งแสง) =====
  inputWrap: {
    borderWidth: 1,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.32)",
    borderColor: "#7DD3FC",
  },
  input: {
    color: "#0F172A",
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  inputGlowLine: {
    height: 2,
    width: "100%",
    borderRadius: 2,
    backgroundColor: "#67E8F9",
  },

  // ===== ปุ่ม =====
  btnShadow: {
    borderRadius: 14,
    overflow: "hidden",
    marginTop: 10,
    shadowColor: "#38BDF8",
    shadowOpacity: 0.6,
    shadowRadius: 12,
  },
  button: {
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  btnText: {
    color: "#0F172A",
    fontWeight: "800",
    letterSpacing: 1,
  },

  // ===== ลิงก์ด้านล่าง =====
  row: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
    marginTop: 18,
  },
  link: { color: "#0369A1", fontWeight: "700" },
  dot: { color: "rgba(15,23,42,0.4)" },
});
