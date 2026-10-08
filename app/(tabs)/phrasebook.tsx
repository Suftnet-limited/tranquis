import React, { useState, useEffect } from 'react'
import { Platform, TouchableOpacity, FlatList, ActivityIndicator, StyleSheet } from 'react-native'
import { Feather } from '@expo/vector-icons'
import * as ExpoClipboard from 'expo-clipboard'
import { StyledPage, Stack, toastService } from 'fluent-styles'
import { Text } from '../../src/components/Text'
import { useColors, useIsDark } from '../../src/constants'
import { phrasebookService, Phrase } from '../../src/services/api'

const CATEGORY_TABS = [
  { key: 'all',      label: 'All',     emoji: '⭐' },
  { key: 'travel',   label: 'Travel',  emoji: '✈️' },
  { key: 'food',     label: 'Food',    emoji: '🍽️' },
  { key: 'hotel',    label: 'Hotel',   emoji: '🏨' },
  { key: 'medical',  label: 'Medical', emoji: '🏥' },
  { key: 'business', label: 'Business',emoji: '💼' },
]

// Group phrases by category for section display
function groupByCategory(items: Phrase[]): { title: string; data: Phrase[] }[] {
  const groups: Record<string, Phrase[]> = {}
  for (const p of items) {
    const cat = p.category ?? 'General'
    if (!groups[cat]) groups[cat] = []
    groups[cat].push(p)
  }
  return Object.entries(groups).map(([title, data]) => ({ title: title.toUpperCase(), data }))
}

// Section header labels per category
const SECTION_LABELS: Record<string, string> = {
  travel:   'AIRPORT & TRANSPORT',
  food:     'RESTAURANTS & DINING',
  hotel:    'ACCOMMODATION',
  medical:  'HEALTH & EMERGENCY',
  business: 'MEETINGS & WORK',
  general:  'GENERAL',
}

function PhraseRow({ phrase, onDelete, onListen, onCopy }: {
  phrase:   Phrase
  onDelete: (id: string) => void
  onListen: (text: string, lang: string) => void
  onCopy:   (text: string) => void
}) {
  const C = useColors()

  return (
    <Stack
      backgroundColor={C.bgCard} borderRadius={14} padding={14} marginBottom={10}
      style={{ borderWidth: 1, borderColor: C.border }}
    >
      <Stack horizontal alignItems="flex-start" justifyContent="space-between">
        <Stack flex={1} marginRight={12}>
          {/* Source text */}
          <Text variant="bodySmall" color={C.textSecondary} marginBottom={4}>
            {phrase.source_text}
          </Text>
          {/* Translation */}
          <Text variant="body" color={C.primary} fontWeight="700" marginBottom={4}>
            {phrase.translated_text}
          </Text>
          {/* Phonetic */}
          {!!phrase.phonetic && (
            <Text
              variant="caption"
              color={C.textMuted}
              style={{ fontStyle: 'italic' }}
            >
              {phrase.phonetic}
            </Text>
          )}
        </Stack>

        {/* Action icons */}
        <Stack horizontal alignItems="center" gap={12}>
          <TouchableOpacity
            onPress={() => onListen(phrase.translated_text, phrase.target_lang)}
            activeOpacity={0.7}
          >
            <Text style={{ fontSize: 20 }}>🔊</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => onDelete(phrase.id)}
            activeOpacity={0.7}
          >
            <Text style={{ fontSize: 20 }}>⭐</Text>
          </TouchableOpacity>
        </Stack>
      </Stack>
    </Stack>
  )
}

