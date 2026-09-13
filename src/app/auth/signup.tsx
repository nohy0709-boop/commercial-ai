import { COLORS } from '@/constants/colors';
import { signUp } from '@/services/auth';

import { useRouter } from 'expo-router';

import React, {
    useState,
} from 'react';

import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

export default function SignupScreen() {
  const router =
    useRouter();

  const [
    nickname,
    setNickname,
  ] =
    useState('');

  const [
    email,
    setEmail,
  ] =
    useState('');

  const [
    password,
    setPassword,
  ] =
    useState('');

  const [
    passwordConfirm,
    setPasswordConfirm,
  ] =
    useState('');

  const [
    loading,
    setLoading,
  ] =
    useState(false);

  const validateForm =
    () => {
      if (
        !nickname.trim()
      ) {
        Alert.alert(
          '확인',
          '닉네임을 입력해주세요.',
        );

        return false;
      }

      if (
        !email.trim()
      ) {
        Alert.alert(
          '확인',
          '이메일을 입력해주세요.',
        );

        return false;
      }

      if (
        !email.includes('@')
      ) {
        Alert.alert(
          '확인',
          '올바른 이메일 주소를 입력해주세요.',
        );

        return false;
      }

      if (
        password.length < 6
      ) {
        Alert.alert(
          '확인',
          '비밀번호는 6자 이상 입력해주세요.',
        );

        return false;
      }

      if (
        password !==
        passwordConfirm
      ) {
        Alert.alert(
          '확인',
          '비밀번호가 일치하지 않습니다.',
        );

        return false;
      }

      return true;
    };

  const handleSignup =
    async () => {
      if (
        !validateForm()
      ) {
        return;
      }

      try {
        setLoading(true);

        const result =
          await signUp({
            email,
            password,
            nickname,
          });

        if (
          !result.session
        ) {
          Alert.alert(
            '회원가입 완료',
            '이메일 인증이 필요한 계정입니다. 메일함을 확인한 후 로그인해주세요.',
            [
              {
                text: '확인',
                onPress: () =>
                  router.replace(
                    '/auth/login',
                  ),
              },
            ],
          );

          return;
        }

        router.replace(
          '/my',
        );
      } catch (error: any) {
        console.error(
          '회원가입 실패:',
          error,
        );

        let message =
          '회원가입에 실패했습니다.';

        if (
          error?.message?.includes(
            'already registered',
          )
        ) {
          message =
            '이미 가입된 이메일입니다.';
        }

        Alert.alert(
          '회원가입 실패',
          message,
        );
      } finally {
        setLoading(false);
      }
    };

  return (
    <KeyboardAvoidingView
      style={
        styles.screen
      }
      behavior={
        Platform.OS ===
        'ios'
          ? 'padding'
          : undefined
      }
    >
      <ScrollView
        contentContainerStyle={
          styles.container
        }
        keyboardShouldPersistTaps="handled"
      >
        <View
          style={
            styles.header
          }
        >
          <Text
            style={
              styles.logo
            }
          >
            START-UP
          </Text>

          <Text
            style={
              styles.title
            }
          >
            회원가입
          </Text>

          <Text
            style={
              styles.description
            }
          >
            계정을 만들고 나만의
            창업 분석 정보를 관리해보세요.
          </Text>
        </View>

        <View
          style={
            styles.form
          }
        >
          <View
            style={
              styles.field
            }
          >
            <Text
              style={
                styles.label
              }
            >
              닉네임
            </Text>

            <TextInput
              style={
                styles.input
              }
              value={
                nickname
              }
              onChangeText={
                setNickname
              }
              placeholder="사용할 닉네임"
              placeholderTextColor="#A0A0A0"
              maxLength={20}
            />
          </View>

          <View
            style={
              styles.field
            }
          >
            <Text
              style={
                styles.label
              }
            >
              이메일
            </Text>

            <TextInput
              style={
                styles.input
              }
              value={
                email
              }
              onChangeText={
                setEmail
              }
              placeholder="example@email.com"
              placeholderTextColor="#A0A0A0"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View
            style={
              styles.field
            }
          >
            <Text
              style={
                styles.label
              }
            >
              비밀번호
            </Text>

            <TextInput
              style={
                styles.input
              }
              value={
                password
              }
              onChangeText={
                setPassword
              }
              placeholder="6자 이상 입력해주세요"
              placeholderTextColor="#A0A0A0"
              secureTextEntry
              autoCapitalize="none"
            />
          </View>

          <View
            style={
              styles.field
            }
          >
            <Text
              style={
                styles.label
              }
            >
              비밀번호 확인
            </Text>

            <TextInput
              style={
                styles.input
              }
              value={
                passwordConfirm
              }
              onChangeText={
                setPasswordConfirm
              }
              placeholder="비밀번호를 다시 입력해주세요"
              placeholderTextColor="#A0A0A0"
              secureTextEntry
              autoCapitalize="none"
            />
          </View>

          <TouchableOpacity
            style={[
              styles.signupButton,
              loading &&
                styles.disabledButton,
            ]}
            activeOpacity={0.8}
            disabled={loading}
            onPress={
              handleSignup
            }
          >
            {loading ? (
              <ActivityIndicator
                size="small"
                color="#111111"
              />
            ) : (
              <Text
                style={
                  styles.signupButtonText
                }
              >
                회원가입
              </Text>
            )}
          </TouchableOpacity>

          <View
            style={
              styles.loginRow
            }
          >
            <Text
              style={
                styles.loginGuide
              }
            >
              이미 계정이 있나요?
            </Text>

            <TouchableOpacity
              onPress={() =>
                router.replace(
                  '/auth/login',
                )
              }
            >
              <Text
                style={
                  styles.loginText
                }
              >
                로그인
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles =
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor:
        COLORS.background,
    },

    container: {
      flexGrow: 1,
      width: '100%',
      maxWidth: 500,
      alignSelf: 'center',
      justifyContent:
        'center',
      padding: 24,
      paddingVertical: 60,
    },

    header: {
      marginBottom: 30,
    },

    logo: {
      fontSize: 11,
      fontWeight: '900',
      color:
        COLORS.primary,
      marginBottom: 8,
      letterSpacing: 1.4,
    },

    title: {
      fontSize: 32,
      fontWeight: '900',
      color:
        COLORS.text,
    },

    description: {
      marginTop: 8,
      fontSize: 14,
      lineHeight: 21,
      color:
        COLORS.textSecondary,
    },

    form: {
      padding: 22,
      borderRadius: 22,
      backgroundColor:
        COLORS.surface,
      borderWidth: 1,
      borderColor:
        COLORS.border,
    },

    field: {
      marginBottom: 18,
    },

    label: {
      marginBottom: 8,
      fontSize: 12,
      fontWeight: '800',
      color:
        COLORS.text,
    },

    input: {
      width: '100%',
      minHeight: 50,
      paddingHorizontal: 15,
      borderWidth: 1,
      borderColor:
        COLORS.border,
      borderRadius: 13,
      backgroundColor:
        '#FFFFFF',
      fontSize: 14,
      color:
        COLORS.text,
    },

    signupButton: {
      minHeight: 52,
      marginTop: 4,
      borderRadius: 14,
      alignItems:
        'center',
      justifyContent:
        'center',
      backgroundColor:
        COLORS.neonLime,
    },

    disabledButton: {
      opacity: 0.6,
    },

    signupButtonText: {
      fontSize: 14,
      fontWeight: '900',
      color: '#111111',
    },

    loginRow: {
      marginTop: 22,
      flexDirection: 'row',
      justifyContent:
        'center',
      alignItems:
        'center',
      gap: 7,
    },

    loginGuide: {
      fontSize: 12,
      color:
        COLORS.textSecondary,
    },

    loginText: {
      fontSize: 12,
      fontWeight: '900',
      color:
        COLORS.primary,
    },
  });