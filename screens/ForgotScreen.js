// screens/ForgotScreen.js
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import * as Linking from "expo-linking";
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

const { width, height } = Dimensions.get("window");

export default function ForgotScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  // ดาวลอยช้า ๆ (ฟ้าใส)
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
    const count = 36;
    return Array.from({ length: count }).map((_, i) => ({
      key: `star-${i}`,
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 2 + 1.2,
    }));
  }, []);

  async function onSend() {
    if (!email) return Alert.alert("กรุณากรอกอีเมล");

    try {
      setLoading(true);

      // สร้าง redirect URL ให้ตรงกับแอป/โดเมนของคุณ
      // ตัวอย่าง deep link: app.json -> "scheme": "utccuniform"
      // แล้วใช้: utccuniform://auth/callback
      const redirectTo = Linking.createURL("/auth/callback");

      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo });
      if (error) return Alert.alert("ส่งลิงก์ไม่สำเร็จ", error.message);

      Alert.alert("สำเร็จ", "ส่งลิงก์รีเซ็ตรหัสผ่านแล้ว โปรดตรวจอีเมลของคุณ");
      navigation.goBack();
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

      {/* ออโรร่าโทนฟ้า */}
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

      {/* การ์ดกระจกโปร่งแสง */}
      <View style={styles.centerWrap}>
        <BlurView intensity={Platform.OS === "ios" ? 42 : 28} tint="light" style={styles.card}>
          <Text style={styles.title}>Reset password</Text>
          <Text style={styles.subtitle}>UTCC Uniform Validation</Text>

          <FuturisticInput
            placeholder="Email address"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <TouchableOpacity disabled={loading} onPress={onSend} activeOpacity={0.9} style={styles.btnShadow}>
            <LinearGradient
              colors={["#A5F3FC", "#7DD3FC", "#38BDF8"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.button}
            >
              <Text style={styles.btnText}>{loading ? "SENDING..." : "SEND RESET LINK"}</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backLink}>
            <Text style={styles.linkText}>Go back to the login</Text>
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
  container: { flex: 1, backgroundColor: "#E0F7FF" }, // ฟ้าอ่อนสว่าง

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
    justifyContent: "center",
    paddingHorizontal: 22,
  },

  card: {
    width: "100%",
    borderRadius: 24,
    padding: 26,
    borderWidth: 1,
    borderColor: "rgba(147,197,253,0.55)",
    backgroundColor: "rgba(255,255,255,0.26)", // โปร่งแสงเหมือนน้ำ
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
    marginTop: 8,
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

  underGlow: { width: "70%", height: 2, marginTop: 12, borderRadius: 2, backgroundColor: "#67E8F9" },
});
