import type {
  Ward,
  StudentProfile,
  DailyAttendance,
  WeeklyAttendance,
  MonthlyAttendance,
  SemesterAttendance,
  AttendanceOverview,
  MidResult,
  AssignmentResult,
  SemesterResult,
  Mentor,
  Circular,
  PaymentLink,
  FeeDetails,
} from '../types'

export const MOCK_WARDS: Ward[] = [
  {
    roll_number: '23CS123',
    student_name: 'Aditya Kumar',
    branch_name: 'CSE',
    department_name: 'Computer Science and Engineering',
    section: 'A',
    year: 3,
    sem_no: 5,
  },
  {
    roll_number: '25EC045',
    student_name: 'Ananya Kumar',
    branch_name: 'ECE',
    department_name: 'Electronics and Communication Engineering',
    section: 'B',
    year: 1,
    sem_no: 1,
  },
]

export const MOCK_PROFILE: StudentProfile = {
  ...MOCK_WARDS[0],
  gender: 'Male',
  date_of_birth: '2005-08-14',
  blood_group: 'B+',
  father_name: 'Ramesh Kumar',
  mother_name: 'Sowjanya Kumar',
  parent_email: 'ramesh.kumar@gmail.com',
  student_email: 'aditya.kumar@cvr.ac.in',
  student_mobile: '+91 98765 43210',
  parent_mobile: '+91 98765 43211',
  regulation: 'R23',
  academic_year: '2025-2026',
  batch: '2023 - 2027',
  local_address: {
    address: '12-3-456, Kukatpally',
    landmark: 'Near KPHB Metro',
    country: 'India',
    state: 'Telangana',
    district: 'Hyderabad',
    taluka: 'Kukatpally',
    city: 'Hyderabad',
    pincode: '500072',
  },
  permanent_address: {
    address: '4-5-67, Gandhi Nagar',
    landmark: 'Near Bus Stand',
    country: 'India',
    state: 'Telangana',
    district: 'Warangal',
    taluka: 'Warangal',
    city: 'Warangal',
    pincode: '506001',
  },
  bus_assignment: {
    route_name: 'Route 7 - Kukatpally',
    stop_name: 'KPHB Colony',
    pickup_time: '7:30 AM',
    drop_time: '5:15 PM',
  },
}

const today = new Date().toISOString().split('T')[0]

export const MOCK_DAILY_ATTENDANCE: DailyAttendance = {
  date: today,
  periods: [
    { period_no: 1, course_code: 'CS501', course_name: 'Data Mining', course_type: 'Theory', status: 'Present', start_time: '09:00', end_time: '10:00' },
    { period_no: 2, course_code: 'CS502', course_name: 'Operating Systems', course_type: 'Theory', status: 'Present', start_time: '10:00', end_time: '11:00' },
    { period_no: 3, course_code: 'CS503', course_name: 'Computer Networks', course_type: 'Theory', status: 'Absent', start_time: '11:30', end_time: '12:30' },
    { period_no: 4, course_code: 'CS504', course_name: 'AI & ML', course_type: 'Theory', status: 'Present', start_time: '13:30', end_time: '14:30' },
    { period_no: 5, course_code: 'CS505', course_name: 'Software Engineering', course_type: 'Theory', status: 'Present', start_time: '14:30', end_time: '15:30' },
  ],
}

// Deterministic per-date mock generator for the attendance calendar: given a
// date range, produces one DailyAttendance per weekday (weekends and future
// dates are omitted, which the calendar renders as "not yet updated").
function hashDate(dateKey: string): number {
  let h = 0
  for (let i = 0; i < dateKey.length; i++) h = (h * 31 + dateKey.charCodeAt(i)) >>> 0
  return h
}

export function generateMockDailyRange(from: string, to: string): DailyAttendance[] {
  const result: DailyAttendance[] = []
  const start = new Date(from)
  const end = new Date(to)
  const now = new Date()
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const day = d.getDay()
    if (day === 0 || day === 6) continue // weekends: no periods
    if (d > now) continue // future: not yet updated
    const dateKey = d.toISOString().split('T')[0]
    const h = hashDate(dateKey)
    const periods = MOCK_DAILY_ATTENDANCE.periods.map((p, i) => ({
      ...p,
      status: (h + i * 7) % 10 < 2 ? 'Absent' : 'Present',
    })) as typeof MOCK_DAILY_ATTENDANCE.periods
    result.push({ date: dateKey, periods })
  }
  return result
}

