// screens/CheckScreen.js
import { useRoute } from "@react-navigation/native";
import * as Crypto from "expo-crypto";
import * as ImagePicker from "expo-image-picker";
import * as SecureStore from "expo-secure-store";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context"; // 👈 เพิ่มบรรทัดนี้
import { WebView } from "react-native-webview";
import { supabase } from "../config/SupabaseClient";




export default function CheckScreen({ navigation }) {
  const route = useRoute();
    useEffect(() => {
    if (route.params?.captured) {
    handlePickedAsset(route.params.captured);  
  }
    }, [route.params?.captured]);

  const [html, setHtml] = useState(null);
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);

  // เก็บไอดีผู้ตรวจแบบ local (ไม่พึ่ง auth)
  const [inspectorId, setInspectorId] = useState(null);

  const [showSave, setShowSave] = useState(false);
  const [studentId, setStudentId] = useState("");
  const [saving, setSaving] = useState(false);
  const [currentImageUri, setCurrentImageUri] = useState(null);

  const webRef = useRef(null);
  const webReadyRef = useRef(false);
  const pendingToSendRef = useRef(null);

  const insets = useSafeAreaInsets();

  const GENDER_BASE =
    "https://teachablemachine.withgoogle.com/models/vSbVcHv4M/";
  const OUTER_F_BASE =
    "https://teachablemachine.withgoogle.com/models/d3qJLw2ge/";
  const OUTER_M_BASE =
    "https://teachablemachine.withgoogle.com/models/TweF_4R2d/";
  const TIE_M_BASE =
    "https://teachablemachine.withgoogle.com/models/jYgO-3LBT/";
  const BELT_M_BASE =
    "https://teachablemachine.withgoogle.com/models/LIThKDOeA/";
  const BELT_F_BASE =
    "https://teachablemachine.withgoogle.com/models/SLMSSOv2C/";
  const PIN_F_BASE =
    "https://teachablemachine.withgoogle.com/models/4BUE-uiFN/";
  const EAR_F_BASE =
    "https://teachablemachine.withgoogle.com/models/qCdijvZ2w/";
  const BTN_F_BASE =
    "https://teachablemachine.withgoogle.com/models/VI6pL07Pc/";

  const SHOE_F_BASE =
    "https://teachablemachine.withgoogle.com/models/mHyvFbP1h/";
  const SHOE_M_BASE =
    "https://teachablemachine.withgoogle.com/models/mHyvFbP1h/";

  // เตรียม inspector_id ครั้งแรก
  useEffect(() => {
    (async () => {
      const KEY = "inspector_id";
      let id = await SecureStore.getItemAsync(KEY);
      if (!id) {
        id = Crypto.randomUUID();
        await SecureStore.setItemAsync(KEY, id);
      }
      setInspectorId(id);
    })();
  }, []);

  // สร้าง HTML ของ WebView
  useEffect(() => {
    setHtml(
      buildPredictorHtml({
        genderBase: GENDER_BASE,
        outerFBase: OUTER_F_BASE,
        outerMBase: OUTER_M_BASE,
        tieMBase: TIE_M_BASE,
        beltMBase: BELT_M_BASE,
        beltFBase: BELT_F_BASE,
        pinFBase: PIN_F_BASE,
        earFBase: EAR_F_BASE,
        btnFBase: BTN_F_BASE,
        shoeFBase: SHOE_F_BASE,
        shoeMBase: SHOE_M_BASE,
      })
    );
  }, []);

  // ---------- ส่งรูปเข้า WebView ----------
  function sendDataUrlToWebView(dataUrl) {
    if (!webReadyRef.current) {
      pendingToSendRef.current = dataUrl;
    } else {
      setTimeout(() => {
        webRef.current?.postMessage(JSON.stringify({ type: "image", dataUrl }));
      }, 500);
    }
  }

  async function handlePickedAsset(asset) {
    if (!asset) return;
    const mime = asset.mimeType || "image/jpeg";
    const dataUrl = `data:${mime};base64,${asset.base64}`;

    setCurrentImageUri(asset.uri); // Save URI for upload later

    setBusy(true);
    setResult(null);
    setShowSave(false);
    setStudentId("");
    sendDataUrlToWebView(dataUrl);
  }

  // ---------- ปุ่ม: เลือกรูป ----------
  async function openLibrary() {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (perm.status !== "granted") {
        Alert.alert("ต้องอนุญาตเข้าถึงรูปภาพก่อน");
        return;
      }
      const res = await ImagePicker.launchImageLibraryAsync({
        base64: true,
        quality: 0.9,
        allowsEditing: false,
        allowsMultipleSelection: false,
      });
      if (res.canceled) return;
      await handlePickedAsset(res.assets?.[0]);
    } catch (err) {
      console.log("openLibrary error", err);
      Alert.alert("เกิดข้อผิดพลาด", err?.message || "เปิดคลังรูปไม่สำเร็จ");
    }
  }

  // ---------- ปุ่ม: ถ่ายภาพ ----------
  async function openCamera() {
    try {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (perm.status !== "granted") {
        Alert.alert("ต้องอนุญาตใช้กล้องก่อน");
        return;
      }
      const res = await ImagePicker.launchCameraAsync({
        base64: true,
        quality: 0.9,
        allowsEditing: false,
      });
      if (res.canceled) return;
      await handlePickedAsset(res.assets?.[0]);
    } catch (err) {
      console.log("openCamera error", err);
      Alert.alert("เกิดข้อผิดพลาด", err?.message || "เปิดกล้องไม่สำเร็จ");
    }
  }

  // แปลงค่าผลเป็นข้อความที่ต้องการแสดง
  function displayDetailText(key, item) {
    if (!item) return "-";

    if (key === "outer") {
      return item.pass ? "ชุดนักศึกษา" : "ชุดไปรเวท";
    }

    if (key === "shoe") {
      return item.pass ? "รองเท้าถูกระเบียบ" : "รองเท้าไม่ถูกระเบียบ";
    }

    // key อื่น ๆ = เนคไท / เข็มขัด / เข็มกลัด / ต่างหู / กระดุม
    return item.pass ? "มี" : "ไม่มี";
  }

  const styleFor = (item) =>
    !item ? styles.val : item.pass ? styles.ok : styles.bad;

  // ===== แปลงผลที่ "ไม่ผ่าน" ให้เป็นข้อความสั้น ๆ =====
  const ONLY_ONE_FAILURE = false;

  function failureMessage(gender, key) {
    const g = gender === "male" ? "ชาย" : "หญิง";
    switch (key) {
      case "outer":
        return `ชุดไปรเวท${g}`;
      case "tie":
        return `ไม่มีเนคไท${g}`;
      case "belt":
        return `ไม่มีเข็มขัด${g}`;
      case "pin":
        return `ไม่มีเข็มกลัด`;
      case "ear":
        return `ไม่มีต่างหู`;
      case "btn":
        return `ไม่ติดกระดุม`;
      case "shoe":
        return `รองเท้าไม่ถูกระเบียบ${g}`;
      default:
        return `ไม่ผ่าน`;
    }
  }

  function extractFailures(r) {
    if (!r?.detail) return [];
    const fails = [];
    for (const key of Object.keys(r.detail)) {
      const item = r.detail[key];
      if (item && item.pass === false) {
        fails.push({ key, text: failureMessage(r.gender, key) });
      }
    }
    if (ONLY_ONE_FAILURE && fails.length > 0) {
      const priority = ["outer", "belt", "tie", "shoe", "pin", "ear", "btn"];
      fails.sort(
        (a, b) => priority.indexOf(a.key) - priority.indexOf(b.key)
      );
      return [fails[0].text];
    }
    return fails.map((f) => f.text);
  }

  async function uploadImage(uri) {
    if (!uri) return null;
    try {
      // Create filename
      const filename = `fail_${Date.now()}_${Math.random()
        .toString(36)
        .substring(7)}.jpg`;

      // Use fetch to get ArrayBuffer directly (bypassing FileSystem deprecation)
      const response = await fetch(uri);
      const arrayBuffer = await response.arrayBuffer();

      const { data, error } = await supabase.storage
        .from("check_photos")
        .upload(filename, arrayBuffer, {
          contentType: "image/jpeg",
          upsert: false,
        });

      if (error) {
        console.log("Upload error:", error);
        alert(`Upload Failed: ${error.message}`);
        return null;
      }

      const { data: publicData } = supabase.storage
        .from("check_photos")
        .getPublicUrl(filename);

      return publicData.publicUrl;
    } catch (e) {
      console.log("uploadImage exception:", e);
      alert(`Upload Exception: ${e.message}`);
      return null;
    }
  }

  // บันทึกลง Supabase (ไม่ใช้ auth)
  async function saveFailure() {
    try {
      if (!result || result.passAll) {
        Alert.alert("ยังไม่มีผลที่ไม่ผ่าน");
        return;
      }
      if (!studentId.trim()) {
        Alert.alert("กรุณากรอกรหัสนักศึกษา");
        return;
      }
      if (!inspectorId) {
        Alert.alert("กำลังเตรียมรหัสผู้ตรวจ ลองใหม่อีกครั้ง");
        return;
      }
      setSaving(true);

      const failures = extractFailures(result); // => ["ไม่มีเนคไทชาย", ...]
      if (failures.length === 0) {
        Alert.alert("ไม่มีหัวข้อที่ไม่ผ่าน");
        setSaving(false);
        return;
      }

      // Upload image
      let uploadedUrl = null;
      if (currentImageUri) {
        uploadedUrl = await uploadImage(currentImageUri);
      }

      const payload = {
        student_id: studentId.trim(),
        inspector_id: inspectorId,
        gender: result.gender,
        failed: failures, // jsonb[] (array of string)
        pass_all: false,
        image_url: uploadedUrl,
      };

      const { error } = await supabase.from("checks").insert(payload);
      if (error) throw error;

      setShowSave(false);
      setStudentId("");
      Alert.alert("บันทึกแล้ว", "บันทึกการไม่ผ่านสำเร็จ");
    } catch (e) {
      console.log("saveFailure error", e);
      Alert.alert("บันทึกล้มเหลว", e?.message || "ไม่ทราบสาเหตุ");
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={styles.container}>
      {html ? (
        <WebView
          ref={webRef}
          originWhitelist={["*"]}
          source={{ html }}
          javaScriptEnabled
          domStorageEnabled
          allowFileAccess
          allowUniversalAccessFromFileURLs
          mixedContentMode="always"
          setSupportMultipleWindows={false}
          style={{ flex: 1, backgroundColor: "#E0F7FF" }}
          onLoadEnd={() => {
            webReadyRef.current = true;
            if (pendingToSendRef.current) {
              const dataUrl = pendingToSendRef.current;
              pendingToSendRef.current = null;
              setTimeout(() => {
                webRef.current?.postMessage(
                  JSON.stringify({ type: "image", dataUrl })
                );
              }, 500);
            }
          }}
          onMessage={(e) => {
            try {
              const msg = JSON.parse(e.nativeEvent.data);
              if (msg.type === "result") {
                setResult(msg);
                setBusy(false);
                if (msg?.passAll === false) setShowSave(true);
              } else if (msg.type === "error") {
                setBusy(false);
                Alert.alert("โมเดลมีปัญหา", msg.message || "ไม่ทราบสาเหตุ");
              }
            } catch {}
          }}
        />
      ) : (
        <View style={styles.center}>
          <Text style={{ color: "#0F172A" }}>กำลังโหลดโมเดล…</Text>
        </View>
      )}

      {/* ===== แถบล่าง: ปุ่ม + สรุปผล ===== */}
      <View
        style={[
          styles.footer,
          {
            // เคารพ safe area + เผื่ออีกหน่อย กันแท็บล่างบัง
            paddingBottom: (insets.bottom || 0) + 16,
          },
        ]}
      >
        <View style={styles.actionRow}>
          <TouchableOpacity
  onPress={() =>
    navigation.navigate("CameraCapture", {
      onCapture: (photo) => {
        handlePickedAsset(photo);
      },
    })
  }
  style={styles.pickBtn}
  disabled={busy}
  activeOpacity={0.9}
>


            {busy ? (
              <ActivityIndicator color="#0F172A" />
            ) : (
              <Text style={styles.pickText}>ถ่ายภาพ</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={openLibrary}
            style={styles.pickBtn}
            disabled={busy}
            activeOpacity={0.9}
          >
            {busy ? (
              <ActivityIndicator color="#0F172A" />
            ) : (
              <Text style={styles.pickText}>เลือกรูป</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.historyBtn}
            onPress={() => {
              if (navigation?.navigate) {
                navigation.navigate("History");
              } else {
                Alert.alert(
                  "ยังไม่ได้เชื่อมหน้า",
                  "ยังไม่ได้กำหนดหน้าประวัติใน Navigator"
                );
              }
            }}
          >
            <Text style={styles.historyText}>ดูประวัตินักศึกษาที่ไม่ผ่าน</Text>
          </TouchableOpacity>
        </View>

        {/* สรุปผล (เลื่อนขึ้น-ลงได้กันข้อความล่างโดนตัด) */}
        <ScrollView
          style={styles.summaryScroll}
          contentContainerStyle={{ paddingBottom: 4 }}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.line}>
            เพศ: <Text style={styles.val}>{result?.genderTH || "-"}</Text>
          </Text>

          {result?.gender === "male" && (
            <>
              <Text style={styles.line}>
                ตรวจสอบชุดนักศึกษา:{" "}
                <Text style={styleFor(result?.detail?.outer)}>
                  {displayDetailText("outer", result?.detail?.outer)}
                </Text>
              </Text>
              <Text style={styles.line}>
                เนคไท:{" "}
                <Text style={styleFor(result?.detail?.tie)}>
                  {displayDetailText("tie", result?.detail?.tie)}
                </Text>
              </Text>
              <Text style={styles.line}>
                เข็มขัด:{" "}
                <Text style={styleFor(result?.detail?.belt)}>
                  {displayDetailText("belt", result?.detail?.belt)}
                </Text>
              </Text>
              <Text style={styles.line}>
                รองเท้า:{" "}
                <Text style={styleFor(result?.detail?.shoe)}>
                  {displayDetailText("shoe", result?.detail?.shoe)}
                </Text>
              </Text>
            </>
          )}

          {result?.gender === "female" && (
            <>
              <Text style={styles.line}>
                ตรวจสอบชุดนักศึกษา:{" "}
                <Text style={styleFor(result?.detail?.outer)}>
                  {displayDetailText("outer", result?.detail?.outer)}
                </Text>
              </Text>
              <Text style={styles.line}>
                เข็มขัด:{" "}
                <Text style={styleFor(result?.detail?.belt)}>
                  {displayDetailText("belt", result?.detail?.belt)}
                </Text>
              </Text>
              <Text style={styles.line}>
                เข็มกลัด:{" "}
                <Text style={styleFor(result?.detail?.pin)}>
                  {displayDetailText("pin", result?.detail?.pin)}
                </Text>
              </Text>
              <Text style={styles.line}>
                ตุ้งติ้ง:{" "}
                <Text style={styleFor(result?.detail?.ear)}>
                  {displayDetailText("ear", result?.detail?.ear)}
                </Text>
              </Text>
              <Text style={styles.line}>
                กระดุม:{" "}
                <Text style={styleFor(result?.detail?.btn)}>
                  {displayDetailText("btn", result?.detail?.btn)}
                </Text>
              </Text>
              <Text style={styles.line}>
                รองเท้า:{" "}
                <Text style={styleFor(result?.detail?.shoe)}>
                  {displayDetailText("shoe", result?.detail?.shoe)}
                </Text>
              </Text>
            </>
          )}

          <Text style={[styles.line, { marginTop: 6 }]}>
            ผลรวม:{" "}
            <Text style={result?.passAll ? styles.ok : styles.bad}>
              {result
                ? result.passAll
                  ? "ผ่านเกณฑ์"
                  : "ยังไม่ครบองค์ประกอบ"
                : "-"}
            </Text>
          </Text>

          {result && result.passAll === false && (
            <TouchableOpacity
              style={styles.saveBtn}
              onPress={() => setShowSave(true)}
            >
              <Text style={styles.saveText}>บันทึกการแต่งกายผิดระเบียบ</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>

      {/* Modal กรอกรหัสนักศึกษา */}
      <Modal
        visible={showSave}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSave(false)}
      >
        <View style={styles.modalWrap}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>บันทึกการแต่งกายผิดระเบียบ</Text>

            <Text style={styles.modalLabel}>รหัสนักศึกษา</Text>
            <TextInput
              value={studentId}
              onChangeText={setStudentId}
              placeholder="เช่น 6601xxxxxxx"
              placeholderTextColor="rgba(15,23,42,0.45)"
              style={styles.modalInput}
              keyboardType="default"
              autoCapitalize="none"
            />

            <View style={{ height: 10 }} />
            <View style={{ flexDirection: "row", gap: 10 }}>
              <TouchableOpacity
                style={[
                  styles.modalBtn,
                  {
                    flex: 1,
                    backgroundColor: "#E2F3FF",
                    borderColor: "rgba(56,189,248,0.35)",
                  },
                ]}
                onPress={() => setShowSave(false)}
              >
                <Text style={[styles.modalBtnText, { color: "#0F172A" }]}>
                  ยกเลิก
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, { flex: 1 }]}
                onPress={saveFailure}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#0F172A" />
                ) : (
                  <Text style={styles.modalBtnText}>บันทึก</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

/* ---------- styles (ธีมฟ้าใส) ---------- */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#E0F7FF" },

  center: { flex: 1, alignItems: "center", justifyContent: "center" },

  footer: {
    paddingHorizontal: 12,
    paddingTop: 10,
    // paddingBottom จะไปใส่เพิ่มจาก safe area ตอนใช้จริง
    borderTopWidth: 1,
    borderTopColor: "rgba(147,197,253,0.55)",
    backgroundColor: "rgba(255,255,255,0.6)",
    marginBottom: 58,
  },

  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
    gap: 8,
  },

  line: { color: "#0F172A", fontSize: 14, marginBottom: 2 },
  val: { color: "#0EA5E9", fontWeight: "700" },
  ok: { color: "#16A34A", fontWeight: "800" },
  bad: { color: "#DC2626", fontWeight: "800" },

  pickBtn: {
    flex: 1,
    backgroundColor: "#BAE6FD",
    borderWidth: 1,
    borderColor: "#7DD3FC",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  pickText: { color: "#0F172A", fontWeight: "800", fontSize: 15 },

  historyBtn: {
    flex: 1.4,
    backgroundColor: "#E0F2FE",
    borderWidth: 1,
    borderColor: "rgba(37,99,235,0.35)",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  historyText: {
    color: "#1D4ED8",
    fontWeight: "700",
    fontSize: 14,
    textAlign: "center",
  },

  saveBtn: {
    marginTop: 10,
    alignSelf: "flex-start",
    backgroundColor: "#7DD3FC",
    borderWidth: 1,
    borderColor: "rgba(56,189,248,0.35)",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  saveText: { color: "#0F172A", fontWeight: "800" },

  // Modal
  modalWrap: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  modalCard: {
    width: "86%",
    backgroundColor: "rgba(255,255,255,0.85)",
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
  },
  modalLabel: { color: "#0369A1", marginBottom: 6, fontWeight: "700" },
  modalInput: {
    color: "#0F172A",
    backgroundColor: "rgba(255,255,255,0.6)",
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

  summaryScroll: {
    maxHeight: 260,
  },
});

/* ---------- HTML ฝั่ง WebView ---------- */
function buildPredictorHtml(bases) {
  const TF_URL =
    "https://unpkg.com/@tensorflow/tfjs@4.13.0/dist/tf.min.js";
  const TM_URL =
    "https://unpkg.com/@teachablemachine/image@0.8.5/dist/teachablemachine-image.min.js";

  return `<!doctype html>
<html lang="th">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover" />
  <meta http-equiv="Content-Security-Policy"
    content="default-src * data: filesystem: blob: gap:; img-src * data: blob:; style-src * 'unsafe-inline'; script-src * 'unsafe-inline' 'unsafe-eval';">
  <title>Uniform Check</title>
  <style>
    :root{ --safeTop: env(safe-area-inset-top, 0px); }
    body{
      margin:0;
      background:#E0F7FF;
      color:#0F172A;
      font-family:-apple-system,system-ui,sans-serif
    }
    .wrap{
      padding: calc(var(--safeTop) + 60px) 16px 120px;
    }
    .card{
      background:rgba(255,255,255,.65);
      border:1px solid rgba(147,197,253,.55);
      border-radius:16px;
      padding:12px;
      margin-bottom:12px;
      box-shadow:0 6px 14px rgba(125,211,252,.20);
    }
    .imgBox{
      background:rgba(255,255,255,.55);
      border:1px solid rgba(147,197,253,.45);
      border-radius:14px;
      padding:8px;
    }
    #preview{
      width:100%;
      max-height:60vh;
      object-fit:contain;
      border-radius:10px;
      background:#F0FDFF;
    }
    .hint{ color:#0369A1; font-weight:700; }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="card"><span class="hint">คำแนะนำ:</span> เลือกภาพแล้ว ระบบจะประมวลผลให้อัตโนมัติ</div>
    <div class="card imgBox"><img id="preview" /></div>
  </div>

  <script>
    var BASES = ${JSON.stringify(bases)};

    function join(b,p){ return (b||'').replace(/\\/+$/,'') + '/' + (p||'').replace(/^\\/+/
,''); }
    function loadScript(src){
      return new Promise(function(res,rej){
        var s=document.createElement('script');
        s.src=src; s.async=true;
        s.onload=function(){res(true)};
        s.onerror=function(){rej(new Error('load '+src))};
        document.head.appendChild(s);
      });
    }
    async function ensureLibs(){
      if(!window.tf){ await loadScript("${TF_URL}") }
      if(!window.tmImage){ await loadScript("${TM_URL}") }
      if(!window.tmImage) throw new Error("tmImage not available");
    }
    async function topPred(model, img){
      var arr = await model.predict(img,false);
      arr.sort(function(a,b){ return b.probability - a.probability });
      return arr[0];
    }

    function norm(s){
      return (s||"").toLowerCase().replace(/\\s+/g,"").replace(/[_-]+/g,"").replace(/[^\\wก-๙]/g,"");
    }
    function containsAny(label, keys){
      const n = norm(label);
      return (keys||[]).some(k => n.includes(norm(k)));
    }
    function passIfHas(label, positives, negatives){
      if (containsAny(label, negatives)) return false;
      if (containsAny(label, positives)) return true;
      return false;
    }

    const OUTER_KEYS = [
      "outer","ชุดนอก","jacket","coat","blazer","overcoat","สูท",
      "เสื้อแจ็คเก็ต","hoodie","cardigan","sweater","ชุดนอกหญิง","ชุดนอกชาย"
    ];
    const UNIFORM_KEYS = [
      "uniform","student_uniform","ชุดนักศึกษา","นักศึกษา","studentshirt",
      "shirt","student","ชุดนักศึกษาหญิง","ชุดนักศึกษาชาย"
    ];

    const OUTER_MIN   = 0.50;
    const UNIFORM_MIN = 0.50;

    function evalOuter(pred){
      const label = pred.className || "";
      const prob  = pred.probability || 0;
      const isOuterConf   = containsAny(label, OUTER_KEYS)   && prob >= OUTER_MIN;
      const isUniformConf = containsAny(label, UNIFORM_KEYS) && prob >= UNIFORM_MIN;

      if (isOuterConf)   return { pass:false, shouldStop:true,  label, prob };
      if (isUniformConf) return { pass:true,  shouldStop:false, label, prob };
      return { pass:true, shouldStop:false, label, prob };
    }

    var models = {};
    async function loadModel(key){
      if(models[key]) return models[key];
      var base = BASES[key];
      var m = join(base,"model.json");
      var x = join(base,"metadata.json");
      models[key] = await window.tmImage.load(m,x);
      return models[key];
    }

    // ====== แกนหลัก: ตัดรูปเป็น full / upper / lower แล้วส่งเข้าโมเดล ======
    async function pipeline(img){
      try{
        await ensureLibs();

        // เตรียม canvas ครึ่งบน / ครึ่งล่าง
        var w = img.naturalWidth || img.width;
        var h = img.naturalHeight || img.height;
        var half = Math.floor(h / 2);

        // ครึ่งบน
        var upperCanvas = document.createElement("canvas");
        upperCanvas.width = w;
        upperCanvas.height = half;
        var uctx = upperCanvas.getContext("2d");
        uctx.drawImage(img, 0, 0, w, half, 0, 0, w, half);

        // ครึ่งล่าง
        var lowerCanvas = document.createElement("canvas");
        lowerCanvas.width = w;
        lowerCanvas.height = h - half;
        var lctx = lowerCanvas.getContext("2d");
        lctx.drawImage(img, 0, half, w, h - half, 0, 0, w, h - half);

        // full = ใช้ img เดิม
        var fullInput = img;           // ใช้กับ: gender, outer
        var upperInput = upperCanvas;  // ใช้กับ: tie, pin, ear, btn
        var lowerInput = lowerCanvas;  // ใช้กับ: belt, shoe

        // ===== 1) ทำนายเพศก่อน ด้วยรูปเต็ม =====
        var mGender = await loadModel("genderBase");
        var g = await topPred(mGender, fullInput);
        var isMale = containsAny(g.className, ["male","man","ชาย","boy"]);
        var gender = isMale ? "male" : "female";
        var genderTH = isMale ? "ชาย" : "หญิง";

        var detail = {};
        var passAll = false;

        if(isMale){
          // ===== ชาย =====

          // 2) outer (ชุดนักศึกษา / ชุดนอก) → รูปเต็ม
          const outerPred = await topPred(await loadModel("outerMBase"), fullInput);
          const out = evalOuter(outerPred);
          detail.outer = { label: out.label, prob: out.prob, pass: out.pass };
          if (out.shouldStop) {
            passAll = false;
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type:"result", gender, genderTH, detail, passAll
            }));
            return;
          }

          // 3) เนคไท (ครึ่งบน)
          const t = await topPred(await loadModel("tieMBase"),  upperInput);
          // 4) เข็มขัด (ครึ่งล่าง)
          const b = await topPred(await loadModel("beltMBase"), lowerInput);
          // 5) รองเท้า (ครึ่งล่าง)
          const s = await topPred(await loadModel("shoeMBase"), lowerInput);

          const passTie  = passIfHas(t.className,
            ["tie","necktie","มีเนคไท","เนคไทชาย"],
            ["no_tie","notie","ไม่มีเนคไท","ไม่มีเนคไทชาย","ไม่มี"]
          );
          const passBelt = passIfHas(b.className,
            ["belt","withbelt","เข็มขัดชาย","ใส่เข็มขัด"],
            ["no_belt","nobelt","ไม่มีเข็มขัดชาย","ไม่ใส่เข็มขัด","ไม่มี"]
          );
          const passShoe = passIfHas(s.className,
            ["รองเท้าชายถูก","รองเท้าถูกระเบียบ","ถูกระเบียบ","correct"],
            ["รองเท้าชายผิด","รองเท้าผิดระเบียบ","ผิดระเบียบ","wrong"]
          );

          detail.tie  = { label:t.className, prob:t.probability, pass: passTie  };
          detail.belt = { label:b.className, prob:b.probability, pass: passBelt };
          detail.shoe = { label:s.className, prob:s.probability, pass: passShoe };

          passAll = (out.pass && passTie && passBelt && passShoe);

        } else {
          // ===== หญิง =====

          // 2) outer (ชุดนักศึกษา / ชุดนอก) → รูปเต็ม
          const outerPredF = await topPred(await loadModel("outerFBase"), fullInput);
          const outF = evalOuter(outerPredF);
          detail.outer = { label: outF.label, prob: outF.prob, pass: outF.pass };
          if (outF.shouldStop) {
            passAll = false;
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type:"result", gender, genderTH, detail, passAll
            }));
            return;
          }

          // 3) เข็มขัด (ครึ่งล่าง)
          const bf = await topPred(await loadModel("beltFBase"), lowerInput);
          // 4) เข็มกลัด (ครึ่งบน)
          const p  = await topPred(await loadModel("pinFBase"),  upperInput);
          // 5) ต่างหู (ครึ่งบน)
          const e  = await topPred(await loadModel("earFBase"),  upperInput);
          // 6) กระดุม (ครึ่งบน)
          const bt = await topPred(await loadModel("btnFBase"),  upperInput);
          // 7) รองเท้า (ครึ่งล่าง)
          const sf = await topPred(await loadModel("shoeFBase"), lowerInput);

          const passBeltF = passIfHas(bf.className,
            ["belt","withbelt","เข็มขัดหญิง","ใส่เข็มขัด"],
            ["no_belt","nobelt","ไม่มีเข็มขัดหญิง","ไม่ใส่เข็มขัด","ไม่มี"]
          );
          const passPin   = passIfHas(p.className,
            ["pin","brooch","มีเข็มกลัด","ติดเข็มกลัด","กลัด"],
            ["no_pin","nopin","ไม่มีเข็มกลัด","ไม่ติดเข็มกลัด","ไม่มี"]
          );
          const passEar   = passIfHas(e.className,
            ["earring","มีตุ้งติ้ง","มีต่างหู","ใส่ต่างหู"],
            ["no_earring","noearring","ไม่มีตุ้งติ้ง","ไม่มี"]
          );
          const passBtn   = passIfHas(bt.className,
            ["button","กระดุม","มีกระดุม","ติดกระดุม"],
            ["no_button","nobutton","ไม่มีกระดุม","ไม่ติดกระดุม","ไม่มี"]
          );
          const passShoeF = passIfHas(sf.className,
            ["รองเท้าถูกระเบียบ","รองเท้าหญิงถูก","ถูกระเบียบ","correct"],
            ["รองเท้าผิดระเบียบ","รองเท้าหญิงผิด","ผิดระเบียบ","wrong"]
          );

          detail.belt = { label:bf.className, prob:bf.probability, pass: passBeltF };
          detail.pin  = { label:p.className,  prob:p.probability,  pass: passPin   };
          detail.ear  = { label:e.className,  prob:e.probability,  pass: passEar   };
          detail.btn  = { label:bt.className, prob:bt.probability, pass: passBtn   };
          detail.shoe = { label:sf.className, prob:sf.probability, pass: passShoeF };

          passAll = (outF.pass && passBeltF && passPin && passEar && passBtn && passShoeF);
        }

        window.ReactNativeWebView.postMessage(JSON.stringify({
          type:"result", gender, genderTH, detail, passAll
        }));
      }catch(err){
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type:"error", message: err && err.message
        }));
      }
    }

    function handleRNMessage(ev){
      var raw = typeof ev === "string" ? ev : (ev && ev.data || "");
      try{
        var msg = JSON.parse(raw || "{}");
        if(msg.type === "image" && msg.dataUrl){
          var img = document.getElementById("preview");
          img.src = msg.dataUrl;
          img.onload = function(){ pipeline(img); };
        }
      }catch(_){}
    }
    document.addEventListener("message", handleRNMessage);
    window.addEventListener("message", handleRNMessage);
  </script>
</body>
</html>`;
}
