import React, { useState, useEffect } from 'react'
import { Platform, TouchableOpacity, FlatList, ActivityIndicator, StyleSheet } from 'react-native'
import { Feather } from '@expo/vector-icons'
import * as ExpoClipboard from 'expo-clipboard'
import { StyledPage, Stack, toastService } from 'fluent-styles'
import { Text } from '../../src/components/Text'
import { useColors, useIsDark } from '../../src/constants'
import { translateService } from '../../src/services/api'

type HistoryItem = {
  id:             string
  type:           'text' | 'voice' | 'camera'
  source_text:    string
  translated_text: string
  source_lang:    string
  target_lang:    string
  saved:          boolean
  created_at:     string
}

const FLAG: Record<string, string> = {
  en: '🇬🇧', es: '🇪🇸', fr: '🇫🇷', de: '🇩🇪', it: '🇮🇹',
  pt: '🇵🇹', zh: '🇨🇳', ja: '🇯🇵', ko: '🇰🇷', ar: '🇸🇦',
  ru: '🇷🇺', nl: '🇳🇱',
}

const TYPE_META = {
  text:   { icon: '💬', label: 'TEXT',   color: '#3B82F6' },
  voice:  { icon: '🎙️', label: 'VOICE',  color: '#8B5CF6' },
  camera: { icon: '📷', label: 'CAMERA', color: '#10B981' },
}

const FILTERS = ['All', 'Text', 'Voice', 'Camera', 'Saved']

// Group items into date buckets (TODAY, YESTERDAY, or date string)
function groupByDate(items: HistoryItem[]): { title: string; data: HistoryItem[] }[] {
  const groups: Record<string, HistoryItem[]> = {}
  const now   = new Date()
  const today = now.toDateString()
  const yesterday = new Date(now.getTime() - 86400000).toDateString()

  for (const item of items) {
    const d = new Date(item.created_at)
    const ds = d.toDateString()
    let label: string
    if (ds === today)     label = 'TODAY'
    else if (ds === yesterday) label = 'YESTERDAY'
    else label = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).toUpperCase()
    if (!groups[label]) groups[label] = []
    groups[label].push(item)
  }
  return Object.entries(groups).map(([title, data]) => ({ title, data }))
}

function HistoryCard({
  item, onDelete, onCopy,
}: {
  item:     HistoryItem
  onDelete: (id: string) => void
  onCopy:   (text: string) => void
}) {
  const C    = useColors()
  const meta = TYPE_META[item.type]

  return (
    <Stack
      backgroundColor={C.bgCard} borderRadius={16} padding={14} marginBottom={10}
      style={{ borderWidth: 1, borderColor: C.border }}
    >
      {/* Top row: lang pair + type badge */}
      <Stack horizontal alignItems="center" justifyContent="space-between" marginBottom={8}>
        <Stack horizontal alignItems="center" gap={6}>
          <Text style={{ fontSize: 15 }}>{FLAG[item.source_lang] ?? '🌐'}</Text>
          <Text variant="caption" color={C.textPrimary} fontWeight="700">{item.source_lang.toUpperCase()}</Text>
          <Feather name="arrow-right" size={12} color={C.textMuted} />
          <Text style={{ fontSize: 15 }}>{FLAG[item.target_lang] ?? '🌐'}</Text>
          <Text variant="caption" color={C.textPrimary} fontWeight="700">{item.target_lang.toUpperCase()}</Text>
        </Stack>
        <Stack
          horizontal alignItems="center" gap={4}
          borderRadius={8} paddingHorizontal={8} paddingVertical={3}
          style={{ backgroundColor: `${meta.color}15`, borderWidth: 1, borderColor: `${meta.color}30` }}
        >
          <Text style={{ fontSize: 11 }}>{meta.icon}</Text>
          <Text variant="caption" fontWeight="700" style={{ color: meta.color, fontSize: 10 }}>
            {meta.label}
          </Text>
        </Stack>
      </Stack>

      {/* Source text */}
      <Text variant="bodySmall" color={C.textSecondary} numberOfLines={1} marginBottom={4}>
        {item.source_text}
      </Text>

      {/* Translation */}
      <Text variant="body" color={C.textPrimary} fontWeight="700" numberOfLines={2} marginBottom={12}>
        {item.translated_text}
      </Text>

      {/* Action row */}
      <Stack horizontal alignItems="center" gap={8}>
        <TouchableOpacity
          onPress={() => onCopy(item.translated_text)}
          activeOpacity={0.7}
          style={[styles.chipBtn, { backgroundColor: C.bgInput, borderColor: C.border }]}
        >
          <Feather name="copy" size={12} color={C.primary} />
          <Text variant="caption" color={C.textSecondary} fontWeight="600" style={{ marginLeft: 4 }}>Copy</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => onDelete(item.id)}
          activeOpacity={0.7}
          style={[styles.chipBtn, { backgroundColor: C.bgInput, borderColor: C.border }]}
        >
          <Feather name="trash-2" size={12} color="#EF4444" />
          <Text variant="caption" color="#EF4444" fontWeight="600" style={{ marginLeft: 4 }}>Delete</Text>
        </TouchableOpacity>
      </Stack>
    </Stack>
  )
}

