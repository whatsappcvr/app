export type AcademicProgram = 'B.Tech' | 'M.Tech'

const ORDINALS = ['1st', '2nd', '3rd', '4th']

/**
 * Derive the program (B.Tech / M.Tech) from the ERP `department_name` field
 * (e.g. "M.Tech - CSE", "B.Tech - ECE"). Mirrors the same convention used by
 * the WhatsApp bot backend (see backend/app/api/second_hour.py `_group_by_program_year`),
 * which is the source of truth for how these two department-name formats are
 * distinguished. Defaults to 'B.Tech' when the prefix isn't present, since
 * B.Tech is the far more common program and department_name for it doesn't
 * always carry an explicit prefix.
 */
export function deriveProgram(departmentName: string | null | undefined): AcademicProgram {
  if (departmentName && departmentName.trim().toUpperCase().startsWith('M.TECH')) {
    return 'M.Tech'
  }
  return 'B.Tech'
}

/**
 * Format an overall semester number (1-8 for B.Tech, 1-4 for M.Tech) into a
 * human readable academic label, e.g. "B.Tech 4th Year - 2nd Semester" or
 * "M.Tech 2nd Year - 1st Semester".
 *
 * Year is derived from the semester number: ceil(semesterNumber / 2).
 * Odd semester numbers are the 1st semester of that year, even numbers the 2nd.
 */
export function formatAcademicSemester(
  program: AcademicProgram | null | undefined,
  semesterNumber: number | null | undefined,
): string {
  if (semesterNumber == null || Number.isNaN(semesterNumber) || semesterNumber < 1) {
    if (__DEV__) {
      console.warn('[academicSemester] formatAcademicSemester called with invalid semesterNumber:', semesterNumber)
    }
    return 'Semester —'
  }

  const prog: AcademicProgram = program ?? 'B.Tech'
  const year = Math.ceil(semesterNumber / 2)
  const semInYear = semesterNumber % 2 === 0 ? 2 : 1
  const yearLabel = ORDINALS[year - 1] ?? `${year}th`
  const semLabel = semInYear === 1 ? '1st' : '2nd'

  return `${prog} ${yearLabel} Year - ${semLabel} Semester`
}

/** Short label for compact spaces, e.g. "Sem 4 (B.Tech Y2S2)". */
export function formatAcademicSemesterShort(
  program: AcademicProgram | null | undefined,
  semesterNumber: number | null | undefined,
): string {
  if (semesterNumber == null || Number.isNaN(semesterNumber) || semesterNumber < 1) return 'Semester —'
  const year = Math.ceil(semesterNumber / 2)
  const semInYear = semesterNumber % 2 === 0 ? 2 : 1
  return `Semester ${semesterNumber} (Y${year}S${semInYear})`
}
