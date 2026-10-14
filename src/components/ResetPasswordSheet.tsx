import React, { useEffect, useRef, useState } from 'react'
import {
  Animated, KeyboardAvoidingView, Modal, Platform, Pressable, Text as RNText, TouchableOpacity, View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Feather } from '@expo/vector-icons'
import { AuthField, AuthButton, EMAIL_RE, FONT, useAuthColors } from './AuthUI'
import { useAuth } from '../hooks'

const MIN_PASSWORD = 8

/**
 * Bottom sheet that sets a new password from the email alone and signs the
 * user in. `email` pre-fills the field; `lockEmail` stops it being edited
 * (Profile, where the user is already signed in).
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
  const { resetPassword, loading } = useAuth()

  const [email,    setEmail]    = useState(initialEmail)
  const [password, setPassword] = useState('')
  const [tried,    setTried]    = useState(false)
  const slide = useRef(new Animated.Value(600)).current

  // Start fresh each time the sheet opens, and slide it up over the dimmed screen
  useEffect(() => {
    if (!visible) return
    setEmail(initialEmail)
    setPassword('')
    setTried(false)
    slide.setValue(600)
    Animated.spring(slide, { toValue: 0, useNativeDriver: true, damping: 22, stiffness: 220 }).start()
  }, [visible, initialEmail, slide])

  const emailError = tried && !EMAIL_RE.test(email.trim()) ? 'Enter a valid email address' : undefined
  const pwError    = tried && password.length < MIN_PASSWORD ? `Use at least ${MIN_PASSWORD} characters` : undefined

  const submit = async () => {
    setTried(true)
    if (!EMAIL_RE.test(email.trim()) || password.length < MIN_PASSWORD) return
    if (await resetPassword(email.trim(), password)) onDone()
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
              <RNText style={{ fontFamily: FONT.heading, fontSize: 22, letterSpacing: -0.5, color: A.text }}>
                {lockEmail ? 'Change password' : 'Reset password'}
              </RNText>
              <RNText style={{ fontFamily: FONT.body, fontSize: 14, color: A.muted, marginTop: 4 }}>
                {lockEmail ? 'Choose a new password' : 'Enter your email and choose a new password'}
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
            <AuthField
              label="Email address"
              placeholder="you@example.com"
              value={email}
              onChangeText={setEmail}
              editable={!lockEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
              error={emailError}
              style={lockEmail ? { opacity: 0.6 } : undefined}
            />
            <AuthField
              label="New password"
              placeholder={`At least ${MIN_PASSWORD} characters`}
              value={password}
              onChangeText={setPassword}
              password
              autoFocus={lockEmail}
              textContentType="newPassword"
              returnKeyType="go"
              onSubmitEditing={submit}
              error={pwError}
            />
          </View>

          <AuthButton label={lockEmail ? 'Save new password' : 'Reset & sign in →'} loading={loading} onPress={submit} />
          {!lockEmail && (
            <RNText style={{ fontFamily: FONT.body, fontSize: 13, color: A.faint, textAlign: 'center', marginTop: 12 }}>
              You'll be signed in straight away.
            </RNText>
          )}
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  )
}
