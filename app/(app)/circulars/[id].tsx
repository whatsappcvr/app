import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native'
import { useLocalSearchParams } from 'expo-router'
import * as WebBrowser from 'expo-web-browser'
import { Ionicons } from '@expo/vector-icons'
import { useCirculars } from '../../../src/api/queries'
import { AppBackground } from '../../../src/components/AppBackground'

const GREEN = '#05245F'
const GREEN_LIGHT = '#DCE8FA'
const GREEN_ACCENT = '#073B8F'

const categoryColors: Record<string, { bg: string; text: string }> = {
  holiday: { bg: '#FBF0D9', text: '#D99A00' },
  exam: { bg: '#F6E2E2', text: '#C62828' },
  general: { bg: '#DCE8FA', text: '#0A4AA8' },
}

export default function CircularDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { data: circulars } = useCirculars()
  const circular = circulars?.find((c) => c.id.toString() === id)

  if (!circular) {
    return (
      <AppBackground style={styles.center}>
        <Ionicons name="document-text-outline" size={48} color="#ddd" />
        <Text style={styles.empty}>Circular not found.</Text>
      </AppBackground>
    )
  }

  const cc = categoryColors[circular.category] ?? categoryColors.general

  return (
    <AppBackground style={styles.container}>
      <ScrollView style={styles.flex} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <View style={[styles.categoryBadge, { backgroundColor: cc.bg }]}>
          <Text style={[styles.categoryText, { color: cc.text }]}>{circular.category.toUpperCase()}</Text>
        </View>
        <Text style={styles.title}>{circular.title}</Text>
        <Text style={styles.date}>
          {new Date(circular.published_at).toLocaleDateString('en-IN', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
          })}
        </Text>
        <View style={styles.divider} />
        <Text style={styles.body}>{circular.body}</Text>
        {circular.attachment_url && (
          <TouchableOpacity
            style={styles.attachBtn}
            onPress={() => WebBrowser.openBrowserAsync(circular.attachment_url!)}
            activeOpacity={0.7}
          >
            <Ionicons name="attach" size={18} color={GREEN_ACCENT} />
            <Text style={styles.attachText}>View Attachment</Text>
          </TouchableOpacity>
        )}
      </View>
      </ScrollView>
    </AppBackground>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  content: { padding: 16, paddingBottom: 32 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  empty: { fontSize: 14, color: '#000', marginTop: 12 },

  card: {
    backgroundColor: '#fff', borderRadius: 18, padding: 22,
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 2 },
  },
  categoryBadge: {
    alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8, marginBottom: 12,
  },
  categoryText: { fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  title: { fontSize: 20, fontWeight: '700', color: '#1a1a1a', marginBottom: 8 },
  date: { fontSize: 13, color: '#000', marginBottom: 16 },
  divider: { height: 1, backgroundColor: '#F0F0F0', marginBottom: 16 },
  body: { fontSize: 15, color: '#333', lineHeight: 24 },
  attachBtn: {
    flexDirection: 'row', alignItems: 'center', marginTop: 20, padding: 14,
    backgroundColor: GREEN_LIGHT, borderRadius: 12, gap: 8,
  },
  attachText: { fontSize: 14, fontWeight: '600', color: GREEN_ACCENT },
})
