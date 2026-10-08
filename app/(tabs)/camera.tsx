import React, { useState } from 'react'
import { Platform, TouchableOpacity, ScrollView, StyleSheet, Image, ActivityIndicator } from 'react-native'
import { Feather } from '@expo/vector-icons'
import * as ExpoClipboard from 'expo-clipboard'
import * as ImagePicker from 'expo-image-picker'
import { StyledPage, Stack, toastService } from 'fluent-styles'
import { Text } from '../../src/components/Text'
import { useColors, useIsDark } from '../../src/constants'
import { useTranslatorStore } from '../../src/stores'
import { useTranslate, useTTS } from '../../src/hooks'

type Mode = 'gallery' | 'capture' | 'live'

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
  const [activeMode, setActiveMode] = useState<Mode>('capture')

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
        <Stack horizontal alignItems="center" justifyContent="space-between" marginBottom={20} marginTop={8}>
          <Text variant="title" color={C.textPrimary} fontWeight="800">Camera</Text>
          <Stack
            horizontal alignItems="center" gap={6}
            backgroundColor={C.primaryBg} borderRadius={10}
            paddingHorizontal={10} paddingVertical={6}
            style={{ borderWidth: 1, borderColor: `${C.primary}30` }}
          >
            <Feather name="globe" size={13} color={C.primary} />
            <Text variant="caption" color={C.primary} fontWeight="700">{targetLang.toUpperCase()}</Text>
          </Stack>
        </Stack>

        {/* Viewfinder */}
        {imageUri ? (
          <Stack borderRadius={20} overflow="hidden" marginBottom={16}
            style={{ borderWidth: 1, borderColor: C.border }}
          >
            <Image source={{ uri: imageUri }} style={{ width: '100%', height: 260 }} resizeMode="cover" />

            {/* Live translate pill overlay */}
            <Stack
              position="absolute" top={14} alignSelf="center"
              horizontal alignItems="center" gap={6}
              backgroundColor="rgba(0,0,0,0.7)" borderRadius={20}
              paddingHorizontal={14} paddingVertical={7}
            >
              <Stack width={7} height={7} borderRadius={3.5} backgroundColor="#22C55E" />
              <Text variant="caption" color="#FFF" fontWeight="700">Live Translate</Text>
            </Stack>

            {/* Close */}
            <Stack position="absolute" top={12} right={12}
              backgroundColor="rgba(0,0,0,0.55)" borderRadius={10} padding={8}
            >
              <TouchableOpacity onPress={clearImage}>
                <Feather name="x" size={18} color="#FFF" />
              </TouchableOpacity>
            </Stack>

            {/* Processing overlay while the photo is read and translated */}
            {loading && (
              <Stack position="absolute" style={StyleSheet.absoluteFill}
                alignItems="center" justifyContent="center"
                backgroundColor="rgba(0,0,0,0.55)"
              >
                <ActivityIndicator size="large" color="#14B8A6" />
                <Text variant="caption" color="#FFF" style={{ marginTop: 12 }}>Translating…</Text>
              </Stack>
            )}
          </Stack>
        ) : (
          <Stack
            borderRadius={20} marginBottom={16} alignItems="center" justifyContent="center"
            style={[styles.viewfinder, { backgroundColor: '#0F172A', borderColor: C.border }]}
          >
            {/* Corner markers */}
            {(['tl','tr','bl','br'] as const).map((pos) => (
              <Stack key={pos} position="absolute"
                top={pos.startsWith('t') ? 16 : undefined}
                bottom={pos.startsWith('b') ? 16 : undefined}
                left={pos.endsWith('l') ? 16 : undefined}
                right={pos.endsWith('r') ? 16 : undefined}
                width={26} height={26}
                style={{
                  borderTopWidth:    pos.startsWith('t') ? 3 : 0,
                  borderBottomWidth: pos.startsWith('b') ? 3 : 0,
                  borderLeftWidth:   pos.endsWith('l') ? 3 : 0,
                  borderRightWidth:  pos.endsWith('r') ? 3 : 0,
                  borderColor: C.primary,
                  borderTopLeftRadius:     pos === 'tl' ? 5 : 0,
                  borderTopRightRadius:    pos === 'tr' ? 5 : 0,
                  borderBottomLeftRadius:  pos === 'bl' ? 5 : 0,
                  borderBottomRightRadius: pos === 'br' ? 5 : 0,
                }}
              />
            ))}

            {/* Live translate pill */}
            <Stack
              position="absolute" top={14} alignSelf="center"
              horizontal alignItems="center" gap={6}
              backgroundColor="rgba(0,0,0,0.6)" borderRadius={20}
              paddingHorizontal={14} paddingVertical={7}
            >
              <Stack width={7} height={7} borderRadius={3.5} backgroundColor="#22C55E" />
              <Text variant="caption" color="#FFF" fontWeight="700">Live Translate</Text>
            </Stack>

            <Stack alignItems="center" gap={14} marginTop={24}>
              <Stack
                width={72} height={72} borderRadius={36}
                alignItems="center" justifyContent="center"
                backgroundColor={`${C.primary}20`}
                style={{ borderWidth: 1, borderColor: `${C.primary}40` }}
              >
                <Feather name="camera" size={30} color={C.primary} />
              </Stack>
              <Stack alignItems="center" gap={4}>
                <Text variant="body" color="#94A3B8" fontWeight="600">Point at text to translate</Text>
                <Text variant="caption" color="#64748B">Signs, menus, documents, labels</Text>
              </Stack>
            </Stack>
          </Stack>
        )}

        {/* Three-button row: Gallery | Capture & Translate | Live */}
        <Stack horizontal gap={10} marginBottom={20}>
          {/* Gallery */}
          <TouchableOpacity
            style={[styles.modeBtn, { backgroundColor: C.bgCard, borderColor: C.border, flex: 1 }]}
            onPress={handlePickGallery}
            activeOpacity={0.7}
          >
            <Feather name="image" size={18} color={C.primary} />
            <Text variant="caption" color={C.textPrimary} fontWeight="600" style={{ marginTop: 4 }}>
              Gallery
            </Text>
          </TouchableOpacity>

          {/* Capture & Translate — teal, wider */}
          <TouchableOpacity
            style={[styles.modeBtn, { backgroundColor: C.primary, borderColor: C.primary, flex: 1.6 }]}
            onPress={handleCapture}
            activeOpacity={0.7}
          >
            <Feather name="camera" size={20} color="#FFF" />
            <Text variant="caption" color="#FFF" fontWeight="700" style={{ marginTop: 4 }}>
              {imageUri ? (base64 && !result && !loading ? 'Translate' : 'Retake') : 'Capture & Translate'}
            </Text>
          </TouchableOpacity>

          {/* Live */}
          <TouchableOpacity
            style={[
              styles.modeBtn,
              {
                backgroundColor: liveMode ? `${C.primary}20` : C.bgCard,
                borderColor: liveMode ? C.primary : C.border,
                flex: 1,
              },
            ]}
            onPress={handleLive}
            activeOpacity={0.7}
          >
            <Feather name="zap" size={18} color={liveMode ? C.primary : C.textSecondary} />
            <Text
              variant="caption"
              color={liveMode ? C.primary : C.textPrimary}
              fontWeight="600"
              style={{ marginTop: 4 }}
            >
              Live
            </Text>
          </TouchableOpacity>
        </Stack>

        {/* Result card */}
        {result && (
          <Stack
            backgroundColor={C.bgCard} borderRadius={20} padding={18} marginBottom={16}
            style={{ borderWidth: 1, borderColor: C.border }}
          >
            {/* Detected text */}
            <Text
              variant="caption"
              color={C.textMuted}
              fontWeight="700"
              style={{ letterSpacing: 0.8, marginBottom: 6 }}
            >
              DETECTED TEXT
            </Text>
            <Stack
              backgroundColor={C.bg} borderRadius={12} padding={12} marginBottom={14}
              style={{ borderWidth: 1, borderColor: C.border }}
            >
              <Text variant="bodySmall" color={C.textSecondary}>
                {(result as any).source_text ?? '—'}
              </Text>
            </Stack>

            {/* Translation */}
            <Text
              variant="caption"
              color={C.primary}
              fontWeight="700"
              style={{ letterSpacing: 0.8, marginBottom: 6 }}
            >
              TRANSLATION
            </Text>
            <Text variant="title" color={C.textPrimary} style={{ lineHeight: 30, marginBottom: 14 }}>
              {result.translated_text}
            </Text>

            {/* Actions */}
            <Stack horizontal gap={10}>
              <TouchableOpacity
                onPress={handleCopyResult}
                activeOpacity={0.7}
                style={[styles.chipBtn, { backgroundColor: C.bgInput, borderColor: C.border }]}
              >
                <Feather name="copy" size={13} color={C.primary} />
                <Text variant="caption" color={C.textPrimary} fontWeight="600" style={{ marginLeft: 5 }}>Copy all</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleListenResult}
                disabled={ttsLoading}
                activeOpacity={0.7}
                style={[styles.chipBtn, { backgroundColor: C.bgInput, borderColor: C.border, opacity: ttsLoading ? 0.6 : 1 }]}
              >
                {ttsLoading
                  ? <ActivityIndicator size="small" color={C.primary} style={{ transform: [{ scale: 0.7 }] }} />
                  : <Feather name="volume-2" size={13} color={C.primary} />}
                <Text variant="caption" color={C.textPrimary} fontWeight="600" style={{ marginLeft: 5 }}>Listen</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSaveResult}
                activeOpacity={0.7}
                style={[styles.chipBtn, { backgroundColor: C.bgInput, borderColor: C.border }]}
              >
                <Feather name="bookmark" size={13} color={C.primary} />
                <Text variant="caption" color={C.textPrimary} fontWeight="600" style={{ marginLeft: 5 }}>Save</Text>
              </TouchableOpacity>
            </Stack>
          </Stack>
        )}

        {/* Tips */}
        {!result && !loading && (
          <Stack gap={8}>
            <Text variant="label" color={C.textSecondary} fontWeight="700" marginBottom={4}>Tips</Text>
            {[
              { icon: 'sun',  tip: 'Good lighting gives better results' },
              { icon: 'crop', tip: 'Crop tightly around the text' },
              { icon: 'type', tip: 'Works best with printed text' },
            ].map((t) => (
              <Stack key={t.tip} horizontal alignItems="center" gap={10}
                backgroundColor={C.bgCard} borderRadius={14} padding={12}
                style={{ borderWidth: 1, borderColor: C.border }}
              >
                <Stack
                  width={30} height={30} borderRadius={15}
                  alignItems="center" justifyContent="center"
                  backgroundColor={C.primaryBg}
                >
                  <Feather name={t.icon as any} size={14} color={C.primary} />
                </Stack>
                <Text variant="bodySmall" color={C.textSecondary}>{t.tip}</Text>
              </Stack>
            ))}
          </Stack>
        )}
      </ScrollView>
    </StyledPage>
  )
}

const styles = StyleSheet.create({
  viewfinder: {
    height: 260, borderWidth: 1,
  },
  modeBtn: {
    alignItems: 'center', justifyContent: 'center',
    borderRadius: 16, paddingVertical: 14, paddingHorizontal: 10,
    borderWidth: 1,
  },
  chipBtn: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 12, borderWidth: 1,
  },
})
