import React, { useEffect, useRef, useState } from 'react'
import {
  Animated, Easing, NativeScrollEvent, NativeSyntheticEvent, Platform, ScrollView,
  Text as RNText, TouchableOpacity, useWindowDimensions, View,
} from 'react-native'
import { router } from 'expo-router'
import { StyledPage } from 'fluent-styles'
import { setOnboardingSeen } from '../src/stores'
import { AuthButton, FONT, PURPLE, TEAL, useAuthColors } from '../src/components/AuthUI'

const SLIDES = [
  {
    title:   ['Speak every language,', 'anywhere'],
    body:    'Real-time translation for text, voice, and camera — in 37 languages. Your words, understood everywhere.',
    accent:  TEAL,
    scene:   'globe' as const,
  },
  {
    title:   ['Two-way voice,', 'in real time'],
    body:    'Hold a natural conversation across any language barrier. Tranquis listens, translates, and speaks — instantly, for both sides.',
    accent:  TEAL,
    scene:   'voice' as const,
  },
  {
    title:   ['Point, shoot,', 'understood'],
    body:    'Aim your camera at any text — a menu, a sign, a document — and see the translation overlaid instantly.',
    accent:  PURPLE,
    scene:   'camera' as const,
  },
]

const SCENE = 280

/** A looping 0→1 driver; `delay` staggers several of them. */
function useLoop(duration: number, delay = 0) {
  const v = useRef(new Animated.Value(0)).current
  useEffect(() => {
    const anim = Animated.loop(Animated.sequence([
      Animated.delay(delay),
      Animated.timing(v, { toValue: 1, duration, easing: Easing.linear, useNativeDriver: true }),
    ]))
    anim.start()
    return () => anim.stop()
  }, [v, duration, delay])
  return v
}

function Pill({ label, color, filled }: { label: string; color: string; filled?: boolean }) {
  const A = useAuthColors()
  return (
    <View style={{
      paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999, borderWidth: 1,
      borderColor: `${color}40`, backgroundColor: filled ? `${color}14` : A.bg,
    }}>
      <RNText style={{ fontFamily: FONT.semibold, fontSize: 13, color }}>{label}</RNText>
    </View>
  )
}

// ─── Slide 1: globe, pulsing rings, orbiting language badges ─────────────────

function Ring({ delay }: { delay: number }) {
  const t = useLoop(3000, delay)
  return (
    <Animated.View style={{
      position: 'absolute', width: 120, height: 120, borderRadius: 60,
      borderWidth: 1.5, borderColor: TEAL,
      opacity: t.interpolate({ inputRange: [0, 0.15, 1], outputRange: [0, 0.45, 0] }),
      transform: [{ scale: t.interpolate({ inputRange: [0, 1], outputRange: [1, 2.3] }) }],
    }} />
  )
}

const BADGES = [
  { code: 'EN', angle: -90 },
  { code: 'AR', angle: 0 },
  { code: 'ES', angle: 50 },
  { code: 'FR', angle: 130 },
]

function GlobeScene() {
  const A = useAuthColors()
  const spin = useLoop(30000)
  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] })
  const counter = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '-360deg'] })
  const R = 112
  return (
    <View style={{ width: SCENE, height: SCENE, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ position: 'absolute', width: 2 * R, height: 2 * R, borderRadius: R, borderWidth: 1, borderColor: `${TEAL}30` }} />
      <Ring delay={0} />
      <Ring delay={1000} />
      <Ring delay={2000} />
      <View style={{
        width: 120, height: 120, borderRadius: 60, borderWidth: 1.5, borderColor: `${TEAL}70`,
        backgroundColor: A.isDark ? `${TEAL}14` : '#F3FBF8', alignItems: 'center', justifyContent: 'center',
      }}>
        <RNText style={{ fontSize: 80, lineHeight: 96 }}>🌍</RNText>
      </View>
      {/* The badge ring turns slowly; each badge counter-rotates to stay upright */}
      <Animated.View style={{ position: 'absolute', width: SCENE, height: SCENE, transform: [{ rotate }] }}>
        {BADGES.map(({ code, angle }) => {
          const rad = (angle * Math.PI) / 180
          return (
            <Animated.View key={code} style={{
              position: 'absolute', left: SCENE / 2 + R * Math.cos(rad) - 22, top: SCENE / 2 + R * Math.sin(rad) - 22,
              width: 44, height: 44, borderRadius: 22, backgroundColor: A.bg,
              borderWidth: 1, borderColor: A.border, alignItems: 'center', justifyContent: 'center',
              transform: [{ rotate: counter }],
            }}>
              <RNText style={{ fontFamily: FONT.bold, fontSize: 13, color: TEAL }}>{code}</RNText>
            </Animated.View>
          )
        })}
      </Animated.View>
    </View>
  )
}

