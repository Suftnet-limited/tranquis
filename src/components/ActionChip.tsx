import React from 'react'
import { ActivityIndicator } from 'react-native'
import { StyledPressable, Stack } from 'fluent-styles'
import { Text } from './Text'
import { useColors } from '../constants'
import type { IconComponent } from '../icons'

interface ActionChipProps {
  icon:      IconComponent
  label:     string
  onPress:   () => void
  loading?:  boolean
  danger?:   boolean
  disabled?: boolean
  background?: string
}

// Small icon + label pill for result actions (Listen, Copy, Save, Delete…)
export function ActionChip({ icon: Icon, label, onPress, loading, danger, disabled, background }: ActionChipProps) {
  const C = useColors()
  const tint = danger ? C.danger : C.primary
  return (
    <StyledPressable
      onPress={onPress} disabled={disabled || loading}
      accessibilityRole="button" accessibilityLabel={label}
      style={{ opacity: disabled || loading ? 0.6 : 1 }}
    >
      <Stack
        horizontal alignItems="center" gap={5}
        backgroundColor={danger ? C.dangerBg : background ?? C.bgInput} borderRadius={20}
        paddingHorizontal={11} paddingVertical={8}
        borderWidth={1} borderColor={danger ? 'transparent' : C.border}
      >
        {loading
          ? <ActivityIndicator size="small" color={tint} style={{ width: 14, height: 14, transform: [{ scale: 0.7 }] }} />
          : <Icon size={14} strokeWidth={2} color={tint} />}
        <Text variant="caption" color={danger ? C.danger : C.textPrimary} fontWeight="600">{label}</Text>
      </Stack>
    </StyledPressable>
  )
}
