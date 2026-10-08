import React, { useState, useRef, useEffect } from 'react'
import { Platform, TouchableOpacity, ScrollView, StyleSheet, Animated, ActivityIndicator } from 'react-native'
import { Feather } from '@expo/vector-icons'
import Svg, { Defs, LinearGradient, Stop, Circle } from 'react-native-svg'
import { StyledPage, Stack, toastService } from 'fluent-styles'
import * as ExpoClipboard from 'expo-clipboard'
import * as FileSystem from 'expo-file-system'
import { Audio } from 'expo-av'
import { Text } from '../../src/components/Text'
import { useColors, useIsDark } from '../../src/constants'
import { useTranslatorStore } from '../../src/stores'
import { translateService, type TranslationResult } from '../../src/services/api'
import { useTTS } from '../../src/hooks'

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

  const handleCopyLast = async () => {
    const last = transcript[transcript.length - 1]
    if (!last?.translated) return
    await ExpoClipboard.setStringAsync(last.translated)
    toastService.success('Copied', 'Translation copied')
  }

  const glowOpacity = glow.interpolate({ inputRange: [0, 1], outputRange: [0.15, 0.5] })
  const glowScale   = glow.interpolate({ inputRange: [0, 1], outputRange: [1, 1.3] })

  const lastLine = transcript[transcript.length - 1]

  return (
    <StyledPage flex={1} backgroundColor={C.bg} showStatusBar
      statusBarStyle={isDark ? 'light-content' : 'dark-content'}
      statusBarBackgroundColor={Platform.OS === 'android' ? C.bg : undefined}
    >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Stack horizontal alignItems="center" justifyContent="space-between"
          marginBottom={24} marginTop={8}
        >
          <Text variant="title" color={C.textPrimary} fontWeight="800">Live Voice</Text>
          {transcript.length > 0 && (
            <TouchableOpacity
              onPress={() => setTranscript([])}
              activeOpacity={0.7}
              style={[styles.clearBtn, { backgroundColor: C.bgCard, borderColor: C.border }]}
            >
              <Feather name="trash-2" size={14} color={C.textMuted} />
              <Text variant="caption" color={C.textMuted} fontWeight="600" style={{ marginLeft: 5 }}>Clear</Text>
            </TouchableOpacity>
          )}
        </Stack>

        {/* Waveform bars */}
        <Stack horizontal gap={3} alignItems="flex-end" justifyContent="center"
          height={48} marginBottom={24}
        >
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
          {/* Glow ring */}
          <Animated.View style={[
            styles.glowRing,
            { opacity: glowOpacity, transform: [{ scale: glowScale }] }
          ]} />

          {/* Pulse wrapper */}
          <Animated.View style={{ transform: [{ scale: pulse }] }}>
            <TouchableOpacity
              onPress={listening ? handleStop : handleStart}
              activeOpacity={0.85}
              style={[styles.orb, { borderColor: listening ? C.primary : C.border }]}
            >
              <Svg width={140} height={140} style={StyleSheet.absoluteFill}>
                <Defs>
                  {/* Blue-purple gradient matching mock */}
                  <LinearGradient id="orbGrad" x1="0" y1="0" x2="1" y2="1">
                    <Stop offset="0" stopColor="#3B82F6" />
                    <Stop offset="0.5" stopColor="#7C3AED" />
                    <Stop offset="1" stopColor="#8B5CF6" />
                  </LinearGradient>
                </Defs>
                <Circle cx={70} cy={70} r={70} fill="url(#orbGrad)"
                  fillOpacity={listening ? 0.22 : 0.10} />
              </Svg>
              <Text style={{ fontSize: 42 }}>🎙️</Text>
            </TouchableOpacity>
          </Animated.View>
        </Stack>

        {/* Status label */}
        <Stack alignItems="center" marginBottom={28}>
          <Stack horizontal alignItems="center" gap={8}>
            {listening && (
              <Animated.View style={[styles.liveDot, { opacity: dotOpacity }]} />
            )}
            <Text variant="body" color={listening || processing ? C.primary : C.textSecondary} fontWeight="700">
              {listening ? 'Listening…' : processing ? 'Translating…' : 'Tap mic to start'}
            </Text>
          </Stack>
          <Text variant="caption" color={C.textMuted} style={{ marginTop: 4 }}>
            {sourceLang.toUpperCase()} → {targetLang.toUpperCase()}
          </Text>
        </Stack>

        {/* Interim bubble while recording and translating — replaced by the result */}
        {(listening || processing) && (
          <Stack
            backgroundColor={`${C.primary}20`} borderRadius={16} padding={14} marginBottom={16}
            style={{ borderWidth: 1, borderColor: `${C.primary}35` }}
          >
            <Text variant="caption" color={C.primary} fontWeight="700"
              style={{ letterSpacing: 0.8, marginBottom: 6 }}
            >
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
          </Stack>
        )}

        {/* YOU SAID bubble */}
        {lastLine && !listening && !processing && (
          <Stack gap={12} marginBottom={16}>
            <Stack
              backgroundColor={`${C.primary}20`}
              borderRadius={16} padding={14}
              style={{ borderWidth: 1, borderColor: `${C.primary}35` }}
            >
              <Text
                variant="caption"
                color={C.primary}
                fontWeight="700"
                style={{ letterSpacing: 0.8, marginBottom: 6 }}
              >
                YOU SAID
              </Text>
              <Text variant="body" color={C.textPrimary}>{lastLine.text}</Text>
            </Stack>

            {lastLine.translated && (
              <Stack
                backgroundColor="#7C3AED20"
                borderRadius={16} padding={14}
                style={{ borderWidth: 1, borderColor: '#7C3AED35' }}
              >
                <Text
                  variant="caption"
                  color="#7C3AED"
                  fontWeight="700"
                  style={{ letterSpacing: 0.8, marginBottom: 6 }}
                >
                  TRANSLATION
                </Text>
                <Text variant="body" color={C.textPrimary}>{lastLine.translated}</Text>
              </Stack>
            )}
          </Stack>
        )}

        {/* Empty state */}
        {transcript.length === 0 && !listening && !processing && (
          <Stack alignItems="center" gap={10} paddingTop={8}>
            <Text variant="bodySmall" color={C.textMuted} textAlign="center">
              Your conversation will appear here
            </Text>
          </Stack>
        )}
      </ScrollView>

      {/* Bottom controls */}
      <Stack horizontal alignItems="center" justifyContent="center" gap={40}
        paddingHorizontal={32} paddingBottom={Platform.OS === 'ios' ? 32 : 20} paddingTop={16}
        style={{ borderTopWidth: 1, borderTopColor: C.border }}
      >
        {/* Save */}
        <TouchableOpacity onPress={handleSaveLast} activeOpacity={0.7}
          style={[styles.bottomBtn, { backgroundColor: C.bgCard, borderColor: C.border }]}
        >
          <Text style={{ fontSize: 20 }}>⭐</Text>
        </TouchableOpacity>

        {/* Stop / Start — centre, bigger */}
        <TouchableOpacity
          onPress={listening ? handleStop : handleStart}
          activeOpacity={0.7}
          style={[
            styles.stopBtn,
            { backgroundColor: listening ? '#EF4444' : C.primary }
          ]}
        >
          <Feather name={listening ? 'square' : 'mic'} size={26} color="#FFF" />
        </TouchableOpacity>

        {/* Listen */}
        <TouchableOpacity onPress={handleListen} activeOpacity={0.7} disabled={ttsLoading}
          style={[styles.bottomBtn, { backgroundColor: C.bgCard, borderColor: C.border, opacity: ttsLoading ? 0.6 : 1 }]}
        >
          {ttsLoading
            ? <ActivityIndicator size="small" color={C.primary} />
            : <Text style={{ fontSize: 20 }}>🔊</Text>}
        </TouchableOpacity>
      </Stack>
    </StyledPage>
  )
}

const styles = StyleSheet.create({
  liveDot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: '#22C55E',
  },
  clearBtn: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: 12, borderWidth: 1,
  },
  orb: {
    width: 140, height: 140, borderRadius: 70,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2,
    shadowColor: '#7C3AED',
    shadowOpacity: 0.4,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
    backgroundColor: 'transparent',
  },
  glowRing: {
    position: 'absolute',
    width: 190, height: 190, borderRadius: 95,
    borderWidth: 2, borderColor: '#7C3AED',
  },
  bottomBtn: {
    width: 52, height: 52, borderRadius: 26,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1,
  },
  stopBtn: {
    width: 70, height: 70, borderRadius: 35,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#EF4444',
    shadowOpacity: 0.4,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
})
