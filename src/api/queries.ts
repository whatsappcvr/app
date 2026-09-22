import { useQuery, useMutation } from '@tanstack/react-query'
import { client } from './client'
import { CacheService } from '../services/cacheService'
import type {
  Ward,
  StudentProfile,
  DailyAttendance,
  WeeklyAttendance,
  MonthlyAttendance,
  SemesterAttendance,
  CourseAttendanceDetail,
  AttendanceOverview,
  MidResult,
  AssignmentResult,
  SemesterResult,
  PaymentLink,
  Mentor,
  Circular,
  FeeDetails,
} from '../types'

/**
 * Wraps a query's fetcher with the app's offline cache: a successful
 * response is cached (keyed by `cacheKey`) and returned as-is; a failed
 * fetch (offline, timeout, 5xx, ...) falls back to the last cached response
 * instead of throwing, so screens keep showing last-known-good data with the
 * NetworkStatusBanner rather than an error/blank screen. If there's no cache
 * either, the original error is re-thrown so react-query's error state kicks in.
 */
function withOfflineCache<T>(cacheKey: string, fetcher: () => Promise<T>): () => Promise<T> {
  return async () => {
    try {
      const result = await fetcher()
      await CacheService.set(cacheKey, result)
      return result
    } catch (err) {
      const cached = await CacheService.get<T>(cacheKey)
      if (cached) {
        if (__DEV__) console.warn(`[api] "${cacheKey}" fetch failed, serving cached data from`, new Date(cached.lastUpdated))
        return cached.data
      }
      throw err
    }
  }
}

export function useWards() {
  return useQuery({
    queryKey: ['wards'],
    queryFn: () => client.get<Ward[]>('/me/students').then((r) => r.data),
  })
}

export function useStudentProfile(roll: string) {
  return useQuery({
    queryKey: ['studentProfile', roll],
    queryFn: withOfflineCache(`studentProfile:${roll}`, () => client.get<StudentProfile>(`/students/${roll}`).then((r) => r.data)),
    enabled: !!roll,
  })
}

export function useDailyAttendance(roll: string, date: string) {
  return useQuery({
    queryKey: ['dailyAttendance', roll, date],
    queryFn: () =>
      client
        .get<DailyAttendance>(`/students/${roll}/attendance`, {
          params: { range: 'daily', from: date, to: date },
        })
        .then((r) => r.data),
    enabled: !!roll,
  })
}

/** Per-day period attendance across a date range, used by the attendance calendar.
 *  Cached locally so it only hits the backend once per app session; the calendar
 *  has its own dedicated refresh button for manual reloads. */
export function useDailyAttendanceRange(roll: string, from: string, to: string) {
  return useQuery({
    queryKey: ['dailyAttendanceRange', roll, from, to],
    queryFn: withOfflineCache(`dailyAttendanceRange:${roll}:${from}:${to}`, () =>
      client
        .get<DailyAttendance[]>(`/students/${roll}/attendance`, {
          params: { range: 'daily', from, to },
        })
        .then((r) => r.data)),
    enabled: !!roll,
    staleTime: Infinity,
    gcTime: 24 * 60 * 60 * 1000,
  })
}

export function useWeeklyAttendance(roll: string, from: string, to: string) {
  return useQuery({
    queryKey: ['weeklyAttendance', roll, from, to],
    queryFn: () =>
      client
        .get<WeeklyAttendance[]>(`/students/${roll}/attendance`, {
          params: { range: 'weekly', from, to },
        })
        .then((r) => r.data),
    enabled: !!roll,
  })
}

export function useMonthlyAttendance(roll: string, from: string, to: string) {
  return useQuery({
    queryKey: ['monthlyAttendance', roll, from, to],
    queryFn: () =>
      client
        .get<MonthlyAttendance[]>(`/students/${roll}/attendance`, {
          params: { range: 'monthly', from, to },
        })
        .then((r) => r.data),
    enabled: !!roll,
  })
}

export function useSemesterAttendance(roll: string) {
  return useQuery({
    queryKey: ['semesterAttendance', roll],
    queryFn: withOfflineCache(`semesterAttendance:${roll}`, () =>
      client
        .get<SemesterAttendance>(`/students/${roll}/attendance`, {
          params: { range: 'semester' },
        })
        .then((r) => r.data)),
    enabled: !!roll,
    staleTime: 60 * 60 * 1000, // ~hourly - attendance doesn't change more often than that
  })
}

