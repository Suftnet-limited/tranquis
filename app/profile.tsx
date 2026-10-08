import React, { useState } from 'react'
import { Platform, TouchableOpacity, ScrollView, Switch, StyleSheet, Alert } from 'react-native'
import { router } from 'expo-router'
import { Feather } from '@expo/vector-icons'
import { StyledPage, Stack, StyledPressable } from 'fluent-styles'
import { toastService } from 'fluent-styles'
import { Text } from '../src/components/Text'
import { useColors, useIsDark } from '../src/constants'
import { useAuthStore, useThemeStore } from '../src/stores'
import { usePremium } from '../src/hooks'

function SettingRow({
  icon, label, value, onPress, danger, toggle, toggleValue, onToggle,
}: {
  icon: string; label: string; value?: string;
  onPress?: () => void; danger?: boolean;
  toggle?: boolean; toggleValue?: boolean; onToggle?: (v: boolean) => void
}) {
  const C = useColors()
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={onPress ? 0.7 : 1} disabled={toggle}>
      <Stack horizontal alignItems="center" gap={14} paddingVertical={15} paddingHorizontal={4}>
        <Stack
          width={36} height={36} borderRadius={10}
          alignItems="center" justifyContent="center"
          backgroundColor={danger ? '#FFF0F0' : C.primaryBg}
          style={{ borderWidth: 1, borderColor: danger ? '#FECACA' : `${C.primary}25` }}
        >
          <Feather name={icon as any} size={16} color={danger ? '#EF4444' : C.primary} />
        </Stack>
        <Text variant="body" color={danger ? '#EF4444' : C.textPrimary} fontWeight="600" style={{ flex: 1 }}>
          {label}
        </Text>
        {toggle ? (
          <Switch
            value={toggleValue}
            onValueChange={onToggle}
            trackColor={{ false: C.bgMuted, true: `${C.primary}70` }}
            thumbColor={toggleValue ? C.primary : C.bgCard}
          />
        ) : (
          <Stack horizontal alignItems="center" gap={6}>
            {!!value && (
              <Text variant="caption" color={C.textMuted} fontWeight="600">{value}</Text>
            )}
            {onPress && <Feather name="chevron-right" size={16} color={C.textMuted} />}
          </Stack>
        )}
      </Stack>
    </TouchableOpacity>
  )
}

function Divider() {
  const C = useColors()
  return <Stack height={1} backgroundColor={C.border} marginHorizontal={4} />
}

