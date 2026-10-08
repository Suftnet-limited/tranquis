import React from 'react'
import { Platform, ScrollView } from 'react-native'
import { router } from 'expo-router'
import { Feather } from '@expo/vector-icons'
import { StyledPage, Stack, StyledPressable } from 'fluent-styles'
import { Text } from '../src/components/Text'
import { useColors, useIsDark } from '../src/constants'

const SECTIONS = [
  {
    title: 'What we collect',
    body: 'We collect the text, voice recordings and images you submit for translation, your email address for account creation, and anonymous usage data to improve the service.',
  },
  {
    title: 'How we use your data',
    body: 'Your translation requests are sent to our AI provider (OpenAI) to produce results. We store your translation history and phrasebook entries so you can access them across devices.',
  },
  {
    title: 'Data retention',
    body: 'You can delete your translation history and phrasebook at any time from within the app. You may also delete your account entirely, which removes all personal data within 30 days.',
  },
  {
    title: 'Third parties',
    body: 'We use OpenAI for translations, RevenueCat for subscription management, and Expo/Apple/Google for app delivery. We do not sell your data to advertisers.',
  },
  {
    title: 'Security',
    body: 'All data is transmitted over TLS. API keys and tokens are stored in the device secure enclave. We follow industry-standard security practices.',
  },
  {
    title: 'Contact',
    body: 'For privacy requests, email privacy@tranquis.com. We respond within 30 days.',
  },
]

export default function PrivacyScreen() {
  const C      = useColors()
  const isDark = useIsDark()

  return (
    <StyledPage flex={1} backgroundColor={C.bg} showStatusBar
      statusBarStyle={isDark ? 'light-content' : 'dark-content'}
      statusBarBackgroundColor={Platform.OS === 'android' ? C.bg : undefined}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, paddingBottom: 48 }}
      >
        <Stack horizontal alignItems="center" gap={12} marginBottom={24} marginTop={8}>
          <StyledPressable onPress={() => router.back()} hitSlop={10}>
            <Feather name="arrow-left" size={22} color={C.textPrimary} />
          </StyledPressable>
          <Text variant="title" color={C.textPrimary} fontWeight="800">Privacy Policy</Text>
        </Stack>

        <Text variant="caption" color={C.textMuted} marginBottom={20}>
          Last updated: October 2026
        </Text>

        <Stack gap={16}>
          {SECTIONS.map((s) => (
            <Stack key={s.title}
              backgroundColor={C.bgCard} borderRadius={16} padding={16}
              style={{ borderWidth: 1, borderColor: C.border }}
            >
              <Text variant="body" color={C.textPrimary} fontWeight="800" marginBottom={8}>
                {s.title}
              </Text>
              <Text variant="bodySmall" color={C.textSecondary} style={{ lineHeight: 22 }}>
                {s.body}
              </Text>
            </Stack>
          ))}
        </Stack>
      </ScrollView>
    </StyledPage>
  )
}
