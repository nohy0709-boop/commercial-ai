import {
    COLORS,
} from '@/constants/colors';

import {
    supabase,
} from '@/lib/supabase';

import {
    hasStartupNeeds,
} from '@/services/startupNeeds';

import {
    useRouter,
} from 'expo-router';

import React, {
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
  ] =
    useState(
      '이메일 인증을 확인하고 있어요...',
    );

  useEffect(() => {
    let mounted =
      true;

    const handleAuth =
      async () => {
        try {
          /**
           * Supabase가 URL의 인증 정보를
           * 처리할 시간을 조금 기다린다.
           */
          await new Promise(
            resolve =>
              setTimeout(
                resolve,
                500,
              ),
          );

          const {
            data,
          } =
            await supabase.auth.getSession();

          if (
            !mounted
          ) {
            return;
          }

          /**
           * 아직 세션이 없으면
           * auth state 변경을 기다린다.
           */
          if (
            !data.session
          ) {
            setMessage(
              '로그인 정보를 불러오고 있어요...',
            );

            return;
          }

          const alreadyHasNeeds =
            await hasStartupNeeds();

          if (
            alreadyHasNeeds
          ) {
            router.replace(
              '/',
            );

            return;
          }

          router.replace(
            '/auth/needs-setup',
          );
        } catch (error) {
          console.error(
            '인증 처리 오류:',
            error,
          );

          if (
            mounted
          ) {
            setMessage(
              '인증 처리 중 오류가 발생했습니다.',
            );
          }
        }
      };

    handleAuth();

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
            const alreadyHasNeeds =
              await hasStartupNeeds();

            if (
              alreadyHasNeeds
            ) {
              router.replace(
                '/',
              );

              return;
            }

            router.replace(
              '/auth/needs-setup',
            );
          }
        },
      );

    return () => {
      mounted =
        false;

      listener.subscription.unsubscribe();
    };
  }, [
    router,
  ]);

  return (
    <View
      style={
        styles.screen
      }
    >
      <ActivityIndicator
        size="large"
        color={
          COLORS.primary
        }
      />

      <Text
        style={
          styles.title
        }
      >
        회원가입 완료 처리 중
      </Text>

      <Text
        style={
          styles.description
        }
      >
        {
          message
        }
      </Text>
    </View>
  );
}

const styles =
  StyleSheet.create({
    screen: {
      flex: 1,

      alignItems:
        'center',

      justifyContent:
        'center',

      padding: 24,

      backgroundColor:
        COLORS.background,
    },

    title: {
      marginTop: 18,

      fontSize: 20,

      fontWeight:
        '900',

      color:
        COLORS.text,
    },

    description: {
      marginTop: 8,

      fontSize: 13,

      color:
        COLORS.textSecondary,
    },
  });