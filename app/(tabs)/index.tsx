import React, { useState, useRef } from 'react'
import {
  TextInput, ScrollView, TouchableOpacity, ActivityIndicator,
  Platform, StyleSheet,
} from 'react-native'
import { router } from 'expo-router'
import { Feather } from '@expo/vector-icons'
import * as ExpoClipboard from 'expo-clipboard'
import { StyledPage, Stack } from 'fluent-styles'
import { Text } from '../../src/components/Text'
import { useColors, useIsDark, getLang } from '../../src/constants'
import { useTranslatorStore } from '../../src/stores'
import { useTranslate } from '../../src/hooks'

// ─── Language Pair Row ─────────────────────────────────────────────────────────
function LangPairRow() {
  const C      = useColors()
  const { sourceLang, targetLang, swapLangs } = useTranslatorStore()
  const source = getLang(sourceLang)
  const target = getLang(targetLang)

  const openPicker = (side: 'source' | 'target') => {
    router.push({ pathname: '/lang-picker', params: { side } } as any)
  }

  return (
    <Stack horizontal alignItems="center" gap={8} marginBottom={14}>
      <TouchableOpacity
        style={[styles.langBtn, { backgroundColor: C.bgCard, borderColor: C.border }]}
        onPress={() => openPicker('source')}
        activeOpacity={0.7}
      >
        <Text style={{ fontSize: 20 }}>{source.flag}</Text>
        <Text variant="label" color={C.textPrimary} fontWeight="700" marginLeft={6}>{source.label}</Text>
        <Feather name="chevron-down" size={14} color={C.textMuted} style={{ marginLeft: 4 }} />
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.swapBtn, { backgroundColor: C.primaryBg, borderColor: `${C.primary}30` }]}
        onPress={swapLangs}
        activeOpacity={0.7}
      >
        <Feather name="repeat" size={18} color={C.primary} />
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.langBtn, { backgroundColor: C.bgCard, borderColor: C.border }]}
        onPress={() => openPicker('target')}
        activeOpacity={0.7}
      >
        <Text style={{ fontSize: 20 }}>{target.flag}</Text>
        <Text variant="label" color={C.textPrimary} fontWeight="700" marginLeft={6}>{target.label}</Text>
        <Feather name="chevron-down" size={14} color={C.textMuted} style={{ marginLeft: 4 }} />
      </TouchableOpacity>
    </Stack>
  )
}


// ─── Translation Result Card ───────────────────────────────────────────────────
function ResultCard({ result, onSave, onCopy, onListen }: {
  result: { id: string; translated_text: string; explanation?: string }
  onSave:   () => void
  onCopy:   () => void
  onListen: () => void
}) {
  const C = useColors()
  return (
    <Stack
      backgroundColor={`${C.primary}15`}
      borderRadius={20}
      padding={18}
      marginTop={12}
      style={{ borderWidth: 1, borderColor: `${C.primary}40` }}
    >
      <Text variant="title" color={C.textPrimary} style={{ lineHeight: 30, marginBottom: 14 }}>
        {result.translated_text}
      </Text>

      {!!result.explanation && (
        <Stack
          backgroundColor={C.primaryBg}
          borderRadius={12}
          padding={12}
          marginBottom={14}
          style={{ borderWidth: 1, borderColor: `${C.primary}25` }}
        >
          <Stack horizontal alignItems="center" gap={6} marginBottom={6}>
            <Feather name="info" size={14} color={C.primary} />
            <Text variant="caption" color={C.primary} fontWeight="700">Explanation</Text>
          </Stack>
          <Text variant="bodySmall" color={C.textSecondary} style={{ lineHeight: 20 }}>
            {result.explanation}
          </Text>
        </Stack>
      )}

      <Stack horizontal gap={8} flexWrap="wrap">
        {[
          { icon: 'volume-2', label: 'Listen', onPress: onListen },
          { icon: 'copy',     label: 'Copy',   onPress: onCopy   },
          { icon: 'bookmark', label: 'Save',   onPress: onSave   },
        ].map((a) => (
          <TouchableOpacity
            key={a.label}
            onPress={a.onPress}
            activeOpacity={0.7}
            style={[styles.actionChip, { backgroundColor: C.bgCard, borderColor: C.border }]}
          >
            <Feather name={a.icon as any} size={13} color={C.primary} />
            <Text variant="caption" color={C.textPrimary} fontWeight="600" style={{ marginLeft: 5 }}>
              {a.label}
            </Text>
          </TouchableOpacity>
        ))}
      </Stack>
    </Stack>
  )
}

