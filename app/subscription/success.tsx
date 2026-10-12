import React, { useEffect, useRef } from 'react'
import { ActivityIndicator } from 'react-native'
import { router } from 'expo-router'
import { StyledPage, Stack, toastService } from 'fluent-styles'
import { Text } from '../../src/components/Text'
import { useColors } from '../../src/constants'
import { usePremium } from '../../src/hooks'
import { useAuthStore } from '../../src/stores'

// Target of the "Return to the Tranquis app" button on the Stripe success page
// (tranquis://subscription/success?session_id=…)

const ATTEMPTS = 6
const INTERVAL_MS = 1500

export default function SubscriptionSuccessScreen() {
  const C = useColors()
  const hydrated = useAuthStore((s) => s.hydrated)
  const { refreshFromWeb } = usePremium()
  const started = useRef(false)

  useEffect(() => {
    // On a cold start the deep link can arrive before the tokens are loaded
    if (!hydrated || started.current) return
    started.current = true
    let cancelled = false

    ;(async () => {
      // Stripe's webhook can land a few seconds after the success page, so poll briefly
      let isPro = false
      for (let i = 0; i < ATTEMPTS && !cancelled; i++) {
        isPro = await refreshFromWeb()
        if (isPro) break
        await new Promise((r) => setTimeout(r, INTERVAL_MS))
      }
      if (cancelled) return

      if (isPro) toastService.success('Welcome to Tranquis Pro')
      else toastService.info('Payment received', 'Pro will unlock shortly. Reopen the Pro screen to check.')

      // Back to the paywall (now showing the Pro state) if we came from it, else to Pro directly
      if (router.canGoBack()) router.back()
      else router.replace('/premium')
    })()

    return () => { cancelled = true }
  }, [hydrated, refreshFromWeb])

  return (
    <StyledPage flex={1} backgroundColor={C.bg}>
      <Stack flex={1} alignItems="center" justifyContent="center" gap={14} padding={32}>
        <ActivityIndicator color={C.primary} size="large" />
        <Text variant="body" color={C.textPrimary} fontWeight="700">Activating Tranquis Pro…</Text>
        <Text variant="caption" color={C.textMuted} textAlign="center">This only takes a moment</Text>
      </Stack>
    </StyledPage>
  )
}
