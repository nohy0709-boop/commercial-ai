import { usePathname } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Platform, Pressable, Share, StyleSheet, Text } from 'react-native';

import { COLORS } from '@/constants/colors';
import { useRequireLogin } from '@/hooks/use-require-login';
import type { AttachedAnalysis } from '@/services/community';
import { createShareLink, teamErrorMessage } from '@/services/team';
import { notify } from '@/utils/dialog';

type Props = {
  analysis: AttachedAnalysis;
  label?: string;
  /** 작은 글자 버튼(카드 안에서 쓸 때) */
  compact?: boolean;
};

/**
 * 분석 결과를 링크로 공유하는 버튼.
 * 받는 사람은 로그인 없이 읽기 전용으로 볼 수 있어요.
 */
export function ShareAnalysisButton({ analysis, label = '🔗 링크로 공유', compact }: Props) {
  const pathname = usePathname();
  const { requireLogin, loginModal } = useRequireLogin(
    pathname || '/',
    '링크 공유는 로그인해야 이용 가능합니다.',
  );
  const [busy, setBusy] = useState(false);

  const run = async () => {
    setBusy(true);
    try {
      const url = await createShareLink(analysis);
      const text = `${analysis.areaName} · ${analysis.businessName} 분석 결과예요.`;

      if (Platform.OS === 'web') {
        const nav: any = typeof navigator !== 'undefined' ? navigator : null;
        if (nav?.clipboard?.writeText) {
          await nav.clipboard.writeText(url);
          notify('링크를 복사했어요', url);
        } else if (typeof window !== 'undefined') {
          window.prompt('아래 링크를 복사해서 보내주세요', url);
        }
        return;
      }

      await Share.share({ message: `${text}\n${url}` });
    } catch (e) {
      notify('공유하지 못했어요', teamErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Pressable
        style={[styles.button, compact && styles.buttonCompact]}
        onPress={() => requireLogin(run)}
        disabled={busy}
      >
        {busy ? (
          <ActivityIndicator size="small" color={COLORS.primaryDark} />
        ) : (
          <Text style={[styles.text, compact && styles.textCompact]}>{label}</Text>
        )}
      </Pressable>
      {loginModal}
    </>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 44,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonCompact: { height: 32, paddingHorizontal: 10, borderRadius: 8 },
  text: { fontSize: 14, fontWeight: '700', color: COLORS.primaryDark },
  textCompact: { fontSize: 12 },
});