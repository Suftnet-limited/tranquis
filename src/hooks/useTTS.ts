import { useCallback, useEffect, useRef, useState } from 'react'
// TODO: migrate from expo-av to expo-audio (useAudioPlayer) and expo-video once the
// API stabilises — expo-av is deprecated as of SDK 53 but migration requires
// rewriting the Audio.Sound / Audio.Recording usage throughout this file and voice.tsx.
// Pinned at ~15.1.7 (last non-deprecated SDK 53 compatible release).
import { Audio } from 'expo-av'
import * as FileSystem from 'expo-file-system'
import { toastService } from 'fluent-styles'
import { translateService } from '../services/api'
import { useTranslatorStore, type TtsVoice } from '../stores'

// One sound at a time across every screen, so two clips never overlap or fight
// over the iOS audio session
const player: { sound: Audio.Sound | null } = { sound: null }

// Clips already generated this session, keyed by voice + language + text. Replaying a
// phrase skips the network round trip, which is most of the wait.
const clipCache = new Map<string, string>()
const CACHE_MAX = 30

async function getClip(text: string, lang: string, voice: TtsVoice): Promise<string> {
  const key = `${voice}:${lang}:${text}`
  const cached = clipCache.get(key)
  if (cached && (await FileSystem.getInfoAsync(cached)).exists) return cached

  const { audio_base64, format = 'mp3' } = await translateService.textToSpeech(text, lang, voice)
  // AVPlayer can't play data: URIs reliably, so write the clip to the cache first
  const uri = `${FileSystem.cacheDirectory}tts-${Date.now()}.${format}`
  await FileSystem.writeAsStringAsync(uri, audio_base64, { encoding: FileSystem.EncodingType.Base64 })

  clipCache.set(key, uri)
  if (clipCache.size > CACHE_MAX) {
    const [oldestKey, oldestUri] = clipCache.entries().next().value as [string, string]
    clipCache.delete(oldestKey)
    FileSystem.deleteAsync(oldestUri, { idempotent: true }).catch(() => {})
  }
  return uri
}

/** Plays in the voice chosen in Profile unless `voice` overrides it (the voice preview). */
export async function playTTS(text: string, lang: string, voice?: TtsVoice) {
  if (!text.trim()) return
  try {
    const uri = await getClip(text, lang, voice ?? useTranslatorStore.getState().voice)

    // Leave recording mode, otherwise iOS routes playback to the earpiece
    await Audio.setAudioModeAsync({
      allowsRecordingIOS:      false,
      playsInSilentModeIOS:    true,
      staysActiveInBackground: false,
    })

    // Unload the previous clip before starting another
    if (player.sound) {
      const previous = player.sound
      player.sound = null
      await previous.unloadAsync().catch(() => {})
    }

    const { sound } = await Audio.Sound.createAsync({ uri })
    player.sound = sound
    await sound.playAsync()
    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.isLoaded && status.didJustFinish) {
        sound.unloadAsync().catch(() => {})
        if (player.sound === sound) player.sound = null
      }
    })
  } catch (err: any) {
    toastService.error('Playback failed', err?.message || 'Could not play audio')
  }
}

/** playTTS with a loading flag — repeat taps are ignored until the clip starts. */
export function useTTS() {
  const [loading, setLoading] = useState(false)
  const busy    = useRef(false)
  const mounted = useRef(true)
  useEffect(() => () => { mounted.current = false }, [])

  const speak = useCallback(async (text: string, lang: string) => {
    if (busy.current || !text.trim()) return
    busy.current = true
    setLoading(true)
    try {
      await playTTS(text, lang)
    } finally {
      busy.current = false
      if (mounted.current) setLoading(false)
    }
  }, [])

  return { speak, loading }
}
