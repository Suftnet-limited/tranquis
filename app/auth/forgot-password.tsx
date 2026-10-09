import React, { useState } from 'react'
import { Platform, KeyboardAvoidingView, TextInput, StyleSheet } from 'react-native'
import { router } from 'expo-router'
import { Feather } from '@expo/vector-icons'
import { StyledPage, StyledScrollView, Stack, StyledPressable } from 'fluent-styles'
import { Text } from '../../src/components/Text'
import { AuthBackground, GradientButton } from '../../src/components/AuthUI'
import { useColors, useIsDark } from '../../src/constants'
import { authService } from '../../src/services/api'

export default function ForgotPasswordScreen() {
  const C      = useColors()
  const isDark = useIsDark()

  const [email,   setEmail]   = useState('')
  const [loading, setLoading] = useState(false)
  const [sent,    setSent]    = useState(false)
  const [error,   setError]   = useState('')

  const handleSend = async () => {
    const trimmed = email.trim().toLowerCase()
    if (!trimmed || !trimmed.includes('@')) {
      setError('Please enter a valid email address')
      return
    }
    setError('')
    setLoading(true)
    try {
      await authService.forgotPassword(trimmed)
      setSent(true)
    } catch {
      // Still show success to avoid account enumeration
      setSent(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <StyledPage flex={1} backgroundColor={C.bg} showStatusBar
      statusBarStyle={isDark ? 'light-content' : 'dark-content'}
      statusBarBackgroundColor={Platform.OS === 'android' ? C.bg : undefined}
    >
      <AuthBackground />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <StyledScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Stack marginBottom={12} horizontal alignItems="center">
            <StyledPressable onPress={() => router.back()} hitSlop={10}>
              <Feather name="x" size={22} color={C.textPrimary} />
            </StyledPressable>
          </Stack>

          <Stack
            alignItems="center" justifyContent="center" gap={20}
            backgroundColor={C.bgCard} borderRadius={22} padding={28}
            style={{ borderWidth: 1, borderColor: C.border }}
          >
            <Stack
              width={64} height={64} borderRadius={32}
              alignItems="center" justifyContent="center"
              backgroundColor={C.primaryBg}
              style={{ borderWidth: 1, borderColor: `${C.primary}30` }}
            >
              <Feather name="lock" size={28} color={C.primary} />
            </Stack>

            {!sent ? (
              <>
                <Text variant="header" color={C.textPrimary} fontWeight="800" textAlign="center">
                  Reset password
                </Text>
                <Text variant="body" color={C.textSecondary} textAlign="center" style={{ lineHeight: 24 }}>
                  Enter the email address you registered with and we'll send you a reset link.
                </Text>

                <TextInput
                  style={[styles.input, {
                    color: C.textPrimary,
                    backgroundColor: C.bg,
                    borderColor: error ? '#EF4444' : C.border,
                  }]}
                  placeholder="your@email.com"
                  placeholderTextColor={C.textMuted}
                  value={email}
                  onChangeText={t => { setEmail(t); setError('') }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="send"
                  onSubmitEditing={handleSend}
                />

                {!!error && (
                  <Text variant="bodySmall" color="#EF4444" textAlign="center">{error}</Text>
                )}

                <GradientButton
                  label={loading ? 'Sending…' : 'Send reset link'}
                  onPress={handleSend}
                  disabled={loading}
                />
              </>
            ) : (
              <>
                <Stack
                  width={56} height={56} borderRadius={28}
                  alignItems="center" justifyContent="center"
                  backgroundColor="#D1FAE5"
                >
                  <Feather name="check" size={26} color="#059669" />
                </Stack>
                <Text variant="header" color={C.textPrimary} fontWeight="800" textAlign="center">
                  Check your email
                </Text>
                <Text variant="body" color={C.textSecondary} textAlign="center" style={{ lineHeight: 24 }}>
                  If an account exists for {email.trim()}, you'll receive a reset link within a few minutes.
                </Text>
                <Text variant="bodySmall" color={C.textMuted} textAlign="center">
                  Didn't receive it? Check your spam folder.
                </Text>
              </>
            )}

            <StyledPressable onPress={() => router.back()} hitSlop={8}>
              <Text variant="bodySmall" color={C.textMuted} fontWeight="600">Back to sign in</Text>
            </StyledPressable>
          </Stack>

        </StyledScrollView>
      </KeyboardAvoidingView>
    </StyledPage>
  )
}

const styles = StyleSheet.create({
  input: {
    width: '100%',
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 16,
    fontFamily: 'PlusJakartaSans_400Regular',
  },
})