export const MOCK_WEEKLY_ATTENDANCE: WeeklyAttendance[] = [
  { week_start: '2026-09-07', total: 36, present: 34, percentage: 94.4 },
  { week_start: '2026-09-01', total: 36, present: 33, percentage: 91.7 },
  { week_start: '2026-08-25', total: 36, present: 35, percentage: 97.2 },
  { week_start: '2026-08-18', total: 36, present: 34, percentage: 94.4 },
]

export const MOCK_MONTHLY_ATTENDANCE: MonthlyAttendance[] = [
  { month: '2026-09', total: 108, present: 100, percentage: 92.6 },
  { month: '2026-08', total: 144, present: 134, percentage: 93.1 },
  { month: '2026-07', total: 144, present: 132, percentage: 91.7 },
]

export const MOCK_SEMESTER_ATTENDANCE: SemesterAttendance = {
  overall_percentage: 92.4,
  by_course: [
    { course_code: 'CS501', course_name: 'Data Structures', total: 30, present: 28, percentage: 93.3 },
    { course_code: 'CS502', course_name: 'Operating Systems', total: 30, present: 27, percentage: 90.0 },
    { course_code: 'CS503', course_name: 'Database Mgmt', total: 30, present: 28, percentage: 93.3 },
    { course_code: 'CS504', course_name: 'Computer Networks', total: 28, present: 26, percentage: 92.9 },
    { course_code: 'CS505', course_name: 'Software Engineering', total: 15, present: 14, percentage: 93.3 },
    { course_code: 'CS506', course_name: 'AI & ML', total: 15, present: 13, percentage: 86.7 },
  ],
}

export const MOCK_ATTENDANCE_OVERVIEW: AttendanceOverview = {
  overall_percentage: 92.4,
  present: 136,
  absent: 8,
  od: 4,
  total: 148,
  calendar: [
    { date: '2026-09-01', status: 'present' },
    { date: '2026-09-02', status: 'present' },
    { date: '2026-09-03', status: 'present' },
    { date: '2026-09-04', status: 'absent' },
    { date: '2026-09-05', status: 'present' },
    { date: '2026-09-06', status: 'holiday' },
    { date: '2026-09-07', status: 'holiday' },
    { date: '2026-09-08', status: 'present' },
    { date: '2026-09-09', status: 'present' },
    { date: '2026-09-10', status: 'od' },
    { date: '2026-09-11', status: 'present' },
    { date: '2026-09-12', status: 'present' },
    { date: '2026-09-13', status: 'holiday' },
    { date: '2026-09-14', status: 'holiday' },
    { date: '2026-09-15', status: 'present' },
    { date: '2026-09-16', status: 'present' },
    { date: '2026-09-17', status: 'absent' },
    { date: '2026-09-18', status: 'present' },
    { date: '2026-09-19', status: 'present' },
    { date: '2026-09-20', status: 'holiday' },
    { date: '2026-09-21', status: 'holiday' },
    { date: '2026-09-22', status: 'present' },
    { date: '2026-09-23', status: 'od' },
    { date: '2026-09-24', status: 'present' },
    { date: '2026-09-25', status: 'present' },
    { date: '2026-09-26', status: 'present' },
    { date: '2026-09-27', status: 'holiday' },
    { date: '2026-09-28', status: 'holiday' },
    { date: '2026-09-29', status: null },
    { date: '2026-09-30', status: null },
  ],
  by_course: [
    { course_code: 'CS501', course_name: 'Data Structures', total: 30, present: 28, percentage: 93.3 },
    { course_code: 'CS502', course_name: 'Operating Systems', total: 30, present: 27, percentage: 90.0 },
    { course_code: 'CS503', course_name: 'Database Mgmt', total: 30, present: 28, percentage: 93.3 },
    { course_code: 'CS504', course_name: 'Computer Networks', total: 28, present: 26, percentage: 92.9 },
    { course_code: 'CS505', course_name: 'Software Engineering', total: 15, present: 14, percentage: 93.3 },
    { course_code: 'CS506', course_name: 'AI & ML', total: 15, present: 13, percentage: 86.7 },
  ],
}

