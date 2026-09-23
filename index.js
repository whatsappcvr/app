// Registers the FCM background/quit-state message handler before the app's
// React tree exists at all — a push can arrive and need displaying while
// the app is fully killed, well before any component mounts, so this can't
// live inside handlers.ts's useEffect. Must run before `expo-router/entry`.
import { getMessaging, setBackgroundMessageHandler } from '@react-native-firebase/messaging'
import notifee from '@notifee/react-native'
import { ensureDefaultChannel } from './src/notifications/channel'
import { contentNotificationId } from './src/notifications/id'

setBackgroundMessageHandler(getMessaging(), async (remoteMessage) => {
  const data = remoteMessage.data ?? {}
  await ensureDefaultChannel()
  await notifee.displayNotification({
    id: contentNotificationId(data),
    title: data.title,
    body: data.body,
    android: {
      channelId: 'default',
      pressAction: { id: 'default' },
      sound: 'default',
      smallIcon: 'ic_notification',
    },
    data,
  })
})

require('expo-router/entry')
