import React from 'react'
import { Platform, Linking } from 'react-native'
import { StyledPage, StyledScrollView, Stack, StyledCard, StyledPressable } from 'fluent-styles'
import { Text } from '../src/components/Text'
import { ScreenHeader } from '../src/components/ScreenHeader'
import { SectionLabel } from '../src/components/SectionLabel'
import { useColors, useIsDark } from '../src/constants'
import { goBack } from '../src/utils'
import { MailIcon, ChevronDownIcon, ChevronUpIcon, ChevronRightIcon } from '../src/icons'

const FAQS = [
  { q: 'How accurate are the translations?', a: 'Tranquis uses GPT-4o, one of the most capable AI models, which provides high-quality translations for most languages. Results are best for major world languages.' },
  { q: 'Which languages are supported?',    a: 'Over 60 languages including English, Spanish, French, German, Chinese, Japanese, Korean, Arabic, Portuguese, Russian, Hindi, and many more.' },
  { q: 'Does it work offline?',             a: 'Tranquis requires an internet connection to perform translations, as it uses cloud AI models. We are working on offline support for future versions.' },
  { q: 'How do I save a phrase?',           a: 'After a translation appears, tap the "Save" button on the result card. You can find all saved phrases in the Phrasebook tab.' },
  { q: 'What is Tranquis Pro?',             a: 'Pro removes translation limits, unlocks live voice mode, camera translation and text-to-speech. You can try it free for 7 days.' },
]

function FaqItem({ q, a }: { q: string; a: string }) {
  const C = useColors()
  const [open, setOpen] = React.useState(false)
  const Chevron = open ? ChevronUpIcon : ChevronDownIcon
  return (
    <StyledPressable onPress={() => setOpen((v) => !v)}
      accessibilityRole="button" accessibilityState={{ expanded: open }} accessibilityLabel={q}
    >
      <StyledCard backgroundColor={C.bgCard} borderRadius={16} padding={16} marginBottom={10}
        borderWidth={1} borderColor={C.border}
      >
        <Stack horizontal alignItems="center" justifyContent="space-between" gap={12}>
          <Text variant="label" color={C.textPrimary} style={{ flex: 1 }}>{q}</Text>
          <Chevron size={16} strokeWidth={2} color={C.textMuted} />
        </Stack>
        {open && (
          <Text variant="bodySmall" color={C.textSecondary} style={{ marginTop: 10, lineHeight: 20 }}>{a}</Text>
        )}
      </StyledCard>
    </StyledPressable>
  )
}

export default function HelpScreen() {
  const C      = useColors()
  const isDark = useIsDark()

  return (
    <StyledPage flex={1} backgroundColor={C.bg}
      statusBarStyle={isDark ? 'light-content' : 'dark-content'}
      statusBarBackgroundColor={Platform.OS === 'android' ? C.bg : undefined}
    >
      <ScreenHeader title="Help & Support" onBackPress={() => goBack('/profile')} />

      <StyledScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        <StyledPressable onPress={() => Linking.openURL('mailto:support@tranquis.com')}
          accessibilityRole="button" accessibilityLabel="Email support"
        >
          <StyledCard backgroundColor={C.bgCard} borderRadius={16} padding={16} marginBottom={24}
            borderWidth={1} borderColor={C.border}
          >
            <Stack horizontal alignItems="center" gap={14}>
              <Stack width={42} height={42} borderRadius={12} alignItems="center" justifyContent="center" backgroundColor={C.primaryBg}>
                <MailIcon size={18} strokeWidth={2} color={C.primary} />
              </Stack>
              <Stack flex={1}>
                <Text variant="label" color={C.textPrimary} fontWeight="700">Email support</Text>
                <Text variant="caption" color={C.textMuted}>support@tranquis.com</Text>
              </Stack>
              <ChevronRightIcon size={16} strokeWidth={2} color={C.textMuted} />
            </Stack>
          </StyledCard>
        </StyledPressable>

        <SectionLabel>Frequently asked questions</SectionLabel>
        {FAQS.map((faq) => <FaqItem key={faq.q} {...faq} />)}
      </StyledScrollView>
    </StyledPage>
  )
}
