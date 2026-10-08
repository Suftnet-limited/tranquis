import { router } from 'expo-router'

// `router.back()` on its own does nothing when there's no history to pop —
// e.g. a screen opened from a deep link. Fall back to a sensible route instead
// of leaving the user on a back arrow that doesn't work. (Same as NailBid.)
export const goBack = (fallback: string = '/(tabs)') => {
  if (router.canGoBack()) {
    router.back()
  } else {
    router.replace(fallback as any)
  }
}
