import React, { useEffect, useRef, useState } from 'react'
import { Platform, StyleSheet, Image, Animated, Easing } from 'react-native'
import * as ExpoClipboard from 'expo-clipboard'
import * as ImagePicker from 'expo-image-picker'
import * as ImageManipulator from 'expo-image-manipulator'
import Svg, { Defs, LinearGradient, Stop, Rect } from 'react-native-svg'
import { StyledPage, StyledScrollView, Stack, StyledCard, StyledPressable, toastService } from 'fluent-styles'
import { Text } from '../../src/components/Text'
import { ActionChip } from '../../src/components/ActionChip'
import { SectionLabel } from '../../src/components/SectionLabel'
import { useColors, useIsDark, getLang, findLang, getLangColors } from '../../src/constants'
import { useTranslatorStore } from '../../src/stores'
import { useTranslate, useTTS } from '../../src/hooks'
import type { TranslationResult } from '../../src/services/api'
import { goBack } from '../../src/utils'
import {
  CameraIcon, ImageIcon, ZapIcon, XIcon, CopyIcon, SpeakerIcon, StarIcon, ChevronLeftIcon, SwapIcon,
  SunIcon, CropIcon, TypeIcon, type IconComponent,
} from '../../src/icons'

const VIEWFINDER = 260
// Phone photos are ~12 MP; text stays readable at this size and the upload
// stays well under the API's 5 MB limit
const MAX_SIDE = 1600
const SCAN_BARS = 28

const TIPS: { Icon: IconComponent; tip: string }[] = [
  { Icon: SunIcon,  tip: 'Good lighting gives better results' },
  { Icon: CropIcon, tip: 'Crop tightly around the text' },
  { Icon: TypeIcon, tip: 'Works best with printed text' },
]

// ─── Scanning waveform ────────────────────────────────────────────────────────
// While a photo is being read, a waveform sweeps down the viewfinder with a
// glowing trail behind it, then starts again from the top.
function ScanWave() {
  const C = useColors()
  const sweep = useRef(new Animated.Value(0)).current
  const bars  = useRef(Array.from({ length: SCAN_BARS }, () => new Animated.Value(6))).current

  useEffect(() => {
    const loop = Animated.loop(Animated.timing(sweep, {
      toValue: 1, duration: 1800, easing: Easing.inOut(Easing.quad), useNativeDriver: true,
    }))
    loop.start()
    const jitter = setInterval(() => {
      bars.forEach((b) => Animated.timing(b, { toValue: 4 + Math.random() * 22, duration: 140, useNativeDriver: false }).start())
    }, 160)
    return () => { loop.stop(); clearInterval(jitter) }
  }, [])

  const translateY = sweep.interpolate({ inputRange: [0, 1], outputRange: [-70, VIEWFINDER - 30] })

  return (
    <Stack position="absolute" style={StyleSheet.absoluteFill} backgroundColor="rgba(0,0,0,0.35)" pointerEvents="none">
      <Animated.View style={{ position: 'absolute', left: 0, right: 0, top: 0, transform: [{ translateY }] }}>
        {/* Glowing trail above the line */}
        <Svg width="100%" height={70}>
          <Defs>
            <LinearGradient id="scanTrail" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={C.primary} stopOpacity={0} />
              <Stop offset="1" stopColor={C.primary} stopOpacity={0.35} />
            </LinearGradient>
          </Defs>
          <Rect x="0" y="0" width="100%" height="70" fill="url(#scanTrail)" />
        </Svg>
        {/* Waveform riding on the scan line */}
        <Stack horizontal alignItems="center" justifyContent="space-between" height={30} paddingHorizontal={14}>
          {bars.map((height, i) => (
            <Animated.View key={i} style={{ width: 3, height, borderRadius: 2, backgroundColor: C.primaryLight }} />
          ))}
        </Stack>
        <Stack height={2} backgroundColor={C.primary}
          style={{ shadowColor: C.primary, shadowOpacity: 0.9, shadowRadius: 8, shadowOffset: { width: 0, height: 0 } }}
        />
      </Animated.View>

      <Stack position="absolute" bottom={14} alignSelf="center" horizontal alignItems="center" gap={8}
        backgroundColor="rgba(0,0,0,0.6)" borderRadius={20} paddingHorizontal={14} paddingVertical={7}
      >
        <Stack width={7} height={7} borderRadius={3.5} backgroundColor={C.primary} />
        <Text variant="caption" color={C.white} fontWeight="700">Scanning and translating…</Text>
      </Stack>
    </Stack>
  )
}

