import { useEffect, useState } from 'react'
import { AppState } from 'react-native'
import * as Notifications from 'expo-notifications'

export function useNotificationPermission() {
  const [denied, setDenied] = useState(false)

  useEffect(() => {
    function check() {
      Notifications.getPermissionsAsync().then(({ status }) => {
        setDenied(status === 'denied')
      })
    }
    check()
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') check()
    })
    return () => sub.remove()
  }, [])

  return denied
}
