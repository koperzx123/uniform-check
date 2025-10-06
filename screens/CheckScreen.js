// screens/CheckScreen.js
import * as ImagePicker from "expo-image-picker";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { WebView } from "react-native-webview";

export default function CheckScreen() {
  const [html, setHtml] = useState(null);
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);

  const webRef = useRef(null);
  const webReadyRef = useRef(false);
  const pendingToSendRef = useRef(null);

  // Teachable Machine models
  const BELT_BASE = "https://teachablemachine.withgoogle.com/models/eEZr6bC50/";
  const TIE_BASE  = "https://teachablemachine.withgoogle.com/models/zQngMT6ot/";

  useEffect(() => {
    setHtml(buildPredictorHtml({ beltBase: BELT_BASE, tieBase: TIE_BASE }));
  }, []);

  async function pickAndAnalyze() {
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

      const a = res.assets[0];
      const mime = a.mimeType || "image/jpeg";
      const dataUrl = `data:${mime};base64,${a.base64}`;

      if (!webReadyRef.current) {
        pendingToSendRef.current = dataUrl;
      } else {
        setTimeout(() => webRef.current?.postMessage(JSON.stringify({ type: "image", dataUrl })), 250);
      }
    } catch (err) {
      console.log("pick error", err);
      Alert.alert("เกิดข้อผิดพลาด", err?.message || "ไม่สามารถเลือกรูปได้");
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
              setTimeout(() => webRef.current?.postMessage(JSON.stringify({ type: "image", dataUrl })), 250);
            }
          }}
          onMessage={(e) => {
            try {
              const msg = JSON.parse(e.nativeEvent.data);
              if (msg.type === "result") setResult(msg);
              else if (msg.type === "error") Alert.alert("โมเดลมีปัญหา", msg.message || "ไม่ทราบสาเหตุ");
            } catch {}
          }}
        />
      ) : (
        <View style={styles.center}>
          <Text style={{ color: "#9fb3c8" }}>กำลังโหลดโมเดล…</Text>
        </View>
      )}

      <TouchableOpacity onPress={pickAndAnalyze} style={styles.pickBtn} disabled={busy} activeOpacity={0.9}>
        {busy ? <ActivityIndicator color="#E5E7EB" /> : <Text style={styles.pickText}>เลือกรูปจากเครื่อง</Text>}
      </TouchableOpacity>

      <View style={styles.footer}>
        <Text style={styles.line}>
          เข็มขัด:{" "}
          <Text style={result?.belt?.pass ? styles.ok : styles.bad}>
            {result ? `${result.belt.label} ${(result.belt.prob * 100).toFixed(1)}%` : "-"}
          </Text>
        </Text>
        <Text style={styles.line}>
          เนคไท:{" "}
          <Text style={result?.tie?.pass ? styles.ok : styles.bad}>
            {result ? `${result.tie.label} ${(result.tie.prob * 100).toFixed(1)}%` : "-"}
          </Text>
        </Text>
        <Text style={[styles.line, { marginTop: 6 }]}>
          ผลรวม:{" "}
          <Text style={result?.passAll ? styles.ok : styles.bad}>
            {result ? (result.passAll ? "ผ่านเกณฑ์" : "ยังไม่ครบองค์ประกอบ") : "-"}
          </Text>
        </Text>
      </View>
    </View>
  );
}

