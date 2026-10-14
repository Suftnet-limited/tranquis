import { useCallback, useEffect, useState } from 'react'
import Purchases, { type CustomerInfo, type PurchasesPackage } from 'react-native-purchases'
import { toastService, loaderService } from 'fluent-styles'
import { usePremiumStore, useAuthStore } from '../stores'
import {
  purchaseMonthly, purchaseYearly,
  restorePurchases, getEntitlement, getPremiumPrices,
  resetPremiumForTesting,
  openWebSubscribe as serviceOpenWebSubscribe,
  fetchWebSubscriptionStatus,
  getPlanPackages, purchasePlanPackage, subscribeToEntitlementUpdates, initializeRevenueCat,
  type PlanId,
} from '../services/premiumService'
import { ENABLE_REVENUECAT, PREMIUM_ENTITLEMENT_ID } from '../constants/premium'

/** Single source of truth for Pro: the RevenueCat "premium" entitlement. No backend call. */
export async function isPremium(): Promise<boolean> {
  if (!ENABLE_REVENUECAT) return false
  try {
    await initializeRevenueCat()
    const info: CustomerInfo = await Purchases.getCustomerInfo()
    return typeof info.entitlements.active[PREMIUM_ENTITLEMENT_ID] !== 'undefined'
  } catch {
    return false
  }
}

export function usePremium() {
  const { isPremium, plan, hydrated, setEntitlement } = usePremiumStore()
  const { accessToken, user } = useAuthStore()
  const [prices, setPrices] = useState({
    monthlyPrice:  null as string | null,
    yearlyPrice:   null as string | null,
    lifetimePrice: null as string | null,
  })

  // Pro status comes from RevenueCat only
  const refresh = useCallback(async () => {
    if (!ENABLE_REVENUECAT) return { isActive: false, plan: null, expiresAt: null, purchasedAt: null } as any
    const info = await getEntitlement()
    setEntitlement(info.isActive, info.plan)
    return info
  }, [setEntitlement])

  // Renewals, expiries and restores pushed by RevenueCat
  useEffect(() => {
    if (!ENABLE_REVENUECAT) return
    return subscribeToEntitlementUpdates((info) => setEntitlement(info.isActive, info.plan))
  }, [setEntitlement])

  useEffect(() => {
    if (!hydrated && ENABLE_REVENUECAT) refresh().catch(() => {})
  }, [hydrated, refresh])

  useEffect(() => {
    if (ENABLE_REVENUECAT) getPremiumPrices().then(setPrices).catch(() => {})
  }, [])

  // purchaseFn resolves null when the user cancels Apple's sheet — nothing to report then
  const buy = useCallback(async (purchaseFn: () => Promise<boolean | null>) => {
    try {
      const activated = await purchaseFn()
      if (activated === null) return false
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

  /** The default offering's packages for the Pro screen's plans. */
  const getOffering = useCallback(async (): Promise<Partial<Record<PlanId, PurchasesPackage>>> => {
    if (!ENABLE_REVENUECAT) return {}
    try {
      return await getPlanPackages()
    } catch (err: any) {
      if (__DEV__) console.log('[Premium] getOffering failed:', err?.message)
      return {}
    }
  }, [])

  /** Buys a plan through Apple. Resolves true once Pro is active. */
  const buyPackage = useCallback(async (pkg: PurchasesPackage) => {
    if (!ENABLE_REVENUECAT) return false
    return buy(() => purchasePlanPackage(pkg))
  }, [buy])

  const resetForTesting = useCallback(async () => {
    await resetPremiumForTesting()
    await refresh()
    toastService.info('Identity reset', 'Fresh anonymous RevenueCat user.')
  }, [refresh])

  /** Pulls Pro status from the backend after web checkout. Resolves true once the user is Pro. */
  // With RevenueCat on, this just re-reads RevenueCat (callers refresh on resume / focus);
  // the backend's web-subscription status only matters in the Stripe-only fallback
  const refreshFromWeb = useCallback(async (): Promise<boolean> => {
    if (ENABLE_REVENUECAT) return (await refresh()).isActive
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
  }, [accessToken, setEntitlement, refresh])

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
    getOffering,
    buyPackage,
    restore,
    resetForTesting,
    refreshFromWeb,
    openWebSubscribe,
    monthlyPrice:  prices.monthlyPrice,
    yearlyPrice:   prices.yearlyPrice,
  }
}
