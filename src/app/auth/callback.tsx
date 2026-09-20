import { COLORS } from '@/constants/colors';
import { supabase } from '@/lib/supabase';

import { useRouter } from 'expo-router';

import * as Linking from 'expo-linking';

import {
  useEffect,
  useState,
} from 'react';

import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
} from 'react-native';

export default function AuthCallbackScreen() {
  const router = useRouter();

  const [
    message,
    setMessage,
  ] = useState(
    '메일함에서 인증 링크를 눌러주세요.',
  );

  useEffect(() => {
    let mounted = true;
    let moving = false;

    const moveToLogin =
      async () => {
        if (
          !mounted ||
          moving
        ) {
          return;
        }

        moving = true;

        setMessage(
          '이메일 인증이 완료되었습니다. 로그인 화면으로 이동합니다.',
        );

        try {
          /*
           * 이메일 인증 과정에서 생성된 세션을 종료한다.
           * 이후 사용자가 직접 로그인하도록 한다.
           */
          await supabase.auth.signOut();
        } catch (error) {
          console.error(
            '인증 후 로그아웃 오류:',
            error,
          );
        }

        if (!mounted) {
          return;
        }

        setTimeout(() => {
          if (mounted) {
            router.replace(
              '/auth/login',
            );
          }
        }, 1000);
      };

    /**
     * Supabase가 돌려준 URL 처리
     *
     * PKCE 방식:
     * commercialai://auth/callback?code=...
     */
    const handleAuthUrl =
      async (
        url: string | null,
      ) => {
        if (
          !url ||
          !mounted ||
          moving
        ) {
          return;
        }

        try {
          console.log(
            '인증 callback URL:',
            url,
          );

          const parsed =
            Linking.parse(url);

          const code =
            typeof parsed.queryParams
              ?.code === 'string'
              ? parsed.queryParams.code
              : null;

          if (code) {
            setMessage(
              '이메일 인증을 확인하고 있어요...',
            );

            const {
              data,
              error,
            } =
              await supabase.auth
                .exchangeCodeForSession(
                  code,
                );

            if (error) {
              throw error;
            }

            if (data.session) {
              await moveToLogin();
            }

            return;
          }

          /**
           * PKCE code가 없는 경우에도
           * 이미 세션이 생성되어 있을 수 있으므로 확인한다.
           */
          const {
            data,
            error,
          } =
            await supabase.auth
              .getSession();

          if (error) {
            throw error;
          }

          if (data.session) {
            await moveToLogin();
          }
        } catch (error: any) {
          console.error(
            '이메일 인증 callback 처리 실패:',
            error,
          );

          if (mounted) {
            setMessage(
              error?.message ??
                '이메일 인증 정보를 처리하지 못했습니다.',
            );
          }
        }
      };

    /**
     * 앱이 이메일 링크로 처음 실행된 경우
     */
    Linking.getInitialURL()
      .then(handleAuthUrl)
      .catch(error => {
        console.error(
          '초기 인증 URL 확인 실패:',
          error,
        );
      });

    /**
     * 앱이 이미 실행 중인 상태에서
     * 이메일 링크가 들어온 경우
     */
    const linkingSubscription =
      Linking.addEventListener(
        'url',
        event => {
          handleAuthUrl(
            event.url,
          );
        },
      );

    /**
     * 이미 세션이 존재하는 경우도 처리
     */
    const checkExistingSession =
      async () => {
        try {
          const {
            data,
          } =
            await supabase.auth
              .getSession();

          if (
            mounted &&
            data.session
          ) {
            await moveToLogin();
          }
        } catch (error) {
          console.error(
            '기존 세션 확인 오류:',
            error,
          );
        }
      };

    checkExistingSession();

    return () => {
      mounted = false;

      linkingSubscription.remove();
    };
  }, [router]);

  return (
    <View
      style={styles.screen}
    >
      <ActivityIndicator
        size="large"
        color={COLORS.primary}
      />

      <Text
        style={styles.title}
      >
        이메일 인증을 기다리고 있어요
      </Text>

      <Text
        style={
          styles.description
        }
      >
        {message}
      </Text>

      <Text
        style={styles.guide}
      >
        가입한 이메일의 인증 링크를 누르면
        {'\n'}
        인증 완료 후 로그인 화면으로 이동합니다.
      </Text>
    </View>
  );
}

const styles =
  StyleSheet.create({
    screen: {
      flex: 1,
      alignItems: 'center',
      justifyContent:
        'center',
      padding: 24,
      backgroundColor:
        COLORS.background,
    },

    title: {
      marginTop: 18,
      fontSize: 20,
      fontWeight: '900',
      color: COLORS.text,
      textAlign: 'center',
    },

    description: {
      marginTop: 10,
      fontSize: 14,
      lineHeight: 21,
      color:
        COLORS.textSecondary,
      textAlign: 'center',
    },

    guide: {
      marginTop: 24,
      fontSize: 12,
      lineHeight: 19,
      color:
        COLORS.textSecondary,
      textAlign: 'center',
    },
  });