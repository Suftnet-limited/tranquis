import React, { useEffect, useState } from 'react'
import { TextInput, ActivityIndicator, Platform } from 'react-native'
import { router } from 'expo-router'
import * as ExpoClipboard from 'expo-clipboard'
import { StyledPage, StyledScrollView, Stack, StyledCard, StyledPressable, toastService } from 'fluent-styles'
import { Text } from '../../src/components/Text'
import { IconButton } from '../../src/components/IconButton'
import { ActionChip } from '../../src/components/ActionChip'
import { useColors, useIsDark, TONES, getLang } from '../../src/constants'
import { useTranslatorStore } from '../../src/stores'
import { useTranslate, useTTS } from '../../src/hooks'
import { translateService } from '../../src/services/api'
import {
  GearIcon, SwapIcon, MicIcon, CameraIcon, ClipboardIcon, XIcon, ArrowRightIcon, ChevronRightIcon,
  SpeakerIcon, CopyIcon, StarIcon, InfoIcon,
} from '../../src/icons'

const MAX_CHARS = 5000

// Shown with their translation underneath when translating from English into
// one of these languages; other pairs show "Tap to translate"
const QUICK_PHRASES: { emoji: string; text: string; tr: Record<string, string> }[] = [
  { emoji: '🍽️', text: 'A table for two, please', tr: {
    es: 'Una mesa para dos, por favor', fr: 'Une table pour deux, s’il vous plaît', de: 'Einen Tisch für zwei, bitte',
    it: 'Un tavolo per due, per favore', pt: 'Uma mesa para dois, por favor' } },
  { emoji: '🏨', text: 'I have a reservation', tr: {
    es: 'Tengo una reserva', fr: 'J’ai une réservation', de: 'Ich habe eine Reservierung',
    it: 'Ho una prenotazione', pt: 'Tenho uma reserva' } },
  { emoji: '🏥', text: 'Where is the nearest hospital?', tr: {
    es: '¿Dónde está el hospital más cercano?', fr: 'Où est l’hôpital le plus proche ?', de: 'Wo ist das nächste Krankenhaus?',
    it: 'Dov’è l’ospedale più vicino?', pt: 'Onde fica o hospital mais próximo?' } },
  { emoji: '💰', text: 'How much does this cost?', tr: {
    es: '¿Cuánto cuesta esto?', fr: 'Combien ça coûte ?', de: 'Wie viel kostet das?',
    it: 'Quanto costa questo?', pt: 'Quanto custa isto?' } },
  { emoji: '🙏', text: 'Thank you very much', tr: {
    es: 'Muchas gracias', fr: 'Merci beaucoup', de: 'Vielen Dank', it: 'Grazie mille', pt: 'Muito obrigado' } },
]

