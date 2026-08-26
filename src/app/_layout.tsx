import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from '@react-navigation/native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();

  // 레이아웃이 화면에 뜨는 순간, 스플래시(로고) 화면을 닫아줍니다.
  // 이게 없으면 preventAutoHideAsync() 때문에 로고에서 영원히 멈춰있게 됩니다.
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <ThemeProvider
      value={
        colorScheme === 'dark'
          ? DarkTheme
          : DefaultTheme
      }
    >
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="market-analysis"
        />
        <Stack.Screen
          name="short-term-analysis"
        />
      </Stack>
    </ThemeProvider>
  );
}