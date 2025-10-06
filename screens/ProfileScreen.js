import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { supabase } from '../config/SupabaseClient';

export default function ProfileScreen({ navigation }) {
  const [email, setEmail] = useState('-');

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      setEmail(data?.user?.email ?? '-');
    })();
  }, []);

  async function onLogout() {
    await supabase.auth.signOut();
    navigation.replace('Login');
  }

  return (
    <View style={s.container}>
      <LinearGradient
        colors={['#060816', '#0b0f2d', '#1a1f4d']}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={s.card}>
        <Ionicons name="person-circle" size={72} color="#A5B4FC" />
        <Text style={s.name}>{email}</Text>
        <Text style={s.caption}>UTCC Uniform Account</Text>

        <TouchableOpacity style={s.logout} activeOpacity={0.9} onPress={onLogout}>
          <Text style={s.logoutText}>Log out</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container:{ flex:1, justifyContent:'center', alignItems:'center' },
  card:{
    width:'86%', backgroundColor:'rgba(10,14,28,0.6)', borderRadius:20,
    borderWidth:1, borderColor:'rgba(255,255,255,0.12)', alignItems:'center',
    paddingVertical:28, paddingHorizontal:18
  },
  name:{ color:'#fff', fontSize:18, fontWeight:'700', marginTop:10 },
  caption:{ color:'#9fb3c8', marginTop:4, marginBottom:18 },
  logout:{
    marginTop:10, backgroundColor:'#ef4444', paddingVertical:12, paddingHorizontal:18,
    borderRadius:12, width:'100%', alignItems:'center'
  },
  logoutText:{ color:'#fff', fontWeight:'700' }
});
