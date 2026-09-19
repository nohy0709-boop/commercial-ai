import { COLORS } from '@/constants/colors';
import { supabase } from '@/lib/supabase';
import { signUp } from '@/services/auth';

import { useRouter } from 'expo-router';

import { useState } from 'react';

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
  const router = useRouter();

  const [nickname, setNickname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');

  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const [
    waitingForEmailVerification,
    setWaitingForEmailVerification,
  ] = useState(false);

  /*
   * 인증 메일을 보낸 이메일 주소를 따로 저장
   */
  const [
    verificationEmail,
    setVerificationEmail,
  ] = useState('');

  const validateForm = () => {
    if (!nickname.trim()) {
      Alert.alert(
        '확인',
        '닉네임을 입력해주세요.',
      );
      return false;
    }

    if (!email.trim()) {
      Alert.alert(
        '확인',
        '이메일을 입력해주세요.',
      );
      return false;
    }

    if (!email.includes('@')) {
      Alert.alert(
        '확인',
        '올바른 이메일 주소를 입력해주세요.',
      );
      return false;
    }

    if (password.length < 6) {
      Alert.alert(
        '확인',
        '비밀번호는 6자 이상 입력해주세요.',
      );
      return false;
    }

    if (password !== passwordConfirm) {
      Alert.alert(
        '확인',
        '비밀번호가 일치하지 않습니다.',
      );
      return false;
    }

    return true;
  };

  /*
   * 회원가입
   */
  const handleSignup = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      const trimmedEmail =
        email.trim().toLowerCase();

      const result = await signUp({
        email: trimmedEmail,
        password,
        nickname: nickname.trim(),
      });

      /*
       * 이메일 인증이 필요한 경우
       */
      if (!result.session) {
        setVerificationEmail(
          trimmedEmail,
        );

        setWaitingForEmailVerification(
          true,
        );

        return;
      }

      /*
       * 이메일 인증 없이
       * 바로 로그인된 경우
       */
      router.replace('/');
    } catch (error: any) {
      console.error(
        '회원가입 실패:',
        error,
      );

      const errorMessage =
        String(
          error?.message ?? '',
        ).toLowerCase();

      let message =
        '회원가입에 실패했습니다. 잠시 후 다시 시도해주세요.';

      if (
        errorMessage.includes(
          'already registered',
        ) ||
        errorMessage.includes(
          'already been registered',
        ) ||
        errorMessage.includes(
          'user already exists',
        )
      ) {
        message =
          '이미 가입 요청된 이메일입니다.\n\n이메일 인증을 완료했는지 확인해주세요.';
      }

      if (
        errorMessage.includes(
          'rate limit',
        ) ||
        errorMessage.includes(
          'too many requests',
        )
      ) {
        message =
          '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.';
      }

      Alert.alert(
        '회원가입 실패',
        message,
      );
    } finally {
      setLoading(false);
    }
  };

  /*
   * 인증 메일 다시 보내기
   */
  const handleResendEmail = async () => {
    if (
      resending ||
      !verificationEmail
    ) {
      return;
    }

    try {
      setResending(true);

      const {
        error,
      } = await supabase.auth.resend({
        type: 'signup',
        email: verificationEmail,
      });

      if (error) {
        throw error;
      }

      Alert.alert(
        '인증 메일 재전송',
        '인증 메일을 다시 보냈습니다.\n받은편지함과 스팸함을 확인해주세요.',
      );
    } catch (error: any) {
      console.error(
        '인증 메일 재전송 실패:',
        error,
      );

      const errorMessage =
        String(
          error?.message ?? '',
        ).toLowerCase();

      let message =
        '인증 메일을 다시 보내지 못했습니다. 잠시 후 다시 시도해주세요.';

      if (
        errorMessage.includes(
          'rate limit',
        ) ||
        errorMessage.includes(
          'too many requests',
        )
      ) {
        message =
          '인증 메일을 너무 자주 요청했습니다.\n잠시 후 다시 시도해주세요.';
      }

      Alert.alert(
        '재전송 실패',
        message,
      );
    } finally {
      setResending(false);
    }
  };

  /*
   * 이메일 주소를 잘못 입력한 경우
   */
  const handleChangeEmail = () => {
    /*
     * 기존 이메일은 이미 가입 요청된 상태이므로
     * 새 이메일을 입력하도록 이메일 칸만 비움.
     *
     * 닉네임/비밀번호는 유지해서
     * 다시 입력하는 번거로움을 줄임.
     */
    setEmail('');

    setWaitingForEmailVerification(
      false,
    );
  };

  /*
   * 이메일 인증 대기 화면
   */
  if (
    waitingForEmailVerification
  ) {
    return (
      <View
        style={
          styles.verificationScreen
        }
      >
        <View
          style={
            styles.verificationCard
          }
        >
          <View
            style={
              styles.checkCircle
            }
          >
            <Text
              style={
                styles.checkText
              }
            >
              ✓
            </Text>
          </View>

          <Text
            style={
              styles.verificationTitle
            }
          >
            이메일을 확인해주세요
          </Text>

          <Text
            style={
              styles.verificationDescription
            }
          >
            회원가입을 완료하려면{'\n'}
            이메일 인증이 필요합니다.
          </Text>

          <View
            style={
              styles.emailBox
            }
          >
            <Text
              style={
                styles.emailBoxText
              }
            >
              {verificationEmail}
            </Text>
          </View>

          <Text
            style={
              styles.verificationGuide
            }
          >
            위 이메일로 발송된 인증 메일을
            확인한 뒤 인증을 완료해주세요.
          </Text>

          {/* 로그인으로 이동 */}
          <TouchableOpacity
            style={
              styles.loginButton
            }
            activeOpacity={0.8}
            onPress={() =>
              router.replace(
                '/auth/login',
              )
            }
          >
            <Text
              style={
                styles.loginButtonText
              }
            >
              인증 완료 후 로그인하기
            </Text>
          </TouchableOpacity>

          {/* 인증 메일 재전송 */}
          <TouchableOpacity
            style={[
              styles.resendButton,
              resending &&
                styles.disabledButton,
            ]}
            activeOpacity={0.8}
            disabled={resending}
            onPress={
              handleResendEmail
            }
          >
            {resending ? (
              <ActivityIndicator
                size="small"
                color={
                  COLORS.primary
                }
              />
            ) : (
              <Text
                style={
                  styles.resendButtonText
                }
              >
                인증 메일 다시 보내기
              </Text>
            )}
          </TouchableOpacity>

          <Text
            style={
              styles.spamGuide
            }
          >
            메일이 보이지 않으면
            스팸함도 확인해주세요.
          </Text>

          {/* 이메일 주소 변경 */}
          <View
            style={
              styles.changeEmailArea
            }
          >
            <Text
              style={
                styles.changeEmailGuide
              }
            >
              이메일 주소를 잘못 입력했나요?
            </Text>

            <TouchableOpacity
              onPress={
                handleChangeEmail
              }
            >
              <Text
                style={
                  styles.changeEmailText
                }
              >
                이메일 주소 다시 확인하기
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  /*
   * 회원가입 입력 화면
   */
  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={
        Platform.OS === 'ios'
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
          style={styles.header}
        >
          <Text
            style={styles.logo}
          >
            START-UP
          </Text>

          <Text
            style={styles.title}
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
          style={styles.form}
        >
          <View
            style={styles.field}
          >
            <Text
              style={styles.label}
            >
              닉네임
            </Text>

            <TextInput
              style={styles.input}
              value={nickname}
              onChangeText={
                setNickname
              }
              placeholder="사용할 닉네임"
              placeholderTextColor="#A0A0A0"
              maxLength={20}
            />
          </View>

          <View
            style={styles.field}
          >
            <Text
              style={styles.label}
            >
              이메일
            </Text>

            <TextInput
              style={styles.input}
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
            style={styles.field}
          >
            <Text
              style={styles.label}
            >
              비밀번호
            </Text>

            <TextInput
              style={styles.input}
              value={password}
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
            style={styles.field}
          >
            <Text
              style={styles.label}
            >
              비밀번호 확인
            </Text>

            <TextInput
              style={styles.input}
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

const styles = StyleSheet.create({
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
    justifyContent: 'center',
    padding: 24,
    paddingVertical: 60,
  },

  header: {
    marginBottom: 30,
  },

  logo: {
    fontSize: 11,
    fontWeight: '900',
    color: COLORS.primary,
    marginBottom: 8,
    letterSpacing: 1.4,
  },

  title: {
    fontSize: 32,
    fontWeight: '900',
    color: COLORS.text,
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
    color: COLORS.text,
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
    color: COLORS.text,
  },

  signupButton: {
    minHeight: 52,
    marginTop: 4,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
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
    justifyContent: 'center',
    alignItems: 'center',
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
    color: COLORS.primary,
  },

  verificationScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor:
      COLORS.background,
  },

  verificationCard: {
    width: '100%',
    maxWidth: 500,
    padding: 28,
    borderRadius: 22,
    borderWidth: 1,
    borderColor:
      COLORS.border,
    backgroundColor:
      COLORS.surface,
    alignItems: 'center',
  },

  checkCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor:
      '#E9F8EC',
    marginBottom: 20,
  },

  checkText: {
    fontSize: 30,
    fontWeight: '900',
    color: COLORS.primary,
  },

  verificationTitle: {
    fontSize: 23,
    fontWeight: '900',
    color: COLORS.text,
    textAlign: 'center',
  },

  verificationDescription: {
    marginTop: 10,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    color:
      COLORS.textSecondary,
  },

  emailBox: {
    width: '100%',
    marginTop: 22,
    paddingVertical: 14,
    paddingHorizontal: 15,
    borderRadius: 13,
    backgroundColor:
      '#F4F5F4',
    alignItems: 'center',
  },

  emailBoxText: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.text,
  },

  verificationGuide: {
    marginTop: 14,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    color:
      COLORS.textSecondary,
  },

  loginButton: {
    width: '100%',
    minHeight: 52,
    marginTop: 24,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor:
      COLORS.neonLime,
  },

  loginButtonText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#111111',
  },

  resendButton: {
    width: '100%',
    minHeight: 48,
    marginTop: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor:
      COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor:
      COLORS.surface,
  },

  resendButtonText: {
    fontSize: 13,
    fontWeight: '900',
    color: COLORS.primary,
  },

  spamGuide: {
    marginTop: 10,
    fontSize: 11,
    textAlign: 'center',
    color:
      COLORS.textSecondary,
  },

  changeEmailArea: {
    marginTop: 22,
    alignItems: 'center',
  },

  changeEmailGuide: {
    fontSize: 11,
    color:
      COLORS.textSecondary,
  },

  changeEmailText: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: '900',
    color: COLORS.primary,
  },
});