// ─── Supported language pairs ─────────────────────────────────────────────

export interface Language {
  code:  string   // BCP-47 / OpenAI locale code
  label: string   // display name
  flag:  string   // emoji flag
  tts:   string   // OpenAI TTS voice locale (e.g. 'es', 'fr')
  rtl?:  boolean
}

export const LANGUAGES: Language[] = [
  { code: 'en',    label: 'English',             flag: '🇬🇧', tts: 'en' },
  { code: 'es',    label: 'Spanish',             flag: '🇪🇸', tts: 'es' },
  { code: 'fr',    label: 'French',              flag: '🇫🇷', tts: 'fr' },
  { code: 'de',    label: 'German',              flag: '🇩🇪', tts: 'de' },
  { code: 'it',    label: 'Italian',             flag: '🇮🇹', tts: 'it' },
  { code: 'pt',    label: 'Portuguese',          flag: '🇧🇷', tts: 'pt' },
  { code: 'zh',    label: 'Chinese (Mandarin)',  flag: '🇨🇳', tts: 'zh' },
  { code: 'ja',    label: 'Japanese',            flag: '🇯🇵', tts: 'ja' },
  { code: 'ko',    label: 'Korean',              flag: '🇰🇷', tts: 'ko' },
  { code: 'ar',    label: 'Arabic',              flag: '🇸🇦', tts: 'ar', rtl: true },
  { code: 'hi',    label: 'Hindi',               flag: '🇮🇳', tts: 'hi' },
  { code: 'ru',    label: 'Russian',             flag: '🇷🇺', tts: 'ru' },
  { code: 'nl',    label: 'Dutch',               flag: '🇳🇱', tts: 'nl' },
  { code: 'pl',    label: 'Polish',              flag: '🇵🇱', tts: 'pl' },
  { code: 'tr',    label: 'Turkish',             flag: '🇹🇷', tts: 'tr' },
  { code: 'id',    label: 'Indonesian',          flag: '🇮🇩', tts: 'id' },
  { code: 'vi',    label: 'Vietnamese',          flag: '🇻🇳', tts: 'vi' },
  { code: 'th',    label: 'Thai',                flag: '🇹🇭', tts: 'th' },
  { code: 'sv',    label: 'Swedish',             flag: '🇸🇪', tts: 'sv' },
  { code: 'uk',    label: 'Ukrainian',           flag: '🇺🇦', tts: 'uk' },
]

export const DEFAULT_SOURCE = 'en'
export const DEFAULT_TARGET = 'es'

export type TranslationTone = 'casual' | 'formal' | 'business' | 'travel'

export const TONES: { key: TranslationTone; label: string; icon: string }[] = [
  { key: 'casual',   label: 'Casual',   icon: 'smile'    },
  { key: 'formal',   label: 'Formal',   icon: 'briefcase' },
  { key: 'business', label: 'Business', icon: 'trending-up' },
  { key: 'travel',   label: 'Travel',   icon: 'map-pin'  },
]

export function getLang(code: string): Language {
  return LANGUAGES.find((l) => l.code === code) ?? LANGUAGES[0]
}
