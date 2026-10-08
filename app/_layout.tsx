import React, { useEffect, useState } from 'react'
import { Stack, router } from 'expo-router'
import { GlobalPortalProvider, PortalManager } from 'fluent-styles'
import * as SplashScreen from 'expo-splash-screen'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { LogBox } from 'react-native'

LogBox.ignoreLogs(['Error configuring Purchases', 'Purchase was cancelled'])

import {
  useFonts,
  PlusJakartaSans_400Regular,
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

SplashScreen.preventAutoHideAsync()

type InitialRoute = '/(tabs)' | '/onboarding' | '/auth/login'

export default function RootLayout() {
  const [appReady, setAppReady]         = useState(false)
  const [initialRoute, setInitialRoute] = useState<InitialRoute | null>(null)
  const [navigated, setNavigated]       = useState(false)

  const [fontsLoaded, fontError] = useFonts({
    PlusJakartaSans_400Regular,
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
            <Stack.Screen name="auth/forgot-password" options={{ presentation: 'modal', headerShown: false }} />
            <Stack.Screen name="lang-picker"   options={{ presentation: 'modal', headerShown: false }} />
            <Stack.Screen name="premium"             options={{ headerShown: false, animation: 'slide_from_bottom' }} />
            <Stack.Screen name="profile"             options={{ headerShown: false, animation: 'slide_from_right' }} />
            <Stack.Screen name="help"                options={{ headerShown: false, animation: 'slide_from_right' }} />
            <Stack.Screen name="privacy"             options={{ headerShown: false, animation: 'slide_from_right' }} />
          </Stack>
        </PortalManager>
      </GlobalPortalProvider>
    </GestureHandlerRootView>
  )
}
