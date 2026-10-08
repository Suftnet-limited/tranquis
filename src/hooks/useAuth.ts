import { useState, useCallback } from 'react'
import { router } from 'expo-router'
import { toastService } from 'fluent-styles'
import { useAuthStore } from '../stores'
import { authService } from '../services/api'

export function useAuth() {
  const { setTokens, setUser, logout: storeLogout } = useAuthStore()
  const [loading, setLoading] = useState(false)

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true)
    try {
      const data = await authService.login(email, password)
      setTokens(data.access_token, data.refresh_token)
      const me = await authService.me()
      setUser(me as any)
      router.replace('/(tabs)')
    } catch (err: any) {
      toastService.error('Sign in failed', err?.message || 'Check your email and password')
    } finally {
      setLoading(false)
    }
  }, [setTokens, setUser])

  const register = useCallback(async (email: string, password: string, fullName: string) => {
    setLoading(true)
    try {
      // Backend returns tokens on register — no second login needed
      const data = await authService.register(email, password, fullName)
      setTokens(data.access_token, data.refresh_token)
      const me = await authService.me()
      setUser(me as any)
      router.replace('/(tabs)')
    } catch (err: any) {
      toastService.error('Registration failed', err?.message)
    } finally {
      setLoading(false)
    }
  }, [setTokens, setUser])

  const logout = useCallback(async () => {
    // No server-side logout endpoint — just clear local tokens
    storeLogout()
    router.replace('/auth/login')
  }, [storeLogout])

  return { login, register, logout, loading }
}
