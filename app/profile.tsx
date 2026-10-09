import React from 'react'
import { Platform } from 'react-native'
import { router } from 'expo-router'
import {
  StyledPage, StyledScrollView, Stack, StyledCard, StyledPressable,
  toastService, dialogueService,
} from 'fluent-styles'
import { Text } from '../src/components/Text'
import { useColors, useIsDark, type ThemeMode, type ThemeColors } from '../src/constants'
import { useAuthStore, useThemeStore } from '../src/stores'
import { usePremium } from '../src/hooks'
import { authService } from '../src/services/api'
import { goBack } from '../src/utils'
import {
  MailIcon, LockIcon, HelpCircleIcon, ShieldIcon, LogOutIcon, TrashIcon, SparkleIcon,
  ChevronRightIcon, ChevronLeftIcon, SunIcon, MoonIcon, DeviceIcon, type IconComponent,
} from '../src/icons'

// Each row icon gets its own accent so the list doesn't read as one colour
type Tint = { color: string; bg: string }
const tints = (C: ThemeColors) => ({
  blue:   { color: C.sumColor,   bg: C.sumBg },
  amber:  { color: C.flashColor, bg: C.flashBg },
  purple: { color: C.quizColor,  bg: C.quizBg },
  teal:   { color: C.primary,    bg: C.primaryBg },
  orange: { color: C.mod4,       bg: C.mod4Bg },
  red:    { color: C.danger,     bg: C.dangerBg },
})

const APPEARANCE: { mode: ThemeMode; label: string; Icon: IconComponent; tint: keyof ReturnType<typeof tints> }[] = [
  { mode: 'light',  label: 'Light',  Icon: SunIcon,    tint: 'amber'  },
  { mode: 'dark',   label: 'Dark',   Icon: MoonIcon,   tint: 'purple' },
  { mode: 'system', label: 'System', Icon: DeviceIcon, tint: 'blue'   },
]

function SettingRow({ Icon, tint, label, value, onPress, danger, first }: {
  Icon: IconComponent; tint: Tint; label: string; value?: string
  onPress?: () => void; danger?: boolean; first?: boolean
}) {
  const C = useColors()
  const row = (
    <Stack horizontal alignItems="center" gap={14} paddingVertical={14}
      borderTopWidth={first ? 0 : 1} borderTopColor={C.border}
    >
      <Stack width={38} height={38} borderRadius={12} alignItems="center" justifyContent="center" backgroundColor={tint.bg}>
        <Icon size={17} strokeWidth={2} color={tint.color} />
      </Stack>
      <Text variant="label" color={danger ? C.danger : C.textPrimary} style={{ flex: 1 }}>{label}</Text>
      {!!value && <Text variant="caption" color={C.textMuted} numberOfLines={1} style={{ maxWidth: 170 }}>{value}</Text>}
      {onPress && <ChevronRightIcon size={16} strokeWidth={2} color={C.textMuted} />}
    </Stack>
  )
  return onPress
    ? <StyledPressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label}>{row}</StyledPressable>
    : row
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  const C = useColors()
  return (
    <Stack marginBottom={22}>
      <Text variant="overline" color={C.textMuted} style={{ letterSpacing: 1, marginBottom: 8, marginLeft: 4 }}>{title}</Text>
      <StyledCard backgroundColor={C.bgCard} borderRadius={18} paddingHorizontal={16} borderWidth={1} borderColor={C.border}>
        {children}
      </StyledCard>
    </Stack>
  )
}


