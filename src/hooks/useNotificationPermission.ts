import { useEffect, useState } from 'react'
import { AppState, PermissionsAndroid, Platform } from 'react-native'

// Android 13+ (API 33) is the only platform with a runtime notification
// permission to check here — older Android has no such prompt (notifications
// are on unless blocked from system settings, which this can't detect), and
// iOS push isn't implemented yet (see register.ts), so there's nothing to
// warn about there.
export function useNotificationPermission() {
  const [denied, setDenied] = useState(false)

  useEffect(() => {
    if (Platform.OS !== 'android' || Platform.Version < 33) return

    function check() {
      PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS).then(
        (granted) => setDenied(!granted),
      )
    }
    check()
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') check()
    })
    return () => sub.remove()
  }, [])

  return denied
}
