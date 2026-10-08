import React, { useState, useCallback } from 'react'
import { Platform, ActivityIndicator } from 'react-native'
import { router, useFocusEffect } from 'expo-router'
import * as ExpoClipboard from 'expo-clipboard'
import {
  StyledPage, StyledScrollView, Stack, StyledCard, TabBar, type TabItem,
  toastService, dialogueService,
} from 'fluent-styles'
import { Text } from '../../src/components/Text'
import { ScreenHeader } from '../../src/components/ScreenHeader'
import { EmptyState } from '../../src/components/EmptyState'
import { IconButton } from '../../src/components/IconButton'
import { ActionChip } from '../../src/components/ActionChip'
import { useColors, useIsDark, getLang, type ThemeColors } from '../../src/constants'
import { translateService } from '../../src/services/api'
import {
  ArrowRightIcon, CopyIcon, TrashIcon, ClockIcon, TypeIcon, MicIcon, CameraIcon, type IconComponent,
} from '../../src/icons'

type EntryType = 'text' | 'voice' | 'camera'
type Filter = 'all' | EntryType

type HistoryItem = {
  id:              string
  type:            EntryType
  source_text:     string
  translated_text: string
  source_lang:     string
  target_lang:     string
  created_at:      string
}

const FILTERS: TabItem<Filter>[] = [
  { value: 'all',    label: 'All'    },
  { value: 'text',   label: 'Text'   },
  { value: 'voice',  label: 'Voice'  },
  { value: 'camera', label: 'Camera' },
]

const typeMeta = (C: ThemeColors): Record<EntryType, { Icon: IconComponent; label: string; color: string; bg: string }> => ({
  text:   { Icon: TypeIcon,   label: 'TEXT',   color: C.sumColor, bg: C.sumBg  },
  voice:  { Icon: MicIcon,    label: 'VOICE',  color: C.accent,   bg: C.accentBg },
  camera: { Icon: CameraIcon, label: 'CAMERA', color: C.primary,  bg: C.primaryBg },
})

