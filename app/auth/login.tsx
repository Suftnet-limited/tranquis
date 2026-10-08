import React, { useState } from 'react'
import { Platform, KeyboardAvoidingView, TextInput, TouchableOpacity, StyleSheet } from 'react-native'
import { router } from 'expo-router'
import { Feather } from '@expo/vector-icons'
import { StyledPage, StyledScrollView, Stack } from 'fluent-styles'
import { Text } from '../../src/components/Text'
import { AuthBackground, GradientButton } from '../../src/components/AuthUI'
import { useColors, useIsDark } from '../../src/constants'
import { useAuth } from '../../src/hooks'

export default function LoginScreen() {
  const C      = useColors()
  const isDark = useIsDark()
  const { login, loading } = useAuth()

  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [showPwd,  setShowPwd]  = useState(false)

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
          {/* Brand */}
          <Stack alignItems="center" marginBottom={32}>
            <Stack
              width={72} height={72} borderRadius={36}
              alignItems="center" justifyContent="center"
              backgroundColor={C.primaryBg}
              style={{ borderWidth: 2, borderColor: `${C.primary}40`, marginBottom: 16 }}
            >
              <Text style={{ fontSize: 32 }}>🌍</Text>
            </Stack>
            <Text variant="header" color={C.textPrimary} fontWeight="800" textAlign="center">
              Welcome back
            </Text>
            <Text variant="body" color={C.textSecondary} textAlign="center" style={{ marginTop: 6 }}>
              Sign in to Tranquis
            </Text>
          </Stack>

          {/* Card */}
          <Stack
            backgroundColor={C.bgCard} borderRadius={22} padding={24} gap={16}
            style={{ borderWidth: 1, borderColor: C.border }}
          >
            {/* Email */}
            <Stack gap={8}>
              <Text variant="caption" color={C.textSecondary} fontWeight="700">Email</Text>
              <Stack
                horizontal alignItems="center"
                backgroundColor={C.bg} borderRadius={14} paddingHorizontal={14}
                style={{ borderWidth: 1, borderColor: C.border, height: 52 }}
              >
                <Feather name="mail" size={16} color={C.textMuted} style={{ marginRight: 10 }} />
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="you@example.com"
                  placeholderTextColor={C.textMuted}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  style={[styles.input, { color: C.textPrimary }]}
                />
              </Stack>
            </Stack>

            {/* Password */}
            <Stack gap={8}>
              <Text variant="caption" color={C.textSecondary} fontWeight="700">Password</Text>
              <Stack
                horizontal alignItems="center"
                backgroundColor={C.bg} borderRadius={14} paddingHorizontal={14}
                style={{ borderWidth: 1, borderColor: C.border, height: 52 }}
              >
                <Feather name="lock" size={16} color={C.textMuted} style={{ marginRight: 10 }} />
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Your password"
                  placeholderTextColor={C.textMuted}
                  secureTextEntry={!showPwd}
                  style={[styles.input, { color: C.textPrimary }]}
                />
                <TouchableOpacity onPress={() => setShowPwd(v => !v)} activeOpacity={0.7}>
                  <Feather name={showPwd ? 'eye-off' : 'eye'} size={16} color={C.textMuted} />
                </TouchableOpacity>
              </Stack>
            </Stack>

            {/* Forgot password */}
            <Stack alignItems="flex-end" marginTop={-8}>
              <TouchableOpacity onPress={() => router.push('/auth/forgot-password' as any)} activeOpacity={0.7}>
                <Text variant="caption" color={C.primary} fontWeight="600">Forgot password?</Text>
              </TouchableOpacity>
            </Stack>

            {/* Submit */}
            <GradientButton
              label={loading ? 'Signing in…' : 'Sign in'}
              onPress={() => login(email.trim(), password)}
              disabled={loading || !email.trim() || !password}
            />
          </Stack>

          {/* Register link */}
          <Stack horizontal alignItems="center" justifyContent="center" gap={6} marginTop={24}>
            <Text variant="body" color={C.textSecondary}>Don't have an account?</Text>
            <TouchableOpacity onPress={() => router.replace('/auth/register' as any)} activeOpacity={0.7}>
              <Text variant="body" color={C.primary} fontWeight="700">Sign up</Text>
            </TouchableOpacity>
          </Stack>
        </StyledScrollView>
      </KeyboardAvoidingView>
    </StyledPage>
  )
}

const styles = StyleSheet.create({
  input: {
    flex: 1, height: 52,
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 15,
  },
})
