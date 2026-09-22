import { ImageBackground, View, SafeAreaView, StyleSheet, ViewStyle, StyleProp } from 'react-native'

export function AppBackground({
  children,
  style,
  overlayOpacity = 0.85,
}: {
  children: React.ReactNode
  style?: StyleProp<ViewStyle>
  overlayOpacity?: number
}) {
  return (
    <ImageBackground
      source={require('../../assets/campus-bg.png')}
      style={[styles.background, style]}
      resizeMode="cover"
    >
      <View style={[styles.overlay, { backgroundColor: `rgba(255,255,255,${overlayOpacity})` }]} pointerEvents="none" />
      <SafeAreaView style={styles.safeArea}>
        {children}
      </SafeAreaView>
    </ImageBackground>
  )
}

const styles = StyleSheet.create({
  background: { flex: 1 },
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  safeArea: { flex: 1 },
})
