import { View, Text, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useIsOffline } from '../hooks/useNetworkStatus'

const AMBER = '#8A6D00'
const AMBER_BG = '#FBF0D9'

/**
 * Small banner shown at the top of a screen when the device is offline.
 * Self-contained - just drop it above a screen's content; it renders
 * nothing while online.
 */
export function NetworkStatusBanner({ hasCachedData = true }: { hasCachedData?: boolean }) {
  const isOffline = useIsOffline()
  if (!isOffline) return null

  return (
    <View style={styles.banner}>
      <Ionicons name="cloud-offline-outline" size={16} color={AMBER} />
      <Text style={styles.text}>
        {hasCachedData ? 'No internet connection — Showing last updated data' : 'No internet connection'}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: AMBER_BG,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  text: { fontSize: 12, fontWeight: '600', color: AMBER, flexShrink: 1, textAlign: 'center' },
})
