import { Stack } from 'expo-router'
import { WardSwitcher, BackButton } from '../../../src/components/Header'

export default function CircularsLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#fff' },
        headerShadowVisible: false,
        headerTitleStyle: { fontSize: 17, fontWeight: '700', color: '#10213F' },
        headerLeft: () => <BackButton />,
        headerRight: () => <WardSwitcher compact />,
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Circulars' }} />
      <Stack.Screen name="[id]" options={{ title: 'Circular' }} />
    </Stack>
  )
}
