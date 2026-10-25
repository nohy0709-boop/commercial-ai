import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { COLORS } from '@/constants/colors';
import { useRequireLogin } from '@/hooks/use-require-login';
import type { AttachedAnalysis } from '@/services/community';
import {
    addCandidate,
    getLikeInfo,
    getMyTeams,
    teamErrorMessage,
    toggleLike,
    type Team,
} from '@/services/team';
import { notify } from '@/utils/dialog';

/** 게시글 상세 화면에서 쓰는 "좋아요"와 "팀 후보지에 담기" 버튼 */
export function PostActions({
  postId,
  analysis,
}: {
  postId: string;
  analysis: AttachedAnalysis | null;
}) {
  const router = useRouter();
  const { requireLogin, loginModal } = useRequireLogin(
    `/community/${postId}`,
    '이 기능은 로그인해야 이용 가능합니다.',
  );

  const [count, setCount] = useState(0);
  const [liked, setLiked] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [teams, setTeams] = useState<Team[] | null>(null);

  useEffect(() => {
    getLikeInfo(postId)
      .then(info => {
        setCount(info.count);
        setLiked(info.liked);
      })
      .catch(() => {});
  }, [postId]);

  const onLike = () =>
    requireLogin(async () => {
      const next = !liked;
      setLiked(next);
      setCount(c => c + (next ? 1 : -1));
      try {
        await toggleLike(postId, liked);
      } catch {
        setLiked(liked);
        setCount(c => c + (next ? -1 : 1));
        notify('처리하지 못했어요', '잠시 후 다시 시도해주세요.');
      }
    });

  const openPicker = () =>
    requireLogin(async () => {
      try {
        const list = await getMyTeams();
        if (list.length === 0) {
          notify('팀이 아직 없어요', '먼저 팀을 만들거나 초대 코드로 참여해주세요.');
          router.push('/team' as any);
          return;
        }
        setTeams(list);
        setPickerOpen(true);
      } catch (e) {
        notify('팀을 불러오지 못했어요', teamErrorMessage(e));
      }
    });

  const addTo = useCallback(
    async (team: Team) => {
      if (!analysis) return;
      try {
        await addCandidate(team.id, analysis);
        setPickerOpen(false);
        notify('담았어요', `'${team.name}' 팀 후보지에 추가했어요.`);
      } catch (e) {
        notify('담지 못했어요', teamErrorMessage(e));
      }
    },
    [analysis],
  );

  return (
    <View style={styles.row}>
      <Pressable style={[styles.button, liked && styles.buttonActive]} onPress={onLike}>
        <Text style={[styles.text, liked && styles.textActive]}>
          {liked ? '♥' : '♡'} 좋아요 {count}
        </Text>
      </Pressable>

      {analysis ? (
        <Pressable style={styles.button} onPress={openPicker}>
          <Text style={styles.text}>👥 팀 후보지에 담기</Text>
        </Pressable>
      ) : null}

      <Modal visible={pickerOpen} transparent animationType="fade" onRequestClose={() => setPickerOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setPickerOpen(false)}>
          <Pressable style={styles.sheet} onPress={() => {}}>
            <Text style={styles.sheetTitle}>어느 팀에 담을까요?</Text>
            {teams === null ? (
              <ActivityIndicator color={COLORS.primary} />
            ) : (
              teams.map(t => (
                <Pressable key={t.id} style={styles.teamRow} onPress={() => addTo(t)}>
                  <Text style={styles.teamName}>{t.name}</Text>
                  <Text style={styles.teamMeta}>{t.memberCount}명</Text>
                </Pressable>
              ))
            )}
            <Pressable style={styles.cancel} onPress={() => setPickerOpen(false)}>
              <Text style={styles.cancelText}>닫기</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      {loginModal}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 },
  button: {
    height: 38,
    paddingHorizontal: 14,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonActive: { backgroundColor: COLORS.primaryLight, borderColor: COLORS.primary },
  text: { fontSize: 13, fontWeight: '700', color: COLORS.textSecondary },
  textActive: { color: COLORS.primaryDark },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  sheet: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 20,
  },
  sheetTitle: { fontSize: 17, fontWeight: '800', color: COLORS.text, marginBottom: 12 },
  teamRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  teamName: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  teamMeta: { fontSize: 13, color: COLORS.textSecondary },
  cancel: { marginTop: 14, alignItems: 'center', paddingVertical: 8 },
  cancelText: { fontSize: 14, color: COLORS.textSecondary, fontWeight: '600' },
});