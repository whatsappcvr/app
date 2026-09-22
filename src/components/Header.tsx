import { View, Text, Image, TouchableOpacity, StyleSheet, Modal, FlatList, Pressable } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { useMemo, useState } from 'react'
import { useAuthStore } from '../auth/store'
import { useNotificationsStore, isVisibleForRolls } from '../notifications/store'

export function Avatar({ name, size = 36 }: { name: string; size?: number }) {
  const initial = (name || '?')[0].toUpperCase()
  return (
    <View style={[avatar.circle, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={[avatar.letter, { fontSize: size * 0.42 }]}>{initial}</Text>
    </View>
  )
}

const avatar = StyleSheet.create({
  circle: { backgroundColor: '#05245F', justifyContent: 'center', alignItems: 'center' },
  letter: { color: '#fff', fontWeight: '700' },
})

export function BackButton() {
  return (
    <TouchableOpacity onPress={() => router.back()} style={{ paddingHorizontal: 12 }} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
      <Ionicons name="chevron-back" size={26} color="#05245F" />
    </TouchableOpacity>
  )
}

export function AppBrand() {
  return (
    <View style={brand.container}>
      <Image source={require('../../assets/icon.png')} style={brand.logo} />
      <View style={brand.textWrap}>
        <Text style={brand.title} maxFontSizeMultiplier={1.2} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>CVR</Text>
        <Text style={brand.subtitle} maxFontSizeMultiplier={1.2} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>College of Engineering</Text>
      </View>
    </View>
  )
}

const brand = StyleSheet.create({
  container: { paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1 },
  logo: { width: 36, height: 36, borderRadius: 18 },
  textWrap: { flexShrink: 1 },
  title: { fontSize: 19, fontWeight: '700', color: '#05245F', letterSpacing: 1, paddingHorizontal: 2, width: '100%' },
  subtitle: { fontSize: 11, color: '#000', marginTop: -2, paddingHorizontal: 2, width: '100%' },
})

export function NotificationBell() {
  // Select the wards array itself (a stable reference from the store), then
  // derive roll numbers with useMemo — mapping inside the zustand selector
  // returns a new array every render, which Notifications' subscription
  // treats as a store change and re-renders forever ("Maximum update depth
  // exceeded").
  const wards = useAuthStore((s) => s.wards)
  const wardRolls = useMemo(() => wards.map((w) => w.roll_number), [wards])
  const unreadCount = useNotificationsStore(
    (s) => s.items.filter((n) => !n.read && isVisibleForRolls(n, wardRolls)).length,
  )

  return (
    <TouchableOpacity
      style={bell.container}
      onPress={() => router.push('/(app)/notifications')}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    >
      <Ionicons name="notifications-outline" size={24} color="#10213F" />
      {unreadCount > 0 && (
        <View style={bell.badge}>
          <Text style={bell.badgeText} numberOfLines={1}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
        </View>
      )}
    </TouchableOpacity>
  )
}

const bell = StyleSheet.create({
  container: { paddingHorizontal: 8, justifyContent: 'center', alignItems: 'center' },
  badge: {
    position: 'absolute', top: 0, right: 2, backgroundColor: '#C94343', borderRadius: 9,
    minWidth: 18, height: 18, paddingHorizontal: 3, justifyContent: 'center', alignItems: 'center',
  },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
})

export function WardSwitcher({ compact = false }: { compact?: boolean }) {
  const [visible, setVisible] = useState(false)
  const wards = useAuthStore((s) => s.wards)
  const activeWardRoll = useAuthStore((s) => s.activeWardRoll)
  const switchWard = useAuthStore((s) => s.switchWard)

  const activeWard = wards.find((w) => w.roll_number === activeWardRoll)
  const firstName = activeWard?.student_name?.split(' ')[0] ?? ''

  return (
    <>
      <TouchableOpacity style={ws.container} onPress={() => wards.length > 1 && setVisible(true)}>
        <View style={ws.row}>
          <Avatar name={firstName} size={compact ? 28 : 32} />
          {!compact && <Text style={ws.name} numberOfLines={1}>{firstName}</Text>}
          {wards.length > 1 && (
            <Ionicons name="chevron-down" size={16} color="#60708A" style={{ marginLeft: 2 }} />
          )}
        </View>
      </TouchableOpacity>

      <Modal visible={visible} transparent animationType="fade">
        <Pressable style={ws.overlay} onPress={() => setVisible(false)}>
          <Pressable style={ws.modal} onPress={(e) => e.stopPropagation()}>
            <View style={ws.modalHeader}>
              <Text style={ws.modalTitle}>Select Child</Text>
              <TouchableOpacity onPress={() => setVisible(false)}>
                <Ionicons name="close" size={24} color="#10213F" />
              </TouchableOpacity>
            </View>

            <FlatList
              data={wards}
              keyExtractor={(w) => w.roll_number}
              renderItem={({ item }) => {
                const isActive = item.roll_number === activeWardRoll
                const childFirst = item.student_name?.split(' ')[0] ?? ''
                return (
                  <TouchableOpacity
                    style={[ws.wardItem, isActive && ws.wardItemActive]}
                    onPress={() => { switchWard(item.roll_number); setVisible(false) }}
                  >
                    <Avatar name={childFirst} size={40} />
                    <View style={ws.wardInfo}>
                      <Text style={ws.wardName}>{item.student_name}</Text>
                      <Text style={ws.wardDetail}>{item.branch_name} - {item.section}</Text>
                      <Text style={ws.wardRoll}>{item.roll_number}</Text>
                    </View>
                    {isActive && (
                      <Ionicons name="checkmark-circle" size={24} color="#05245F" />
                    )}
                  </TouchableOpacity>
                )
              }}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </>
  )
}

const ws = StyleSheet.create({
  container: { paddingHorizontal: 16 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  name: { fontSize: 16, fontWeight: '600', color: '#10213F', maxWidth: 150 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modal: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '70%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#10213F' },
  wardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 8,
    gap: 12,
  },
  wardItemActive: { backgroundColor: '#DCE8FA' },
  wardInfo: { flex: 1 },
  wardName: { fontSize: 16, fontWeight: '600', color: '#10213F' },
  wardDetail: { fontSize: 13, color: '#000', marginTop: 2 },
  wardRoll: { fontSize: 12, color: '#000', marginTop: 1 },
})
