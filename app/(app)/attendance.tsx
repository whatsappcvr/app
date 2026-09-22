import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native'
import { useState, useCallback, useEffect } from 'react'
import { Ionicons } from '@expo/vector-icons'
import { useAuthStore } from '../../src/auth/store'
import { useQueryClient } from '@tanstack/react-query'
import { useAttendanceOverview, useSemesterAttendance, useDailyAttendance, useDailyAttendanceRange, useCourseAttendance, useFeatures } from '../../src/api/queries'
import Svg, { Circle } from 'react-native-svg'
import { NetworkStatusBanner } from '../../src/components/NetworkStatusBanner'
import { NotificationStatusBanner } from '../../src/components/NotificationStatusBanner'
import { LoadingView } from '../../src/components/LoadingView'
import { AppBackground } from '../../src/components/AppBackground'
import { FeatureDisabled } from '../../src/components/FeatureDisabled'

const GREEN = '#05245F'
const GREEN_LIGHT = '#DCE8FA'
const GREEN_ACCENT = '#073B8F'
const RED = '#C94343'
const ORANGE = '#D99A00'
const PRESENT_GREEN = '#168B72'
const PRESENT_GREEN_LIGHT = '#DCF2EC'

type Tab = 'overview' | 'subject'

const SHORT_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const STATUS_STYLE: Record<string, { color: string; bg: string }> = {
  Present: { color: PRESENT_GREEN, bg: PRESENT_GREEN_LIGHT },
  Absent: { color: RED, bg: '#F6E2E2' },
  OD: { color: ORANGE, bg: '#FBF0D9' },
  Late: { color: ORANGE, bg: '#FBF0D9' },
}

function formatDisplayDate(d: Date): string {
  return `${SHORT_DAYS[d.getDay()]}, ${String(d.getDate()).padStart(2, '0')} ${MONTH_SHORT[d.getMonth()]} ${d.getFullYear()}`
}

function formatTime(t?: string | null): string | null {
  if (!t) return null
  const [hStr, mStr] = t.split(':')
  const h = Number(hStr)
  if (Number.isNaN(h)) return null
  const period = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 === 0 ? 12 : h % 12
  return `${h12}:${mStr} ${period}`
}

function formatTimeSlot(start?: string | null, end?: string | null): string | null {
  const s = formatTime(start)
  const e = formatTime(end)
  if (s && e) return `${s} - ${e}`
  return s ?? e ?? null
}

function toApiDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

// --- Progress Ring ---

