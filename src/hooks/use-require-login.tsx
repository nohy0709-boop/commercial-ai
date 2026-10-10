import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { COLORS } from '@/constants/colors';
import { isLoggedIn } from '@/services/auth';

/**
 * 로그인이 필요한 동작 앞에서 사용.
 *   const { requireLogin, loginModal } = useRequireLogin('/community');
 *   onPress={() => requireLogin(() => router.push('/community/write'))}
 *   ...
 *   {loginModal}   // JSX 맨 아래에 한 번 렌더
 */
export function useRequireLogin(
  returnPath: string,
  message = '로그인해야 이용 가능합니다.',
) {
  const router = useRouter();
  const [visible, setVisible] = useState(false);

  const openLoginModal = useCallback(() => setVisible(true), []);

  const requireLogin = useCallback(
    async (action: () => void | Promise<void>) => {
      let logged = false;
      try {
        logged = await isLoggedIn();
      } catch {
        logged = false;
      }
      if (logged) {
        await action();
      } else {
        setVisible(true);
      }
    },
    [],
  );

  const loginModal = (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={() => setVisible(false)}
    >
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>로그인이 필요해요</Text>
          <Text style={styles.message}>{message}</Text>
          <Pressable
            style={styles.primaryButton}
            onPress={() => {
              setVisible(false);
              router.push({
                pathname: '/auth/login',
                params: { redirect: returnPath },
              } as any);
            }}
          >
            <Text style={styles.primaryText}>로그인하러 가기</Text>
          </Pressable>
          <Pressable style={styles.secondaryButton} onPress={() => setVisible(false)}>
            <Text style={styles.secondaryText}>그냥 안 할래요</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );

  return { requireLogin, loginModal, openLoginModal };
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 24,
  },
  title: { fontSize: 18, fontWeight: '800', color: COLORS.text, marginBottom: 8 },
  message: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: 20,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  secondaryButton: { paddingVertical: 14, alignItems: 'center', marginTop: 4 },
  secondaryText: { color: COLORS.textSecondary, fontSize: 14, fontWeight: '600' },
});