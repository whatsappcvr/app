import { View, Text, StyleSheet, TouchableOpacity, Linking, ScrollView, Modal, Pressable } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useAuthStore } from '../../src/auth/store'
import { useMentor } from '../../src/api/queries'
import { useState } from 'react'
import { NetworkStatusBanner } from '../../src/components/NetworkStatusBanner'
import { NotificationStatusBanner } from '../../src/components/NotificationStatusBanner'
import { LoadingView } from '../../src/components/LoadingView'
import { AppBackground } from '../../src/components/AppBackground'

const GREEN = '#05245F'
const GREEN_LIGHT = '#DCE8FA'
const GREEN_ACCENT = '#073B8F'

export default function MentorScreen() {
  const roll = useAuthStore((s) => s.activeWardRoll) ?? ''
  const { data: mentor, isLoading } = useMentor(roll)
  const [showContact, setShowContact] = useState(false)

  if (isLoading) {
    return <AppBackground style={styles.center}><LoadingView /></AppBackground>
  }

  if (!mentor) {
    return (
      <AppBackground style={styles.center}>
      <NetworkStatusBanner />
      <NotificationStatusBanner />
        <Ionicons name="person-circle-outline" size={64} color="#ccc" />
        <Text style={styles.emptyText}>No mentor assigned yet.</Text>
      </AppBackground>
    )
  }

  const whatsappUrl = `https://wa.me/${mentor.phone.replace(/[^0-9]/g, '')}`

  return (
    <AppBackground style={styles.container}>
      <ScrollView style={styles.flex} contentContainerStyle={styles.content}>
      <NetworkStatusBanner />
      <NotificationStatusBanner />
      {/* Mentor Header */}
      <View style={styles.headerCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{mentor.name.charAt(0)}</Text>
        </View>
        <Text style={styles.name}>{mentor.name || 'Not available'}</Text>
        <Text style={styles.department}>{mentor.phone || 'Not provided'}</Text>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => Linking.openURL(`tel:${mentor.phone}`)}>
          <View style={styles.actionIcon}>
            <Ionicons name="call" size={22} color="#fff" />
          </View>
          <Text style={styles.actionLabel}>Call</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => Linking.openURL(whatsappUrl)}>
          <View style={styles.actionIcon}>
            <Ionicons name="logo-whatsapp" size={22} color="#fff" />
          </View>
          <Text style={styles.actionLabel}>WhatsApp</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => Linking.openURL(`mailto:${mentor.email}`)}>
          <View style={styles.actionIcon}>
            <Ionicons name="mail" size={22} color="#fff" />
          </View>
          <Text style={styles.actionLabel}>Email</Text>
        </TouchableOpacity>
      </View>

      {/* Description */}
      <Text style={styles.description}>
        For academic guidance, performance discussion or any concerns, please feel free to contact your mentor.
      </Text>

      {/* Contact Button */}
      <TouchableOpacity style={styles.contactBtn} onPress={() => setShowContact(true)} activeOpacity={0.8}>
        <Ionicons name="chatbubbles-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
        <Text style={styles.contactBtnText}>Contact Mentor</Text>
      </TouchableOpacity>

      {/* Bottom Sheet Modal */}
      <Modal visible={showContact} transparent animationType="slide" onRequestClose={() => setShowContact(false)}>
        <Pressable style={styles.overlay} onPress={() => setShowContact(false)} />
        <View style={styles.bottomSheet}>
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitle}>Contact Mentor</Text>

          <TouchableOpacity style={styles.sheetOption} onPress={() => { setShowContact(false); Linking.openURL(`tel:${mentor.phone}`) }}>
            <View style={[styles.sheetIcon, { backgroundColor: GREEN_LIGHT }]}>
              <Ionicons name="call" size={22} color={GREEN_ACCENT} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.sheetOptTitle}>Call</Text>
              <Text style={styles.sheetOptSub}>{mentor.phone}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#ccc" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.sheetOption} onPress={() => { setShowContact(false); Linking.openURL(whatsappUrl) }}>
            <View style={[styles.sheetIcon, { backgroundColor: '#DCE8FA' }]}>
              <Ionicons name="logo-whatsapp" size={22} color="#25D366" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.sheetOptTitle}>Chat on WhatsApp</Text>
              <Text style={styles.sheetOptSub}>Send a message</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#ccc" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.sheetOption} onPress={() => { setShowContact(false); Linking.openURL(`mailto:${mentor.email}`) }}>
            <View style={[styles.sheetIcon, { backgroundColor: '#DCE8FA' }]}>
              <Ionicons name="mail" size={22} color="#0A4AA8" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.sheetOptTitle}>Send Email</Text>
              <Text style={styles.sheetOptSub}>{mentor.email}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#ccc" />
          </TouchableOpacity>
        </View>
      </Modal>
      </ScrollView>
    </AppBackground>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  content: { padding: 16, paddingBottom: 32 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 15, color: '#000', marginTop: 12 },

  headerCard: {
    backgroundColor: '#fff', borderRadius: 20, padding: 28, alignItems: 'center', marginBottom: 20,
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 2 },
  },
  avatar: {
    width: 88, height: 88, borderRadius: 44, backgroundColor: GREEN,
    justifyContent: 'center', alignItems: 'center', marginBottom: 14,
  },
  avatarText: { fontSize: 36, fontWeight: '700', color: '#fff' },
  name: { fontSize: 19, fontWeight: '700', color: '#1a1a1a', textAlign: 'center', width: '100%' },
  department: { fontSize: 12, color: '#000', marginTop: 4, textAlign: 'center', width: '100%' },

  actionRow: { flexDirection: 'row', justifyContent: 'center', gap: 24, marginBottom: 20 },
  actionBtn: { alignItems: 'center' },
  actionIcon: {
    width: 52, height: 52, borderRadius: 26, backgroundColor: GREEN_ACCENT,
    justifyContent: 'center', alignItems: 'center', marginBottom: 6,
  },
  actionLabel: { fontSize: 12, fontWeight: '600', color: '#000' },

  description: { fontSize: 13, color: '#000', textAlign: 'center', lineHeight: 20, marginVertical: 16, paddingHorizontal: 8 },

  contactBtn: {
    flexDirection: 'row', backgroundColor: GREEN_ACCENT, borderRadius: 14,
    paddingVertical: 16, justifyContent: 'center', alignItems: 'center',
    elevation: 2, shadowColor: GREEN, shadowOpacity: 0.3, shadowRadius: 6, shadowOffset: { width: 0, height: 3 },
  },
  contactBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  bottomSheet: {
    backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: 20, paddingBottom: 36, paddingTop: 12,
  },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#E0E0E0', alignSelf: 'center', marginBottom: 16 },
  sheetTitle: { fontSize: 18, fontWeight: '700', color: '#1a1a1a', marginBottom: 16 },
  sheetOption: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 14, gap: 14,
    borderBottomWidth: 1, borderBottomColor: '#F5F5F5',
  },
  sheetIcon: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  sheetOptTitle: { fontSize: 15, fontWeight: '600', color: '#1a1a1a' },
  sheetOptSub: { fontSize: 12, color: '#000', marginTop: 1 },
})
