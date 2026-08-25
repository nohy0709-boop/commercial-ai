import { Tabs } from 'expo-router';
import React from 'react';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,

        tabBarActiveTintColor: '#12A84F',
        tabBarInactiveTintColor: '#6B7280',

        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E9ECEF',
        },

        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '700',
        },
      }}>
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