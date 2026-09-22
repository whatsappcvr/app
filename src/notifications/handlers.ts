import * as Notifications from 'expo-notifications'
import { type EventSubscription } from 'expo-modules-core'
import { router } from 'expo-router'
import { useEffect, useRef } from 'react'
import { AppState } from 'react-native'
import { useNotificationsStore } from './store'
import { useAuthStore } from '../auth/store'
import { client } from '../api/client'

// Configure foreground notification display
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
})

function storeNotification(notification: Notifications.Notification) {
  const { request } = notification
  const data = request.content.data as Record<string, string> | undefined
  useNotificationsStore.getState().add({
    id: request.identifier,
    title: request.content.title ?? '',
    body: request.content.body ?? '',
    type: data?.type ?? 'general',
    data,
    created_at: new Date(notification.date).toISOString(),
  })
}

function handleNotificationTap(data: Record<string, string> | undefined) {
  if (!useAuthStore.getState().isAuthenticated) {
    router.replace('/(auth)/login')
    return
  }

  if (!data?.type) {
    router.push('/(app)/notifications')
    return
  }

  switch (data.type) {
    case 'absence':
      router.push('/(app)/attendance')
      break
    case 'circular':
      if (data.circular_id) {
        router.push(`/(app)/circulars/${data.circular_id}`)
      } else {
        router.push('/(app)/circulars')
      }
      break
    default:
      router.push('/(app)/notifications')
  }
}

async function syncFromServer() {
  if (!useAuthStore.getState().isAuthenticated) return
  try {
    const { data } = await client.get<{ id: number; title: string; body: string; type: string; data?: Record<string, string>; created_at: string }[]>(
      '/notifications', { params: { limit: 50 } },
    )
    const mapped = data.map((n) => ({
      id: `server-${n.id}`,
      title: n.title,
      body: n.body,
      type: n.type,
      data: n.data ?? undefined,
      created_at: n.created_at,
    }))
    useNotificationsStore.getState().mergeFromServer(mapped)
  } catch {
    // silent — push-delivered notifications still work
  }
}

export function useNotificationHandlers() {
  const responseListener = useRef<EventSubscription | null>(null)
  const receivedListener = useRef<EventSubscription | null>(null)

  useEffect(() => {
    // Handle notification tap when app is in background/killed
    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) {
        storeNotification(response.notification)
        const data = response.notification.request.content.data as Record<string, string> | undefined
        handleNotificationTap(data)
      }
    })

    // Sync notification history from server on mount
    syncFromServer()

    // Re-sync when app comes back to foreground
    const appStateSub = AppState.addEventListener('change', (state) => {
      if (state === 'active') syncFromServer()
    })

    // Save every notification the device receives (foreground or background)
    // to the local store — the Notifications screen reads from there instead
    // of hitting the backend.
    receivedListener.current = Notifications.addNotificationReceivedListener((notification) => {
      storeNotification(notification)
    })

    // Handle notification tap when app is in foreground
    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      storeNotification(response.notification)
      const data = response.notification.request.content.data as Record<string, string> | undefined
      handleNotificationTap(data)
    })

    return () => {
      appStateSub.remove()
      if (responseListener.current) {
        responseListener.current.remove()
      }
      if (receivedListener.current) {
        receivedListener.current.remove()
      }
    }
  }, [])
}
