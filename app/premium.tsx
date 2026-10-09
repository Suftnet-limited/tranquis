import React, { useState } from 'react'
import { Platform } from 'react-native'
import Svg, { Defs, LinearGradient, Stop, Circle } from 'react-native-svg'
import { StyledPage, StyledScrollView, Stack, StyledPressable } from 'fluent-styles'
import { Text } from '../src/components/Text'
import { GradientButton } from '../src/components/AuthUI'
import { useColors, useIsDark } from '../src/constants'
import { usePremium } from '../src/hooks'
import { goBack } from '../src/utils'
import { ChevronLeftIcon, CheckIcon, GlobeIcon } from '../src/icons'

type Plan = 'yearly' | 'monthly'

// Shown until the App Store prices load (or if RevenueCat isn't configured)
const FALLBACK = { monthly: '£4.99', yearly: '£39.99', yearlyPerMonth: '£3.33', saving: 'Save 33%' }

// Only what Tranquis actually does today
const FEATURES = [
  'Unlimited text, voice & camera translations',
  'Tone-aware translations — casual, formal, business, travel',
  'Explain any translation — word choices & grammar',
  'Pronunciation guides for every saved phrase',
  'Natural speech playback in 60+ languages',
  'Unlimited phrasebook saves',
]

// Teal-to-indigo medallion with soft halo rings
function Medallion() {
  const C = useColors()
  const size = 92
  return (
    <Stack alignItems="center" justifyContent="center" width={size + 48} height={size + 48} alignSelf="center">
      <Stack position="absolute" width={size + 48} height={size + 48} borderRadius={(size + 48) / 2}
        borderWidth={1} borderColor={`${C.primary}22`} />
      <Stack position="absolute" width={size + 22} height={size + 22} borderRadius={(size + 22) / 2}
        borderWidth={1.5} borderColor={`${C.primary}40`} />
      <Stack width={size} height={size} borderRadius={size / 2} alignItems="center" justifyContent="center"
        style={{ shadowColor: C.sumColor, shadowOpacity: 0.35, shadowRadius: 18, shadowOffset: { width: 0, height: 8 }, elevation: 8 }}
      >
        <Svg width={size} height={size} style={{ position: 'absolute' }}>
          <Defs>
            <LinearGradient id="proMedallion" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor={C.primary} />
              <Stop offset="1" stopColor={C.sumColor} />
            </LinearGradient>
          </Defs>
          <Circle cx={size / 2} cy={size / 2} r={size / 2} fill="url(#proMedallion)" />
        </Svg>
        <GlobeIcon size={44} strokeWidth={1.6} color={C.white} />
      </Stack>
    </Stack>
  )
}

function Header() {
  const C = useColors()
  return (
    <StyledPage.Header.Full>
      <Stack horizontal alignItems="center" gap={14} marginHorizontal={16} paddingBottom={14}>
        <StyledPressable
          width={44} height={44} borderRadius={12} alignItems="center" justifyContent="center"
          backgroundColor={C.bgInput} onPress={() => goBack('/profile')}
          accessibilityRole="button" accessibilityLabel="Close"
        >
          <ChevronLeftIcon size={20} strokeWidth={2.4} color={C.textPrimary} />
        </StyledPressable>
        <Stack flex={1}>
          <Text variant="title" color={C.textPrimary} fontWeight="800">Tranquis Pro</Text>
          <Text variant="bodySmall" color={C.textMuted}>Unlock everything</Text>
        </Stack>
      </Stack>
    </StyledPage.Header.Full>
  )
}

function FeatureList() {
  const C = useColors()
  return (
    <Stack gap={14}>
      {FEATURES.map((feature) => (
        <Stack key={feature} horizontal alignItems="flex-start" gap={12}>
          <Stack width={22} height={22} borderRadius={11} alignItems="center" justifyContent="center"
            backgroundColor={C.primaryBg} style={{ marginTop: 1 }}
          >
            <CheckIcon size={13} strokeWidth={2.8} color={C.primary} />
          </Stack>
          <Text variant="body" color={C.textPrimary} style={{ flex: 1, fontSize: 15, lineHeight: 22 }}>{feature}</Text>
        </Stack>
      ))}
    </Stack>
  )
}

function PlanCard({ title, subtitle, price, per, note, saving, popular, selected, onPress }: {
  title: string; subtitle: string; price: string; per: string; note?: string; saving?: string
  popular?: boolean; selected: boolean; onPress: () => void
}) {
  const C = useColors()
  return (
    <StyledPressable onPress={onPress} accessibilityRole="button" accessibilityState={{ selected }} accessibilityLabel={title}>
      <Stack borderRadius={18} paddingHorizontal={18} paddingVertical={18}
        backgroundColor={selected ? C.primaryBg : C.bgCard}
        borderWidth={2} borderColor={selected ? C.primary : C.border}
        style={selected ? { shadowColor: C.primary, shadowOpacity: 0.18, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 4 } : undefined}
      >
        {popular && (
          <Stack position="absolute" top={-13} alignSelf="center" backgroundColor={C.accent} borderRadius={12}
            paddingHorizontal={12} paddingVertical={4}
          >
            <Text variant="caption" color={C.white} fontWeight="800" style={{ letterSpacing: 0.8, fontSize: 11 }}>MOST POPULAR</Text>
          </Stack>
        )}
        <Stack horizontal alignItems="center" justifyContent="space-between" gap={12}>
          <Stack flex={1} gap={3}>
            <Text variant="subtitle" color={C.textPrimary} fontWeight="800">{title}</Text>
            <Text variant="bodySmall" color={C.textMuted}>{subtitle}</Text>
          </Stack>
          <Stack alignItems="flex-end" gap={2}>
            <Text color={C.textPrimary} fontWeight="800" style={{ fontSize: 24 }}>
              {price}<Text variant="bodySmall" color={C.textMuted} fontWeight="500">{per}</Text>
            </Text>
            {!!note && <Text variant="caption" color={C.textMuted}>{note}</Text>}
            {!!saving && (
              <Stack backgroundColor={C.successBg} borderRadius={10} paddingHorizontal={8} paddingVertical={2} marginTop={2}>
                <Text variant="caption" color={C.success} fontWeight="700">{saving}</Text>
              </Stack>
            )}
          </Stack>
        </Stack>
      </Stack>
    </StyledPressable>
  )
}

