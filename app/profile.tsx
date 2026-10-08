import React from 'react'
import { Platform } from 'react-native'
import { router } from 'expo-router'
import {
  StyledPage, StyledScrollView, Stack, StyledCard, StyledPressable,
  toastService, dialogueService,
} from 'fluent-styles'
import { Text } from '../src/components/Text'
import { ScreenHeader } from '../src/components/ScreenHeader'
import { SectionLabel } from '../src/components/SectionLabel'
import { useColors, useIsDark, type ThemeMode } from '../src/constants'
import { useAuthStore, useThemeStore } from '../src/stores'
import { usePremium } from '../src/hooks'
import { authService } from '../src/services/api'
import { goBack } from '../src/utils'
import {
  MailIcon, LockIcon, HelpCircleIcon, ShieldIcon, LogOutIcon, TrashIcon,
  SparkleIcon, ChevronRightIcon, SunIcon, MoonIcon, DeviceIcon, type IconComponent,
} from '../src/icons'

const APPEARANCE_OPTIONS: { mode: ThemeMode; label: string; Icon: IconComponent }[] = [
  { mode: 'light',  label: 'Light',  Icon: SunIcon    },
  { mode: 'dark',   label: 'Dark',   Icon: MoonIcon   },
  { mode: 'system', label: 'System', Icon: DeviceIcon },
]

function SettingRow({ Icon, label, value, onPress, danger, first }: {
  Icon:     IconComponent
  label:    string
  value?:   string
  onPress?: () => void
  danger?:  boolean
  first?:   boolean
}) {
  const C = useColors()
  const tint = danger ? C.danger : C.primary
  const row = (
    <Stack horizontal alignItems="center" gap={14} paddingVertical={14}
      borderTopWidth={first ? 0 : 1} borderTopColor={C.border}
    >
      <Stack width={36} height={36} borderRadius={10} alignItems="center" justifyContent="center"
        backgroundColor={danger ? C.dangerBg : C.primaryBg}
      >
        <Icon size={16} strokeWidth={2} color={tint} />
      </Stack>
      <Text variant="label" color={danger ? C.danger : C.textPrimary} style={{ flex: 1 }}>{label}</Text>
      {!!value && <Text variant="caption" color={C.textMuted} numberOfLines={1} style={{ maxWidth: 180 }}>{value}</Text>}
      {onPress && <ChevronRightIcon size={16} strokeWidth={2} color={C.textMuted} />}
    </Stack>
  )
  return onPress
    ? <StyledPressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label}>{row}</StyledPressable>
    : row
}

function Group({ children }: { children: React.ReactNode }) {
  const C = useColors()
  return (
    <StyledCard backgroundColor={C.bgCard} borderRadius={16} paddingHorizontal={16} marginBottom={20}
      borderWidth={1} borderColor={C.border}
    >
      {children}
    </StyledCard>
  )
}

