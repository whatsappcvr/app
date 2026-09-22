import { View, Text, ActivityIndicator, StyleSheet } from 'react-native'

const GREEN_ACCENT = '#073B8F'

/** Small centered spinner + label - the app-wide default loading state. */
export function LoadingView({ label = 'Loading data...', color = GREEN_ACCENT }: { label?: string; color?: string }) {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="small" color={color} />
      <Text style={styles.label}>{label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 40 },
  label: { marginTop: 10, fontSize: 13, color: '#000' },
})
