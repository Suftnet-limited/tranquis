import React, { useState } from 'react'
import { Platform } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { StyledPage, StyledScrollView, Stack, StyledCard, StyledPressable } from 'fluent-styles'
import { Text } from '../src/components/Text'
import { GradientButton } from '../src/components/AuthUI'
import { useColors, useIsDark } from '../src/constants'
import { usePremium } from '../src/hooks'
import { goBack } from '../src/utils'
import { XIcon, CheckIcon, SparkleIcon } from '../src/icons'

type Plan = 'yearly' | 'monthly'

const FEATURES = [
  'Unlimited translations — no daily limits',
  'Live voice interpreter in real time',
  'Camera & OCR translation',
  'Text-to-speech playback',
  'Unlimited phrasebook',
  '60+ languages including rare & regional',
]

export default function PremiumScreen() {
  const C      = useColors()
  const isDark = useIsDark()
  const { isPremium, buyMonthly, buyYearly, restore, loading } = usePremium()

  const [plan, setPlan] = useState<Plan>('yearly')

  const handlePurchase = () => {
    if (plan === 'yearly') buyYearly()
    else buyMonthly()
  }

  if (isPremium) {
    return (
      <StyledPage flex={1} backgroundColor={C.bg} showStatusBar
        statusBarStyle={isDark ? 'light-content' : 'dark-content'}
      >
        <Stack flex={1} alignItems="center" justifyContent="center" padding={32} gap={16}>
          <Stack width={84} height={84} borderRadius={42} alignItems="center" justifyContent="center" backgroundColor={C.primaryBg}>
            <SparkleIcon size={40} strokeWidth={1.8} color={C.primary} />
          </Stack>
          <Text variant="header" color={C.textPrimary} fontWeight="800" textAlign="center">
            You're on Pro!
          </Text>
          <Text variant="body" color={C.textSecondary} textAlign="center">
            Enjoy unlimited translations and all Pro features.
          </Text>
          <Stack alignSelf="stretch" marginTop={8}>
            <GradientButton label="Go back" arrow={false} onPress={() => goBack()} />
          </Stack>
        </Stack>
      </StyledPage>
    )
  }

  return (
    <StyledPage flex={1} backgroundColor={C.bg} showStatusBar
      statusBarStyle="light-content"
      statusBarBackgroundColor={Platform.OS === 'android' ? C.navy : undefined}
    >
      <StyledScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 48 }}
      >
        {/* Hero gradient — dark blue */}
        <LinearGradient colors={[C.navy, C.navyLight]} style={{ paddingHorizontal: 20, paddingBottom: 24 }}>
          {/* Close */}
          <StyledPressable onPress={() => goBack()}
            position="absolute" top={52} right={20} zIndex={10}
            width={36} height={36} borderRadius={18} alignItems="center" justifyContent="center"
            backgroundColor="rgba(255,255,255,0.12)"
            accessibilityRole="button" accessibilityLabel="Close"
          >
            <XIcon size={20} strokeWidth={2.2} color={C.white} />
          </StyledPressable>

          {/* Globe emoji hero */}
          <Stack alignItems="center" gap={16} paddingTop={48} paddingBottom={36}>
            <Stack width={96} height={96} borderRadius={48} alignItems="center" justifyContent="center"
              backgroundColor="rgba(255,255,255,0.08)" borderWidth={1} borderColor="rgba(255,255,255,0.14)"
            >
              <SparkleIcon size={46} strokeWidth={1.6} color={C.primaryLight} />
            </Stack>
            <Stack alignItems="center" gap={8}>
              <Text
                variant="header"
                fontWeight="800"
                textAlign="center"
                color={C.white}
                style={{ fontSize: 26, lineHeight: 34 }}
              >
                Speak every language,{'\n'}anywhere
              </Text>
              <Text variant="body" textAlign="center" color="rgba(255,255,255,0.6)">
                Unlock the full Tranquis experience
              </Text>
            </Stack>
          </Stack>
        </LinearGradient>

        <Stack paddingHorizontal={20} paddingTop={24} gap={0}>

          {/* Plan selector */}
          <Stack gap={12} marginBottom={24}>
            {/* Annual — first, with MOST POPULAR badge */}
            <StyledPressable onPress={() => setPlan('yearly')} accessibilityRole="button" accessibilityState={{ selected: plan === 'yearly' }} accessibilityLabel="Pro Annual">
              <Stack
                borderRadius={18} padding={18}
                style={[
                  {
                    borderColor: plan === 'yearly' ? C.primary : C.border,
                    borderWidth: plan === 'yearly' ? 2 : 1,
                    backgroundColor: plan === 'yearly' ? `${C.primary}10` : C.bgCard,
                  },
                ]}
              >
                <Stack horizontal alignItems="center" justifyContent="space-between">
                  <Stack gap={3}>
                    <Stack horizontal alignItems="center" gap={10}>
                      <Text variant="body" color={C.textPrimary} fontWeight="800">Pro Annual</Text>
                      {/* MOST POPULAR badge */}
                      <Stack
                        backgroundColor={C.primary} borderRadius={6}
                        paddingHorizontal={8} paddingVertical={3}
                      >
                        <Text variant="caption" color={C.white} fontWeight="700" style={{ fontSize: 10, letterSpacing: 0.5 }}>
                          MOST POPULAR
                        </Text>
                      </Stack>
                    </Stack>
                    <Text variant="caption" color={C.textMuted}>£3.33/mo · billed annually</Text>
                  </Stack>
                  <Stack alignItems="flex-end" gap={2}>
                    <Text variant="title" color={C.primary} fontWeight="800">£39.99</Text>
                    <Text variant="caption" color={C.live} fontWeight="600">Save 33%</Text>
                  </Stack>
                </Stack>
                {/* Radio */}
                <Stack position="absolute" top={18} right={16}>
                  <Stack
                    width={22} height={22} borderRadius={11}
                    alignItems="center" justifyContent="center"
                    backgroundColor={plan === 'yearly' ? C.primary : 'transparent'}
                    style={{ borderWidth: 2, borderColor: plan === 'yearly' ? C.primary : C.border }}
                  >
                    {plan === 'yearly' && <Stack width={8} height={8} borderRadius={4} backgroundColor={C.white} />}
                  </Stack>
                </Stack>
              </Stack>
            </StyledPressable>

            {/* Monthly */}
            <StyledPressable onPress={() => setPlan('monthly')} accessibilityRole="button" accessibilityState={{ selected: plan === 'monthly' }} accessibilityLabel="Pro Monthly">
              <Stack
                borderRadius={18} padding={18}
                style={[
                  {
                    borderColor: plan === 'monthly' ? C.primary : C.border,
                    borderWidth: plan === 'monthly' ? 2 : 1,
                    backgroundColor: plan === 'monthly' ? `${C.primary}10` : C.bgCard,
                  },
                ]}
              >
                <Stack horizontal alignItems="center" justifyContent="space-between">
                  <Stack gap={3}>
                    <Text variant="body" color={C.textPrimary} fontWeight="800">Pro Monthly</Text>
                    <Text variant="caption" color={C.textMuted}>Billed monthly</Text>
                  </Stack>
                  <Stack alignItems="flex-end" gap={2}>
                    <Text variant="title" color={C.textPrimary} fontWeight="800">£4.99</Text>
                    <Text variant="caption" color={C.textMuted}>per month</Text>
                  </Stack>
                </Stack>
                <Stack position="absolute" top={18} right={16}>
                  <Stack
                    width={22} height={22} borderRadius={11}
                    alignItems="center" justifyContent="center"
                    backgroundColor={plan === 'monthly' ? C.primary : 'transparent'}
                    style={{ borderWidth: 2, borderColor: plan === 'monthly' ? C.primary : C.border }}
                  >
                    {plan === 'monthly' && <Stack width={8} height={8} borderRadius={4} backgroundColor={C.white} />}
                  </Stack>
                </Stack>
              </Stack>
            </StyledPressable>
          </Stack>

          {/* Feature checklist */}
          <StyledCard
            backgroundColor={C.bgCard} borderRadius={18} padding={18} marginBottom={24}
            gap={14} borderWidth={1} borderColor={C.border}
          >
            {FEATURES.map((feature) => (
              <Stack key={feature} horizontal alignItems="center" gap={12}>
                <Stack
                  width={22} height={22} borderRadius={11}
                  alignItems="center" justifyContent="center"
                  backgroundColor={`${C.primary}20`}
                >
                  <CheckIcon size={13} strokeWidth={2.6} color={C.primary} />
                </Stack>
                <Text variant="bodySmall" color={C.textPrimary} fontWeight="500" style={{ flex: 1 }}>
                  {feature}
                </Text>
              </Stack>
            ))}
          </StyledCard>

          {/* CTA button */}
          <GradientButton label="Start free 7-day trial" onPress={handlePurchase} loading={loading} />
          <Text
            variant="caption"
            color={C.textMuted}
            textAlign="center"
            style={{ marginTop: 10, marginBottom: 6 }}
          >
            {plan === 'yearly' ? '£39.99/year after trial · ' : '£4.99/month after trial · '}
            Cancel anytime
          </Text>

          {/* Restore */}
          <StyledPressable onPress={restore} alignSelf="center" marginTop={8} accessibilityRole="button" accessibilityLabel="Restore purchases">
            <Text variant="caption" color={C.textMuted} fontWeight="600">Restore purchases</Text>
          </StyledPressable>

          {/* Legal */}
          <Text
            variant="caption"
            color={C.textMuted}
            textAlign="center"
            style={{ marginTop: 20, lineHeight: 18, paddingHorizontal: 8 }}
          >
            Payment charged to your Apple ID account at confirmation of purchase. Subscription automatically
            renews unless auto-renew is turned off at least 24 hours before the end of the current period.
          </Text>
        </Stack>
      </StyledScrollView>
    </StyledPage>
  )
}

