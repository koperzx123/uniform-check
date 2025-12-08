// screens/HistoryScreen.js
import DateTimePicker from "@react-native-community/datetimepicker";
import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "../config/SupabaseClient";

export default function HistoryScreen({ navigation }) {
  const [date, setDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [records, setRecords] = useState([]);
  const [showImageModal, setShowImageModal] = useState(false);
  const [currentImage, setCurrentImage] = useState(null);

  const onChangeDate = (event, selectedDate) => {
    const currentDate = selectedDate || date;
    setShowPicker(Platform.OS === 'ios');
    setDate(currentDate);
  };

  async function fetchHistory() {
    try {
      setLoading(true);
      setRecords([]);

      // Create start and end of the selected day
      // Use local YYYY-MM-DD to construct ISO string for querying Supabase
      // because DB stores Local Time as if it were UTC.
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');

      const startISO = `${year}-${month}-${day}T00:00:00.000Z`;
      const endISO = `${year}-${month}-${day}T23:59:59.999Z`;

      console.log("Query Range:", startISO, "to", endISO);

      const { data, error } = await supabase
        .from("checks")
        .select("id, student_id, created_at, gender, failed, pass_all, image_url")
        .eq("pass_all", false)
        .gte("created_at", startISO)
        .lte("created_at", endISO)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Supabase Error:", error);
        throw error;
      }

      console.log("Found records:", data?.length);

      if (!data || data.length === 0) {
        alert(`ไม่พบข้อมูลวันที่ ${formatDate(date)}`);
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

  // Helper to format date for display
  const formatDate = (d) => {
    return d.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

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
          เลือกวันที่ เพื่อดูประวัติการแต่งกายที่ไม่ถูกระเบียบ
        </Text>
      </View>

      <View style={styles.searchCard}>
        <Text style={styles.label}>วันที่ตรวจสอบ</Text>

        <TouchableOpacity
          style={styles.dateButton}
          onPress={() => setShowPicker(true)}
        >
          <Text style={styles.dateText}>{formatDate(date)}</Text>
        </TouchableOpacity>

        {showPicker && (
          <DateTimePicker
            value={date}
            mode="date"
            display="default"
            onChange={onChangeDate}
            maximumDate={new Date()}
          />
        )}

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
        <Text style={styles.sectionTitle}>ผลการค้นหา {formatDate(date)}</Text>

        <ScrollView style={styles.scroll}>
          {records.map((rec) => (
            <View key={rec.id} style={styles.itemCard}>
              <Text style={styles.itemTitle}>
                รหัส: {rec.student_id} ({genderTH(rec.gender)})
              </Text>
              <Text style={styles.itemMeta}>
                วันที่บันทึก:{" "}
                {rec.created_at
                  ? new Date(rec.created_at.replace("Z", "").replace("+00:00", "")).toLocaleDateString('th-TH', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  }) + " น."
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

              {rec.image_url && (
                <TouchableOpacity
                  style={styles.viewImageBtn}
                  onPress={() => {
                    setCurrentImage(rec.image_url);
                    setShowImageModal(true);
                  }}
                >
                  <Text style={styles.viewImageText}>📸 ดูรูปถ่าย</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}

          {!loading && records.length === 0 && (
            <Text style={styles.emptyText}>ยังไม่มีข้อมูลแสดง</Text>
          )}
        </ScrollView>
      </View>


      <Modal
        visible={showImageModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowImageModal(false)}
      >
        <View style={styles.modalBg}>
          <TouchableOpacity
            style={styles.modalCloseArea}
            activeOpacity={1}
            onPress={() => setShowImageModal(false)}
          >
            <View style={styles.modalContent}>
              {currentImage && (
                <Image
                  source={{ uri: currentImage }}
                  style={styles.fullImage}
                  resizeMode="contain"
                />
              )}
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={() => setShowImageModal(false)}
              >
                <Text style={styles.closeText}>ปิด</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </View>
      </Modal>
    </View >
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
  dateButton: {
    backgroundColor: "rgba(255,255,255,0.8)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#7DD3FC",
    paddingHorizontal: 12,
    paddingVertical: 12,
    justifyContent: 'center',
  },
  dateText: {
    color: "#0F172A",
    fontSize: 16,
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

  viewImageBtn: {
    backgroundColor: "#E0F2FE",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    alignSelf: "flex-start",
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#BAE6FD",
  },
  viewImageText: {
    color: "#0284C7",
    fontSize: 12,
    fontWeight: "700",
  },
  modalBg: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.85)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalCloseArea: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "90%",
    height: "80%",
    justifyContent: "center",
    alignItems: "center",
  },
  fullImage: {
    width: "100%",
    height: "85%",
    borderRadius: 8,
    marginBottom: 10,
  },
  closeBtn: {
    backgroundColor: "white",
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
  },
  closeText: {
    color: "#0F172A",
    fontWeight: "800",
  },
});
