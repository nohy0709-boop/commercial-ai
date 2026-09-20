import {
  COLORS,
} from '@/constants/colors';

import {
  supabase,
} from '@/lib/supabase';

import {
  useRouter,
} from 'expo-router';

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
  const router =
    useRouter();

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

        /**
         * 이메일 인증 과정에서
         * Supabase 세션이 자동 생성될 수 있으므로
         * 사용자가 직접 로그인하도록 세션을 종료한다.
         */
        await supabase.auth.signOut();

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
     * callback 화면 진입 시
     * 이미 인증 세션이 생겼는지 확인한다.
     */
    const checkSession =
      async () => {
        try {
          const {
            data,
          } =
            await supabase.auth.getSession();

          if (
            !mounted
          ) {
            return;
          }

          if (
            data.session
          ) {
            await moveToLogin();
          }
        } catch (error) {
          console.error(
            '인증 상태 확인 오류:',
            error,
          );

          if (mounted) {
            setMessage(
              '인증 상태를 확인하지 못했습니다.',
            );
          }
        }
      };

    checkSession();

    /**
     * 사용자가 이메일 인증 링크를 눌러
     * Supabase 세션이 생성되는 것을 감지한다.
     */
    const {
      data: listener,
    } =
      supabase.auth.onAuthStateChange(
        async (
          event,
          session,
        ) => {
          if (
            !mounted ||
            !session
          ) {
            return;
          }

          if (
            event ===
              'SIGNED_IN' ||
            event ===
              'INITIAL_SESSION'
          ) {
            await moveToLogin();
          }
        },
      );

    return () => {
      mounted = false;

      listener.subscription.unsubscribe();
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
        style={styles.description}
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
      justifyContent: 'center',
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