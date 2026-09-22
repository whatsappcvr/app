export type IdentifierType = 'mobile' | 'roll_number'

export interface ParsedIdentifier {
  type: IdentifierType
  value: string
}

const ROLL_NUMBER_PATTERN = /^[A-Za-z0-9]{8,12}$/

// A registered mobile number is exactly 10 digits; anything else alphanumeric
// in a plausible length range is treated as a roll number. Real "is this roll
// / mobile actually registered" validation happens server-side.
export function parseIdentifier(raw: string): ParsedIdentifier | null {
  const trimmed = raw.trim()
  if (!trimmed) return null

  const digitsOnly = trimmed.replace(/\D/g, '')
  if (digitsOnly.length === 10 && digitsOnly === trimmed) {
    return { type: 'mobile', value: digitsOnly }
  }

  if (ROLL_NUMBER_PATTERN.test(trimmed) && /[A-Za-z]/.test(trimmed) && /[0-9]/.test(trimmed)) {
    return { type: 'roll_number', value: trimmed.toUpperCase() }
  }

  return null
}
