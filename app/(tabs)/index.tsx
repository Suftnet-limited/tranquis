import React, { useState } from 'react'
import { TextInput, ActivityIndicator, Platform } from 'react-native'
import { router } from 'expo-router'
import * as ExpoClipboard from 'expo-clipboard'
import { StyledPage, StyledScrollView, Stack, StyledCard, StyledPressable, toastService } from 'fluent-styles'
import { Text } from '../../src/components/Text'
import { IconButton } from '../../src/components/IconButton'
import { ActionChip } from '../../src/components/ActionChip'
import { SectionLabel } from '../../src/components/SectionLabel'
import { useColors, useIsDark, TONES, getLang } from '../../src/constants'
import { useTranslatorStore, useAuthStore } from '../../src/stores'
import { useTranslate, useTTS } from '../../src/hooks'
import {
  GearIcon, ChevronDownIcon, SwapIcon, MicIcon, CameraIcon, ClipboardIcon, XIcon,
  ArrowRightIcon, ChevronRightIcon, SpeakerIcon, CopyIcon, BookmarkIcon, ICONS, type IconName,
} from '../../src/icons'

const MAX_CHARS = 5000

const greetingFor = (hour: number) =>
  hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

const QUICK_PHRASES = [
  { emoji: '🏥', text: 'Where is the nearest hospital?' },
  { emoji: '💰', text: 'How much does this cost?' },
  { emoji: '🗣️', text: 'Can you speak more slowly?' },
  { emoji: '🍽️', text: 'I would like to order food.' },
  { emoji: '🙏', text: 'Thank you very much.' },
]

// ─── Language pair ────────────────────────────────────────────────────────────
function LangButton({ code, onPress }: { code: string; onPress: () => void }) {
  const C = useColors()
  const lang = getLang(code)
  return (
    <StyledPressable flex={1} onPress={onPress} accessibilityRole="button" accessibilityLabel={`Change language, ${lang.label}`}>
      <StyledCard
        backgroundColor={C.bgCard} borderRadius={14} paddingHorizontal={12} paddingVertical={11}
        borderWidth={1} borderColor={C.border}
      >
        <Stack horizontal alignItems="center" gap={8}>
          <Text style={{ fontSize: 20 }}>{lang.flag}</Text>
          <Text variant="label" color={C.textPrimary} numberOfLines={1} style={{ flex: 1 }}>{lang.label}</Text>
          <ChevronDownIcon size={14} strokeWidth={2} color={C.textMuted} />
        </Stack>
      </StyledCard>
    </StyledPressable>
  )
}

function LangPairRow() {
  const C = useColors()
  const { sourceLang, targetLang, swapLangs } = useTranslatorStore()
  const openPicker = (side: 'source' | 'target') =>
    router.push({ pathname: '/lang-picker', params: { side } } as any)

  return (
    <Stack horizontal alignItems="center" gap={8} marginBottom={14}>
      <LangButton code={sourceLang} onPress={() => openPicker('source')} />
      <IconButton icon={SwapIcon} label="Swap languages" onPress={swapLangs}
        size={42} iconSize={18} color={C.primary} background={C.primaryBg} />
      <LangButton code={targetLang} onPress={() => openPicker('target')} />
    </Stack>
  )
}

