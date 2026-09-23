// Registers the FCM background/quit-state message handler before the app's
// React tree exists at all, so it can't live inside handlers.ts's useEffect.
// Must run before `expo-router/entry`.
//
// Deliberately does NOT display anything: pushes carry a `notification`
// block (see backend send_fcm_push), so Android has already rendered the
// banner from the system process by the time this runs — displaying again
// here would show two banners for one push. This only mirrors the push
// into local storage for the in-app feed, and even that is best-effort:
// MIUI and friends often kill the process before this handler completes,
// which is why handlers.ts's syncFromServer backfills the feed instead of
// relying on this path.
import { getMessaging, setBackgroundMessageHandler } from '@react-native-firebase/messaging'
import { contentNotificationId } from './src/notifications/id'
import { storeNotification } from './src/notifications/store'

setBackgroundMessageHandler(getMessaging(), async (remoteMessage) => {
  const data = remoteMessage.data ?? {}
  storeNotification(contentNotificationId(data), data)
})

require('expo-router/entry')
