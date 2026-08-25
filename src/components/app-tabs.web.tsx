import { Tabs } from 'expo-router';
import React from 'react';

export default function AppTabs() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,

        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#E9ECEF',
          borderTopWidth: 1,
        },

        tabBarActiveTintColor: '#12A84F',
        tabBarInactiveTintColor: '#6B7280',

        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '700',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: '홈',
        }}
      />

      <Tabs.Screen
        name="explore"
        options={{
          title: '탐색',
        }}
      />
    </Tabs>
  );
}