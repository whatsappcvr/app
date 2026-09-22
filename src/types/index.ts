// Auth
export interface OtpRequestPayload { mobile: string }
export interface OtpVerifyPayload { mobile: string; otp: string }
export interface OtpVerifyResponse { token: string; wards: Ward[] }

// Ward / Student
export interface Ward {
  roll_number: string
  student_name: string
  branch_name: string
  department_name: string
  section: string
  year: number
  sem_no: number
  photo_url?: string
}

export interface Address {
  address: string
  landmark: string
  country: string
  state: string
  district: string
  taluka: string
  city: string
  pincode: string
}

export interface BusAssignment {
  route_name: string
  stop_name: string
  pickup_time: string
  drop_time: string
}

export interface StudentProfile extends Ward {
  gender: string
  date_of_birth: string
  blood_group: string
  father_name: string
  mother_name: string
  parent_email: string
  student_email: string
  student_mobile: string
  parent_mobile: string
  regulation: string
  academic_year: string
  batch: string
  local_address: Address
  permanent_address: Address
  bus_assignment?: BusAssignment
}

// Attendance
export interface PeriodAttendance {
  period_no: number
  course_code: string
  course_name: string
  course_type: string
  status: 'Present' | 'Absent' | 'OD' | 'Late'
  start_time: string
  end_time: string
}

export interface DailyAttendance {
  date: string
  periods: PeriodAttendance[]
}

export interface AttendanceSummary {
  total: number
  present: number
  percentage: number
}

export interface WeeklyAttendance extends AttendanceSummary {
  week_start: string
}

export interface MonthlyAttendance extends AttendanceSummary {
  month: string
}

export interface CourseAttendance {
  course_code: string
  course_name: string
  total: number
  present: number
  percentage: number
}

export interface SemesterAttendance {
  overall_percentage: number
  by_course: CourseAttendance[]
}

export interface CourseAttendanceRecord {
  date: string
  period_no: number
  status: 'Present' | 'Absent' | 'OD' | 'Late'
  start_time: string | null
  end_time: string | null
}

export interface CourseAttendanceDetail {
  course_code: string
  course_name: string | null
  records: CourseAttendanceRecord[]
}

export interface AttendanceCalendarDay {
  date: string
  status: 'present' | 'absent' | 'od' | 'holiday' | null
}

export interface AttendanceOverview {
  overall_percentage: number
  present: number
  absent: number
  od: number
  total: number
  calendar: AttendanceCalendarDay[]
  by_course: CourseAttendance[]
}

// Results
export interface MidCourseResult {
  course_code: string
  course_name: string
  marks: number | null
  max_marks: number
  attendance: 'Present' | 'Absent' | 'Malpractice'
}

export interface MidResult {
  semester: number
  mid_type: 'mid_1' | 'mid_2' | 'improvement'
  courses: MidCourseResult[]
}

export interface AssignmentCourseResult {
  course_code: string
  course_name: string
  marks: number | null
  max_marks: number
}

export interface AssignmentResult {
  semester: number
  assignment_type: string
  courses: AssignmentCourseResult[]
}

export interface SemesterCourseResult {
  course_code: string
  course_name: string
  internal_marks: string
  external_marks: string
  total_marks: string
  grade: string
  grade_point: number | null
  credits: string
  exam_type: string | null
  reattempted: boolean
}

export interface SemesterResult {
  semester: number
  sgpa: string
  cgpa: string
  courses: SemesterCourseResult[]
}

// Mentor
export interface Mentor {
  name: string
  department: string
  phone: string
  email: string
  whatsapp?: string
  office_location: string
  office_hours: string
}

// Circulars
export interface Circular {
  id: number
  title: string
  body: string
  category: string
  attachment_url?: string
  published_at: string
}

// Payment
export interface PaymentLink {
  url: string
}

// Fee / Payment
export interface FeeDetails {
  outstanding_amount: number
  due_date: string
  status: 'due' | 'paid' | 'overdue'
  payment_url: string
  breakdown?: { label: string; amount: number }[]
}
