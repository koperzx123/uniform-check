import { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { supabase } from '../config/SupabaseClient';

export default function AuthScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const signIn = async () => {
    if (!email || !password) return Alert.alert('กรุณากรอกข้อมูลให้ครบ');
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) Alert.alert('เข้าสู่ระบบไม่สำเร็จ', error.message);
  };

  const signUp = async () => {
    if (!email || !password) return Alert.alert('กรุณากรอกข้อมูลให้ครบ');
    setLoading(true);
    const { error } = await supabase.auth.signUp({ email, password });
    setLoading(false);
    if (error) Alert.alert('สมัครสมาชิกไม่สำเร็จ', error.message);
    else Alert.alert('สมัครสำเร็จ', 'ตรวจสอบอีเมลเพื่อยืนยันบัญชี');
  };

  const resetPassword = async () => {
    if (!email) return Alert.alert('กรุณาใส่อีเมลก่อน');
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) Alert.alert('เกิดข้อผิดพลาด', error.message);
    else Alert.alert('ส่งลิงก์รีเซ็ตรหัสผ่านแล้ว', 'ตรวจสอบอีเมลของคุณ');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>UTCC Uniform Check</Text>
      <Text style={styles.subtitle}>เข้าสู่ระบบ</Text>

      <TextInput
        style={styles.input}
        placeholder="อีเมล"
        placeholderTextColor="#94a3b8"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="รหัสผ่าน"
        placeholderTextColor="#94a3b8"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity style={styles.btn} onPress={signIn} disabled={loading}>
        <Text style={styles.btnText}>เข้าสู่ระบบ</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.btn, { backgroundColor: '#10b981' }]} onPress={signUp}>
        <Text style={styles.btnText}>สมัครสมาชิก</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.btn, { backgroundColor: '#64748b' }]} onPress={resetPassword}>
        <Text style={styles.btnText}>ลืมรหัสผ่าน</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0b1220', justifyContent: 'center', padding: 20 },
  title: { color: '#fff', fontSize: 22, fontWeight: 'bold', marginBottom: 6 },
  subtitle: { color: '#94a3b8', marginBottom: 16 },
  input: {
    backgroundColor: '#0f172a',
    color: '#e2e8f0',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
  },
  btn: { backgroundColor: '#2563eb', padding: 12, borderRadius: 10, marginTop: 8 },
  btnText: { color: '#fff', textAlign: 'center', fontWeight: '600' },
});
