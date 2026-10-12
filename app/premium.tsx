import React, { useEffect, useRef, useState } from 'react'
import { ActivityIndicator, AppState, Platform, TouchableOpacity, ScrollView, StyleSheet } from 'react-native'
import { router } from 'expo-router'
import { Feather } from '@expo/vector-icons'
import { StyledPage, Stack } from 'fluent-styles'
import { Text } from '../src/components/Text'
import { useColors, useIsDark } from '../src/constants'
import { usePremium } from '../src/hooks'
import { ENABLE_REVENUECAT } from '../src/constants/premium'

type WebPlan = 'weekly' | 'monthly' | 'quarterly' | 'annual'

// Mirrors TRANQUIS_PLANS on the web checkout (learnify/src/lib/tranquis-plans.ts) — keep prices in sync
type Plan = {
  id:       WebPlan
  label:    string
  terms:    string
  price:    string   // headline price, per `unit`
  unit:     string
  subPrice: string   // what is actually billed
  save?:    string
  trialDays?: number
  rcPlan?:  'monthly' | 'yearly'   // matching App Store product when RevenueCat is on
}

const PLANS: Plan[] = [
  { id: 'annual',  label: 'Pro Annual',  terms: 'Billed annually · cancel anytime', price: '£2.50', unit: '/mo', subPrice: '£29.99/year',  save: 'Save 50%', rcPlan: 'yearly' },
  { id: 'monthly', label: 'Pro Monthly', terms: 'Billed monthly · cancel anytime',  price: '£4.99', unit: '/mo', subPrice: '£4.99/month', trialDays: 7, rcPlan: 'monthly' },
]

// Shorter plans, tucked behind "More plans" to keep the mock's two-card layout
const MORE_PLANS: Plan[] = [
  { id: 'quarterly', label: 'Pro 3-Month', terms: 'Billed every 3 months · cancel anytime', price: '£3.33', unit: '/mo', subPrice: '£9.99/3 months' },
  { id: 'weekly',    label: 'Pro Weekly',  terms: 'Billed weekly · great for a trip',      price: '£1.99', unit: '/wk', subPrice: '£1.99/week' },
]

const FEATURES = [
  'Unlimited text, voice & camera translations',
  'Live voice interpreter (two-way, real-time)',
  'Natural text-to-speech playback',
  '37 languages, including Nigerian languages',
  'Context & tone aware translations',
  'Unlimited phrasebook saves',
]

const MOST_POPULAR = '#7C3AED'

const close = () => (router.canGoBack() ? router.back() : router.replace('/'))

function Header({ C }: { C: ReturnType<typeof useColors> }) {
  return (
    <Stack horizontal alignItems="center" gap={14}
      paddingHorizontal={20} paddingVertical={14}
      style={{ borderBottomWidth: 1, borderBottomColor: C.border }}
    >
      <TouchableOpacity onPress={close} activeOpacity={0.7} hitSlop={8}
        style={[styles.backBtn, { backgroundColor: C.bgInput }]}
        accessibilityRole="button" accessibilityLabel="Go back"
      >
        <Feather name="chevron-left" size={20} color={C.textPrimary} />
      </TouchableOpacity>
      <Stack>
        <Text variant="body" color={C.textPrimary} fontWeight="800" style={{ fontSize: 18 }}>Tranquis Pro</Text>
        <Text variant="caption" color={C.textMuted}>Unlock everything</Text>
      </Stack>
    </Stack>
  )
}

function PlanCard({ plan, selected, popular, onPress, C }: {
  plan: Plan; selected: boolean; popular?: boolean; onPress: () => void; C: ReturnType<typeof useColors>
}) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85}
      accessibilityRole="radio" accessibilityState={{ selected }}
      style={{ marginTop: popular ? 12 : 0 }}
    >
      <Stack
        horizontal alignItems="center" justifyContent="space-between"
        borderRadius={18} paddingHorizontal={18} paddingVertical={20}
        style={{
          borderWidth: 2,
          borderColor:     selected ? C.primary : C.border,
          backgroundColor: selected ? `${C.primary}14` : C.bgCard,
        }}
      >
        <Stack flex={1} gap={4} paddingRight={10}>
          <Text variant="body" color={C.textPrimary} fontWeight="800" style={{ fontSize: 17 }}>{plan.label}</Text>
          <Text variant="caption" color={C.textMuted}>{plan.terms}</Text>
        </Stack>
        <Stack alignItems="flex-end" gap={2}>
          <Text color={C.textPrimary}>
            <Text color={C.textPrimary} fontWeight="800" style={{ fontSize: 22 }}>{plan.price}</Text>
            <Text variant="caption" color={C.textMuted}>{plan.unit}</Text>
          </Text>
          <Text variant="caption" color={C.textMuted}>{plan.subPrice}</Text>
          {plan.save && (
            <Stack backgroundColor={C.primaryBg} borderRadius={8} paddingHorizontal={8} paddingVertical={2} marginTop={2}>
              <Text variant="caption" color={C.primaryDark} fontWeight="700">{plan.save}</Text>
            </Stack>
          )}
        </Stack>
      </Stack>

      {popular && (
        <Stack position="absolute" top={-11} alignSelf="center"
          backgroundColor={MOST_POPULAR} borderRadius={10} paddingHorizontal={12} paddingVertical={3}
        >
          <Text style={{ fontSize: 11, color: '#FFF', fontWeight: '800', letterSpacing: 0.8 }}>MOST POPULAR</Text>
        </Stack>
      )}
    </TouchableOpacity>
  )
}

