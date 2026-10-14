import React, { useEffect, useRef, useState } from 'react'
import {
  Animated, KeyboardAvoidingView, Modal, Platform, Pressable, Text as RNText, TouchableOpacity, View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Feather } from '@expo/vector-icons'
import { AuthField, AuthButton, EMAIL_RE, FONT, TEAL, useAuthColors } from './AuthUI'
import { useAuth } from '../hooks'

const MIN_PASSWORD = 8

/**
 * Two-step password reset in a bottom sheet: email a 6-digit code, then enter it
 * with a new password and sign in. `email` pre-fills the field; `lockEmail` stops
 * it being edited (Profile, where the user is already signed in).
 */
export function ResetPasswordSheet({ visible, onClose, onDone, email: initialEmail = '', lockEmail }: {
  visible: boolean
  onClose: () => void
  onDone:  () => void
  email?:  string
  lockEmail?: boolean
}) {
  const A = useAuthColors()
  const insets = useSafeAreaInsets()
  const { requestResetCode, resetPassword, loading } = useAuth()

  const [step,     setStep]     = useState<1 | 2>(1)
  const [email,    setEmail]    = useState(initialEmail)
  const [code,     setCode]     = useState('')
  const [password, setPassword] = useState('')
  const [tried,    setTried]    = useState(false)
  const [codeError, setCodeError] = useState<string | undefined>()
  const [resent,   setResent]   = useState(false)
  const slide = useRef(new Animated.Value(600)).current

  // Start fresh each time the sheet opens, and slide it up over the dimmed screen
  useEffect(() => {
    if (!visible) return
    setStep(1)
    setEmail(initialEmail)
    setCode('')
    setPassword('')
    setTried(false)
    setCodeError(undefined)
    setResent(false)
    slide.setValue(600)
    Animated.spring(slide, { toValue: 0, useNativeDriver: true, damping: 22, stiffness: 220 }).start()
  }, [visible, initialEmail, slide])

  const emailError = tried && step === 1 && !EMAIL_RE.test(email.trim()) ? 'Enter a valid email address' : undefined
  const codeFormatError = tried && step === 2 && !/^\d{6}$/.test(code) ? 'Enter the 6-digit code from the email' : undefined
  const pwError    = tried && step === 2 && password.length < MIN_PASSWORD ? `Use at least ${MIN_PASSWORD} characters` : undefined

  const sendCode = async () => {
    setTried(true)
    if (!EMAIL_RE.test(email.trim())) return
    if (await requestResetCode(email.trim())) {
      setStep(2)
      setTried(false)
    }
  }

  const resendCode = async () => {
    setCodeError(undefined)
    setCode('')
    if (await requestResetCode(email.trim())) setResent(true)
  }

  const submit = async () => {
    setTried(true)
    setCodeError(undefined)
    if (!/^\d{6}$/.test(code) || password.length < MIN_PASSWORD) return
    const error = await resetPassword(email.trim(), code, password)
    if (!error) onDone()
    else setCodeError(error)
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(17,24,39,0.45)' }} onPress={onClose}
          accessibilityLabel="Close" accessibilityRole="button"
        />
        <Animated.View style={{
          transform: [{ translateY: slide }],
          backgroundColor: A.bg,
          borderTopLeftRadius: 28, borderTopRightRadius: 28,
          borderTopWidth: 1, borderColor: A.border,
          paddingHorizontal: 24, paddingTop: 10, paddingBottom: Math.max(insets.bottom, 16) + 8,
        }}>
          {/* Drag handle */}
          <View style={{ alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: A.border, marginBottom: 20 }} />

          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 22 }}>
            <View style={{ flex: 1 }}>
              <RNText style={{ fontFamily: FONT.semibold, fontSize: 11, letterSpacing: 1, color: A.faint, marginBottom: 6 }}>
                STEP {step} OF 2
              </RNText>
              <RNText style={{ fontFamily: FONT.heading, fontSize: 22, letterSpacing: -0.5, color: A.text }}>
                {lockEmail ? 'Change password' : 'Reset password'}
              </RNText>
              <RNText style={{ fontFamily: FONT.body, fontSize: 14, color: A.muted, marginTop: 4 }}>
                {step === 1
                  ? 'We\'ll email you a 6-digit code'
                  : `Enter the code we sent to ${email.trim()}`}
              </RNText>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={8}
              accessibilityRole="button" accessibilityLabel="Close"
              style={{ width: 36, height: 36, borderRadius: 18, borderWidth: 1, borderColor: A.border, alignItems: 'center', justifyContent: 'center' }}
            >
              <Feather name="x" size={18} color={A.muted} />
            </TouchableOpacity>
          </View>

          <View style={{ gap: 18, marginBottom: 24 }}>
            {step === 1 ? (
            <AuthField
              label="Email address"
              placeholder="you@example.com"
              value={email}
              onChangeText={setEmail}
              editable={!lockEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="send"
              onSubmitEditing={sendCode}
              error={emailError}
              style={lockEmail ? { opacity: 0.6 } : undefined}
            />
            ) : (
            <>
            <AuthField
              label="6-digit code"
              placeholder="123456"
              value={code}
              onChangeText={(t) => { setCode(t.replace(/\D/g, '')); setCodeError(undefined) }}
              keyboardType="number-pad"
              maxLength={6}
              textContentType="oneTimeCode"
              autoComplete="one-time-code"
              autoFocus
              error={codeError ?? codeFormatError}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 8 }}>
                <TouchableOpacity onPress={resendCode} disabled={loading} hitSlop={8}
                  accessibilityRole="button" accessibilityLabel="Resend code"
                >
                  <RNText style={{ fontFamily: FONT.semibold, fontSize: 13, color: TEAL }}>
                    {resent ? 'Code sent — resend again' : 'Resend code'}
                  </RNText>
                </TouchableOpacity>
              </View>
            </AuthField>
            <AuthField
              label="New password"
              placeholder={`At least ${MIN_PASSWORD} characters`}
              value={password}
              onChangeText={setPassword}
              password
              textContentType="newPassword"
              returnKeyType="go"
              onSubmitEditing={submit}
              error={pwError}
            />
            </>
            )}
          </View>

          {step === 1
            ? <AuthButton label="Send reset code →" loading={loading} onPress={sendCode} />
            : <AuthButton label={lockEmail ? 'Save new password' : 'Reset & sign in →'} loading={loading} onPress={submit} />}
          {step === 2 && !lockEmail && (
            <RNText style={{ fontFamily: FONT.body, fontSize: 13, color: A.faint, textAlign: 'center', marginTop: 12 }}>
              You'll be signed in straight away.
            </RNText>
          )}
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  )
}
