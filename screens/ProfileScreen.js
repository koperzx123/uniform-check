// screens/ProfileScreen.js
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { setAppUserId, supabase } from "../config/SupabaseClient";

export default function ProfileScreen({ navigation }) {
  const [email, setEmail] = useState("-");          // = username จากตาราง
  const [displayName, setDisplayName] = useState("-");
  const [editing, setEditing] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);

        // 1) พยายามใช้ RPC ที่คืนโปรไฟล์ปัจจุบันก่อน (อิง RLS/x-user-id)
        let row = null;
        try {
          const { data, error } = await supabase.rpc("app_me");
          if (!error && data) row = Array.isArray(data) ? data[0] : data;
        } catch (_e) {}

        // 2) ถ้าไม่มี RPC → fallback select โดยอาศัย RLS (จำกัดผู้ใช้ปัจจุบัน)
        if (!row) {
          const { data, error } = await supabase
            .from("app_users")
            .select("username, display_name")
            .limit(1)
            .maybeSingle();
          if (!error) row = data || null;
        }

        const username = row?.username || "-";
        const dn = row?.display_name || row?.username || "-";

        setEmail(username);        // อีเมล = username
        setDisplayName(dn);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  function openEdit() {
    setNameDraft(displayName === "-" ? "" : displayName);
    setEditing(true);
  }

  async function saveName() {
    const newName = (nameDraft || "").trim();
    if (!newName) return alert("กรุณากรอกชื่อ");

    try {
      setSaving(true);

      // 1) ใช้ RPC ตั้งชื่อถ้ามี
      let ok = false;
      try {
        const { error } = await supabase.rpc("app_set_display_name", {
          p_display_name: newName,
        });
        if (!error) ok = true;
      } catch (_e) {}

      // 2) ไม่มี RPC → อัปเดตตรง (ภายใต้ RLS)
      if (!ok) {
        const { error } = await supabase
          .from("app_users")
          .update({ display_name: newName })
          .select("display_name")
          .maybeSingle();
        if (error) throw error;
      }

      setDisplayName(newName);
      setEditing(false);
    } catch (e) {
      alert(e?.message || "บันทึกชื่อไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  }

  async function onLogout() {
    // เคลียร์ทั้ง custom header + Supabase Auth (ถ้ามีใช้)
    try { setAppUserId(null); } catch {}
    try { await supabase.auth.signOut(); } catch {}
    navigation.replace("Login");
  }

  return (
    <View style={s.container}>
      {/* พื้นหลังฟ้าใสให้เข้าธีม Login/Register */}
      <LinearGradient
        colors={["#E0F7FF", "#BAE6FD", "#A5F3FC"]}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <View style={s.card}>
        <Ionicons name="person-circle" size={96} color="#38BDF8" />

        {loading ? (
          <ActivityIndicator style={{ marginTop: 12 }} />
        ) : (
          <>
            {/* ชื่อ (แก้ได้) */}
            <View style={s.nameRow}>
              <Text style={s.nameText} numberOfLines={1}>
                {displayName}
              </Text>
              <TouchableOpacity onPress={openEdit} style={s.nameEditBtn} activeOpacity={0.9}>
                <Ionicons name="pencil" size={16} color="#0F172A" />
                <Text style={s.nameEditTxt}>Edit</Text>
              </TouchableOpacity>
            </View>

            {/* อีเมล = username (อ่านอย่างเดียว) */}
            <Text style={s.emailLabel}>Email </Text>
            <View style={s.emailBox}>
              <Ionicons name="mail-outline" size={16} color="#0F172A" />
              <Text style={s.emailText} numberOfLines={1}>
                {email}
              </Text>
            </View>
          </>
        )}

        <TouchableOpacity style={s.logout} activeOpacity={0.9} onPress={onLogout}>
          <Text style={s.logoutText}>Log out</Text>
        </TouchableOpacity>
      </View>

      {/* Modal แก้ไขชื่อ */}
      <Modal visible={editing} transparent animationType="fade" onRequestClose={() => setEditing(false)}>
        <View style={s.modalWrap}>
          <View style={s.modalCard}>
            <Text style={s.modalTitle}>แก้ไขชื่อแสดง</Text>
            <TextInput
              value={nameDraft}
              onChangeText={setNameDraft}
              placeholder="ชื่อ-นามสกุล"
              placeholderTextColor="rgba(15,23,42,0.45)"
              style={s.modalInput}
              autoCapitalize="words"
            />
            <View style={{ height: 10 }} />
            <View style={{ flexDirection: "row", gap: 10 }}>
              <TouchableOpacity
                style={[s.modalBtn, { flex: 1, backgroundColor: "#E2F3FF", borderColor: "rgba(56,189,248,0.35)" }]}
                onPress={() => setEditing(false)}
                disabled={saving}
              >
                <Text style={[s.modalBtnText, { color: "#0F172A" }]}>ยกเลิก</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.modalBtn, { flex: 1 }]} onPress={saveName} disabled={saving}>
                {saving ? <ActivityIndicator color="#0F172A" /> : <Text style={s.modalBtnText}>บันทึก</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },

  card: {
    width: "90%",
    backgroundColor: "rgba(255,255,255,0.28)", // glass ใส
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(147,197,253,0.55)",
    alignItems: "stretch",
    paddingVertical: 26,
    paddingHorizontal: 18,
    shadowColor: "#7DD3FC",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    gap: 16,
  },

  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    justifyContent: "space-between",
  },
  nameText: {
    color: "#0F172A",
    fontSize: 22,
    fontWeight: "800",
    flex: 1,
  },
  nameEditBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#BAE6FD",
    borderWidth: 1,
    borderColor: "rgba(56,189,248,0.35)",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  nameEditTxt: { color: "#0F172A", fontWeight: "800", fontSize: 12 },

  emailLabel: {
    color: "rgba(15,23,42,0.65)",
    fontSize: 12,
    marginTop: -4,
  },
  emailBox: {
    backgroundColor: "rgba(255,255,255,0.55)",
    borderWidth: 1,
    borderColor: "rgba(147,197,253,0.55)",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  emailText: { color: "#0F172A", fontWeight: "700", flexShrink: 1 },

  logout: {
    marginTop: 6,
    backgroundColor: "#FCA5A5",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.35)",
  },
  logoutText: { color: "#7A0A0A", fontWeight: "800" },

  // Modal
  modalWrap: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  modalCard: {
    width: "86%",
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: "rgba(147,197,253,0.6)",
    shadowColor: "#7DD3FC",
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
  },
  modalTitle: {
    color: "#0F172A",
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 10,
    textAlign: "center",
  },
  modalInput: {
    color: "#0F172A",
    backgroundColor: "rgba(255,255,255,0.7)",
    borderWidth: 1,
    borderColor: "#7DD3FC",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  modalBtn: {
    backgroundColor: "#38BDF8",
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(56,189,248,0.35)",
  },
  modalBtnText: {
    color: "#0F172A",
    fontWeight: "800",
    fontSize: 16,
  },
});
