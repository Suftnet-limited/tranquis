import React, { useState } from 'react'
import { Platform, KeyboardAvoidingView, ScrollView, Text as RNText, TouchableOpacity, View } from 'react-native'
import { router } from 'expo-router'
import { StyledPage } from 'fluent-styles'
import { AuthHeader, AuthField, AuthButton, OrDivider, EMAIL_RE, FONT, TEAL, useAuthColors } from '../../src/components/AuthUI'
import { useAuth } from '../../src/hooks'
import { ResetPasswordSheet } from '../../src/components/ResetPasswordSheet'

export default function LoginScreen() {
  const A = useAuthColors()
  const { login, loading } = useAuth()

  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [tried,    setTried]    = useState(false)
  const [resetOpen, setResetOpen] = useState(false)

  const emailError = tried && !EMAIL_RE.test(email.trim()) ? 'Enter a valid email address' : undefined
  const pwError    = tried && !password ? 'Enter your password' : undefined

  const submit = () => {
    setTried(true)
    if (!EMAIL_RE.test(email.trim()) || !password) return
    login(email.trim(), password)
  }

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
          <AuthHeader title="Welcome back" subtitle="Sign in to continue translating" />

          <View style={{ gap: 18, marginTop: 36 }}>
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
              placeholder="Your password"
              value={password}
              onChangeText={setPassword}
              password
              textContentType="password"
              returnKeyType="go"
              onSubmitEditing={submit}
              error={pwError}
            />
          </View>

          <TouchableOpacity onPress={() => setResetOpen(true)} hitSlop={8}
            style={{ alignSelf: 'flex-end', marginTop: 16, marginBottom: 24 }}
            accessibilityRole="button" accessibilityLabel="Forgot password"
          >
            <RNText style={{ fontFamily: FONT.semibold, fontSize: 14, color: TEAL }}>Forgot password?</RNText>
          </TouchableOpacity>

          <AuthButton label="Sign in →" loading={loading} onPress={submit} />

          <OrDivider />

          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6 }}>
            <RNText style={{ fontFamily: FONT.body, fontSize: 15, color: A.muted }}>Don't have an account?</RNText>
            <TouchableOpacity onPress={() => router.replace('/auth/register' as any)}
              accessibilityRole="button" accessibilityLabel="Create an account"
            >
              <RNText style={{ fontFamily: FONT.semibold, fontSize: 15, color: TEAL }}>Create one</RNText>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <ResetPasswordSheet
        visible={resetOpen}
        email={EMAIL_RE.test(email.trim()) ? email.trim() : ''}
        onClose={() => setResetOpen(false)}
        onDone={() => { setResetOpen(false); router.replace('/(tabs)') }}
      />
    </StyledPage>
  )
}
