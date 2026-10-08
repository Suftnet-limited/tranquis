import { useAuthStore } from '../stores'

// Override for local dev: EXPO_PUBLIC_API_URL=http://192.168.x.x:8000
export const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'https://api.careermind.app'

class ApiClient {
  private base: string
  private refreshPromise: Promise<boolean> | null = null

  constructor(base: string) {
    this.base = base
  }

  private getHeaders(extra: Record<string, string> = {}): Record<string, string> {
    const token = useAuthStore.getState().accessToken
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...extra,
    }
  }

  private refreshTokens(): Promise<boolean> {
    if (!this.refreshPromise) {
      this.refreshPromise = this.doRefresh().finally(() => {
        this.refreshPromise = null
      })
    }
    return this.refreshPromise
  }

  private async doRefresh(): Promise<boolean> {
    const { refreshToken, setTokens, logout } = useAuthStore.getState()
    if (!refreshToken) { logout(); return false }
    try {
      const res = await fetch(`${this.base}/api/v1/auth/refresh`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ refresh_token: refreshToken }),
      })
      if (!res.ok) { logout(); return false }
      const data = await res.json()
      setTokens(data.access_token, data.refresh_token)
      return true
    } catch {
      logout()
      return false
    }
  }

  async get<T>(path: string): Promise<T> {
    const res = await fetch(`${this.base}${path}`, { headers: this.getHeaders() })
    if (res.status === 401) {
      const refreshed = await this.refreshTokens()
      if (!refreshed) throw new Error('Session expired. Please sign in again.')
      const retry = await fetch(`${this.base}${path}`, { headers: this.getHeaders() })
      if (!retry.ok) throw new Error(`GET ${path} → ${retry.status}`)
      return retry.json()
    }
    if (!res.ok) throw new Error(`GET ${path} → ${res.status}`)
    return res.json()
  }

  async post<T>(path: string, body?: object): Promise<T> {
    const res = await fetch(`${this.base}${path}`, {
      method:  'POST',
      headers: this.getHeaders(),
      body:    body ? JSON.stringify(body) : undefined,
    })
    if (res.status === 401) {
      const refreshed = await this.refreshTokens()
      if (!refreshed) throw new Error('Session expired. Please sign in again.')
      const retry = await fetch(`${this.base}${path}`, {
        method:  'POST',
        headers: this.getHeaders(),
        body:    body ? JSON.stringify(body) : undefined,
      })
      if (!retry.ok) {
        const err = await retry.json().catch(() => ({}))
        throw new Error((err as any)?.detail || `POST ${path} → ${retry.status}`)
      }
      return retry.json()
    }
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error((err as any)?.detail || `POST ${path} → ${res.status}`)
    }
    return res.json()
  }

  async postForm<T>(path: string, form: FormData): Promise<T> {
    const token = useAuthStore.getState().accessToken
    const res = await fetch(`${this.base}${path}`, {
      method:  'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body:    form,
    })
    if (res.status === 401) {
      const refreshed = await this.refreshTokens()
      if (!refreshed) throw new Error('Session expired. Please sign in again.')
      const newToken = useAuthStore.getState().accessToken
      const retry = await fetch(`${this.base}${path}`, {
        method:  'POST',
        headers: newToken ? { Authorization: `Bearer ${newToken}` } : {},
        body:    form,
      })
      if (!retry.ok) {
        const err = await retry.json().catch(() => ({}))
        throw new Error((err as any)?.detail || `POST ${path} → ${retry.status}`)
      }
      return retry.json()
    }
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error((err as any)?.detail || `POST ${path} → ${res.status}`)
    }
    return res.json()
  }

  async delete(path: string): Promise<void> {
    const res = await fetch(`${this.base}${path}`, {
      method:  'DELETE',
      headers: this.getHeaders(),
    })
    if (res.status === 401) {
      const refreshed = await this.refreshTokens()
      if (!refreshed) throw new Error('Session expired. Please sign in again.')
      const retry = await fetch(`${this.base}${path}`, {
        method:  'DELETE',
        headers: this.getHeaders(),
      })
      if (!retry.ok) throw new Error(`DELETE ${path} → ${retry.status}`)
      return
    }
    if (!res.ok) throw new Error(`DELETE ${path} → ${res.status}`)
  }
}

export const api = new ApiClient(API_BASE)

