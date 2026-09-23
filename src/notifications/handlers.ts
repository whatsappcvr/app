import { getMessaging, onMessage, type RemoteMessage } from '@react-native-firebase/messaging'
import notifee, { EventType } from '@notifee/react-native'
import { router } from 'expo-router'
import { useEffect } from 'react'
import { useNotificationsStore } from './store'
import { useAuthStore } from '../auth/store'
import { ensureDefaultChannel } from './channel'
import { contentNotificationId } from './id'

export function storeNotification(id: string, data: Record<string, string> | undefined) {
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

// FCM messages here are data-only (see backend send_fcm_push) — nothing
// auto-displays them, so this is the single display path for every app
// state. The background/quit-state equivalent lives in index.js and calls
// this same notifee.displayNotification shape, so there's exactly one way
// a push ever becomes a visible notification.
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

export function useNotificationHandlers() {
  useEffect(() => {
    // App in foreground when the push arrives.
    const unsubOnMessage = onMessage(getMessaging(), async (remoteMessage: RemoteMessage) => {
      const data = remoteMessage.data as Record<string, string> | undefined
      const id = contentNotificationId(data)
      storeNotification(id, data)
      await displayNotification(data, id)
    })

    // Tap on a notification while the app is running (foreground, or was
    // background and this tap just brought it forward).
    const unsubForegroundEvent = notifee.onForegroundEvent(({ type, detail }) => {
      if (type === EventType.PRESS && detail.notification) {
        const data = detail.notification.data as Record<string, string> | undefined
        storeNotification(detail.notification.id ?? '', data)
        handleNotificationTap(data)
      }
    })

    // App was fully killed and got launched by a notification tap
    // (notifee-displayed notification, so notifee is the source of truth
    // for the tap event — not messaging's own getInitialNotification).
    notifee.getInitialNotification().then((initial) => {
      if (initial?.notification) {
        const data = initial.notification.data as Record<string, string> | undefined
        storeNotification(initial.notification.id ?? '', data)
        handleNotificationTap(data)
      }
    })

    return () => {
      unsubOnMessage()
      unsubForegroundEvent()
    }
  }, [])
}
