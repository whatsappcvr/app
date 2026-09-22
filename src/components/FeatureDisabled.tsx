import { View, Text, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

/** Shown in place of a section's data when an admin has turned that feature off. */
export function FeatureDisabled({ message = 'This section is currently unavailable.' }: { message?: string }) {
  return (
    <View style={styles.container}>
      <Ionicons name="eye-off-outline" size={22} color="#8A98AD" />
      <Text style={styles.text}>{message}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center', paddingVertical: 32, gap: 8 },
  text: { fontSize: 13, color: '#8A98AD', textAlign: 'center' },
})
