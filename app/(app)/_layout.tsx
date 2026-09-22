import { useEffect } from 'react'
import { Tabs } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { StatusBar, AppState, View } from 'react-native'
import { useNotificationHandlers } from '../../src/notifications/handlers'
import { registerForPushNotifications } from '../../src/notifications/register'
import { WardSwitcher, BackButton, AppBrand, NotificationBell } from '../../src/components/Header'

const SCREEN_TITLES: Record<string, string> = {
  attendance: 'Attendance',
  results: 'Results',
  more: 'More',
  payment: 'Fee Payment',
  mentor: 'Mentor Details',
  notifications: 'Notifications',
  profile: 'Student Profile',
  language: 'Language',
}

export default function AppLayout() {
  useNotificationHandlers()

  // Request notification permission on mount and every foreground resume
  useEffect(() => {
    registerForPushNotifications().catch(() => {})
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') registerForPushNotifications().catch(() => {})
    })
    return () => sub.remove()
  }, [])

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <Tabs
        backBehavior="history"
        screenOptions={({ route }) => {
          const isHome = route.name === 'index'
          const title = isHome ? '' : SCREEN_TITLES[route.name] ?? ''
          return {
            tabBarActiveTintColor: '#05245F',
            tabBarInactiveTintColor: '#8A98AD',
            tabBarLabelStyle: { fontSize: 11, fontWeight: '500' },
            tabBarStyle: { backgroundColor: '#fff', borderTopColor: '#DCE2EA', elevation: 0, shadowOpacity: 0 },
            headerTitle: title,
            headerTitleStyle: { fontSize: 17, fontWeight: '700', color: '#10213F' },
            headerLeft: () => (isHome ? <AppBrand /> : <BackButton />),
            headerRight: () => (
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <NotificationBell />
                <WardSwitcher compact />
              </View>
            ),
            headerRightContainerStyle: { flexShrink: 0 },
            headerStyle: { backgroundColor: '#fff', elevation: 0, shadowOpacity: 0 },
          }
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="attendance"
          options={{
            title: 'Attendance',
            tabBarIcon: ({ color, size }) => <Ionicons name="calendar-outline" size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="results"
          options={{
            title: 'Results',
            tabBarIcon: ({ color, size }) => <Ionicons name="school-outline" size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="more"
          options={{
            title: 'More',
            tabBarIcon: ({ color, size }) => <Ionicons name="ellipsis-horizontal-outline" size={size} color={color} />,
          }}
        />
        {/* Hidden tabs - accessible via navigation only */}
        <Tabs.Screen name="payment" options={{ href: null, headerShown: false }} />
        <Tabs.Screen name="mentor" options={{ href: null }} />
        <Tabs.Screen name="circulars" options={{ href: null, headerShown: false }} />
        <Tabs.Screen name="notifications" options={{ href: null }} />
        <Tabs.Screen name="profile" options={{ href: null }} />
        <Tabs.Screen name="language" options={{ href: null }} />
      </Tabs>
    </>
  )
}
