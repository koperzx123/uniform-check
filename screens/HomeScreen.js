import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ImageBackground, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function HomeScreen({ navigation }) {
  return (
    <ImageBackground
      source={{ uri: 'https://images.unsplash.com/photo-1522199710521-72d69614c702?auto=format&fit=crop&w=1000&q=80' }}
      style={styles.bg}
      blurRadius={8}
    >
      {/* Overlay gradient */}
      <LinearGradient
        colors={['rgba(6, 8, 22, 0.9)', 'rgba(18, 24, 38, 0.8)']}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.container}>
        <Text style={styles.title}>UTCC Uniform Check</Text>
        <Text style={styles.subtitle}>ระบบตรวจสอบชุดนักศึกษายุคอนาคต ✦</Text>

        <View style={styles.cardContainer}>
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('เช็คชุดนักศึกษา')}
          >
            <Ionicons name="shirt-outline" size={40} color="#93C5FD" />
            <Text style={styles.cardText}>เช็คเครื่องแต่งกาย</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('ระเบียบการแต่งกาย')}
          >
            <Ionicons name="book-outline" size={40} color="#A5B4FC" />
            <Text style={styles.cardText}>อ่านระเบียบ</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('โปรไฟล์')}
          >
            <Ionicons name="person-outline" size={40} color="#C084FC" />
            <Text style={styles.cardText}>โปรไฟล์ผู้ใช้</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: {
    flex: 1,
    resizeMode: 'cover',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  title: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  cardContainer: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 16,
  },
  card: {
    width: 140,
    height: 140,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#60A5FA',
    shadowOpacity: 0.4,
    shadowRadius: 10,
  },
  cardText: {
    color: '#E0E7FF',
    fontSize: 14,
    marginTop: 10,
    textAlign: 'center',
    fontWeight: '600',
  },
});
