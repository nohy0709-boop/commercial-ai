import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from 'expo-router/react-navigation';

import { supabase } from '@/lib/supabase';

import { Stack } from 'expo-router';

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

import type {
  Session,
} from '@supabase/supabase-js';

export default function RootLayout() {
  const colorScheme =
    useColorScheme();

  const [
    session,
    setSession,
  ] = useState<Session | null>(
    null,
  );

  const [
    loading,
    setLoading,
  ] = useState(true);

  /*
   * 앱 실행 시 기존 로그인 세션 확인
   */
  useEffect(() => {
    let mounted = true;

    const initializeAuth =
      async () => {
        try {
          const {
            data,
            error,
          } =
            await supabase.auth.getSession();

          if (error) {
            throw error;
          }

          if (!mounted) {
            return;
          }

          setSession(
            data.session,
          );
        } catch (error) {
          console.error(
            '세션 확인 실패:',
            error,
          );

          if (mounted) {
            setSession(null);
          }
        } finally {
          if (mounted) {
            setLoading(false);
          }
        }
      };

    initializeAuth();

    /*
     * 로그인 / 로그아웃 상태 변경 감지
     */
    const {
      data: authListener,
    } =
      supabase.auth.onAuthStateChange(
        (_event, newSession) => {
          if (!mounted) {
            return;
          }

          setSession(
            newSession,
          );

          setLoading(false);
        },
      );

    return () => {
      mounted = false;

      authListener.subscription.unsubscribe();
    };
  }, []);

  /*
   * 인증 상태 확인이 끝나면
   * Splash Screen 종료
   */
  useEffect(() => {
    if (loading) {
      return;
    }

    SplashScreen.hideAsync().catch(
      error => {
        console.warn(
          'SplashScreen 종료 실패:',
          error,
        );
      },
    );
  }, [loading]);

  /*
   * Supabase 세션 확인 중
   */
  if (loading) {
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
        {/*
         * 비로그인 상태에서만 접근
         *
         * 여기서 login을 가장 먼저 선언해서
         * 비로그인 사용자의 기본 화면이
         * 로그인 화면이 되도록 함
         */}
        <Stack.Protected
          guard={!session}
        >
          <Stack.Screen
            name="auth/login"
          />

          <Stack.Screen
            name="auth/signup"
          />

          <Stack.Screen
            name="auth/callback"
          />
        </Stack.Protected>

        {/*
         * 로그인 상태에서만 접근
         */}
        <Stack.Protected
          guard={!!session}
        >
          <Stack.Screen
            name="(tabs)"
          />

          <Stack.Screen
            name="market-analysis"
          />

          <Stack.Screen
            name="short-term-analysis"
          />

          <Stack.Screen
            name="auth/needs-setup"
          />
        </Stack.Protected>
      </Stack>
    </ThemeProvider>
  );
}