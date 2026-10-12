import React, { useEffect, useRef, useState } from 'react'
import { AppState, Platform, TouchableOpacity, ScrollView, StyleSheet } from 'react-native'
import { router } from 'expo-router'
import { Feather } from '@expo/vector-icons'
import { StyledPage, Stack } from 'fluent-styles'
import { Text } from '../src/components/Text'
import { useColors, useIsDark } from '../src/constants'
import { usePremium } from '../src/hooks'
import { ENABLE_REVENUECAT } from '../src/constants/premium'

type RcPlan = 'yearly' | 'monthly'

type WebPlan = 'weekly' | 'monthly' | 'quarterly' | 'annual'

const WEB_PLANS: { id: WebPlan; label: string; price: string; period: string; badge?: string }[] = [
  { id: 'weekly',    label: 'Weekly',    price: '£1.99',  period: 'per week' },
  { id: 'monthly',   label: 'Monthly',   price: '£4.99',  period: 'per month', badge: '7-day free trial' },
  { id: 'quarterly', label: '3-Month',   price: '£9.99',  period: 'every 3 months' },
  { id: 'annual',    label: 'Annual',    price: '£29.99', period: 'per year', badge: 'Best Value' },
]

const FEATURES = [
  'Unlimited translations — no daily limits',
  'Live voice interpreter in real time',
  'Camera & OCR translation',
  'Text-to-speech playback',
  'Unlimited phrasebook',
  '20+ languages including rare & regional',
]

const BADGE = '#7C3AED'

// The Stripe success deep link can open this screen with nothing behind it
const close = () => (router.canGoBack() ? router.back() : router.replace('/'))

type Colors = ReturnType<typeof useColors>

