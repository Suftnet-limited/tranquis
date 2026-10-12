import React, { useEffect, useState } from 'react'
import { Stack, router } from 'expo-router'
import { GlobalPortalProvider, PortalManager } from 'fluent-styles'
import * as SplashScreen from 'expo-splash-screen'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { AppState, LogBox } from 'react-native'
import { usePremium } from '../src/hooks'

LogBox.ignoreLogs(['Error configuring Purchases', 'Purchase was cancelled'])

import {
  useFonts,
  PlusJakartaSans_400Regular,
  PlusJakartaSans_400Regular_Italic,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from '@expo-google-fonts/plus-jakarta-sans'
import {
  useAuthStore, useThemeStore, useTranslatorStore,
  getOnboardingSeen, ensureFreshInstall,
} from '../src/stores'
import { authService } from '../src/services/api'
import { initSentry, Sentry } from '../src/services/sentry'

initSentry()

SplashScreen.preventAutoHideAsync()

type InitialRoute = '/(tabs)' | '/onboarding' | '/auth/login'

function RootLayout() {
  const [appReady, setAppReady]         = useState(false)
  const [initialRoute, setInitialRoute] = useState<InitialRoute | null>(null)
  const [navigated, setNavigated]       = useState(false)
  const { refreshFromWeb } = usePremium()

  const [fontsLoaded, fontError] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_400Regular_Italic,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
  })

  useEffect(() => {
    const bootstrap = async () => {
      let authed = false
      try {
        await ensureFreshInstall()
        await Promise.all([
          useThemeStore.getState().hydrate(),
          useAuthStore.getState().hydrate(),
          useTranslatorStore.getState().hydrate(),
        ])

        const { accessToken } = useAuthStore.getState()
        if (accessToken) {
          try {
            const me = await authService.me()
            useAuthStore.getState().setUser(me as any)
            authed = true
          } catch {
            useAuthStore.getState().logout()
          }
        }

        if (authed) {
          setInitialRoute('/(tabs)')
        } else {
          const seenOnboarding = await getOnboardingSeen()
          setInitialRoute(seenOnboarding ? '/auth/login' : '/onboarding')
        }
      } catch (e) {
        console.error('[Bootstrap]', e)
        setInitialRoute('/auth/login')
      } finally {
        setAppReady(true)
      }
    }
    bootstrap()
  }, [])

  const isReady = appReady && (fontsLoaded || !!fontError) && initialRoute !== null

  useEffect(() => {
    if (isReady && !navigated) {
      if (initialRoute && initialRoute !== '/(tabs)') {
        router.replace(initialRoute as any)
      }
      setNavigated(true)
    }
  }, [isReady, navigated, initialRoute])

  useEffect(() => {
    if (navigated) SplashScreen.hideAsync()
  }, [navigated])

  useEffect(() => {
    const subscription = AppState.addEventListener('change', async (nextState) => {
      if (nextState === 'active') {
        try {
          await refreshFromWeb()
        } catch {
          // silent — don't interrupt app resume if this fails
        }
      }
    })
    return () => subscription.remove()
  }, [refreshFromWeb])

  if (!isReady) return null

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <GlobalPortalProvider>
        <PortalManager>
          <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
            <Stack.Screen name="(tabs)"              options={{ headerShown: false }} />
            <Stack.Screen name="onboarding"          options={{ headerShown: false, animation: 'fade' }} />
            <Stack.Screen name="auth/login"          options={{ headerShown: false, animation: 'fade' }} />
            <Stack.Screen name="auth/register"       options={{ headerShown: false, animation: 'slide_from_right' }} />
            <Stack.Screen name="lang-picker"   options={{ presentation: 'modal', headerShown: false }} />
            <Stack.Screen name="premium"             options={{ headerShown: false, animation: 'slide_from_bottom' }} />
            <Stack.Screen name="profile"             options={{ headerShown: false, animation: 'slide_from_right' }} />
            <Stack.Screen name="help"                options={{ headerShown: false, animation: 'slide_from_right' }} />
            <Stack.Screen name="privacy"             options={{ headerShown: false, animation: 'slide_from_right' }} />
            <Stack.Screen name="terms"               options={{ headerShown: false, animation: 'slide_from_right' }} />
          </Stack>
        </PortalManager>
      </GlobalPortalProvider>
    </GestureHandlerRootView>
  )
}

// Only wrap with Sentry after init — wrapping before init causes a warning.
// In dev or when DSN is absent, initSentry() is a no-op, so we skip the wrap.
const DSN = process.env.EXPO_PUBLIC_SENTRY_DSN
export default DSN && !__DEV__ ? Sentry.wrap(RootLayout) : RootLayout
