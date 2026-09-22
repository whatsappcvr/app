import { View, Text, FlatList, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useCirculars } from '../../../src/api/queries'
import { useState, useCallback } from 'react'
import type { Circular } from '../../../src/types'
import { AppBackground } from '../../../src/components/AppBackground'

const GREEN_ACCENT = '#073B8F'

const categoryColors: Record<string, { bg: string; text: string }> = {
  holiday: { bg: '#FBF0D9', text: '#D99A00' },
  exam: { bg: '#F6E2E2', text: '#C62828' },
  general: { bg: '#DCE8FA', text: '#0A4AA8' },
}
const defaultCategory = { bg: '#F5F5F5', text: '#616161' }

function formatRelativeDate(dateStr: string): string {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diffMs = now - then
  const diffMins = Math.floor(diffMs / 60000)
  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 7) return `${diffDays}d ago`
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

function CircularItem({ item }: { item: Circular }) {
  const cc = categoryColors[item.category] ?? defaultCategory
  return (
    <TouchableOpacity
      style={ci.container}
      onPress={() => router.push(`/(app)/circulars/${item.id}`)}
      activeOpacity={0.7}
    >
      <View style={ci.header}>
        <View style={[ci.badge, { backgroundColor: cc.bg }]}>
          <Text style={[ci.badgeText, { color: cc.text }]}>{item.category}</Text>
        </View>
        {item.attachment_url ? (
          <Ionicons name="attach" size={16} color="#999" />
        ) : null}
      </View>
      <Text style={ci.title}>{item.title}</Text>
      <Text style={ci.body} numberOfLines={2}>{item.body}</Text>
      <Text style={ci.date}>{formatRelativeDate(item.published_at)}</Text>
    </TouchableOpacity>
  )
}

const ci = StyleSheet.create({
  container: {
    backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 10,
    elevation: 1, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, shadowOffset: { width: 0, height: 1 },
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  badgeText: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  title: { fontSize: 15, fontWeight: '700', color: '#1a1a1a', marginBottom: 4 },
  body: { fontSize: 13, color: '#000', lineHeight: 19, marginBottom: 8 },
  date: { fontSize: 12, color: '#000', textAlign: 'right' },
})

export default function CircularsScreen() {
  const { data, refetch, isLoading } = useCirculars()
  const [refreshing, setRefreshing] = useState(false)
  const onRefresh = useCallback(async () => { setRefreshing(true); await refetch(); setRefreshing(false) }, [refetch])

  return (
    <AppBackground style={styles.container}>
      <FlatList
        style={styles.flex}
        contentContainerStyle={styles.content}
        data={data}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => <CircularItem item={item} />}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={GREEN_ACCENT} />}
        ListEmptyComponent={
          isLoading
            ? <Text style={styles.empty}>Loading circulars...</Text>
            : <View style={styles.emptyWrap}>
                <Ionicons name="megaphone-outline" size={48} color="#ddd" />
                <Text style={styles.empty}>No circulars yet.</Text>
              </View>
        }
      />
    </AppBackground>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  content: { padding: 16, paddingBottom: 32 },
  empty: { fontSize: 14, color: '#000', textAlign: 'center', marginTop: 12 },
  emptyWrap: { alignItems: 'center', marginTop: 60 },
})
