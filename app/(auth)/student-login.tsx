import { useState, useRef } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform, StatusBar } from 'react-native'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { parseIdentifier } from '../../src/auth/identifier'
import { client } from '../../src/api/client'
import { AppBackground } from '../../src/components/AppBackground'

export default function StudentLoginScreen() {
  const [identifier, setIdentifier] = useState('')
  const [sending, setSending] = useState(false)
  const tapCount = useRef(0)
  const tapTimer = useRef<ReturnType<typeof setTimeout>>()

  function handleTitleTap() {
    tapCount.current += 1
    clearTimeout(tapTimer.current)
    if (tapCount.current >= 3) {
      tapCount.current = 0
      handleContinue('admin')
    } else {
      tapTimer.current = setTimeout(() => { tapCount.current = 0 }, 600)
    }
  }

  async function handleContinue(channel: 'outlook' | 'admin') {
    const parsed = parseIdentifier(identifier)
    if (!parsed) {
      Alert.alert(
        'Invalid Details',
        'Please enter your registered roll number or your registered 10-digit mobile number.',
      )
      return
    }

    if (channel === 'admin') {
      router.push({
        pathname: '/(auth)/otp',
        params: { identifier: parsed.value, identifierType: parsed.type, accountType: 'student' },
      })
      return
    }

    setSending(true)
    try {
      await client.post('/auth/otp/request', {
        identifier: parsed.value,
        identifier_type: parsed.type,
        account_type: 'student',
        channel,
      })
      router.push({
        pathname: '/(auth)/otp',
        params: { identifier: parsed.value, identifierType: parsed.type, accountType: 'student', channel },
      })
    } catch (error: any) {
      if (error.response?.status === 404) {
        Alert.alert('Not Registered', "This roll number / mobile number isn't registered. Please contact the college office.")
      } else {
        Alert.alert('Error', 'Could not send OTP. Please try again.')
      }
    } finally {
      setSending(false)
    }
  }

  return (
    <AppBackground style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={styles.content}>
        {/* <TouchableOpacity onPress={() => router.back()} style={styles.backLink}>
          <Ionicons name="chevron-back" size={22} color="#073B8F" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity> */}

        <View style={styles.headerContainer}>
          <Text style={styles.title} onPress={handleTitleTap}>Student Login</Text>
          <Text style={styles.subtitle}>Enter your registered roll number or mobile number</Text>
        </View>

        <TextInput
          style={styles.input}
          placeholder="Roll Number or Mobile Number"
          placeholderTextColor="#999"
          autoCapitalize="characters"
          value={identifier}
          onChangeText={setIdentifier}
        />

        <TouchableOpacity
          style={[styles.button, sending && styles.disabledButton]}
          onPress={() => handleContinue('outlook')}
          disabled={sending}
        >
          <Ionicons name="mail-outline" size={18} color="#fff" style={styles.buttonIcon} />
          <Text style={styles.buttonText}>{sending ? 'Sending OTP...' : 'OTP via Outlook'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.backButton} onPress={() => router.back()} disabled={sending}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
      </KeyboardAvoidingView>
    </AppBackground>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  content: { flex: 1, justifyContent: 'center', paddingHorizontal: 24 },
  backLink: { position: 'absolute', top: 48, left: 4, flexDirection: 'row', alignItems: 'center', padding: 8 },
  backText: { color: '#073B8F', fontSize: 15, fontWeight: '500' },
  headerContainer: { marginBottom: 28 },
  title: { fontSize: 24, fontWeight: '700', color: '#05245F', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#000', textAlign: 'center', paddingHorizontal: 12 },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    marginBottom: 20,
    backgroundColor: '#f5f5f5',
    color: '#1a1a1a',
  },
  button: {
    flexDirection: 'row',
    backgroundColor: '#073B8F',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  disabledButton: { opacity: 0.5 },
  buttonIcon: { marginRight: 8 },
  buttonText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  backButton: { paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  backButtonText: { color: '#073B8F', fontSize: 15, fontWeight: '600' },
})