export default function PremiumScreen() {
  const C      = useColors()
  const isDark = useIsDark()
  const { isPremium, plan: activePlan, buyMonthly, buyYearly, restore, loading, monthlyPrice, yearlyPrice } = usePremium()
  const [plan, setPlan] = useState<Plan>('yearly')

  const monthly = monthlyPrice ?? FALLBACK.monthly
  const yearly  = yearlyPrice ?? FALLBACK.yearly

  const page = (children: React.ReactNode) => (
    <StyledPage flex={1} backgroundColor={C.bgCard} showStatusBar
      statusBarStyle={isDark ? 'light-content' : 'dark-content'}
      statusBarBackgroundColor={Platform.OS === 'android' ? C.bgCard : undefined}
    >
      <Header />
      <StyledScrollView
        style={{ borderTopWidth: 1, borderTopColor: C.border }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 24, paddingBottom: 40 }}
      >
        {children}
      </StyledScrollView>
    </StyledPage>
  )

  if (isPremium) {
    return page(
      <>
        <Medallion />
        <Text variant="display" color={C.textPrimary} fontWeight="800" textAlign="center" style={{ fontSize: 28, lineHeight: 34, marginTop: 18 }}>
          You're on Pro
        </Text>
        <Text variant="body" color={C.textMuted} textAlign="center" style={{ marginTop: 8, marginBottom: 28 }}>
          {activePlan ? `Your ${activePlan} plan is active. ` : ''}Thanks for supporting Tranquis.
        </Text>
        <FeatureList />
        <Text variant="caption" color={C.textMuted} textAlign="center" style={{ marginTop: 28, lineHeight: 18 }}>
          Manage or cancel your subscription in Settings › Apple ID › Subscriptions.
        </Text>
      </>,
    )
  }

  return page(
    <>
      <Medallion />
      <Text variant="display" color={C.textPrimary} fontWeight="800" textAlign="center" style={{ fontSize: 30, lineHeight: 36, marginTop: 16 }}>
        Speak every language,{'\n'}anywhere
      </Text>
      <Text variant="body" color={C.textMuted} textAlign="center" style={{ fontSize: 16, lineHeight: 24, marginTop: 10, marginBottom: 30, paddingHorizontal: 8 }}>
        Unlimited translations, voice and camera, explanations and pronunciation — all in one place.
      </Text>

      <Stack gap={16} marginBottom={28}>
        <PlanCard
          popular
          title="Pro Annual"
          subtitle="Billed annually · cancel anytime"
          price={yearlyPrice ? yearly : FALLBACK.yearlyPerMonth}
          per={yearlyPrice ? '/yr' : '/mo'}
          note={yearlyPrice ? undefined : `${FALLBACK.yearly}/year`}
          saving={FALLBACK.saving}
          selected={plan === 'yearly'}
          onPress={() => setPlan('yearly')}
        />
        <PlanCard
          title="Pro Monthly"
          subtitle="Billed monthly · cancel anytime"
          price={monthly}
          per="/mo"
          note={`${monthly}/month`}
          selected={plan === 'monthly'}
          onPress={() => setPlan('monthly')}
        />
      </Stack>

      <FeatureList />

      <Stack marginTop={30}>
        <GradientButton
          label="Start Free 7-Day Trial"
          loading={loading}
          onPress={() => (plan === 'yearly' ? buyYearly() : buyMonthly())}
        />
      </Stack>
      <Text variant="caption" color={C.textMuted} textAlign="center" style={{ marginTop: 12 }}>
        Then {plan === 'yearly' ? `${yearly}/year` : `${monthly}/month`}. Cancel in Settings anytime before renewal.
      </Text>

      <StyledPressable onPress={restore} alignSelf="center" marginTop={16} padding={6}
        accessibilityRole="button" accessibilityLabel="Restore purchases"
      >
        <Text variant="bodySmall" color={C.primary} fontWeight="700">Restore purchases</Text>
      </StyledPressable>

      <Text variant="caption" color={C.textMuted} textAlign="center" style={{ marginTop: 18, lineHeight: 17, paddingHorizontal: 8, opacity: 0.8 }}>
        Payment is charged to your Apple ID at confirmation of purchase. The subscription renews automatically
        unless auto-renew is turned off at least 24 hours before the end of the current period.
      </Text>
    </>,
  )
}
