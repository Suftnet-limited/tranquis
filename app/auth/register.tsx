import React, { useState } from 'react'
import { Platform, KeyboardAvoidingView } from 'react-native'
import { router } from 'expo-router'
import { StyledPage, StyledScrollView, Stack, StyledCard, StyledPressable, StyledForm } from 'fluent-styles'
import { Text } from '../../src/components/Text'
import { AuthBackground, BrandMark, GradientButton, OrDivider, EyeToggle, EMAIL_RE } from '../../src/components/AuthUI'
import { useColors, useIsDark, getFieldColors } from '../../src/constants'
import { useAuth } from '../../src/hooks'
import { UserIcon, MailIcon, LockIcon } from '../../src/icons'

// Matches the backend's rule (auth/register rejects shorter passwords)
const MIN_PASSWORD = 8

export default function RegisterScreen() {
  const C      = useColors()
  const isDark = useIsDark()
  const { register, loading } = useAuth()

  const [name,     setName]     = useState('')
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [showPw,   setShowPw]   = useState(false)
  const [tried,    setTried]    = useState(false)

  const FC = getFieldColors(C)
  const nameError  = tried && !name.trim() ? 'Enter your name' : undefined
  const emailError = tried && !EMAIL_RE.test(email.trim()) ? 'Enter a valid email address' : undefined
  const pwError    = tried && password.length < MIN_PASSWORD ? `Use at least ${MIN_PASSWORD} characters` : undefined

  const submit = () => {
    setTried(true)
    if (!name.trim() || !EMAIL_RE.test(email.trim()) || password.length < MIN_PASSWORD) return
    register(email.trim(), password, name.trim())
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
          <Stack marginBottom={32}>
            <BrandMark title="Create account" subtitle="Start translating in seconds" />
          </Stack>

          <StyledCard backgroundColor={C.bgCard} borderRadius={22} padding={20} marginBottom={18}
            borderWidth={1} borderColor={C.border}
            style={{ shadowColor: C.primary, shadowOpacity: 0.08, shadowRadius: 18, shadowOffset: { width: 0, height: 8 }, elevation: 4 }}
          >
            <Stack gap={16}>
              <StyledForm.Input
                label="Full name"
                placeholder="Your name"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                returnKeyType="next"
                errorMessage={nameError}
                leftIcon={<UserIcon size={18} strokeWidth={1.8} color={C.textSecondary} />}
                focusColor={C.primary}
                colors={FC}
              />
              <StyledForm.Input
                label="Email address"
                placeholder="you@example.com"
                value={email}
                onChangeText={setEmail}
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
                label="Password"
                placeholder={`At least ${MIN_PASSWORD} characters`}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPw}
                returnKeyType="go"
                onSubmitEditing={submit}
                errorMessage={pwError}
                leftIcon={<LockIcon size={18} strokeWidth={1.8} color={C.textSecondary} />}
                rightIcon={<EyeToggle shown={showPw} onPress={() => setShowPw((v) => !v)} />}
                focusColor={C.primary}
                colors={FC}
              />
            </Stack>
          </StyledCard>

          <GradientButton label="Create account" loading={loading} onPress={submit} />

          <Text variant="caption" color={C.textMuted} textAlign="center" style={{ marginTop: 14, lineHeight: 18 }}>
            By signing up you agree to our{' '}
            <Text variant="caption" color={C.primary} fontWeight="600" onPress={() => router.push('/privacy' as any)}>
              Privacy Policy
            </Text>
          </Text>

          <OrDivider />

          <Stack horizontal alignItems="center" justifyContent="center" gap={5}>
            <Text variant="bodySmall" color={C.textSecondary}>Already have an account?</Text>
            <StyledPressable onPress={() => router.replace('/auth/login' as any)}
              accessibilityRole="button" accessibilityLabel="Sign in"
            >
              <Text variant="bodySmall" color={C.primary} fontWeight="700">Sign in</Text>
            </StyledPressable>
          </Stack>
        </StyledScrollView>
      </KeyboardAvoidingView>
    </StyledPage>
  )
}
