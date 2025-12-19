// screens/ProfileScreen.js
import { Ionicons } from "@expo/vector-icons";
import { Buffer } from "buffer";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import * as SecureStore from "expo-secure-store";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { setAppUserId, supabase } from "../config/SupabaseClient";

export default function ProfileScreen({ navigation }) {
  const [userId, setUserId] = useState(null);
  const [email, setEmail] = useState("-");
  const [displayName, setDisplayName] = useState("-");
  const [profileUrl, setProfileUrl] = useState(null);

  const [loading, setLoading] = useState(true);

  // MODALS + STATE
  const [editing, setEditing] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [saving, setSaving] = useState(false);

  const [passModal, setPassModal] = useState(false);
  const [oldPass, setOldPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [savingPass, setSavingPass] = useState(false);

  const [uploading, setUploading] = useState(false);

  // ============================================================
  // LOAD USER PROFILE
  // ============================================================
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);

        // ดึง user_id จาก SecureStore → เพราะคุณไม่ใช้ Supabase Auth
        const storedId = await SecureStore.getItemAsync("user_id");
        console.log("📌 Using stored userId =", storedId);

        if (!storedId) {
          alert("ไม่พบข้อมูลผู้ใช้ในเครื่อง");
          return;
        }

        // เรียก RPC app_me(user_id)
        const { data, error } = await supabase.rpc("app_me", {
          user_id: storedId,
        });

        console.log("RPC RESULT =", data);

        if (error || !data || data.length === 0) {
          alert("โหลดข้อมูลผู้ใช้ล้มเหลว");
          return;
        }

        const user = data[0];

        setUserId(user.id);
        setEmail(user.username);
        setDisplayName(user.display_name || user.username);
        setProfileUrl(user.profile_url);

        // สำคัญมากสำหรับ Storage (RLS)
        setAppUserId(user.id);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ============================================================
  // UPDATE NAME
  // ============================================================
  async function saveName() {
    if (!nameDraft.trim()) return alert("กรุณากรอกชื่อ");

    try {
      setSaving(true);

      const { error } = await supabase
        .from("app_users")
        .update({ display_name: nameDraft.trim() })
        .eq("id", userId);

      if (error) return alert("อัปเดตชื่อไม่สำเร็จ");

      setDisplayName(nameDraft.trim());
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  // ============================================================
  // CHANGE PASSWORD
  // ============================================================
  async function changePassword() {
    if (!oldPass.trim() || !newPass.trim() || !confirmPass.trim()) {
      return alert("กรุณากรอกข้อมูลให้ครบ");
    }

    if (newPass !== confirmPass) {
      return alert("รหัสใหม่ไม่ตรงกัน");
    }

    try {
      setSavingPass(true);

      const { data, error } = await supabase.rpc("change_password_bcrypt", {
        p_user_id: userId,
        p_old_password: oldPass,
        p_new_password: newPass,
      });

      if (error) {
        return alert("แก้ไขรหัสผ่านล้มเหลว");
      }

      if (data === "WRONG_PASSWORD") return alert("รหัสเดิมไม่ถูกต้อง");
      if (data !== "OK") return alert("อัปเดตรหัสผ่านล้มเหลว");

      alert("เปลี่ยนรหัสผ่านสำเร็จ!");
      setPassModal(false);
      setOldPass("");
      setNewPass("");
      setConfirmPass("");
    } finally {
      setSavingPass(false);
    }
  }

  // ============================================================
  // UPLOAD PROFILE IMAGE
  // ============================================================
  async function pickProfileImage() {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) return alert("ต้องอนุญาตเข้าถึงคลังภาพ");

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: "images",
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: true,
      });

      if (result.canceled) return;

      const asset = result.assets[0];
      const ext = asset.uri.split(".").pop();
      const fileName = `${userId}_profile_${Date.now()}.${ext}`;

      const fileBytes = Buffer.from(asset.base64, "base64");

      setUploading(true);

      const { error } = await supabase.storage
        .from("profile_pics")
        .upload(fileName, fileBytes, {
          contentType: `image/${ext}`,
          upsert: true,
        });

      if (error) {
        console.log(error);
        return alert("อัปโหลดรูปไม่สำเร็จ");
      }

      const { data: urlData } = supabase.storage
        .from("profile_pics")
        .getPublicUrl(fileName);

      await supabase
        .from("app_users")
        .update({ profile_url: urlData.publicUrl })
        .eq("id", userId);

      setProfileUrl(urlData.publicUrl);
      alert("อัปเดตรูปโปรไฟล์สำเร็จ!");
    } finally {
      setUploading(false);
    }
  }

  // ============================================================
  // LOGOUT
  // ============================================================
  function onLogout() {
    setAppUserId(null);
    navigation.replace("Login");
  }

  // ============================================================
  // UI
  // ============================================================
  return (
    <View style={s.container}>
      <LinearGradient
        colors={["#E0F7FF", "#BAE6FD", "#A5F3FC"]}
        style={StyleSheet.absoluteFill}
      />

      <View style={s.card}>
        {/* PROFILE IMAGE */}
        <TouchableOpacity onPress={pickProfileImage} style={s.profileWrapper}>
          {profileUrl ? (
            <Image source={{ uri: profileUrl }} style={s.profileImg} />
          ) : (
            <Ionicons name="person-circle" size={110} color="#38BDF8" />
          )}

          {uploading && (
            <ActivityIndicator color="#0F172A" style={{ position: "absolute" }} />
          )}
        </TouchableOpacity>

        {/* PROFILE CONTENT */}
        {loading ? (
          <ActivityIndicator color="#0F172A" />
        ) : (
          <>
            {/* NAME */}
            <View style={s.nameRow}>
              <Text style={s.nameText}>{displayName}</Text>

              <TouchableOpacity
                style={s.nameEditBtn}
                onPress={() => {
                  setNameDraft(displayName);
                  setEditing(true);
                }}
              >
                <Ionicons name="pencil" size={16} color="#0F172A" />
                <Text style={s.nameEditTxt}>Edit</Text>
              </TouchableOpacity>
            </View>

            {/* EMAIL */}
            <Text style={s.emailLabel}>Email</Text>
            <View style={s.emailBox}>
              <Ionicons name="mail-outline" size={16} color="#0F172A" />
              <Text style={s.emailText}>{email}</Text>
            </View>

            {/* PASSWORD */}
            <TouchableOpacity style={s.passBtn} onPress={() => setPassModal(true)}>
              <Text style={s.passBtnTxt}>Change Password</Text>
            </TouchableOpacity>
          </>
        )}

        {/* LOGOUT */}
        <TouchableOpacity style={s.logout} onPress={onLogout}>
          <Text style={s.logoutText}>Log out</Text>
        </TouchableOpacity>
      </View>

      {/* EDIT NAME MODAL */}
      <Modal visible={editing} transparent animationType="fade">
        <View style={s.modalWrap}>
          <View style={s.modalCard}>
            <Text style={s.modalTitle}>Edit Display Name</Text>

            <TextInput
              value={nameDraft}
              onChangeText={setNameDraft}
              placeholder="Enter name"
              style={s.modalInput}
            />

            <View style={s.modalRow}>
              <TouchableOpacity
                style={[s.modalBtn, s.cancelBtn]}
                onPress={() => setEditing(false)}
              >
                <Text style={s.modalBtnCancelTxt}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity style={s.modalBtn} onPress={saveName}>
                {saving ? (
                  <ActivityIndicator />
                ) : (
                  <Text style={s.modalBtnTxt}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* CHANGE PASSWORD MODAL */}
      <Modal visible={passModal} transparent animationType="fade">
        <View style={s.modalWrap}>
          <View style={s.modalCard}>
            <Text style={s.modalTitle}>Change Password</Text>

            <Text style={s.label}>Old Password</Text>
            <TextInput
              value={oldPass}
              onChangeText={setOldPass}
              secureTextEntry
              style={s.modalInput}
            />

            <Text style={s.label}>New Password</Text>
            <TextInput
              value={newPass}
              onChangeText={setNewPass}
              secureTextEntry
              style={s.modalInput}
            />

            <Text style={s.label}>Confirm New Password</Text>
            <TextInput
              value={confirmPass}
              onChangeText={setConfirmPass}
              secureTextEntry
              style={s.modalInput}
            />

            <View style={s.modalRow}>
              <TouchableOpacity
                style={[s.modalBtn, s.cancelBtn]}
                onPress={() => setPassModal(false)}
              >
                <Text style={s.modalBtnCancelTxt}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity style={s.modalBtn} onPress={changePassword}>
                {savingPass ? (
                  <ActivityIndicator />
                ) : (
                  <Text style={s.modalBtnTxt}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ============================================================
// STYLES
// ============================================================
const s = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center" },

  card: {
    width: "90%",
    padding: 26,
    backgroundColor: "rgba(255,255,255,0.3)",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(147,197,253,0.55)",
  },

  profileWrapper: { alignSelf: "center", marginBottom: 18 },

  profileImg: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 2,
    borderColor: "#7DD3FC",
  },

  nameRow: { flexDirection: "row", justifyContent: "space-between" },

  nameText: { color: "#0F172A", fontSize: 24, fontWeight: "800" },

  nameEditBtn: {
    flexDirection: "row",
    backgroundColor: "#BAE6FD",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(56,189,248,0.35)",
    alignItems: "center",
    gap: 4,
  },

  nameEditTxt: { color: "#0F172A", fontWeight: "800", fontSize: 12 },

  emailLabel: { marginTop: 6, marginBottom: 4, color: "#0F172A" },

  emailBox: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.6)",
    borderRadius: 12,
    padding: 10,
    gap: 8,
  },

  emailText: { color: "#0F172A", fontWeight: "700" },

  passBtn: {
    backgroundColor: "#A5F3FC",
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(56,189,248,0.4)",
  },

  passBtnTxt: { color: "#0F172A", fontWeight: "800" },

  logout: {
    backgroundColor: "#FCA5A5",
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.4)",
  },

  logoutText: { color: "#7A0A0A", fontWeight: "800" },

  modalWrap: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.25)",
    justifyContent: "center",
    alignItems: "center",
  },

  modalCard: {
    width: "86%",
    backgroundColor: "white",
    padding: 18,
    borderRadius: 18,
  },

  modalTitle: { fontSize: 20, fontWeight: "800", textAlign: "center" },

  label: { marginTop: 10, marginBottom: 4, color: "#0F172A", fontWeight: "700" },

  modalInput: {
    backgroundColor: "#FFF",
    borderColor: "#7DD3FC",
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    marginTop: 4,
  },

  modalRow: { flexDirection: "row", gap: 12, marginTop: 12 },

  modalBtn: {
    flex: 1,
    backgroundColor: "#38BDF8",
    padding: 10,
    alignItems: "center",
    borderRadius: 12,
  },

  cancelBtn: { backgroundColor: "#E2F3FF" },

  modalBtnTxt: { color: "#0F172A", fontWeight: "800" },
  modalBtnCancelTxt: { color: "#0F172A", fontWeight: "800" },
});
