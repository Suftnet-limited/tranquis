import React, { useEffect } from 'react'
import { Tabs } from 'expo-router'
import { GlobeIcon, MicIcon, CameraIcon, BookIcon, ClockIcon, type IconComponent } from '../../src/icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useColors } from '../../src/constants'
import { useAuthStore, usePremiumStore } from '../../src/stores'
import { identifyUser } from '../../src/services/premiumService'

const tabIcon = (Icon: IconComponent) =>
  ({ color }: { color: string }) => <Icon size={22} strokeWidth={2} color={color} />

export default function TabsLayout() {
  const C    = useColors()
  const insets = useSafeAreaInsets()
  const user = useAuthStore((s) => s.user)

  // Tie RevenueCat to the Tranquis account
  useEffect(() => {
    if (!user?.id) return
    identifyUser(user.id)
      .then((info) => usePremiumStore.getState().setEntitlement(info.isActive, info.plan))
      .catch(() => {})
  }, [user?.id])

  return (
    <Tabs
      screenOptions={{
        headerShown:             false,
        tabBarActiveTintColor:   C.primary,
        tabBarInactiveTintColor: C.textMuted,
        tabBarStyle: {
          backgroundColor: C.bgCard,
          borderTopColor:  C.border,
          borderTopWidth:  0.5,
          height:          60 + insets.bottom,
          paddingBottom:   insets.bottom + 4,
          paddingTop:      6,
        },
        tabBarLabelStyle: {
          fontFamily: 'PlusJakartaSans_600SemiBold',
          fontSize:   10,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title:      'Translate',
          tabBarIcon: tabIcon(GlobeIcon),
        }}
      />
      <Tabs.Screen
        name="voice"
        options={{
          title:      'Voice',
          tabBarIcon: tabIcon(MicIcon),
        }}
      />
      <Tabs.Screen
        name="camera"
        options={{
          title:      'Camera',
          tabBarIcon: tabIcon(CameraIcon),
        }}
      />
      <Tabs.Screen
        name="phrasebook"
        options={{
          title:      'Phrasebook',
          tabBarIcon: tabIcon(BookIcon),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title:      'History',
          tabBarIcon: tabIcon(ClockIcon),
        }}
      />
    </Tabs>
  )
}