// TODAY, YESTERDAY, or the date
function dateLabel(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  if (d.toDateString() === now.toDateString()) return 'Today'
  if (d.toDateString() === new Date(now.getTime() - 86400000).toDateString()) return 'Yesterday'
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function HistoryCard({ item, onDelete, onCopy }: {
  item:     HistoryItem
  onDelete: (id: string) => void
  onCopy:   (text: string) => void
}) {
  const C = useColors()
  const meta = typeMeta(C)[item.type] ?? typeMeta(C).text
  const source = getLang(item.source_lang)
  const target = getLang(item.target_lang)

  return (
    <StyledCard backgroundColor={C.bgCard} borderRadius={14} padding={14} marginBottom={10}
      borderWidth={1} borderColor={C.border}
    >
      <Stack horizontal alignItems="center" justifyContent="space-between" marginBottom={8}>
        <Stack horizontal alignItems="center" gap={6}>
          <Text style={{ fontSize: 15 }}>{source.flag}</Text>
          <Text variant="caption" color={C.textPrimary} fontWeight="700">{item.source_lang.toUpperCase()}</Text>
          <ArrowRightIcon size={12} strokeWidth={2} color={C.textMuted} />
          <Text style={{ fontSize: 15 }}>{target.flag}</Text>
          <Text variant="caption" color={C.textPrimary} fontWeight="700">{item.target_lang.toUpperCase()}</Text>
        </Stack>
        <Stack horizontal alignItems="center" gap={4} borderRadius={8} paddingHorizontal={8} paddingVertical={3}
          backgroundColor={meta.bg}
        >
          <meta.Icon size={11} strokeWidth={2.2} color={meta.color} />
          <Text variant="caption" color={meta.color} fontWeight="700" style={{ fontSize: 10 }}>{meta.label}</Text>
        </Stack>
      </Stack>

      <Text variant="bodySmall" color={C.textSecondary} numberOfLines={1} style={{ marginBottom: 4 }}>
        {item.source_text}
      </Text>
      <Text variant="label" color={C.textPrimary} numberOfLines={2} style={{ marginBottom: 12 }}>
        {item.translated_text}
      </Text>

      <Stack horizontal alignItems="center" gap={8}>
        <ActionChip icon={CopyIcon} label="Copy" onPress={() => onCopy(item.translated_text)} />
        <ActionChip icon={TrashIcon} label="Delete" danger onPress={() => onDelete(item.id)} />
      </Stack>
    </StyledCard>
  )
}

export default function HistoryScreen() {
  const C      = useColors()
  const isDark = useIsDark()

  const [items,   setItems]   = useState<HistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filter,  setFilter]  = useState<Filter>('all')

  const loadHistory = async () => {
    try {
      const data = await translateService.history({ limit: 50 })
      setItems((data.items ?? []).map((i: any) => ({ ...i, type: i.type ?? 'text' })))
    } catch {
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  // Reload whenever the tab gains focus so new translations show up
  useFocusEffect(useCallback(() => { loadHistory() }, []))

  const handleDelete = async (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id))
    try {
      await translateService.deleteHistory(id)
    } catch {
      toastService.error('Error', 'Could not delete item')
      loadHistory()
    }
  }

  const handleClearAll = async () => {
    const ok = await dialogueService.confirm({
      title: 'Clear history?',
      message: 'All your translations will be deleted. Saved phrases stay in your phrasebook.',
      icon: '🗑️',
      confirmLabel: 'Clear all',
      cancelLabel: 'Cancel',
      destructive: true,
      theme: isDark ? 'dark' : 'light',
    })
    if (!ok) return
    const previous = items
    setItems([])
    try {
      await translateService.clearHistory()
    } catch {
      setItems(previous)
      toastService.error('Error', 'Could not clear history')
    }
  }

  const handleCopy = async (text: string) => {
    await ExpoClipboard.setStringAsync(text)
    toastService.success('Copied', 'Translation copied to clipboard')
  }

  const filtered = filter === 'all' ? items : items.filter((i) => i.type === filter)

  // Group into date sections, newest first (the API already sorts by date)
  const sections: { title: string; data: HistoryItem[] }[] = []
  for (const item of filtered) {
    const title = dateLabel(item.created_at)
    const last = sections[sections.length - 1]
    if (last?.title === title) last.data.push(item)
    else sections.push({ title, data: [item] })
  }

  return (
    <StyledPage flex={1} backgroundColor={C.bg} showStatusBar
      statusBarStyle={isDark ? 'light-content' : 'dark-content'}
      statusBarBackgroundColor={Platform.OS === 'android' ? C.bg : undefined}
    >
      <ScreenHeader
        title="History"
        variant="large"
        onBackPress={() => router.push('/(tabs)' as any)}
        rightIcon={items.length > 0
          ? <IconButton icon={TrashIcon} label="Clear all history" onPress={handleClearAll} />
          : undefined}
      />

      <TabBar
        options={FILTERS}
        value={filter}
        onChange={setFilter}
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

      <StyledScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        {loading && (
          <Stack alignItems="center" paddingTop={40}>
            <ActivityIndicator color={C.primary} />
          </Stack>
        )}

        {!loading && sections.length === 0 && (
          <EmptyState
            icon={ClockIcon}
            title={filter === 'all' ? 'No translations yet' : `No ${filter} translations`}
            subtitle="Your translation history will appear here"
          />
        )}

        {sections.map((section) => (
          <Stack key={section.title}>
            <Text variant="body" color={C.textMuted} paddingHorizontal={4} style={{ marginTop: 8, marginBottom: 8 }}>
              {section.title}
            </Text>
            {section.data.map((item) => (
              <HistoryCard key={item.id} item={item} onDelete={handleDelete} onCopy={handleCopy} />
            ))}
          </Stack>
        ))}
      </StyledScrollView>
    </StyledPage>
  )
}