export const MOCK_MID_RESULTS: MidResult[] = [
  {
    semester: 5,
    mid_type: 'mid_1',
    courses: [
      { course_code: 'CS501', course_name: 'Data Structures', marks: 24, max_marks: 30, attendance: 'Present' },
      { course_code: 'CS502', course_name: 'Operating Systems', marks: 26, max_marks: 30, attendance: 'Present' },
      { course_code: 'CS503', course_name: 'Database Mgmt', marks: 22, max_marks: 30, attendance: 'Present' },
      { course_code: 'CS504', course_name: 'Computer Networks', marks: 25, max_marks: 30, attendance: 'Present' },
      { course_code: 'CS505', course_name: 'Software Engineering', marks: 20, max_marks: 30, attendance: 'Present' },
      { course_code: 'CS506', course_name: 'AI & ML', marks: 27, max_marks: 30, attendance: 'Present' },
    ],
  },
  {
    semester: 5,
    mid_type: 'mid_2',
    courses: [
      { course_code: 'CS501', course_name: 'Data Structures', marks: 26, max_marks: 30, attendance: 'Present' },
      { course_code: 'CS502', course_name: 'Operating Systems', marks: 25, max_marks: 30, attendance: 'Present' },
      { course_code: 'CS503', course_name: 'Database Mgmt', marks: null, max_marks: 30, attendance: 'Absent' },
      { course_code: 'CS504', course_name: 'Computer Networks', marks: 24, max_marks: 30, attendance: 'Present' },
      { course_code: 'CS505', course_name: 'Software Engineering', marks: 22, max_marks: 30, attendance: 'Present' },
      { course_code: 'CS506', course_name: 'AI & ML', marks: 28, max_marks: 30, attendance: 'Present' },
    ],
  },
]

export const MOCK_ASSIGNMENT_RESULTS: AssignmentResult[] = [
  {
    semester: 5,
    assignment_type: 'A1',
    courses: [
      { course_code: 'CS501', course_name: 'Data Structures', marks: 8, max_marks: 10 },
      { course_code: 'CS502', course_name: 'Operating Systems', marks: 9, max_marks: 10 },
      { course_code: 'CS503', course_name: 'Database Mgmt', marks: 8, max_marks: 10 },
      { course_code: 'CS504', course_name: 'Computer Networks', marks: 7, max_marks: 10 },
      { course_code: 'CS505', course_name: 'Software Engineering', marks: 9, max_marks: 10 },
      { course_code: 'CS506', course_name: 'AI & ML', marks: 8, max_marks: 10 },
    ],
  },
]

