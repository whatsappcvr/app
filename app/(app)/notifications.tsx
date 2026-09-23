import { View, Text, FlatList, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { useCallback, useMemo, useState } from 'react'
import { useNotificationsStore, isVisibleForRolls, type StoredNotification } from '../../src/notifications/store'
import { useAuthStore } from '../../src/auth/store'
import { syncFromServer } from '../../src/notifications/handlers'
import { NetworkStatusBanner } from '../../src/components/NetworkStatusBanner'
import { NotificationStatusBanner } from '../../src/components/NotificationStatusBanner'
import { AppBackground } from '../../src/components/AppBackground'

const GREEN = '#05245F'
const GREEN_LIGHT = '#DCE8FA'
const GREEN_ACCENT = '#073B8F'
const RED = '#C94343'
const ORANGE = '#D99A00'
const BLUE = '#0A4AA8'

type Filter = 'all' | 'academic' | 'fees' | 'general'

function timeAgo(dateStr: string | undefined | null): string {
  const time = dateStr ? new Date(dateStr).getTime() : NaN
  if (Number.isNaN(time)) return ''
  const diff = Date.now() - time
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} hours ago`
  const days = Math.floor(hours / 24)
  if (days === 1) return '1 day ago'
  return `${days} days ago`
}

const typeConfig: Record<string, { icon: string; color: string; bg: string }> = {
  absence: { icon: 'alert-circle', color: RED, bg: '#F6E2E2' },
  result: { icon: 'school', color: BLUE, bg: '#DCE8FA' },
  circular: { icon: 'megaphone', color: ORANGE, bg: '#FBF0D9' },
  fee: { icon: 'card', color: RED, bg: '#F6E2E2' },
  general: { icon: 'notifications', color: GREEN_ACCENT, bg: GREEN_LIGHT },
}

function getFilterForType(type: string): Filter {
  if (type === 'absence' || type === 'result') return 'academic'
  if (type === 'fee') return 'fees'
  return 'general'
}

function NotificationItem({ item, onPress }: { item: StoredNotification; onPress: () => void }) {
  const cfg = typeConfig[item.type] ?? typeConfig.general
  return (
    <TouchableOpacity style={[ni.container, !item.read && ni.containerUnread]} onPress={onPress} activeOpacity={0.7}>
      <View style={[ni.iconWrap, { backgroundColor: cfg.bg }]}>
        <Ionicons name={cfg.icon as any} size={20} color={cfg.color} />
      </View>
      <View style={ni.content}>
        <Text style={ni.title}>{item.title}</Text>
        <Text style={ni.body} numberOfLines={2}>{item.body}</Text>
      </View>
      <View style={ni.right}>
        <Text style={ni.time}>{timeAgo(item.created_at)}</Text>
        {!item.read && <View style={ni.unreadDot} />}
      </View>
    </TouchableOpacity>
  )
}

const ni = StyleSheet.create({
  container: {
    flexDirection: 'row', backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 8,
    elevation: 1, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, shadowOffset: { width: 0, height: 1 },
  },
  containerUnread: { backgroundColor: GREEN_LIGHT },
  iconWrap: { width: 42, height: 42, borderRadius: 21, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  content: { flex: 1, marginRight: 8 },
  title: { fontSize: 14, fontWeight: '600', color: '#1a1a1a', flexWrap: 'wrap' },
  body: { fontSize: 13, color: '#000', marginTop: 3, lineHeight: 18, flexWrap: 'wrap' },
  right: { alignItems: 'flex-end', flexShrink: 0, gap: 6 },
  time: { fontSize: 11, color: '#000' },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: GREEN_ACCENT },
})

export default function NotificationsScreen() {
  const items = useNotificationsStore((s) => s.items)
  const markRead = useNotificationsStore((s) => s.markRead)
  const markAllRead = useNotificationsStore((s) => s.markAllRead)
  // Select the wards array itself, then derive roll numbers with useMemo —
  // mapping inside the zustand selector returns a new array every render,
  // which reads as a store change and re-renders forever ("Maximum update
  // depth exceeded").
  const wards = useAuthStore((s) => s.wards)
  const wardRolls = useMemo(() => wards.map((w) => w.roll_number), [wards])
  const [filter, setFilter] = useState<Filter>('all')
  const [refreshing, setRefreshing] = useState(false)

  const handleRefresh = useCallback(() => {
    setRefreshing(true)
    syncFromServer().finally(() => setRefreshing(false))
  }, [])

  const visible = items.filter((n) => isVisibleForRolls(n, wardRolls))
  const unreadIds = visible.filter((n) => !n.read).map((n) => n.id)

  const handlePress = (item: StoredNotification) => {
    markRead(item.id)
    if (item.data?.circular_id) {
      router.push(`/(app)/circulars/${item.data.circular_id}`)
    }
  }

  const filtered = filter === 'all'
    ? visible
    : visible.filter((n) => getFilterForType(n.type) === filter)

  const filters: { key: Filter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'academic', label: 'Academic' },
    { key: 'fees', label: 'Fees' },
    { key: 'general', label: 'General' },
  ]

  return (
    <AppBackground style={styles.container}>
      <NetworkStatusBanner />
      <NotificationStatusBanner />
      {/* Filter Tabs */}
      <View style={styles.filterBar}>
        {filters.map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filterTab, filter === f.key && styles.filterTabActive]}
            onPress={() => setFilter(f.key)}
          >
            <Text style={[styles.filterText, filter === f.key && styles.filterTextActive]}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {unreadIds.length > 0 && (
        <View style={styles.markAllBar}>
          <Text style={styles.unreadText}>{unreadIds.length} unread</Text>
          <TouchableOpacity
            style={styles.markAllButton}
            onPress={() => markAllRead(unreadIds)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="checkmark-done" size={16} color={GREEN_ACCENT} />
            <Text style={styles.markAllText}>Mark all as read</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        contentContainerStyle={styles.content}
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <NotificationItem item={item} onPress={() => handlePress(item)} />}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[GREEN]} tintColor={GREEN} />}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Ionicons name="notifications-off-outline" size={48} color="#ddd" />
            <Text style={styles.empty}>No notifications yet.</Text>
          </View>
        }
      />
    </AppBackground>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 32 },

  filterBar: {
    flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 10, gap: 8,
    backgroundColor: '#fff',
  },
  filterTab: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1.5, borderColor: '#E0E0E0',
  },
  filterTabActive: { backgroundColor: GREEN, borderColor: GREEN },
  filterText: { fontSize: 13, fontWeight: '600', color: '#000' },
  filterTextActive: { color: '#fff' },

  markAllBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 12,
  },
  unreadText: { fontSize: 13, fontWeight: '600', color: '#000' },
  markAllButton: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  markAllText: { fontSize: 13, fontWeight: '600', color: GREEN_ACCENT },

  empty: { fontSize: 14, color: '#000', textAlign: 'center', marginTop: 12 },
  emptyWrap: { alignItems: 'center', marginTop: 60 },
})
