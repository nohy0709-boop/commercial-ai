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

/**
 * 개발 중 로그인 건너뛰기
 *
 * true  = 로그인하지 않아도 앱 사용 가능
 * false = 로그인 필수
 *
 * 실제 배포 전에는 반드시 false로 변경
 */
const DEV_SKIP_AUTH = true;

export default function RootLayout() {
  const colorScheme = useColorScheme();

  const router = useRouter();
  const segments = useSegments();

  const [isLoading, setIsLoading] =
    useState(true);

  const [
    isAuthenticated,
    setIsAuthenticated,
  ] = useState(false);

  /**
   * 현재 로그인 세션 확인
   *
   * 로그인 우회 중이어도 인증 코드는 그대로 유지한다.
   * 나중에 DEV_SKIP_AUTH만 false로 변경하면
   * 다시 로그인 필수 상태로 사용할 수 있다.
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
      data: { subscription },
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
   * 로그인 가드
   *
   * DEV_SKIP_AUTH가 true인 동안에는
   * 로그인하지 않아도 일반 화면에 접근할 수 있다.
   */
  useEffect(() => {
    if (
      isLoading ||
      DEV_SKIP_AUTH
    ) {
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

  useEffect(() => {
    if (isLoading) {
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
  }, [isLoading]);

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent:
            'center',
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