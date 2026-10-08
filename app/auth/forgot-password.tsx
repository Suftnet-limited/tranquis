import React from 'react'
import { Platform, Linking, KeyboardAvoidingView } from 'react-native'
import { XIcon, LockIcon } from '../../src/icons'
import { goBack } from '../../src/utils'
import { StyledPage, StyledScrollView, Stack, StyledPressable } from 'fluent-styles'
import { Text } from '../../src/components/Text'
import { AuthBackground, GradientButton } from '../../src/components/AuthUI'
import { useColors, useIsDark } from '../../src/constants'

export default function ForgotPasswordScreen() {
  const C      = useColors()
  const isDark = useIsDark()

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
            <StyledPressable onPress={() => goBack('/auth/login')} hitSlop={10} accessibilityRole="button" accessibilityLabel="Close">
              <XIcon size={22} strokeWidth={2.2} color={C.textPrimary} />
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
              <LockIcon size={28} strokeWidth={1.8} color={C.primary} />
            </Stack>
            <Text variant="header" color={C.textPrimary} fontWeight="800" textAlign="center">
              Reset password
            </Text>
            <Text variant="body" color={C.textSecondary} textAlign="center" style={{ lineHeight: 24 }}>
              Password reset is done by email. Tap below and we'll reply with a reset link within a few minutes.
            </Text>
            <GradientButton
              label="Email support@tranquis.com"
              onPress={() => Linking.openURL('mailto:support@tranquis.com?subject=Password%20reset%20request')}
            />
            <StyledPressable onPress={() => goBack('/auth/login')} hitSlop={8} accessibilityRole="button" accessibilityLabel="Back to sign in">
              <Text variant="bodySmall" color={C.textMuted} fontWeight="600">Back to sign in</Text>
            </StyledPressable>
          </Stack>

        </StyledScrollView>
      </KeyboardAvoidingView>
    </StyledPage>
  )
}
