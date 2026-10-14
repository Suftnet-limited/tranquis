import * as SecureStore from 'expo-secure-store'
import { router } from 'expo-router'
import { toastService } from 'fluent-styles'
import { isPremium } from '../hooks/usePremium'
import { countFor, serialiseCount, todayKey } from './dayCounter'

// The free plan's limit lives in the app: Pro comes from RevenueCat, the count from the device.
export const FREE_DAILY_LIMIT = 10
const KEY = 'tranquis_daily_translations'

const readCount = async () => countFor(await SecureStore.getItemAsync(KEY).catch(() => null), todayKey())

export async function canTranslate(): Promise<boolean> {
  if (await isPremium()) return true
  return (await readCount()) < FREE_DAILY_LIMIT
}

export async function recordTranslation(): Promise<void> {
  const today = todayKey()
  const count = countFor(await SecureStore.getItemAsync(KEY).catch(() => null), today)
  await SecureStore.setItemAsync(KEY, serialiseCount(today, count + 1)).catch(() => {})
}

/** Call before a translation request. Opens the paywall and resolves false once the free limit is used up. */
export async function ensureCanTranslate(): Promise<boolean> {
  if (await canTranslate()) return true
  toastService.info('Daily limit reached', `The free plan includes ${FREE_DAILY_LIMIT} translations a day. Upgrade to Pro for unlimited.`)
  router.push('/premium')
  return false
}
