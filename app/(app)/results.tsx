import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl, Modal, Pressable, FlatList } from 'react-native'
import { useState, useCallback, useMemo } from 'react'
import { Ionicons } from '@expo/vector-icons'
import { useAuthStore } from '../../src/auth/store'
import { useMidResults, useAssignmentResults, useSemesterResults, useStudentProfile, useFeatures } from '../../src/api/queries'
import { deriveProgram, formatAcademicSemester } from '../../src/utils/academicSemester'
import { NetworkStatusBanner } from '../../src/components/NetworkStatusBanner'
import { NotificationStatusBanner } from '../../src/components/NotificationStatusBanner'
import { LoadingView } from '../../src/components/LoadingView'
import { AppBackground } from '../../src/components/AppBackground'
import { FeatureDisabled } from '../../src/components/FeatureDisabled'

const GREEN = '#05245F'
const GREEN_LIGHT = '#DCE8FA'
const GREEN_ACCENT = '#073B8F'

type SubTab = 'mid_1' | 'mid_2' | 'sem_end'

const dash = (v: string | number | null | undefined) => (v === null || v === undefined || v === '' ? '-' : v)

const gradeDisplay = (grade: string | null | undefined, gradePoint: number | null | undefined) =>
  grade ? (gradePoint != null ? `${grade} (${gradePoint})` : grade) : '-'

function SemesterPicker({
  semesters,
  activeSem,
  program,
  onSelect,
}: {
  semesters: number[]
  activeSem: number | null
  program: 'B.Tech' | 'M.Tech'
  onSelect: (sem: number) => void
}) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <TouchableOpacity style={styles.semPicker} onPress={() => setOpen(true)} activeOpacity={0.7}>
        <Text style={styles.semPickerText} numberOfLines={2}>
          {activeSem != null ? formatAcademicSemester(program, activeSem) : 'Select Semester'}
        </Text>
        <Ionicons name="chevron-down" size={18} color={GREEN} />
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade">
        <Pressable style={styles.overlay} onPress={() => setOpen(false)}>
          <Pressable style={styles.modal} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>Select Semester</Text>
            <FlatList
              data={semesters}
              keyExtractor={(s) => s.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.semOption, item === activeSem && styles.semOptionActive]}
                  onPress={() => { onSelect(item); setOpen(false) }}
                >
                  <Text style={[styles.semOptionText, item === activeSem && styles.semOptionTextActive]} numberOfLines={2}>
                    {formatAcademicSemester(program, item)}
                  </Text>
                  {item === activeSem && <Ionicons name="checkmark" size={20} color={GREEN} />}
                </TouchableOpacity>
              )}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </>
  )
}

