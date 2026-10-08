import React, { useRef, useState } from 'react'
import { Platform, ScrollView, useWindowDimensions, NativeSyntheticEvent, NativeScrollEvent } from 'react-native'
import { router } from 'expo-router'
import { ArrowDownIcon, MapPinIcon, MicIcon, BookmarkIcon } from '../src/icons'
import Svg, { Defs, LinearGradient, Stop, Rect, Circle, Path, Text as SvgText } from 'react-native-svg'
import { StyledPage, Stack, StyledPressable } from 'fluent-styles'
import { Text } from '../src/components/Text'
import { useColors, useIsDark } from '../src/constants'
import { setOnboardingSeen } from '../src/stores'
import { GradientButton } from '../src/components/AuthUI'

const SLIDES = [
  {
    title: 'Type, speak or photograph — all translated',
    desc:  'Tranquis understands text, voice and camera. Translate menus, signs, documents and conversations in seconds.',
    scene: 'text' as const,
  },
  {
    title: 'Live interpreter for real conversations',
    desc:  'Talk naturally and hear translations in real time. Perfect for meetings, travel and language learning.',
    scene: 'voice' as const,
  },
  {
    title: 'Build your personal phrasebook',
    desc:  'Save useful phrases from any translation and organise them by category. Never forget an important expression again.',
    scene: 'phrase' as const,
  },
] as const

const SIZE = 300

function Backdrop({ fg }: { fg: string }) {
  const C = useColors()
  return (
    <>
      <Stack position="absolute" top={20} left={30} width={240} height={240} borderRadius={120}
        backgroundColor={fg} style={{ opacity: 0.09 }} />
      <Stack position="absolute" bottom={0} right={10} width={140} height={140} borderRadius={70}
        backgroundColor={C.primary} style={{ opacity: 0.07 }} />
      <Svg width={SIZE} height={SIZE} style={{ position: 'absolute' }}>
        <Circle cx={SIZE / 2} cy={SIZE / 2} r={136} stroke={fg} strokeOpacity={0.25} strokeWidth={1.2} fill="none" />
        <Circle cx={SIZE / 2 + 96} cy={SIZE / 2 - 96} r={14} fill={fg} fillOpacity={0.2} />
        <Circle cx={SIZE / 2 + 96} cy={SIZE / 2 - 96} r={6.5} fill={fg} />
      </Svg>
    </>
  )
}

const glass = (fg: string, C: any) => ({
  backgroundColor: C.bgCard, borderWidth: 1, borderColor: `${fg}40`,
  shadowColor: fg, shadowOpacity: 0.28, shadowRadius: 20, shadowOffset: { width: 0, height: 10 }, elevation: 10,
})

function TextHero() {
  const C  = useColors()
  const fg = C.primary
  return (
    <Stack width={SIZE} height={SIZE} alignItems="center" justifyContent="center" marginBottom={28}>
      <Backdrop fg={fg} />
      {/* Translation card */}
      <Stack width={220} borderRadius={24} padding={18} gap={14} style={glass(fg, C)}>
        {/* Source bubble */}
        <Stack backgroundColor={C.bgInput} borderRadius={14} padding={12}>
          <Text variant="bodySmall" color={C.textSecondary} fontWeight="600" marginBottom={4}>English</Text>
          <Text variant="body" color={C.textPrimary}>Where is the train station?</Text>
        </Stack>
        {/* Arrow */}
        <Stack alignItems="center">
          <Stack width={32} height={32} borderRadius={16} alignItems="center" justifyContent="center"
            backgroundColor={fg} style={{ shadowColor: fg, shadowOpacity: 0.5, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 6 }}
          >
            <ArrowDownIcon size={16} strokeWidth={2.2} color={C.white} />
          </Stack>
        </Stack>
        {/* Target bubble */}
        <Stack backgroundColor={C.primaryBg} borderRadius={14} padding={12}
          style={{ borderWidth: 1, borderColor: `${fg}25` }}
        >
          <Text variant="bodySmall" color={C.primary} fontWeight="600" marginBottom={4}>Spanish</Text>
          <Text variant="body" color={C.textPrimary}>¿Dónde está la estación de tren?</Text>
        </Stack>
      </Stack>
      {/* Tone chip */}
      <Stack position="absolute" right={10} top={50} horizontal alignItems="center" gap={6}
        borderRadius={20} paddingHorizontal={12} paddingVertical={8}
        style={glass(C.sumColor, C)}
      >
        <MapPinIcon size={12} strokeWidth={2.2} color={C.sumColor} />
        <Text variant="caption" color={C.textPrimary} fontWeight="700">Travel</Text>
      </Stack>
    </Stack>
  )
}

function VoiceHero() {
  const C  = useColors()
  const fg = C.primary
  return (
    <Stack width={SIZE} height={SIZE} alignItems="center" justifyContent="center" marginBottom={28}>
      <Backdrop fg={fg} />

      {/* Waveform bars */}
      <Stack horizontal gap={5} alignItems="center" position="absolute" top={60}>
        {[18, 30, 42, 26, 38, 18, 34, 46, 22, 36, 20, 30].map((h, i) => (
          <Stack key={i} width={5} height={h} borderRadius={3}
            backgroundColor={i % 3 === 0 ? fg : C.bgMuted} style={{ opacity: i % 3 === 0 ? 1 : 0.6 }}
          />
        ))}
      </Stack>

      {/* Orb */}
      <Stack width={120} height={120} borderRadius={60} alignItems="center" justifyContent="center"
        style={{
          ...glass(fg, C),
          shadowOpacity: 0.45, shadowRadius: 30,
        }}
      >
        <Svg width={120} height={120} style={{ position: 'absolute' }}>
          <Defs>
            <LinearGradient id="orb" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor={C.primaryLight} />
              <Stop offset="1" stopColor={C.primaryDark} />
            </LinearGradient>
          </Defs>
          <Circle cx={60} cy={60} r={60} fill="url(#orb)" fillOpacity={0.15} />
        </Svg>
        <MicIcon size={44} strokeWidth={1.7} color={fg} />
      </Stack>

      {/* Transcript chips */}
      <Stack position="absolute" left={4} bottom={68} borderRadius={14} paddingHorizontal={12} paddingVertical={8}
        style={glass(fg, C)}
      >
        <Text variant="caption" color={C.textSecondary} fontWeight="500">You: Hello, how much does this cost?</Text>
      </Stack>
      <Stack position="absolute" right={4} bottom={20} borderRadius={14} paddingHorizontal={12} paddingVertical={8}
        backgroundColor={C.primaryBg} style={{ borderWidth: 1, borderColor: `${fg}25` }}
      >
        <Text variant="caption" color={C.primary} fontWeight="500">Hola, ¿cuánto cuesta esto?</Text>
      </Stack>
    </Stack>
  )
}

