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

  // Step 1 of the reset: email a code. Resolves true once the request went through
  // (the backend answers the same whether or not the email has an account).
  const requestResetCode = useCallback(async (email: string) => {
    setLoading(true)
    try {
      await authService.requestResetCode(email)
      return true
    } catch (err: any) {
      toastService.error('Could not send code', err?.message || 'Please try again')
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  // Step 2: confirm the code, then sign in with the new password. Returns null on success,
  // or the error to show next to the code field. The caller decides whether to navigate.
  const resetPassword = useCallback(async (email: string, code: string, newPassword: string) => {
    setLoading(true)
    try {
      await authService.confirmResetCode(email, code, newPassword)
      const data = await authService.login(email, newPassword)
      setTokens(data.access_token, data.refresh_token)
      const me = await authService.me()
      setUser(me as any)
      return null
    } catch (err: any) {
      return err?.message || 'Could not reset your password'
    } finally {
      setLoading(false)
    }
  }, [setTokens, setUser])

  const logout = useCallback(async () => {
    // No server-side logout endpoint — just clear local tokens
    storeLogout()
    router.replace('/auth/login')
  }, [storeLogout])

  return { login, register, requestResetCode, resetPassword, logout, loading }
}