function ProgressRing({ percentage, size = 132, strokeWidth = 9 }: { percentage: number; size?: number; strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const progress = circumference - (percentage / 100) * circumference
  // Keep the text block narrower than the ring's inner diameter so
  // "Overall Attendance" wraps to two short lines instead of spilling
  // past the ring.
  const innerSize = size - strokeWidth * 3
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size}>
        <Circle cx={size / 2} cy={size / 2} r={radius} stroke="#E8E8E8" strokeWidth={strokeWidth} fill="none" />
        <Circle
          cx={size / 2} cy={size / 2} r={radius}
          stroke={percentage >= 75 ? PRESENT_GREEN : RED}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${circumference}`}
          strokeDashoffset={progress}
          strokeLinecap="round"
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <View style={{ position: 'absolute', alignItems: 'center', width: innerSize }}>
        <Text style={{ fontSize: 24, fontWeight: '700', color: GREEN }}>{percentage.toFixed(1)}%</Text>
        <Text style={{ fontSize: 10, color: '#000', marginTop: 2, textAlign: 'center' }}>Overall Attendance</Text>
      </View>
    </View>
  )
}

// --- Stat Box ---

function StatBox({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={statStyles.box}>
      <Text style={[statStyles.value, { color }]} maxFontSizeMultiplier={1.2} numberOfLines={1}>
        {value}
      </Text>
      <Text style={statStyles.label} maxFontSizeMultiplier={1.2} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
        {label}
      </Text>
    </View>
  )
}

const statStyles = StyleSheet.create({
  box: {
    flex: 1,
    overflow: 'visible',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 6,
    backgroundColor: '#fff',
    borderRadius: 10,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
  },
  value: { fontSize: 22, fontWeight: '700' },
  label: { fontSize: 12, color: '#000', marginTop: 2, textAlign: 'center', flexShrink: 1, width: '100%' },
})

// --- Date-wise, subject-wise attendance ---

function DateAttendance({ roll, selectedDate, onChangeDate, enabled }: { roll: string; selectedDate: Date; onChangeDate: (d: Date) => void; enabled: boolean }) {
  const dateKey = toApiDate(selectedDate)
  const { data, isLoading } = useDailyAttendance(roll, dateKey)
  const isFuture = selectedDate.getTime() > new Date().setHours(23, 59, 59, 999)

  if (!enabled) {
    return (
      <View style={[styles.card, { marginTop: 12, alignItems: 'stretch' }]}>
        <FeatureDisabled message="Daily attendance is currently unavailable." />
      </View>
    )
  }

  const prevDay = () => {
    const d = new Date(selectedDate)
    d.setDate(d.getDate() - 1)
    onChangeDate(d)
  }
  const nextDay = () => {
    const d = new Date(selectedDate)
    d.setDate(d.getDate() + 1)
    onChangeDate(d)
  }

  const periods = data?.periods ?? []

  return (
    <View style={[styles.card, { marginTop: 12, alignItems: 'stretch' }]}>
      <View style={styles.dateNav}>
        <TouchableOpacity onPress={prevDay} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="chevron-back" size={22} color={GREEN} />
        </TouchableOpacity>
        <Text style={styles.dateText}>{formatDisplayDate(selectedDate)}</Text>
        <TouchableOpacity onPress={nextDay} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} disabled={isFuture}>
          <Ionicons name="chevron-forward" size={22} color={isFuture ? '#ccc' : GREEN} />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <LoadingView />
      ) : periods.length === 0 ? (
        <Text style={styles.empty}>No attendance recorded for this date.</Text>
      ) : (
        periods.map((p, i) => {
          const st = STATUS_STYLE[p.status] ?? STATUS_STYLE.Present
          const timeSlot = formatTimeSlot(p.start_time, p.end_time)
          return (
            <View key={i} style={dateStyles.row}>
              <View style={{ flex: 1 }}>
                <Text style={dateStyles.courseName}>{p.course_name}</Text>
                <View style={dateStyles.metaRow}>
                  <Text style={dateStyles.courseCode}>{p.course_code || '-'}</Text>
                  {timeSlot ? (
                    <>
                      <Text style={dateStyles.metaDot}>•</Text>
                      <Text style={dateStyles.courseCode}>{timeSlot}</Text>
                    </>
                  ) : null}
                </View>
              </View>
              <View style={[dateStyles.badge, { backgroundColor: st.bg }]}>
                <Text style={[dateStyles.badgeText, { color: st.color }]}>{p.status}</Text>
              </View>
            </View>
          )
        })
      )}
    </View>
  )
}

const dateStyles = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 12,
    borderTopWidth: 1, borderTopColor: '#F5F5F5',
  },
  courseName: { fontSize: 13, fontWeight: '600', color: '#10213F' },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2, flexWrap: 'wrap' },
  courseCode: { fontSize: 12, color: '#000' },
  metaDot: { fontSize: 12, color: '#8A98AD', marginHorizontal: 6 },
  badge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 8, marginLeft: 10, flexShrink: 0 },
  badgeText: { fontSize: 12, fontWeight: '700', flexShrink: 0 },
})

// --- Monthly Calendar (per-day present/absent ring) ---

const GREY = '#C7CDD6'
const HOLD_AMBER = '#D99A00'

function monthBounds(d: Date): { start: Date; end: Date } {
  return {
    start: new Date(d.getFullYear(), d.getMonth(), 1),
    end: new Date(d.getFullYear(), d.getMonth() + 1, 0),
  }
}

type DayCounts = { present: number; absent: number }

// Today's periods can still change until the day is over, so its ring is
// shown as a pending "hold" state instead of a final present/absent split.
function DayRing({ size, counts, isHold }: { size: number; counts: DayCounts | undefined; isHold: boolean }) {
  const strokeWidth = 3
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const total = (counts?.present ?? 0) + (counts?.absent ?? 0)

  if (isHold) {
    return (
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2} cy={size / 2} r={radius}
          stroke={HOLD_AMBER} strokeWidth={strokeWidth} fill="none"
          strokeDasharray="3,3"
        />
      </Svg>
    )
  }

  if (total === 0) {
    return (
      <Svg width={size} height={size}>
        <Circle cx={size / 2} cy={size / 2} r={radius} stroke={GREY} strokeWidth={strokeWidth} fill="none" />
      </Svg>
    )
  }

  const presentRatio = counts!.present / total
  const presentLength = circumference * presentRatio
  return (
    <Svg width={size} height={size}>
      <Circle cx={size / 2} cy={size / 2} r={radius} stroke={RED} strokeWidth={strokeWidth} fill="none" />
      {presentLength > 0 && (
        <Circle
          cx={size / 2} cy={size / 2} r={radius}
          stroke={PRESENT_GREEN} strokeWidth={strokeWidth} fill="none"
          strokeDasharray={`${presentLength} ${circumference - presentLength}`}
          strokeLinecap="round"
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      )}
    </Svg>
  )
}

function AttendanceCalendar({ roll, selectedDate, onSelectDate, enabled }: { roll: string; selectedDate: Date; onSelectDate: (d: Date) => void; enabled: boolean }) {
  const [monthDate, setMonthDate] = useState(new Date(selectedDate))
  const queryClient = useQueryClient()
  const [calRefreshing, setCalRefreshing] = useState(false)
  useEffect(() => {
    setMonthDate((prev) =>
      prev.getFullYear() === selectedDate.getFullYear() && prev.getMonth() === selectedDate.getMonth()
        ? prev
        : new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1),
    )
  }, [selectedDate])
  const { start, end } = monthBounds(monthDate)
  const { data, isLoading } = useDailyAttendanceRange(roll, toApiDate(start), toApiDate(end))

  const refreshCalendar = useCallback(async () => {
    setCalRefreshing(true)
    await queryClient.invalidateQueries({ queryKey: ['dailyAttendanceRange', roll, toApiDate(start), toApiDate(end)] })
    setCalRefreshing(false)
  }, [queryClient, roll, start, end])

  if (!enabled) {
    return (
      <View style={[styles.card, { marginTop: 12, alignItems: 'stretch' }]}>
        <FeatureDisabled message="Attendance calendar is currently unavailable." />
      </View>
    )
  }

  const countsByDate: Record<string, DayCounts> = {}
  for (const day of Array.isArray(data) ? data : []) {
    let present = 0
    let absent = 0
    for (const p of day.periods ?? []) {
      if (p.status === 'Absent') absent++
      else present++
    }
    countsByDate[day.date] = { present, absent }
  }

  const daysInMonth = end.getDate()
  const leadingBlanks = start.getDay()
  const cells: (Date | null)[] = [
    ...Array(leadingBlanks).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(start.getFullYear(), start.getMonth(), i + 1)),
  ]
  while (cells.length % 7 !== 0) cells.push(null)
  const weeks: (Date | null)[][] = []
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7))
  const today = new Date()

  const prevMonth = () => setMonthDate(new Date(monthDate.getFullYear(), monthDate.getMonth() - 1, 1))
  const nextMonth = () => setMonthDate(new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 1))
  const isFutureMonth =
    monthDate.getFullYear() > today.getFullYear() ||
    (monthDate.getFullYear() === today.getFullYear() && monthDate.getMonth() >= today.getMonth())

  return (
    <View style={[styles.card, { marginTop: 12, alignItems: 'stretch' }]}>
      <View style={styles.dateNav}>
        <TouchableOpacity onPress={prevMonth} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="chevron-back" size={22} color={GREEN} />
        </TouchableOpacity>
        <Text style={styles.dateText} maxFontSizeMultiplier={1.3}>
          {monthDate.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <TouchableOpacity onPress={nextMonth} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} disabled={isFutureMonth}>
            <Ionicons name="chevron-forward" size={22} color={isFutureMonth ? '#ccc' : GREEN} />
          </TouchableOpacity>
          <TouchableOpacity onPress={refreshCalendar} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} disabled={calRefreshing}>
            <Ionicons name="refresh-outline" size={18} color={calRefreshing ? '#ccc' : GREEN_ACCENT} />
          </TouchableOpacity>
        </View>
      </View>
      <Text style={calStyles.caption} maxFontSizeMultiplier={1.3}>Daily Attendance</Text>

      <View style={calStyles.weekRow}>
        {SHORT_DAYS.map((d) => (
          <Text key={d} style={calStyles.weekLabel} maxFontSizeMultiplier={1.2}>{d.slice(0, 1)}</Text>
        ))}
      </View>

      {isLoading ? (
        <LoadingView />
      ) : (
        <View style={calStyles.grid}>
          {weeks.map((week, wi) => (
            <View key={wi} style={calStyles.weekRowGrid}>
              {week.map((date, i) => {
                if (!date) return <View key={i} style={calStyles.cell} />
                const key = toApiDate(date)
                const counts = countsByDate[key]
                const isToday = key === toApiDate(today)
                const isSelected = key === toApiDate(selectedDate)
                const isFutureDay = key > toApiDate(today)
                const total = (counts?.present ?? 0) + (counts?.absent ?? 0)
                const fg = isToday ? HOLD_AMBER : total === 0 ? '#8A98AD' : counts!.absent > 0 && counts!.present === 0 ? RED : PRESENT_GREEN
                return (
                  <TouchableOpacity
                    key={i}
                    style={calStyles.cell}
                    disabled={isFutureDay}
                    onPress={() => onSelectDate(date)}
                  >
                    <View style={[calStyles.dayCircle, isSelected && calStyles.dayCircleSelected]}>
                      <DayRing size={30} counts={counts} isHold={isToday} />
                      <Text style={[calStyles.dayText, { color: fg }]} maxFontSizeMultiplier={1.2}>{date.getDate()}</Text>
                    </View>
                  </TouchableOpacity>
                )
              })}
            </View>
          ))}
        </View>
      )}

      <View style={calStyles.legendRow}>
        <View style={calStyles.legendItem}>
          <View style={[calStyles.legendDot, { backgroundColor: PRESENT_GREEN }]} />
          <Text style={calStyles.legendText} maxFontSizeMultiplier={1.2} numberOfLines={1}>Present</Text>
        </View>
        <View style={calStyles.legendItem}>
          <View style={[calStyles.legendDot, { backgroundColor: RED }]} />
          <Text style={calStyles.legendText} maxFontSizeMultiplier={1.2} numberOfLines={1}>Absent</Text>
        </View>
        <View style={calStyles.legendItem}>
          <View style={[calStyles.legendDot, { backgroundColor: HOLD_AMBER }]} />
          <Text style={calStyles.legendText} maxFontSizeMultiplier={1.2} numberOfLines={1}>Today</Text>
        </View>
        <View style={calStyles.legendItem}>
          <View style={[calStyles.legendDot, { backgroundColor: GREY }]} />
          <Text style={calStyles.legendText} maxFontSizeMultiplier={1.2} numberOfLines={1}>Not yet</Text>
        </View>
      </View>
    </View>
  )
}

const calStyles = StyleSheet.create({
  caption: { fontSize: 12, color: '#000', textAlign: 'center', marginBottom: 10 },
  weekRow: { flexDirection: 'row', marginBottom: 4 },
  weekLabel: { flex: 1, textAlign: 'center', fontSize: 11, fontWeight: '600', color: '#000' },
  grid: {},
  weekRowGrid: { flexDirection: 'row' },
  cell: { flex: 1, alignItems: 'center', paddingVertical: 4 },
  dayCircle: { width: 30, height: 30, alignItems: 'center', justifyContent: 'center', borderRadius: 15 },
  dayCircleSelected: { backgroundColor: '#E4ECFA' },
  dayText: { position: 'absolute', fontSize: 11, fontWeight: '600' },
  legendRow: { flexDirection: 'row', justifyContent: 'center', gap: 16, marginTop: 14, flexWrap: 'wrap' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 0 },
  legendDot: { width: 9, height: 9, borderRadius: 4.5 },
  legendText: { fontSize: 11, color: '#000', paddingRight: 3, flexShrink: 0 },
})

// --- Subject-wise Tab ---

function CourseDetailView({ roll, courseCode, courseName, onBack }: { roll: string; courseCode: string; courseName: string; onBack: () => void }) {
  const { data, isLoading } = useCourseAttendance(roll, courseCode)
  const records = data?.records ?? []

  return (
    <ScrollView style={{ backgroundColor: '#fff' }} contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
      <TouchableOpacity onPress={onBack} style={detailStyles.backRow} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Ionicons name="chevron-back" size={20} color={GREEN} />
        <Text style={detailStyles.backText}>All Subjects</Text>
      </TouchableOpacity>

      <Text style={detailStyles.title}>{data?.course_name || courseName || '-'}</Text>
      <Text style={detailStyles.subtitle}>{courseCode}</Text>

      {isLoading ? (
        <LoadingView />
      ) : records.length === 0 ? (
        <Text style={styles.empty}>No attendance records for this subject.</Text>
      ) : (
        records.map((r, i) => {
          const st = STATUS_STYLE[r.status] ?? STATUS_STYLE.Present
          const timeSlot = formatTimeSlot(r.start_time, r.end_time)
          const d = new Date(`${r.date}T00:00:00`)
          return (
            <View key={`${r.date}-${r.period_no}-${i}`} style={dateStyles.row}>
              <View style={{ flex: 1 }}>
                <Text style={dateStyles.courseName}>{formatDisplayDate(d)}</Text>
                <View style={dateStyles.metaRow}>
                  <Text style={dateStyles.courseCode}>Period {r.period_no}</Text>
                  {timeSlot ? (
                    <>
                      <Text style={dateStyles.metaDot}>•</Text>
                      <Text style={dateStyles.courseCode}>{timeSlot}</Text>
                    </>
                  ) : null}
                </View>
              </View>
              <View style={[dateStyles.badge, { backgroundColor: st.bg }]}>
                <Text style={[dateStyles.badgeText, { color: st.color }]}>{r.status}</Text>
              </View>
            </View>
          )
        })
      )}
    </ScrollView>
  )
}

const detailStyles = StyleSheet.create({
  backRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 2 },
  backText: { fontSize: 14, fontWeight: '600', color: GREEN },
  title: { fontSize: 16, fontWeight: '700', color: '#10213F' },
  subtitle: { fontSize: 12, color: '#000', marginTop: 2, marginBottom: 8 },
})

function SubjectView({ roll, enabled, showPercentage }: { roll: string; enabled: boolean; showPercentage: boolean }) {
  const { data, refetch, isLoading } = useSemesterAttendance(roll)
  const { refetch: refetchFeatures } = useFeatures()
  const [refreshing, setRefreshing] = useState(false)
  const [selectedCourse, setSelectedCourse] = useState<{ code: string; name: string } | null>(null)
  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await Promise.all([refetch(), refetchFeatures()])
    setRefreshing(false)
  }, [refetch, refetchFeatures])

  if (!enabled) {
    return (
      <View style={{ padding: 16 }}>
        <FeatureDisabled message="Subject-wise attendance is currently unavailable." />
      </View>
    )
  }

  if (selectedCourse) {
    return (
      <CourseDetailView
        roll={roll}
        courseCode={selectedCourse.code}
        courseName={selectedCourse.name}
        onBack={() => setSelectedCourse(null)}
      />
    )
  }

  return (
    <ScrollView
      contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={GREEN_ACCENT} />}
    >
      {isLoading ? (
        <LoadingView />
      ) : !data || data.by_course.length === 0 ? (
        <Text style={styles.empty}>No attendance data available.</Text>
      ) : (
        data.by_course.map((c) => (
          <TouchableOpacity
            key={c.course_code}
            style={subjectStyles.courseRow}
            onPress={() => setSelectedCourse({ code: c.course_code, name: c.course_name })}
          >
            <View style={subjectStyles.courseInfo}>
              <Text style={subjectStyles.courseName}>{c.course_name || '-'}</Text>
              <Text style={subjectStyles.courseCode}>{c.course_code || '-'}</Text>
            </View>
            {showPercentage && (
              <>
                <View style={subjectStyles.barBg}>
                  <View
                    style={[
                      subjectStyles.barFill,
                      {
                        width: `${Math.min(c.percentage, 100)}%`,
                        backgroundColor: c.percentage >= 75 ? PRESENT_GREEN : RED,
                      },
                    ]}
                  />
                </View>
                <Text style={[subjectStyles.pct, { color: c.percentage >= 75 ? PRESENT_GREEN : RED }]}>
                  {c.percentage.toFixed(0)}%
                </Text>
              </>
            )}
            <Ionicons name="chevron-forward" size={16} color="#8A98AD" style={{ marginLeft: 6 }} />
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  )
}

const subjectStyles = StyleSheet.create({
  courseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
  },
  courseInfo: { flex: 1, marginRight: 10 },
  courseName: { fontSize: 12, fontWeight: '600', color: '#1a1a1a' },
  courseCode: { fontSize: 11, color: '#000', marginTop: 2 },
  barBg: { width: 80, height: 8, backgroundColor: '#F0F0F0', borderRadius: 4, overflow: 'hidden', marginRight: 10 },
  barFill: { height: '100%', borderRadius: 4 },
  pct: { minWidth: 44, textAlign: 'right', fontSize: 13, fontWeight: '700' },
})

// --- Main Screen ---

export default function AttendanceScreen() {
  const [tab, setTab] = useState<Tab>('overview')
  const [selectedDate, setSelectedDate] = useState(new Date())
  const roll = useAuthStore((s) => s.activeWardRoll) ?? ''

  const { data: overview, refetch: refetchOverview, isLoading: overviewLoading } = useAttendanceOverview(roll)
  const { data: features, refetch: refetchFeatures } = useFeatures()
  const [refreshing, setRefreshing] = useState(false)
  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await Promise.all([refetchOverview(), refetchFeatures()])
    setRefreshing(false)
  }, [refetchOverview, refetchFeatures])

  const pct = overview?.overall_percentage ?? 0
  const presentCount = overview?.present ?? 0
  const absentCount = overview?.absent ?? 0
  const totalCount = overview?.total ?? 0

  return (
    <AppBackground style={styles.container}>
      <NetworkStatusBanner />
      <NotificationStatusBanner />
      {/* Tab Toggle */}
      <View style={styles.tabBar}>
        {(['overview', 'subject'] as Tab[]).map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.tab, tab === t && styles.tabActive]}
            onPress={() => setTab(t)}
          >
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t === 'overview' ? 'Overview' : 'Subject-wise'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {tab === 'overview' ? (
        <ScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={GREEN_ACCENT} />}
        >
          {!features?.attendance_overview ? (
            <View style={styles.card}>
              <FeatureDisabled message="Attendance overview is currently unavailable." />
            </View>
          ) : overviewLoading && !overview ? (
            <LoadingView />
          ) : (
            <>
              {/* Progress Ring */}
              <View style={styles.card}>
                <ProgressRing percentage={pct} />
              </View>

              {/* Stats Row */}
              <View style={styles.statsRow}>
                <StatBox label="Present" value={presentCount} color={PRESENT_GREEN} />
                <StatBox label="Absent" value={absentCount} color={RED} />
                <StatBox label="Total" value={totalCount} color="#333" />
              </View>
            </>
          )}

          {/* Monthly calendar - 2nd hour status */}
          <AttendanceCalendar roll={roll} selectedDate={selectedDate} onSelectDate={setSelectedDate} enabled={features?.attendance_calendar ?? true} />

          {/* Date-wise subject attendance */}
          <DateAttendance roll={roll} selectedDate={selectedDate} onChangeDate={setSelectedDate} enabled={features?.attendance_daily ?? true} />
        </ScrollView>
      ) : (
        <SubjectView roll={roll} enabled={features?.attendance_subjectwise ?? true} showPercentage={features?.attendance_subjectwise_percentage ?? true} />
      )}
    </AppBackground>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    margin: 16,
    marginBottom: 12,
    borderRadius: 12,
    padding: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
    // Must outrank the elevation of any card that scrolls beneath it (max
    // elevation 2 below) — on Android, elevation sets sibling z-order
    // regardless of layout position, so a lower value here lets scrolling
    // card shadows render on top of this fixed tab bar.
    elevation: 6,
    zIndex: 10,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
  },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  tabActive: { backgroundColor: GREEN },
  tabText: { fontSize: 14, fontWeight: '600', color: '#000' },
  tabTextActive: { color: '#fff' },

  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    overflow: 'visible',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },

  dateNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 4,
  },
  dateText: { fontSize: 15, fontWeight: '700', color: GREEN },

  empty: { fontSize: 14, color: '#000', textAlign: 'center', marginTop: 12, marginBottom: 4 },
})
