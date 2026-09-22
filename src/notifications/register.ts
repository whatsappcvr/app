import { getMessaging, getToken } from '@react-native-firebase/messaging'
import { Platform, PermissionsAndroid } from 'react-native'
import { client } from '../api/client'
import { ensureDefaultChannel } from './channel'

export async function registerForPushNotifications(): Promise<string | null> {
  // iOS push isn't implemented — it needs its own native APNs module
  // (Apple Developer credentials + a Mac build), tracked as a separate
  // follow-up. Nothing here runs on iOS until that lands.
  if (Platform.OS !== 'android') {
    return null
  }

  await ensureDefaultChannel()

  if (Platform.Version >= 33) {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
    )
    if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
      return null
    }
  }

  // Raw FCM registration token — delivered to and displayed by this app
  // directly (see handlers.ts / index.js), no relay service involved.
  let token: string
  try {
    token = await getToken(getMessaging())
  } catch (err) {
    console.warn('[push] failed to get FCM token', err)
    return null
  }

  try {
    await client.post('/device-tokens', {
      token,
      platform: Platform.OS,
    })
  } catch (err) {
    console.warn('[push] failed to register device token with backend', err)
    // will retry on next foreground
  }

  return token
}

/**
 * Deletes this device's push token from the backend so scheduled jobs
 * (absence alerts, circulars) stop targeting it. Must be called while the
 * user is still authenticated (before their JWT is cleared).
 */
export async function unregisterPushNotifications(): Promise<void> {
  try {
    await client.delete('/device-tokens', { params: { platform: Platform.OS } })
  } catch (err) {
    console.warn('[push] failed to unregister device token', err)
  }
}
