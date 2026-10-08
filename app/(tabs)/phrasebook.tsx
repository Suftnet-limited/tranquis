import React, { useState, useCallback } from 'react'
import { Platform, ActivityIndicator } from 'react-native'
import { router, useFocusEffect } from 'expo-router'
import * as ExpoClipboard from 'expo-clipboard'
import {
  StyledPage, StyledScrollView, Stack, StyledCard, StyledPressable, TabBar, type TabItem,
  toastService, dialogueService,
} from 'fluent-styles'
import { Text } from '../../src/components/Text'
import { ScreenHeader } from '../../src/components/ScreenHeader'
import { EmptyState } from '../../src/components/EmptyState'
import { useColors, useIsDark, getLang } from '../../src/constants'
import { phrasebookService, type Phrase } from '../../src/services/api'
import { useTTS } from '../../src/hooks'
import { BookmarkIcon, SpeakerIcon, CopyIcon, TrashIcon } from '../../src/icons'

const GENERAL = 'General'

const categoryOf = (p: Phrase) => p.category?.trim() || GENERAL
const titleCase = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

function PhraseCard({ phrase, onDelete, onCopy }: {
  phrase:   Phrase
  onDelete: (p: Phrase) => void
  onCopy:   (text: string) => void
}) {
  const C = useColors()
  const { speak, loading } = useTTS()
  const target = getLang(phrase.target_lang)

  const iconBtn = (label: string, onPress: () => void, child: React.ReactNode, disabled = false) => (
    <StyledPressable
      width={36} height={36} borderRadius={18} alignItems="center" justifyContent="center"
      backgroundColor={C.bgInput} onPress={onPress} disabled={disabled}
      accessibilityRole="button" accessibilityLabel={label}
    >
      {child}
    </StyledPressable>
  )

  return (
    <StyledCard backgroundColor={C.bgCard} borderRadius={14} padding={14} marginBottom={10}
      borderWidth={1} borderColor={C.border}
    >
      <Stack horizontal alignItems="flex-start" gap={12}>
        <Stack flex={1} gap={4}>
          <Text variant="bodySmall" color={C.textSecondary}>{phrase.source_text}</Text>
          <Text variant="label" color={C.primary}>{phrase.translated_text}</Text>
          {!!phrase.phonetic && (
            <Text variant="caption" color={C.textMuted} style={{ fontStyle: 'italic' }}>{phrase.phonetic}</Text>
          )}
          <Text variant="caption" color={C.textMuted} style={{ marginTop: 2 }}>
            {target.flag} {target.label}
          </Text>
        </Stack>
        <Stack horizontal gap={6}>
          {iconBtn('Listen', () => speak(phrase.translated_text, phrase.target_lang),
            loading
              ? <ActivityIndicator size="small" color={C.primary} />
              : <SpeakerIcon size={16} strokeWidth={1.9} color={C.primary} />,
            loading)}
          {iconBtn('Copy', () => onCopy(phrase.translated_text), <CopyIcon size={15} strokeWidth={1.9} color={C.primary} />)}
          {iconBtn('Remove from phrasebook', () => onDelete(phrase), <TrashIcon size={15} strokeWidth={1.9} color={C.danger} />)}
        </Stack>
      </Stack>
    </StyledCard>
  )
}

export default function PhrasebookScreen() {
  const C      = useColors()
  const isDark = useIsDark()

  const [phrases,  setPhrases]  = useState<Phrase[]>([])
  const [loading,  setLoading]  = useState(true)
  const [category, setCategory] = useState('all')

  const loadPhrases = async () => {
    try {
      const data = await phrasebookService.list()
      setPhrases(data ?? [])
    } catch {
      setPhrases([])
    } finally {
      setLoading(false)
    }
  }

  // Reload on focus — phrases are saved from the other tabs
  useFocusEffect(useCallback(() => { loadPhrases() }, []))

  const handleDelete = async (phrase: Phrase) => {
    const ok = await dialogueService.confirm({
      title: 'Remove phrase?',
      message: `"${phrase.translated_text}" will be removed from your phrasebook.`,
      icon: '🔖',
      confirmLabel: 'Remove',
      cancelLabel: 'Cancel',
      destructive: true,
      theme: isDark ? 'dark' : 'light',
    })
    if (!ok) return
    setPhrases((prev) => prev.filter((p) => p.id !== phrase.id))
    try {
      await phrasebookService.delete(phrase.id)
    } catch {
      toastService.error('Error', 'Could not remove phrase')
      loadPhrases()
    }
  }

  const handleCopy = async (text: string) => {
    await ExpoClipboard.setStringAsync(text)
    toastService.success('Copied', 'Phrase copied to clipboard')
  }

  // Tabs come from the categories the user's phrases actually use
  const categories = Array.from(new Set(phrases.map(categoryOf)))
  const tabs: TabItem<string>[] = [
    { value: 'all', label: 'All' },
    ...categories.map((c) => ({ value: c, label: titleCase(c) })),
  ]
  const activeCategory = category === 'all' || categories.includes(category) ? category : 'all'
  const visible = activeCategory === 'all' ? phrases : phrases.filter((p) => categoryOf(p) === activeCategory)

  const sections = (activeCategory === 'all' ? categories : [activeCategory])
    .map((c) => ({ title: titleCase(c), data: visible.filter((p) => categoryOf(p) === c) }))
    .filter((s) => s.data.length > 0)

  return (
    <StyledPage flex={1} backgroundColor={C.bg} showStatusBar
      statusBarStyle={isDark ? 'light-content' : 'dark-content'}
      statusBarBackgroundColor={Platform.OS === 'android' ? C.bg : undefined}
    >
      <ScreenHeader
        title="Phrasebook"
        subtitle={phrases.length ? `${phrases.length} saved phrase${phrases.length === 1 ? '' : 's'}` : undefined}
        variant="large"
        onBackPress={() => router.push('/(tabs)' as any)}
      />

      {categories.length > 1 && (
        <TabBar
          options={tabs}
          value={activeCategory}
          onChange={setCategory}
          indicator="line"
          showBorder
          tabAlign="scroll"
          style={{ marginTop: 12, marginHorizontal: 16 }}
          colors={{
            background: C.bgCard,
            activeText: C.primary,
            indicator:  C.primary,
            text:       C.textSecondary,
            border:     C.border,
          }}
        />
      )}

      <StyledScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        {loading && (
          <Stack alignItems="center" paddingTop={40}>
            <ActivityIndicator color={C.primary} />
          </Stack>
        )}

        {!loading && phrases.length === 0 && (
          <EmptyState
            icon={BookmarkIcon}
            title="No saved phrases yet"
            subtitle="Tap Save on any translation to keep it here"
            action={{ label: 'Translate something', onPress: () => router.push('/(tabs)' as any) }}
          />
        )}

        {sections.map((section) => (
          <Stack key={section.title}>
            {sections.length > 1 && (
              <Text variant="body" color={C.textMuted} paddingHorizontal={4} style={{ marginTop: 8, marginBottom: 8 }}>
                {section.title}
              </Text>
            )}
            {section.data.map((p) => (
              <PhraseCard key={p.id} phrase={p} onDelete={handleDelete} onCopy={handleCopy} />
            ))}
          </Stack>
        ))}
      </StyledScrollView>
    </StyledPage>
  )
}