export default function PremiumScreen() {
  const C      = useColors()
  const isDark = useIsDark()
  const { isPremium, buyMonthly, buyYearly, restore, openWebSubscribe, refreshFromWeb } = usePremium()

  const [selected, setSelected] = useState<WebPlan>('monthly')
  const [showMore, setShowMore] = useState(false)
  const [awaitingWebReturn, setAwaitingWebReturn] = useState(false)
  const [rcBusy, setRcBusy] = useState(false)
  const appStateRef = useRef(AppState.currentState)

  const plan = [...PLANS, ...MORE_PLANS].find((p) => p.id === selected)!

  // Coming back from the browser without using the deep link (e.g. app switcher)
  useEffect(() => {
    const sub = AppState.addEventListener('change', async (nextState) => {
      if (appStateRef.current.match(/background|inactive/) && nextState === 'active' && awaitingWebReturn) {
        setAwaitingWebReturn(false)
        await refreshFromWeb().catch(() => false)
      }
      appStateRef.current = nextState
    })
    return () => sub.remove()
  }, [awaitingWebReturn, refreshFromWeb])

  const handleSubscribe = async () => {
    if (awaitingWebReturn) return
    setAwaitingWebReturn(true)
    await openWebSubscribe(plan.id)
    // If the browser never opened (signed out, no handler) don't leave the button stuck
    if (AppState.currentState === 'active') setTimeout(() => {
      if (AppState.currentState === 'active') setAwaitingWebReturn(false)
    }, 1500)
  }

  const handleApplePurchase = async () => {
    if (!plan.rcPlan || rcBusy) return
    setRcBusy(true)
    try {
      if (plan.rcPlan === 'yearly') await buyYearly()
      else await buyMonthly()
    } finally {
      setRcBusy(false)
    }
  }

  const statusBar = {
    statusBarStyle: (isDark ? 'light-content' : 'dark-content') as 'light-content' | 'dark-content',
    statusBarBackgroundColor: Platform.OS === 'android' ? C.bgCard : undefined,
  }

  if (isPremium) {
    return (
      <StyledPage flex={1} backgroundColor={C.bgCard} showStatusBar {...statusBar}>
        <Header C={C} />
        <Stack flex={1} alignItems="center" justifyContent="center" padding={32} gap={14}>
          <Text style={{ fontSize: 56, lineHeight: 68 }}>🌍</Text>
          <Text variant="header" color={C.textPrimary} fontWeight="800" textAlign="center">You're on Pro!</Text>
          <Text variant="body" color={C.textSecondary} textAlign="center">
            Enjoy unlimited translations and all Pro features.
          </Text>
          <TouchableOpacity onPress={close} activeOpacity={0.85}
            style={[styles.cta, { backgroundColor: C.primary, alignSelf: 'stretch', marginTop: 12 }]}
          >
            <Text variant="body" color="#FFF" fontWeight="800" style={{ fontSize: 17 }}>Start translating →</Text>
          </TouchableOpacity>
        </Stack>
      </StyledPage>
    )
  }

  const ctaLabel = plan.trialDays ? `Start Free ${plan.trialDays}-Day Trial →` : `Continue with ${plan.label} →`
  const footnote = plan.trialDays
    ? `Then ${plan.subPrice}. Cancel anytime before renewal.`
    : `${plan.subPrice}, renews automatically. Cancel anytime.`

  return (
    <StyledPage flex={1} backgroundColor={C.bgCard} showStatusBar {...statusBar}>
      <Header C={C} />

      <ScrollView showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 28, paddingBottom: 40 }}
      >
        {/* Hero */}
        <Stack alignItems="center" marginBottom={26}>
          <Text style={{ fontSize: 52, lineHeight: 64, marginBottom: 10 }}>🌍</Text>
          <Text variant="header" color={C.textPrimary} fontWeight="800" textAlign="center"
            style={{ fontSize: 28, lineHeight: 34, marginBottom: 10 }}
          >
            Speak every language,{'\n'}anywhere
          </Text>
          <Text variant="body" color={C.textMuted} textAlign="center" style={{ lineHeight: 22, paddingHorizontal: 8 }}>
            Unlimited translations, voice interpreter, camera translate, and more.
          </Text>
        </Stack>

        {/* Plans */}
        <Stack gap={14}>
          {PLANS.map((p) => (
            <PlanCard key={p.id} plan={p} C={C}
              popular={p.id === 'annual'}
              selected={selected === p.id}
              onPress={() => setSelected(p.id)}
            />
          ))}
          {showMore && MORE_PLANS.map((p) => (
            <PlanCard key={p.id} plan={p} C={C}
              selected={selected === p.id}
              onPress={() => setSelected(p.id)}
            />
          ))}
        </Stack>
        {!showMore && (
          <TouchableOpacity onPress={() => setShowMore(true)} activeOpacity={0.7} style={{ alignSelf: 'center', paddingVertical: 10 }}>
            <Text variant="caption" color={C.textSecondary} fontWeight="600">More plans: weekly & 3-month</Text>
          </TouchableOpacity>
        )}

        {/* Features */}
        <Stack gap={12} marginTop={showMore ? 22 : 12} marginBottom={26}>
          {FEATURES.map((f) => (
            <Stack key={f} horizontal alignItems="center" gap={14}>
              <Feather name="check" size={18} color={C.primary} />
              <Text variant="body" color={C.textSecondary} style={{ flex: 1 }}>{f}</Text>
            </Stack>
          ))}
        </Stack>

        {/* CTA */}
        <TouchableOpacity onPress={handleSubscribe} disabled={awaitingWebReturn} activeOpacity={0.85}
          style={[styles.cta, { backgroundColor: C.primary, opacity: awaitingWebReturn ? 0.7 : 1 }]}
        >
          {awaitingWebReturn ? (
            <Stack horizontal alignItems="center" gap={10}>
              <ActivityIndicator color="#FFF" />
              <Text variant="body" color="#FFF" fontWeight="800" style={{ fontSize: 17 }}>Checking subscription…</Text>
            </Stack>
          ) : (
            <Text variant="body" color="#FFF" fontWeight="800" style={{ fontSize: 18 }}>{ctaLabel}</Text>
          )}
        </TouchableOpacity>
        <Text variant="caption" color={C.textMuted} textAlign="center" style={{ marginTop: 12 }}>{footnote}</Text>
        <Stack horizontal alignItems="center" justifyContent="center" gap={6} marginTop={8}>
          <Feather name="lock" size={12} color={C.textMuted} />
          <Text variant="caption" color={C.textMuted}>Secure payment via Stripe</Text>
        </Stack>

        {/* Apple In-App Purchase — only when RevenueCat is configured */}
        {ENABLE_REVENUECAT && (
          <Stack alignItems="center" gap={10} marginTop={22}>
            {plan.rcPlan && (
              <TouchableOpacity onPress={handleApplePurchase} disabled={rcBusy} activeOpacity={0.85}
                style={[styles.appleBtn, { borderColor: C.border, backgroundColor: C.bgCard }]}
              >
                {rcBusy
                  ? <ActivityIndicator color={C.textPrimary} />
                  : <Text variant="body" color={C.textPrimary} fontWeight="700">Pay with Apple instead</Text>}
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={restore} activeOpacity={0.7}>
              <Text variant="caption" color={C.textMuted} fontWeight="600">Restore purchases</Text>
            </TouchableOpacity>
            <Text variant="caption" color={C.textMuted} textAlign="center" style={{ lineHeight: 18, paddingHorizontal: 8 }}>
              Apple purchases are charged to your Apple ID at confirmation. Subscriptions renew automatically unless
              auto-renew is turned off at least 24 hours before the end of the current period.
            </Text>
          </Stack>
        )}
      </ScrollView>
    </StyledPage>
  )
}

const styles = StyleSheet.create({
  backBtn: {
    width: 40, height: 40, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  cta: {
    borderRadius: 18,
    paddingVertical: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appleBtn: {
    alignSelf: 'stretch',
    borderRadius: 16, borderWidth: 1,
    paddingVertical: 15,
    alignItems: 'center',
  },
})
