import React, { useState } from 'react'
import { Platform, TouchableOpacity, ScrollView, StyleSheet } from 'react-native'
import { router } from 'expo-router'
import { Feather } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { StyledPage, Stack, StyledPressable } from 'fluent-styles'
import { Text } from '../src/components/Text'
import { useColors, useIsDark } from '../src/constants'
import { usePremium } from '../src/hooks'

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
        {/* Hero gradient — dark blue */}
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

          {/* Globe emoji hero */}
          <Stack alignItems="center" gap={16} paddingTop={48} paddingBottom={36}>
            <Text style={{ fontSize: 72 }}>🌍</Text>
            <Stack alignItems="center" gap={8}>
              <Text
                variant="header"
                fontWeight="800"
                textAlign="center"
                style={{ color: '#FFF', fontSize: 26, lineHeight: 34 }}
              >
                Speak every language,{'\n'}anywhere
              </Text>
              <Text variant="body" textAlign="center" style={{ color: 'rgba(255,255,255,0.6)' }}>
                Unlock the full Tranquis experience
              </Text>
            </Stack>
          </Stack>
        </LinearGradient>

        <Stack paddingHorizontal={20} paddingTop={24} gap={0}>

          {/* Plan selector */}
          <Stack gap={12} marginBottom={24}>
            {/* Annual — first, with MOST POPULAR badge */}
            <TouchableOpacity
              onPress={() => setPlan('yearly')}
              activeOpacity={0.85}
            >
              <Stack
                borderRadius={18} padding={18}
                style={[
                  styles.planCard,
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
                        <Text style={{ fontSize: 10, color: '#FFF', fontWeight: '700', letterSpacing: 0.5 }}>
                          MOST POPULAR
                        </Text>
                      </Stack>
                    </Stack>
                    <Text variant="caption" color={C.textMuted}>£3.33/mo · billed annually</Text>
                  </Stack>
                  <Stack alignItems="flex-end" gap={2}>
                    <Text variant="title" color={C.primary} fontWeight="800">£39.99</Text>
                    <Text variant="caption" color="#22C55E" fontWeight="600">Save 33%</Text>
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
                    {plan === 'yearly' && <Stack width={8} height={8} borderRadius={4} backgroundColor="#FFF" />}
                  </Stack>
                </Stack>
              </Stack>
            </TouchableOpacity>

            {/* Monthly */}
            <TouchableOpacity
              onPress={() => setPlan('monthly')}
              activeOpacity={0.85}
            >
              <Stack
                borderRadius={18} padding={18}
                style={[
                  styles.planCard,
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
                    {plan === 'monthly' && <Stack width={8} height={8} borderRadius={4} backgroundColor="#FFF" />}
                  </Stack>
                </Stack>
              </Stack>
            </TouchableOpacity>
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

          {/* CTA button */}
          <TouchableOpacity
            onPress={handlePurchase}
            disabled={loading}
            activeOpacity={0.85}
            style={[styles.ctaBtn, { backgroundColor: C.primary }]}
          >
            <Text variant="body" color="#FFF" fontWeight="800">
              Start Free 7-Day Trial →
            </Text>
          </TouchableOpacity>
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
          <TouchableOpacity onPress={restore} activeOpacity={0.7} style={{ alignSelf: 'center', marginTop: 8 }}>
            <Text variant="caption" color={C.textMuted} fontWeight="600">Restore purchases</Text>
          </TouchableOpacity>

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