function PhraseHero() {
  const C  = useColors()
  const fg = C.primary
  const phrases = [
    { en: 'Thank you very much', es: 'Muchas gracias',       ph: 'MOO-chas GRA-see-as' },
    { en: 'Where is the bathroom?', es: '¿Dónde está el baño?', ph: 'DON-de es-TA el BA-nyo' },
    { en: 'Can I have the check?',  es: '¿La cuenta, por favor?', ph: 'la KWEN-ta por fa-VOR' },
  ]
  return (
    <Stack width={SIZE} height={SIZE} alignItems="center" justifyContent="center" marginBottom={28}>
      <Backdrop fg={fg} />
      <Stack gap={10} style={{ width: 230 }}>
        {phrases.map((p, i) => (
          <Stack key={i} borderRadius={16} padding={12} style={glass(fg, C)}>
            <Stack horizontal alignItems="center" justifyContent="space-between">
              <Stack flex={1}>
                <Text variant="caption" color={C.textPrimary} fontWeight="700" numberOfLines={1}>{p.en}</Text>
                <Text variant="caption" color={C.primary} numberOfLines={1}>{p.es}</Text>
                <Text variant="caption" color={C.textMuted} style={{ fontStyle: 'italic' }} numberOfLines={1}>{p.ph}</Text>
              </Stack>
              <Stack width={30} height={30} borderRadius={15} alignItems="center" justifyContent="center"
                backgroundColor={C.primaryBg}
              >
                <BookmarkIcon size={13} strokeWidth={2.2} color={fg} />
              </Stack>
            </Stack>
          </Stack>
        ))}
      </Stack>
    </Stack>
  )
}

function Scene({ scene }: { scene: typeof SLIDES[number]['scene'] }) {
  if (scene === 'voice')  return <VoiceHero />
  if (scene === 'phrase') return <PhraseHero />
  return <TextHero />
}

export default function OnboardingScreen() {
  const C      = useColors()
  const isDark = useIsDark()
  const { width } = useWindowDimensions()
  const scrollRef  = useRef<ScrollView>(null)
  const [index, setIndex] = useState(0)

  const isLast = index === SLIDES.length - 1

  const finish = async () => {
    await setOnboardingSeen()
    router.replace('/auth/login')
  }

  const goNext = () => {
    if (isLast) { finish(); return }
    const next = index + 1
    scrollRef.current?.scrollTo({ x: next * width, animated: true })
    setIndex(next)
  }

  const handleScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const next = Math.round(e.nativeEvent.contentOffset.x / width)
    if (next !== index) setIndex(next)
  }

  return (
    <StyledPage flex={1} backgroundColor={C.bg} showStatusBar
      statusBarStyle={isDark ? 'light-content' : 'dark-content'}
      statusBarBackgroundColor={Platform.OS === 'android' ? C.bg : undefined}
    >
      <Stack horizontal justifyContent="flex-end" paddingHorizontal={20} paddingTop={12}>
        <StyledPressable onPress={finish}>
          <Text variant="bodySmall" color={C.textSecondary} fontWeight="600">Skip</Text>
        </StyledPressable>
      </Stack>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScrollEnd}
        style={{ flex: 1 }}
      >
        {SLIDES.map((slide) => (
          <Stack
            key={slide.title}
            alignItems="center" justifyContent="center"
            paddingHorizontal={32} style={{ width }}
          >
            <Scene scene={slide.scene} />
            <Text variant="header" color={C.textPrimary} fontWeight="800" textAlign="center"
              style={{ marginBottom: 12, marginHorizontal: 24, fontSize: 26, lineHeight: 34 }}
            >
              {slide.title}
            </Text>
            <Text variant="body" color={C.textSecondary} textAlign="center" style={{ lineHeight: 24, maxWidth: 330 }}>
              {slide.desc}
            </Text>
          </Stack>
        ))}
      </ScrollView>

      <Stack paddingHorizontal={24} paddingBottom={Platform.OS === 'ios' ? 20 : 28} gap={24}>
        {/* Dots */}
        <Stack horizontal alignItems="center" justifyContent="center" gap={7}>
          {SLIDES.map((slide, i) => (
            <Stack
              key={slide.title}
              width={i === index ? 22 : 7} height={7} borderRadius={4}
              backgroundColor={i === index ? C.primary : C.bgMuted}
              style={i === index
                ? { shadowColor: C.primary, shadowOpacity: 0.6, shadowRadius: 6, shadowOffset: { width: 0, height: 0 } }
                : undefined}
            />
          ))}
        </Stack>
        <GradientButton label={isLast ? 'Get started' : 'Next'} onPress={goNext} />
      </Stack>
    </StyledPage>
  )
}
