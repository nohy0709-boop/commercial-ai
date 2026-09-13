import { COLORS } from '@/constants/colors';
import { signIn } from '@/services/auth';

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

export default function LoginScreen() {
  const router =
    useRouter();

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
    loading,
    setLoading,
  ] =
    useState(false);

  const handleLogin =
    async () => {
      if (
        !email.trim() ||
        !password
      ) {
        Alert.alert(
          '확인',
          '이메일과 비밀번호를 입력해주세요.',
        );

        return;
      }

      try {
        setLoading(true);

        await signIn({
          email,
          password,
        });

        router.replace(
          '/my',
        );
      } catch (error: any) {
        console.error(
          '로그인 실패:',
          error,
        );

        let message =
          '로그인에 실패했습니다.';

        if (
          error?.message ===
          'Invalid login credentials'
        ) {
          message =
            '이메일 또는 비밀번호가 올바르지 않습니다.';
        }

        Alert.alert(
          '로그인 실패',
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
            로그인
          </Text>

          <Text
            style={
              styles.description
            }
          >
            내 창업 분석 기록과
            맞춤 설정을 확인해보세요.
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
              이메일
            </Text>

            <TextInput
              style={
                styles.input
              }
              value={email}
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
              placeholder="비밀번호를 입력해주세요"
              placeholderTextColor="#A0A0A0"
              secureTextEntry
              autoCapitalize="none"
            />
          </View>

          <TouchableOpacity
            style={[
              styles.loginButton,
              loading &&
                styles.disabledButton,
            ]}
            activeOpacity={0.8}
            disabled={loading}
            onPress={
              handleLogin
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
                  styles.loginButtonText
                }
              >
                로그인
              </Text>
            )}
          </TouchableOpacity>

          <View
            style={
              styles.signupRow
            }
          >
            <Text
              style={
                styles.signupGuide
              }
            >
              아직 계정이 없나요?
            </Text>

            <TouchableOpacity
              onPress={() =>
                router.push(
                  '/auth/signup',
                )
              }
            >
              <Text
                style={
                  styles.signupText
                }
              >
                회원가입
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
      marginBottom: 32,
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

    loginButton: {
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

    loginButtonText: {
      fontSize: 14,
      fontWeight: '900',
      color: '#111111',
    },

    signupRow: {
      marginTop: 22,
      flexDirection: 'row',
      justifyContent:
        'center',
      alignItems:
        'center',
      gap: 7,
    },

    signupGuide: {
      fontSize: 12,
      color:
        COLORS.textSecondary,
    },

    signupText: {
      fontSize: 12,
      fontWeight: '900',
      color:
        COLORS.primary,
    },
  });