export function useCourseAttendance(roll: string, courseCode: string) {
  return useQuery({
    queryKey: ['courseAttendance', roll, courseCode],
    queryFn: withOfflineCache(`courseAttendance:${roll}:${courseCode}`, () =>
      client
        .get<CourseAttendanceDetail>(`/students/${roll}/attendance/course/${encodeURIComponent(courseCode)}`)
        .then((r) => r.data)),
    enabled: !!roll && !!courseCode,
    staleTime: 60 * 60 * 1000,
  })
}

export function useAttendanceOverview(roll: string) {
  return useQuery({
    queryKey: ['attendanceOverview', roll],
    queryFn: withOfflineCache(`attendanceOverview:${roll}`, () => client.get<AttendanceOverview>(`/students/${roll}/attendance/overview`).then((r) => r.data)),
    enabled: !!roll,
    staleTime: 60 * 60 * 1000, // ~hourly
  })
}

export function useMidResults(roll: string) {
  return useQuery({
    queryKey: ['midResults', roll],
    queryFn: withOfflineCache(`midResults:${roll}`, () => client.get<MidResult[]>(`/students/${roll}/results/mid`).then((r) => r.data)),
    enabled: !!roll,
  })
}

export function useAssignmentResults(roll: string) {
  return useQuery({
    queryKey: ['assignmentResults', roll],
    queryFn: withOfflineCache(`assignmentResults:${roll}`, () =>
      client.get<AssignmentResult[]>(`/students/${roll}/results/assignments`).then((r) => r.data)),
    enabled: !!roll,
  })
}

export function useSemesterResults(roll: string) {
  return useQuery({
    queryKey: ['semesterResults', roll],
    queryFn: withOfflineCache(`semesterResults:${roll}`, () =>
      client.get<SemesterResult[]>(`/students/${roll}/results/semester`).then((r) => r.data)),
    enabled: !!roll,
  })
}

export function usePaymentLink() {
  return useQuery({
    queryKey: ['paymentLink'],
    queryFn: () => client.get<PaymentLink>('/payment/link').then((r) => r.data),
  })
}

export function useFeeDetails(roll: string) {
  return useQuery({
    queryKey: ['feeDetails', roll],
    queryFn: withOfflineCache(`feeDetails:${roll}`, () => client.get<FeeDetails>(`/students/${roll}/fees`).then((r) => r.data)),
    enabled: !!roll,
  })
}

export function useMentor(roll: string) {
  return useQuery({
    queryKey: ['mentor', roll],
    queryFn: withOfflineCache(`mentor:${roll}`, () => client.get<Mentor>(`/students/${roll}/mentor`).then((r) => r.data)),
    enabled: !!roll,
  })
}

export function useCirculars(since?: string) {
  return useQuery({
    queryKey: ['circulars', since],
    queryFn: withOfflineCache(`circulars:${since ?? 'all'}`, () =>
      client.get<Circular[]>('/circulars', { params: since ? { since } : {} }).then((r) => r.data)),
    staleTime: 30 * 1000,
  })
}

export function useRegisterPushToken() {
  return useMutation({
    mutationFn: (data: { token: string; platform: string }) =>
      client.post('/device-tokens', data).then((r) => r.data),
  })
}

export interface AppVersionInfo {
  min_version: string
  latest_version: string
  update_url: string
}

export function useAppVersionCheck() {
  return useQuery({
    queryKey: ['appVersion'],
    queryFn: () => client.get<AppVersionInfo>('/app/version').then((r) => r.data),
    staleTime: 60 * 60 * 1000,
    retry: 1,
  })
}

export interface FeatureFlags {
  attendance_overview: boolean
  attendance_calendar: boolean
  attendance_daily: boolean
  attendance_subjectwise: boolean
  attendance_subjectwise_percentage: boolean
  fees: boolean
  results_mid: boolean
  results_semester: boolean
}

const DEFAULT_FEATURES: FeatureFlags = {
  attendance_overview: true,
  attendance_calendar: true,
  attendance_daily: true,
  attendance_subjectwise: true,
  attendance_subjectwise_percentage: true,
  fees: true,
  results_mid: true,
  results_semester: true,
}

export function useFeatures() {
  return useQuery({
    queryKey: ['features'],
    queryFn: () => client.get<FeatureFlags>('/features').then((r) => r.data),
    staleTime: 15 * 60 * 1000,
    retry: 1,
    placeholderData: DEFAULT_FEATURES,
  })
}
