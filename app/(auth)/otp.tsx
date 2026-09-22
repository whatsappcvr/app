import { useEffect, useRef, useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform, StatusBar } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import * as SecureStore from 'expo-secure-store'
import { Ionicons } from '@expo/vector-icons'
import { AppBackground } from '../../src/components/AppBackground'
import { client } from '../../src/api/client'
import { useAuthStore } from '../../src/auth/store'
import { registerForPushNotifications } from '../../src/notifications/register'
import type { OtpVerifyResponse } from '../../src/types'

const RESEND_SECONDS = 90

export default function OtpScreen() {
  const { identifier, identifierType, accountType, channel } = useLocalSearchParams<{
    identifier: string
    identifierType: 'mobile' | 'roll_number'
    accountType: 'parent' | 'student'
    channel?: 'outlook' | 'sms'
  }>()
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [errorText, setErrorText] = useState('')
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS)
  const timerRef = useRef<ReturnType<typeof setInterval>>()

  useEffect(() => {
    startTimer()
    return () => clearInterval(timerRef.current)
  }, [])

  function startTimer() {
    clearInterval(timerRef.current)
    setSecondsLeft(RESEND_SECONDS)
    timerRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  async function handleResend() {
    if (!channel) return
    setResending(true)
    setErrorText('')
    try {
      await client.post('/auth/otp/request', {
        identifier,
        identifier_type: identifierType,
        account_type: accountType,
        channel,
      })
      setOtp('')
      startTimer()
    } catch (error: any) {
      if (error.response?.status === 429) {
        Alert.alert('Limit Reached', error.response?.data?.detail || 'Daily OTP limit reached. Please try again after 24 hours or contact ERP admin.')
      } else {
        Alert.alert('Error', 'Could not resend OTP. Please try again.')
      }
    } finally {
      setResending(false)
    }
  }

  async function handleVerify() {
    if (otp.length !== 6) {
      setErrorText('Please enter the 6-digit OTP.')
      return
    }

    const type: 'parent' | 'student' = accountType === 'student' ? 'student' : 'parent'
    const existingSession = useAuthStore.getState().hasSession(type)

    async function doLogin() {
      setLoading(true)
      setErrorText('')
      try {
        const { data } = await client.post<OtpVerifyResponse>('/auth/otp/verify', {
          mobile: identifier,
          identifier,
          identifier_type: identifierType,
          account_type: accountType,
          otp,
        })

        const jwtKey = type === 'student' ? 'jwt_student' : 'jwt_parent'
        await SecureStore.setItemAsync(jwtKey, data.token)
        useAuthStore.getState().setSession(type, data.wards)

        registerForPushNotifications().catch(() => {})

        router.replace('/(app)')
      } catch (error: any) {
        if (error.response?.status === 401) {
          setOtp('')
          setErrorText('Incorrect OTP. Please re-enter.')
        } else if (error.response?.status === 404) {
          Alert.alert(
            'Not Registered',
            accountType === 'student'
              ? "This roll number / mobile number isn't registered. Please contact the college office."
              : "This roll number / mobile number isn't registered as a parent contact. Please contact the college office.",
          )
        } else {
          Alert.alert('Error', 'Something went wrong. Please try again.')
        }
      } finally {
        setLoading(false)
      }
    }

    if (existingSession) {
      Alert.alert(
        'Replace existing login?',
        `A ${type} is already logged in. Continuing will replace that session.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Continue', onPress: doLogin },
        ],
      )
    } else {
      doLogin()
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

        <View style={styles.iconContainer}>
          <View style={styles.iconCircle}>
            <Ionicons name="shield-checkmark-outline" size={32} color="#fff" />
          </View>
        </View>

        <Text style={styles.title}>Verify OTP</Text>
        <Text style={styles.subtitle}>
          Enter the 6-digit OTP for{'\n'}
          {identifierType === 'mobile' ? `+91 ${identifier}` : identifier}
        </Text>

        <TextInput
          style={[styles.otpInput, !!errorText && styles.otpInputError]}
          placeholder="000000"
          placeholderTextColor="#ccc"
          keyboardType="number-pad"
          maxLength={6}
          value={otp}
          onChangeText={(value) => {
            const digitsOnly = value.replace(/[^0-9]/g, '').slice(0, 6)
            setOtp(digitsOnly)
            if (errorText) setErrorText('')
          }}
          textAlign="center"
          editable={!loading}
          autoFocus
        />

        {!!errorText && <Text style={styles.errorText}>{errorText}</Text>}

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleVerify}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Verifying...' : 'Verify'}
          </Text>
        </TouchableOpacity>

        {!!channel && (
          secondsLeft > 0 ? (
            <Text style={styles.resendText}>
              Resend OTP in {Math.floor(secondsLeft / 60)}:{String(secondsLeft % 60).padStart(2, '0')}
            </Text>
          ) : (
            <TouchableOpacity onPress={handleResend} disabled={resending} style={styles.resendButton}>
              <Text style={styles.resendButtonText}>
                {resending ? 'Resending...' : 'Resend OTP'}
              </Text>
            </TouchableOpacity>
          )
        )}

        <TouchableOpacity style={styles.backButton} onPress={() => router.back()} disabled={loading}>
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
  topBackLink: { position: 'absolute', top: 8, left: 4, flexDirection: 'row', alignItems: 'center', padding: 8 },
  topBackText: { color: '#073B8F', fontSize: 15, fontWeight: '500' },
  iconContainer: { alignItems: 'center', marginBottom: 24 },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#073B8F',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: { fontSize: 28, fontWeight: '700', color: '#05245F', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 15, color: '#000', textAlign: 'center', marginBottom: 32 },
  otpInput: {
    fontSize: 32,
    letterSpacing: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 24,
    backgroundColor: '#f5f5f5',
    color: '#1a1a1a',
  },
  otpInputError: { borderColor: '#D32F2F' },
  errorText: { color: '#D32F2F', fontSize: 14, textAlign: 'center', marginTop: -16, marginBottom: 16 },
  button: { backgroundColor: '#05245F', borderRadius: 12, paddingVertical: 16, alignItems: 'center' },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  resendText: { color: '#666', fontSize: 14, textAlign: 'center', marginTop: 16 },
  resendButton: { marginTop: 16, alignItems: 'center' },
  resendButtonText: { color: '#073B8F', fontSize: 15, fontWeight: '600' },
  backButton: { paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  backButtonText: { color: '#073B8F', fontSize: 15, fontWeight: '600' },
})
