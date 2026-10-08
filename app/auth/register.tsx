import React, { useState } from 'react'
import { Platform, KeyboardAvoidingView } from 'react-native'
import { router } from 'expo-router'
import { Feather } from '@expo/vector-icons'
import {
  StyledPage, StyledScrollView, Stack, StyledCard, StyledPressable, StyledForm,
} from 'fluent-styles'
import { Text } from '../../src/components/Text'
import { AuthBackground, BrandMark, GradientButton, EyeToggle, EMAIL_RE } from '../../src/components/AuthUI'
import { useColors, useIsDark, getFieldColors } from '../../src/constants'
import { useAuth } from '../../src/hooks'

export default function RegisterScreen() {
  const C      = useColors()
  const isDark = useIsDark()
  const { register, loading } = useAuth()

  const [fullName, setFullName] = useState('')
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [showPw,   setShowPw]   = useState(false)
  const [tried,    setTried]    = useState(false)

  const FC = getFieldColors(C)

  const nameError = tried && !fullName.trim() ? 'Enter your name' : undefined
  const emailError = tried && !EMAIL_RE.test(email.trim()) ? 'Enter a valid email address' : undefined
  const pwError    = tried && password.length < 8 ? 'Password must be at least 8 characters' : undefined

  const submit = () => {
    setTried(true)
    if (!fullName.trim() || !EMAIL_RE.test(email.trim()) || password.length < 8) return
    register(email, password, fullName)
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
          <Stack marginBottom={10} horizontal alignItems="center">
            <StyledPressable onPress={() => router.back()} hitSlop={10}>
              <Feather name="arrow-left" size={22} color={C.textPrimary} />
            </StyledPressable>
          </Stack>

          <Stack marginBottom={32} alignItems="center">
            <BrandMark title="Create account" subtitle="Start translating for free" />
          </Stack>

          <StyledCard backgroundColor={C.bgCard} borderRadius={22} padding={20} marginBottom={20}
            style={{
              borderWidth: 1, borderColor: C.border,
              shadowColor: C.primary, shadowOpacity: 0.08, shadowRadius: 18,
              shadowOffset: { width: 0, height: 8 }, elevation: 4,
            }}
          >
            <Stack gap={16}>
              <StyledForm.Input
                label="Full name"
                placeholder="Your name"
                value={fullName}
                onChangeText={setFullName}
                autoCapitalize="words"
                returnKeyType="next"
                errorMessage={nameError}
                leftIcon={<Feather name="user" size={18} color={C.textSecondary} />}
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
                leftIcon={<Feather name="mail" size={18} color={C.textSecondary} />}
                colors={FC}
              />
              <StyledForm.Input
                label="Password"
                placeholder="At least 8 characters"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPw}
                returnKeyType="go"
                onSubmitEditing={submit}
                errorMessage={pwError}
                leftIcon={<Feather name="lock" size={18} color={C.textSecondary} />}
                rightIcon={<EyeToggle shown={showPw} onPress={() => setShowPw((v) => !v)} />}
                colors={FC}
              />
            </Stack>
          </StyledCard>

          <GradientButton label="Create account" loading={loading} onPress={submit} />

          <Stack horizontal alignItems="center" justifyContent="center" gap={5} marginTop={22}>
            <Text variant="bodySmall" color={C.textSecondary}>Already have an account?</Text>
            <StyledPressable onPress={() => router.back()}>
              <Text variant="bodySmall" color={C.primary} fontWeight="700">Sign in</Text>
            </StyledPressable>
          </Stack>

        </StyledScrollView>
      </KeyboardAvoidingView>
    </StyledPage>
  )
}
