import React, { useState, useMemo } from 'react'
import { Platform, TextInput, TouchableOpacity, FlatList, StyleSheet } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { Feather } from '@expo/vector-icons'
import { StyledPage, Stack, StyledPressable } from 'fluent-styles'
import { Text } from '../src/components/Text'
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
    router.back()
  }

  return (
    <StyledPage flex={1} backgroundColor={C.bg} showStatusBar
      statusBarStyle={isDark ? 'light-content' : 'dark-content'}
      statusBarBackgroundColor={Platform.OS === 'android' ? C.bg : undefined}
    >
      {/* Header */}
      <Stack
        horizontal alignItems="center" gap={12}
        paddingHorizontal={16} paddingTop={Platform.OS === 'ios' ? 56 : 20} paddingBottom={12}
        backgroundColor={C.bg}
        style={{ borderBottomWidth: 1, borderBottomColor: C.border }}
      >
        <StyledPressable onPress={() => router.back()} hitSlop={10}>
          <Feather name="x" size={22} color={C.textPrimary} />
        </StyledPressable>
        <Text variant="title" color={C.textPrimary} fontWeight="800" style={{ flex: 1 }}>
          {side === 'source' ? 'Translate from' : 'Translate to'}
        </Text>
      </Stack>

      {/* Search bar */}
      <Stack
        margin={16} marginBottom={8} horizontal alignItems="center" gap={10}
        backgroundColor={C.bgCard} borderRadius={16} paddingHorizontal={14} paddingVertical={10}
        style={{ borderWidth: 1, borderColor: C.border }}
      >
        <Feather name="search" size={18} color={C.textMuted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search languages…"
          placeholderTextColor={C.textMuted}
          autoFocus
          style={{
            flex: 1,
            fontFamily: 'PlusJakartaSans_400Regular',
            fontSize: 15,
            color: C.textPrimary,
          }}
        />
        {!!query && (
          <StyledPressable onPress={() => setQuery('')} hitSlop={8}>
            <Feather name="x-circle" size={16} color={C.textMuted} />
          </StyledPressable>
        )}
      </Stack>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.code}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item }) => {
          const isSelected = item.code === current
          return (
            <TouchableOpacity
              onPress={() => handleSelect(item.code)}
              activeOpacity={0.7}
            >
              <Stack
                horizontal alignItems="center" gap={14}
                paddingVertical={14} paddingHorizontal={16}
                marginBottom={6} borderRadius={16}
                backgroundColor={isSelected ? C.primaryBg : C.bgCard}
                style={[
                  { borderWidth: 1, borderColor: isSelected ? `${C.primary}40` : C.border },
                  isSelected && styles.selectedShadow,
                ]}
              >
                <Text style={{ fontSize: 26 }}>{item.flag}</Text>
                <Stack flex={1}>
                  <Text variant="body" color={C.textPrimary} fontWeight={isSelected ? '700' : '500'}>
                    {item.label}
                  </Text>
                  <Text variant="caption" color={C.textMuted} style={{ marginTop: 1 }}>
                    {item.code.toUpperCase()}
                  </Text>
                </Stack>
                {isSelected && (
                  <Stack
                    width={24} height={24} borderRadius={12}
                    alignItems="center" justifyContent="center"
                    backgroundColor={C.primary}
                  >
                    <Feather name="check" size={14} color="#FFF" />
                  </Stack>
                )}
              </Stack>
            </TouchableOpacity>
          )
        }}
        ListEmptyComponent={
          <Stack alignItems="center" justifyContent="center" paddingTop={60} gap={12}>
            <Text style={{ fontSize: 36 }}>🔍</Text>
            <Text variant="body" color={C.textSecondary} textAlign="center">
              No language matching "{query}"
            </Text>
          </Stack>
        }
      />
    </StyledPage>
  )
}

const styles = StyleSheet.create({
  selectedShadow: {
    shadowColor: '#14B8A6',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
})
