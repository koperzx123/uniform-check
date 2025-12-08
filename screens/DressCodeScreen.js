// screens/DressCodeScreen.js
import { LinearGradient } from "expo-linear-gradient";
import {
  Dimensions,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

const { width } = Dimensions.get("window");

// รูปชาย - หญิง (แนวนอน ครบองค์ประกอบ)
const MALE_IMG =
  "https://img2.pic.in.th/pic/M397eb2c872f28bc3.jpg";
const FEMALE_IMG =
  "https://img2.pic.in.th/pic/F2fb5f1868121ce32.jpg";

export default function DressCodeScreen() {
  return (
    <View style={s.wrap}>
      {/* พื้นหลังฟ้าใส */}
      <LinearGradient
        colors={["#E0F7FF", "#BAE6FD", "#A5F3FC"]}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <ScrollView
        style={s.container}
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={s.title}>ระเบียบการแต่งกายนักศึกษา</Text>

        {/* รูปคู่เต็มจอ */}
        <View style={s.fullImgWrap}>
          <Image source={{ uri: MALE_IMG }} style={s.fullImg} />
          <Text style={s.caption}>ตัวอย่างเครื่องแต่งกาย (นักศึกษาชาย)</Text>
        </View>

        <View style={s.fullImgWrap}>
          <Image source={{ uri: FEMALE_IMG }} style={s.fullImg} />
          <Text style={s.caption}>ตัวอย่างเครื่องแต่งกาย (นักศึกษาหญิง)</Text>
        </View>

        {/* กฎนักศึกษาชาย */}
        <Text style={s.section}>นักศึกษาชาย</Text>
        <View style={s.card}>
          <Text style={s.item}>• เสื้อเชิ้ตแขนสั้นหรือแขนยาวสีขาวแบบเรียบ</Text>
          <Text style={s.item}>• กางเกงขายาวสีดำหรือสีกรมท่า ไม่ใช่ผ้ายีนส์หรือผ้ามัน</Text>
          <Text style={s.item}>• ติดเข็มตรามหาวิทยาลัยด้านหน้า</Text>
          <Text style={s.item}>• คาดเข็มขัดหัวโลโก้มหาวิทยาลัย</Text>
          <Text style={s.item}>• สวมรองเท้าหนังหุ้มส้นสีดำ ไม่เปิดส้น ไม่เปิดปลายเท้า</Text>
          <Text style={s.item}>• ถุงเท้าสีดำหรือสีสุภาพ</Text>
        </View>

        {/* กฎนักศึกษาหญิง */}
        <Text style={s.section}>นักศึกษาหญิง</Text>
        <View style={s.card}>
          <Text style={s.item}>• เสื้อเชิ้ตนักศึกษาติดกระดุมโลหะ UTCC</Text>
          <Text style={s.item}>• กระโปรงทรงเอ หรือทรงตรง สีดำ / กรมท่า ความยาวเหมาะสม</Text>
          <Text style={s.item}>• เข็มขัดหัวโลโก้มหาวิทยาลัย</Text>
          <Text style={s.item}>• สวมรองเท้าหุ้มส้นสีดำ</Text>
          <Text style={s.item}>• ผมสุภาพ เรียบร้อย</Text>
        </View>

        <Text style={s.note}>* ข้อกำหนดอาจแตกต่างตามคณะ โปรดตรวจสอบเพิ่มเติม</Text>
      </ScrollView>
    </View>
  );
}

const IMG_HEIGHT = width * 0.7;

const s = StyleSheet.create({
  wrap: { flex: 1 },
  container: { flex: 1 },
  content: {
    paddingHorizontal: 18,
    paddingBottom: 32,
    paddingTop: Platform.select({ ios: 60, android: 40 }),
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#0F172A",
    textAlign: "center",
    marginBottom: 24,
  },

  fullImgWrap: { marginBottom: 24 },
  fullImg: {
    width: "100%",
    height: IMG_HEIGHT,
    borderRadius: 18,
  },
  caption: {
    color: "#0F172A",
    textAlign: "center",
    marginTop: 8,
    fontWeight: "600",
  },

  section: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0369A1",
    marginTop: 14,
    marginBottom: 8,
  },

  card: {
    backgroundColor: "rgba(255,255,255,0.3)",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(147,197,253,0.55)",
    marginBottom: 18,
  },
  item: { color: "#0F172A", marginBottom: 6, fontSize: 15 },
  note: { textAlign: "center", color: "rgba(15,23,42,0.5)", marginTop: 8 },
});
