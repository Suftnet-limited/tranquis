import React, { useState, useCallback } from 'react'
import { Platform, ActivityIndicator, TextInput, ScrollView } from 'react-native'
import { router, useFocusEffect } from 'expo-router'
import * as ExpoClipboard from 'expo-clipboard'
import {
  StyledPage, StyledScrollView, Stack, StyledCard, StyledPressable, toastService, dialogueService,
} from 'fluent-styles'
import { Text } from '../../src/components/Text'
import { IconButton } from '../../src/components/IconButton'
import { EmptyState } from '../../src/components/EmptyState'
import { useColors, useIsDark, getLang } from '../../src/constants'
import { phrasebookService, type Phrase } from '../../src/services/api'
import { useTTS } from '../../src/hooks'
import {
  SearchIcon, XIcon, SpeakerIcon, CopyIcon, TrashIcon, BookmarkIcon, BookIcon,
  PlaneIcon, UtensilsIcon, BedIcon, MedicalIcon, BriefcaseIcon, StarIcon, type IconComponent,
} from '../../src/icons'

// Same keys the backend tags phrases with, in chip order
const CATEGORIES: { key: string; label: string; Icon: IconComponent }[] = [
  { key: 'travel',   label: 'Travel',   Icon: PlaneIcon     },
  { key: 'food',     label: 'Food',     Icon: UtensilsIcon  },
  { key: 'hotel',    label: 'Hotel',    Icon: BedIcon       },
  { key: 'medical',  label: 'Medical',  Icon: MedicalIcon   },
  { key: 'business', label: 'Business', Icon: BriefcaseIcon },
  { key: 'general',  label: 'General',  Icon: StarIcon      },
]
const categoryOf = (p: Phrase) => (CATEGORIES.some((c) => c.key === p.category) ? p.category! : 'general')
const categoryMeta = (key: string) => CATEGORIES.find((c) => c.key === key) ?? CATEGORIES[CATEGORIES.length - 1]

function PhraseRow({ phrase, first, onDelete, onCopy }: {
  phrase:   Phrase
  first:    boolean
  onDelete: (p: Phrase) => void
  onCopy:   (text: string) => void
}) {
  const C = useColors()
  const { speak, loading } = useTTS()
  const iconBtn = (label: string, onPress: () => void, child: React.ReactNode, disabled = false) => (
    <StyledPressable width={36} height={36} borderRadius={18} alignItems="center" justifyContent="center"
      onPress={onPress} disabled={disabled} accessibilityRole="button" accessibilityLabel={label}
    >
      {child}
    </StyledPressable>
  )
  return (
    <Stack horizontal alignItems="flex-start" gap={8} paddingHorizontal={16} paddingVertical={14}
      borderTopWidth={first ? 0 : 1} borderTopColor={C.border}
    >
      <Stack flex={1} gap={3}>
        <Text variant="subtitle" color={C.textPrimary} fontWeight="500">{phrase.source_text}</Text>
        <Text variant="subtitle" color={C.primary} fontWeight="600">{phrase.translated_text}</Text>
        {!!phrase.phonetic && (
          <Text variant="bodySmall" color={C.textMuted} fontFamily="PlusJakartaSans_400Regular_Italic">{phrase.phonetic}</Text>
        )}
      </Stack>
      <Stack horizontal marginRight={-8}>
        {iconBtn('Listen', () => speak(phrase.translated_text, phrase.target_lang),
          loading
            ? <ActivityIndicator size="small" color={C.primary} />
            : <SpeakerIcon size={19} strokeWidth={1.9} color={C.textSecondary} />,
          loading)}
        {iconBtn('Copy', () => onCopy(phrase.translated_text), <CopyIcon size={18} strokeWidth={1.9} color={C.textSecondary} />)}
        {iconBtn('Remove from phrasebook', () => onDelete(phrase), <TrashIcon size={18} strokeWidth={1.9} color={C.danger} />)}
      </Stack>
    </Stack>
  )
}

