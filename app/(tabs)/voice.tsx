import React, { useState, useRef, useEffect } from 'react'
import { Platform, TouchableOpacity, ScrollView, StyleSheet, Animated } from 'react-native'
import { Feather } from '@expo/vector-icons'
import Svg, { Defs, LinearGradient, Stop, Circle } from 'react-native-svg'
import { StyledPage, Stack, toastService } from 'fluent-styles'
import * as ExpoClipboard from 'expo-clipboard'
import { Text } from '../../src/components/Text'
import { useColors, useIsDark } from '../../src/constants'
import { useTranslatorStore } from '../../src/stores'

type TranscriptLine = {
  id:          string
  speaker:     'you' | 'them'
  text:        string
  translated?: string
}

export default function VoiceScreen() {
  const C      = useColors()
  const isDark = useIsDark()
  const { sourceLang, targetLang } = useTranslatorStore()

  const [listening, setListening]   = useState(false)
  const [transcript, setTranscript] = useState<TranscriptLine[]>([])

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

  const handleStop = () => {
    setListening(false)
    // Mock result — real Whisper integration in Sprint 3
    const id = Date.now().toString()
    setTranscript((prev) => [
      ...prev,
      { id, speaker: 'you', text: 'Hello, how much does this cost?', translated: 'Hola, ¿cuánto cuesta esto?' },
    ])
  }

  const handleStart = () => setListening(true)

  const handleListen = () => {
    // TTS on last translation — Sprint 3
  }

  const handleSaveLast = async () => {
    const last = transcript[transcript.length - 1]
    if (!last?.translated) return
    toastService.success('Saved', 'Phrase saved to phrasebook')
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
          {[14, 24, 18, 34, 22, 40, 16, 30, 44, 20, 36, 26, 42, 18, 28, 32, 20, 38, 16, 44].map((h, i) => {
            const active = listening && i % 3 !== 1
            return (
              <Stack
                key={i}
                width={4} height={listening ? h : 6} borderRadius={3}
                style={{
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
          <Text variant="body" color={listening ? C.primary : C.textSecondary} fontWeight="700">
            {listening ? 'Listening…' : 'Tap mic to start'}
          </Text>
          <Text variant="caption" color={C.textMuted} style={{ marginTop: 4 }}>
            {sourceLang.toUpperCase()} → {targetLang.toUpperCase()}
          </Text>
        </Stack>

        {/* YOU SAID bubble */}
        {lastLine && (
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
        {transcript.length === 0 && !listening && (
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
        <TouchableOpacity onPress={handleListen} activeOpacity={0.7}
          style={[styles.bottomBtn, { backgroundColor: C.bgCard, borderColor: C.border }]}
        >
          <Text style={{ fontSize: 20 }}>🔊</Text>
        </TouchableOpacity>
      </Stack>
    </StyledPage>
  )
}

const styles = StyleSheet.create({
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
