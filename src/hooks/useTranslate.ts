import { useState, useCallback } from 'react'
import { toastService } from 'fluent-styles'
import { translateService, QuotaExceededError, type TranslationResult, type QuotaStatus } from '../services/api'
import { useTranslatorStore } from '../stores'

export function useTranslate() {
  const { sourceLang, targetLang } = useTranslatorStore()
  const [loading, setLoading]      = useState(false)
  const [result, setResult]        = useState<TranslationResult | null>(null)
  const [error, setError]          = useState<string | null>(null)
  const [quota, setQuota]          = useState<QuotaStatus | null>(null)
  const [quotaExceeded, setQuotaExceeded] = useState(false)

  const translate = useCallback(async (text: string) => {
    if (!text.trim()) return
    setLoading(true)
    setError(null)
    setQuotaExceeded(false)
    try {
      const data = await translateService.translateText({
        text:        text.trim(),
        source_lang: sourceLang,
        target_lang: targetLang,
      })
      setResult(data)
      if (data.quota) setQuota(data.quota)
      return data
    } catch (err: any) {
      if (err instanceof QuotaExceededError) {
        setQuotaExceeded(true)
        setError(`You've used all ${err.limit} free translations today. Upgrade to Pro for unlimited access.`)
        toastService.error('Daily limit reached', `Upgrade to Pro for unlimited translations`)
      } else {
        const msg = err?.message || 'Translation failed'
        setError(msg)
        toastService.error('Translation failed', msg)
      }
    } finally {
      setLoading(false)
    }
  }, [sourceLang, targetLang])

  const translateImage = useCallback(async (base64: string) => {
    setLoading(true)
    setError(null)
    try {
      const data = await translateService.translateImage({
        image_base64: base64,
        target_lang:  targetLang,
      })
      // Map camera result to TranslationResult shape
      const mapped: TranslationResult = {
        id:              '',
        source_text:     data.extracted_text,
        translated_text: data.translated_text,
        source_lang:     'auto',
        target_lang:     targetLang,
        tone:            'standard',
        created_at:      new Date().toISOString(),
      }
      setResult(mapped)
      return mapped
    } catch (err: any) {
      const msg = err?.message || 'Image translation failed'
      setError(msg)
      toastService.error('Image translation failed', msg)
    } finally {
      setLoading(false)
    }
  }, [targetLang])

  const saveToPhrasebook = useCallback(async (translationId: string) => {
    if (!translationId) return
    try {
      const res = await translateService.saveToPhrasebook(translationId)
      if (res.already_exists) {
        toastService.success('Already saved')
      } else {
        toastService.success('Saved to phrasebook')
      }
    } catch {
      toastService.error('Save failed', 'Could not save to phrasebook')
    }
  }, [])

  const clear = useCallback(() => {
    setResult(null)
    setError(null)
    setQuotaExceeded(false)
  }, [])

  return { translate, translateImage, saveToPhrasebook, clear, loading, result, error, quota, quotaExceeded }
}