// ─── Auth ─────────────────────────────────────────────────────────────────────
// The backend returns { name, email, id } — we normalise to full_name on read
// so the rest of the app (profile, avatar) doesn't need to change.
export interface MeResponse {
  id:         string
  email:      string
  name:       string   // backend field
  full_name?: string   // normalised alias added client-side
  is_admin?:  boolean
  free_minutes?: number
  email_verified?: boolean
}

export const authService = {
  login: (email: string, password: string) =>
    api.post<{ access_token: string; refresh_token: string; token_type: string }>(
      '/api/v1/auth/login', { email, password }
    ),

  // Backend expects { name, email, password } — returns tokens directly
  register: (email: string, password: string, name: string) =>
    api.post<{ access_token: string; refresh_token: string; token_type: string }>(
      '/api/v1/auth/register', { email, password, name }
    ),

  me: async (): Promise<MeResponse> => {
    const data = await api.get<MeResponse>('/api/v1/auth/me')
    // Normalise: ensure full_name mirrors name so profile screen works unchanged
    return { ...data, full_name: data.name }
  },

  deleteMe: () => api.delete('/api/v1/auth/account'),

  verifyEmail: (token: string) =>
    api.post<{ ok: boolean }>('/api/v1/auth/verify-email', { token }),

  resendVerification: (email: string) =>
    api.post<{ ok: boolean }>('/api/v1/auth/resend-verification', { email }),
}

// ─── Translation ──────────────────────────────────────────────────────────────
export interface TranslationResult {
  id:               string
  source_text:      string
  translated_text:  string
  source_lang:      string
  target_lang:      string
  tone:             string
  explanation?:     string
  alternatives?:    string[]
  created_at:       string
}

export interface TranslationHistory {
  items: TranslationResult[]
  total: number
}

export const translateService = {
  translateText: (params: {
    text:        string
    source_lang: string
    target_lang: string
    tone:        string
    explain?:    boolean
  }) => api.post<TranslationResult>('/api/v1/translate/text', params),

  translateImage: (params: {
    image_base64: string
    mime_type:    string
    target_lang:  string
    tone:         string
  }) => api.post<TranslationResult>('/api/v1/translate/image', params),

  transcribeAudio: (base64Audio: string) =>
    api.post<{ text: string }>('/api/v1/translate/transcribe', { audio_base64: base64Audio }),

  textToSpeech: (text: string, lang: string) =>
    api.post<{ audio_base64: string }>('/api/v1/translate/tts', { text, lang }),

  history: (params?: { type?: string; limit?: number; offset?: number }) => {
    const q = new URLSearchParams()
    if (params?.type)   q.set('type',   params.type)
    if (params?.limit)  q.set('limit',  String(params.limit))
    if (params?.offset) q.set('offset', String(params.offset))
    return api.get<TranslationHistory>(`/api/v1/translate/history?${q}`)
  },

  deleteHistory: (id: string) => api.delete(`/api/v1/translate/history/${id}`),

  saveToPhrasebook: (translationId: string) =>
    api.post<any>('/api/v1/phrasebook/save', { translation_id: translationId }),

  explain: (translationId: string) =>
    api.post<{ explanation: string }>(`/api/v1/translate/${translationId}/explain`),

  realtimeToken: () =>
    api.post<{ client_secret: { value: string }; expires_at: number }>('/api/v1/translate/realtime-token'),
}

// ─── Phrasebook ───────────────────────────────────────────────────────────────
export interface Phrase {
  id:             string
  source_text:    string
  translated_text: string
  phonetic?:      string
  source_lang:    string
  target_lang:    string
  category:       string
  saved_at:       string
}

export const phrasebookService = {
  list: (params?: { source_lang?: string; target_lang?: string; category?: string }) => {
    const q = new URLSearchParams()
    if (params?.source_lang) q.set('source_lang', params.source_lang)
    if (params?.target_lang) q.set('target_lang', params.target_lang)
    if (params?.category)    q.set('category',    params.category)
    return api.get<Phrase[]>(`/api/v1/phrasebook?${q}`)
  },
  delete: (id: string) => api.delete(`/api/v1/phrasebook/${id}`),
  categories: () => api.get<string[]>('/api/v1/phrasebook/categories'),
}

// ─── Quota ────────────────────────────────────────────────────────────────────
export const quotaService = {
  status: () => api.get<{
    is_pro:             boolean
    daily_used:         number
    daily_limit:        number
    resets_at:          string
  }>('/api/v1/quota/status'),
}