// ─── Slide 2: voice wave around a mic, translation bubbles ───────────────────

function WaveBar({ index }: { index: number }) {
  const t = useLoop(1100, index * 110)
  const peak = [0.5, 0.75, 1, 0.85, 0.6, 0.85, 1, 0.75, 0.5][index]
  return (
    <Animated.View style={{
      width: 6, height: 70 * peak, borderRadius: 3, backgroundColor: TEAL, marginHorizontal: 11,
      transform: [{ scaleY: t.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.35, 1, 0.35] }) }],
    }} />
  )
}

function Bubble({ text, accent, style }: { text: string; accent?: boolean; style: object }) {
  const A = useAuthColors()
  return (
    <View style={[{
      position: 'absolute', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 16,
      backgroundColor: A.bg, borderWidth: 1, borderColor: accent ? `${TEAL}50` : A.border,
    }, style]}>
      <RNText style={{ fontFamily: FONT.bold, fontSize: 15, color: accent ? TEAL : A.text }}>{text}</RNText>
    </View>
  )
}

function VoiceScene() {
  return (
    <View style={{ width: SCENE, height: SCENE, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', position: 'absolute' }}>
        {Array.from({ length: 9 }, (_, i) => <WaveBar key={i} index={i} />)}
      </View>
      <View style={{ width: 96, height: 96, borderRadius: 48, backgroundColor: TEAL, alignItems: 'center', justifyContent: 'center' }}>
        <RNText style={{ fontSize: 40, lineHeight: 50 }}>🎙️</RNText>
      </View>
      <Bubble text="Bonjour!" style={{ top: 34, left: 6 }} />
      <Bubble text="Hello!" accent style={{ top: 34, right: 6 }} />
      <Bubble text="Hola, ¿cómo estás?" style={{ bottom: 34 }} />
    </View>
  )
}

// ─── Slide 3: viewfinder with a scanning line ────────────────────────────────

function Corner({ pos }: { pos: 'tl' | 'tr' | 'bl' | 'br' }) {
  const top = pos[0] === 't', left = pos[1] === 'l'
  return (
    <View style={{
      position: 'absolute', width: 28, height: 28,
      ...(top ? { top: 0 } : { bottom: 0 }), ...(left ? { left: 0 } : { right: 0 }),
      borderColor: TEAL, borderTopWidth: top ? 3 : 0, borderBottomWidth: top ? 0 : 3,
      borderLeftWidth: left ? 3 : 0, borderRightWidth: left ? 0 : 3,
      borderTopLeftRadius: pos === 'tl' ? 6 : 0, borderTopRightRadius: pos === 'tr' ? 6 : 0,
      borderBottomLeftRadius: pos === 'bl' ? 6 : 0, borderBottomRightRadius: pos === 'br' ? 6 : 0,
    }} />
  )
}

function CameraScene() {
  const A = useAuthColors()
  const scan = useLoop(2200)
  const row = (w: number, color: string) => <View style={{ width: w, height: 9, borderRadius: 5, backgroundColor: color }} />
  return (
    <View style={{ alignSelf: 'stretch', alignItems: 'center' }}>
      <View style={{ width: 230, height: 230, alignItems: 'center', justifyContent: 'center' }}>
        {(['tl', 'tr', 'bl', 'br'] as const).map((p) => <Corner key={p} pos={p} />)}
        <View style={{ width: 170, borderRadius: 16, borderWidth: 1.5, borderColor: `${TEAL}55`, overflow: 'hidden', backgroundColor: A.bg }}>
          {/* Original text, being scanned */}
          <View style={{ height: 76, padding: 14, gap: 9 }}>
            {row(120, A.border)}
            {row(90, A.border)}
            <Animated.View style={{
              position: 'absolute', left: 0, right: 0, height: 2, backgroundColor: TEAL,
              shadowColor: TEAL, shadowOpacity: 0.8, shadowRadius: 6,
              transform: [{ translateY: scan.interpolate({ inputRange: [0, 1], outputRange: [4, 72] }) }],
            }} />
          </View>
          {/* Translation */}
          <View style={{ padding: 14, gap: 9, backgroundColor: `${TEAL}14`, borderTopWidth: 1, borderTopColor: `${TEAL}30` }}>
            {row(110, `${TEAL}AA`)}
            {row(80, `${TEAL}AA`)}
          </View>
        </View>
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 6, marginTop: 18 }}>
        {['Menus', 'Signs', 'Documents', 'Labels'].map((l) => <Pill key={l} label={l} color={TEAL} filled />)}
      </View>
    </View>
  )
}

