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
}

const MAX_STORED = 100

interface NotificationsState {
  items: StoredNotification[]
  add: (notification: StoredNotification) => void
  mergeFromServer: (notifications: StoredNotification[]) => void
  clear: () => void
}

export const useNotificationsStore = create<NotificationsState>()(
  persist(
    (set) => ({
      items: [],
      add: (notification) =>
        set((state) => {
          if (state.items.some((n) => n.id === notification.id)) return state
          return { items: [notification, ...state.items].slice(0, MAX_STORED) }
        }),
      mergeFromServer: (serverNotifs) =>
        set((state) => {
          const existingIds = new Set(state.items.map((n) => n.id))
          const newItems = serverNotifs.filter((n) => !existingIds.has(n.id))
          if (newItems.length === 0) return state
          const merged = [...newItems, ...state.items]
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            .slice(0, MAX_STORED)
          return { items: merged }
        }),
      clear: () => set({ items: [] }),
    }),
    {
      name: 'notifications-storage',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
)
