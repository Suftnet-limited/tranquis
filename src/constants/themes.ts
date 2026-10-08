// ─── Tranquis theme palettes ───────────────────────────────────────────────
// Teal-forward palette — distinct from Revvo (blue) while sharing the same
// token structure, so every component works without changes.
// useColors() returns the right palette automatically.

export const LightColors = {
  // Brand — electric teal
  primary:      '#14B8A6',
  primaryDark:  '#0D9488',
  primaryLight: '#5EEAD4',
  primaryBg:    '#ECFDF5',

  // Feature accent colours
  quizColor:    '#8B5CF6',  quizBg:    '#F5F3FF',
  flashColor:   '#F59E0B',  flashBg:   '#FFFBEB',
  sumColor:     '#5B7FFF',  sumBg:     '#EEF2FF',
  chatColor:    '#14B8A6',  chatBg:    '#ECFDF5',

  // Module pill colours (deterministic per index)
  mod0: '#14B8A6',  mod0Bg: '#ECFDF5',
  mod1: '#8B5CF6',  mod1Bg: '#F5F3FF',
  mod2: '#F59E0B',  mod2Bg: '#FFFBEB',
  mod3: '#5B7FFF',  mod3Bg: '#EEF2FF',
  mod4: '#E8470A',  mod4Bg: '#FEF0EB',

  // Backgrounds
  bg:      '#F5F8F7',
  bgCard:  '#FFFFFF',
  bgInput: '#EEF3F1',
  bgMuted: '#E2EBE8',

  // Text
  textPrimary:   '#0F1A18',
  textSecondary: '#4B6A64',
  textMuted:     '#8FA99E',
  textOnDark:    '#FFFFFF',

  // Status
  success:   '#166534',  successBg: '#DCFCE7',
  error:     '#791F1F',  errorBg:   '#FCEBEB',
  warning:   '#854F0B',  warningBg: '#FAEEDA',

  // Misc
  border:      '#D1E0DC',
  borderFocus: '#14B8A6',
  white:       '#FFFFFF',
  black:       '#0F1A18',
  navy:        '#0D1F1E',
  navyLight:   '#1A3330',
}

export const DarkColors: typeof LightColors = {
  primary:      '#2DD4BF',
  primaryDark:  '#14B8A6',
  primaryLight: '#5EEAD4',
  primaryBg:    'rgba(20,184,166,0.16)',

  quizColor:  '#A78BFA', quizBg:  'rgba(139,92,246,0.16)',
  flashColor: '#FCD34D', flashBg: 'rgba(245,158,11,0.16)',
  sumColor:   '#7B9FFF', sumBg:   'rgba(91,127,255,0.18)',
  chatColor:  '#2DD4BF', chatBg:  'rgba(20,184,166,0.16)',

  mod0: '#2DD4BF',  mod0Bg: 'rgba(20,184,166,0.16)',
  mod1: '#A78BFA',  mod1Bg: 'rgba(139,92,246,0.16)',
  mod2: '#FCD34D',  mod2Bg: 'rgba(245,158,11,0.16)',
  mod3: '#7B9FFF',  mod3Bg: 'rgba(91,127,255,0.18)',
  mod4: '#FF6B3D',  mod4Bg: 'rgba(255,107,61,0.16)',

  bg:      '#0A0F0F',
  bgCard:  '#111918',
  bgInput: '#192220',
  bgMuted: '#1F2E2B',

  textPrimary:   '#E8F4F2',
  textSecondary: '#7EA99F',
  textMuted:     '#4F706A',
  textOnDark:    '#FFFFFF',

  success:   '#4ADE80', successBg: 'rgba(74,222,128,0.14)',
  error:     '#F1726F', errorBg:   'rgba(241,114,111,0.14)',
  warning:   '#F0B255', warningBg: 'rgba(240,178,85,0.14)',

  border:      '#1E3330',
  borderFocus: '#2DD4BF',
  white:       '#FFFFFF',
  black:       '#0A0F0F',
  navy:        '#060D0C',
  navyLight:   '#0D1F1E',
}

export type ThemeColors = typeof LightColors
