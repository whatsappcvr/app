import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'

export interface StoredNotification {
  id: string
  title: string
  body: string
  type: string
  data?: Record<string, string>
  created_at: string
  read?: boolean
}

const MAX_STORED = 100

// Guards against a push being stored twice under different ids — e.g. a
// foreground receipt and a later tap both firing for the same event.
function notificationSignature(n: Pick<StoredNotification, 'type' | 'title' | 'body'>): string {
  return `${n.type}|${n.title}|${n.body}`
}

// Absence alerts carry the ward's roll number in `data.roll` (see backend
// scheduler.py's absence_detector). Notifications without a roll (circulars,
// general) are broadcasts meant for everyone. The store itself is a single
// AsyncStorage bucket shared across every account ever logged into this
// device/install (parent + student sessions can be active at once), so
// callers must filter with this before displaying anything, or a ward's
// absence alert leaks into an unrelated account's list after switching.
export function isVisibleForRolls(item: StoredNotification, rollNumbers: string[]): boolean {
  const roll = item.data?.roll
  return !roll || rollNumbers.includes(roll)
}

interface NotificationsState {
  items: StoredNotification[]
  add: (notification: StoredNotification) => void
  markRead: (id: string) => void
  markAllRead: () => void
  clear: () => void
}

export const useNotificationsStore = create<NotificationsState>()(
  persist(
    (set) => ({
      items: [],
      add: (notification) =>
        set((state) => {
          if (state.items.some((n) => n.id === notification.id || notificationSignature(n) === notificationSignature(notification))) {
            return state
          }
          return { items: [{ ...notification, read: false }, ...state.items].slice(0, MAX_STORED) }
        }),
      markRead: (id) =>
        set((state) => ({
          items: state.items.map((n) => (n.id === id ? { ...n, read: true } : n)),
        })),
      markAllRead: () =>
        set((state) => ({ items: state.items.map((n) => ({ ...n, read: true })) })),
      clear: () => set({ items: [] }),
    }),
    {
      // Bumped from 'notifications-storage': older installs have stale
      // pre-fix batch-summary items cached locally (e.g. "N student(s)
      // marked absent" — the old broadcast format scheduler.py's comment
      // explains was removed for leaking across accounts). Renaming the
      // key drops that junk for everyone in one shot instead of trying to
      // sniff it out by content.
      name: 'notifications-storage-v2',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
)

// Lives here rather than in handlers.ts so it can be imported from index.js's
// background message handler without pulling in expo-router — that handler
// runs before `expo-router/entry`, and any failure here must never block the
// caller from still showing the system notification.
export function storeNotification(id: string, data: Record<string, string> | undefined) {
  try {
    // Circulars aren't logged server-side and have no place in the
    // Notifications feed — their content lives only in GET /circulars, and
    // the circular screens read straight from there.
    if (data?.type === 'circular') return
    useNotificationsStore.getState().add({
      id,
      title: data?.title ?? '',
      body: data?.body ?? '',
      type: data?.type ?? 'general',
      data,
      created_at: new Date().toISOString(),
    })
  } catch (err) {
    console.warn('[notifications] failed to store notification', err)
  }
}
