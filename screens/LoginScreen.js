// screens/LoginScreen.js
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import * as SecureStore from "expo-secure-store";
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

  // ================================
  // Extract RPC return
  // ================================
  function extractUser(data) {
    const row = Array.isArray(data) ? data[0] : data;
    if (!row) return null;

    const id = row.id || row.user_id || null;
    const username = row.username || row.email || email.trim();

    return id ? { id, username } : null;
  }

  // ================================
  // LOGIN
  // ================================
  async function onLogin() {
    if (!email || !password) return alert("กรุณากรอกอีเมลและรหัสผ่าน");

    try {
      setLoading(true);

      console.log("🚀 Sending RPC login...");
      const { data, error } = await supabase.rpc("app_login", {
        p_username: email.trim(),
        p_password: password,
      });

      console.log("🔍 RPC RESULT =", data);

      if (error) {
        console.log("❌ RPC ERROR =", error);
        return alert("ล็อกอินไม่สำเร็จ");
      }

      const user = extractUser(data);
      if (!user?.id) return alert("ไม่พบผู้ใช้หรือรหัสผ่านไม่ถูกต้อง");

      console.log("👤 USER ID =", user.id);

      // ⭐ บันทึก user_id ลงเครื่อง + ตรวจสอบ
      try {
        await SecureStore.setItemAsync("user_id", user.id.toString());
        const test = await SecureStore.getItemAsync("user_id");

        console.log("🔥 TEST STORE =", test);

        if (!test) {
          alert("SecureStore ไม่สามารถบันทึก user id ได้!");
          return;
        }
      } catch (err) {
        console.log("❌ SecureStore error", err);
        alert("เกิดข้อผิดพลาดในการบันทึก user id");
        return;
      }

      // ⭐ ใส่ userId ให้ Supabase header
      setAppUserId(user.id.toString());

      console.log("➡️ Navigating to Main...");
      navigation.replace("Main");

    } catch (e) {
      alert(e?.message || "เกิดข้อผิดพลาดขณะล็อกอิน");
    } finally {
      setLoading(false);
    }
  }

  // ================================
  // UI
  // ================================
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#E0F7FF", "#BAE6FD", "#A5F3FC"]}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* ออโรร่า */}
      <LinearGradient
        colors={["rgba(186,230,253,0.5)", "rgba(165,243,252,0.45)", "transparent"]}
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

      {/* LOGO */}
      <View style={styles.centerWrap}>
        <View style={styles.logoContainer}>
          <LinearGradient
            colors={["rgba(165,243,252,0.45)", "rgba(186,230,253,0.15)", "transparent"]}
            style={styles.logoAura}
          />
          <Image
            source={{
              uri: "https://img5.pic.in.th/file/secure-sv1/11114b527e4e25881f80.png",
            }}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        <BlurView
          intensity={Platform.OS === "ios" ? 42 : 28}
          tint="light"
          style={styles.card}
        >
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
              colors={["transparent", "rgba(255,255,255,0.25)", "transparent"]}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={{ flex: 1 }}
            />
          </Animated.View>

          <Text style={styles.title}>UTCC •</Text>
          <Text style={styles.subtitle}>Uniform Validation</Text>

          <FuturisticInput
            label="Email address"
            placeholder="Email address"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <FuturisticInput
            label="Password"
            placeholder="Password"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
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
                <Text style={styles.btnText}>ENTER THE Uniform Validation</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {/* Links */}
          <View style={styles.row}>
            <TouchableOpacity onPress={() => navigation.navigate("Register")}>
              <Text style={styles.link}>Register</Text>
            </TouchableOpacity>
            <Text style={styles.dot}>•</Text>
            <TouchableOpacity onPress={() => navigation.navigate("Forgot")}>
              <Text style={styles.link}>Reset password</Text>
            </TouchableOpacity>
          </View>
        </BlurView>
      </View>
    </View>
  );
}

/* ============================
   Futuristic Input
============================ */
function FuturisticInput({ label, ...props }) {
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
    <View style={{ width: "100%", marginBottom: 16 }}>
      <Text style={{ color: "#0F172A", fontWeight: "700", marginBottom: 6, marginLeft: 4 }}>
        {label}
      </Text>

      <Animated.View style={[styles.inputWrap, { borderColor, backgroundColor }]}>
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

/* ============================
   Styles
============================ */
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
    justifyContent: "flex-start",
    paddingHorizontal: 22,
    paddingTop: 60,
  },

  logoContainer: { alignItems: "center", marginBottom: 20 },
  logoAura: {
    position: "absolute",
    width: 260,
    height: 260,
    borderRadius: 130,
    opacity: 0.45,
  },
  logo: { width: 210, height: 210 },

  card: {
    width: "95%",
    borderRadius: 28,
    paddingVertical: 40,
    paddingHorizontal: 28,
    borderWidth: 1,
    borderColor: "rgba(147,197,253,0.55)",
    backgroundColor: "rgba(255,255,255,0.26)",
  },

  waterShimmer: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: "65%",
    opacity: 0.25,
  },

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

  inputWrap: {
    borderWidth: 1,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.32)",
  },

  input: {
    color: "#0F172A",
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },

  inputGlowLine: { height: 2, backgroundColor: "#67E8F9", borderRadius: 2 },

  btnShadow: { marginTop: 10, borderRadius: 14 },
  button: { paddingVertical: 14, borderRadius: 14, alignItems: "center" },
  btnText: { color: "#0F172A", fontWeight: "800" },

  row: { flexDirection: "row", justifyContent: "center", marginTop: 18, gap: 10 },
  link: { color: "#0369A1", fontWeight: "700" },
  dot: { color: "rgba(15,23,42,0.4)" },
});
