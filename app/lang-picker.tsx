import React, { useState, useMemo } from 'react'
import { Platform, TextInput, FlatList } from 'react-native'
import { useLocalSearchParams } from 'expo-router'
import { StyledPage, Stack, StyledCard, StyledPressable } from 'fluent-styles'
import { Text } from '../src/components/Text'
import { ScreenHeader } from '../src/components/ScreenHeader'
import { EmptyState } from '../src/components/EmptyState'
import { goBack } from '../src/utils'
import { SearchIcon, XCircleIcon, CheckIcon } from '../src/icons'
import { useColors, useIsDark, LANGUAGES } from '../src/constants'
import { useTranslatorStore } from '../src/stores'

export default function LangPickerScreen() {
  const C      = useColors()
  const isDark = useIsDark()
  const { side } = useLocalSearchParams<{ side: 'source' | 'target' }>()

  const { sourceLang, targetLang, setSource, setTarget } = useTranslatorStore()
  const [query, setQuery] = useState('')

  const current = side === 'source' ? sourceLang : targetLang

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim()
    if (!q) return LANGUAGES
    return LANGUAGES.filter(
      (l) => l.label.toLowerCase().includes(q) || l.code.toLowerCase().includes(q)
    )
  }, [query])

  const handleSelect = (code: string) => {
    if (side === 'source') setSource(code)
    else setTarget(code)
    goBack()
  }

  return (
    <StyledPage flex={1} backgroundColor={C.bg}
      statusBarStyle={isDark ? 'light-content' : 'dark-content'}
      statusBarBackgroundColor={Platform.OS === 'android' ? C.bg : undefined}
    >
      <ScreenHeader
        title={side === 'source' ? 'Translate from' : 'Translate to'}
        onBackPress={() => goBack()}
        marginTop={16}
      />

      {/* Search */}
      <StyledCard
        flexDirection="row" alignItems="center" gap={10}
        marginHorizontal={16} marginTop={12} marginBottom={8}
        backgroundColor={C.bgCard} borderRadius={14} paddingHorizontal={14} paddingVertical={10}
        borderWidth={1} borderColor={C.border}
      >
        <SearchIcon size={18} strokeWidth={2} color={C.textMuted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search languages…"
          placeholderTextColor={C.textMuted}
          autoFocus
          style={{ flex: 1, fontFamily: 'PlusJakartaSans_400Regular', fontSize: 15, color: C.textPrimary }}
        />
        {!!query && (
          <StyledPressable onPress={() => setQuery('')} hitSlop={8} accessibilityRole="button" accessibilityLabel="Clear search">
            <XCircleIcon size={16} strokeWidth={2} color={C.textMuted} />
          </StyledPressable>
        )}
      </StyledCard>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.code}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 4, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item }) => {
          const selected = item.code === current
          return (
            <StyledPressable onPress={() => handleSelect(item.code)}
              accessibilityRole="button" accessibilityState={{ selected }} accessibilityLabel={item.label}
            >
              <StyledCard
                flexDirection="row" alignItems="center" gap={14}
                paddingVertical={13} paddingHorizontal={16} marginBottom={6} borderRadius={14}
                backgroundColor={selected ? C.primaryBg : C.bgCard}
                borderWidth={1} borderColor={selected ? C.primary : C.border}
              >
                <Text style={{ fontSize: 26 }}>{item.flag}</Text>
                <Stack flex={1}>
                  <Text variant="label" color={C.textPrimary} fontWeight={selected ? '700' : '500'}>{item.label}</Text>
                  <Text variant="caption" color={C.textMuted} style={{ marginTop: 1 }}>{item.code.toUpperCase()}</Text>
                </Stack>
                {selected && (
                  <Stack width={24} height={24} borderRadius={12} alignItems="center" justifyContent="center" backgroundColor={C.primary}>
                    <CheckIcon size={14} strokeWidth={2.6} color={C.white} />
                  </Stack>
                )}
              </StyledCard>
            </StyledPressable>
          )
        }}
        ListEmptyComponent={
          <EmptyState icon={SearchIcon} title="No languages found" subtitle={`Nothing matches "${query}"`} />
        }
      />
    </StyledPage>
  )
}
