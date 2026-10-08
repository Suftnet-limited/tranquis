// ─── Tranquis Pro configuration ───────────────────────────────────────────
//
// Gating: free users get a daily translation quota (50 translations/day).
// Pro removes that limit and unlocks voice + camera + live interpreter.

export const PREMIUM_PRODUCTS = {
  MONTHLY: 'com.suftnet.tranquis.premium.monthly',
  YEARLY:  'com.suftnet.tranquis.premium.yearly',
} as const

export const PREMIUM_PRICING = {
  MONTHLY: { price: '$4.99',  period: 'per month', label: 'Monthly' },
  YEARLY:  { price: '$29.99', period: 'per year',  label: 'Yearly', saving: 'Save 50%' },
} as const

export const PREMIUM_FEATURES = [
  {
    title:       'Unlimited translations',
    description: 'No daily limit — translate as much as you need',
  },
  {
    title:       'Voice translation',
    description: 'Speak naturally and get instant spoken translations',
  },
  {
    title:       'Camera translate',
    description: 'Point your camera at any text and translate instantly',
  },
  {
    title:       'Live interpreter',
    description: 'Real-time two-way conversation with two voices',
  },
  {
    title:       'Unlimited phrasebook',
    description: 'Save unlimited phrases across all languages',
  },
  {
    title:       'Support Tranquis',
    description: 'Your subscription keeps Tranquis running and improving',
  },
] as const

export const PREMIUM_ENTITLEMENT_ID = 'premium'
export const PREMIUM_SHARED_TEST_PROJECT = false
export const PREMIUM_STORAGE_KEY = 'tranquis_premium_entitlement'
