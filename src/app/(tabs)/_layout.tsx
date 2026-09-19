import { Tabs } from 'expo-router';

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

          borderTopColor: '#E5E7EB',

          height: 60,
        },

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
        name="map"
        options={{
          title: '지도',
        }}
      />

      <Tabs.Screen
        name="my"
        options={{
          title: 'MY',
        }}
      />
    </Tabs>
  );
}