export default function HistoryScreen() {
  const C      = useColors()
  const isDark = useIsDark()

  const [items,   setItems]   = useState<HistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filter,  setFilter]  = useState('All')

  useEffect(() => {
    loadHistory()
  }, [])

  const loadHistory = async () => {
    setLoading(true)
    try {
      const data = await translateService.history({ limit: 50 })
      setItems((Array.isArray(data) ? data : []).map((i: any) => ({ ...i, saved: i.saved ?? false, type: i.mode ?? 'text' })))
    } catch {
      // Fallback to empty
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id))
    try {
      // Individual deletion not yet exposed — optimistic UI only
    } catch {
      toastService.error('Error', 'Could not delete item')
    }
  }

  const handleCopy = async (text: string) => {
    await ExpoClipboard.setStringAsync(text)
    toastService.success('Copied', 'Translation copied to clipboard')
  }

  const filtered = items.filter((i) => {
    if (filter === 'All')   return true
    if (filter === 'Saved') return i.saved
    return i.type === filter.toLowerCase()
  })

  const grouped = groupByDate(filtered)

  // Flatten grouped into a list with section headers
  type ListEntry = { _type: 'header'; title: string } | { _type: 'item'; item: HistoryItem }
  const flat: ListEntry[] = []
  for (const g of grouped) {
    flat.push({ _type: 'header', title: g.title })
    for (const item of g.data) flat.push({ _type: 'item', item })
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
        <Text variant="title" color={C.textPrimary} fontWeight="800">History</Text>
        <Stack horizontal alignItems="center" gap={10}>
          <TouchableOpacity activeOpacity={0.7}>
            <Feather name="search" size={20} color={C.textSecondary} />
          </TouchableOpacity>
          {items.length > 0 && (
            <TouchableOpacity
              onPress={() => setItems([])}
              activeOpacity={0.7}
              style={[styles.clearBtn, { backgroundColor: C.bgCard, borderColor: C.border }]}
            >
              <Text variant="caption" color={C.textMuted} fontWeight="600">Clear all</Text>
            </TouchableOpacity>
          )}
        </Stack>
      </Stack>

      {/* Filter chips */}
      <Stack horizontal gap={8} paddingHorizontal={16} marginBottom={14}>
        {FILTERS.map((f) => {
          const active = filter === f
          return (
            <TouchableOpacity
              key={f}
              onPress={() => setFilter(f)}
              activeOpacity={0.7}
              style={[
                styles.filterChip,
                {
                  backgroundColor: active ? C.primary : C.bgCard,
                  borderColor: active ? C.primary : C.border,
                },
              ]}
            >
              <Text
                variant="caption"
                color={active ? '#FFF' : C.textSecondary}
                fontWeight="600"
              >
                {f}
              </Text>
            </TouchableOpacity>
          )
        })}
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
            <Feather name="clock" size={28} color={C.textMuted} />
          </Stack>
          <Text variant="body" color={C.textSecondary} textAlign="center">
            Your translation history will appear here
          </Text>
        </Stack>
      ) : (
        <FlatList
          data={flat}
          keyExtractor={(entry, idx) =>
            entry._type === 'header' ? `header-${entry.title}` : `item-${entry.item.id}-${idx}`
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
              <HistoryCard
                item={entry.item}
                onDelete={handleDelete}
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
  clearBtn: {
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 10, borderWidth: 1,
  },
  filterChip: {
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: 20, borderWidth: 1,
  },
  chipBtn: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 10, borderWidth: 1,
  },
})
