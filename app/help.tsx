import React from 'react'
import { Platform, TouchableOpacity, ScrollView, Linking } from 'react-native'
import { router } from 'expo-router'
import { Feather } from '@expo/vector-icons'
import { StyledPage, Stack, StyledPressable } from 'fluent-styles'
import { Text } from '../src/components/Text'
import { useColors, useIsDark } from '../src/constants'

const FAQS = [
  { q: 'How accurate are the translations?', a: 'Tranquis uses GPT-4o, one of the most capable AI models, which provides high-quality translations for most languages. Results are best for major world languages.' },
  { q: 'Which languages are supported?',    a: 'Over 20 languages including English, Spanish, French, German, Chinese, Japanese, Korean, Arabic, Portuguese, Russian, Hindi, and many more.' },
  { q: 'Does it work offline?',             a: 'Tranquis requires an internet connection to perform translations, as it uses cloud AI models. We are working on offline support for future versions.' },
  { q: 'How do I save a phrase?',           a: 'After a translation appears, tap the "Save" button on the result card. You can find all saved phrases in the Phrasebook tab.' },
  { q: 'What is Tranquis Pro?',             a: 'Pro gives you unlimited translations, voice interpreter, camera OCR and text-to-speech playback. You can try it free for 7 days.' },
]

function FaqItem({ q, a }: { q: string; a: string }) {
  const C = useColors()
  const [open, setOpen] = React.useState(false)
  return (
    <TouchableOpacity onPress={() => setOpen((v) => !v)} activeOpacity={0.8}>
      <Stack
        backgroundColor={C.bgCard} borderRadius={16} padding={16} marginBottom={10}
        style={{ borderWidth: 1, borderColor: C.border }}
      >
        <Stack horizontal alignItems="center" justifyContent="space-between" gap={12}>
          <Text variant="body" color={C.textPrimary} fontWeight="700" style={{ flex: 1 }}>{q}</Text>
          <Feather name={open ? 'chevron-up' : 'chevron-down'} size={16} color={C.textMuted} />
        </Stack>
        {open && (
          <Text variant="bodySmall" color={C.textSecondary} style={{ marginTop: 10, lineHeight: 20 }}>
            {a}
          </Text>
        )}
      </Stack>
    </TouchableOpacity>
  )
}

export default function HelpScreen() {
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
          <Text variant="title" color={C.textPrimary} fontWeight="800">Help & Support</Text>
        </Stack>

        {/* Contact options */}
        <Stack gap={10} marginBottom={28}>
          {[
            { icon: 'mail', label: 'Email support', sub: 'support@tranquis.com', onPress: () => Linking.openURL('mailto:support@tranquis.com') },
          ].map((item) => (
            <TouchableOpacity key={item.label} onPress={item.onPress} activeOpacity={0.7}>
              <Stack horizontal alignItems="center" gap={14}
                backgroundColor={C.bgCard} borderRadius={16} padding={16}
                style={{ borderWidth: 1, borderColor: C.border }}
              >
                <Stack
                  width={42} height={42} borderRadius={12}
                  alignItems="center" justifyContent="center"
                  backgroundColor={C.primaryBg}
                  style={{ borderWidth: 1, borderColor: `${C.primary}25` }}
                >
                  <Feather name={item.icon as any} size={18} color={C.primary} />
                </Stack>
                <Stack flex={1}>
                  <Text variant="body" color={C.textPrimary} fontWeight="700">{item.label}</Text>
                  <Text variant="caption" color={C.textMuted}>{item.sub}</Text>
                </Stack>
                <Feather name="arrow-right" size={16} color={C.textMuted} />
              </Stack>
            </TouchableOpacity>
          ))}
        </Stack>

        <Text variant="label" color={C.textSecondary} fontWeight="700" marginBottom={12}>
          Frequently asked questions
        </Text>
        {FAQS.map((faq) => <FaqItem key={faq.q} {...faq} />)}
      </ScrollView>
    </StyledPage>
  )
}
