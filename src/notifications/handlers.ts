import {
  getMessaging,
  getInitialNotification,
  onMessage,
  onNotificationOpenedApp,
  type RemoteMessage,
} from '@react-native-firebase/messaging'
import notifee, { EventType } from '@notifee/react-native'
import { router } from 'expo-router'
import { useEffect } from 'react'
import { AppState } from 'react-native'
import { storeNotification, useNotificationsStore } from './store'
import { useAuthStore } from '../auth/store'
import { client } from '../api/client'
import { ensureDefaultChannel } from './channel'
import { contentNotificationId } from './id'

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

// Foreground only. Pushes carry a `notification` block (see backend
// send_fcm_push), which Android renders itself — but only while the app is
// backgrounded or killed. In the foreground it hands the message to
// onMessage instead and renders nothing, so this is what makes it visible.
async function displayNotification(data: Record<string, string> | undefined, id: string) {
  await ensureDefaultChannel()
  await notifee.displayNotification({
    id,
    title: data?.title,
    body: data?.body,
    android: {
      channelId: 'default',
      pressAction: { id: 'default' },
      sound: 'default',
      smallIcon: 'ic_notification',
    },
    data,
  })
}

export async function syncFromServer() {
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
  useEffect(() => {
    // App in foreground when the push arrives.
    const unsubOnMessage = onMessage(getMessaging(), async (remoteMessage: RemoteMessage) => {
      const data = remoteMessage.data as Record<string, string> | undefined
      const id = contentNotificationId(data)
      await displayNotification(data, id)
      storeNotification(id, data)
    })

    // Tap on a notifee-displayed notification — i.e. one that arrived while
    // the app was already in the foreground. System-rendered ones never
    // reach notifee, so they're handled by the two messaging listeners below.
    const unsubForegroundEvent = notifee.onForegroundEvent(({ type, detail }) => {
      if (type === EventType.PRESS && detail.notification) {
        const data = detail.notification.data as Record<string, string> | undefined
        storeNotification(detail.notification.id ?? '', data)
        handleNotificationTap(data)
      }
    })

    // Tap on a system-rendered notification that brought the app forward
    // from the background.
    const unsubOpenedApp = onNotificationOpenedApp(getMessaging(), (remoteMessage: RemoteMessage) => {
      const data = remoteMessage.data as Record<string, string> | undefined
      storeNotification(contentNotificationId(data), data)
      handleNotificationTap(data)
    })

    // Tap that cold-launched the app from a fully killed state.
    getInitialNotification(getMessaging()).then((remoteMessage) => {
      if (remoteMessage) {
        const data = remoteMessage.data as Record<string, string> | undefined
        storeNotification(contentNotificationId(data), data)
        handleNotificationTap(data)
      }
    })

    // Sync notification history from server on mount
    syncFromServer()

    // Re-sync when app comes back to foreground
    const appStateSub = AppState.addEventListener('change', (state) => {
      if (state === 'active') syncFromServer()
    })

    return () => {
      unsubOnMessage()
      unsubForegroundEvent()
      unsubOpenedApp()
      appStateSub.remove()
    }
  }, [])
}
