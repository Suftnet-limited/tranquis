import React from 'react'
import { Platform } from 'react-native'
import { StyledPage, StyledScrollView, Stack, StyledCard } from 'fluent-styles'
import { Text } from '../src/components/Text'
import { ScreenHeader } from '../src/components/ScreenHeader'
import { useColors, useIsDark } from '../src/constants'
import { goBack } from '../src/utils'

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
    body: 'You can delete your translation history and phrasebook at any time from within the app. Translations and saved phrases are deleted automatically after 12 months. You can also delete your account from your profile, which immediately removes your account and all its data. Your Tranquis account is shared with CareerMind/Interquis, so deleting it removes that data too.',
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
    <StyledPage flex={1} backgroundColor={C.bg}
      statusBarStyle={isDark ? 'light-content' : 'dark-content'}
      statusBarBackgroundColor={Platform.OS === 'android' ? C.bg : undefined}
    >
      <ScreenHeader title="Privacy Policy" onBackPress={() => goBack('/profile')} />

      <StyledScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        <Text variant="caption" color={C.textMuted} paddingHorizontal={4} style={{ marginBottom: 12 }}>
          Last updated: October 2026
        </Text>
        <Stack gap={12}>
          {SECTIONS.map((section) => (
            <StyledCard key={section.title} backgroundColor={C.bgCard} borderRadius={16} padding={16}
              borderWidth={1} borderColor={C.border}
            >
              <Text variant="label" color={C.textPrimary} fontWeight="700" style={{ marginBottom: 8 }}>{section.title}</Text>
              <Text variant="bodySmall" color={C.textSecondary} style={{ lineHeight: 22 }}>{section.body}</Text>
            </StyledCard>
          ))}
        </Stack>
      </StyledScrollView>
    </StyledPage>
  )
}
