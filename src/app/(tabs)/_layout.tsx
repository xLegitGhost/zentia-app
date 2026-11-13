import React from 'react';
import { Platform } from 'react-native';
import { Tabs } from 'expo-router';
import { LayoutDashboard, ReceiptText, User } from 'lucide-react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Platform.OS === 'web' ? 'rgba(18, 18, 20, 0.88)' : '#121214',
          borderTopColor: 'rgba(63, 63, 70, 0.55)',
          borderTopWidth: 1,
          height: 62,
          paddingBottom: 8,
          paddingTop: 8,
          ...(Platform.OS === 'web' ? ({ backdropFilter: 'blur(16px)' } as any) : {}),
        },
        tabBarActiveTintColor: '#22C55E',
        tabBarInactiveTintColor: '#71717A',
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size }) => <LayoutDashboard color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="transactions"
        options={{
          title: 'Movimientos',
          tabBarIcon: ({ color, size }) => <ReceiptText color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
