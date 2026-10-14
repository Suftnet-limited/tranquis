import React from 'react'
import { Platform, Linking } from 'react-native'
import { StyledPage, StyledScrollView, Stack, StyledCard } from 'fluent-styles'
import { Text } from '../src/components/Text'
import { ScreenHeader } from '../src/components/ScreenHeader'
import { useColors, useIsDark } from '../src/constants'
import { TERMS_URL } from '../src/constants/legal'
import { goBack } from '../src/utils'

const SECTIONS = [
  {
    title: 'Agreement',
    body: 'By creating an account or using Tranquis you agree to these Terms of Use and our Privacy Policy. If you do not agree, do not use the app.',
  },
  {
    title: 'The service',
    body: 'Tranquis translates text, speech and images using artificial intelligence. Translations can be inaccurate or incomplete. Do not rely on them for medical, legal, safety or other critical decisions without checking with a qualified person.',
  },
  {
    title: 'Your account',
    body: 'You are responsible for your account and for keeping your email address up to date, since it is used to reset your password. You must be at least 13 years old to use Tranquis.',
  },
  {
    title: 'Tranquis Pro subscriptions',
    body: 'Tranquis Pro is an auto-renewing subscription, billed in advance weekly, monthly, every 3 months or yearly depending on the plan you choose. Payment is processed by Stripe on the web, or by Apple or Google where purchased in the app store. The Monthly plan includes a 7-day free trial, which converts to a paid subscription unless you cancel before it ends. Subscriptions renew automatically at the then-current price unless cancelled at least 24 hours before the end of the current period. App Store subscriptions are managed or cancelled in your device account settings; web subscriptions are cancelled by emailing support. Cancellation takes effect at the end of the current period, and no partial refunds are given for unused time.',
  },
  {
    title: 'Acceptable use',
    body: 'Do not use Tranquis to break the law, to harass or harm others, to infringe anyone\'s rights, or to attempt to disrupt, overload or reverse-engineer the service.',
  },
  {
    title: 'Your content',
    body: 'You keep ownership of the text, recordings and images you submit. You give us permission to process them to provide translations and the features you use, as described in the Privacy Policy.',
  },
  {
    title: 'Disclaimer and liability',
    body: 'Tranquis is provided "as is" without warranties of any kind. To the extent permitted by law, we are not liable for any loss arising from your use of the app or reliance on its translations.',
  },
  {
    title: 'Ending your use',
    body: 'You can delete your account at any time from your profile. We may suspend accounts that break these terms.',
  },
  {
    title: 'Changes',
    body: 'We may update these terms. If the changes are significant we will tell you in the app. Continuing to use Tranquis after an update means you accept the new terms.',
  },
  {
    title: 'Contact',
    body: 'Questions about these terms: support@tranquis.com.',
  },
]

export default function TermsScreen() {
  const C      = useColors()
  const isDark = useIsDark()

  return (
    <StyledPage flex={1} backgroundColor={C.bg}
      statusBarStyle={isDark ? 'light-content' : 'dark-content'}
      statusBarBackgroundColor={Platform.OS === 'android' ? C.bg : undefined}
    >
      <ScreenHeader title="Terms of Use" onBackPress={() => goBack('/profile')} />

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
        <Text variant="caption" color={C.textMuted} textAlign="center" style={{ marginTop: 18 }}>
          Also available at{' '}
          <Text variant="caption" color={C.primary} fontWeight="600" onPress={() => Linking.openURL(TERMS_URL)}>
            {TERMS_URL.replace('https://', '')}
          </Text>
        </Text>
      </StyledScrollView>
    </StyledPage>
  )
}
