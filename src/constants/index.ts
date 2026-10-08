import type { ThemeColors } from './themes'

export { LightColors as Colors, DarkColors } from './themes'
export type { ThemeColors } from './themes'
export { useColors, getColors, useIsDark } from './useColors'
export type { ThemeMode } from '../stores'
export { LANGUAGES, TONES, getLang, DEFAULT_SOURCE, DEFAULT_TARGET } from './languages'
export type { Language, TranslationTone } from './languages'

// ─── Header back button ───────────────────────────────────────────────────────
export const getBackArrowProps = (C: ThemeColors) => ({
  size: 18, strokeWidth: 2.25, color: C.textPrimary,
})
export const getBackShapeProps = (C: ThemeColors, size = 38) => ({
  size, backgroundColor: C.bgCard, borderWidth: 1, borderColor: C.border,
})

// ─── Bottom sheet / popup colours ────────────────────────────────────────────
export const getPopupColors = (C: ThemeColors) => ({
  background:     C.bgCard,
  overlay:        'rgba(0,0,0,0.5)',
  handle:         C.border,
  headerTitle:    C.textPrimary,
  headerSubtitle: C.textSecondary,
  headerBorder:   C.border,
  closeIcon:      C.textSecondary,
  closeIconBg:    C.bgMuted,
})

// ─── Form field resting colours ───────────────────────────────────────────────
export const getFieldColors = (C: ThemeColors) => ({
  background:      C.bgInput,
  border:          C.border,
  text:            C.textPrimary,
  placeholder:     C.textMuted,
  label:           C.textPrimary,
  panelBackground: C.bgCard,
  panelBorder:     C.border,
  panelText:       C.textPrimary,
  panelDivider:    C.bgMuted,
})

// ─── Language pill accent by index (same slot-based approach as Revvo modules) ─
type ModKey = 'mod0' | 'mod1' | 'mod2' | 'mod3' | 'mod4'
export const getLangColors = (C: ThemeColors, idx: number) => {
  const key = (`mod${idx % 5}`) as ModKey
  const bgKey = (`${key}Bg`) as keyof ThemeColors
  return { color: C[key] as string, bg: C[bgKey] as string }
}