function Header({ C }: { C: Colors }) {
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

/** Plan card in the mock's style: floating badge, label + terms left, price right. */
function PlanCard({ label, terms, price, sub, badge, highlighted, onPress, disabled, overlay, C }: {
  label: string; terms: string; price: string; sub?: string; badge?: string
  highlighted: boolean; onPress: () => void; disabled?: boolean; overlay?: string; C: Colors
}) {
  return (
    <TouchableOpacity onPress={onPress} disabled={disabled} activeOpacity={0.85}
      style={{ marginTop: badge ? 10 : 0 }}
    >
      <Stack
        horizontal alignItems="center" justifyContent="space-between"
        borderRadius={18} paddingHorizontal={18} paddingVertical={20}
        style={{
          borderWidth: 2,
          borderColor:     highlighted ? C.primary : C.border,
          backgroundColor: highlighted ? `${C.primary}14` : C.bgCard,
        }}
      >
        <Stack flex={1} gap={4} paddingRight={10}>
          <Text variant="body" color={C.textPrimary} fontWeight="800" style={{ fontSize: 17 }}>{label}</Text>
          <Text variant="caption" color={C.textMuted}>{terms}</Text>
        </Stack>
        <Stack alignItems="flex-end" gap={2}>
          <Text color={C.textPrimary} fontWeight="800" style={{ fontSize: 22 }}>{price}</Text>
          {sub && <Text variant="caption" color={C.textMuted}>{sub}</Text>}
        </Stack>

        {overlay && (
          <Stack
            position="absolute" top={0} left={0} right={0} bottom={0}
            borderRadius={16} alignItems="center" justifyContent="center"
            style={{ backgroundColor: `${C.bgCard}CC` }}
          >
            <Text variant="caption" color={C.primary} fontWeight="600">{overlay}</Text>
          </Stack>
        )}
      </Stack>

      {badge && (
        <Stack position="absolute" top={-11} alignSelf="center"
          backgroundColor={BADGE} borderRadius={10} paddingHorizontal={12} paddingVertical={3}
        >
          <Text style={{ fontSize: 11, color: '#FFF', fontWeight: '800', letterSpacing: 0.8 }}>{badge.toUpperCase()}</Text>
        </Stack>
      )}
    </TouchableOpacity>
  )
}

export default function PremiumScreen() {
  const C      = useColors()
  const isDark = useIsDark()
  const [loading, setLoading] = useState(false)
  const { isPremium, buyMonthly, buyYearly, restore, openWebSubscribe, refreshFromWeb } = usePremium()

  const [rcPlan, setRcPlan] = useState<RcPlan>('yearly')
  const [awaitingWebReturn, setAwaitingWebReturn] = useState(false)
  const appStateRef = useRef(AppState.currentState)

  useEffect(() => {
    const sub = AppState.addEventListener('change', async (nextState) => {
      if (appStateRef.current.match(/background|inactive/) && nextState === 'active' && awaitingWebReturn) {
        setAwaitingWebReturn(false)
        try {
          await refreshFromWeb()
        } catch {
          // silent
        }
      }
      appStateRef.current = nextState
    })
    return () => sub.remove()
  }, [awaitingWebReturn, refreshFromWeb])

  const handleWebSubscribe = async (plan: WebPlan) => {
    setAwaitingWebReturn(true)
    // Set before opening so the AppState listener catches the trip to the browser;
    // undo it if the browser never opened (signed out, bad URL)
    const opened = await openWebSubscribe(plan)
    if (!opened) setAwaitingWebReturn(false)
  }

  const handleRcPurchase = () => {
    if (rcPlan === 'yearly') buyYearly()
    else buyMonthly()
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
          <Text variant="header" color={C.textPrimary} fontWeight="800" textAlign="center">
            You're on Pro!
          </Text>
          <Text variant="body" color={C.textSecondary} textAlign="center">
            Enjoy unlimited translations and all Pro features.
          </Text>
          <TouchableOpacity onPress={close} activeOpacity={0.85}
            style={[styles.cta, { backgroundColor: C.primary, alignSelf: 'stretch', marginTop: 12 }]}
          >
            <Text variant="body" color="#FFF" fontWeight="800" style={{ fontSize: 17 }}>Go back</Text>
          </TouchableOpacity>
        </Stack>
      </StyledPage>
    )
  }

  return (
    <StyledPage flex={1} backgroundColor={C.bgCard} showStatusBar {...statusBar}>
      <Header C={C} />

      <ScrollView showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 28, paddingBottom: 48 }}
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
            Translate freely, anywhere in the world
          </Text>
        </Stack>

        {/* ── Web subscription plans (primary / always visible) — tap a plan to open Stripe checkout ── */}
        <Stack gap={14} marginBottom={24}>
          {WEB_PLANS.map((p) => (
            <PlanCard key={p.id} C={C}
              label={p.label}
              terms={p.period}
              price={p.price}
              badge={p.badge}
              highlighted={p.id === 'annual'}
              disabled={awaitingWebReturn}
              overlay={awaitingWebReturn ? 'Checking subscription…' : undefined}
              onPress={() => !awaitingWebReturn && handleWebSubscribe(p.id)}
            />
          ))}
        </Stack>

        {/* Feature checklist */}
        <Stack gap={12} marginBottom={24}>
          {FEATURES.map((feature) => (
            <Stack key={feature} horizontal alignItems="center" gap={14}>
              <Feather name="check" size={18} color={C.primary} />
              <Text variant="body" color={C.textSecondary} style={{ flex: 1 }}>{feature}</Text>
            </Stack>
          ))}
        </Stack>

        {/* Stripe trust note */}
        <Stack horizontal alignItems="center" justifyContent="center" gap={6}>
          <Feather name="lock" size={13} color={C.textMuted} />
          <Text variant="caption" color={C.textMuted} fontWeight="500">
            Secure payment via Stripe
          </Text>
        </Stack>

        {/* ── RevenueCat / Apple IAP section (gated) ── */}
        {ENABLE_REVENUECAT && (
          <Stack gap={14} marginTop={28}>
            <Text variant="bodySmall" color={C.textSecondary} fontWeight="700" textAlign="center">
              Or pay with Apple Pay
            </Text>

            <PlanCard C={C}
              label="Pro Annual"
              terms="£3.33/mo · billed annually"
              price="£39.99"
              sub="Save 33%"
              badge="Most Popular"
              highlighted={rcPlan === 'yearly'}
              onPress={() => setRcPlan('yearly')}
            />
            <PlanCard C={C}
              label="Pro Monthly"
              terms="Billed monthly"
              price="£4.99"
              sub="per month"
              highlighted={rcPlan === 'monthly'}
              onPress={() => setRcPlan('monthly')}
            />

            <TouchableOpacity
              onPress={handleRcPurchase}
              disabled={loading}
              activeOpacity={0.85}
              style={[styles.cta, { backgroundColor: C.primary }]}
            >
              <Text variant="body" color="#FFF" fontWeight="800" style={{ fontSize: 18 }}>
                Start Free 7-Day Trial →
              </Text>
            </TouchableOpacity>
            <Text variant="caption" color={C.textMuted} textAlign="center">
              {rcPlan === 'yearly' ? '£39.99/year after trial · ' : '£4.99/month after trial · '}
              Cancel anytime
            </Text>

            {/* Restore — only with RevenueCat */}
            <TouchableOpacity onPress={restore} activeOpacity={0.7} style={{ alignSelf: 'center' }}>
              <Text variant="caption" color={C.textMuted} fontWeight="600">Restore purchases</Text>
            </TouchableOpacity>

            {/* Apple legal copy */}
            <Text
              variant="caption"
              color={C.textMuted}
              textAlign="center"
              style={{ lineHeight: 18, paddingHorizontal: 8 }}
            >
              Payment charged to your Apple ID account at confirmation of purchase. Subscription automatically
              renews unless auto-renew is turned off at least 24 hours before the end of the current period.
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
})
