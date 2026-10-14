import React, { useState } from 'react'
import { ActivityIndicator, Text as RNText, TextInput, TouchableOpacity, View, type TextInputProps } from 'react-native'
import { EyeIcon, EyeOffIcon } from '../icons'
import { useColors, useIsDark } from '../constants'

// Flat auth design (mock ui/login.png, createaccount.png, forgotpassword.png): no cards, no shadows.

export const TEAL   = '#3DBFA0'
export const PURPLE = '#6C63FF'

export const FONT = {
  heading:  'Sora_800ExtraBold',
  bold:     'Sora_700Bold',
  body:     'Inter_400Regular',
  medium:   'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
} as const

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

/** Light/dark tokens shared by the auth screens. */
export function useAuthColors() {
  const C = useColors()
  const isDark = useIsDark()
  return {
    bg:      isDark ? C.bg : '#FFFFFF',
    text:    isDark ? C.textPrimary : '#111827',
    muted:   isDark ? C.textSecondary : '#6B7280',
    faint:   isDark ? C.textMuted : '#9CA3AF',
    border:  isDark ? '#1F2937' : '#E5E7EB',
    fill:    isDark ? '#1A2335' : '#F9FAFB',
    error:   '#EF4444',
    isDark,
  }
}

/** Globe tile + wordmark, then the screen heading and subtitle. */
export function AuthHeader({ title, subtitle }: { title: string; subtitle: string }) {
  const A = useAuthColors()
  return (
    <View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 32 }}>
        <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: TEAL, alignItems: 'center', justifyContent: 'center' }}>
          <RNText style={{ fontSize: 22, lineHeight: 28 }}>🌍</RNText>
        </View>
        <RNText style={{ fontFamily: FONT.bold, fontSize: 18, color: A.text }}>Tranquis</RNText>
      </View>
      <RNText style={{ fontFamily: FONT.heading, fontSize: 30, lineHeight: 36, letterSpacing: -0.8, color: A.text }}>
        {title}
      </RNText>
      <RNText style={{ fontFamily: FONT.body, fontSize: 15, color: A.muted, marginTop: 6 }}>{subtitle}</RNText>
    </View>
  )
}

export function EyeToggle({ shown, onPress }: { shown: boolean; onPress: () => void }) {
  const A = useAuthColors()
  return (
    <TouchableOpacity onPress={onPress} hitSlop={10} style={{ paddingHorizontal: 4 }}
      accessibilityRole="button" accessibilityLabel={shown ? 'Hide password' : 'Show password'}
    >
      {shown ? <EyeOffIcon size={18} strokeWidth={1.8} color={A.muted} /> : <EyeIcon size={18} strokeWidth={1.8} color={A.muted} />}
    </TouchableOpacity>
  )
}

/** Uppercase micro-label, 52px input, teal border on focus. `password` adds the eye toggle. */
export function AuthField({ label, error, password, children, ...input }: TextInputProps & {
  label: string
  error?: string
  password?: boolean
  children?: React.ReactNode   // rendered under the input (e.g. the strength bar)
}) {
  const A = useAuthColors()
  const [focused, setFocused] = useState(false)
  const [shown, setShown] = useState(false)
  return (
    <View>
      <RNText style={{ fontFamily: FONT.semibold, fontSize: 12, letterSpacing: 0.8, color: A.muted, marginBottom: 8 }}>
        {label.toUpperCase()}
      </RNText>
      <View style={{
        height: 52, borderRadius: 14, borderWidth: 1, paddingHorizontal: 16,
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: A.fill,
        borderColor: error ? A.error : focused ? TEAL : A.border,
      }}>
        <TextInput
          {...input}
          secureTextEntry={password ? !shown : input.secureTextEntry}
          placeholderTextColor={A.faint}
          selectionColor={TEAL}
          onFocus={(e) => { setFocused(true); input.onFocus?.(e) }}
          onBlur={(e) => { setFocused(false); input.onBlur?.(e) }}
          style={[{ flex: 1, height: '100%', fontFamily: FONT.body, fontSize: 16, color: A.text }, input.style]}
        />
        {password && <EyeToggle shown={shown} onPress={() => setShown((v) => !v)} />}
      </View>
      {children}
      {!!error && (
        <RNText style={{ fontFamily: FONT.medium, fontSize: 12, color: A.error, marginTop: 6 }}>{error}</RNText>
      )}
    </View>
  )
}

/** Full-width 56px flat CTA. */
export function AuthButton({ label, onPress, loading, disabled, color = TEAL }: {
  label: string
  onPress: () => void
  loading?: boolean
  disabled?: boolean
  color?: string
}) {
  return (
    <TouchableOpacity onPress={onPress} disabled={loading || disabled} activeOpacity={0.85}
      accessibilityRole="button" accessibilityLabel={label.replace('→', '').trim()}
      style={{
        height: 56, borderRadius: 16, backgroundColor: color,
        alignItems: 'center', justifyContent: 'center',
        opacity: disabled ? 0.6 : 1,
      }}
    >
      {loading
        ? <ActivityIndicator color="#FFF" />
        : <RNText style={{ fontFamily: FONT.bold, fontSize: 17, color: '#FFF' }}>{label}</RNText>}
    </TouchableOpacity>
  )
}

export function OrDivider() {
  const A = useAuthColors()
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginVertical: 24 }}>
      <View style={{ flex: 1, height: 1, backgroundColor: A.border }} />
      <RNText style={{ fontFamily: FONT.semibold, fontSize: 12, letterSpacing: 1, color: A.faint }}>OR</RNText>
      <View style={{ flex: 1, height: 1, backgroundColor: A.border }} />
    </View>
  )
}

/** 0–4: length, mixed case, a digit, a symbol. */
export function passwordStrength(pw: string): number {
  if (!pw) return 0
  let score = pw.length >= 8 ? 1 : 0
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++
  if (/\d/.test(pw)) score++
  if (/[^A-Za-z0-9]/.test(pw)) score++
  return Math.max(1, score)
}

/** Four segments under the password field: red → amber → teal. */
export function StrengthBar({ password }: { password: string }) {
  const A = useAuthColors()
  const score = passwordStrength(password)
  const color = score <= 1 ? '#EF4444' : score <= 2 ? '#F59E0B' : TEAL
  return (
    <View style={{ flexDirection: 'row', gap: 6, marginTop: 10 }}
      accessibilityLabel={`Password strength ${score} of 4`}
    >
      {[1, 2, 3, 4].map((i) => (
        <View key={i} style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: i <= score ? color : A.border }} />
      ))}
    </View>
  )
}