// ─── Language pair ────────────────────────────────────────────────────────────
function LangCard({ code, onPress }: { code: string; onPress: () => void }) {
  const C = useColors()
  const lang = getLang(code)
  return (
    <StyledPressable flex={1} onPress={onPress} accessibilityRole="button" accessibilityLabel={`Change language, ${lang.label}`}>
      <Stack horizontal alignItems="center" gap={10}
        backgroundColor={C.bgInput} borderRadius={14} paddingHorizontal={14} paddingVertical={13}
        borderWidth={1} borderColor={C.border}
      >
        <Text style={{ fontSize: 22 }}>{lang.flag}</Text>
        <Text variant="subtitle" color={C.textPrimary} fontWeight="700" numberOfLines={1} style={{ flex: 1 }}>{lang.label}</Text>
      </Stack>
    </StyledPressable>
  )
}

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function TranslateScreen() {
  const C      = useColors()
  const isDark = useIsDark()
  const { sourceLang, targetLang, tone, setTone, swapLangs } = useTranslatorStore()
  const { translate, saveToPhrasebook, loading, result, clear } = useTranslate()
  const { speak, loading: ttsLoading } = useTTS()

  const [text, setText] = useState('')
  const [explanation, setExplanation] = useState<string | null>(null)
  const [explaining, setExplaining] = useState(false)

  // A new result gets a fresh explanation
  useEffect(() => { setExplanation(null) }, [result?.id])

  const canTranslate = !!text.trim() && !loading
  const openPicker = (side: 'source' | 'target') =>
    router.push({ pathname: '/lang-picker', params: { side } } as any)

  const handleTranslate = () => { if (canTranslate) translate(text) }

  // Pass the phrase straight to translate — state from setText isn't visible
  // until the next render
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

  const handleExplain = async () => {
    if (!result || explaining) return
    if (explanation) { setExplanation(null); return }   // second tap hides it
    setExplaining(true)
    try {
      const { explanation: text } = await translateService.explain(result.id)
      setExplanation(text)
    } catch (e: any) {
      toastService.error('Explain', e?.message || 'Could not explain this translation')
    } finally {
      setExplaining(false)
    }
  }

  const handleClear = () => { setText(''); clear() }

  const resultLang = result ? getLang(result.target_lang) : null
  const resultTone = TONES.find((t) => t.key === (result?.tone || tone))?.label ?? ''
  const phraseHint = (tr: Record<string, string>) =>
    sourceLang === 'en' && tr[targetLang] ? tr[targetLang] : `Tap to translate to ${getLang(targetLang).label}`

  return (
    <StyledPage
      flex={1}
      edges={['top', 'left', 'right']}
      backgroundColor={C.bgCard}
      showStatusBar
      statusBarStyle={isDark ? 'light-content' : 'dark-content'}
      statusBarBackgroundColor={Platform.OS === 'android' ? C.bgCard : undefined}
    >
      {/* Header */}
      <StyledPage.Header.Full>
        <Stack marginHorizontal={20} horizontal alignItems="center" justifyContent="space-between" paddingBottom={12}>
          <Stack horizontal alignItems="center" gap={8}>
            <Text variant="header" color={C.textPrimary} fontWeight="800">Tranquis</Text>
            <Stack width={9} height={9} borderRadius={4.5} backgroundColor={C.live}
              accessibilityLabel="Online" style={{ marginTop: 4 }}
            />
          </Stack>
          <IconButton icon={GearIcon} label="Open settings" onPress={() => router.push('/profile' as any)} />
        </Stack>
      </StyledPage.Header.Full>

      {/* Language pair */}
      <Stack horizontal alignItems="center" gap={10} paddingHorizontal={16} paddingVertical={14}
        borderTopWidth={1} borderBottomWidth={1} borderColor={C.border}
      >
        <LangCard code={sourceLang} onPress={() => openPicker('source')} />
        <IconButton icon={SwapIcon} label="Swap languages" onPress={swapLangs}
          size={44} iconSize={18} color={C.white} background={C.primary} />
        <LangCard code={targetLang} onPress={() => openPicker('target')} />
      </Stack>

      <StyledScrollView
        style={{ backgroundColor: C.bg }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
      >
        {/* Tone chips */}
        <Stack horizontal gap={8} marginBottom={14} flexWrap="wrap">
          {TONES.map((t) => {
            const active = tone === t.key
            return (
              <StyledPressable key={t.key} onPress={() => setTone(t.key)}
                accessibilityRole="button" accessibilityState={{ selected: active }} accessibilityLabel={`${t.label} tone`}
              >
                <Stack paddingHorizontal={16} paddingVertical={8} borderRadius={20}
                  backgroundColor={active ? C.accentBg : C.bgCard}
                  borderWidth={active ? 2 : 1} borderColor={active ? C.accent : C.border}
                >
                  <Text variant="label" color={active ? C.accent : C.textPrimary} fontWeight={active ? '700' : '600'}>
                    {t.label}
                  </Text>
                </Stack>
              </StyledPressable>
            )
          })}
        </Stack>

        {/* Input card */}
        <StyledCard backgroundColor={C.bgCard} borderRadius={20} padding={18}
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
              minHeight: 88,
              fontFamily: 'PlusJakartaSans_500Medium',
              fontSize: 17, lineHeight: 25,
              color: C.textPrimary,
              textAlignVertical: 'top',
            }}
          />

          <Stack height={1} backgroundColor={C.border} marginTop={12} marginBottom={12} />

          <Stack horizontal alignItems="center" justifyContent="space-between">
            <Stack horizontal gap={4} marginLeft={-8}>
              <IconButton icon={MicIcon} label="Voice translate" size={38} iconSize={20}
                color={C.textSecondary} background="transparent" onPress={() => router.push('/(tabs)/voice' as any)} />
              <IconButton icon={CameraIcon} label="Camera translate" size={38} iconSize={20}
                color={C.textSecondary} background="transparent" onPress={() => router.push('/(tabs)/camera' as any)} />
              <IconButton icon={ClipboardIcon} label="Paste" size={38} iconSize={20}
                color={C.textSecondary} background="transparent" onPress={handlePaste} />
              {!!text && (
                <IconButton icon={XIcon} label="Clear text" size={38} iconSize={20}
                  color={C.textMuted} background="transparent" onPress={handleClear} />
              )}
            </Stack>

            <StyledPressable
              flexDirection="row" alignItems="center" gap={6}
              paddingHorizontal={20} height={46} borderRadius={14}
              backgroundColor={text.trim() ? C.primary : C.bgMuted}
              onPress={handleTranslate} disabled={!canTranslate}
              accessibilityRole="button" accessibilityLabel="Translate"
            >
              {loading ? (
                <ActivityIndicator size="small" color={C.white} />
              ) : (
                <>
                  <Text variant="button" color={text.trim() ? C.white : C.textMuted}>Translate</Text>
                  <ArrowRightIcon size={17} strokeWidth={2.4} color={text.trim() ? C.white : C.textMuted} />
                </>
              )}
            </StyledPressable>
          </Stack>
        </StyledCard>

        {/* Result */}
        {result && resultLang && (
          <Stack backgroundColor={C.primaryBg} borderRadius={20} padding={16} marginTop={16}
            borderWidth={1.5} borderColor={C.primary}
          >
            <Text variant="overline" color={C.primaryDark} style={{ letterSpacing: 0.9, marginBottom: 8 }}>
              {resultLang.flag} {resultLang.label.toUpperCase()}{resultTone ? ` · ${resultTone.toUpperCase()}` : ''}
            </Text>
            <Text variant="title" color={C.textPrimary} fontWeight="700" style={{ fontSize: 20, lineHeight: 28, marginBottom: 16 }}>
              {result.translated_text}
            </Text>

            {explanation && (
              <Stack backgroundColor={C.bgCard} borderRadius={14} padding={14} marginBottom={14}
                borderWidth={1} borderColor={C.border}
              >
                <Stack horizontal alignItems="center" gap={6} marginBottom={6}>
                  <InfoIcon size={14} strokeWidth={2} color={C.primary} />
                  <Text variant="caption" color={C.primary} fontWeight="700">Explanation</Text>
                </Stack>
                <Text variant="bodySmall" color={C.textSecondary} style={{ lineHeight: 20 }}>{explanation}</Text>
              </Stack>
            )}

            <Stack horizontal gap={6} flexWrap="wrap">
              <ActionChip icon={SpeakerIcon} label="Listen" background={C.bgCard} loading={ttsLoading}
                onPress={() => speak(result.translated_text, result.target_lang)} />
              <ActionChip icon={CopyIcon} label="Copy" background={C.bgCard} onPress={handleCopy} />
              <ActionChip icon={StarIcon} label="Save" background={C.bgCard} onPress={() => saveToPhrasebook(result)} />
              <ActionChip icon={InfoIcon} label={explanation ? 'Hide' : 'Explain'} background={C.bgCard}
                loading={explaining} onPress={handleExplain} />
            </Stack>
          </Stack>
        )}

        {/* Quick phrases */}
        <Stack marginTop={24}>
          <Text variant="overline" color={C.textMuted} style={{ letterSpacing: 1, marginBottom: 10, marginLeft: 4 }}>
            QUICK PHRASES
          </Text>
          <Stack gap={10}>
            {QUICK_PHRASES.map(({ emoji, text: phrase, tr }) => (
              <StyledPressable key={phrase} onPress={() => handleQuickPhrase(phrase)}
                accessibilityRole="button" accessibilityLabel={`Translate: ${phrase}`}
              >
                <StyledCard backgroundColor={C.bgCard} borderRadius={16} paddingHorizontal={16} paddingVertical={14}
                  borderWidth={1} borderColor={C.border}
                >
                  <Stack horizontal alignItems="center" gap={14}>
                    <Text style={{ fontSize: 24 }}>{emoji}</Text>
                    <Stack flex={1} gap={2}>
                      <Text variant="label" color={C.textPrimary}>{phrase}</Text>
                      <Text variant="bodySmall" color={C.textMuted} numberOfLines={1}>{phraseHint(tr)}</Text>
                    </Stack>
                    <ChevronRightIcon size={16} strokeWidth={2} color={C.textMuted} />
                  </Stack>
                </StyledCard>
              </StyledPressable>
            ))}
          </Stack>
        </Stack>
      </StyledScrollView>
    </StyledPage>
  )
}
