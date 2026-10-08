import React, { useState, useRef, useEffect } from 'react'
import { Platform, StyleSheet, Animated, ActivityIndicator } from 'react-native'
import { router } from 'expo-router'
import Svg, { Defs, LinearGradient, Stop, Circle } from 'react-native-svg'
import { StyledPage, StyledScrollView, Stack, StyledCard, StyledPressable, toastService } from 'fluent-styles'
import * as FileSystem from 'expo-file-system'
import { Audio } from 'expo-av'
import { Text } from '../../src/components/Text'
import { ScreenHeader } from '../../src/components/ScreenHeader'
import { IconButton } from '../../src/components/IconButton'
import { useColors, useIsDark } from '../../src/constants'
import { useTranslatorStore } from '../../src/stores'
import { translateService, type TranslationResult } from '../../src/services/api'
import { useTTS } from '../../src/hooks'
import { MicIcon, StopIcon, BookmarkIcon, SpeakerIcon, TrashIcon } from '../../src/icons'

type TranscriptLine = {
  id:          string
  speaker:     'you' | 'them'
  text:        string
  translated?: string
  translation?: TranslationResult
}

const BAR_COUNT  = 20
const BAR_REST   = 6

export default function VoiceScreen() {
  const C      = useColors()
  const isDark = useIsDark()
  const { sourceLang, targetLang } = useTranslatorStore()

  const [listening, setListening]   = useState(false)
  const [transcript, setTranscript] = useState<TranscriptLine[]>([])
  const [processing, setProcessing] = useState(false)
  const recordingRef = useRef<Audio.Recording | null>(null)
  const { speak, loading: ttsLoading } = useTTS()

  // Waveform bars jump to new heights every 300ms while listening
  const barHeights = useRef(Array.from({ length: BAR_COUNT }, () => new Animated.Value(BAR_REST))).current
  // "Listening…" dot blinks; the interim bubble's dots cycle
  const dotOpacity = useRef(new Animated.Value(1)).current
  const [dots, setDots] = useState(1)

  useEffect(() => {
    if (!listening) {
      barHeights.forEach((b) => Animated.timing(b, { toValue: BAR_REST, duration: 200, useNativeDriver: false }).start())
      return
    }
    const interval = setInterval(() => {
      barHeights.forEach((b) => {
        Animated.timing(b, { toValue: Math.random() * 36 + 8, duration: 150, useNativeDriver: false }).start()
      })
    }, 300)
    return () => clearInterval(interval)
  }, [listening])

  useEffect(() => {
    if (!listening) { dotOpacity.setValue(1); setDots(1); return }
    const blink = Animated.loop(Animated.sequence([
      Animated.timing(dotOpacity, { toValue: 0.15, duration: 300, useNativeDriver: true }),
      Animated.timing(dotOpacity, { toValue: 1,    duration: 300, useNativeDriver: true }),
    ]))
    blink.start()
    const interval = setInterval(() => setDots((d) => (d % 3) + 1), 400)
    return () => { blink.stop(); clearInterval(interval) }
  }, [listening])

  // Pulsing animation
  const pulse = useRef(new Animated.Value(1)).current
  const glow  = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (listening) {
      Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(pulse, { toValue: 1.12, duration: 700, useNativeDriver: true }),
            Animated.timing(glow,  { toValue: 1,    duration: 700, useNativeDriver: true }),
          ]),
          Animated.parallel([
            Animated.timing(pulse, { toValue: 0.96, duration: 700, useNativeDriver: true }),
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
      toastService.error('Error', e?.message || 'Could not transcribe audio')
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

  const glowOpacity = glow.interpolate({ inputRange: [0, 1], outputRange: [0.15, 0.5] })
  const glowScale   = glow.interpolate({ inputRange: [0, 1], outputRange: [1, 1.3] })

  const lastLine = transcript[transcript.length - 1]
  const hasResult = !!lastLine?.translated && !listening && !processing

  return (
    <StyledPage flex={1} backgroundColor={C.bg} showStatusBar
      statusBarStyle={isDark ? 'light-content' : 'dark-content'}
      statusBarBackgroundColor={Platform.OS === 'android' ? C.bg : undefined}
    >
      <ScreenHeader
        title="Live Voice"
        variant="large"
        onBackPress={() => router.push('/(tabs)' as any)}
        rightIcon={transcript.length > 0
          ? <IconButton icon={TrashIcon} label="Clear conversation" onPress={() => setTranscript([])} />
          : undefined}
      />

      <StyledScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, paddingTop: 20, paddingBottom: 40 }}
      >
        {/* Waveform bars */}
        <Stack horizontal gap={3} alignItems="flex-end" justifyContent="center" height={48} marginBottom={24}>
          {barHeights.map((height, i) => {
            const active = listening && i % 3 !== 1
            return (
              <Animated.View
                key={i}
                style={{
                  width: 4, height, borderRadius: 3,
                  backgroundColor: active ? C.primary : C.bgMuted,
                  opacity: active ? 1 : 0.45,
                }}
              />
            )
          })}
        </Stack>

        {/* Orb */}
        <Stack alignItems="center" justifyContent="center" marginBottom={24}>
          <Animated.View style={[
            styles.glowRing,
            { borderColor: C.accent, opacity: glowOpacity, transform: [{ scale: glowScale }] },
          ]} />
          <Animated.View style={{ transform: [{ scale: pulse }] }}>
            <StyledPressable
              onPress={listening ? handleStop : handleStart}
              disabled={processing}
              accessibilityRole="button"
              accessibilityLabel={listening ? 'Stop recording' : 'Start recording'}
              style={[styles.orb, { borderColor: listening ? C.primary : C.border, shadowColor: C.accent }]}
            >
              <Svg width={140} height={140} style={StyleSheet.absoluteFill}>
                <Defs>
                  <LinearGradient id="orbGrad" x1="0" y1="0" x2="1" y2="1">
                    <Stop offset="0" stopColor={C.sumColor} />
                    <Stop offset="1" stopColor={C.accent} />
                  </LinearGradient>
                </Defs>
                <Circle cx={70} cy={70} r={70} fill="url(#orbGrad)" fillOpacity={listening ? 0.22 : 0.10} />
              </Svg>
              <MicIcon size={48} strokeWidth={1.6} color={listening ? C.primary : C.accent} />
            </StyledPressable>
          </Animated.View>
        </Stack>

        {/* Status label */}
        <Stack alignItems="center" marginBottom={28}>
          <Stack horizontal alignItems="center" gap={8}>
            {listening && <Animated.View style={[styles.liveDot, { backgroundColor: C.live, opacity: dotOpacity }]} />}
            <Text variant="label" color={listening || processing ? C.primary : C.textSecondary}>
              {listening ? 'Listening…' : processing ? 'Translating…' : 'Tap the mic to start'}
            </Text>
          </Stack>
          <Text variant="caption" color={C.textMuted} style={{ marginTop: 4 }}>
            {sourceLang.toUpperCase()} → {targetLang.toUpperCase()}
          </Text>
        </Stack>

        {/* Interim bubble while recording and translating — replaced by the result */}
        {(listening || processing) && (
          <StyledCard
            backgroundColor={C.primaryBg} borderRadius={16} padding={14} marginBottom={16}
            borderWidth={1} borderColor={C.border}
          >
            <Text variant="overline" color={C.primary} style={{ letterSpacing: 0.8, marginBottom: 6 }}>
              {listening ? `LISTENING${'.'.repeat(dots)}` : 'TRANSLATING…'}
            </Text>
            {listening ? (
              <Text variant="body" color={C.textSecondary}>Speak now… tap stop when done</Text>
            ) : (
              <Stack horizontal alignItems="center" gap={8}>
                <ActivityIndicator size="small" color={C.primary} />
                <Text variant="body" color={C.textSecondary}>Working out what you said</Text>
              </Stack>
            )}
          </StyledCard>
        )}

        {/* YOU SAID + TRANSLATION */}
        {lastLine && !listening && !processing && (
          <Stack gap={12} marginBottom={16}>
            <StyledCard backgroundColor={C.primaryBg} borderRadius={16} padding={14} borderWidth={1} borderColor={C.border}>
              <Text variant="overline" color={C.primary} style={{ letterSpacing: 0.8, marginBottom: 6 }}>YOU SAID</Text>
              <Text variant="body" color={C.textPrimary}>{lastLine.text}</Text>
            </StyledCard>
            {lastLine.translated && (
              <StyledCard backgroundColor={C.accentBg} borderRadius={16} padding={14} borderWidth={1} borderColor={C.border}>
                <Text variant="overline" color={C.accent} style={{ letterSpacing: 0.8, marginBottom: 6 }}>TRANSLATION</Text>
                <Text variant="body" color={C.textPrimary}>{lastLine.translated}</Text>
              </StyledCard>
            )}
          </Stack>
        )}

        {transcript.length === 0 && !listening && !processing && (
          <Text variant="bodySmall" color={C.textMuted} textAlign="center" style={{ paddingTop: 8 }}>
            Your conversation will appear here
          </Text>
        )}
      </StyledScrollView>

      {/* Bottom controls */}
      <Stack horizontal alignItems="center" justifyContent="center" gap={40}
        paddingHorizontal={32} paddingBottom={16} paddingTop={16}
        borderTopWidth={1} borderTopColor={C.border} backgroundColor={C.bg}
      >
        <IconButton icon={BookmarkIcon} label="Save to phrasebook" onPress={handleSaveLast}
          size={52} iconSize={20} color={C.primary} background={C.bgCard} disabled={!hasResult} />

        <StyledPressable
          width={70} height={70} borderRadius={35}
          alignItems="center" justifyContent="center"
          backgroundColor={listening ? C.danger : C.primary}
          onPress={listening ? handleStop : handleStart}
          disabled={processing}
          accessibilityRole="button" accessibilityLabel={listening ? 'Stop recording' : 'Start recording'}
          style={{
            opacity: processing ? 0.6 : 1,
            shadowColor: listening ? C.danger : C.primary, shadowOpacity: 0.4, shadowRadius: 16,
            shadowOffset: { width: 0, height: 4 }, elevation: 8,
          }}
        >
          {listening
            ? <StopIcon size={24} strokeWidth={2} color={C.white} />
            : <MicIcon size={26} strokeWidth={2.2} color={C.white} />}
        </StyledPressable>

        <StyledPressable
          width={52} height={52} borderRadius={26}
          alignItems="center" justifyContent="center"
          backgroundColor={C.bgCard} borderWidth={1} borderColor={C.border}
          onPress={handleListen} disabled={!hasResult || ttsLoading}
          accessibilityRole="button" accessibilityLabel="Listen to translation"
          style={{ opacity: !hasResult ? 0.5 : 1 }}
        >
          {ttsLoading
            ? <ActivityIndicator size="small" color={C.primary} />
            : <SpeakerIcon size={20} strokeWidth={1.8} color={C.primary} />}
        </StyledPressable>
      </Stack>
    </StyledPage>
  )
}

const styles = StyleSheet.create({
  liveDot: {
    width: 8, height: 8, borderRadius: 4,
  },
  orb: {
    width: 140, height: 140, borderRadius: 70,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2,
    shadowOpacity: 0.4, shadowRadius: 28, shadowOffset: { width: 0, height: 8 },
    elevation: 12,
    backgroundColor: 'transparent',
  },
  glowRing: {
    position: 'absolute',
    width: 190, height: 190, borderRadius: 95,
    borderWidth: 2,
  },
})