/* ---------- HTML ฝั่ง WebView: ไม่มี backtick ซ้อน ---------- */
function buildPredictorHtml({ beltBase, tieBase }) {
  const TF_URL = "https://unpkg.com/@tensorflow/tfjs@4.13.0/dist/tf.min.js";
  const TM_URL = "https://unpkg.com/@teachablemachine/image@0.8.5/dist/teachablemachine-image.min.js";

  return `<!doctype html>
<html lang="th">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover" />
  <meta http-equiv="Content-Security-Policy"
        content="default-src * data: blob:; img-src * data: blob:; style-src 'self' 'unsafe-inline' *; script-src 'self' 'unsafe-inline' 'unsafe-eval' *;">
  <title>Uniform Check</title>
  <style>
    body{ margin:0; background:#0b0f2d; color:#e5e7eb; font-family:-apple-system,system-ui,sans-serif }
    .wrap{ padding:16px 12px 100px }
    .card{ background:rgba(255,255,255,.06); border:1px solid rgba(255,255,255,.12); border-radius:14px; padding:12px; margin-bottom:10px }
    .imgBox{ background:#0e1621; border-radius:12px; padding:8px }
    #preview{ width:100%; max-height:60vh; object-fit:contain; border-radius:10px }
    .k{ color:#93c5fd } .ok{ color:#34d399; font-weight:700 } .bad{ color:#f87171; font-weight:700 }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="card"><div id="tip" style="color:#a5b4fc">เลือกภาพแล้ว ระบบจะประมวลผลให้อัตโนมัติ</div></div>
    <div class="card imgBox"><img id="preview" /></div>
    <div class="card">
      <div><span class="k">เข็มขัด</span>: <span id="beltText">-</span></div>
      <div><span class="k">เนคไท</span>: <span id="tieText">-</span></div>
      <hr style="opacity:.15;margin:10px 0" />
      <div>ผลรวม: <span id="finalText">-</span></div>
    </div>
  </div>

  <script>
    // ---- helpers ----
    var BELT_BASE = ${JSON.stringify(beltBase)};
    var TIE_BASE  = ${JSON.stringify(tieBase)};
    function join(b,p){ return (b||'').replace(/\\/+$/,'') + '/' + (p||'').replace(/^\\/+/,''); }
    function loadScript(src){
      return new Promise(function(resolve,reject){
        var s=document.createElement('script');
        s.src=src; s.async=true;
        s.onload=function(){ resolve(true); };
        s.onerror=function(){ reject(new Error('load fail '+src)); };
        document.head.appendChild(s);
      });
    }
    async function ensureLibs(){
      if(!window.tf){ await loadScript("${TF_URL}"); }
      if(!window.tmImage){ await loadScript("${TM_URL}"); }
      if(!window.tmImage) throw new Error("tmImage not available");
    }

    var modelBelt, modelTie;

    async function loadModels(){
      await ensureLibs();

      var bM = join(BELT_BASE, "model.json");
      var bX = join(BELT_BASE, "metadata.json");
      var tM = join(TIE_BASE , "model.json");
      var tX = join(TIE_BASE , "metadata.json");

      if(!modelBelt){ modelBelt = await window.tmImage.load(bM,bX); }
      if(!modelTie ){ modelTie  = await window.tmImage.load(tM,tX); }
    }

    async function predict(img){
      try{
        await loadModels();

        var b = (await modelBelt.predict(img,false)).sort(function(x,y){return y.probability-x.probability;})[0];
        var t = (await modelTie.predict(img,false)).sort(function(x,y){return y.probability-x.probability;})[0];

        // ตรรกะ: positive เมื่อ label มีคำว่า belt/tie และไม่มี "no_belt"/"no_tie"
        function lb(s){ return (s||'').toLowerCase(); }
        var isBeltPositive = lb(b.className).includes('belt') && !lb(b.className).includes('no_belt');
        var isTiePositive  = lb(t.className).includes('tie')  && !lb(t.className).includes('no_tie');

        var passBelt = isBeltPositive && b.probability >= 0.80;
        var passTie  = isTiePositive  && t.probability >= 0.80;
        var passAll  = passBelt && passTie;

        var beltLabelTH = passBelt ? 'มีเข็มขัด' : 'ไม่มีเข็มขัด';
        var tieLabelTH  = passTie  ? 'มีเนคไท'   : 'ไม่มีเนคไท';

        // ⛔ ไม่มีการใช้ backtick ซ้อน แก้ syntax error
        document.getElementById('beltText').innerHTML =
          beltLabelTH + ' (' + (b.probability*100).toFixed(1) + '%) ' + (passBelt ? '<span class="ok">✓</span>' : '<span class="bad">✗</span>');
        document.getElementById('tieText').innerHTML  =
          tieLabelTH  + ' (' + (t.probability*100).toFixed(1) + '%) ' + (passTie  ? '<span class="ok">✓</span>' : '<span class="bad">✗</span>');
        document.getElementById('finalText').innerHTML =
          (passAll ? '<span class="ok">ผ่านเกณฑ์</span>' : '<span class="bad">ยังไม่ครบองค์ประกอบ</span>');

        window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify({
          type:'result',
          belt:{ label:b.className, prob:b.probability, pass:passBelt, labelTH:beltLabelTH },
          tie :{ label:t.className, prob:t.probability, pass:passTie,  labelTH:tieLabelTH  },
          passAll: passAll
        }));
      }catch(err){
        window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify({type:'error', message:String(err && err.message || err)}));
      }
    }

    function handleRNMessage(ev){
      var raw = typeof ev === 'string' ? ev : (ev && ev.data || '');
      try{
        var msg = JSON.parse(raw || '{}');
        if(msg.type === 'image' && msg.dataUrl){
          var img = document.getElementById('preview');
          img.src = msg.dataUrl;
          img.onload = function(){ predict(img); };
        }
      }catch(_){}
    }
    document.addEventListener('message', handleRNMessage); // Android
    window.addEventListener('message', handleRNMessage);  // iOS
  </script>
</body>
</html>`;
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
  line: { color: "#e5e7eb", fontSize: 14 },
  ok: { color: "#34D399", fontWeight: "700" },
  bad: { color: "#F87171", fontWeight: "700" },
  pickBtn: {
    position: "absolute",
    right: 16,
    bottom: 24,
    backgroundColor: "#1f2a44",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    zIndex: 2,
    elevation: 6,
  },
  pickText: { color: "#E5E7EB", fontWeight: "700" },
});
