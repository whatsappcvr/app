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

// A push received live on-device is stored under Expo's local notification
// identifier, but the same event synced from `/notifications` afterwards
// comes back as `server-<log id>` — a different id for the same event. Id
// equality alone can't dedupe those, so mergeFromServer also matches on
// this content signature (server sent_at and the device's receipt time can
// differ by a second or two, so timestamps aren't part of the key).
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
  mergeFromServer: (notifications: StoredNotification[]) => void
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
      mergeFromServer: (serverNotifs) =>
        set((state) => {
          const existingIds = new Set(state.items.map((n) => n.id))
          const existingSignatures = new Set(state.items.map(notificationSignature))
          const newItems = serverNotifs
            .filter((n) => !existingIds.has(n.id) && !existingSignatures.has(notificationSignature(n)))
            .map((n) => ({ ...n, read: false }))
          if (newItems.length === 0) return state
          const merged = [...newItems, ...state.items]
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            .slice(0, MAX_STORED)
          return { items: merged }
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
