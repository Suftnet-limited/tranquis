import React, { useEffect, useRef, useState } from 'react'
import {
  Platform,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  View,
  ActivityIndicator,
} from 'react-native'
import { AppState, Linking } from 'react-native'
import { router } from 'expo-router'
import { Feather } from '@expo/vector-icons'
import { StyledPage, Stack, toastService } from 'fluent-styles'
import { Text } from '../src/components/Text'
import { useColors, useIsDark } from '../src/constants'
import { usePremium } from '../src/hooks'
import { PRIVACY_URL, TERMS_URL } from '../src/constants/legal'
import { ENABLE_REVENUECAT } from '../src/constants/premium'
import type { PurchasesPackage } from 'react-native-purchases'

type Plan = 'annual' | 'monthly' | 'quarterly' | 'weekly'

const FEATURES = [
  'Unlimited text, voice & camera translations',
  'Live voice interpreter (two-way, real-time)',
  'Context & tone aware translations',
  'Unlimited phrasebook saves',
]

export default function PremiumScreen() {
  const C      = useColors()
  const isDark = useIsDark()
  const [selected, setSelected]           = useState<Plan>('monthly')
  const [loading, setLoading]             = useState(false)
  const [awaitingReturn, setAwaitingReturn] = useState(false)
  const appStateRef = useRef(AppState.currentState)

  const { isPremium, openWebSubscribe, refreshFromWeb, getOffering, buyPackage, restore } = usePremium()

  // Apple In-App Purchase via RevenueCat when enabled; otherwise Stripe web checkout
  const [packages, setPackages] = useState<Partial<Record<Plan, PurchasesPackage>>>({})
  useEffect(() => {
    if (ENABLE_REVENUECAT) getOffering().then(setPackages)
  }, [getOffering])

  // Live App Store prices when the offering has loaded, else the web checkout prices
  const price = (plan: Plan, fallback: string) => packages[plan]?.product.priceString ?? fallback
  const annualPerMonth = packages.annual?.product.pricePerMonthString ?? '£3.33'
  const annualSaving = (() => {
    const a = packages.annual?.product.price, m = packages.monthly?.product.price
    return a && m ? `Save ${Math.round((1 - a / (m * 12)) * 100)}%` : 'Save 33%'
  })()

  const TEAL   = '#3DBFA0'
  const TEAL_L = isDark ? '#0D2E29' : '#E8F8F5'
  const BG     = isDark ? C.bg : '#FFFFFF'
  const CARD   = isDark ? C.bgCard : '#FFFFFF'
  const BORDER = isDark ? C.border : '#E5E7EB'

  // When app returns to foreground after web checkout, refresh pro status
  useEffect(() => {
    const sub = AppState.addEventListener('change', async (nextState) => {
      if (appStateRef.current.match(/background|inactive/) && nextState === 'active' && awaitingReturn) {
        setAwaitingReturn(false)
        setLoading(false)
        try { await refreshFromWeb() } catch { /* silent */ }
      }
      appStateRef.current = nextState
    })
    return () => sub.remove()
  }, [awaitingReturn, refreshFromWeb])

  const handleSubscribe = async () => {
    if (ENABLE_REVENUECAT) {
      const pkg = packages[selected]
      if (!pkg) {
        toastService.error('Plan unavailable', 'This plan could not be loaded from the App Store. Please try again.')
        return
      }
      setLoading(true)
      try { await buyPackage(pkg) } finally { setLoading(false) }
      return
    }
    setLoading(true)
    setAwaitingReturn(true)
    await openWebSubscribe(selected)
    // loading stays true until app returns to foreground
  }

  if (isPremium) {
    return (
      <StyledPage flex={1} backgroundColor={BG} showStatusBar
        statusBarStyle={isDark ? 'light-content' : 'dark-content'}
      >
        <Stack flex={1} alignItems="center" justifyContent="center" padding={32} gap={16}>
          <Text style={{ fontSize: 56, lineHeight: 70 }}>🌍</Text>
          <Text variant="header" color={C.textPrimary} fontWeight="800" textAlign="center">
            You're on Pro!
          </Text>
          <Text variant="body" color={C.textSecondary} textAlign="center">
            Enjoy unlimited translations and all Pro features.
          </Text>
          <TouchableOpacity
            onPress={() => router.back()}
            style={[styles.ctaBtn, { backgroundColor: TEAL }]}
            activeOpacity={0.85}
          >
            <Text variant="body" color="#FFF" fontWeight="700">Go back</Text>
          </TouchableOpacity>
        </Stack>
      </StyledPage>
    )
  }

  return (
    <StyledPage flex={1} backgroundColor={BG} showStatusBar
      statusBarStyle={isDark ? 'light-content' : 'dark-content'}
      statusBarBackgroundColor={Platform.OS === 'android' ? BG : undefined}
    >
      {/* ── Header bar — outside the ScrollView so it stays put; StyledPage already clears the status bar ── */}
      <Stack
        horizontal alignItems="center" gap={14} paddingHorizontal={20} paddingVertical={12}
        style={{ borderBottomWidth: 1, borderBottomColor: BORDER }}
      >
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7} hitSlop={8}
          style={[styles.backBtn, { backgroundColor: isDark ? C.bgInput : '#F3F4F6' }]}
        >
          <Feather name="chevron-left" size={22} color={isDark ? '#FFF' : '#111'} />
        </TouchableOpacity>
        <Stack gap={2}>
          <Text variant="body" color={C.textPrimary} fontWeight="800" style={{ fontSize: 18 }}>
            Tranquis Pro
          </Text>
          <Text variant="caption" color={C.textSecondary}>Unlock everything</Text>
        </Stack>
      </Stack>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 48 }}
      >

        <Stack paddingHorizontal={20} paddingTop={28} gap={0}>

          {/* ── Globe hero ── */}
          <Stack alignItems="center" gap={14} marginBottom={28}>
            <Text style={{ fontSize: 64, lineHeight: 80 }}>🌍</Text>
            <Text
              variant="header" fontWeight="800" textAlign="center" color={C.textPrimary}
              style={{ fontSize: 26, lineHeight: 34 }}
            >
              Speak every language,{'\n'}anywhere
            </Text>
            <Text variant="body" color={C.textSecondary} textAlign="center" style={{ lineHeight: 22 }}>
              Unlimited translations, voice interpreter,{'\n'}camera translate, and more.
            </Text>
          </Stack>

          {/* ── Plan cards ── */}
          <Stack gap={12} marginBottom={20}>

            {/* Annual — Most Popular */}
            <View>
              <Stack alignItems="center" marginBottom={-12} style={{ zIndex: 1 }}>
                <Stack backgroundColor="#6C63FF" borderRadius={20} paddingHorizontal={16} paddingVertical={5}>
                  <Text style={{ fontSize: 11, color: '#FFF', fontWeight: '700', letterSpacing: 0.5 }}>
                    MOST POPULAR
                  </Text>
                </Stack>
              </Stack>
              <TouchableOpacity onPress={() => setSelected('annual')} activeOpacity={0.85}>
                <Stack borderRadius={16} padding={18} paddingTop={24} backgroundColor={CARD}
                  style={[styles.planCard, { borderColor: selected === 'annual' ? '#6C63FF' : BORDER, borderWidth: selected === 'annual' ? 2 : 1 }]}
                >
                  <Stack horizontal alignItems="center" justifyContent="space-between">
                    <Stack gap={4}>
                      <Text variant="body" color={C.textPrimary} fontWeight="800" style={{ fontSize: 16 }}>Pro Annual</Text>
                      <Text variant="caption" color={C.textSecondary}>Billed annually · cancel anytime</Text>
                    </Stack>
                    <Stack alignItems="flex-end" gap={2}>
                      <Stack horizontal alignItems="baseline" gap={2}>
                        <Text style={{ fontSize: 22, fontWeight: '800', color: C.textPrimary }}>{annualPerMonth}</Text>
                        <Text variant="caption" color={C.textSecondary}>/mo</Text>
                      </Stack>
                      <Text variant="caption" color={C.textSecondary}>{price('annual', '£39.99')}/year</Text>
                      <Stack backgroundColor={isDark ? '#14532d' : '#DCFCE7'} borderRadius={6} paddingHorizontal={8} paddingVertical={3}>
                        <Text style={{ fontSize: 11, color: '#16A34A', fontWeight: '700' }}>{annualSaving}</Text>
                      </Stack>
                    </Stack>
                  </Stack>
                </Stack>
              </TouchableOpacity>
            </View>

            {/* Monthly — 7-day trial */}
            <TouchableOpacity onPress={() => setSelected('monthly')} activeOpacity={0.85}>
              <Stack borderRadius={16} padding={18}
                backgroundColor={selected === 'monthly' ? TEAL_L : CARD}
                style={[styles.planCard, { borderColor: selected === 'monthly' ? TEAL : BORDER, borderWidth: selected === 'monthly' ? 2 : 1 }]}
              >
                <Stack horizontal alignItems="center" justifyContent="space-between">
                  <Stack gap={4}>
                    <Stack horizontal alignItems="center" gap={8}>
                      <Text variant="body" color={C.textPrimary} fontWeight="800" style={{ fontSize: 16 }}>Pro Monthly</Text>
                      <Stack backgroundColor={`${TEAL}25`} borderRadius={6} paddingHorizontal={8} paddingVertical={3}>
                        <Text style={{ fontSize: 10, color: TEAL, fontWeight: '700' }}>7-DAY TRIAL</Text>
                      </Stack>
                    </Stack>
                    <Text variant="caption" color={C.textSecondary}>Billed monthly · cancel anytime</Text>
                  </Stack>
                  <Stack alignItems="flex-end" gap={2}>
                    <Stack horizontal alignItems="baseline" gap={2}>
                      <Text style={{ fontSize: 22, fontWeight: '800', color: C.textPrimary }}>{price('monthly', '£4.99')}</Text>
                      <Text variant="caption" color={C.textSecondary}>/mo</Text>
                    </Stack>
                    <Text variant="caption" color={C.textSecondary}>{price('monthly', '£4.99')}/month</Text>
                  </Stack>
                </Stack>
              </Stack>
            </TouchableOpacity>

            {/* 3-Month */}
            <TouchableOpacity onPress={() => setSelected('quarterly')} activeOpacity={0.85}>
              <Stack borderRadius={16} padding={18}
                backgroundColor={selected === 'quarterly' ? TEAL_L : CARD}
                style={[styles.planCard, { borderColor: selected === 'quarterly' ? TEAL : BORDER, borderWidth: selected === 'quarterly' ? 2 : 1 }]}
              >
                <Stack horizontal alignItems="center" justifyContent="space-between">
                  <Stack gap={4}>
                    <Text variant="body" color={C.textPrimary} fontWeight="800" style={{ fontSize: 16 }}>3-Month</Text>
                    <Text variant="caption" color={C.textSecondary}>Every 3 months · cancel anytime</Text>
                  </Stack>
                  <Stack alignItems="flex-end" gap={2}>
                    <Stack horizontal alignItems="baseline" gap={2}>
                      <Text style={{ fontSize: 22, fontWeight: '800', color: C.textPrimary }}>{price('quarterly', '£9.99')}</Text>
                    </Stack>
                    <Text variant="caption" color={C.textSecondary}>every 3 months</Text>
                  </Stack>
                </Stack>
              </Stack>
            </TouchableOpacity>

            {/* Weekly */}
            <TouchableOpacity onPress={() => setSelected('weekly')} activeOpacity={0.85}>
              <Stack borderRadius={16} padding={18}
                backgroundColor={selected === 'weekly' ? TEAL_L : CARD}
                style={[styles.planCard, { borderColor: selected === 'weekly' ? TEAL : BORDER, borderWidth: selected === 'weekly' ? 2 : 1 }]}
              >
                <Stack horizontal alignItems="center" justifyContent="space-between">
                  <Stack gap={4}>
                    <Text variant="body" color={C.textPrimary} fontWeight="800" style={{ fontSize: 16 }}>Weekly</Text>
                    <Text variant="caption" color={C.textSecondary}>Billed weekly · cancel anytime</Text>
                  </Stack>
                  <Stack alignItems="flex-end" gap={2}>
                    <Stack horizontal alignItems="baseline" gap={2}>
                      <Text style={{ fontSize: 22, fontWeight: '800', color: C.textPrimary }}>{price('weekly', '£1.99')}</Text>
                    </Stack>
                    <Text variant="caption" color={C.textSecondary}>per week</Text>
                  </Stack>
                </Stack>
              </Stack>
            </TouchableOpacity>
          </Stack>

          {/* ── Feature checklist ── */}
          <Stack gap={14} marginBottom={28}>
            {FEATURES.map((f) => (
              <Stack key={f} horizontal alignItems="center" gap={12}>
                <Feather name="check" size={16} color={TEAL} />
                <Text variant="body" color={C.textPrimary} style={{ flex: 1, fontSize: 15 }}>{f}</Text>
              </Stack>
            ))}
          </Stack>

          {/* ── CTA button ── */}
          <TouchableOpacity
            onPress={handleSubscribe}
            disabled={loading}
            activeOpacity={0.85}
            style={[styles.ctaBtn, { backgroundColor: TEAL, opacity: loading ? 0.7 : 1 }]}
          >
            {loading
              ? <ActivityIndicator color="#FFF" />
              : <Text variant="body" color="#FFF" fontWeight="800" style={{ fontSize: 17 }}>
                  {selected === 'monthly' ? 'Start Free 7-Day Trial →'
                    : selected === 'annual' ? 'Start Annual Plan →'
                    : selected === 'quarterly' ? 'Start 3-Month Plan →'
                    : 'Start Weekly Plan →'}
                </Text>
            }
          </TouchableOpacity>

          <Text variant="caption" color={C.textSecondary} textAlign="center" style={{ marginTop: 10, lineHeight: 18 }}>
            {selected === 'monthly'   ? `7-day free trial, then ${price('monthly', '£4.99')}/month.`
              : selected === 'annual'   ? `${price('annual', '£39.99')}/year.`
              : selected === 'quarterly' ? `${price('quarterly', '£9.99')} every 3 months.`
              : `${price('weekly', '£1.99')}/week.`}
            {' '}Renews automatically unless cancelled at least 24 hours before the end of the current period.
            {ENABLE_REVENUECAT
              ? ' Manage or cancel in Settings → your name → Subscriptions.'
              : ' Cancel anytime by contacting support.'}
          </Text>

          {ENABLE_REVENUECAT ? (
            <Stack alignItems="center" gap={8} marginTop={16}>
              <TouchableOpacity onPress={restore} activeOpacity={0.7} hitSlop={8}>
                <Text variant="caption" color={TEAL} fontWeight="700">Restore Purchases</Text>
              </TouchableOpacity>
              <Text variant="caption" color={C.textMuted} textAlign="center">
                Payment charged to your Apple ID at confirmation.
              </Text>
            </Stack>
          ) : (
            /* Stripe trust note */
            <Stack horizontal alignItems="center" justifyContent="center" gap={6} marginTop={16}>
              <Feather name="lock" size={13} color={C.textMuted} />
              <Text variant="caption" color={C.textMuted} fontWeight="500">
                Secure payment via Stripe
              </Text>
            </Stack>
          )}

          {/* Required by App Store guideline 3.1.2 — functional links to the privacy policy and terms (EULA) */}
          <Stack horizontal alignItems="center" justifyContent="center" gap={8} marginTop={12}>
            <Text variant="caption" color={TEAL} fontWeight="600" onPress={() => Linking.openURL(PRIVACY_URL)}>
              Privacy Policy
            </Text>
            <Text variant="caption" color={C.textMuted}>•</Text>
            <Text variant="caption" color={TEAL} fontWeight="600" onPress={() => Linking.openURL(TERMS_URL)}>
              Terms of Use
            </Text>
          </Stack>

        </Stack>
      </ScrollView>
    </StyledPage>
  )
}

const styles = StyleSheet.create({
  backBtn: {
    width: 40, height: 40, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  planCard: {
    position: 'relative',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  ctaBtn: {
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    shadowColor: '#3DBFA0',
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
})
