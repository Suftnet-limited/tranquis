import type { PremiumPlan } from '../services/premiumService'
import { create } from 'zustand'
import * as SecureStore from 'expo-secure-store'
import * as FileSystem from 'expo-file-system'
import { DEFAULT_SOURCE, DEFAULT_TARGET } from '../constants/languages'
import type { TranslationTone } from '../constants/languages'

// ─── Theme store ───────────────────────────────────────────────────────────────
export type ThemeMode = 'light' | 'dark' | 'system'

const THEME_KEY = 'tranquis_theme_mode'

interface ThemeState {
  mode:     ThemeMode
  hydrated: boolean
  setMode:  (mode: ThemeMode) => void
  hydrate:  () => Promise<void>
}

export const useThemeStore = create<ThemeState>((set) => ({
  mode:     'system',
  hydrated: false,

  setMode: (mode) => {
    set({ mode })
    SecureStore.setItemAsync(THEME_KEY, mode).catch(() => {})
  },

  hydrate: async () => {
    try {
      const stored = await SecureStore.getItemAsync(THEME_KEY)
      if (stored === 'light' || stored === 'dark' || stored === 'system') {
        set({ mode: stored, hydrated: true })
      } else {
        set({ hydrated: true })
      }
    } catch {
      set({ hydrated: true })
    }
  },
}))

// ─── Auth store ───────────────────────────────────────────────────────────────
const ACCESS_KEY  = 'tranquis_access_token'
const REFRESH_KEY = 'tranquis_refresh_token'

interface AuthState {
  accessToken:  string | null
  refreshToken: string | null
  hydrated:     boolean
  user: {
    id:         string
    email:      string
    full_name:  string
    created_at?: string
  } | null
  setTokens: (access: string, refresh: string) => void
  setUser:   (user: AuthState['user']) => void
  logout:    () => void
  hydrate:   () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken:  null,
  refreshToken: null,
  hydrated:     false,
  user:         null,

  setTokens: (access, refresh) => {
    set({ accessToken: access, refreshToken: refresh })
    SecureStore.setItemAsync(ACCESS_KEY, access).catch(() => {})
    SecureStore.setItemAsync(REFRESH_KEY, refresh).catch(() => {})
  },

  setUser: (user) => set({ user }),

  logout: () => {
    set({ accessToken: null, refreshToken: null, user: null })
    SecureStore.deleteItemAsync(ACCESS_KEY).catch(() => {})
    SecureStore.deleteItemAsync(REFRESH_KEY).catch(() => {})
  },

  hydrate: async () => {
    try {
      const [access, refresh] = await Promise.all([
        SecureStore.getItemAsync(ACCESS_KEY),
        SecureStore.getItemAsync(REFRESH_KEY),
      ])
      set({ accessToken: access, refreshToken: refresh, hydrated: true })
    } catch {
      set({ hydrated: true })
    }
  },
}))

// ─── Translator preferences store ────────────────────────────────────────────
const LANG_PREF_KEY = 'tranquis_lang_prefs'

interface TranslatorState {
  sourceLang:  string
  targetLang:  string
  tone:        TranslationTone
  hydrated:    boolean
  setSource:   (code: string) => void
  setTarget:   (code: string) => void
  setTone:     (tone: TranslationTone) => void
  swapLangs:   () => void
  hydrate:     () => Promise<void>
}

const persistLangPrefs = (source: string, target: string, tone: TranslationTone) => {
  SecureStore.setItemAsync(LANG_PREF_KEY, JSON.stringify({ source, target, tone })).catch(() => {})
}

export const useTranslatorStore = create<TranslatorState>((set, get) => ({
  sourceLang: DEFAULT_SOURCE,
  targetLang: DEFAULT_TARGET,
  tone:       'casual',
  hydrated:   false,

  setSource: (code) => {
    set({ sourceLang: code })
    const { targetLang, tone } = get()
    persistLangPrefs(code, targetLang, tone)
  },

  setTarget: (code) => {
    set({ targetLang: code })
    const { sourceLang, tone } = get()
    persistLangPrefs(sourceLang, code, tone)
  },

  setTone: (tone) => {
    set({ tone })
    const { sourceLang, targetLang } = get()
    persistLangPrefs(sourceLang, targetLang, tone)
  },

  swapLangs: () => {
    const { sourceLang, targetLang, tone } = get()
    set({ sourceLang: targetLang, targetLang: sourceLang })
    persistLangPrefs(targetLang, sourceLang, tone)
  },

  hydrate: async () => {
    try {
      const raw = await SecureStore.getItemAsync(LANG_PREF_KEY)
      if (raw) {
        const { source, target, tone } = JSON.parse(raw)
        set({ sourceLang: source, targetLang: target, tone, hydrated: true })
      } else {
        set({ hydrated: true })
      }
    } catch {
      set({ hydrated: true })
    }
  },
}))

// ─── Premium store ────────────────────────────────────────────────────────────
interface PremiumState {
  isPremium: boolean
  plan:      PremiumPlan
  hydrated:  boolean
  setEntitlement: (isPremium: boolean, plan: PremiumPlan) => void
}

export const usePremiumStore = create<PremiumState>((set) => ({
  isPremium: false,
  plan:      null,
  hydrated:  false,
  setEntitlement: (isPremium, plan) => set({ isPremium, plan, hydrated: true }),
}))

// ─── Onboarding ───────────────────────────────────────────────────────────────
const ONBOARDING_KEY = 'tranquis_onboarding_seen'

export async function ensureFreshInstall(): Promise<void> {
  try {
    const marker = `${FileSystem.documentDirectory}tranquis-install-marker`
    if ((await FileSystem.getInfoAsync(marker)).exists) return
    await Promise.all([ACCESS_KEY, REFRESH_KEY, ONBOARDING_KEY].map(
      (k) => SecureStore.deleteItemAsync(k).catch(() => {}),
    ))
    await FileSystem.writeAsStringAsync(marker, '1')
  } catch {}
}

export async function getOnboardingSeen(): Promise<boolean> {
  try {
    return (await SecureStore.getItemAsync(ONBOARDING_KEY)) === '1'
  } catch {
    return false
  }
}

export async function setOnboardingSeen(): Promise<void> {
  try {
    await SecureStore.setItemAsync(ONBOARDING_KEY, '1')
  } catch {}
}
