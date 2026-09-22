import { View, Text, StyleSheet, TouchableOpacity, Linking, Platform } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useNotificationPermission } from '../hooks/useNotificationPermission'

const RED = '#8A2000'
const RED_BG = '#FBE0D9'

export function NotificationStatusBanner() {
  const denied = useNotificationPermission()
  if (!denied) return null

  return (
    <View style={styles.banner}>
      <Ionicons name="notifications-off-outline" size={16} color={RED} />
      <Text style={styles.text}>Notifications are turned off</Text>
      <TouchableOpacity
        style={styles.button}
        onPress={() => {
          if (Platform.OS === 'ios') {
            Linking.openURL('app-settings:')
          } else {
            Linking.openSettings()
          }
        }}
      >
        <Text style={styles.buttonText}>Settings</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: RED_BG,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  text: { fontSize: 12, fontWeight: '600', color: RED, flexShrink: 1 },
  button: {
    backgroundColor: RED,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginLeft: 4,
  },
  buttonText: { fontSize: 11, fontWeight: '700', color: '#fff' },
})
