// screens/DressCodeScreen.js
import { ScrollView, StyleSheet, Text } from 'react-native';

export default function DressCodeScreen() {
  return (
    <ScrollView style={s.container} contentContainerStyle={{ paddingVertical: 24 }}>
      <Text style={s.title}>ระเบียบการแต่งกาย</Text>
      <Text style={s.item}>• เสื้อเชิ้ตนักศึกษา ตรากระดุมโลหะ UTCC</Text>
      <Text style={s.item}>• ชาย: กางเกงสแลคสีเข้ม / เข็มขัดหัวโลโก้ / รองเท้าหนังดำ</Text>
      <Text style={s.item}>• หญิง: กระโปรง/เข็มขัดโลโก้ / รองเท้าหุ้มส้นสีดำ</Text>
      <Text style={s.item}>• บัตรนักศึกษาติดให้เห็นชัด</Text>
      <Text style={s.note}>* ปรับข้อความให้ตรงระเบียบของคณะ/มหาวิทยาลัยคุณ</Text>
    </ScrollView>
  );
}
const s = StyleSheet.create({
  container:{ flex:1, backgroundColor:'#0E1621', paddingHorizontal:18 },
  title:{ color:'#fff', fontSize:20, fontWeight:'700', marginTop:16, marginBottom:12 },
  item:{ color:'#D1D5DB', marginBottom:8 },
  note:{ color:'#9fb3c8', marginTop:16, fontStyle:'italic' }
});
