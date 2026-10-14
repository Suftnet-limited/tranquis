import React, { useState } from 'react'
import {
  Platform,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  View,
  ActivityIndicator,
} from 'react-native'
import { router } from 'expo-router'
import { Feather } from '@expo/vector-icons'
import { StyledPage, Stack } from 'fluent-styles'
import { Text } from '../src/components/Text'
import { useColors, useIsDark } from '../src/constants'
import { usePremium } from '../src/hooks'

type Plan = 'annual' | 'monthly'

const FEATURES = [
  'Unlimited text, voice & camera translations',
  'Live voice interpreter (two-way, real-time)',
  'Document translation — PDF & Word',
  'Offline mode — 15 languages',
  'Context & tone aware translations',
  'Unlimited phrasebook saves',
]

export default function PremiumScreen() {
  const C      = useColors()
  const isDark = useIsDark()
  const [selected, setSelected] = useState<Plan>('monthly')
  const [loading, setLoading]   = useState(false)
  const { isPremium, buyMonthly, buyYearly, restore } = usePremium()

  const TEAL   = '#3DBFA0'
  const TEAL_L = '#E8F8F5'
  const BG     = isDark ? C.bg   : '#FFFFFF'
  const CARD   = isDark ? C.bgCard : '#FFFFFF'
  const BORDER = isDark ? C.border : '#E5E7EB'

  const handleSubscribe = async () => {
    setLoading(true)
    try {
      if (selected === 'annual') await buyYearly()
      else await buyMonthly()
    } finally {
      setLoading(false)
    }
  }

  if (isPremium) {
    return (
      <StyledPage flex={1} backgroundColor={BG} showStatusBar
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
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 48 }}
      >
        {/* ── Header bar ── */}
        <Stack
          horizontal alignItems="center" paddingHorizontal={16} paddingTop={56} paddingBottom={12}
          style={{ borderBottomWidth: 1, borderBottomColor: BORDER }}
        >
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
            <Feather name="chevron-left" size={22} color={isDark ? '#FFF' : '#111'} />
          </TouchableOpacity>
          <Stack flex={1} alignItems="center" gap={2}>
            <Text variant="body" color={C.textPrimary} fontWeight="800" style={{ fontSize: 17 }}>
              Tranquis Pro
            </Text>
            <Text variant="caption" color={C.textSecondary}>Unlock everything</Text>
          </Stack>
          {/* spacer to centre title */}
          <View style={{ width: 36 }} />
        </Stack>

        <Stack paddingHorizontal={20} paddingTop={28} gap={0}>

          {/* ── Globe hero ── */}
          <Stack alignItems="center" gap={14} marginBottom={28}>
            <Text style={{ fontSize: 64 }}>🌍</Text>
            <Text
              variant="header" fontWeight="800" textAlign="center" color={C.textPrimary}
              style={{ fontSize: 26, lineHeight: 34 }}
            >
              Speak every language,{'\n'}anywhere
            </Text>
            <Text variant="body" color={C.textSecondary} textAlign="center" style={{ lineHeight: 22 }}>
              Unlimited translations, voice interpreter, document{'\n'}translate, and more.
            </Text>
          </Stack>

          {/* ── Plan cards ── */}
          <Stack gap={12} marginBottom={20}>

            {/* Annual — Most Popular */}
            <View>
              {/* Badge floated above card */}
              <Stack alignItems="center" marginBottom={-12} zIndex={1}>
                <Stack
                  backgroundColor="#6C63FF"
                  borderRadius={20} paddingHorizontal={16} paddingVertical={5}
                >
                  <Text style={{ fontSize: 11, color: '#FFF', fontWeight: '700', letterSpacing: 0.5 }}>
                    MOST POPULAR
                  </Text>
                </Stack>
              </Stack>

              <TouchableOpacity onPress={() => setSelected('annual')} activeOpacity={0.85}>
                <Stack
                  borderRadius={16} padding={18} paddingTop={24}
                  backgroundColor={CARD}
                  style={[
                    styles.planCard,
                    {
                      borderColor: selected === 'annual' ? '#6C63FF' : BORDER,
                      borderWidth: selected === 'annual' ? 2 : 1,
                    },
                  ]}
                >
                  <Stack horizontal alignItems="center" justifyContent="space-between">
                    <Stack gap={4}>
                      <Text variant="body" color={C.textPrimary} fontWeight="800" style={{ fontSize: 16 }}>
                        Pro Annual
                      </Text>
                      <Text variant="caption" color={C.textSecondary}>
                        Billed annually · cancel anytime
                      </Text>
                    </Stack>
                    <Stack alignItems="flex-end" gap={2}>
                      <Stack horizontal alignItems="baseline" gap={2}>
                        <Text style={{ fontSize: 22, fontWeight: '800', color: C.textPrimary }}>£3.33</Text>
                        <Text variant="caption" color={C.textSecondary}>/mo</Text>
                      </Stack>
                      <Text variant="caption" color={C.textSecondary}>£39.99/year</Text>
                      <Stack backgroundColor={isDark ? '#14532d' : '#DCFCE7'} borderRadius={6} paddingHorizontal={8} paddingVertical={3}>
                        <Text style={{ fontSize: 11, color: '#16A34A', fontWeight: '700' }}>Save 33%</Text>
                      </Stack>
                    </Stack>
                  </Stack>
                </Stack>
              </TouchableOpacity>
            </View>

            {/* Monthly */}
            <TouchableOpacity onPress={() => setSelected('monthly')} activeOpacity={0.85}>
              <Stack
                borderRadius={16} padding={18}
                backgroundColor={selected === 'monthly' ? (isDark ? '#0D2E29' : TEAL_L) : CARD}
                style={[
                  styles.planCard,
                  {
                    borderColor: selected === 'monthly' ? TEAL : BORDER,
                    borderWidth: selected === 'monthly' ? 2 : 1,
                  },
                ]}
              >
                <Stack horizontal alignItems="center" justifyContent="space-between">
                  <Stack gap={4}>
                    <Text variant="body" color={C.textPrimary} fontWeight="800" style={{ fontSize: 16 }}>
                      Pro Monthly
                    </Text>
                    <Text variant="caption" color={C.textSecondary}>
                      Billed monthly · cancel anytime
                    </Text>
                  </Stack>
                  <Stack alignItems="flex-end" gap={2}>
                    <Stack horizontal alignItems="baseline" gap={2}>
                      <Text style={{ fontSize: 22, fontWeight: '800', color: C.textPrimary }}>£4.99</Text>
                      <Text variant="caption" color={C.textSecondary}>/mo</Text>
                    </Stack>
                    <Text variant="caption" color={C.textSecondary}>£4.99/month</Text>
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
                  {selected === 'monthly' ? 'Start Free 7-Day Trial →' : 'Start Annual Plan →'}
                </Text>
            }
          </TouchableOpacity>

          <Text variant="caption" color={C.textSecondary} textAlign="center" style={{ marginTop: 10, lineHeight: 18 }}>
            {selected === 'monthly'
              ? 'Then £4.99/month. Cancel in Settings anytime before renewal.'
              : 'Then £39.99/year. Cancel in Settings anytime before renewal.'}
          </Text>

          {/* Restore */}
          <TouchableOpacity onPress={restore} activeOpacity={0.7} style={{ alignSelf: 'center', marginTop: 16 }}>
            <Text variant="caption" color={C.textSecondary} fontWeight="600">Restore purchases</Text>
          </TouchableOpacity>

          {/* Apple legal */}
          <Text
            variant="caption" color={C.textSecondary} textAlign="center"
            style={{ marginTop: 16, lineHeight: 18, paddingHorizontal: 8 }}
          >
            Payment charged to your Apple ID at confirmation. Subscription auto-renews unless
            cancelled at least 24 hours before the end of the current period.
          </Text>

        </Stack>
      </ScrollView>
    </StyledPage>
  )
}

const styles = StyleSheet.create({
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
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
