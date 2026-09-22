import { useEffect, useRef, useState } from 'react'
import { Slot, router } from 'expo-router'
import { QueryClient, QueryClientProvider, focusManager } from '@tanstack/react-query'
import * as SecureStore from 'expo-secure-store'
import * as SplashScreen from 'expo-splash-screen'
import { Alert, AppState, Linking, type AppStateStatus, Platform } from 'react-native'
import Constants from 'expo-constants'
import { useAuthStore } from '../src/auth/store'
import { enableMockApi } from '../src/api/mock'
import { client } from '../src/api/client'
import { useAppVersionCheck } from '../src/api/queries'

const USE_MOCKS = process.env.EXPO_PUBLIC_USE_MOCKS === 'true' || !process.env.EXPO_PUBLIC_API_URL
if (USE_MOCKS) {
  enableMockApi(client)
}

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 5 * 60 * 1000, retry: 2 } },
})

// react-query's refetch-on-focus only listens to the browser's window focus
// event by default, which never fires in React Native — without this, a
// screen's data only refreshes via staleTime or a manual pull-to-refresh,
// even after the app is backgrounded and reopened.
function onAppStateChange(status: AppStateStatus) {
  if (Platform.OS !== 'web') {
    focusManager.setFocused(status === 'active')
  }
}
AppState.addEventListener('change', onAppStateChange)

SplashScreen.preventAutoHideAsync().catch(() => {})

const APP_VERSION = Constants.expoConfig?.version ?? '1.0.0'

function compareVersions(a: string, b: string): number {
  const pa = a.split('.').map(Number)
  const pb = b.split('.').map(Number)
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const na = pa[i] ?? 0
    const nb = pb[i] ?? 0
    if (na !== nb) return na - nb
  }
  return 0
}

function UpdateGate() {
  const { data } = useAppVersionCheck()
  const prompted = useRef(false)

  useEffect(() => {
    if (!data || prompted.current) return
    prompted.current = true

    if (compareVersions(APP_VERSION, data.min_version) < 0) {
      Alert.alert(
        'Update Required',
        'A new version of CampuzSync is available. Please update to continue.',
        [{ text: 'Update', onPress: () => Linking.openURL(data.update_url) }],
        { cancelable: false },
      )
    } else if (compareVersions(APP_VERSION, data.latest_version) < 0) {
      Alert.alert(
        'Update Available',
        'A new version of CampuzSync is available.',
        [
          { text: 'Later', style: 'cancel' },
          { text: 'Update', onPress: () => Linking.openURL(data.update_url) },
        ],
      )
    }
  }, [data])

  return null
}

export default function RootLayout() {
  const [loading, setLoading] = useState(true)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  useEffect(() => {
    async function checkAuth() {
      const [parentToken, studentToken] = await Promise.all([
        SecureStore.getItemAsync('jwt_parent'),
        SecureStore.getItemAsync('jwt_student'),
      ])
      if (!parentToken && !studentToken) {
        useAuthStore.getState().logout()
      }
      setLoading(false)
    }
    checkAuth()
  }, [])

  useEffect(() => {
    if (loading) return
    if (isAuthenticated) router.replace('/(app)')
    else router.replace('/(auth)/login')
    SplashScreen.hideAsync().catch(() => {})
  }, [loading, isAuthenticated])

  return (
    <QueryClientProvider client={queryClient}>
      <UpdateGate />
      {!loading && <Slot />}
    </QueryClientProvider>
  )
}