export default function PhrasebookScreen() {
  const C      = useColors()
  const isDark = useIsDark()

  const [phrases,  setPhrases]  = useState<Phrase[]>([])
  const [loading,  setLoading]  = useState(true)
  const [category, setCategory] = useState('all')

  useEffect(() => {
    loadPhrases()
  }, [])

  const loadPhrases = async () => {
    setLoading(true)
    try {
      const data = await phrasebookService.list()
      setPhrases(data ?? [])
    } catch {
      setPhrases([])
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    setPhrases((prev) => prev.filter((p) => p.id !== id))
    try {
      await phrasebookService.delete(id)
    } catch {
      // Re-load on error
      loadPhrases()
    }
  }

  const handleListen = (text: string, lang: string) => {
    // TTS — Sprint 3
  }

  const handleCopy = async (text: string) => {
    await ExpoClipboard.setStringAsync(text)
    toastService.success('Copied', 'Phrase copied to clipboard')
  }

  const filtered = category === 'all'
    ? phrases
    : phrases.filter((p) => (p.category ?? '').toLowerCase() === category)

  const grouped = groupByCategory(filtered)

  // Flatten into list with section headers
  type ListEntry =
    | { _type: 'header'; title: string }
    | { _type: 'item';   phrase: Phrase }

  const flat: ListEntry[] = []
  for (const g of grouped) {
    const key = g.title.toLowerCase()
    const sectionLabel = Object.entries(SECTION_LABELS).find(([k]) => g.title.toLowerCase().includes(k))?.[1] ?? g.title
    flat.push({ _type: 'header', title: sectionLabel })
    for (const phrase of g.data) flat.push({ _type: 'item', phrase })
  }

  return (
    <StyledPage flex={1} backgroundColor={C.bg} showStatusBar
      statusBarStyle={isDark ? 'light-content' : 'dark-content'}
      statusBarBackgroundColor={Platform.OS === 'android' ? C.bg : undefined}
    >
      {/* Header */}
      <Stack horizontal alignItems="center" justifyContent="space-between"
        paddingHorizontal={16} paddingTop={8} marginBottom={12}
      >
        <Stack horizontal alignItems="center" gap={10}>
          <Text variant="title" color={C.textPrimary} fontWeight="800">Phrasebook</Text>
          {phrases.length > 0 && (
            <Stack
              backgroundColor={C.primaryBg} borderRadius={10}
              paddingHorizontal={8} paddingVertical={3}
              style={{ borderWidth: 1, borderColor: `${C.primary}30` }}
            >
              <Text variant="caption" color={C.primary} fontWeight="700">{phrases.length}</Text>
            </Stack>
          )}
        </Stack>
        <TouchableOpacity activeOpacity={0.7}>
          <Feather name="search" size={20} color={C.textSecondary} />
        </TouchableOpacity>
      </Stack>

      {/* Category tabs */}
      <Stack horizontal gap={8} paddingHorizontal={16} marginBottom={16} style={{ flexWrap: 'nowrap' }}>
        <FlatList
          data={CATEGORY_TABS}
          keyExtractor={(t) => t.key}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8 }}
          renderItem={({ item: tab }) => {
            const active = category === tab.key
            return (
              <TouchableOpacity
                onPress={() => setCategory(tab.key)}
                activeOpacity={0.7}
                style={[
                  styles.categoryTab,
                  {
                    backgroundColor: active ? C.primary : C.bgCard,
                    borderColor: active ? C.primary : C.border,
                  },
                ]}
              >
                <Text style={{ fontSize: 14 }}>{tab.emoji}</Text>
                <Text
                  variant="caption"
                  color={active ? '#FFF' : C.textSecondary}
                  fontWeight="600"
                  style={{ marginLeft: 5 }}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            )
          }}
        />
      </Stack>

      {loading ? (
        <Stack flex={1} alignItems="center" justifyContent="center">
          <ActivityIndicator color={C.primary} />
        </Stack>
      ) : flat.length === 0 ? (
        <Stack flex={1} alignItems="center" justifyContent="center" gap={14} paddingHorizontal={32}>
          <Stack
            width={64} height={64} borderRadius={32}
            alignItems="center" justifyContent="center"
            backgroundColor={C.bgCard}
            style={{ borderWidth: 1, borderColor: C.border }}
          >
            <Text style={{ fontSize: 28 }}>⭐</Text>
          </Stack>
          <Text variant="body" color={C.textSecondary} textAlign="center">
            Save phrases from your translations to build your phrasebook
          </Text>
        </Stack>
      ) : (
        <FlatList
          data={flat}
          keyExtractor={(entry, idx) =>
            entry._type === 'header'
              ? `header-${entry.title}-${idx}`
              : `phrase-${entry.phrase.id}`
          }
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item: entry }) => {
            if (entry._type === 'header') {
              return (
                <Text
                  variant="caption"
                  color={C.textMuted}
                  fontWeight="700"
                  style={{ letterSpacing: 0.8, marginTop: 16, marginBottom: 8 }}
                >
                  {entry.title}
                </Text>
              )
            }
            return (
              <PhraseRow
                phrase={entry.phrase}
                onDelete={handleDelete}
                onListen={handleListen}
                onCopy={handleCopy}
              />
            )
          }}
        />
      )}
    </StyledPage>
  )
}

const styles = StyleSheet.create({
  categoryTab: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1,
  },
})
