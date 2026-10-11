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

export const TTS_VOICES = ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'] as const
export type TtsVoice = typeof TTS_VOICES[number]
const DEFAULT_VOICE: TtsVoice = 'nova'

interface TranslatorState {
  sourceLang:  string
  targetLang:  string
  tone:        TranslationTone
  voice:       TtsVoice
  hydrated:    boolean
  setSource:   (code: string) => void
  setTarget:   (code: string) => void
  setTone:     (tone: TranslationTone) => void
  setVoice:    (voice: TtsVoice) => void
  swapLangs:   () => void
  hydrate:     () => Promise<void>
}

const persistLangPrefs = (source: string, target: string, tone: TranslationTone, voice: TtsVoice) => {
  SecureStore.setItemAsync(LANG_PREF_KEY, JSON.stringify({ source, target, tone, voice })).catch(() => {})
}

export const useTranslatorStore = create<TranslatorState>((set, get) => ({
  sourceLang: DEFAULT_SOURCE,
  targetLang: DEFAULT_TARGET,
  tone:       'casual',
  voice:      DEFAULT_VOICE,
  hydrated:   false,

  setSource: (code) => {
    set({ sourceLang: code })
    const { targetLang, tone, voice } = get()
    persistLangPrefs(code, targetLang, tone, voice)
  },

  setTarget: (code) => {
    set({ targetLang: code })
    const { sourceLang, tone, voice } = get()
    persistLangPrefs(sourceLang, code, tone, voice)
  },

  setTone: (tone) => {
    set({ tone })
    const { sourceLang, targetLang, voice } = get()
    persistLangPrefs(sourceLang, targetLang, tone, voice)
  },

  setVoice: (voice) => {
    set({ voice })
    const { sourceLang, targetLang, tone } = get()
    persistLangPrefs(sourceLang, targetLang, tone, voice)
  },

  swapLangs: () => {
    const { sourceLang, targetLang, tone, voice } = get()
    set({ sourceLang: targetLang, targetLang: sourceLang })
    persistLangPrefs(targetLang, sourceLang, tone, voice)
  },

  hydrate: async () => {
    try {
      const raw = await SecureStore.getItemAsync(LANG_PREF_KEY)
      if (raw) {
        const { source, target, tone, voice } = JSON.parse(raw)
        // Prefs saved before voices existed have no voice
        set({
          sourceLang: source, targetLang: target, tone,
          voice: TTS_VOICES.includes(voice) ? voice : DEFAULT_VOICE,
          hydrated: true,
        })
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
