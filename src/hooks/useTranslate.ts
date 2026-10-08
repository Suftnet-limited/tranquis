import { useState, useCallback } from 'react'
import { toastService } from 'fluent-styles'
import { translateService, type TranslationResult } from '../services/api'
import { useTranslatorStore } from '../stores'

export function useTranslate() {
  const { sourceLang, targetLang, tone } = useTranslatorStore()
  const [loading, setLoading]             = useState(false)
  const [result, setResult]               = useState<TranslationResult | null>(null)
  const [error, setError]                 = useState<string | null>(null)

  const translate = useCallback(async (text: string, explain = false) => {
    if (!text.trim()) return
    setLoading(true)
    setError(null)
    try {
      const data = await translateService.translateText({
        text: text.trim(),
        source_lang: sourceLang,
        target_lang: targetLang,
        tone,
        explain,
      })
      setResult(data)
      return data
    } catch (err: any) {
      const msg = err?.message || 'Translation failed'
      setError(msg)
      toastService.error('Translation failed', msg)
    } finally {
      setLoading(false)
    }
  }, [sourceLang, targetLang, tone])

  const translateImage = useCallback(async (base64: string, mimeType: string) => {
    setLoading(true)
    setError(null)
    try {
      const data = await translateService.translateImage({
        image_base64: base64,
        mime_type:    mimeType,
        target_lang:  targetLang,
        tone,
      })
      setResult(data)
      return data
    } catch (err: any) {
      const msg = err?.message || 'Image translation failed'
      setError(msg)
      toastService.error('Image translation failed', msg)
    } finally {
      setLoading(false)
    }
  }, [targetLang, tone])

  const saveToPhrasebook = useCallback(async (translation: TranslationResult) => {
    try {
      await translateService.saveToPhrasebook(translation.id)
      toastService.success('Saved to phrasebook')
    } catch {
      toastService.error('Save failed', 'Could not save to phrasebook')
    }
  }, [])

  const clear = useCallback(() => {
    setResult(null)
    setError(null)
  }, [])

  return { translate, translateImage, saveToPhrasebook, clear, loading, result, error }
}
