import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from 'expo-router/react-navigation';

import {
  Stack,
  useRouter,
  useSegments,
} from 'expo-router';

import * as SplashScreen from 'expo-splash-screen';

import {
  useEffect,
  useState,
} from 'react';

import {
  ActivityIndicator,
  View,
  useColorScheme,
} from 'react-native';

import { supabase } from '@/lib/supabase';
import { getCurrentSession } from '@/services/auth';

export default function RootLayout() {
  const colorScheme =
    useColorScheme();

  const router =
    useRouter();

  const segments =
    useSegments();

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [
    isAuthenticated,
    setIsAuthenticated,
  ] = useState(false);

  /**
   * 앱 시작 시 현재 Supabase 세션 확인
   */
  useEffect(() => {
    let mounted = true;

    async function checkSession() {
      try {
        const session =
          await getCurrentSession();

        if (!mounted) {
          return;
        }

        setIsAuthenticated(
          !!session,
        );
      } catch (error) {
        console.error(
          '세션 확인 오류:',
          error,
        );

        if (mounted) {
          setIsAuthenticated(
            false,
          );
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    checkSession();

    const {
      data: {
        subscription,
      },
    } =
      supabase.auth.onAuthStateChange(
        (_event, session) => {
          if (!mounted) {
            return;
          }

          setIsAuthenticated(
            !!session,
          );

          setIsLoading(false);
        },
      );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  /**
   * 로그인하지 않은 사용자가
   * 일반 앱 화면에 접근하는 것만 차단한다.
   *
   * auth 내부 화면은 callback,
   * signup, needs-setup 등의 자체 흐름을
   * 유지하도록 루트에서 건드리지 않는다.
   */
  useEffect(() => {
    if (isLoading) {
      return;
    }

    const isAuthRoute =
      segments[0] === 'auth';

    if (
      !isAuthenticated &&
      !isAuthRoute
    ) {
      router.replace(
        '/auth/login',
      );
    }
  }, [
    isLoading,
    isAuthenticated,
    segments,
    router,
  ]);

  /**
   * 세션 확인이 끝난 뒤
   * Splash Screen 숨기기
   */
  useEffect(() => {
    if (!isLoading) {
      SplashScreen.hideAsync();
    }
  }, [isLoading]);

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <ActivityIndicator
          size="large"
        />
      </View>
    );
  }

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
        <Stack.Screen
          name="(tabs)"
        />

        <Stack.Screen
          name="auth"
        />

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