export default function ProfileScreen() {
  const C      = useColors()
  const isDark = useIsDark()
  const T      = tints(C)
  const { user, logout } = useAuthStore()
  const { mode, setMode } = useThemeStore()
  const { isPremium } = usePremium()

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
    <StyledPage flex={1} backgroundColor={C.bgCard} showStatusBar
      statusBarStyle={isDark ? 'light-content' : 'dark-content'}
      statusBarBackgroundColor={Platform.OS === 'android' ? C.bgCard : undefined}
    >
      {/* Header */}
      <StyledPage.Header.Full>
        <Stack horizontal alignItems="center" gap={14} marginHorizontal={16} paddingBottom={14}>
          <StyledPressable
            width={44} height={44} borderRadius={12} alignItems="center" justifyContent="center"
            backgroundColor={C.bgInput} onPress={() => goBack()}
            accessibilityRole="button" accessibilityLabel="Go back"
          >
            <ChevronLeftIcon size={20} strokeWidth={2.4} color={C.textPrimary} />
          </StyledPressable>
          <Stack flex={1}>
            <Text variant="title" color={C.textPrimary} fontWeight="800">Profile</Text>
            <Text variant="bodySmall" color={C.textMuted}>Account &amp; settings</Text>
          </Stack>
        </Stack>
      </StyledPage.Header.Full>

      <StyledScrollView
        style={{ backgroundColor: C.bg, borderTopWidth: 1, borderTopColor: C.border }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, paddingTop: 18, paddingBottom: 40 }}
      >
        {/* Pro */}
        <StyledPressable onPress={() => router.push('/premium' as any)} accessibilityRole="button" accessibilityLabel="Tranquis Pro"
          marginBottom={24}
        >
          <Stack borderRadius={20} padding={16} overflow="hidden" backgroundColor={C.accentBg} borderWidth={1} borderColor={`${C.accent}40`}>
            <Stack position="absolute" top={-60} right={-40} width={150} height={150} borderRadius={75}
              backgroundColor={`${C.accent}18`} pointerEvents="none" />
            <Stack horizontal alignItems="center" gap={12}>
              <Stack width={44} height={44} borderRadius={14} alignItems="center" justifyContent="center" backgroundColor={C.accent}>
                <SparkleIcon size={20} strokeWidth={2} color={C.white} />
              </Stack>
              <Stack flex={1}>
                <Text variant="label" color={C.textPrimary} fontWeight="800">
                  {isPremium ? 'Tranquis Pro is active' : 'Upgrade to Tranquis Pro'}
                </Text>
                <Text variant="caption" color={C.textSecondary}>
                  {isPremium ? 'Thanks for your support' : '7-day free trial · Cancel anytime'}
                </Text>
              </Stack>
              <ChevronRightIcon size={16} strokeWidth={2.2} color={C.accent} />
            </Stack>
          </Stack>
        </StyledPressable>

        <Group title="ACCOUNT">
          <SettingRow first Icon={MailIcon} tint={T.blue} label="Email" value={user?.email ?? ''} />
          <SettingRow Icon={LockIcon} tint={T.amber} label="Change password" onPress={() => router.push('/auth/forgot-password' as any)} />
        </Group>

        <Text variant="overline" color={C.textMuted} style={{ letterSpacing: 1, marginBottom: 8, marginLeft: 4 }}>APPEARANCE</Text>
        <Stack horizontal gap={10} marginBottom={22}>
          {APPEARANCE.map(({ mode: m, label, Icon, tint }) => {
            const selected = mode === m
            return (
              <StyledPressable key={m} flex={1} onPress={() => setMode(m)}
                accessibilityRole="button" accessibilityState={{ selected }} accessibilityLabel={`${label} appearance`}
              >
                <Stack alignItems="center" gap={8} paddingVertical={14} borderRadius={16}
                  backgroundColor={C.bgCard} borderWidth={selected ? 2 : 1} borderColor={selected ? C.primary : C.border}
                >
                  <Stack width={34} height={34} borderRadius={11} alignItems="center" justifyContent="center" backgroundColor={T[tint].bg}>
                    <Icon size={17} strokeWidth={2} color={T[tint].color} />
                  </Stack>
                  <Text variant="caption" fontWeight="700" color={selected ? C.primary : C.textSecondary}>{label}</Text>
                </Stack>
              </StyledPressable>
            )
          })}
        </Stack>

        <Group title="SUPPORT">
          <SettingRow first Icon={HelpCircleIcon} tint={T.purple} label="Help & Support" onPress={() => router.push('/help' as any)} />
          <SettingRow Icon={ShieldIcon} tint={T.teal} label="Privacy Policy" onPress={() => router.push('/privacy' as any)} />
        </Group>

        <Group title="SESSION">
          <SettingRow first Icon={LogOutIcon} tint={T.orange} label="Sign out" onPress={handleLogout} />
          <SettingRow Icon={TrashIcon} tint={T.red} label="Delete account" onPress={handleDelete} danger />
        </Group>

        <Stack alignItems="center" gap={4} marginTop={4}>
          <Text variant="caption" color={C.textSecondary} fontWeight="700">Tranquis v1.0.0</Text>
          <Text variant="caption" color={C.textMuted}>Translate anything, anywhere</Text>
        </Stack>
      </StyledScrollView>
    </StyledPage>
  )
}
