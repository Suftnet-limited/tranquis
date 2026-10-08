import React from 'react'
import { Text } from './Text'
import { useColors } from '../constants'

// Muted label above a group of cards — the NailBid "Business details" label
export function SectionLabel({ children, marginTop = 0 }: { children: React.ReactNode; marginTop?: number }) {
  const C = useColors()
  return (
    <Text variant="body" color={C.textMuted} paddingHorizontal={4} style={{ marginTop, marginBottom: 8 }}>
      {children}
    </Text>
  )
}