export default function ProfileScreen() {
  const C      = useColors()
  const isDark = useIsDark()
  const { user, logout } = useAuthStore()
  const { mode, setMode } = useThemeStore()
  const { isPremium } = usePremium()

  const darkMode = mode === 'dark'

  const handleLogout = () => {
    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: () => { logout(); router.replace('/auth/login') } },
    ])
  }

  const handleDelete = () => {
    Alert.alert(
      'Delete account',
      'This will permanently delete your account and all data. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive', onPress: async () => {
            try {
              const { deleteMe } = await import('../src/services/api').then(m => ({ deleteMe: m.authService.deleteMe }))
              await deleteMe()
              logout()
              router.replace('/auth/login')
            } catch {
              toastService.error('Error', 'Could not delete account. Please try again or contact support@tranquis.com')
            }
          }
        },
      ]
    )
  }

  return (
    <StyledPage flex={1} backgroundColor={C.bg} showStatusBar
      statusBarStyle={isDark ? 'light-content' : 'dark-content'}
      statusBarBackgroundColor={Platform.OS === 'android' ? C.bg : undefined}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, paddingBottom: 48 }}
      >
        {/* Header */}
        <Stack horizontal alignItems="center" justifyContent="space-between" marginBottom={24} marginTop={8}>
          <Text variant="title" color={C.textPrimary} fontWeight="800">Profile</Text>
        </Stack>

        {/* Avatar card */}
        <Stack
          backgroundColor={C.bgCard} borderRadius={20} padding={20} marginBottom={20}
          horizontal alignItems="center" gap={16}
          style={{ borderWidth: 1, borderColor: C.border }}
        >
          <Stack
            width={64} height={64} borderRadius={32}
            alignItems="center" justifyContent="center"
            backgroundColor={C.primaryBg}
            style={{ borderWidth: 2, borderColor: `${C.primary}40` }}
          >
            <Text style={{ fontSize: 26 }}>
              {user?.full_name?.charAt(0).toUpperCase() ?? '?'}
            </Text>
          </Stack>
          <Stack flex={1}>
            <Text variant="title" color={C.textPrimary} fontWeight="800" numberOfLines={1}>
              {user?.full_name ?? 'User'}
            </Text>
            <Text variant="bodySmall" color={C.textSecondary} numberOfLines={1}>
              {user?.email ?? ''}
            </Text>
            {isPremium && (
              <Stack
                alignSelf="flex-start" marginTop={6} horizontal alignItems="center" gap={5}
                backgroundColor={C.primaryBg} borderRadius={8}
                paddingHorizontal={8} paddingVertical={3}
                style={{ borderWidth: 1, borderColor: `${C.primary}30` }}
              >
                <Feather name="zap" size={11} color={C.primary} />
                <Text variant="caption" color={C.primary} fontWeight="700">Pro</Text>
              </Stack>
            )}
          </Stack>
        </Stack>

        {/* Upgrade prompt */}
        {!isPremium && (
          <TouchableOpacity
            onPress={() => router.push('/premium' as any)}
            activeOpacity={0.85}
            style={[styles.upgradeCard, { backgroundColor: C.primaryBg, borderColor: `${C.primary}30` }]}
          >
            <Stack horizontal alignItems="center" gap={14}>
              <Stack
                width={42} height={42} borderRadius={21}
                alignItems="center" justifyContent="center"
                backgroundColor={C.primary}
              >
                <Feather name="zap" size={20} color="#FFF" />
              </Stack>
              <Stack flex={1}>
                <Text variant="body" color={C.textPrimary} fontWeight="800">Upgrade to Pro</Text>
                <Text variant="caption" color={C.textSecondary}>7-day free trial · Cancel anytime</Text>
              </Stack>
              <Feather name="arrow-right" size={16} color={C.primary} />
            </Stack>
          </TouchableOpacity>
        )}

        {/* Account section */}
        <Stack
          backgroundColor={C.bgCard} borderRadius={18} paddingHorizontal={16} marginBottom={16}
          style={{ borderWidth: 1, borderColor: C.border }}
        >
          <SettingRow icon="user" label="Full name" value={user?.full_name ?? ''} onPress={() => {}} />
          <Divider />
          <SettingRow icon="mail" label="Email" value={user?.email ?? ''} />
          <Divider />
          <SettingRow icon="lock" label="Change password" onPress={() => router.push('/auth/forgot-password' as any)} />
        </Stack>

        {/* Preferences */}
        <Stack
          backgroundColor={C.bgCard} borderRadius={18} paddingHorizontal={16} marginBottom={16}
          style={{ borderWidth: 1, borderColor: C.border }}
        >
          <SettingRow
            icon="moon" label="Dark mode"
            toggle toggleValue={darkMode}
            onToggle={(v) => setMode(v ? 'dark' : 'light')}
          />
          <Divider />
          <SettingRow icon="globe" label="App language" value="English" onPress={() => {}} />
        </Stack>

        {/* Support */}
        <Stack
          backgroundColor={C.bgCard} borderRadius={18} paddingHorizontal={16} marginBottom={16}
          style={{ borderWidth: 1, borderColor: C.border }}
        >
          <SettingRow icon="help-circle" label="Help & Support" onPress={() => router.push('/help' as any)} />
          <Divider />
          <SettingRow icon="shield" label="Privacy Policy"  onPress={() => router.push('/privacy' as any)} />
          <Divider />
          <SettingRow icon="file-text" label="Terms of Use" onPress={() => {}} />
        </Stack>

        {/* Danger zone */}
        <Stack
          backgroundColor={C.bgCard} borderRadius={18} paddingHorizontal={16} marginBottom={16}
          style={{ borderWidth: 1, borderColor: C.border }}
        >
          <SettingRow icon="log-out"  label="Sign out"       onPress={handleLogout} danger />
          <Divider />
          <SettingRow icon="trash-2"  label="Delete account" onPress={handleDelete} danger />
        </Stack>

        <Text variant="caption" color={C.textMuted} textAlign="center" marginTop={8}>
          Tranquis v1.0.0
        </Text>
      </ScrollView>
    </StyledPage>
  )
}

const styles = StyleSheet.create({
  upgradeCard: {
    borderRadius: 18, padding: 16, marginBottom: 16, borderWidth: 1,
  },
})
