import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useAuthStore } from '../../src/auth/store'
import { useSemesterAttendance, useFeeDetails, useSemesterResults, useMentor, useFeatures, useCirculars } from '../../src/api/queries'
import { useState, useCallback } from 'react'
import Svg, { Circle } from 'react-native-svg'
import { NetworkStatusBanner } from '../../src/components/NetworkStatusBanner'
import { NotificationStatusBanner } from '../../src/components/NotificationStatusBanner'
import { AppBackground } from '../../src/components/AppBackground'
import type { Circular } from '../../src/types'

const GREEN = '#05245F'
const GREEN_LIGHT = '#DCE8FA'
const GREEN_ACCENT = '#073B8F'
const RED = '#C94343'
const ATTENDANCE_GOOD = '#168B72'
const ORANGE = '#D99A00'

const circularCategoryColors: Record<string, { bg: string; text: string }> = {
  holiday: { bg: '#FBF0D9', text: ORANGE },
  exam: { bg: '#F6E2E2', text: '#C62828' },
  general: { bg: GREEN_LIGHT, text: GREEN_ACCENT },
}
const defaultCircularCategory = { bg: '#F5F5F5', text: '#616161' }

function circularRelativeDate(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime()
  const diffMins = Math.floor(diffMs / 60000)
  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 7) return `${diffDays}d ago`
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

// Splits a course/department label so a trailing "(...)" specialization
// never gets torn across the paren boundary when the line wraps.
function splitCourseLabel(label: string): { main: string; paren: string | null } {
  const match = label.match(/^(.*?)\s*(\([^)]*\))\s*$/)
  if (match) {
    return { main: match[1], paren: match[2] }
  }
  return { main: label, paren: null }
}

function AttendanceRing({ percentage }: { percentage: number }) {
  const size = 80
  const stroke = 7
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const progress = circumference - (percentage / 100) * circumference
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size}>
        <Circle cx={size / 2} cy={size / 2} r={radius} stroke="#E0E0E0" strokeWidth={stroke} fill="none" />
        <Circle
          cx={size / 2} cy={size / 2} r={radius}
          stroke={percentage >= 75 ? ATTENDANCE_GOOD : RED}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={`${circumference}`}
          strokeDashoffset={progress}
          strokeLinecap="round"
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <Text style={{ position: 'absolute', fontSize: 18, fontWeight: '700', color: GREEN }} maxFontSizeMultiplier={1.2}>{percentage.toFixed(1)}%</Text>
    </View>
  )
}