export const MOCK_SEMESTER_RESULTS: SemesterResult[] = [
  {
    semester: 4,
    sgpa: '8.90',
    cgpa: '8.72',
    courses: [
{ course_code: 'CS501', course_name: 'Data Structures', internal_marks: '32', external_marks: '52', total_marks: '84', grade: 'A+', grade_point: '9', credits: '3', exam_type: 'Regular', reattempted: false },
    { course_code: 'CS502', course_name: 'Operating Systems', internal_marks: '35', external_marks: '50', total_marks: '85', grade: 'A+', grade_point: '9', credits: '3', exam_type: 'Regular', reattempted: false },
    { course_code: 'CS503', course_name: 'Database Mgmt', internal_marks: '30', external_marks: '48', total_marks: '78', grade: 'A', grade_point: '8', credits: '3', exam_type: 'Regular', reattempted: false },
    { course_code: 'CS504', course_name: 'Computer Networks', internal_marks: '32', external_marks: '46', total_marks: '78', grade: 'A', grade_point: '8', credits: '3', exam_type: 'Regular', reattempted: false },
    { course_code: 'CS505', course_name: 'Software Engineering', internal_marks: '29', external_marks: '44', total_marks: '73', grade: 'A', grade_point: '8', credits: '3', exam_type: 'Regular', reattempted: false },
    { course_code: 'CS506', course_name: 'AI & ML', internal_marks: '35', external_marks: '55', total_marks: '90', grade: 'S', grade_point: '10', credits: '3', exam_type: 'Regular', reattempted: false },
    ],
  },
  {
    semester: 3,
    sgpa: '8.60',
    cgpa: '8.55',
    courses: [
{ course_code: 'CS401', course_name: 'Discrete Mathematics', internal_marks: '28', external_marks: '46', total_marks: '74', grade: 'A', grade_point: '8', credits: '4', exam_type: 'Regular', reattempted: false },
    { course_code: 'CS402', course_name: 'Digital Logic Design', internal_marks: '30', external_marks: '50', total_marks: '80', grade: 'A+', grade_point: '9', credits: '4', exam_type: 'Regular', reattempted: false },
    { course_code: 'CS403', course_name: 'Object Oriented Programming', internal_marks: '33', external_marks: '48', total_marks: '81', grade: 'A+', grade_point: '9', credits: '3', exam_type: 'Regular', reattempted: false },
    { course_code: 'CS404', course_name: 'Data Communications', internal_marks: '27', external_marks: '45', total_marks: '72', grade: 'A', grade_point: '8', credits: '3', exam_type: 'Supplementary', reattempted: true },
    ],
  },
]

export const MOCK_MENTOR: Mentor = {
  name: 'Dr. Priya Sharma',
  department: 'Department of CSE',
  phone: '+91 98765 43210',
  email: 'priya.sharma@cvr.ac.in',
  whatsapp: '+91 98765 43210',
  office_location: 'CSE Block Room No. C-201',
  office_hours: 'Mon-Fri 10:00 AM - 4:00 PM',
}

export const MOCK_PAYMENT_LINK: PaymentLink = {
  url: 'https://cvr.ac.in/payment',
}

export const MOCK_FEE_DETAILS: FeeDetails = {
  outstanding_amount: 24500,
  due_date: '2026-09-30',
  status: 'due',
  payment_url: 'https://erp.cvr.ac.in/academic-planning/feemanagement/student/login.php',
  breakdown: [
    { label: 'Tuition Fee', amount: 18000 },
    { label: 'Lab Fee', amount: 3500 },
    { label: 'Library Fee', amount: 1500 },
    { label: 'Exam Fee', amount: 1500 },
  ],
}

export const MOCK_CIRCULARS: Circular[] = [
  {
    id: 1,
    title: 'Dussehra Holidays - October 2026',
    body: 'The college will remain closed from October 1st to October 5th, 2026 on account of Dussehra festival. Classes will resume on October 6th, 2026 (Monday). Students are advised to complete their pending assignments before the holiday break.',
    category: 'holiday',
    published_at: '2026-09-14T10:00:00Z',
  },
  {
    id: 2,
    title: 'Mid-2 Examination Schedule',
    body: 'Mid-2 examinations for all branches will be conducted from September 22nd to September 27th, 2026. Detailed timetable has been posted on the notice board. Students must carry their ID cards to the examination hall.',
    category: 'exam',
    published_at: '2026-09-12T09:00:00Z',
  },
  {
    id: 3,
    title: 'Annual Sports Day Registration',
    body: 'Registration for Annual Sports Day 2026 is now open. Students interested in participating can register through their respective class representatives. Last date for registration: September 20th, 2026. Events include athletics, cricket, basketball, volleyball, and indoor games.',
    category: 'general',
    attachment_url: 'https://cvr.ac.in/sports-day-2026.pdf',
    published_at: '2026-09-10T14:30:00Z',
  },
  {
    id: 4,
    title: 'Library Extended Hours During Exams',
    body: 'The central library will operate with extended hours (8:00 AM to 9:00 PM) during the examination period from September 20th to October 15th. Wi-Fi access will be available throughout.',
    category: 'general',
    published_at: '2026-09-08T11:00:00Z',
  },
]

