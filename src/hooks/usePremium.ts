import { useCallback, useEffect, useState } from 'react'
import { toastService, loaderService } from 'fluent-styles'
import { usePremiumStore, useAuthStore } from '../stores'
import {
  purchaseMonthly, purchaseYearly,
  restorePurchases, getEntitlement, getPremiumPrices,
  resetPremiumForTesting,
  openWebSubscribe as serviceOpenWebSubscribe,
  fetchWebSubscriptionStatus,
} from '../services/premiumService'
import { ENABLE_REVENUECAT } from '../constants/premium'

export function usePremium() {
  const { isPremium, plan, hydrated, setEntitlement } = usePremiumStore()
  const { accessToken, user } = useAuthStore()
  const [prices, setPrices] = useState({
    monthlyPrice:  null as string | null,
    yearlyPrice:   null as string | null,
    lifetimePrice: null as string | null,
  })

  const refresh = useCallback(async () => {
    if (!ENABLE_REVENUECAT) return { isActive: false, plan: null, expiresAt: null, purchasedAt: null } as any
    const info = await getEntitlement()
    setEntitlement(info.isActive, info.plan)
    return info
  }, [setEntitlement])

  useEffect(() => {
    if (!hydrated && ENABLE_REVENUECAT) refresh().catch(() => {})
  }, [hydrated, refresh])

  useEffect(() => {
    if (ENABLE_REVENUECAT) getPremiumPrices().then(setPrices).catch(() => {})
  }, [])

  const buy = useCallback(async (purchaseFn: () => Promise<boolean>) => {
    try {
      const activated = await purchaseFn()
      await refresh()
      if (!activated) {
        toastService.error('Purchase pending', 'It may take a moment to activate.')
        return false
      }
      toastService.success('Welcome to Tranquis Pro')
      return true
    } catch (err: any) {
      toastService.error('Purchase failed', err?.message)
      return false
    }
  }, [refresh])

  const buyMonthly = useCallback(async () => {
    if (!ENABLE_REVENUECAT) return false
    return buy(purchaseMonthly)
  }, [buy])
  const buyYearly = useCallback(async () => {
    if (!ENABLE_REVENUECAT) return false
    return buy(purchaseYearly)
  }, [buy])

  const restore = useCallback(async () => {
    if (!ENABLE_REVENUECAT) return false
    try {
      const restored = await loaderService.wrap(restorePurchases, { label: 'Restoring…', variant: 'spinner' })
      if (restored) {
        await refresh()
        toastService.success('Purchases restored')
      } else {
        toastService.info('No purchases found', 'Nothing to restore for this account')
      }
      return restored
    } catch (err: any) {
      toastService.error('Restore failed', err?.message)
      return false
    }
  }, [refresh])

  const resetForTesting = useCallback(async () => {
    await resetPremiumForTesting()
    await refresh()
    toastService.info('Identity reset', 'Fresh anonymous RevenueCat user.')
  }, [refresh])

  /** Pulls Pro status from the backend after web checkout. Resolves true once the user is Pro. */
  const refreshFromWeb = useCallback(async (): Promise<boolean> => {
    if (!accessToken) return false
    try {
      const status = await fetchWebSubscriptionStatus()
      if (status.is_pro) {
        setEntitlement(true, (status.plan_name as any) ?? 'monthly')
      }
      return status.is_pro
    } catch (err: any) {
      if (__DEV__) console.log('[Premium] refreshFromWeb failed:', err?.message)
      return false
    }
  }, [accessToken, setEntitlement])

  /** Opens Stripe checkout in the browser. Resolves false if it couldn't be opened. */
  const openWebSubscribe = useCallback(async (
    plan?: 'weekly' | 'monthly' | 'quarterly' | 'annual',
  ): Promise<boolean> => {
    const userId = user?.id
    if (!userId) {
      toastService.error('Sign in required', 'Please sign in to subscribe.')
      return false
    }
    try {
      await serviceOpenWebSubscribe(userId, plan)
      return true
    } catch (err: any) {
      toastService.error('Could not open browser', err?.message)
      return false
    }
  }, [user?.id])

  return {
    isPremium,
    plan,
    refresh,
    buyMonthly,
    buyYearly,
    restore,
    resetForTesting,
    refreshFromWeb,
    openWebSubscribe,
    monthlyPrice:  prices.monthlyPrice,
    yearlyPrice:   prices.yearlyPrice,
  }
}
