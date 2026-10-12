import React, { useEffect, useRef, useState } from 'react'
import { AppState, Platform, TouchableOpacity, ScrollView, StyleSheet } from 'react-native'
import { router } from 'expo-router'
import { Feather } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { StyledPage, Stack, StyledPressable } from 'fluent-styles'
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
    await openWebSubscribe(plan)
  }

  const handleRcPurchase = () => {
    if (rcPlan === 'yearly') buyYearly()
    else buyMonthly()
  }

  if (isPremium) {
    return (
      <StyledPage flex={1} backgroundColor={C.bg} showStatusBar
        statusBarStyle={isDark ? 'light-content' : 'dark-content'}
      >
        <Stack flex={1} alignItems="center" justifyContent="center" padding={32} gap={16}>
          <Text style={{ fontSize: 56 }}>🌍</Text>
          <Text variant="header" color={C.textPrimary} fontWeight="800" textAlign="center">
            You're on Pro!
          </Text>
          <Text variant="body" color={C.textSecondary} textAlign="center">
            Enjoy unlimited translations and all Pro features.
          </Text>
          <TouchableOpacity
            onPress={() => router.back()}
            style={[styles.backBtn, { backgroundColor: C.primary }]}
            activeOpacity={0.8}
          >
            <Text variant="body" color="#FFF" fontWeight="700">Go back</Text>
          </TouchableOpacity>
        </Stack>
      </StyledPage>
    )
  }

  return (
    <StyledPage flex={1} backgroundColor={C.bg} showStatusBar
      statusBarStyle="light-content"
      statusBarBackgroundColor={Platform.OS === 'android' ? '#0A1628' : undefined}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 48 }}
      >
        {/* Hero gradient */}
        <LinearGradient
          colors={['#0A1628', '#0F2040', '#112236']}
          style={styles.hero}
        >
          {/* Close */}
          <StyledPressable onPress={() => router.back()}
            style={[styles.closeBtn, { backgroundColor: 'rgba(255,255,255,0.12)' }]}
          >
            <Feather name="x" size={20} color="#FFF" />
          </StyledPressable>

          <Stack alignItems="center" gap={16} paddingTop={48} paddingBottom={36}>
            <Text style={{ fontSize: 72 }}>🌍</Text>
            <Stack alignItems="center" gap={8}>
              <Text
                variant="header"
                fontWeight="800"
                textAlign="center"
                style={{ color: '#FFF', fontSize: 26, lineHeight: 34 }}
              >
                Go Premium
              </Text>
              <Text variant="body" textAlign="center" style={{ color: 'rgba(255,255,255,0.75)' }}>
                Translate freely, anywhere in the world
              </Text>
            </Stack>
          </Stack>
        </LinearGradient>

        <Stack paddingHorizontal={20} paddingTop={24} gap={0}>

          {/* ── Web subscription plans (primary / always visible) ── */}
          <Stack gap={12} marginBottom={24}>
            {WEB_PLANS.map((p) => (
              <TouchableOpacity
                key={p.id}
                onPress={() => !awaitingWebReturn && handleWebSubscribe(p.id)}
                activeOpacity={0.85}
                disabled={awaitingWebReturn}
              >
                <Stack
                  borderRadius={18} padding={18}
                  style={[
                    styles.planCard,
                    {
                      borderColor: p.id === 'annual' ? C.primary : C.border,
                      borderWidth: p.id === 'annual' ? 2 : 1,
                      backgroundColor: p.id === 'annual' ? `${C.primary}10` : C.bgCard,
                    },
                  ]}
                >
                  <Stack horizontal alignItems="center" justifyContent="space-between">
                    <Stack gap={3}>
                      <Stack horizontal alignItems="center" gap={8}>
                        <Text variant="body" color={C.textPrimary} fontWeight="800">{p.label}</Text>
                        {p.badge && (
                          <Stack
                            backgroundColor={p.id === 'annual' ? C.primary : `${C.primary}25`}
                            borderRadius={6} paddingHorizontal={8} paddingVertical={3}
                          >
                            <Text style={{ fontSize: 10, color: p.id === 'annual' ? '#FFF' : C.primary, fontWeight: '700', letterSpacing: 0.4 }}>
                              {p.badge.toUpperCase()}
                            </Text>
                          </Stack>
                        )}
                      </Stack>
                      <Text variant="caption" color={C.textMuted}>{p.period}</Text>
                    </Stack>
                    <Stack horizontal alignItems="center" gap={10}>
                      <Stack alignItems="flex-end">
                        <Text variant="title" color={p.id === 'annual' ? C.primary : C.textPrimary} fontWeight="800">
                          {p.price}
                        </Text>
                      </Stack>
                      <Stack
                        width={32} height={32} borderRadius={16}
                        alignItems="center" justifyContent="center"
                        backgroundColor={`${C.primary}15`}
                      >
                        <Feather name="arrow-right" size={16} color={C.primary} />
                      </Stack>
                    </Stack>
                  </Stack>

                  {awaitingWebReturn && (
                    <Stack
                      position="absolute" top={0} left={0} right={0} bottom={0}
                      borderRadius={18}
                      alignItems="center" justifyContent="center"
                      style={{ backgroundColor: `${C.bg}CC` }}
                    >
                      <Text variant="caption" color={C.primary} fontWeight="600">Checking subscription…</Text>
                    </Stack>
                  )}
                </Stack>
              </TouchableOpacity>
            ))}
          </Stack>

          {/* Stripe trust note */}
          <Stack horizontal alignItems="center" justifyContent="center" gap={6} marginBottom={28}>
            <Feather name="lock" size={13} color={C.textMuted} />
            <Text variant="caption" color={C.textMuted} fontWeight="500">
              Secure payment via Stripe
            </Text>
          </Stack>

          {/* Feature checklist */}
          <Stack
            backgroundColor={C.bgCard} borderRadius={18} padding={18} marginBottom={24}
            gap={14}
            style={{ borderWidth: 1, borderColor: C.border }}
          >
            {FEATURES.map((feature) => (
              <Stack key={feature} horizontal alignItems="center" gap={12}>
                <Stack
                  width={22} height={22} borderRadius={11}
                  alignItems="center" justifyContent="center"
                  backgroundColor={`${C.primary}20`}
                >
                  <Feather name="check" size={13} color={C.primary} />
                </Stack>
                <Text variant="bodySmall" color={C.textPrimary} fontWeight="500" style={{ flex: 1 }}>
                  {feature}
                </Text>
              </Stack>
            ))}
          </Stack>

          {/* ── RevenueCat / Apple IAP section (gated) ── */}
          {ENABLE_REVENUECAT && (
            <Stack gap={12} marginBottom={24}>
              <Text variant="bodySmall" color={C.textSecondary} fontWeight="700" textAlign="center">
                Or pay with Apple Pay
              </Text>

              {/* Annual RC card */}
              <TouchableOpacity onPress={() => setRcPlan('yearly')} activeOpacity={0.85}>
                <Stack
                  borderRadius={18} padding={18}
                  style={[styles.planCard, {
                    borderColor: rcPlan === 'yearly' ? C.primary : C.border,
                    borderWidth: rcPlan === 'yearly' ? 2 : 1,
                    backgroundColor: rcPlan === 'yearly' ? `${C.primary}10` : C.bgCard,
                  }]}
                >
                  <Stack horizontal alignItems="center" justifyContent="space-between">
                    <Stack gap={3}>
                      <Stack horizontal alignItems="center" gap={10}>
                        <Text variant="body" color={C.textPrimary} fontWeight="800">Pro Annual</Text>
                        <Stack backgroundColor={C.primary} borderRadius={6} paddingHorizontal={8} paddingVertical={3}>
                          <Text style={{ fontSize: 10, color: '#FFF', fontWeight: '700', letterSpacing: 0.5 }}>MOST POPULAR</Text>
                        </Stack>
                      </Stack>
                      <Text variant="caption" color={C.textMuted}>£3.33/mo · billed annually</Text>
                    </Stack>
                    <Stack alignItems="flex-end" gap={2}>
                      <Text variant="title" color={C.primary} fontWeight="800">£39.99</Text>
                      <Text variant="caption" color="#22C55E" fontWeight="600">Save 33%</Text>
                    </Stack>
                  </Stack>
                  <Stack position="absolute" top={18} right={16}>
                    <Stack
                      width={22} height={22} borderRadius={11}
                      alignItems="center" justifyContent="center"
                      backgroundColor={rcPlan === 'yearly' ? C.primary : 'transparent'}
                      style={{ borderWidth: 2, borderColor: rcPlan === 'yearly' ? C.primary : C.border }}
                    >
                      {rcPlan === 'yearly' && <Stack width={8} height={8} borderRadius={4} backgroundColor="#FFF" />}
                    </Stack>
                  </Stack>
                </Stack>
              </TouchableOpacity>

              {/* Monthly RC card */}
              <TouchableOpacity onPress={() => setRcPlan('monthly')} activeOpacity={0.85}>
                <Stack
                  borderRadius={18} padding={18}
                  style={[styles.planCard, {
                    borderColor: rcPlan === 'monthly' ? C.primary : C.border,
                    borderWidth: rcPlan === 'monthly' ? 2 : 1,
                    backgroundColor: rcPlan === 'monthly' ? `${C.primary}10` : C.bgCard,
                  }]}
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
                      backgroundColor={rcPlan === 'monthly' ? C.primary : 'transparent'}
                      style={{ borderWidth: 2, borderColor: rcPlan === 'monthly' ? C.primary : C.border }}
                    >
                      {rcPlan === 'monthly' && <Stack width={8} height={8} borderRadius={4} backgroundColor="#FFF" />}
                    </Stack>
                  </Stack>
                </Stack>
              </TouchableOpacity>

              {/* RC CTA */}
              <TouchableOpacity
                onPress={handleRcPurchase}
                disabled={loading}
                activeOpacity={0.85}
                style={[styles.ctaBtn, { backgroundColor: C.primary }]}
              >
                <Text variant="body" color="#FFF" fontWeight="800">
                  Start Free 7-Day Trial →
                </Text>
              </TouchableOpacity>
              <Text variant="caption" color={C.textMuted} textAlign="center" style={{ marginTop: 6 }}>
                {rcPlan === 'yearly' ? '£39.99/year after trial · ' : '£4.99/month after trial · '}
                Cancel anytime
              </Text>

              {/* Restore — only with RevenueCat */}
              <TouchableOpacity onPress={restore} activeOpacity={0.7} style={{ alignSelf: 'center', marginTop: 4 }}>
                <Text variant="caption" color={C.textMuted} fontWeight="600">Restore purchases</Text>
              </TouchableOpacity>

              {/* Apple legal copy */}
              <Text
                variant="caption"
                color={C.textMuted}
                textAlign="center"
                style={{ marginTop: 12, lineHeight: 18, paddingHorizontal: 8 }}
              >
                Payment charged to your Apple ID account at confirmation of purchase. Subscription automatically
                renews unless auto-renew is turned off at least 24 hours before the end of the current period.
              </Text>
            </Stack>
          )}
        </Stack>
      </ScrollView>
    </StyledPage>
  )
}

const styles = StyleSheet.create({
  hero: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  closeBtn: {
    position: 'absolute',
    top: 52, right: 20,
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
    zIndex: 10,
  },
  planCard: {
    position: 'relative',
  },
  ctaBtn: {
    borderRadius: 20,
    paddingVertical: 18,
    alignItems: 'center',
    shadowColor: '#14B8A6',
    shadowOpacity: 0.4,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  backBtn: {
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 32,
    marginTop: 8,
  },
})
