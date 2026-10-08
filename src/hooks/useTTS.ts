import { Audio } from 'expo-av'
import * as FileSystem from 'expo-file-system'
import { toastService } from 'fluent-styles'
import { translateService } from '../services/api'

let current: Audio.Sound | null = null

export async function playTTS(text: string, lang: string) {
  if (!text.trim()) return
  try {
    const { audio_base64, format = 'mp3' } = await translateService.textToSpeech(text, lang)
    // AVPlayer can't play data: URIs reliably, so write the clip to the cache first
    const uri = `${FileSystem.cacheDirectory}tts-${Date.now()}.${format}`
    await FileSystem.writeAsStringAsync(uri, audio_base64, { encoding: FileSystem.EncodingType.Base64 })

    // Leave recording mode, otherwise iOS routes playback to the earpiece
    await Audio.setAudioModeAsync({ allowsRecordingIOS: false, playsInSilentModeIOS: true })

    await current?.unloadAsync().catch(() => {})
    const { sound } = await Audio.Sound.createAsync({ uri }, { shouldPlay: true })
    current = sound
    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.isLoaded && status.didJustFinish) {
        sound.unloadAsync().catch(() => {})
        FileSystem.deleteAsync(uri, { idempotent: true }).catch(() => {})
        if (current === sound) current = null
      }
    })
  } catch (err: any) {
    toastService.error('Playback failed', err?.message || 'Could not play audio')
  }
}
