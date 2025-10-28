// screens/CheckScreen.js
import * as Crypto from "expo-crypto";
import * as ImagePicker from "expo-image-picker";
import * as SecureStore from "expo-secure-store";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { WebView } from "react-native-webview";
import { supabase } from "../config/SupabaseClient";

export default function CheckScreen() {
  const [html, setHtml] = useState(null);
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);

  // เก็บไอดีผู้ตรวจแบบ local (ไม่พึ่ง auth)
  const [inspectorId, setInspectorId] = useState(null);

  // modal บันทึกเมื่อไม่ผ่าน
  const [showSave, setShowSave] = useState(false);
  const [studentId, setStudentId] = useState("");
  const [saving, setSaving] = useState(false);

  const webRef = useRef(null);
  const webReadyRef = useRef(false);
  const pendingToSendRef = useRef(null);

  // ===== โมเดลที่ใช้งาน =====
  const GENDER_BASE = "https://teachablemachine.withgoogle.com/models/JwYPDXrEk/";
  const OUTER_F_BASE = "https://teachablemachine.withgoogle.com/models/B3q_-YwXk/";
  const OUTER_M_BASE = "https://teachablemachine.withgoogle.com/models/UsbrLeWWx/";
  const TIE_M_BASE   = "https://teachablemachine.withgoogle.com/models/HWvWDge3a/";
  const BELT_M_BASE  = "https://teachablemachine.withgoogle.com/models/5caJRMJXa/";
  const BELT_F_BASE  = "https://teachablemachine.withgoogle.com/models/BoL3rWSWX/";
  const PIN_F_BASE   = "https://teachablemachine.withgoogle.com/models/zfYzwSvRc/";
  const EAR_F_BASE   = "https://teachablemachine.withgoogle.com/models/dZQp1_1Cu/";
  const BTN_F_BASE   = "https://teachablemachine.withgoogle.com/models/iVj_HIvXI/";

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
        tieMBase:   TIE_M_BASE,
        beltMBase:  BELT_M_BASE,
        beltFBase:  BELT_F_BASE,
        pinFBase:   PIN_F_BASE,
        earFBase:   EAR_F_BASE,
        btnFBase:   BTN_F_BASE,
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

  const showPass = (item) => (!item ? "-" : item.pass ? "ผ่าน" : "ยังไม่ผ่าน");
  const styleFor = (item) => (!item ? styles.val : item.pass ? styles.ok : styles.bad);

  // ===== แปลงผลที่ "ไม่ผ่าน" ให้เป็นข้อความสั้น ๆ =====
  const ONLY_ONE_FAILURE = false;

  function failureMessage(gender, key) {
    const g = gender === "male" ? "ชาย" : "หญิง";
    switch (key) {
      case "outer": return `ใส่ชุดนอก${g}`;
      case "tie":   return `ไม่มีเนคไท${g}`;
      case "belt":  return `ไม่มีเข็มขัด${g}`;
      case "pin":   return `ไม่มีเข็มกลัด`;
      case "ear":   return `ไม่มีต่างหู`;
      case "btn":   return `ไม่ติดกระดุม`;
      default:      return `ไม่ผ่าน`;
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
      const priority = ["outer", "belt", "tie", "pin", "ear", "btn"];
      fails.sort((a, b) => priority.indexOf(a.key) - priority.indexOf(b.key));
      return [fails[0].text];
    }
    return fails.map((f) => f.text);
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

      const payload = {
        student_id: studentId.trim(),
        inspector_id: inspectorId,
        gender: result.gender,
        failed: failures,   // jsonb[] (array of string)
        pass_all: false,
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
          style={{ flex: 1, backgroundColor: "#0E1621" }}
          onLoadEnd={() => {
            webReadyRef.current = true;
            if (pendingToSendRef.current) {
              const dataUrl = pendingToSendRef.current;
              pendingToSendRef.current = null;
              setTimeout(() => {
                webRef.current?.postMessage(JSON.stringify({ type: "image", dataUrl }));
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
          <Text style={{ color: "#9fb3c8" }}>กำลังโหลดโมเดล…</Text>
        </View>
      )}

      {/* ปุ่มลอยสองปุ่ม: ถ่ายภาพ & เลือกรูป */}
      <View style={styles.pickRow}>
        <TouchableOpacity onPress={openCamera} style={[styles.pickBtn, { marginRight: 8 }]} disabled={busy} activeOpacity={0.9}>
          {busy ? <ActivityIndicator color="#E5E7EB" /> : <Text style={styles.pickText}>ถ่ายภาพ</Text>}
        </TouchableOpacity>
        <TouchableOpacity onPress={openLibrary} style={styles.pickBtn} disabled={busy} activeOpacity={0.9}>
          {busy ? <ActivityIndicator color="#E5E7EB" /> : <Text style={styles.pickText}>เลือกรูป</Text>}
        </TouchableOpacity>
      </View>

      {/* ===== แสดงผลสรุป ===== */}
      <View style={styles.footer}>
        <Text style={styles.line}>
          เพศ: <Text style={styles.val}>{result?.genderTH || "-"}</Text>
        </Text>

        {result?.gender === "male" && (
          <>
            <Text style={styles.line}>
              ตรวจชุดนอก: <Text style={styleFor(result?.detail?.outer)}>{showPass(result?.detail?.outer)}</Text>
            </Text>
            <Text style={styles.line}>
              เนคไท: <Text style={styleFor(result?.detail?.tie)}>{showPass(result?.detail?.tie)}</Text>
            </Text>
            <Text style={styles.line}>
              เข็มขัด: <Text style={styleFor(result?.detail?.belt)}>{showPass(result?.detail?.belt)}</Text>
            </Text>
          </>
        )}

        {result?.gender === "female" && (
          <>
            <Text style={styles.line}>
              ตรวจชุดนอก: <Text style={styleFor(result?.detail?.outer)}>{showPass(result?.detail?.outer)}</Text>
            </Text>
            <Text style={styles.line}>
              เข็มขัด: <Text style={styleFor(result?.detail?.belt)}>{showPass(result?.detail?.belt)}</Text>
            </Text>
            <Text style={styles.line}>
              เข็มกลัด: <Text style={styleFor(result?.detail?.pin)}>{showPass(result?.detail?.pin)}</Text>
            </Text>
            <Text style={styles.line}>
              ตุ้งติ้ง: <Text style={styleFor(result?.detail?.ear)}>{showPass(result?.detail?.ear)}</Text>
            </Text>
            <Text style={styles.line}>
              กระดุม: <Text style={styleFor(result?.detail?.btn)}>{showPass(result?.detail?.btn)}</Text>
            </Text>
          </>
        )}

        <Text style={[styles.line, { marginTop: 6 }]}>
          ผลรวม:{" "}
          <Text style={result?.passAll ? styles.ok : styles.bad}>
            {result ? (result.passAll ? "ผ่านเกณฑ์" : "ยังไม่ครบองค์ประกอบ") : "-"}
          </Text>
        </Text>

        {result && result.passAll === false && (
          <TouchableOpacity style={styles.saveBtn} onPress={() => setShowSave(true)}>
            <Text style={styles.saveText}>บันทึกการไม่ผ่าน</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Modal กรอกรหัสนักศึกษา */}
      <Modal visible={showSave} transparent animationType="fade" onRequestClose={() => setShowSave(false)}>
        <View style={styles.modalWrap}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>บันทึกการไม่ผ่าน</Text>

            <Text style={styles.modalLabel}>รหัสนักศึกษา</Text>
            <TextInput
              value={studentId}
              onChangeText={setStudentId}
              placeholder="เช่น 6601xxxxxxx"
              placeholderTextColor="#9fb3c8"
              style={styles.modalInput}
              keyboardType="default"
              autoCapitalize="none"
            />

            <View style={{ height: 10 }} />
            <View style={{ flexDirection: "row", gap: 10 }}>
              <TouchableOpacity
                style={[styles.modalBtn, { flex: 1, backgroundColor: "#1f2a44" }]}
                onPress={() => setShowSave(false)}
              >
                <Text style={styles.pickText}>ยกเลิก</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, { flex: 1 }]} onPress={saveFailure} disabled={saving}>
                {saving ? <ActivityIndicator color="#E5E7EB" /> : <Text style={styles.pickText}>บันทึก</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

/* ---------- styles ---------- */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0E1621" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  footer: {
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(0,0,0,0.15)",
  },
  line: { color: "#e5e7eb", fontSize: 14, marginBottom: 2 },
  val: { color: "#e5e7eb", fontWeight: "700" },
  ok: { color: "#34D399", fontWeight: "700" },
  bad: { color: "#F87171", fontWeight: "700" },

  // ปุ่มลอยสองปุ่ม
  pickRow: {
    position: "absolute",
    right: 16,
    bottom: 24,
    flexDirection: "row",
    zIndex: 2,
    elevation: 6,
  },
  pickBtn: {
    backgroundColor: "#1f2a44",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  pickText: { color: "#E5E7EB", fontWeight: "700" },

  saveBtn: {
    marginTop: 10,
    alignSelf: "flex-start",
    backgroundColor: "#334155",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  saveText: { color: "#E5E7EB", fontWeight: "700" },
  modalWrap: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
  },
  modalCard: {
    width: "86%",
    backgroundColor: "#0E1621",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  modalTitle: { color: "#E5E7EB", fontSize: 18, fontWeight: "700", marginBottom: 8 },
  modalLabel: { color: "#9fb3c8", marginBottom: 6 },
  modalInput: {
    color: "#E5E7EB",
    backgroundColor: "#0b1220",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  modalBtn: {
    backgroundColor: "#334155",
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
});

/* ---------- HTML ฝั่ง WebView (pipeline) ---------- */
function buildPredictorHtml(bases) {
  const TF_URL = "https://unpkg.com/@tensorflow/tfjs@4.13.0/dist/tf.min.js";
  const TM_URL = "https://unpkg.com/@teachablemachine/image@0.8.5/dist/teachablemachine-image.min.js";

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
    body{ margin:0; background:#0b0f2d; color:#e5e7eb; font-family:-apple-system,system-ui,sans-serif }
    .wrap{ padding: calc(var(--safeTop) + 80px) 16px 120px }
    .card{ background:rgba(255,255,255,.06); border:1px solid rgba(255,255,255,.12); border-radius:14px; padding:12px; margin-bottom:10px }
    .imgBox{ background:#0e1621; border-radius:12px; padding:8px }
    #preview{ width:100%; max-height:60vh; object-fit:contain; border-radius:10px }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="card" style="color:#a5b4fc">เลือกภาพแล้ว ระบบจะประมวลผลให้อัตโนมัติ</div>
    <div class="card imgBox"><img id="preview" /></div>
  </div>

  <script>
    var BASES = ${JSON.stringify(bases)};

    function join(b,p){ return (b||'').replace(/\\/+$/,'') + '/' + (p||'').replace(/^\\/+/,''); }
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

    // ===== Helpers: normalize + contains-any =====
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

    // กลุ่มคำของชุดนอก/ชุดนักศึกษา
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
      theProb = pred.probability || 0;
      const prob  = theProb; // keep name
      const isOuterConf   = containsAny(label, OUTER_KEYS)   && prob >= OUTER_MIN;
      const isUniformConf = containsAny(label, UNIFORM_KEYS) && prob >= UNIFORM_MIN;

      if (isOuterConf)   return { pass:false, shouldStop:true,  label, prob }; // ❌ stop
      if (isUniformConf) return { pass:true,  shouldStop:false, label, prob }; // ✅ go on
      return { pass:true, shouldStop:false, label, prob }; // ไม่ชัด → ผ่านด่านนี้ไปก่อน
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

    async function pipeline(img){
      try{
        await ensureLibs();

        // 1) เพศ
        var mGender = await loadModel("genderBase");
        var g = await topPred(mGender, img);
        var isMale = containsAny(g.className, ["male","man","ชาย","boy"]);
        var gender = isMale ? "male" : "female";
        var genderTH = isMale ? "ชาย" : "หญิง";

        var detail = {};
        var passAll = false;

        if(isMale){
          // 2) ชุดนอกชาย
          const outerPred = await topPred(await loadModel("outerMBase"), img);
          const out = evalOuter(outerPred);
          detail.outer = { label: out.label, prob: out.prob, pass: out.pass };
          if (out.shouldStop) {
            passAll = false;
            window.ReactNativeWebView.postMessage(JSON.stringify({ type:"result", gender, genderTH, detail, passAll }));
            return;
          }

          // 3) เนคไท / เข็มขัด (ต้องมี)
          const t = await topPred(await loadModel("tieMBase"),  img);
          const b = await topPred(await loadModel("beltMBase"), img);

          const passTie  = passIfHas(t.className,
            ["tie","necktie","มีเนคไท","ใส่เนคไท"],
            ["no_tie","notie","ไม่มีเนคไท","ไม่ใส่เนคไท","ไม่มี"]
          );
          const passBelt = passIfHas(b.className,
            ["belt","withbelt","มีเข็มขัด","ใส่เข็มขัด"],
            ["no_belt","nobelt","ไม่มีเข็มขัด","ไม่ใส่เข็มขัด","ไม่มี"]
          );

          detail.tie  = { label:t.className, prob:t.probability, pass: passTie  };
          detail.belt = { label:b.className, prob:b.probability, pass: passBelt };

          passAll = (out.pass && passTie && passBelt);

        } else {
          // 2) ชุดนอกหญิง
          const outerPredF = await topPred(await loadModel("outerFBase"), img);
          const outF = evalOuter(outerPredF);
          detail.outer = { label: outF.label, prob: outF.prob, pass: outF.pass };
          if (outF.shouldStop) {
            passAll = false;
            window.ReactNativeWebView.postMessage(JSON.stringify({ type:"result", gender, genderTH, detail, passAll }));
            return;
          }

          // 3) เข็มขัด/เข็มกลัด/ต่างหู/กระดุม (ต้องมี)
          const bf = await topPred(await loadModel("beltFBase"), img);
          const p  = await topPred(await loadModel("pinFBase"),  img);
          const e  = await topPred(await loadModel("earFBase"),  img);
          const bt = await topPred(await loadModel("btnFBase"),  img);

          const passBeltF = passIfHas(bf.className,
            ["belt","withbelt","มีเข็มขัด","ใส่เข็มขัด"],
            ["no_belt","nobelt","ไม่มีเข็มขัด","ไม่ใส่เข็มขัด","ไม่มี"]
          );
          const passPin   = passIfHas(p.className,
            ["pin","brooch","มีเข็มกลัด","ติดเข็มกลัด","กลัด"],
            ["no_pin","nopin","ไม่มีเข็มกลัด","ไม่ติดเข็มกลัด","ไม่มี"]
          );
          const passEar   = passIfHas(e.className,
            ["earring","ต่างหู","ตุ้งติ้ง","มีต่างหู","ใส่ต่างหู"],
            ["no_earring","noearring","ไม่มีต่างหู","ไม่ใส่ต่างหู","ไม่มี"]
          );
          const passBtn   = passIfHas(bt.className,
            ["button","กระดุม","มีกระดุม","ติดกระดุม"],
            ["no_button","nobutton","ไม่มีกระดุม","ไม่ติดกระดุม","ไม่มี"]
          );

          detail.belt = { label:bf.className, prob:bf.probability, pass: passBeltF };
          detail.pin  = { label:p.className,  prob:p.probability,  pass: passPin   };
          detail.ear  = { label:e.className,  prob:e.probability,  pass: passEar   };
          detail.btn  = { label:bt.className, prob:bt.probability, pass: passBtn   };

          passAll = (outF.pass && passBeltF && passPin && passEar && passBtn);
        }

        window.ReactNativeWebView.postMessage(JSON.stringify({ type:"result", gender, genderTH, detail, passAll }));
      }catch(err){
        window.ReactNativeWebView.postMessage(JSON.stringify({ type:"error", message: err && err.message }));
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
    document.addEventListener("message", handleRNMessage); // Android
    window.addEventListener("message", handleRNMessage);  // iOS
  </script>
</body>
</html>`;
}
