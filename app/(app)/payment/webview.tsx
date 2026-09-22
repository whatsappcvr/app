import { View, StyleSheet, ActivityIndicator, Text, TouchableOpacity } from 'react-native'
import { WebView } from 'react-native-webview'
import { usePaymentLink } from '../../../src/api/queries'

const GREEN_ACCENT = '#073B8F'

export default function PaymentWebViewScreen() {
  const { data: link, isLoading, isError, refetch } = usePaymentLink()

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={GREEN_ACCENT} />
      </View>
    )
  }

  if (isError || !link?.url) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Couldn't load the payment link.</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => refetch()} activeOpacity={0.8}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View style={styles.flex}>
      <WebView
        source={{ uri: link.url }}
        startInLoadingState
        renderLoading={() => (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={GREEN_ACCENT} />
          </View>
        )}
        // Keep every navigation (redirects, links, form posts) inside this
        // WebView. Anything that isn't a plain http(s) request would
        // otherwise be handed off to the OS, which opens an external
        // browser or app chooser.
        onShouldStartLoadWithRequest={(request) => /^https?:\/\//i.test(request.url)}
        // Without this, target="_blank" / window.open() links spawn a new
        // native window on Android, which escapes this screen.
        setSupportMultipleWindows={false}
        javaScriptCanOpenWindowsAutomatically
      />
    </View>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  errorText: { fontSize: 15, color: '#333', textAlign: 'center', marginBottom: 16 },
  retryButton: { backgroundColor: GREEN_ACCENT, borderRadius: 10, paddingVertical: 10, paddingHorizontal: 20 },
  retryButtonText: { color: '#fff', fontWeight: '700' },
  loadingOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff',
  },
})
