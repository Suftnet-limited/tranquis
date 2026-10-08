import React, { useEffect } from 'react'
import { Tabs } from 'expo-router'
import { Feather } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useColors } from '../../src/constants'
import { useAuthStore, usePremiumStore } from '../../src/stores'
import { identifyUser } from '../../src/services/premiumService'

const Icon = ({ name, color }: { name: keyof typeof Feather.glyphMap; color: string }) => (
  <Feather name={name} size={22} color={color} />
)

export default function TabsLayout() {
  const C      = useColors()
  const insets = useSafeAreaInsets()
  const user   = useAuthStore((s) => s.user)

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
          borderTopWidth:  0.1,
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
          tabBarIcon: ({ color }) => <Icon name="type" color={color} />,
        }}
      />
      <Tabs.Screen
        name="voice"
        options={{
          title:      'Voice',
          tabBarIcon: ({ color }) => <Icon name="mic" color={color} />,
        }}
      />
      <Tabs.Screen
        name="camera"
        options={{
          title:      'Camera',
          tabBarIcon: ({ color }) => <Icon name="camera" color={color} />,
        }}
      />
      <Tabs.Screen
        name="phrasebook"
        options={{
          title:      'Phrasebook',
          tabBarIcon: ({ color }) => <Icon name="book" color={color} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title:      'History',
          tabBarIcon: ({ color }) => <Icon name="clock" color={color} />,
        }}
      />
    </Tabs>
  )
}