// ─── Quick Phrases ─────────────────────────────────────────────────────────────
const QUICK_PHRASES = [
  { emoji: '🏥', text: 'Where is the nearest hospital?' },
  { emoji: '💰', text: 'How much does this cost?' },
  { emoji: '🗣️', text: 'Can you speak more slowly?' },
  { emoji: '🍽️', text: 'I would like to order food.' },
  { emoji: '🙏', text: 'Thank you very much.' },
]

// ─── Quota pill shown in header ────────────────────────────────────────────────
function QuotaPill({ used, limit }: { used: number; limit: number }) {
  const C = useColors()
  const remaining = Math.max(0, limit - used)
  const pct = used / limit
  const color = pct >= 1 ? '#EF4444' : pct >= 0.8 ? '#F59E0B' : '#22C55E'
  return (
    <Stack horizontal alignItems="center" gap={5}
      style={{ backgroundColor: C.bgCard, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: C.border }}
    >
      <Stack width={6} height={6} borderRadius={3} backgroundColor={color} />
      <Text variant="caption" color={C.textSecondary} fontWeight="600">
        {remaining}/{limit} left
      </Text>
    </Stack>
  )
}

// ─── Main Screen ───────────────────────────────────────────────────────────────
export default function TranslateScreen() {
  const C      = useColors()
  const isDark = useIsDark()

  const [text, setText] = useState('')
  const inputRef = useRef<TextInput>(null)

  const { translate, saveToPhrasebook, loading, result, clear, quota, quotaExceeded } = useTranslate()

  const handleTranslate = () => {
    if (!text.trim()) return
    translate(text)
  }

  const handlePaste = async () => {
    try {
      const t = await ExpoClipboard.getStringAsync()
      if (t) setText(t)
    } catch {}
  }

  const handleCopyResult = async () => {
    if (!result) return
    await ExpoClipboard.setStringAsync(result.translated_text)
  }

  const handleSave = () => {
    if (!result) return
    saveToPhrasebook(result.id)
  }

  const handleListen = () => {
    // TTS — wired in voice tab
  }

  const handleClear = () => {
    setText('')
    clear()
  }

  return (
    <StyledPage flex={1} backgroundColor={C.bg} showStatusBar
      statusBarStyle={isDark ? 'light-content' : 'dark-content'}
      statusBarBackgroundColor={Platform.OS === 'android' ? C.bg : undefined}
    >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Stack horizontal alignItems="center" justifyContent="space-between" marginBottom={20} marginTop={8}>
          <Stack horizontal alignItems="center" gap={8}>
            <Text variant="title" color={C.textPrimary} fontWeight="800">Tranquis</Text>
            {quota && !quota.unlimited && (
              <QuotaPill used={quota.used} limit={quota.limit} />
            )}
          </Stack>
          <TouchableOpacity
            onPress={() => router.push('/profile' as any)}
            activeOpacity={0.7}
            style={[styles.settingsBtn, { backgroundColor: C.bgCard, borderColor: C.border }]}
          >
            <Feather name="settings" size={18} color={C.textSecondary} />
          </TouchableOpacity>
        </Stack>

        {/* Quota exceeded banner */}
        {quotaExceeded && (
          <TouchableOpacity onPress={() => router.push('/premium' as any)} activeOpacity={0.85}>
            <Stack
              horizontal alignItems="center" gap={10}
              backgroundColor="#FEF3C7"
              borderRadius={16} padding={14} marginBottom={14}
              style={{ borderWidth: 1, borderColor: '#FDE68A' }}
            >
              <Feather name="zap" size={18} color="#D97706" />
              <Stack flex={1}>
                <Text variant="label" color="#92400E" fontWeight="700">Daily limit reached</Text>
                <Text variant="caption" color="#92400E">Upgrade to Pro for unlimited translations →</Text>
              </Stack>
            </Stack>
          </TouchableOpacity>
        )}

        {/* Lang pair */}
        <LangPairRow />

        {/* Input card */}
        <Stack
          backgroundColor={C.bgCard}
          borderRadius={20}
          padding={16}
          style={{ borderWidth: 1, borderColor: C.border, minHeight: 140 }}
        >
          <TextInput
            ref={inputRef}
            value={text}
            onChangeText={(t) => { setText(t); if (!t) clear() }}
            placeholder="Type or paste text to translate…"
            placeholderTextColor={C.textMuted}
            multiline
            style={{
              flex: 1, minHeight: 90,
              fontFamily: 'PlusJakartaSans_400Regular',
              fontSize: 16, lineHeight: 24,
              color: C.textPrimary,
              textAlignVertical: 'top',
            }}
          />

          <Stack horizontal alignItems="center" justifyContent="space-between" marginTop={10}>
            <Stack horizontal gap={14}>
              <TouchableOpacity onPress={() => router.push('/(tabs)/voice' as any)} activeOpacity={0.7}>
                <Feather name="mic" size={20} color={C.primary} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => router.push('/(tabs)/camera' as any)} activeOpacity={0.7}>
                <Feather name="camera" size={20} color={C.primary} />
              </TouchableOpacity>
              <TouchableOpacity onPress={handlePaste} activeOpacity={0.7}>
                <Feather name="clipboard" size={20} color={C.primary} />
              </TouchableOpacity>
              {!!text && (
                <TouchableOpacity onPress={handleClear} activeOpacity={0.7}>
                  <Feather name="x" size={20} color={C.textMuted} />
                </TouchableOpacity>
              )}
            </Stack>

            <Stack horizontal alignItems="center" gap={8}>
              {!!text && (
                <Text variant="caption" color={C.textMuted}>{text.length}/5000</Text>
              )}
              <TouchableOpacity
                onPress={handleTranslate}
                disabled={!text.trim() || loading}
                activeOpacity={0.7}
                style={[
                  styles.translateBtn,
                  { backgroundColor: text.trim() ? C.primary : C.bgMuted }
                ]}
              >
                {loading
                  ? <ActivityIndicator size="small" color="#FFF" />
                  : <Feather name="arrow-right" size={18} color={text.trim() ? '#FFF' : C.textMuted} />}
              </TouchableOpacity>
            </Stack>
          </Stack>
        </Stack>

        {/* Result */}
        {result && (
          <ResultCard
            result={result}
            onSave={handleSave}
            onCopy={handleCopyResult}
            onListen={handleListen}
          />
        )}

        {/* Quick phrases */}
        {!result && !text && (
          <Stack marginTop={24}>
            <Text variant="label" color={C.textSecondary} fontWeight="700" style={{ letterSpacing: 0.8 }} marginBottom={12}>
              QUICK PHRASES
            </Text>
            <Stack gap={8}>
              {QUICK_PHRASES.map(({ emoji, text: phrase }) => (
                <TouchableOpacity
                  key={phrase}
                  onPress={() => { setText(phrase); setTimeout(handleTranslate, 50) }}
                  activeOpacity={0.7}
                >
                  <Stack
                    backgroundColor={C.bgCard}
                    borderRadius={14}
                    padding={14}
                    horizontal
                    alignItems="center"
                    gap={12}
                    style={{ borderWidth: 1, borderColor: C.border }}
                  >
                    <Text style={{ fontSize: 20 }}>{emoji}</Text>
                    <Text variant="body" color={C.textPrimary} style={{ flex: 1 }}>{phrase}</Text>
                    <Feather name="arrow-right" size={14} color={C.primary} />
                  </Stack>
                </TouchableOpacity>
              ))}
            </Stack>
          </Stack>
        )}
      </ScrollView>
    </StyledPage>
  )
}

const styles = StyleSheet.create({
  langBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    borderRadius: 14, paddingHorizontal: 12, paddingVertical: 10,
    borderWidth: 1,
  },
  swapBtn: {
    width: 42, height: 42, borderRadius: 21,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1,
  },
  toneChip: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20,
  },
  actionChip: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 12, borderWidth: 1,
  },
  translateBtn: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },
  settingsBtn: {
    width: 38, height: 38, borderRadius: 19,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1,
  },
})
