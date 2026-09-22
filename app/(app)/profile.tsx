import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native'
import { useAuthStore } from '../../src/auth/store'
import { useStudentProfile } from '../../src/api/queries'
import { useState, useCallback } from 'react'
import { Ionicons } from '@expo/vector-icons'
import { NetworkStatusBanner } from '../../src/components/NetworkStatusBanner'
import { NotificationStatusBanner } from '../../src/components/NotificationStatusBanner'
import { LoadingView } from '../../src/components/LoadingView'
import { AppBackground } from '../../src/components/AppBackground'

const GREEN = '#05245F'
const GREEN_LIGHT = '#DCE8FA'
const GREEN_ACCENT = '#073B8F'

type Tab = 'student' | 'parent'

const dash = (v?: string | number | null) => (v === null || v === undefined || v === '' ? 'Not available' : v)

function InfoRow({ icon, label, value }: { icon: string; label: string; value?: string | number | null }) {
  return (
    <View style={ir.row}>
      <Ionicons name={icon as any} size={18} color="#999" style={{ marginRight: 10, marginTop: 1 }} />
      <View style={{ flex: 1 }}>
        <Text style={ir.label}>{label}</Text>
        <Text style={ir.value}>{dash(value)}</Text>
      </View>
    </View>
  )
}

const ir = StyleSheet.create({
  row: { flexDirection: 'row', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
  label: { fontSize: 12, color: '#000', marginBottom: 2 },
  value: { fontSize: 14, color: '#1a1a1a', fontWeight: '500' },
})

export default function ProfileScreen() {
  const roll = useAuthStore((s) => s.activeWardRoll) ?? ''
  const activeWard = useAuthStore((s) => s.wards.find((w) => w.roll_number === s.activeWardRoll))
  const { data: profile, refetch, isLoading } = useStudentProfile(roll)
  const [refreshing, setRefreshing] = useState(false)
  const [tab, setTab] = useState<Tab>('student')

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await refetch()
    setRefreshing(false)
  }, [refetch])

  if (isLoading || !profile) {
    return <AppBackground style={styles.center}><LoadingView /></AppBackground>
  }

  const yearLabel = profile.year ? `${['I', 'II', 'III', 'IV'][profile.year - 1] ?? profile.year} Year` : ''

  return (
    <AppBackground style={styles.container}>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={GREEN_ACCENT} />}
      >
      <NetworkStatusBanner />
      <NotificationStatusBanner />
      {/* Header Card */}
      <View style={styles.headerCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{profile.student_name?.charAt(0) ?? '?'}</Text>
        </View>
        <Text style={styles.name}>{dash(profile.student_name)}</Text>
        <Text style={styles.subtitle}>{yearLabel} - {dash(profile.branch_name)}</Text>
        <Text style={styles.rollNo}>Roll No: {dash(profile.roll_number)}</Text>
        <View style={styles.activeBadge}>
          <View style={styles.activeDot} />
          <Text style={styles.activeText}>Active</Text>
        </View>
      </View>

      {/* Tab Toggle */}
      <View style={styles.tabBar}>
        {(['student', 'parent'] as Tab[]).map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.tab, tab === t && styles.tabActive]}
            onPress={() => setTab(t)}
          >
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t === 'student' ? 'Student' : 'Parent'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Info Card */}
      <View style={styles.card}>
        {tab === 'student' ? (
          <>
            <InfoRow icon="card-outline" label="Roll Number" value={profile.roll_number} />
            <InfoRow icon="layers-outline" label="Year" value={yearLabel} />
            <InfoRow icon="git-branch-outline" label="Branch" value={profile.branch_name} />
            <InfoRow icon="calendar-outline" label="Date of Birth" value={profile.date_of_birth} />
            <InfoRow icon="school-outline" label="Department" value={profile.department_name ?? profile.branch_name} />
            <InfoRow icon="mail-outline" label="Email" value={profile.roll_number ? `${profile.roll_number}@cvr.ac.in` : null} />
            <InfoRow icon="call-outline" label="Mobile" value={profile.student_mobile} />
          </>
        ) : (
          <>
            <InfoRow icon="person-outline" label="Father's Name" value={profile.father_name} />
            <InfoRow icon="call-outline" label="Father's Phone" value={profile.parent_mobile} />
            <InfoRow icon="person-outline" label="Mother's Name" value={profile.mother_name} />
            <InfoRow icon="call-outline" label="Mother's Phone" value={profile.parent_mobile} />
            <InfoRow icon="mail-outline" label="Email" value={profile.parent_email} />
          </>
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
  loading: { fontSize: 14, color: '#000' },

  headerCard: {
    backgroundColor: '#fff', borderRadius: 20, padding: 24, alignItems: 'center', marginBottom: 16,
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 2 },
  },
  avatar: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: GREEN,
    justifyContent: 'center', alignItems: 'center', marginBottom: 12,
  },
  avatarText: { fontSize: 32, fontWeight: '700', color: '#fff' },
  name: { fontSize: 20, fontWeight: '700', color: '#1a1a1a' },
  subtitle: { fontSize: 14, color: '#000', marginTop: 4, textAlign: 'center', flexWrap: 'wrap' },
  rollNo: { fontSize: 13, color: '#000', marginTop: 2 },
  activeBadge: {
    flexDirection: 'row', alignItems: 'center', marginTop: 10,
    backgroundColor: GREEN_LIGHT, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 12,
  },
  activeDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: GREEN_ACCENT, marginRight: 6 },
  activeText: { fontSize: 12, fontWeight: '600', color: GREEN_ACCENT },

  tabBar: {
    flexDirection: 'row', backgroundColor: '#fff', borderRadius: 12, padding: 4, marginBottom: 16,
    elevation: 1, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, shadowOffset: { width: 0, height: 1 },
  },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  tabActive: { backgroundColor: GREEN },
  tabText: { fontSize: 14, fontWeight: '600', color: '#000' },
  tabTextActive: { color: '#fff' },

  card: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16,
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 2 },
  },
})
