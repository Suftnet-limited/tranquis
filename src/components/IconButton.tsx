import React from 'react'
import { StyledPressable } from 'fluent-styles'
import { useColors } from '../constants'
import type { IconComponent } from '../icons'

interface IconButtonProps {
  icon:          IconComponent
  onPress:       () => void
  label:         string        // accessibility label
  size?:         number
  iconSize?:     number
  color?:        string
  background?:   string
  disabled?:     boolean
}

// Round icon button used in headers and toolbars — the NailBid header buttons
// (settings gear, lock) rolled into one component.
export function IconButton({ icon: Icon, onPress, label, size = 44, iconSize = 19, color, background, disabled }: IconButtonProps) {
  const C = useColors()
  return (
    <StyledPressable
      width={size} height={size} borderRadius={size / 2}
      backgroundColor={background ?? C.bgMuted}
      alignItems="center" justifyContent="center"
      onPress={onPress} disabled={disabled}
      accessibilityRole="button" accessibilityLabel={label}
      style={{ opacity: disabled ? 0.5 : 1 }}
    >
      <Icon size={iconSize} strokeWidth={1.8} color={color ?? C.textSecondary} />
    </StyledPressable>
  )
}
