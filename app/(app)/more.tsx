import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import * as SecureStore from 'expo-secure-store'
import { useAuthStore } from '../../src/auth/store'
import { AppBackground } from '../../src/components/AppBackground'
import { unregisterPushNotifications } from '../../src/notifications/register'

const GREEN = '#05245F'
const GREEN_LIGHT = '#DCE8FA'
const GREEN_ACCENT = '#073B8F'
const LOGOUT_RED = '#C94343'

interface MenuItemProps {
  icon: string
  label: string
  onPress: () => void
  color?: string
  iconColor?: string
  showChevron?: boolean
}

function MenuItem({ icon, label, onPress, color = '#1a1a1a', iconColor = GREEN_ACCENT, showChevron = true }: MenuItemProps) {
  return (
    <TouchableOpacity style={mi.row} onPress={onPress} activeOpacity={0.6}>
      <View style={[mi.iconWrap, { backgroundColor: color === LOGOUT_RED ? '#F6E2E2' : GREEN_LIGHT }]}>
        <Ionicons name={icon as any} size={20} color={color === LOGOUT_RED ? LOGOUT_RED : iconColor} />
      </View>
      <Text style={[mi.label, { color }]}>{label}</Text>
      {showChevron && <Ionicons name="chevron-forward" size={18} color="#ccc" />}
    </TouchableOpacity>
  )
}

const mi = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  label: { flex: 1, fontSize: 15, fontWeight: '500' },
})

export default function MoreScreen() {
  const logout = useAuthStore((s) => s.logout)
  const activeWard = useAuthStore((s) => s.wards.find((w) => w.roll_number === s.activeWardRoll))

  function handleLogout() {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          // Must run before the JWT is cleared — the request needs to be authenticated.
          await unregisterPushNotifications()
          useAuthStore.getState().logout()
          await Promise.all([
            SecureStore.deleteItemAsync('jwt_parent'),
            SecureStore.deleteItemAsync('jwt_student'),
          ])
          router.replace('/(auth)/login')
        },
      },
    ])
  }

  function handleAbout() {
    Alert.alert('CVR Parent App', 'Version 1.0.0\n\nCVR College of Engineering')
  }

  return (
    <AppBackground style={styles.container}>
      <ScrollView style={styles.flex} contentContainerStyle={styles.content}>
      {activeWard && (
        <View style={styles.headerCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{activeWard.student_name?.charAt(0) ?? '?'}</Text>
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.headerName}>{activeWard.student_name}</Text>
            <Text style={styles.headerRoll}>{activeWard.roll_number}</Text>
          </View>
        </View>
      )}

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Academics</Text>
        <MenuItem icon="person-outline" label="Profile" onPress={() => router.push('/(app)/profile')} />
        <MenuItem icon="people-outline" label="Mentor" onPress={() => router.push('/(app)/mentor')} />
        <MenuItem
          icon="card-outline"
          label="Fee Payment"
          onPress={() => router.push('/(app)/payment')}
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Updates</Text>
        <MenuItem icon="megaphone-outline" label="Circulars" onPress={() => router.push('/(app)/circulars')} />
        <MenuItem
          icon="notifications-outline"
          label="Notifications"
          onPress={() => router.push('/(app)/notifications')}
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Settings</Text>
        <MenuItem icon="information-circle-outline" label="About" onPress={handleAbout} showChevron={false} />
      </View>

      <View style={styles.card}>
        <MenuItem
          icon="log-out-outline"
          label="Logout"
          onPress={handleLogout}
          color={LOGOUT_RED}
        />
      </View>

      <Text style={styles.version}>CVR Parent App v1.0.0</Text>
      </ScrollView>
    </AppBackground>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  content: { paddingBottom: 40 },

  headerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: GREEN,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    padding: 20,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { fontSize: 22, fontWeight: '700', color: '#fff' },
  headerInfo: { marginLeft: 14, flex: 1 },
  headerName: { fontSize: 17, fontWeight: '700', color: '#fff' },
  headerRoll: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 2 },

  card: {
    marginTop: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginHorizontal: 16,
    overflow: 'hidden',
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#000',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  version: {
    fontSize: 12,
    color: '#000',
    textAlign: 'center',
    marginTop: 32,
  },
})
