import * as Sentry from '@sentry/react-native'

// Set EXPO_PUBLIC_SENTRY_DSN (eas.json or .env) to turn crash reporting on.
// Without it, and in development, nothing is sent.
const DSN = process.env.EXPO_PUBLIC_SENTRY_DSN

// Never send what people translate, say or photograph
const SCRUBBED = ['text', 'source_text', 'translated_text', 'audio_base64', 'image_base64', 'explanation', 'password', 'new_password']

function scrub<T>(value: T): T {
  if (!value || typeof value !== 'object') return value
  if (Array.isArray(value)) return value.map(scrub) as T
  return Object.fromEntries(Object.entries(value).map(([k, v]) =>
    [k, SCRUBBED.includes(k) ? '[Filtered]' : scrub(v)],
  )) as T
}

export function initSentry() {
  if (!DSN || __DEV__) return
  Sentry.init({
    dsn: DSN,
    sendDefaultPii: false,
    tracesSampleRate: 0.1,
    // Console messages can echo user text; network breadcrumbs keep only URL and status
    beforeBreadcrumb: (crumb) => (crumb.category === 'console' ? null : crumb),
    beforeSend: (event) => {
      if (event.extra) event.extra = scrub(event.extra)
      if (event.contexts) event.contexts = scrub(event.contexts)
      if (event.request) delete event.request.data
      return event
    },
  })
}

export { Sentry }
