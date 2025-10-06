import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useMemo, useRef, useState } from "react";
import {
    ActivityIndicator,
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

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

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
      delay: Math.random() * 10000,
    }));
  }, []);

  async function onLogin() {
    if (!email || !password) {
      alert("กรุณากรอกอีเมลและรหัสผ่าน");
      return;
    }
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) return alert(error.message);
      // ✅ ไปแท็บหลักหลังล็อกอิน
      navigation.replace("Main");
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#060816", "#0b0f2d", "#1a1f4d"]}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <LinearGradient
        colors={["rgba(0,255,255,0.25)", "rgba(138,43,226,0.22)", "transparent"]}
        start={{ x: 0.2, y: 0.1 }}
        end={{ x: 1, y: 1 }}
        style={styles.aurora}
      />

      {stars.map((s) => {
        const translateY = starAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [s.y, s.y - 40],
        });
        const opacity = starAnim.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: [0.4, 1, 0.4],
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

      {/* การ์ดกระจก */}
      <View style={styles.centerWrap}>
        <BlurView intensity={Platform.OS === "ios" ? 35 : 20} tint="dark" style={styles.card}>
          <Text style={styles.brandTop}>⟡</Text>
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

          {/* ปุ่มนีออน */}
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={onLogin}
            disabled={loading}
            style={[styles.btnShadow, loading && { opacity: 0.6 }]}
          >
            <LinearGradient
              colors={["#6EE7F9", "#8B5CF6", "#EC4899"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.button}
            >
              {loading ? (
                <ActivityIndicator color="#0b0f1f" />
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

/** อินพุตสไตล์นีออน + เส้นเรืองแสงใต้ช่อง */
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
    outputRange: ["rgba(255,255,255,0.12)", "rgba(110,231,249,0.9)"],
  });

  const shadowOpacity = glow.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.6],
  });

  return (
    <View style={{ width: "100%", marginBottom: 14 }}>
      <Animated.View style={[styles.inputWrap, { borderColor, shadowOpacity }]}>
        <TextInput
          placeholderTextColor="rgba(255,255,255,0.5)"
          style={styles.input}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          {...props}
        />
      </Animated.View>
      <Animated.View
        style={[
          styles.inputGlowLine,
          {
            opacity: glow,
          },
        ]}
      />
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

  centerWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 22,
  },

  card: {
    width: "100%",
    borderRadius: 22,
    padding: 22,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(10,14,28,0.45)",
    overflow: "hidden",
  },

  brandTop: {
    position: "absolute",
    top: 10,
    right: 16,
    color: "rgba(255,255,255,0.35)",
    fontSize: 16,
  },

  title: {
    color: "#E5E7EB",
    fontSize: 22,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  subtitle: {
    color: "rgba(229,231,235,0.65)",
    marginBottom: 18,
    marginTop: 4,
  },

  inputWrap: {
    borderWidth: 1,
    borderRadius: 14,
    backgroundColor: "rgba(18,24,38,0.65)",
    shadowColor: "#6EE7F9",
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 8,
  },
  input: {
    color: "#fff",
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  inputGlowLine: {
    height: 2,
    width: "100%",
    borderRadius: 2,
    backgroundColor: "rgba(110,231,249,0.8)",
  },

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
  button: {
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  btnText: {
    color: "#0b0f1f",
    fontWeight: "800",
    letterSpacing: 1,
  },

  row: { flexDirection: "row", justifyContent: "center", gap: 10, marginTop: 14 },
  link: { color: "#A5B4FC", fontWeight: "600" },
  dot: { color: "rgba(255,255,255,0.4)" },

  underGlow: { width: "70%", height: 2, marginTop: 12, borderRadius: 2 },
});