function Scene({ scene }: { scene: (typeof SLIDES)[number]['scene'] }) {
  if (scene === 'voice') return <VoiceScene />
  if (scene === 'camera') return <CameraScene />
  return <GlobeScene />
}

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function OnboardingScreen() {
  const A = useAuthColors()
  const { width } = useWindowDimensions()
  const scrollRef = useRef<ScrollView>(null)
  const [index, setIndex] = useState(0)

  const isLast = index === SLIDES.length - 1

  // Shown once: remember it, then straight to sign-up
  const finish = async () => {
    await setOnboardingSeen()
    router.replace('/auth/register')
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
    <StyledPage flex={1} backgroundColor={A.bg} showStatusBar
      statusBarStyle={A.isDark ? 'light-content' : 'dark-content'}
      statusBarBackgroundColor={Platform.OS === 'android' ? A.bg : undefined}
    >
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScrollEnd}
        style={{ flex: 1 }}
      >
        {SLIDES.map((s) => (
          <View key={s.scene} style={{ width, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28 }}>
            <Scene scene={s.scene} />
            <RNText style={{ fontFamily: FONT.heading, fontSize: 30, lineHeight: 36, letterSpacing: -0.8, textAlign: 'center', color: A.text, marginTop: 32 }}>
              {s.title[0]}{'\n'}
              <RNText style={{ color: s.accent }}>{s.title[1]}</RNText>
            </RNText>
            <RNText style={{ fontFamily: FONT.body, fontSize: 16, lineHeight: 25, textAlign: 'center', color: A.muted, marginTop: 14, maxWidth: 340 }}>
              {s.body}
            </RNText>
          </View>
        ))}
      </ScrollView>

      <View style={{ paddingHorizontal: 24, paddingBottom: Platform.OS === 'ios' ? 12 : 24, gap: 20 }}>
        {/* Progress dots — the active one stretches */}
        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 7 }}>
          {SLIDES.map((s, i) => (
            <View key={s.scene} style={{
              width: i === index ? 22 : 7, height: 7, borderRadius: 4,
              backgroundColor: i === index ? TEAL : A.border,
            }} />
          ))}
        </View>
        <AuthButton
          label={isLast ? 'Start Translating →' : 'Next →'}
          color={isLast ? PURPLE : TEAL}
          onPress={goNext}
        />
        {/* Same height on every slide so the button doesn't jump */}
        <TouchableOpacity onPress={finish} disabled={isLast} hitSlop={8}
          style={{ alignSelf: 'center', height: 22, opacity: isLast ? 0 : 1 }}
          accessibilityRole="button" accessibilityLabel="Skip intro"
        >
          <RNText style={{ fontFamily: FONT.medium, fontSize: 15, color: A.muted }}>Skip intro</RNText>
        </TouchableOpacity>
      </View>
    </StyledPage>
  )
}
