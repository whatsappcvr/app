import { View, Text, TouchableOpacity, StyleSheet, StatusBar, Image } from 'react-native'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { AppBackground } from '../../src/components/AppBackground'

export default function LoginScreen() {
  return (
    <AppBackground style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Image source={require('../../assets/icon.png')} style={styles.logoImage} resizeMode="contain" />
          <Text style={styles.title}>CVR College of Engineering</Text>
          <Text style={styles.brandSub}>CampuzSync</Text>
          <Text style={styles.subtitle}>Continue as</Text>
        </View>

        <TouchableOpacity
          style={styles.roleCard}
          onPress={() => router.push('/(auth)/parent-login')}
        >
          <View style={styles.roleIconCircle}>
            <Ionicons name="people-outline" size={28} color="#fff" />
          </View>
          <View style={styles.roleTextWrap}>
            <Text style={styles.roleTitle}>Parent Login</Text>
            <Text style={styles.roleSubtitle}>Track your ward's attendance, results & more</Text>
          </View>
          <Ionicons name="chevron-forward" size={22} color="#999" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.roleCard}
          onPress={() => router.push('/(auth)/student-login')}
        >
          <View style={[styles.roleIconCircle, styles.studentIconCircle]}>
            <Ionicons name="school-outline" size={28} color="#fff" />
          </View>
          <View style={styles.roleTextWrap}>
            <Text style={styles.roleTitle}>Student Login</Text>
            <Text style={styles.roleSubtitle}>View your own academic details</Text>
          </View>
          <Ionicons name="chevron-forward" size={22} color="#999" />
        </TouchableOpacity>
      </View>
    </AppBackground>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, justifyContent: 'center', paddingHorizontal: 24 },
  logoContainer: { alignItems: 'center', marginBottom: 40 },
  logoImage: {
    width: 80,
    height: 80,
    marginBottom: 16,
  },
  title: { fontSize: 22, fontWeight: '700', color: '#05245F', textAlign: 'center' },
  brandSub: { fontSize: 13, color: '#F4C400', fontWeight: '700', textAlign: 'center', marginTop: 4, marginBottom: 20, letterSpacing: 1, textTransform: 'uppercase' },
  subtitle: { fontSize: 15, color: '#000', textAlign: 'center' },
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 16,
    padding: 16,
    marginTop: 20,
    backgroundColor: '#f8f9fb',
  },
  roleIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#05245F',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  studentIconCircle: { backgroundColor: '#073B8F' },
  roleTextWrap: { flex: 1 },
  roleTitle: { fontSize: 17, fontWeight: '700', color: '#05245F' },
  roleSubtitle: { fontSize: 12, color: '#666', marginTop: 2 },
})
