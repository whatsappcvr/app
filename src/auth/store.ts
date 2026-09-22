import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'
import type { Ward } from '../types'

export interface Session {
  wards: Ward[]
  activeWardRoll: string | null
}

interface AuthState {
  parentSession: Session | null
  studentSession: Session | null
  activeAccountType: 'parent' | 'student' | null

  // Derived-style getters kept as plain state so selectors like
  // s.wards, s.activeWardRoll, s.accountType, s.isAuthenticated
  // continue to work unchanged across every screen.
  wards: Ward[]
  activeWardRoll: string | null
  accountType: 'parent' | 'student' | null
  isAuthenticated: boolean

  setSession: (accountType: 'parent' | 'student', wards: Ward[]) => void
  removeSession: (accountType: 'parent' | 'student') => void
  switchAccount: (accountType: 'parent' | 'student') => void
  switchWard: (rollNumber: string) => void
  hasSession: (accountType: 'parent' | 'student') => boolean
  logout: () => void
}

function deriveActive(
  parentSession: Session | null,
  studentSession: Session | null,
  activeAccountType: 'parent' | 'student' | null,
) {
  const session =
    activeAccountType === 'parent' ? parentSession :
    activeAccountType === 'student' ? studentSession :
    null
  return {
    wards: session?.wards ?? [],
    activeWardRoll: session?.activeWardRoll ?? null,
    accountType: activeAccountType,
    isAuthenticated: parentSession !== null || studentSession !== null,
  }
}

const EMPTY: Session | null = null

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      parentSession: EMPTY,
      studentSession: EMPTY,
      activeAccountType: null,
      ...deriveActive(null, null, null),

      setSession: (accountType, wards) =>
        set((state) => {
          const session: Session = {
            wards,
            activeWardRoll: wards[0]?.roll_number ?? null,
          }
          const ps = accountType === 'parent' ? session : state.parentSession
          const ss = accountType === 'student' ? session : state.studentSession
          return {
            parentSession: ps,
            studentSession: ss,
            activeAccountType: accountType,
            ...deriveActive(ps, ss, accountType),
          }
        }),

      removeSession: (accountType) =>
        set((state) => {
          const ps = accountType === 'parent' ? null : state.parentSession
          const ss = accountType === 'student' ? null : state.studentSession
          const remaining = ps ? 'parent' : ss ? 'student' : null
          return {
            parentSession: ps,
            studentSession: ss,
            activeAccountType: remaining,
            ...deriveActive(ps, ss, remaining),
          }
        }),

      switchAccount: (accountType) =>
        set((state) => {
          const session = accountType === 'parent' ? state.parentSession : state.studentSession
          if (!session) return state
          return {
            activeAccountType: accountType,
            ...deriveActive(state.parentSession, state.studentSession, accountType),
          }
        }),

      switchWard: (rollNumber) =>
        set((state) => {
          if (!state.activeAccountType) return state
          const key = state.activeAccountType === 'parent' ? 'parentSession' : 'studentSession'
          const session = state[key]
          if (!session) return state
          const updated = { ...session, activeWardRoll: rollNumber }
          const ps = key === 'parentSession' ? updated : state.parentSession
          const ss = key === 'studentSession' ? updated : state.studentSession
          return {
            [key]: updated,
            ...deriveActive(ps, ss, state.activeAccountType),
          }
        }),

      hasSession: (accountType) => {
        const s = get()
        return accountType === 'parent' ? s.parentSession !== null : s.studentSession !== null
      },

      logout: () =>
        set({
          parentSession: EMPTY,
          studentSession: EMPTY,
          activeAccountType: null,
          ...deriveActive(null, null, null),
        }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
)
