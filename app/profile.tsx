import React, { useCallback, useState } from 'react'
import { ActivityIndicator, Platform, RefreshControl, ScrollView } from 'react-native'
import { router, useFocusEffect } from 'expo-router'
import {
  StyledPage, StyledScrollView, Stack, StyledCard, StyledPressable,
  toastService, dialogueService,
} from 'fluent-styles'
import { Text } from '../src/components/Text'
import { useColors, useIsDark, type ThemeMode, type ThemeColors } from '../src/constants'
import { useAuthStore, useThemeStore, useTranslatorStore, type TtsVoice } from '../src/stores'
import { usePremium, playTTS } from '../src/hooks'
import { authService } from '../src/services/api'
import { goBack } from '../src/utils'
import { ResetPasswordSheet } from '../src/components/ResetPasswordSheet'
import {
  MailIcon, LockIcon, HelpCircleIcon, ShieldIcon, FileTextIcon, LogOutIcon, TrashIcon, SparkleIcon,
  ChevronRightIcon, ChevronLeftIcon, SunIcon, MoonIcon, DeviceIcon, SpeakerIcon, CheckIcon, type IconComponent,
} from '../src/icons'

// Each row icon gets its own accent so the list doesn't read as one colour
type Tint = { color: string; bg: string }
const tints = (C: ThemeColors, isDark = false) => ({
  blue:   { color: C.sumColor,   bg: C.sumBg },
  amber:  { color: C.flashColor, bg: C.flashBg },
  purple: { color: C.quizColor,  bg: C.quizBg },
  teal:   { color: C.primary,    bg: C.primaryBg },
  orange: { color: C.mod4,       bg: C.mod4Bg },
  red:    { color: C.danger,     bg: C.dangerBg },
  // Not in the theme; only the voice cards need a sixth hue
  pink:   { color: isDark ? '#F472B6' : '#DB2777', bg: isDark ? 'rgba(236,72,153,0.16)' : '#FDF2F8' },
})

const APPEARANCE: { mode: ThemeMode; label: string; Icon: IconComponent; tint: keyof ReturnType<typeof tints> }[] = [
  { mode: 'light',  label: 'Light',  Icon: SunIcon,    tint: 'amber'  },
  { mode: 'dark',   label: 'Dark',   Icon: MoonIcon,   tint: 'purple' },
  { mode: 'system', label: 'System', Icon: DeviceIcon, tint: 'blue'   },
]

// Every voice has its own colour, the same each time
const VOICES: { id: TtsVoice; label: string; description: string; tint: keyof ReturnType<typeof tints> }[] = [
  { id: 'nova',    label: 'Nova',    description: 'Warm & natural',         tint: 'teal'   },
  { id: 'alloy',   label: 'Alloy',   description: 'Balanced & neutral',     tint: 'blue'   },
  { id: 'echo',    label: 'Echo',    description: 'Calm & clear',           tint: 'purple' },
  { id: 'fable',   label: 'Fable',   description: 'Expressive storyteller', tint: 'amber'  },
  { id: 'onyx',    label: 'Onyx',    description: 'Deep & authoritative',   tint: 'orange' },
  { id: 'shimmer', label: 'Shimmer', description: 'Bright & gentle',        tint: 'pink'   },
]
const VOICE_SAMPLE = 'Hello, I am your translation assistant'

const VOICE_CARD_WIDTH = 148
const VOICE_CARD_GAP   = 10

