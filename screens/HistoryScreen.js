// screens/HistoryScreen.js
import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { supabase } from "../config/SupabaseClient";

export default function HistoryScreen({ navigation }) {
  const [studentId, setStudentId] = useState("");
  const [loading, setLoading] = useState(false);
  const [records, setRecords] = useState([]);

  async function fetchHistory() {
    const sid = studentId.trim();
    if (!sid) {
      alert("กรุณากรอกรหัสนักศึกษา");
      return;
    }

    try {
      setLoading(true);
      setRecords([]);

      const { data, error } = await supabase
        .from("checks")
        .select("id, student_id, created_at, gender, failed, pass_all")
        .eq("student_id", sid)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;

      if (!data || data.length === 0) {
        alert("ไม่พบประวัติการแต่งกายไม่ถูกระเบียบของรหัสนี้");
        setRecords([]);
      } else {
        setRecords(data);
      }
    } catch (e) {
      console.log("fetchHistory error", e);
      alert(e?.message || "ดึงประวัติไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }

  const genderTH = (g) =>
    g === "male" ? "ชาย" : g === "female" ? "หญิง" : "-";

  return (
    <View style={styles.container}>
      {/* พื้นหลังไล่สีฟ้าให้เข้าชุดกับแอป */}
      <LinearGradient
        colors={["#E0F7FF", "#DBEAFE"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.header}>
        <Text style={styles.title}>ประวัตินักศึกษาที่เคยไม่ผ่าน</Text>
        <Text style={styles.subtitle}>
          ค้นหาจากรหัสนักศึกษา เพื่อดูประวัติการแต่งกายที่ไม่ถูกระเบียบ
        </Text>
      </View>

      <View style={styles.searchCard}>
        <Text style={styles.label}>รหัสนักศึกษา</Text>
        <TextInput
          value={studentId}
          onChangeText={setStudentId}
          placeholder="เช่น 6601xxxxxxx"
          placeholderTextColor="rgba(15,23,42,0.45)"
          style={styles.input}
          autoCapitalize="none"
        />

        <View style={styles.searchRow}>
          <TouchableOpacity
            style={[styles.btn, styles.btnBack]}
            onPress={() => navigation.goBack()}
          >
            <Text style={[styles.btnText, { color: "#0F172A" }]}>กลับ</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.btn, styles.btnSearch]}
            onPress={fetchHistory}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#0F172A" />
            ) : (
              <Text style={styles.btnText}>ค้นหา</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.listWrap}>
        <Text style={styles.sectionTitle}>ผลการค้นหา</Text>

        <ScrollView style={styles.scroll}>
          {records.map((rec) => (
            <View key={rec.id} style={styles.itemCard}>
              <Text style={styles.itemTitle}>
                รหัส: {rec.student_id} ({genderTH(rec.gender)})
              </Text>
              <Text style={styles.itemMeta}>
                วันที่บันทึก:{" "}
                {rec.created_at
                  ? rec.created_at.replace("T", " ").slice(0, 19)
                  : "-"}
              </Text>
              <Text style={styles.itemMeta}>
                ผลรวม:{" "}
                <Text style={rec.pass_all ? styles.ok : styles.bad}>
                  {rec.pass_all ? "ผ่านเกณฑ์" : "ไม่ผ่านเกณฑ์"}
                </Text>
              </Text>

              {!rec.pass_all && rec.failed && rec.failed.length > 0 && (
                <Text style={styles.itemFailed}>
                  รายการที่ไม่ผ่าน: {rec.failed.join(" , ")}
                </Text>
              )}
            </View>
          ))}

          {!loading && records.length === 0 && (
            <Text style={styles.emptyText}>ยังไม่มีข้อมูลแสดง</Text>
          )}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#E0F7FF" },

  header: {
    paddingTop: 20,
    paddingHorizontal: 18,
    paddingBottom: 6,
  },
  title: {
    color: "#0F172A",
    fontSize: 20,
    fontWeight: "800",
  },
  subtitle: {
    color: "#1F2937",
    fontSize: 13,
    marginTop: 4,
  },

  searchCard: {
    marginHorizontal: 18,
    marginTop: 8,
    padding: 14,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.9)",
    borderWidth: 1,
    borderColor: "rgba(147,197,253,0.7)",
    shadowColor: "#7DD3FC",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
  },
  label: {
    color: "#0369A1",
    fontWeight: "700",
    marginBottom: 6,
  },
  input: {
    backgroundColor: "rgba(255,255,255,0.8)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#7DD3FC",
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: "#0F172A",
  },
  searchRow: {
    flexDirection: "row",
    marginTop: 12,
    gap: 10,
  },
  btn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
  },
  btnBack: {
    backgroundColor: "#DBEAFE",
    borderColor: "rgba(59,130,246,0.35)",
  },
  btnSearch: {
    backgroundColor: "#38BDF8",
    borderColor: "rgba(56,189,248,0.5)",
  },
  btnText: {
    fontWeight: "800",
    fontSize: 15,
    color: "#0F172A",
  },

  listWrap: {
    flex: 1,
    marginTop: 10,
    paddingHorizontal: 18,
    paddingBottom: 16,
  },
  sectionTitle: {
    color: "#0F172A",
    fontWeight: "700",
    marginBottom: 6,
  },
  scroll: {
    flex: 1,
  },

  itemCard: {
    backgroundColor: "rgba(239,246,255,0.98)",
    borderRadius: 14,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "rgba(129,140,248,0.45)",
  },
  itemTitle: {
    color: "#0F172A",
    fontWeight: "800",
    marginBottom: 2,
  },
  itemMeta: {
    color: "#1F2937",
    fontSize: 13,
  },
  itemFailed: {
    color: "#B91C1C",
    fontSize: 13,
    marginTop: 4,
    fontWeight: "700",
  },

  ok: { color: "#16A34A", fontWeight: "800" },
  bad: { color: "#DC2626", fontWeight: "800" },

  emptyText: {
    color: "#6B7280",
    textAlign: "center",
    marginTop: 8,
  },
});