// ─── Flip card ────────────────────────────────────────────────────────────────
// Front: the text found in the photo. Tap to flip to the translation and its
// actions. The card turns edge-on, swaps faces, then turns back — so each face
// keeps its own height.
function ResultFlipCard({ result, onCopy, onListen, onSave, listening }: {
  result:    TranslationResult
  onCopy:    () => void
  onListen:  () => void
  onSave:    () => void
  listening: boolean
}) {
  const C = useColors()
  const [showTranslation, setShowTranslation] = useState(false)
  const turn = useRef(new Animated.Value(0)).current
  const busy = useRef(false)

  // A new scan always starts on the original text
  useEffect(() => { setShowTranslation(false); turn.setValue(0) }, [result.id])

  const flip = () => {
    if (busy.current) return
    busy.current = true
    Animated.timing(turn, { toValue: 1, duration: 160, easing: Easing.in(Easing.quad), useNativeDriver: true }).start(() => {
      setShowTranslation((v) => !v)
      turn.setValue(-1)
      Animated.timing(turn, { toValue: 0, duration: 160, easing: Easing.out(Easing.quad), useNativeDriver: true }).start(() => {
        busy.current = false
      })
    })
  }
  const rotateY = turn.interpolate({ inputRange: [-1, 0, 1], outputRange: ['-90deg', '0deg', '90deg'] })

  const source = findLang(result.source_lang)
  const target = getLang(result.target_lang)
  const pairLabel = `${source?.label ?? result.source_lang} to ${target.label}`.toUpperCase()

  return (
    <Animated.View style={{ transform: [{ perspective: 900 }, { rotateY }] }}>
      <StyledPressable onPress={flip} accessibilityRole="button"
        accessibilityLabel={showTranslation ? 'Show original text' : 'Show translation'}
      >
        <Stack backgroundColor={showTranslation ? C.primaryBg : C.bgCard} borderRadius={22} padding={20}
          borderWidth={1.5} borderColor={C.primary}
        >
          <Stack horizontal alignItems="center" justifyContent="space-between" marginBottom={12}>
            <Text variant="overline" color={C.primaryDark} style={{ letterSpacing: 1 }}>
              {source?.flag ?? '🌐'} → {target.flag}  {pairLabel}
            </Text>
            <Stack horizontal alignItems="center" gap={4}>
              <SwapIcon size={13} strokeWidth={2.2} color={C.textMuted} />
              <Text variant="caption" color={C.textMuted} fontWeight="600">
                {showTranslation ? 'Translation' : 'Original'}
              </Text>
            </Stack>
          </Stack>

          {showTranslation ? (
            <>
              <Text variant="title" color={C.textPrimary} fontWeight="700" style={{ fontSize: 20, lineHeight: 28, marginBottom: 16 }}>
                {result.translated_text}
              </Text>
              <Stack horizontal gap={8} flexWrap="wrap">
                <ActionChip icon={CopyIcon} label="Copy" background={C.bgCard} onPress={onCopy} />
                <ActionChip icon={SpeakerIcon} label="Listen" background={C.bgCard} loading={listening} onPress={onListen} />
                <ActionChip icon={StarIcon} label="Save" background={C.bgCard} onPress={onSave} />
              </Stack>
            </>
          ) : (
            <>
              <Text variant="subtitle" color={C.textPrimary} fontWeight="500" style={{ fontSize: 17, lineHeight: 26 }}>
                “{result.source_text}”
              </Text>
              <Stack horizontal alignItems="center" gap={6} marginTop={14}>
                <Stack width={6} height={6} borderRadius={3} backgroundColor={C.primary} />
                <Text variant="bodySmall" color={C.primary} fontWeight="700">Tap to see the translation</Text>
              </Stack>
            </>
          )}
        </Stack>
      </StyledPressable>
    </Animated.View>
  )
}

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function CameraScreen() {
  const C      = useColors()
  const isDark = useIsDark()
  const { targetLang } = useTranslatorStore()
  const { translateImage, saveToPhrasebook, loading, result, clear } = useTranslate()
  const { speak, loading: ttsLoading } = useTTS()

  const [imageUri,  setImageUri]  = useState<string | null>(null)
  // Kept so a failed translation can be retried without picking the photo again
  const [base64,    setBase64]    = useState<string | null>(null)
  const [mimeType,  setMimeType]  = useState('image/jpeg')
  const [liveMode,  setLiveMode]  = useState(false)

  const handleAsset = async (res: ImagePicker.ImagePickerResult) => {
    if (res.canceled || !res.assets[0]) return
    const asset = res.assets[0]
    clear()
    setImageUri(asset.uri)
    setBase64(null)
    try {
      // Shrink and re-encode before upload — a full-size photo is too big to send
      const resize = asset.width >= asset.height
        ? (asset.width > MAX_SIDE ? { width: MAX_SIDE } : null)
        : (asset.height > MAX_SIDE ? { height: MAX_SIDE } : null)
      const small = await ImageManipulator.manipulateAsync(
        asset.uri,
        resize ? [{ resize }] : [],
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG, base64: true },
      )
      if (!small.base64) throw new Error('No image data')
      setBase64(small.base64)
      setMimeType('image/jpeg')
      await translateImage(small.base64, 'image/jpeg')
    } catch {
      toastService.error('Camera', 'Could not read that photo — please try another')
    }
  }

  const clearImage = () => {
    setImageUri(null)
    setBase64(null)
    clear()
  }

  const handlePickGallery = async () => {
    if (loading) return
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!perm.granted) { toastService.error('Permission', 'Photo library access denied'); return }
    const res = await ImagePicker.launchImageLibraryAsync({ quality: 1, mediaTypes: ['images'] })
    await handleAsset(res)
  }

  const handleCapture = async () => {
    if (loading) return
    // A photo is loaded but its translation failed — translate it again
    if (imageUri && base64 && !result) {
      await translateImage(base64, mimeType)
      return
    }
    const perm = await ImagePicker.requestCameraPermissionsAsync()
    if (!perm.granted) { toastService.error('Permission', 'Camera access denied'); return }
    try {
      const res = await ImagePicker.launchCameraAsync({ quality: 1, mediaTypes: ['images'] })
      await handleAsset(res)
    } catch {
      // No camera hardware (e.g. iOS simulator)
      toastService.error('Camera', 'Camera is not available on this device')
    }
  }

  const handleLive = () => {
    setLiveMode((v) => !v)
    toastService.info('Live Mode', 'Point your camera at text and tap Capture')
  }

  const handleCopyResult = async () => {
    if (!result) return
    await ExpoClipboard.setStringAsync(result.translated_text)
    toastService.success('Copied', 'Translation copied')
  }

  const captureLabel = imageUri ? (base64 && !result && !loading ? 'Translate' : 'Retake') : 'Capture & Translate'
  const detected = result ? findLang(result.source_lang) : undefined
  // Once there's a scan, show the pair it was actually translated with
  const pair = `${detected ? detected.code.toUpperCase() : 'AUTO'} → ${(result?.target_lang ?? targetLang).toUpperCase()}`

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
            <Text variant="title" color={C.textPrimary} fontWeight="800">Camera Translate</Text>
            <Text variant="bodySmall" color={C.textMuted}>Point at any text</Text>
          </Stack>
          <Stack backgroundColor={C.primaryBg} borderRadius={16} paddingHorizontal={12} paddingVertical={6}>
            <Text variant="label" color={C.primaryDark} fontWeight="700">{pair}</Text>
          </Stack>
        </Stack>
      </StyledPage.Header.Full>

      <StyledScrollView
        style={{ backgroundColor: C.bg, borderTopWidth: 1, borderTopColor: C.border }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, paddingTop: 16, paddingBottom: 40 }}
      >
        {/* Viewfinder */}
        <Stack height={VIEWFINDER} borderRadius={20} overflow="hidden" marginBottom={16}
          backgroundColor={C.navy} borderWidth={1} borderColor={C.border}
          alignItems="center" justifyContent="center"
        >
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
          ) : (
            <>
              {/* Corner markers */}
              {(['tl', 'tr', 'bl', 'br'] as const).map((pos) => (
                <Stack key={pos} position="absolute"
                  top={pos.startsWith('t') ? 16 : undefined}
                  bottom={pos.startsWith('b') ? 16 : undefined}
                  left={pos.endsWith('l') ? 16 : undefined}
                  right={pos.endsWith('r') ? 16 : undefined}
                  width={26} height={26}
                  style={{
                    borderColor: C.primary,
                    borderTopWidth:    pos.startsWith('t') ? 3 : 0,
                    borderBottomWidth: pos.startsWith('b') ? 3 : 0,
                    borderLeftWidth:   pos.endsWith('l') ? 3 : 0,
                    borderRightWidth:  pos.endsWith('r') ? 3 : 0,
                    borderTopLeftRadius:     pos === 'tl' ? 5 : 0,
                    borderTopRightRadius:    pos === 'tr' ? 5 : 0,
                    borderBottomLeftRadius:  pos === 'bl' ? 5 : 0,
                    borderBottomRightRadius: pos === 'br' ? 5 : 0,
                  }}
                />
              ))}
              <Stack alignItems="center" gap={14}>
                <Stack width={72} height={72} borderRadius={36} alignItems="center" justifyContent="center"
                  backgroundColor={`${C.primary}26`} borderWidth={1} borderColor={`${C.primary}55`}
                >
                  <CameraIcon size={30} strokeWidth={1.8} color={C.primary} />
                </Stack>
                <Stack alignItems="center" gap={4}>
                  <Text variant="label" color={C.textOnDark}>Point at text to translate</Text>
                  <Text variant="caption" color={C.textMuted}>Signs, menus, documents, labels</Text>
                </Stack>
              </Stack>
            </>
          )}

          {/* Live mode badge */}
          {liveMode && !loading && (
            <Stack position="absolute" top={14} alignSelf="center"
              horizontal alignItems="center" gap={6}
              backgroundColor="rgba(0,0,0,0.6)" borderRadius={20} paddingHorizontal={14} paddingVertical={7}
            >
              <Stack width={7} height={7} borderRadius={3.5} backgroundColor={C.live} />
              <Text variant="caption" color={C.white} fontWeight="700">Live mode</Text>
            </Stack>
          )}

          {/* Clear the photo */}
          {imageUri && !loading && (
            <StyledPressable position="absolute" top={12} right={12}
              width={36} height={36} borderRadius={18} alignItems="center" justifyContent="center"
              backgroundColor="rgba(0,0,0,0.55)"
              onPress={clearImage} accessibilityRole="button" accessibilityLabel="Remove photo"
            >
              <XIcon size={18} strokeWidth={2.2} color={C.white} />
            </StyledPressable>
          )}

          {loading && <ScanWave />}
        </Stack>

        {/* Gallery | Capture & Translate | Live */}
        <Stack horizontal gap={10} marginBottom={20}>
          <StyledPressable flex={1} onPress={handlePickGallery} disabled={loading}
            accessibilityRole="button" accessibilityLabel="Pick from gallery"
          >
            <StyledCard alignItems="center" justifyContent="center" paddingVertical={16} borderRadius={16}
              backgroundColor={C.bgCard} borderWidth={1} borderColor={C.border}
            >
              <ImageIcon size={20} strokeWidth={2} color={C.primary} />
              <Text variant="label" color={C.textPrimary} fontWeight="600" style={{ marginTop: 6 }}>Gallery</Text>
            </StyledCard>
          </StyledPressable>

          <StyledPressable flex={1.7} onPress={handleCapture} disabled={loading}
            accessibilityRole="button" accessibilityLabel={captureLabel}
          >
            <Stack alignItems="center" justifyContent="center" paddingVertical={16} borderRadius={16}
              backgroundColor={C.primary}
              style={{ opacity: loading ? 0.7 : 1, shadowColor: C.primary, shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 5 }}
            >
              <CameraIcon size={22} strokeWidth={2} color={C.white} />
              <Text variant="label" color={C.white} fontWeight="700" style={{ marginTop: 6 }}>{captureLabel}</Text>
            </Stack>
          </StyledPressable>

          <StyledPressable flex={1} onPress={handleLive}
            accessibilityRole="button" accessibilityState={{ selected: liveMode }} accessibilityLabel="Live mode"
          >
            <StyledCard alignItems="center" justifyContent="center" paddingVertical={16} borderRadius={16}
              backgroundColor={liveMode ? C.primaryBg : C.bgCard}
              borderWidth={1} borderColor={liveMode ? C.primary : C.border}
            >
              <ZapIcon size={20} strokeWidth={2} color={C.warning} />
              <Text variant="label" color={liveMode ? C.primary : C.textPrimary} fontWeight="600" style={{ marginTop: 6 }}>Live</Text>
            </StyledCard>
          </StyledPressable>
        </Stack>

        {/* Scan result — tap to flip between the original and the translation */}
        {result && (
          <ResultFlipCard
            result={result}
            listening={ttsLoading}
            onCopy={handleCopyResult}
            onListen={() => speak(result.translated_text, result.target_lang)}
            onSave={() => saveToPhrasebook(result)}
          />
        )}

        {/* Tips */}
        {!result && !loading && (
          <Stack>
            <SectionLabel>Tips</SectionLabel>
            <StyledCard backgroundColor={C.bgCard} borderRadius={16} paddingHorizontal={14}
              borderWidth={1} borderColor={C.border}
            >
              {TIPS.map(({ Icon, tip }, i) => {
                // Each tip gets its own accent (amber sun, purple crop, blue type…)
                const tint = getLangColors(C, i + 1)
                return (
                <Stack key={tip} horizontal alignItems="center" gap={12} paddingVertical={12}
                  borderTopWidth={i ? 1 : 0} borderTopColor={C.border}
                >
                  <Stack width={30} height={30} borderRadius={15} alignItems="center" justifyContent="center" backgroundColor={tint.bg}>
                    <Icon size={14} strokeWidth={2} color={tint.color} />
                  </Stack>
                  <Text variant="bodySmall" color={C.textSecondary}>{tip}</Text>
                </Stack>
                )
              })}
            </StyledCard>
          </Stack>
        )}
      </StyledScrollView>
    </StyledPage>
  )
}