export default function PhrasebookScreen() {
  const C      = useColors()
  const isDark = useIsDark()

  const [phrases,    setPhrases]    = useState<Phrase[]>([])
  const [loading,    setLoading]    = useState(true)
  const [category,   setCategory]   = useState('all')
  const [searching,  setSearching]  = useState(false)
  const [query,      setQuery]      = useState('')

  const loadPhrases = async () => {
    try {
      setPhrases((await phrasebookService.list()) ?? [])
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

  const closeSearch = () => { setSearching(false); setQuery('') }

  // Chips: only categories the user actually has phrases in
  const present = CATEGORIES.filter((c) => phrases.some((p) => categoryOf(p) === c.key))
  const active = category === 'all' || present.some((c) => c.key === category) ? category : 'all'

  const q = query.trim().toLowerCase()
  // A search looks across the whole phrasebook, whichever chip is selected
  const visible = phrases.filter((p) => q
    ? p.source_text.toLowerCase().includes(q) || p.translated_text.toLowerCase().includes(q)
    : active === 'all' || categoryOf(p) === active)

  // Group by section, keeping each section's category for its icon
  const sections: { title: string; category: string; data: Phrase[] }[] = []
  for (const p of visible) {
    const title = p.section?.trim() || categoryMeta(categoryOf(p)).label
    const existing = sections.find((s) => s.title === title && s.category === categoryOf(p))
    if (existing) existing.data.push(p)
    else sections.push({ title, category: categoryOf(p), data: [p] })
  }
  // Categories in chip order (Travel, Food, Hotel…); sections keep save order within one
  const order = (key: string) => CATEGORIES.findIndex((c) => c.key === key)
  sections.sort((a, b) => order(a.category) - order(b.category))

  // "EN → SPANISH · TRAVEL" when every visible phrase shares a language pair
  const pairs = new Set(visible.map((p) => `${p.source_lang}|${p.target_lang}`))
  const contextLine = [
    pairs.size === 1 ? `${visible[0].source_lang.toUpperCase()} → ${getLang(visible[0].target_lang).label.toUpperCase()}` : null,
    q ? `${visible.length} RESULT${visible.length === 1 ? '' : 'S'}`
      : active === 'all' ? `${visible.length} SAVED PHRASE${visible.length === 1 ? '' : 'S'}` : categoryMeta(active).label.toUpperCase(),
  ].filter(Boolean).join(' · ')

  const chip = (key: string, label: string, Icon: IconComponent) => {
    const selected = active === key
    return (
      <StyledPressable key={key} onPress={() => setCategory(key)}
        accessibilityRole="button" accessibilityState={{ selected }} accessibilityLabel={`${label} phrases`}
      >
        <Stack horizontal alignItems="center" gap={8} paddingHorizontal={16} paddingVertical={10} borderRadius={14}
          backgroundColor={selected ? C.primaryBg : C.bgCard}
          borderWidth={selected ? 2 : 1} borderColor={selected ? C.primary : C.border}
        >
          <Icon size={17} strokeWidth={2} color={selected ? C.primary : C.textSecondary} />
          <Text variant="label" color={selected ? C.primary : C.textPrimary} fontWeight={selected ? '700' : '600'}>{label}</Text>
        </Stack>
      </StyledPressable>
    )
  }

  return (
    <StyledPage flex={1} backgroundColor={C.bgCard} showStatusBar
      statusBarStyle={isDark ? 'light-content' : 'dark-content'}
      statusBarBackgroundColor={Platform.OS === 'android' ? C.bgCard : undefined}
    >
      {/* Header */}
      <StyledPage.Header.Full>
        <Stack marginHorizontal={20} paddingBottom={12}>
          {searching ? (
            <Stack horizontal alignItems="center" gap={10}>
              <Stack flex={1} horizontal alignItems="center" gap={10} height={46}
                backgroundColor={C.bgInput} borderRadius={14} paddingHorizontal={14}
                borderWidth={1} borderColor={C.border}
              >
                <SearchIcon size={18} strokeWidth={2} color={C.textMuted} />
                <TextInput
                  value={query}
                  onChangeText={setQuery}
                  placeholder="Search your phrases…"
                  placeholderTextColor={C.textMuted}
                  autoFocus
                  style={{ flex: 1, fontFamily: 'PlusJakartaSans_400Regular', fontSize: 15, color: C.textPrimary }}
                />
              </Stack>
              <IconButton icon={XIcon} label="Close search" onPress={closeSearch} />
            </Stack>
          ) : (
            <Stack horizontal alignItems="center" justifyContent="space-between">
              <Text variant="header" color={C.textPrimary} fontWeight="800" style={{ fontSize: 28 }}>Phrasebook</Text>
              <IconButton icon={SearchIcon} label="Search phrases" onPress={() => setSearching(true)} />
            </Stack>
          )}
        </Stack>
      </StyledPage.Header.Full>

      {/* Category chips */}
      {present.length > 0 && (
        <Stack borderTopWidth={1} borderColor={C.border}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 10, paddingHorizontal: 16, paddingVertical: 14 }}
          >
            {chip('all', 'All', BookIcon)}
            {present.map((c) => chip(c.key, c.label, c.Icon))}
          </ScrollView>
        </Stack>
      )}

      <StyledScrollView
        style={{ backgroundColor: C.bg, borderTopWidth: 1, borderTopColor: C.border }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, paddingTop: 18, paddingBottom: 40 }}
      >
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

        {!loading && phrases.length > 0 && visible.length === 0 && (
          <EmptyState icon={SearchIcon} title="No matching phrases" subtitle={q ? `Nothing matches "${query}"` : 'Nothing in this category'} />
        )}

        {visible.length > 0 && (
          <Text variant="overline" color={C.textMuted} style={{ letterSpacing: 1, marginBottom: 12, marginLeft: 4 }}>
            {contextLine}
          </Text>
        )}

        {sections.map((section) => {
          const { Icon } = categoryMeta(section.category)
          return (
            <StyledCard key={`${section.category}-${section.title}`} backgroundColor={C.bgCard} borderRadius={18}
              marginBottom={14} borderWidth={1} borderColor={C.border} overflow="hidden"
            >
              <Stack horizontal alignItems="center" gap={8} paddingHorizontal={16} paddingVertical={12}
                backgroundColor={C.bgInput} borderBottomWidth={1} borderBottomColor={C.border}
              >
                <Icon size={15} strokeWidth={2.2} color={C.primary} />
                <Text variant="overline" color={C.textSecondary} style={{ letterSpacing: 1 }}>
                  {section.title.toUpperCase()}
                </Text>
              </Stack>
              {section.data.map((p, i) => (
                <PhraseRow key={p.id} phrase={p} first={i === 0} onDelete={handleDelete} onCopy={handleCopy} />
              ))}
            </StyledCard>
          )
        })}
      </StyledScrollView>
    </StyledPage>
  )
}
