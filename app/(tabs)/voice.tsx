import React, { useState, useRef, useEffect } from 'react'
import { Platform, Animated, ActivityIndicator } from 'react-native'
import Svg, { Defs, LinearGradient, Stop, Circle } from 'react-native-svg'
import { StyledPage, StyledScrollView, Stack, StyledCard, StyledPressable, toastService } from 'fluent-styles'
import * as FileSystem from 'expo-file-system'
import { Audio } from 'expo-av'
import { Text } from '../../src/components/Text'
import { useColors, useIsDark, getLang } from '../../src/constants'
import { useTranslatorStore } from '../../src/stores'
import { translateService, type TranslationResult } from '../../src/services/api'
import { useTTS } from '../../src/hooks'
import { MicIcon, StopIcon, StarIcon, SpeakerIcon, ChevronLeftIcon } from '../../src/icons'
import { goBack } from '../../src/utils'

type TranscriptLine = {
  id:          string
  speaker:     'you' | 'them'
  text:        string
  translated?: string
  translation?: TranslationResult
}

// Waveform: resting heights give the idle bars the mock's uneven shape
const BAR_REST = [10, 18, 13, 28, 20, 25, 12, 22, 15, 10, 17]
const ORB = 140

export default function VoiceScreen() {
  const C      = useColors()
  const isDark = useIsDark()
  const { sourceLang, targetLang } = useTranslatorStore()

  const [listening, setListening]   = useState(false)
  const [transcript, setTranscript] = useState<TranscriptLine[]>([])
  const [processing, setProcessing] = useState(false)
  const recordingRef = useRef<Audio.Recording | null>(null)
  const scrollRef    = useRef<any>(null)
  const { speak, loading: ttsLoading } = useTTS()

  // Waveform bars jump to new heights every 300ms while listening
  const barHeights = useRef(BAR_REST.map((h) => new Animated.Value(h))).current

  useEffect(() => {
    if (!listening) {
      barHeights.forEach((b, i) => Animated.timing(b, { toValue: BAR_REST[i], duration: 200, useNativeDriver: false }).start())
      return
    }
    const interval = setInterval(() => {
      barHeights.forEach((b) => {
        Animated.timing(b, { toValue: Math.random() * 32 + 8, duration: 150, useNativeDriver: false }).start()
      })
    }, 300)
    return () => clearInterval(interval)
  }, [listening])

  // Pulsing animation
  const pulse = useRef(new Animated.Value(1)).current
  const glow  = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (listening) {
      Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(pulse, { toValue: 1.06, duration: 700, useNativeDriver: true }),
            Animated.timing(glow,  { toValue: 1,    duration: 700, useNativeDriver: true }),
          ]),
          Animated.parallel([
            Animated.timing(pulse, { toValue: 0.98, duration: 700, useNativeDriver: true }),
            Animated.timing(glow,  { toValue: 0.3,  duration: 700, useNativeDriver: true }),
          ]),
        ])
      ).start()
    } else {
      pulse.stopAnimation()
      glow.stopAnimation()
      Animated.parallel([
        Animated.timing(pulse, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(glow,  { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start()
    }
  }, [listening])

  // Bring a new translation into view — it lands below the orb
  useEffect(() => {
    if (transcript.length) setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 150)
  }, [transcript.length])

  // Release the mic if the screen unmounts mid-recording
  useEffect(() => () => { recordingRef.current?.stopAndUnloadAsync().catch(() => {}) }, [])

  const handleStart = async () => {
    if (processing) return
    try {
      const perm = await Audio.requestPermissionsAsync()
      if (!perm.granted) { toastService.error('Microphone', 'Microphone access denied'); return }
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true })
      const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY)
      recordingRef.current = recording
      setListening(true)
    } catch {
      toastService.error('Microphone', 'Could not access microphone')
    }
  }

  const handleStop = async () => {
    setListening(false)
    const recording = recordingRef.current
    recordingRef.current = null
    if (!recording) return
    setProcessing(true)
    try {
      await recording.stopAndUnloadAsync()
      const uri = recording.getURI()
      if (!uri) return
      const base64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 })
      FileSystem.deleteAsync(uri, { idempotent: true }).catch(() => {})

      const transcribed = await translateService.transcribeAudio(base64)
      if (!transcribed.text?.trim()) {
        toastService.info('No speech detected', 'Try speaking a little louder')
        return
      }

      // Read prefs at call time so a language change mid-recording is respected
      const { sourceLang, targetLang, tone } = useTranslatorStore.getState()
      const translated = await translateService.translateText({
        text: transcribed.text, source_lang: sourceLang, target_lang: targetLang, tone, type: 'voice',
      })
      setTranscript((prev) => [...prev, {
        id:          translated.id ?? Date.now().toString(),
        speaker:     'you',
        text:        transcribed.text,
        translated:  translated.translated_text,
        translation: translated,
      }])
    } catch (e: any) {
      if (e?.message === 'No speech detected') toastService.info('No speech detected', 'Try speaking a little louder')
      else toastService.error('Error', e?.message || 'Could not transcribe audio')
    } finally {
      setProcessing(false)
    }
  }

  const handleListen = () => {
    const last = transcript[transcript.length - 1]
    if (!last?.translated) return
    speak(last.translated, last.translation?.target_lang ?? targetLang)
  }

  const handleSaveLast = async () => {
    const last = transcript[transcript.length - 1]
    if (!last?.translation) return
    try {
      await translateService.saveToPhrasebook(last.translation.id)
      toastService.success('Saved', 'Phrase saved to phrasebook')
    } catch (e: any) {
      toastService.error('Save failed', e?.message || 'Could not save to phrasebook')
    }
  }

  const ringOpacity = glow.interpolate({ inputRange: [0, 1], outputRange: [0.55, 1] })
  const ringScale   = glow.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] })

  const lastLine  = transcript[transcript.length - 1]
  const hasResult = !!lastLine?.translated && !listening && !processing
  const source    = getLang(sourceLang)
  const showCard  = listening || processing || !!lastLine

  return (
    <StyledPage flex={1} edges={['top', 'left', 'right']} backgroundColor={C.bgCard} showStatusBar
      statusBarStyle={isDark ? 'light-content' : 'dark-content'}
      statusBarBackgroundColor={Platform.OS === 'android' ? C.bgCard : undefined}
    >
      {/* Header */}
      <StyledPage.Header.Full>
        <Stack horizontal alignItems="center" gap={14} marginHorizontal={16} paddingBottom={14}>
          <StyledPressable
            width={44} height={44} borderRadius={12} alignItems="center" justifyContent="center"
            backgroundColor={C.bgInput} onPress={() => goBack()}
            accessibilityRole="button" accessibilityLabel="Go back"
          >
            <ChevronLeftIcon size={20} strokeWidth={2.4} color={C.textPrimary} />
          </StyledPressable>
          <Stack flex={1}>
            <Text variant="title" color={C.textPrimary} fontWeight="800">Voice Translation</Text>
            <Text variant="bodySmall" color={C.textMuted}>Tap mic and speak naturally</Text>
          </Stack>
          <Stack backgroundColor={C.primaryBg} borderRadius={16} paddingHorizontal={12} paddingVertical={6}>
            <Text variant="label" color={C.primaryDark} fontWeight="700">
              {sourceLang.toUpperCase()} → {targetLang.toUpperCase()}
            </Text>
          </Stack>
        </Stack>
      </StyledPage.Header.Full>

      <StyledScrollView
        ref={scrollRef}
        style={{ backgroundColor: C.bg, borderTopWidth: 1, borderTopColor: C.border }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 24 }}
      >
        {/* Orb with two soft rings */}
        <Stack alignItems="center" justifyContent="center" height={ORB + 60}>
          <Animated.View style={{
            position: 'absolute', width: ORB + 60, height: ORB + 60, borderRadius: (ORB + 60) / 2,
            borderWidth: 1.5, borderColor: `${C.primary}33`,
            opacity: ringOpacity, transform: [{ scale: ringScale }],
          }} />
          <Animated.View style={{
            position: 'absolute', width: ORB + 26, height: ORB + 26, borderRadius: (ORB + 26) / 2,
            borderWidth: 2.5, borderColor: `${C.primary}55`,
            opacity: ringOpacity,
          }} />
          <Animated.View style={{ transform: [{ scale: pulse }] }}>
            <StyledPressable
              width={ORB} height={ORB} borderRadius={ORB / 2} alignItems="center" justifyContent="center"
              onPress={listening ? handleStop : handleStart}
              disabled={processing}
              accessibilityRole="button"
              accessibilityLabel={listening ? 'Stop recording' : 'Start recording'}
              style={{ overflow: 'hidden', shadowColor: C.sumColor, shadowOpacity: 0.35, shadowRadius: 24, shadowOffset: { width: 0, height: 10 }, elevation: 10 }}
            >
              <Svg width={ORB} height={ORB} style={{ position: 'absolute' }}>
                <Defs>
                  <LinearGradient id="voiceOrb" x1="0" y1="0" x2="1" y2="1">
                    <Stop offset="0" stopColor={C.primary} />
                    <Stop offset="1" stopColor={C.sumColor} />
                  </LinearGradient>
                </Defs>
                <Circle cx={ORB / 2} cy={ORB / 2} r={ORB / 2} fill="url(#voiceOrb)" />
              </Svg>
              {processing
                ? <ActivityIndicator size="large" color={C.white} />
                : <MicIcon size={48} strokeWidth={1.8} color={C.white} />}
            </StyledPressable>
          </Animated.View>
        </Stack>

        {/* Waveform */}
        <Stack horizontal gap={5} alignItems="flex-end" justifyContent="center" height={40} marginTop={6} marginBottom={14}>
          {barHeights.map((height, i) => (
            <Animated.View key={i} style={{
              width: 5, height, borderRadius: 3,
              backgroundColor: C.primary, opacity: listening ? 1 : 0.45,
            }} />
          ))}
        </Stack>

        {/* Status */}
        <Stack alignItems="center" marginBottom={18}>
          <Text variant="header" color={C.textPrimary} fontWeight="800">
            {listening ? 'Listening…' : processing ? 'Translating…' : 'Tap the mic to start'}
          </Text>
          <Text variant="body" color={C.textMuted} style={{ marginTop: 4 }}>
            Speak your phrase in {source.label}
          </Text>
        </Stack>

        {/* Conversation */}
        {showCard ? (
          <StyledCard backgroundColor={C.bgCard} borderRadius={22} padding={18}
            borderWidth={1} borderColor={C.border} shadow="light"
          >
            <Text variant="overline" color={C.textMuted} style={{ letterSpacing: 1, marginBottom: 8 }}>YOU SAID</Text>
            <Stack backgroundColor={C.primaryBg} borderRadius={16} padding={14}>
              {listening ? (
                <Text variant="body" color={C.textSecondary}>Speak now… tap stop when done</Text>
              ) : processing ? (
                <Stack horizontal alignItems="center" gap={8}>
                  <ActivityIndicator size="small" color={C.primary} />
                  <Text variant="body" color={C.textSecondary}>Working out what you said</Text>
                </Stack>
              ) : (
                <Text variant="body" color={C.textPrimary} style={{ fontSize: 16, lineHeight: 24 }}>
                  “{lastLine?.text}”
                </Text>
              )}
            </Stack>

            {hasResult && (
              <>
                <Text variant="overline" color={C.textMuted} textAlign="right" style={{ letterSpacing: 1, marginTop: 14, marginBottom: 8 }}>
                  TRANSLATION
                </Text>
                <Stack alignSelf="flex-end" maxWidth="88%" backgroundColor={C.accentBg} borderRadius={16} padding={14}>
                  <Text variant="body" color={C.textPrimary} style={{ fontSize: 16, lineHeight: 24 }}>{lastLine?.translated}</Text>
                </Stack>
              </>
            )}
          </StyledCard>
        ) : (
          <Text variant="bodySmall" color={C.textMuted} textAlign="center">Your conversation will appear here</Text>
        )}

      </StyledScrollView>

      {/* Controls — pinned below the scroll area so they're always reachable */}
      <Stack horizontal alignItems="center" justifyContent="center" gap={22}
        paddingTop={12} paddingBottom={14} backgroundColor={C.bg}
      >
        <StyledPressable
          width={58} height={58} borderRadius={29} alignItems="center" justifyContent="center"
          backgroundColor={C.bgCard} borderWidth={1} borderColor={C.border}
          onPress={handleSaveLast} disabled={!hasResult}
          accessibilityRole="button" accessibilityLabel="Save to phrasebook"
          style={{ opacity: hasResult ? 1 : 0.5 }}
        >
          <StarIcon size={24} strokeWidth={1.9} color={C.warning} />
        </StyledPressable>

        <StyledPressable
          width={78} height={78} borderRadius={39} alignItems="center" justifyContent="center"
          backgroundColor={listening ? C.danger : C.primary}
          onPress={listening ? handleStop : handleStart}
          disabled={processing}
          accessibilityRole="button" accessibilityLabel={listening ? 'Stop recording' : 'Start recording'}
          style={{
            opacity: processing ? 0.6 : 1,
            shadowColor: listening ? C.danger : C.primary, shadowOpacity: 0.4, shadowRadius: 18,
            shadowOffset: { width: 0, height: 6 }, elevation: 8,
          }}
        >
          {listening
            ? <StopIcon size={28} strokeWidth={2} color={C.black} />
            : <MicIcon size={32} strokeWidth={2.2} color={C.white} />}
        </StyledPressable>

        <StyledPressable
          width={58} height={58} borderRadius={29} alignItems="center" justifyContent="center"
          backgroundColor={C.bgCard} borderWidth={1} borderColor={C.border}
          onPress={handleListen} disabled={!hasResult || ttsLoading}
          accessibilityRole="button" accessibilityLabel="Listen to translation"
          style={{ opacity: hasResult ? 1 : 0.5 }}
        >
          {ttsLoading
            ? <ActivityIndicator size="small" color={C.primary} />
            : <SpeakerIcon size={24} strokeWidth={1.9} color={C.textPrimary} />}
        </StyledPressable>
      </Stack>
    </StyledPage>
  )
}
