import React from 'react'
import { ActivityIndicator, StyleSheet } from 'react-native'
import Svg, { Defs, LinearGradient, Stop, Rect, Path, Circle } from 'react-native-svg'
import { ArrowRightIcon, EyeIcon, EyeOffIcon } from '../icons'
import { Stack, StyledPressable } from 'fluent-styles'
import { Text } from './Text'
import { useColors } from '../constants'

// Soft teal decorative background circles for auth screens.
export function AuthBackground() {
  const C = useColors()
  return (
    <Stack style={StyleSheet.absoluteFill} pointerEvents="none">
      <Stack position="absolute" top={-90} left={-110} width={300} height={300} borderRadius={150}
        backgroundColor={C.primaryBg} style={{ opacity: 0.9 }} />
      <Stack position="absolute" top={40} right={-140} width={320} height={320} borderRadius={160}
        backgroundColor={C.primaryBg} style={{ opacity: 0.55 }} />
      <Stack position="absolute" bottom={-60} left={60} width={200} height={200} borderRadius={100}
        backgroundColor={C.primaryBg} style={{ opacity: 0.4 }} />
    </Stack>
  )
}

// Tranquis brand mark: stylised "T" with teal gradient, globe/wave motif
export function BrandMark({ title, subtitle }: { title?: string; subtitle?: string }) {
  const C = useColors()
  return (
    <Stack alignItems="center" gap={14}>
      <Stack
        width={92} height={92} borderRadius={28} alignItems="center" justifyContent="center"
        backgroundColor={C.bgCard}
        style={{
          borderWidth: 1, borderColor: `${C.primary}30`,
          shadowColor: C.primary, shadowOpacity: 0.32, shadowRadius: 24,
          shadowOffset: { width: 0, height: 10 }, elevation: 10,
        }}
      >
        <Svg width={74} height={74} viewBox="0 0 74 74" preserveAspectRatio="xMidYMid meet">
          <Defs>
            <LinearGradient id="tranquis-logo-grad" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0"    stopColor="#5EEAD4" />
              <Stop offset="0.4"  stopColor="#14B8A6" />
              <Stop offset="0.75" stopColor="#0D9488" />
              <Stop offset="1"    stopColor="#134E4A" />
            </LinearGradient>
          </Defs>
          <Rect x="0" y="0" width="74" height="74" rx="24" fill={C.bgCard} />
          {/* Globe-ish wave circles */}
          <Circle cx="37" cy="37" r="24" stroke="url(#tranquis-logo-grad)" strokeWidth="1.5"
            fill="none" strokeDasharray="4 3" strokeLinecap="round" />
          <Circle cx="37" cy="37" r="16" stroke="url(#tranquis-logo-grad)" strokeWidth="1"
            fill="none" strokeOpacity="0.4" />
          {/* T letterform */}
          <Path
            d="M22 22H52V29H41V52H33V29H22V22Z"
            fill="url(#tranquis-logo-grad)"
          />
          <Path
            d="M22 22H52V29H41V52H33V29H22V22Z"
            fill="none"
            stroke="rgba(255,255,255,0.25)"
            strokeWidth="1.5"
          />
        </Svg>
      </Stack>
      {(title || subtitle) && (
        <Stack alignItems="center" gap={4}>
          {!!title && <Text variant="header" color={C.textPrimary} fontWeight="800">{title}</Text>}
          {!!subtitle && <Text variant="body" color={C.textSecondary}>{subtitle}</Text>}
        </Stack>
      )}
    </Stack>
  )
}

export function GradientButton({ label, onPress, loading, disabled, arrow = true }: {
  label: string; onPress: () => void; loading?: boolean; disabled?: boolean; arrow?: boolean
}) {
  const C = useColors()
  const inactive = disabled || loading
  return (
    <StyledPressable
      onPress={onPress} disabled={inactive}
      style={{
        height: 54, borderRadius: 16, overflow: 'hidden', justifyContent: 'center',
        opacity: disabled ? 0.55 : 1,
        shadowColor: C.primary, shadowOpacity: 0.38, shadowRadius: 16,
        shadowOffset: { width: 0, height: 6 }, elevation: 8,
      }}
    >
      <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" preserveAspectRatio="none">
        <Defs>
          <LinearGradient id="tranquis-btn" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor={C.primary} />
            <Stop offset="1" stopColor={C.primaryDark} />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#tranquis-btn)" />
      </Svg>
      <Stack horizontal alignItems="center" justifyContent="center" paddingHorizontal={20}>
        {loading
          ? <ActivityIndicator color={C.white} />
          : <Text variant="button" color={C.white}>{label}</Text>}
        {arrow && !loading && (
          <Stack position="absolute" right={20}>
            <ArrowRightIcon size={20} strokeWidth={2.2} color={C.white} />
          </Stack>
        )}
      </Stack>
    </StyledPressable>
  )
}

export function OrDivider() {
  const C = useColors()
  return (
    <Stack horizontal alignItems="center" gap={14} marginVertical={22}>
      <Stack flex={1} height={1} backgroundColor={C.border} />
      <Text variant="caption" color={C.textSecondary} fontWeight="600">OR</Text>
      <Stack flex={1} height={1} backgroundColor={C.border} />
    </Stack>
  )
}

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export function EyeToggle({ shown, onPress }: { shown: boolean; onPress: () => void }) {
  const C = useColors()
  return (
    <StyledPressable onPress={onPress} hitSlop={10} style={{ paddingHorizontal: 6 }}
      accessibilityRole="button" accessibilityLabel={shown ? 'Hide password' : 'Show password'}
    >
      {shown ? <EyeOffIcon size={18} strokeWidth={1.8} color={C.textSecondary} /> : <EyeIcon size={18} strokeWidth={1.8} color={C.textSecondary} />}
    </StyledPressable>
  )
}