export default function ResultsScreen() {
  const roll = useAuthStore((s) => s.activeWardRoll) ?? ''
  const profile = useStudentProfile(roll)
  const mid = useMidResults(roll)
  const assignments = useAssignmentResults(roll)
  const semester = useSemesterResults(roll)
  const { data: features, refetch: refetchFeatures } = useFeatures()
  const midEnabled = features?.results_mid ?? true
  const semesterEnabled = features?.results_semester ?? true

  const program = useMemo(() => deriveProgram(profile.data?.department_name), [profile.data?.department_name])

  const [activeSem, setActiveSem] = useState<number | null>(null)
  const [subTab, setSubTab] = useState<SubTab>('sem_end')
  const [refreshing, setRefreshing] = useState(false)

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await Promise.all([mid.refetch(), assignments.refetch(), semester.refetch(), refetchFeatures()])
    setRefreshing(false)
  }, [mid, assignments, semester, refetchFeatures])

  const midData = mid.data ?? []
  const assignmentData = assignments.data ?? []
  const semData = semester.data ?? []

  const availableSemesters = useMemo(() => {
    const set = new Set<number>()
    midData.forEach((m) => set.add(m.semester))
    semData.forEach((s) => set.add(s.semester))
    return Array.from(set).sort((a, b) => b - a)
  }, [midData, semData])

  const effectiveSem = activeSem ?? availableSemesters[0] ?? null

  const semMids = midData.filter((m) => m.semester === effectiveSem)
  const semAssignments = assignmentData.filter((a) => a.semester === effectiveSem)
  const semEndResult = semData.find((s) => s.semester === effectiveSem)
  const reattemptedCourses = useMemo(
    () => semEndResult?.courses.filter((c) => c.reattempted) ?? [],
    [semEndResult]
  )

  const hasMid1 = semMids.some((m) => m.mid_type === 'mid_1')
  const hasMid2 = semMids.some((m) => m.mid_type === 'mid_2')

  const subTabs: { key: SubTab; label: string; available: boolean }[] = [
    { key: 'mid_1', label: 'Mid 1', available: midEnabled && hasMid1 },
    { key: 'mid_2', label: 'Mid 2', available: midEnabled && hasMid2 },
    { key: 'sem_end', label: 'Semester End', available: semesterEnabled && !!semEndResult },
  ]

  const currentMid = subTab !== 'sem_end' ? semMids.find((m) => m.mid_type === subTab) : undefined

  // merge mid + assignment marks by course, for the Mid tabs
  const midRows = useMemo(() => {
    if (!currentMid) return []
    return currentMid.courses.map((c) => {
      const assign = semAssignments
        .flatMap((a) => a.courses)
        .find((ac) => ac.course_code === c.course_code)
      const midMarks = c.attendance === 'Absent' ? null : c.marks
      const assignMarks = assign?.marks ?? null
      const total = midMarks != null || assignMarks != null ? (midMarks ?? 0) + (assignMarks ?? 0) : null
      return {
        course_code: c.course_code,
        course_name: c.course_name,
        mid_marks: c.marks,
        mid_max: c.max_marks,
        assign_marks: assignMarks,
        assign_max: assign?.max_marks ?? null,
        attendance: c.attendance,
        total,
      }
    })
  }, [currentMid, semAssignments])

  const isLoading = mid.isLoading || semester.isLoading

  return (
    <AppBackground style={styles.container}>
      <NetworkStatusBanner />
      <NotificationStatusBanner />
      <View style={styles.topBar}>
        <SemesterPicker
          semesters={availableSemesters}
          activeSem={effectiveSem}
          program={program}
          onSelect={(sem) => { setActiveSem(sem); setSubTab('sem_end') }}
        />
      </View>

      {/* Sub Tabs */}
      <View style={styles.subTabBar}>
        {subTabs.map((t) => (
          <TouchableOpacity
            key={t.key}
            style={[styles.subTab, subTab === t.key && styles.subTabActive, !t.available && styles.subTabDisabled]}
            onPress={() => t.available && setSubTab(t.key)}
            disabled={!t.available}
          >
            <Text style={[styles.subTabText, subTab === t.key && styles.subTabTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={GREEN_ACCENT} />}
      >
        {isLoading && <LoadingView />}

        {!isLoading && availableSemesters.length === 0 && (
          <Text style={styles.empty}>No results published yet.</Text>
        )}

        {!isLoading && subTab === 'sem_end' && (
          !semesterEnabled ? (
            <FeatureDisabled message="Semester end results are currently unavailable." />
          ) : semEndResult ? (
            <>
              {/* GPA Card */}
              <View style={styles.gpaCard}>
                <View style={styles.gpaItem}>
                  <Text style={styles.gpaLabel} maxFontSizeMultiplier={1.3}>SGPA</Text>
                  <Text style={styles.gpaValue} maxFontSizeMultiplier={1.3}>{dash(semEndResult.sgpa)}</Text>
                </View>
                <View style={styles.gpaDivider} />
                <View style={styles.gpaItem}>
                  <Text style={styles.gpaLabel} maxFontSizeMultiplier={1.3}>CGPA</Text>
                  <Text style={styles.gpaValue} maxFontSizeMultiplier={1.3}>{dash(semEndResult.cgpa)}</Text>
                </View>
              </View>

              {/* Grade Table - subject-wise grade points only */}
              <View style={styles.tableCard}>
                <View style={styles.tableHeader}>
                  <Text style={[styles.th, { flex: 2.5, textAlign: 'left' }]}>Subject</Text>
                  <Text style={styles.th}>Credits</Text>
                  <Text style={styles.th}>Grade</Text>
                </View>
                {semEndResult.courses.map((c) => (
                  <View key={c.course_code} style={styles.tableRow}>
                    <View style={{ flex: 2.5 }}>
                      <Text style={styles.courseName}>{dash(c.course_name)}</Text>
                      <Text style={styles.courseCode}>{dash(c.course_code)}</Text>
                    </View>
                    <Text style={styles.td}>{dash(c.credits)}</Text>
                    <Text style={[styles.td, styles.tdBold]}>{gradeDisplay(c.grade, c.grade_point)}</Text>
                  </View>
                ))}
              </View>

              {/* Backlog / Supplementary / Revaluation / Recorrection results */}
              {reattemptedCourses.length > 0 && (
                <View style={[styles.tableCard, styles.backlogCard]}>
                  <Text style={styles.backlogTitle}>Backlog / Revaluation Results</Text>
                  <View style={styles.tableHeader}>
                    <Text style={[styles.th, { flex: 2.5, textAlign: 'left' }]}>Subject</Text>
                    <Text style={styles.th}>Type</Text>
                    <Text style={styles.th}>Grade</Text>
                  </View>
                  {reattemptedCourses.map((c) => (
                    <View key={c.course_code} style={styles.tableRow}>
                      <View style={{ flex: 2.5 }}>
                        <Text style={styles.courseName}>{dash(c.course_name)}</Text>
                        <Text style={styles.courseCode}>{dash(c.course_code)}</Text>
                      </View>
                      <Text style={styles.td}>{dash(c.exam_type)}</Text>
                      <Text
                        style={[
                          styles.td,
                          styles.tdBold,
                          c.grade === 'F' || c.grade === 'Ab' ? styles.tdFail : styles.tdPass,
                        ]}
                      >
                        {gradeDisplay(c.grade, c.grade_point)}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </>
          ) : (
            <Text style={styles.empty}>Result not published yet.</Text>
          )
        )}

        {!isLoading && subTab !== 'sem_end' && (
          !midEnabled ? (
            <FeatureDisabled message="Mid results are currently unavailable." />
          ) : midRows.length > 0 ? (
            <View style={styles.tableCard}>
              <View style={styles.tableHeader}>
                <Text style={[styles.th, { flex: 2.5, textAlign: 'left' }]}>Subject</Text>
                <Text style={styles.th}>Mid</Text>
                <Text style={styles.th}>Assign.</Text>
                <Text style={styles.th}>Total</Text>
              </View>
              {midRows.map((r) => (
                <View key={r.course_code} style={styles.tableRow}>
                  <View style={{ flex: 2.5 }}>
                    <Text style={styles.courseName}>{dash(r.course_name)}</Text>
                    <Text style={styles.courseCode}>{dash(r.course_code)}</Text>
                  </View>
                  <Text style={styles.td}>
                    {r.attendance === 'Absent' ? 'Ab' : `${dash(r.mid_marks)}/${dash(r.mid_max)}`}
                  </Text>
                  <Text style={styles.td}>
                    {r.assign_marks != null ? `${r.assign_marks}/${dash(r.assign_max)}` : '-'}
                  </Text>
                  <Text style={[styles.td, styles.tdBold]}>{dash(r.total)}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.empty}>Result not published yet.</Text>
          )
        )}
      </ScrollView>
    </AppBackground>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 32 },
  empty: { fontSize: 14, color: '#000', textAlign: 'center', marginTop: 40 },

  topBar: { backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 10 },
  semPicker: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: GREEN_LIGHT, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, gap: 8,
  },
  semPickerText: { fontSize: 15, fontWeight: '700', color: GREEN, flexShrink: 1, flexWrap: 'wrap' },

  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 24 },
  modal: { backgroundColor: '#fff', borderRadius: 16, padding: 20, maxHeight: '60%' },
  modalTitle: { fontSize: 17, fontWeight: '700', color: '#1a1a1a', marginBottom: 12 },
  semOption: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F5F5F5', gap: 8,
  },
  semOptionActive: {},
  semOptionText: { fontSize: 15, color: '#333', flexShrink: 1, flexWrap: 'wrap' },
  semOptionTextActive: { fontWeight: '700', color: GREEN },

  subTabBar: {
    flexDirection: 'row', backgroundColor: '#fff', marginHorizontal: 16, marginTop: 10,
    borderRadius: 12, padding: 4,
    elevation: 1, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, shadowOffset: { width: 0, height: 1 },
  },
  subTab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  subTabActive: { backgroundColor: GREEN },
  subTabDisabled: { opacity: 0.4 },
  subTabText: { fontSize: 13, fontWeight: '600', color: '#000' },
  subTabTextActive: { color: '#fff' },

  gpaCard: {
    flexDirection: 'row', backgroundColor: '#fff', borderRadius: 16, padding: 24, marginBottom: 16,
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 2 },
  },
  gpaItem: { flex: 1, minWidth: 0, alignItems: 'center' },
  gpaLabel: { fontSize: 13, color: '#000', marginBottom: 4, textAlign: 'center' },
  gpaValue: { fontSize: 32, fontWeight: '700', color: GREEN, textAlign: 'center' },
  gpaDivider: { width: 1, backgroundColor: '#E0E0E0', marginHorizontal: 16 },

  tableCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16, overflow: 'hidden',
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 2 },
  },
  tableHeader: {
    flexDirection: 'row', paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: '#F0F0F0', marginBottom: 4,
  },
  th: { flex: 1, fontSize: 12, fontWeight: '600', color: '#000', textAlign: 'center' },
  tableRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: '#F8F8F8',
  },
  courseName: { fontSize: 12, fontWeight: '600', color: '#1a1a1a' },
  courseCode: { fontSize: 11, color: '#000', marginTop: 1 },
  td: { flex: 1, fontSize: 13, color: '#333', textAlign: 'center' },
  tdBold: { fontWeight: '700', color: GREEN },
  tdPass: { color: '#1B8A3D' },
  tdFail: { color: '#C62828' },

  backlogCard: { marginTop: 16, borderWidth: 1, borderColor: '#F3D9A0' },
  backlogTitle: { fontSize: 14, fontWeight: '700', color: '#8A5A00', marginBottom: 10 },
})
