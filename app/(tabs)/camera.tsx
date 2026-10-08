import React, { useState } from 'react'
import { Platform, StyleSheet, Image, ActivityIndicator } from 'react-native'
import { router } from 'expo-router'
import * as ExpoClipboard from 'expo-clipboard'
import * as ImagePicker from 'expo-image-picker'
import { StyledPage, StyledScrollView, Stack, StyledCard, StyledPressable, toastService } from 'fluent-styles'
import { Text } from '../../src/components/Text'
import { ScreenHeader } from '../../src/components/ScreenHeader'
import { ActionChip } from '../../src/components/ActionChip'
import { SectionLabel } from '../../src/components/SectionLabel'
import { useColors, useIsDark, getLang } from '../../src/constants'
import { useTranslatorStore } from '../../src/stores'
import { useTranslate, useTTS } from '../../src/hooks'
import {
  CameraIcon, ImageIcon, ZapIcon, XIcon, GlobeIcon, CopyIcon, SpeakerIcon, BookmarkIcon,
  SunIcon, CropIcon, TypeIcon, type IconComponent,
} from '../../src/icons'

const TIPS: { Icon: IconComponent; tip: string }[] = [
  { Icon: SunIcon,  tip: 'Good lighting gives better results' },
  { Icon: CropIcon, tip: 'Crop tightly around the text' },
  { Icon: TypeIcon, tip: 'Works best with printed text' },
]

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
    setBase64(asset.base64 ?? null)
    setMimeType(asset.mimeType ?? 'image/jpeg')
    if (asset.base64) await translateImage(asset.base64, asset.mimeType ?? 'image/jpeg')
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
    const res = await ImagePicker.launchImageLibraryAsync({ base64: true, quality: 0.8, mediaTypes: ['images'] })
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
      const res = await ImagePicker.launchCameraAsync({ base64: true, quality: 0.8, mediaTypes: ['images'] })
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

  const handleSaveResult = () => {
    if (!result) return
    saveToPhrasebook(result)
  }

  const handleListenResult = () => {
    if (!result) return
    speak(result.translated_text, result.target_lang)
  }

  const captureLabel = imageUri ? (base64 && !result && !loading ? 'Translate' : 'Retake') : 'Capture & Translate'

  return (
    <StyledPage flex={1} backgroundColor={C.bg} showStatusBar
      statusBarStyle={isDark ? 'light-content' : 'dark-content'}
      statusBarBackgroundColor={Platform.OS === 'android' ? C.bg : undefined}
    >
      <ScreenHeader
        title="Camera"
        variant="large"
        onBackPress={() => router.push('/(tabs)' as any)}
        rightIcon={
          <Stack horizontal alignItems="center" gap={6}
            backgroundColor={C.primaryBg} borderRadius={10} paddingHorizontal={10} paddingVertical={6}
          >
            <GlobeIcon size={13} strokeWidth={2} color={C.primary} />
            <Text variant="caption" color={C.primary} fontWeight="700">{getLang(targetLang).label}</Text>
          </Stack>
        }
      />

      <StyledScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingTop: 20, paddingBottom: 40 }}>
        {/* Viewfinder */}
        <Stack height={260} borderRadius={20} overflow="hidden" marginBottom={16}
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
          {liveMode && (
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

          {/* Processing overlay while the photo is read and translated */}
          {loading && (
            <Stack position="absolute" style={StyleSheet.absoluteFill}
              alignItems="center" justifyContent="center" backgroundColor="rgba(0,0,0,0.55)"
            >
              <ActivityIndicator size="large" color={C.primary} />
              <Text variant="caption" color={C.white} style={{ marginTop: 12 }}>Translating…</Text>
            </Stack>
          )}
        </Stack>

        {/* Gallery | Capture & Translate | Live */}
        <Stack horizontal gap={10} marginBottom={20}>
          <StyledPressable flex={1} onPress={handlePickGallery} disabled={loading}
            accessibilityRole="button" accessibilityLabel="Pick from gallery"
          >
            <StyledCard alignItems="center" justifyContent="center" paddingVertical={14} borderRadius={16}
              backgroundColor={C.bgCard} borderWidth={1} borderColor={C.border}
            >
              <ImageIcon size={18} strokeWidth={2} color={C.primary} />
              <Text variant="caption" color={C.textPrimary} fontWeight="600" style={{ marginTop: 4 }}>Gallery</Text>
            </StyledCard>
          </StyledPressable>

          <StyledPressable flex={1.6} onPress={handleCapture} disabled={loading}
            accessibilityRole="button" accessibilityLabel={captureLabel}
          >
            <Stack alignItems="center" justifyContent="center" paddingVertical={14} borderRadius={16}
              backgroundColor={C.primary}
              style={{ shadowColor: C.primary, shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 5 }}
            >
              <CameraIcon size={20} strokeWidth={2} color={C.white} />
              <Text variant="caption" color={C.white} fontWeight="700" style={{ marginTop: 4 }}>{captureLabel}</Text>
            </Stack>
          </StyledPressable>

          <StyledPressable flex={1} onPress={handleLive}
            accessibilityRole="button" accessibilityState={{ selected: liveMode }} accessibilityLabel="Live mode"
          >
            <StyledCard alignItems="center" justifyContent="center" paddingVertical={14} borderRadius={16}
              backgroundColor={liveMode ? C.primaryBg : C.bgCard}
              borderWidth={1} borderColor={liveMode ? C.primary : C.border}
            >
              <ZapIcon size={18} strokeWidth={2} color={liveMode ? C.primary : C.textSecondary} />
              <Text variant="caption" color={liveMode ? C.primary : C.textPrimary} fontWeight="600" style={{ marginTop: 4 }}>Live</Text>
            </StyledCard>
          </StyledPressable>
        </Stack>

        {/* Result */}
        {result && (
          <StyledCard backgroundColor={C.bgCard} borderRadius={20} padding={18} marginBottom={16}
            borderWidth={1} borderColor={C.border} shadow="light"
          >
            <Text variant="overline" color={C.textMuted} style={{ letterSpacing: 0.8, marginBottom: 6 }}>DETECTED TEXT</Text>
            <Stack backgroundColor={C.bgInput} borderRadius={12} padding={12} marginBottom={14}>
              <Text variant="bodySmall" color={C.textSecondary}>{result.source_text ?? '—'}</Text>
            </Stack>

            <Text variant="overline" color={C.primary} style={{ letterSpacing: 0.8, marginBottom: 6 }}>TRANSLATION</Text>
            <Text variant="title" color={C.textPrimary} style={{ lineHeight: 30, marginBottom: 14 }}>
              {result.translated_text}
            </Text>

            <Stack horizontal gap={8} flexWrap="wrap">
              <ActionChip icon={CopyIcon} label="Copy" onPress={handleCopyResult} />
              <ActionChip icon={SpeakerIcon} label="Listen" loading={ttsLoading} onPress={handleListenResult} />
              <ActionChip icon={BookmarkIcon} label="Save" onPress={handleSaveResult} />
            </Stack>
          </StyledCard>
        )}

        {/* Tips */}
        {!result && !loading && (
          <Stack>
            <SectionLabel>Tips</SectionLabel>
            <StyledCard backgroundColor={C.bgCard} borderRadius={16} paddingHorizontal={14}
              borderWidth={1} borderColor={C.border}
            >
              {TIPS.map(({ Icon, tip }, i) => (
                <Stack key={tip} horizontal alignItems="center" gap={12} paddingVertical={12}
                  borderTopWidth={i ? 1 : 0} borderTopColor={C.border}
                >
                  <Stack width={30} height={30} borderRadius={15} alignItems="center" justifyContent="center" backgroundColor={C.primaryBg}>
                    <Icon size={14} strokeWidth={2} color={C.primary} />
                  </Stack>
                  <Text variant="bodySmall" color={C.textSecondary}>{tip}</Text>
                </Stack>
              ))}
            </StyledCard>
          </Stack>
        )}
      </StyledScrollView>
    </StyledPage>
  )
}