// ─── Tone chips ───────────────────────────────────────────────────────────────
function ToneRow() {
  const C = useColors()
  const { tone, setTone } = useTranslatorStore()
  return (
    <Stack horizontal gap={8} marginBottom={14} flexWrap="wrap">
      {TONES.map((t) => {
        const active = tone === t.key
        const Icon = ICONS[t.icon as IconName]
        return (
          <StyledPressable key={t.key} onPress={() => setTone(t.key)}
            accessibilityRole="button" accessibilityState={{ selected: active }} accessibilityLabel={`${t.label} tone`}
          >
            <Stack
              horizontal alignItems="center" gap={5}
              paddingHorizontal={12} paddingVertical={7} borderRadius={20}
              backgroundColor={active ? C.accentBg : C.bgCard}
              borderWidth={1} borderColor={active ? C.accent : C.border}
            >
              {Icon && <Icon size={12} strokeWidth={2} color={active ? C.accent : C.textSecondary} />}
              <Text variant="caption" color={active ? C.accent : C.textSecondary} fontWeight={active ? '700' : '600'}>
                {t.label}
              </Text>
            </Stack>
          </StyledPressable>
        )
      })}
    </Stack>
  )
}

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function TranslateScreen() {
  const C      = useColors()
  const isDark = useIsDark()
  const user   = useAuthStore((s) => s.user)
  const { translate, saveToPhrasebook, loading, result, clear } = useTranslate()
  const { speak, loading: ttsLoading } = useTTS()

  const [text, setText] = useState('')
  const firstName = user?.full_name?.trim().split(/\s+/)[0]
  const canTranslate = !!text.trim() && !loading

  const handleTranslate = () => { if (canTranslate) translate(text) }

  // Fill the box and translate straight away — passing the phrase directly,
  // since state from setText isn't visible until the next render
  const handleQuickPhrase = (phrase: string) => {
    setText(phrase)
    translate(phrase)
  }

  const handlePaste = async () => {
    const pasted = await ExpoClipboard.getStringAsync().catch(() => '')
    if (pasted) setText(pasted.slice(0, MAX_CHARS))
  }

  const handleCopy = async () => {
    if (!result) return
    await ExpoClipboard.setStringAsync(result.translated_text)
    toastService.success('Copied', 'Translation copied')
  }

  const handleClear = () => { setText(''); clear() }

  return (
    <StyledPage
      flex={1}
      backgroundColor={C.bg}
      showStatusBar
      statusBarStyle={isDark ? 'light-content' : 'dark-content'}
      statusBarBackgroundColor={Platform.OS === 'android' ? C.bg : undefined}
    >
      <StyledPage.Header.Full>
        {/* Greeting header */}
        <Stack marginHorizontal={20} horizontal alignItems="center" justifyContent="space-between">
          <Stack horizontal alignItems="center" flex={1} gap={12}>
            <StyledPressable onPress={() => router.push('/profile' as any)} accessibilityRole="button" accessibilityLabel="Open profile">
              <Stack width={40} height={40} borderRadius={20} backgroundColor={C.primary} alignItems="center" justifyContent="center">
                <Text variant="label" color={C.white} fontWeight="800">
                  {(firstName?.charAt(0) || 'T').toUpperCase()}
                </Text>
              </Stack>
            </StyledPressable>
            <Stack flex={1}>
              <Text variant="body" color={C.textSecondary}>{greetingFor(new Date().getHours())}</Text>
              <Text variant="title" color={C.textPrimary} numberOfLines={1} style={{ marginTop: 2 }}>
                {firstName || 'Tranquis'}
              </Text>
            </Stack>
          </Stack>
          <IconButton icon={GearIcon} label="Open settings" onPress={() => router.push('/profile' as any)} />
        </Stack>
      </StyledPage.Header.Full>

      <StyledScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ padding: 20, paddingTop: 12, paddingBottom: 40 }}
      >
        <LangPairRow />
        <ToneRow />

        {/* Input card */}
        <StyledCard
          backgroundColor={C.bgCard} borderRadius={20} padding={16}
          borderWidth={1} borderColor={C.border} shadow="light"
        >
          <TextInput
            value={text}
            onChangeText={(t) => { setText(t); if (!t) clear() }}
            placeholder="Type or paste text to translate…"
            placeholderTextColor={C.textMuted}
            multiline
            maxLength={MAX_CHARS}
            style={{
              minHeight: 96,
              fontFamily: 'PlusJakartaSans_400Regular',
              fontSize: 16, lineHeight: 24,
              color: C.textPrimary,
              textAlignVertical: 'top',
            }}
          />

          <Stack horizontal alignItems="center" justifyContent="space-between" marginTop={10}>
            <Stack horizontal gap={6} marginLeft={-8}>
              <IconButton icon={MicIcon} label="Voice translate" size={36} iconSize={19}
                color={C.primary} background="transparent" onPress={() => router.push('/(tabs)/voice' as any)} />
              <IconButton icon={CameraIcon} label="Camera translate" size={36} iconSize={19}
                color={C.primary} background="transparent" onPress={() => router.push('/(tabs)/camera' as any)} />
              <IconButton icon={ClipboardIcon} label="Paste" size={36} iconSize={19}
                color={C.primary} background="transparent" onPress={handlePaste} />
              {!!text && (
                <IconButton icon={XIcon} label="Clear text" size={36} iconSize={19}
                  color={C.textMuted} background="transparent" onPress={handleClear} />
              )}
            </Stack>

            <Stack horizontal alignItems="center" gap={10}>
              {!!text && <Text variant="caption" color={C.textMuted}>{text.length}/{MAX_CHARS}</Text>}
              <StyledPressable
                width={42} height={42} borderRadius={21}
                alignItems="center" justifyContent="center"
                backgroundColor={text.trim() ? C.primary : C.bgMuted}
                onPress={handleTranslate} disabled={!canTranslate}
                accessibilityRole="button" accessibilityLabel="Translate"
              >
                {loading
                  ? <ActivityIndicator size="small" color={C.white} />
                  : <ArrowRightIcon size={18} strokeWidth={2.2} color={text.trim() ? C.white : C.textMuted} />}
              </StyledPressable>
            </Stack>
          </Stack>
        </StyledCard>

        {/* Result */}
        {result && (
          <StyledCard
            backgroundColor={C.primaryBg} borderRadius={20} padding={18} marginTop={12}
            borderWidth={1} borderColor={C.border}
          >
            <Text variant="overline" color={C.primary} style={{ letterSpacing: 0.8, marginBottom: 6 }}>
              {getLang(result.target_lang).label.toUpperCase()}
            </Text>
            <Text variant="title" color={C.textPrimary} style={{ lineHeight: 30, marginBottom: 14 }}>
              {result.translated_text}
            </Text>
            <Stack horizontal gap={8} flexWrap="wrap">
              <ActionChip icon={SpeakerIcon} label="Listen" loading={ttsLoading}
                onPress={() => speak(result.translated_text, result.target_lang)} />
              <ActionChip icon={CopyIcon} label="Copy" onPress={handleCopy} />
              <ActionChip icon={BookmarkIcon} label="Save" onPress={() => saveToPhrasebook(result)} />
            </Stack>
          </StyledCard>
        )}

        {/* Quick phrases */}
        {!result && !text && (
          <Stack marginTop={24}>
            <SectionLabel>Quick phrases</SectionLabel>
            <Stack gap={8}>
              {QUICK_PHRASES.map(({ emoji, text: phrase }) => (
                <StyledPressable key={phrase} onPress={() => handleQuickPhrase(phrase)}
                  accessibilityRole="button" accessibilityLabel={`Translate: ${phrase}`}
                >
                  <StyledCard
                    backgroundColor={C.bgCard} borderRadius={14} padding={14}
                    borderWidth={1} borderColor={C.border}
                  >
                    <Stack horizontal alignItems="center" gap={12}>
                      <Text style={{ fontSize: 20 }}>{emoji}</Text>
                      <Text variant="body" color={C.textPrimary} style={{ flex: 1 }}>{phrase}</Text>
                      <ChevronRightIcon size={16} strokeWidth={2} color={C.textMuted} />
                    </Stack>
                  </StyledCard>
                </StyledPressable>
              ))}
            </Stack>
          </Stack>
        )}
      </StyledScrollView>
    </StyledPage>
  )
}