export default function ProfileScreen() {
  const C      = useColors()
  const isDark = useIsDark()
  const { user, logout } = useAuthStore()
  const { mode, setMode } = useThemeStore()
  const { isPremium } = usePremium()

  const name = user?.full_name?.trim() || 'Your account'
  const initial = (user?.full_name?.trim().charAt(0) || 'T').toUpperCase()
  const theme = isDark ? 'dark' : 'light'

  const handleLogout = async () => {
    const ok = await dialogueService.confirm({
      title: 'Sign out?',
      message: 'You can sign back in at any time.',
      icon: '👋',
      confirmLabel: 'Sign out',
      cancelLabel: 'Cancel',
      theme,
    })
    if (!ok) return
    logout()
    router.replace('/auth/login')
  }

  const handleDelete = async () => {
    const ok = await dialogueService.confirm({
      title: 'Delete account?',
      message: 'Your account, translation history and phrasebook will be permanently deleted. '
        + 'This is the same account used for CareerMind/Interquis, so that data is deleted too. This cannot be undone.',
      icon: '⚠️',
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
      destructive: true,
      theme,
    })
    if (!ok) return
    try {
      await authService.deleteMe()
      logout()
      router.replace('/auth/login')
    } catch {
      toastService.error('Error', 'Could not delete account. Please try again or contact support@tranquis.com')
    }
  }

  return (
    <StyledPage flex={1} backgroundColor={C.bg}
      statusBarStyle={isDark ? 'light-content' : 'dark-content'}
      statusBarBackgroundColor={Platform.OS === 'android' ? C.bg : undefined}
    >
      <ScreenHeader title="Profile" onBackPress={() => goBack()} />

      <StyledScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        {/* Profile card */}
        <Stack
          backgroundColor={C.navy} borderRadius={20} padding={18} marginBottom={20}
          horizontal alignItems="center" gap={14}
          style={{ shadowColor: C.navy, shadowOpacity: 0.22, shadowRadius: 14, shadowOffset: { width: 0, height: 8 }, elevation: 6 }}
        >
          <Stack width={52} height={52} borderRadius={26} backgroundColor={C.primary} alignItems="center" justifyContent="center">
            <Text variant="title" color={C.white} fontWeight="800">{initial}</Text>
          </Stack>
          <Stack flex={1}>
            <Text variant="subtitle" color={C.white} fontWeight="700" numberOfLines={1}>{name}</Text>
            <Text variant="caption" color="rgba(255,255,255,0.6)" numberOfLines={1} style={{ marginTop: 2 }}>
              {user?.email ?? ''}
            </Text>
          </Stack>
          {isPremium && (
            <Stack horizontal alignItems="center" gap={4} backgroundColor={C.primary} borderRadius={8}
              paddingHorizontal={8} paddingVertical={3}
            >
              <SparkleIcon size={11} strokeWidth={2.2} color={C.white} />
              <Text variant="caption" color={C.white} fontWeight="700">Pro</Text>
            </Stack>
          )}
        </Stack>

        {/* Tranquis Pro */}
        <StyledPressable onPress={() => router.push('/premium' as any)} accessibilityRole="button" accessibilityLabel="Tranquis Pro">
          <StyledCard backgroundColor={C.bgCard} borderRadius={16} padding={16} marginBottom={20}
            borderWidth={1} borderColor={isPremium ? C.primary : C.border}
          >
            <Stack horizontal alignItems="center" gap={12}>
              <Stack width={40} height={40} borderRadius={12} backgroundColor={C.primaryBg} alignItems="center" justifyContent="center">
                <SparkleIcon size={18} strokeWidth={2} color={C.primary} />
              </Stack>
              <Stack flex={1}>
                <Text variant="label" color={C.textPrimary} fontWeight="700">
                  {isPremium ? 'Tranquis Pro' : 'Upgrade to Pro'}
                </Text>
                <Text variant="caption" color={C.textSecondary}>
                  {isPremium ? 'Unlimited translations — thanks for your support' : '7-day free trial · Cancel anytime'}
                </Text>
              </Stack>
              <ChevronRightIcon size={16} strokeWidth={2} color={C.textMuted} />
            </Stack>
          </StyledCard>
        </StyledPressable>

        <SectionLabel>Account</SectionLabel>
        <Group>
          <SettingRow first Icon={MailIcon} label="Email" value={user?.email ?? ''} />
          <SettingRow Icon={LockIcon} label="Change password" onPress={() => router.push('/auth/forgot-password' as any)} />
        </Group>

        <SectionLabel>Appearance</SectionLabel>
        <Stack horizontal gap={10} marginBottom={20}>
          {APPEARANCE_OPTIONS.map(({ mode: m, label, Icon }) => {
            const selected = mode === m
            return (
              <StyledPressable
                key={m} flex={1}
                backgroundColor={selected ? C.navy : C.bgCard}
                borderWidth={1} borderColor={selected ? C.navy : C.border}
                borderRadius={12} paddingVertical={14}
                alignItems="center" gap={6}
                onPress={() => setMode(m)}
                accessibilityRole="button" accessibilityState={{ selected }} accessibilityLabel={`${label} appearance`}
              >
                <Icon size={18} strokeWidth={2} color={selected ? C.white : C.textSecondary} />
                <Text variant="caption" fontWeight="700" color={selected ? C.white : C.textSecondary}>{label}</Text>
              </StyledPressable>
            )
          })}
        </Stack>

        <SectionLabel>Support</SectionLabel>
        <Group>
          <SettingRow first Icon={HelpCircleIcon} label="Help & Support" onPress={() => router.push('/help' as any)} />
          <SettingRow Icon={ShieldIcon} label="Privacy Policy" onPress={() => router.push('/privacy' as any)} />
        </Group>

        <Group>
          <SettingRow first Icon={LogOutIcon} label="Sign out" onPress={handleLogout} danger />
          <SettingRow Icon={TrashIcon} label="Delete account" onPress={handleDelete} danger />
        </Group>

        {/* App info */}
        <Stack alignItems="center" gap={6} style={{ marginTop: 8 }}>
          <Stack width={36} height={36} borderRadius={12} backgroundColor={C.primaryBg} alignItems="center" justifyContent="center">
            <SparkleIcon size={17} strokeWidth={2} color={C.primary} />
          </Stack>
          <Text variant="caption" color={C.textSecondary} fontWeight="700" style={{ marginTop: 4 }}>Tranquis v1.0.0</Text>
          <Text variant="caption" color={C.textMuted}>Translate anything, anywhere</Text>
        </Stack>
      </StyledScrollView>
    </StyledPage>
  )
}