export default function DashboardScreen() {
  const roll = useAuthStore((s) => s.activeWardRoll) ?? ''
  const activeWard = useAuthStore((s) => s.wards.find((w) => w.roll_number === s.activeWardRoll))
  const accountType = useAuthStore((s) => s.activeAccountType)

  const attendance = useSemesterAttendance(roll)
  const results = useSemesterResults(roll)
  const fees = useFeeDetails(roll)
  const mentor = useMentor(roll)
  const { data: features, refetch: refetchFeatures } = useFeatures()
  const circulars = useCirculars()
  const recentCirculars = circulars.data?.slice(0, 5) ?? []

  const [refreshing, setRefreshing] = useState(false)
  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await Promise.all([attendance.refetch(), results.refetch(), fees?.refetch?.(), mentor.refetch(), refetchFeatures(), circulars.refetch()])
    setRefreshing(false)
  }, [attendance, results, fees, mentor, refetchFeatures, circulars])

  const attendanceEnabled = features?.attendance_overview ?? true
  const resultsEnabled = features?.results_semester ?? true
  const feesEnabled = features?.fees ?? true

  const attendancePct = attendance.data?.overall_percentage
  const latestResult = results.data?.[0]
  const feeAmount = fees?.data?.outstanding_amount
  const feeStatus = feeAmount == null ? null : feeAmount > 0 ? 'Due' : 'Paid'
  const feeDisplay = feeAmount == null ? 'Not available' : feeAmount > 0 ? `₹${feeAmount.toLocaleString('en-IN')}` : 'No dues'

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening'

  return (
    <AppBackground style={styles.container}>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={GREEN_ACCENT} />}
      >
      <NetworkStatusBanner />
      <NotificationStatusBanner />
      <Text style={styles.greeting}>{greeting}, {accountType === 'student' ? 'Student' : 'Parent'}!</Text>

      {/* Student Card */}
      <TouchableOpacity style={styles.studentCard} onPress={() => router.push('/(app)/profile')} activeOpacity={0.7}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{activeWard?.student_name?.charAt(0) ?? '?'}</Text>
        </View>
        <View style={styles.studentInfo}>
          <Text style={styles.studentName}>
            {activeWard?.student_name || 'Not available'}
          </Text>
          {(() => {
            const yearLabel = activeWard?.year ? `${['I', 'II', 'III', 'IV'][activeWard.year - 1] ?? activeWard.year} Year` : null
            const branch = activeWard?.branch_name || null
            if (!yearLabel && !branch) {
              return <Text style={styles.studentSub}>Not available</Text>
            }
            const combined = [yearLabel, branch].filter(Boolean).join(' - ')
            const { main, paren } = splitCourseLabel(combined)
            return (
              <>
                <Text style={styles.studentSub}>{main}</Text>
                {paren ? <Text style={styles.studentSub}>{paren}</Text> : null}
              </>
            )
          })()}
          <Text style={styles.studentRoll}>Roll No: {activeWard?.roll_number || 'Not available'}</Text>
        </View>
        <View style={styles.studentArrow}>
          <Ionicons name="chevron-forward" size={22} color="#999" />
        </View>
      </TouchableOpacity>

      {/* Stat Cards Row */}
      <View style={styles.statRow}>
        <TouchableOpacity style={styles.statCard} onPress={() => router.push('/(app)/attendance')} activeOpacity={0.7}>
          <Text style={styles.statLabel} maxFontSizeMultiplier={1.2} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>Attendance</Text>
          {!attendanceEnabled ? (
            <>
              <Ionicons name="eye-off-outline" size={24} color="#8A98AD" style={{ marginBottom: 4 }} />
              <Text style={styles.statSub} maxFontSizeMultiplier={1.2} numberOfLines={2}>Unavailable</Text>
            </>
          ) : attendancePct != null ? (
            <AttendanceRing percentage={attendancePct} />
          ) : (
            <Text style={styles.statValueLg} maxFontSizeMultiplier={1.2} numberOfLines={1}>-</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity style={styles.statCard} onPress={() => router.push('/(app)/results')} activeOpacity={0.7}>
          <Text style={styles.statLabel} maxFontSizeMultiplier={1.2} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>Results</Text>
          {!resultsEnabled ? (
            <>
              <Ionicons name="eye-off-outline" size={24} color="#8A98AD" style={{ marginBottom: 4 }} />
              <Text style={styles.statSub} maxFontSizeMultiplier={1.2} numberOfLines={2}>Unavailable</Text>
            </>
          ) : (
            <>
              <Ionicons name="book-outline" size={28} color={GREEN_ACCENT} style={{ marginBottom: 4 }} />
              <Text style={styles.statValueLg} maxFontSizeMultiplier={1.2} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
                {latestResult?.cgpa ?? '-'}
              </Text>
              <Text style={styles.statSub} maxFontSizeMultiplier={1.2} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>CGPA</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Info Cards Row */}
      <View style={styles.statRow}>
        <TouchableOpacity style={[styles.infoCard, { borderColor: feeStatus === 'Due' ? RED : GREEN_ACCENT }]} onPress={() => router.push('/(app)/payment')} activeOpacity={0.7}>
          <View style={styles.infoHeader}>
            <Text style={styles.infoLabel}>Fee Status</Text>
            {feesEnabled && (
              <View style={[styles.badge, { backgroundColor: feeStatus === 'Due' ? '#F6E2E2' : feeStatus === 'Paid' ? GREEN_LIGHT : '#EEF0F3' }]}>
                <Text style={[styles.badgeText, { color: feeStatus === 'Due' ? RED : feeStatus === 'Paid' ? ATTENDANCE_GOOD : '#8A98AD' }]}>{feeStatus ?? 'N/A'}</Text>
              </View>
            )}
          </View>
          {feesEnabled ? (
            <Text style={[styles.feeAmount, { color: feeStatus === 'Due' ? RED : GREEN }]}>
              {feeDisplay}
            </Text>
          ) : (
            <Text style={[styles.feeAmount, { color: '#8A98AD', fontSize: 15 }]}>Unavailable</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity style={[styles.infoCard, { borderColor: GREEN_ACCENT }]} onPress={() => router.push('/(app)/mentor')} activeOpacity={0.7}>
          <Text style={styles.infoLabel}>Mentor</Text>
          <Ionicons name="people-outline" size={24} color={GREEN_ACCENT} style={{ marginTop: 4 }} />
          <Text style={styles.mentorName}>
            {mentor.data?.name || 'Not available'}
          </Text>
          <Text style={styles.nextClassTime}>View details →</Text>
        </TouchableOpacity>
      </View>

      {/* Circulars Section */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Circulars</Text>
        <TouchableOpacity onPress={() => router.push('/(app)/circulars')} activeOpacity={0.7}>
          <Text style={styles.sectionLink}>View all</Text>
        </TouchableOpacity>
      </View>
      {recentCirculars.length === 0 ? (
        <View style={styles.circularsEmpty}>
          <Ionicons name="megaphone-outline" size={28} color="#ccc" />
          <Text style={styles.circularsEmptyText}>No circulars yet.</Text>
        </View>
      ) : (
        recentCirculars.map((item: Circular) => {
          const cc = circularCategoryColors[item.category] ?? defaultCircularCategory
          return (
            <TouchableOpacity
              key={item.id}
              style={styles.circularCard}
              onPress={() => router.push(`/(app)/circulars/${item.id}`)}
              activeOpacity={0.7}
            >
              <View style={styles.circularHeader}>
                <View style={[styles.circularBadge, { backgroundColor: cc.bg }]}>
                  <Text style={[styles.circularBadgeText, { color: cc.text }]}>{item.category}</Text>
                </View>
                <Text style={styles.circularDate}>{circularRelativeDate(item.published_at)}</Text>
              </View>
              <Text style={styles.circularTitle} numberOfLines={1}>{item.title}</Text>
              <Text style={styles.circularBody} numberOfLines={2}>{item.body}</Text>
            </TouchableOpacity>
          )
        })
      )}
      </ScrollView>
    </AppBackground>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  content: { padding: 16, paddingBottom: 32 },
  greeting: { fontSize: 22, fontWeight: '700', color: GREEN, marginBottom: 16 },

  studentCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 16,
    padding: 16, marginBottom: 16, elevation: 2,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 2 },
  },
  avatar: {
    width: 52, height: 52, borderRadius: 26, backgroundColor: GREEN,
    justifyContent: 'center', alignItems: 'center', marginRight: 14,
  },
  avatarText: { fontSize: 22, fontWeight: '700', color: '#fff' },
  studentInfo: { flex: 1, marginRight: 8 },
  studentArrow: { alignSelf: 'stretch', justifyContent: 'center' },
  studentName: { fontSize: 15, fontWeight: '700', color: '#1a1a1a', flexWrap: 'wrap' },
  studentSub: { fontSize: 12, color: '#000', marginTop: 2, flexWrap: 'wrap' },
  studentRoll: { fontSize: 12, color: '#000', marginTop: 1 },

  statRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  statCard: {
    flex: 1, backgroundColor: '#fff', borderRadius: 16, padding: 16, alignItems: 'center',
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 2 },
  },
  statLabel: { fontSize: 13, fontWeight: '600', color: '#000', marginBottom: 10, textAlign: 'center', width: '100%' },
  statValueLg: { fontSize: 22, fontWeight: '700', color: GREEN, textAlign: 'center', width: '100%' },
  statSub: { fontSize: 12, color: '#000', marginTop: 2, textAlign: 'center', width: '100%' },

  infoCard: {
    flex: 1, minWidth: 0, backgroundColor: '#fff', borderRadius: 16, padding: 14, borderWidth: 1,
    elevation: 1, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, shadowOffset: { width: 0, height: 1 },
  },
  infoHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  infoLabel: { fontSize: 12, fontWeight: '600', color: '#000' },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  feeAmount: { fontSize: 20, fontWeight: '700' },
  nextClassName: { fontSize: 16, fontWeight: '700', color: '#1a1a1a', marginTop: 4 },
  nextClassTime: { fontSize: 13, color: '#000', marginTop: 'auto', paddingTop: 8 },
  mentorName: { fontSize: 13, fontWeight: '700', color: '#1a1a1a', marginTop: 4, flexWrap: 'wrap' },

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, marginBottom: 10 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: GREEN },
  sectionLink: { fontSize: 13, fontWeight: '600', color: GREEN_ACCENT },
  circularsEmpty: { alignItems: 'center', paddingVertical: 24, backgroundColor: '#fff', borderRadius: 16 },
  circularsEmptyText: { fontSize: 13, color: '#000', marginTop: 8 },
  circularCard: {
    backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 10,
    elevation: 1, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, shadowOffset: { width: 0, height: 1 },
  },
  circularHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  circularBadge: { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 8 },
  circularBadgeText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  circularDate: { fontSize: 11, color: '#000' },
  circularTitle: { fontSize: 14, fontWeight: '700', color: '#1a1a1a', marginBottom: 4 },
  circularBody: { fontSize: 12, color: '#000', lineHeight: 17 },
})
