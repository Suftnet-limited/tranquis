import React, { useEffect, useState } from 'react'
import { KeyboardAvoidingView, Platform } from 'react-native'
import { Popup, Stack, StyledForm } from 'fluent-styles'
import { Text } from './Text'
import { GradientButton, EyeToggle, EMAIL_RE } from './AuthUI'
import { useColors, getFieldColors, getPopupColors } from '../constants'
import { useAuth } from '../hooks'
import { MailIcon, LockIcon } from '../icons'

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
  const C = useColors()
  const FC = getFieldColors(C)
  const { resetPassword, loading } = useAuth()

  const [email,    setEmail]    = useState(initialEmail)
  const [password, setPassword] = useState('')
  const [showPw,   setShowPw]   = useState(false)
  const [tried,    setTried]    = useState(false)

  // Start fresh each time the sheet opens
  useEffect(() => {
    if (!visible) return
    setEmail(initialEmail)
    setPassword('')
    setShowPw(false)
    setTried(false)
  }, [visible, initialEmail])

  const emailError = tried && !EMAIL_RE.test(email.trim()) ? 'Enter a valid email address' : undefined
  const pwError    = tried && password.length < MIN_PASSWORD ? `Use at least ${MIN_PASSWORD} characters` : undefined

  const submit = async () => {
    setTried(true)
    if (!EMAIL_RE.test(email.trim()) || password.length < MIN_PASSWORD) return
    if (await resetPassword(email.trim(), password)) onDone()
  }

  return (
    <Popup
      visible={visible}
      onClose={onClose}
      title="Reset password"
      subtitle="Enter your email and choose a new password"
      showClose
      safeAreaBottom
      destroyOnClose
      colors={getPopupColors(C)}
    >
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Stack padding={20} paddingTop={14} gap={16}>
          <StyledForm.Input
            label="Email address"
            placeholder="you@example.com"
            value={email}
            onChangeText={setEmail}
            editable={!lockEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="next"
            errorMessage={emailError}
            leftIcon={<MailIcon size={18} strokeWidth={1.8} color={C.textSecondary} />}
            focusColor={C.primary}
            colors={FC}
          />
          <StyledForm.Input
            label="New password"
            placeholder={`At least ${MIN_PASSWORD} characters`}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPw}
            autoFocus={lockEmail}
            textContentType="newPassword"
            returnKeyType="go"
            onSubmitEditing={submit}
            errorMessage={pwError}
            leftIcon={<LockIcon size={18} strokeWidth={1.8} color={C.textSecondary} />}
            rightIcon={<EyeToggle shown={showPw} onPress={() => setShowPw((v) => !v)} />}
            focusColor={C.primary}
            colors={FC}
          />
          <Stack marginTop={4}>
            <GradientButton label={lockEmail ? 'Save new password' : 'Reset & sign in'} loading={loading} onPress={submit} />
          </Stack>
          {!lockEmail && (
            <Text variant="caption" color={C.textMuted} textAlign="center">
              You'll be signed in straight away.
            </Text>
          )}
        </Stack>
      </KeyboardAvoidingView>
    </Popup>
  )
}
