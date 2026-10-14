import React, { useState } from 'react'
import { Platform, KeyboardAvoidingView, ScrollView, Text as RNText, TouchableOpacity, View } from 'react-native'
import { router } from 'expo-router'
import { StyledPage } from 'fluent-styles'
import { AuthHeader, AuthField, AuthButton, OrDivider, StrengthBar, EMAIL_RE, FONT, TEAL, useAuthColors } from '../../src/components/AuthUI'
import { useAuth } from '../../src/hooks'

// Matches the backend's rule (auth/register rejects shorter passwords)
const MIN_PASSWORD = 8

export default function RegisterScreen() {
  const A = useAuthColors()
  const { register, loading } = useAuth()

  const [name,     setName]     = useState('')
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [tried,    setTried]    = useState(false)

  const nameError  = tried && !name.trim() ? 'Enter your name' : undefined
  const emailError = tried && !EMAIL_RE.test(email.trim()) ? 'Enter a valid email address' : undefined
  const pwError    = tried && password.length < MIN_PASSWORD ? `Use at least ${MIN_PASSWORD} characters` : undefined

  const submit = () => {
    setTried(true)
    if (!name.trim() || !EMAIL_RE.test(email.trim()) || password.length < MIN_PASSWORD) return
    register(email.trim(), password, name.trim())
  }

  const link = { fontFamily: FONT.medium, color: TEAL }

  return (
    <StyledPage flex={1} backgroundColor={A.bg} showStatusBar
      statusBarStyle={A.isDark ? 'light-content' : 'dark-content'}
      statusBarBackgroundColor={Platform.OS === 'android' ? A.bg : undefined}
    >
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingTop: 24, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <AuthHeader title="Create account" subtitle="Start translating in seconds" />

          <View style={{ gap: 18, marginTop: 36, marginBottom: 28 }}>
            <AuthField
              label="Full name"
              placeholder="Your name"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              textContentType="name"
              returnKeyType="next"
              error={nameError}
            />
            <AuthField
              label="Email"
              placeholder="you@example.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="emailAddress"
              returnKeyType="next"
              error={emailError}
            />
            <AuthField
              label="Password"
              placeholder={`At least ${MIN_PASSWORD} characters`}
              value={password}
              onChangeText={setPassword}
              password
              textContentType="newPassword"
              returnKeyType="go"
              onSubmitEditing={submit}
              error={pwError}
            >
              <StrengthBar password={password} />
            </AuthField>
          </View>

          <AuthButton label="Create account →" loading={loading} onPress={submit} />

          <RNText style={{ fontFamily: FONT.body, fontSize: 13, lineHeight: 20, color: A.faint, textAlign: 'center', marginTop: 16 }}>
            By signing up you agree to our{' '}
            <RNText style={link} onPress={() => router.push('/terms' as any)}>Terms of Use</RNText>
            {' '}and{' '}
            <RNText style={link} onPress={() => router.push('/privacy' as any)}>Privacy Policy</RNText>
          </RNText>

          <OrDivider />

          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6 }}>
            <RNText style={{ fontFamily: FONT.body, fontSize: 15, color: A.muted }}>Already have an account?</RNText>
            <TouchableOpacity onPress={() => router.replace('/auth/login' as any)}
              accessibilityRole="button" accessibilityLabel="Sign in"
            >
              <RNText style={{ fontFamily: FONT.semibold, fontSize: 15, color: TEAL }}>Sign in</RNText>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </StyledPage>
  )
}
