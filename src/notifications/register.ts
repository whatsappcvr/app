import * as Notifications from 'expo-notifications'
import Constants from 'expo-constants'
import { Platform } from 'react-native'
import { client } from '../api/client'

export async function registerForPushNotifications(): Promise<string | null> {
  // Set up Android notification channel first (required before requesting permission on Android 13+)
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
    })
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync()
  let finalStatus = existingStatus

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync({
      android: {
        allowAlert: true,
        allowBadge: true,
        allowSound: true,
      },
    })
    finalStatus = status
  }

  if (finalStatus !== 'granted') {
    return null
  }

  // Get Expo push token
  const projectId = Constants.expoConfig?.extra?.eas?.projectId
  let token: string
  try {
    const tokenData = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined,
    )
    token = tokenData.data
  } catch (err) {
    console.warn('[push] failed to get Expo push token', err)
    return null
  }

  // Register with backend
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
