import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

const GREEN_ACCENT = '#073B8F'

/** Clean empty/offline state with a Retry button - shown when a fetch fails and there's no cached data to fall back to. */
export function RetryView({
  message = "Couldn't load data. Check your connection and try again.",
  onRetry,
}: {
  message?: string
  onRetry: () => void
}) {
  return (
    <View style={styles.container}>
      <Ionicons name="cloud-offline-outline" size={40} color="#B9C2D0" />
      <Text style={styles.message}>{message}</Text>
      <TouchableOpacity style={styles.button} onPress={onRetry} activeOpacity={0.8}>
        <Ionicons name="refresh" size={16} color="#fff" />
        <Text style={styles.buttonText}>Retry</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 40, paddingHorizontal: 24 },
  message: { fontSize: 13, color: '#000', textAlign: 'center', marginTop: 10, marginBottom: 16 },
  button: {
    flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: GREEN_ACCENT,
    paddingHorizontal: 18, paddingVertical: 10, borderRadius: 10,
  },
  buttonText: { color: '#fff', fontSize: 13, fontWeight: '700' },
})
