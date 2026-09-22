import { useEffect, useState } from 'react'
import NetInfo from '@react-native-community/netinfo'

/**
 * True when the device is offline (no connection, or connected but not
 * reachable to the internet). Defaults to `false` (assume online) until the
 * first NetInfo event arrives, to avoid flashing the offline banner on cold
 * start.
 */
export function useIsOffline(): boolean {
  const [isOffline, setIsOffline] = useState(false)

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      // isInternetReachable can be `null` while it's still being determined -
      // in that case fall back to isConnected only, so we don't show the
      // banner spuriously right after app start.
      const offline =
        state.isConnected === false || (state.isConnected === true && state.isInternetReachable === false)
      setIsOffline(offline)
    })
    return () => unsubscribe()
  }, [])

  return isOffline
}
