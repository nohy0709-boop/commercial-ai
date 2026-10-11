import { Tabs } from 'expo-router';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        
tabBarActiveTintColor: '#EF302B',

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
      <Tabs.Screen name="index" options={{ title: '홈' }} />
      <Tabs.Screen name="map" options={{ title: '지도' }} />
      <Tabs.Screen name="my" options={{ title: 'MY' }} />

      {/* 로그인/회원가입: 하단 탭 바는 보이되, 탭 버튼으로는 나타나지 않음 */}
      <Tabs.Screen name="auth/login" options={{ href: null }} />
      <Tabs.Screen name="auth/signup" options={{ href: null }} />
    </Tabs>
  );
}