function VoiceCard({ label, description, tint, selected, testing, onSelect, onTest }: {
  label: string; description: string; tint: Tint; selected: boolean; testing: boolean
  onSelect: () => void; onTest: () => void
}) {
  const C = useColors()
  return (
    <StyledPressable onPress={onSelect} width={VOICE_CARD_WIDTH}
      accessibilityRole="radio" accessibilityState={{ selected }} accessibilityLabel={`${label} voice, ${description}`}
    >
      <Stack flex={1} gap={10} padding={14} borderRadius={18}
        backgroundColor={selected ? tint.bg : C.bgCard}
        borderWidth={selected ? 2 : 1} borderColor={selected ? tint.color : C.border}
      >
        <Stack horizontal alignItems="center" justifyContent="space-between">
          <Stack width={36} height={36} borderRadius={12} alignItems="center" justifyContent="center"
            backgroundColor={selected ? tint.color : tint.bg}
          >
            <SpeakerIcon size={17} strokeWidth={2} color={selected ? C.white : tint.color} />
          </Stack>
          <Stack width={22} height={22} borderRadius={11} alignItems="center" justifyContent="center"
            borderWidth={2} borderColor={selected ? tint.color : C.border}
            backgroundColor={selected ? tint.color : 'transparent'}
          >
            {selected && <CheckIcon size={12} strokeWidth={3} color={C.white} />}
          </Stack>
        </Stack>
        <Stack flex={1}>
          <Text variant="label" color={selected ? tint.color : C.textPrimary} fontWeight="800">{label}</Text>
          <Text variant="caption" color={C.textMuted} numberOfLines={2}>{description}</Text>
        </Stack>
        <StyledPressable onPress={onTest} disabled={testing}
          flexDirection="row" alignItems="center" justifyContent="center" gap={6} height={32} borderRadius={16}
          backgroundColor={selected ? C.bgCard : tint.bg}
          accessibilityRole="button" accessibilityLabel={`Test the ${label} voice`}
        >
          {testing
            ? <ActivityIndicator size="small" color={tint.color} />
            : <Text variant="caption" color={tint.color} fontWeight="800">{'\u25B6\uFE0E'}</Text>}
          <Text variant="caption" color={tint.color} fontWeight="700">Test</Text>
        </StyledPressable>
      </Stack>
    </StyledPressable>
  )
}

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
  const T      = tints(C, isDark)
  const { user, logout } = useAuthStore()
  const { mode, setMode } = useThemeStore()
  const { voice, setVoice } = useTranslatorStore()
  const [testing, setTesting] = useState<TtsVoice | null>(null)
  const [passwordOpen, setPasswordOpen] = useState(false)
  const { isPremium, refreshFromWeb } = usePremium()
  const [refreshing, setRefreshing] = useState(false)

  // Pick up a subscription bought on the web whenever Settings is shown
  useFocusEffect(useCallback(() => { refreshFromWeb() }, [refreshFromWeb]))

  const onRefresh = async () => {
    setRefreshing(true)
    try { await refreshFromWeb() } finally { setRefreshing(false) }
  }

  const theme = isDark ? 'dark' : 'light'

  const selectVoice = (v: TtsVoice, label: string) => {
    if (v === voice) return
    setVoice(v)
    toastService.success('Voice saved', `${label} will read your translations`)
  }

  const testVoice = async (v: TtsVoice) => {
    if (testing) return
    setTesting(v)
    try {
      await playTTS(VOICE_SAMPLE, 'en', v)
    } finally {
      setTesting(null)
    }
  }

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
      message: 'Your account, translation history and phrasebook will be permanently deleted. This cannot be undone.',
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
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.primary} colors={[C.primary]} />}
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
          <SettingRow Icon={LockIcon} tint={T.amber} label="Change password" onPress={() => setPasswordOpen(true)} />
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

        <Text variant="overline" color={C.textMuted} style={{ letterSpacing: 1, marginBottom: 8, marginLeft: 4 }}>VOICE</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}
          style={{ marginHorizontal: -16, marginBottom: 22 }}
          contentContainerStyle={{ paddingHorizontal: 16, gap: VOICE_CARD_GAP }}
          snapToInterval={VOICE_CARD_WIDTH + VOICE_CARD_GAP} decelerationRate="fast"
          contentOffset={{ x: Math.max(0, VOICES.findIndex((v) => v.id === voice) - 1) * (VOICE_CARD_WIDTH + VOICE_CARD_GAP), y: 0 }}
        >
          {VOICES.map((v) => (
            <VoiceCard key={v.id} label={v.label} description={v.description} tint={T[v.tint]}
              selected={voice === v.id} testing={testing === v.id}
              onSelect={() => selectVoice(v.id, v.label)} onTest={() => testVoice(v.id)}
            />
          ))}
        </ScrollView>

        <Group title="SUPPORT">
          <SettingRow first Icon={HelpCircleIcon} tint={T.purple} label="Help & Support" onPress={() => router.push('/help' as any)} />
          <SettingRow Icon={ShieldIcon} tint={T.teal} label="Privacy Policy" onPress={() => router.push('/privacy' as any)} />
          <SettingRow Icon={FileTextIcon} tint={T.blue} label="Terms of Use" onPress={() => router.push('/terms' as any)} />
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

      <ResetPasswordSheet
        visible={passwordOpen}
        email={user?.email ?? ''}
        lockEmail
        onClose={() => setPasswordOpen(false)}
        onDone={() => { setPasswordOpen(false); toastService.success('Password changed', 'Use it next time you sign in') }}
      />
    </StyledPage>
  )
}
