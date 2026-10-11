import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    RefreshControl,
    ScrollView,
    Share,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AnalysisSummary } from '@/components/AnalysisSummary';
import { ShareAnalysisButton } from '@/components/ShareAnalysisButton';
import { COLORS } from '@/constants/colors';
import { getFavoriteAnalyses, type AnalysisHistoryItem } from '@/services/analysisHistory';
import { getCurrentUser } from '@/services/auth';
import { formatRelativeDate } from '@/services/community';
import {
    addCandidate,
    addNote,
    deleteNote,
    deleteTeam,
    favoriteToAttached,
    getCandidates,
    getNotes,
    getTeamDetail,
    leaveTeam,
    removeCandidate,
    removeMember,
    setVote,
    teamErrorMessage,
    type Candidate,
    type CandidateNote,
    type TeamDetail,
} from '@/services/team';
import { confirmDialog, notify } from '@/utils/dialog';

export default function TeamDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [team, setTeam] = useState<TeamDetail | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [myId, setMyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [openId, setOpenId] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, CandidateNote[]>>({});
  const [noteText, setNoteText] = useState('');

  const [pickerOpen, setPickerOpen] = useState(false);
  const [favorites, setFavorites] = useState<AnalysisHistoryItem[]>([]);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const [t, c, user] = await Promise.all([
        getTeamDetail(id),
        getCandidates(id),
        getCurrentUser().catch(() => null),
      ]);
      setTeam(t);
      setCandidates(c);
      setMyId(user?.id ?? null);
    } catch {
      setTeam(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const isOwner = !!team && team.ownerId === myId;

  // 찬성-반대 점수가 높은 순서로 보여줘요
  const sorted = [...candidates].sort(
    (a, b) => b.up - b.down - (a.up - a.down) || b.createdAt.localeCompare(a.createdAt),
  );

  /* ----- 투표 ----- */
  const onVote = async (c: Candidate, vote: 1 | -1) => {
    try {
      await setVote(c.id, vote, c.myVote);
      setCandidates(prev =>
        prev.map(x => {
          if (x.id !== c.id) return x;
          let up = x.up;
          let down = x.down;
          if (x.myVote === 1) up -= 1;
          if (x.myVote === -1) down -= 1;
          const next = x.myVote === vote ? 0 : vote;
          if (next === 1) up += 1;
          if (next === -1) down += 1;
          return { ...x, up, down, myVote: next as 1 | -1 | 0 };
        }),
      );
    } catch (e) {
      notify('투표하지 못했어요', teamErrorMessage(e));
    }
  };

  /* ----- 메모 ----- */
  const toggleNotes = async (c: Candidate) => {
    if (openId === c.id) {
      setOpenId(null);
      return;
    }
    setOpenId(c.id);
    setNoteText('');
    try {
      const list = await getNotes(c.id);
      setNotes(prev => ({ ...prev, [c.id]: list }));
    } catch {
      setNotes(prev => ({ ...prev, [c.id]: [] }));
    }
  };

  const onAddNote = async (c: Candidate) => {
    const text = noteText.trim();
    if (!text) return;
    try {
      await addNote(c.id, text);
      setNoteText('');
      const list = await getNotes(c.id);
      setNotes(prev => ({ ...prev, [c.id]: list }));
      setCandidates(prev => prev.map(x => (x.id === c.id ? { ...x, noteCount: list.length } : x)));
    } catch (e) {
      notify('메모를 남기지 못했어요', teamErrorMessage(e));
    }
  };

  const onDeleteNote = async (c: Candidate, noteId: string) => {
    try {
      await deleteNote(noteId);
      const list = (notes[c.id] ?? []).filter(n => n.id !== noteId);
      setNotes(prev => ({ ...prev, [c.id]: list }));
      setCandidates(prev => prev.map(x => (x.id === c.id ? { ...x, noteCount: list.length } : x)));
    } catch {
      notify('삭제하지 못했어요', '잠시 후 다시 시도해주세요.');
    }
  };

  /* ----- 후보지 추가/삭제 ----- */
  const openPicker = async () => {
    try {
      setFavorites(await getFavoriteAnalyses());
    } catch {
      setFavorites([]);
    }
    setPickerOpen(true);
  };

  const onPick = async (item: AnalysisHistoryItem) => {
    if (!id) return;
    try {
      await addCandidate(id, favoriteToAttached(item));
      setPickerOpen(false);
      await load();
    } catch (e) {
      notify('추가하지 못했어요', teamErrorMessage(e));
    }
  };

  const onRemoveCandidate = async (c: Candidate) => {
    const ok = await confirmDialog('후보지 삭제', '이 후보지를 팀 목록에서 뺄까요?', '삭제', true);
    if (!ok) return;
    try {
      await removeCandidate(c.id);
      setCandidates(prev => prev.filter(x => x.id !== c.id));
    } catch {
      notify('삭제하지 못했어요', '잠시 후 다시 시도해주세요.');
    }
  };

  /* ----- 팀 ----- */
  const onInvite = async () => {
    if (!team) return;
    const message = `'${team.name}' 팀에 초대해요!\n앱의 [팀 후보지]에서 초대 코드 ${team.inviteCode} 를 입력해주세요.`;
    if (Platform.OS === 'web') {
      notify('초대 코드', `${team.inviteCode}\n\n이 코드를 팀원에게 알려주세요.`);
      return;
    }
    try {
      await Share.share({ message });
    } catch {
      /* 닫은 경우 */
    }
  };

  const onLeave = async () => {
    if (!team || !id) return;
    const ok = isOwner
      ? await confirmDialog('팀 삭제', '팀을 삭제하면 후보지·투표·메모가 모두 사라져요. 삭제할까요?', '삭제', true)
      : await confirmDialog('팀 나가기', `'${team.name}' 팀에서 나갈까요?`, '나가기', true);
    if (!ok) return;
    try {
      if (isOwner) await deleteTeam(id);
      else await leaveTeam(id);
      router.replace('/team' as any);
    } catch {
      notify('처리하지 못했어요', '잠시 후 다시 시도해주세요.');
    }
  };

  const onKick = async (userId: string, nickname: string) => {
    if (!id) return;
    const ok = await confirmDialog('팀원 내보내기', `${nickname}님을 팀에서 내보낼까요?`, '내보내기', true);
    if (!ok) return;
    try {
      await removeMember(id, userId);
      await load();
    } catch {
      notify('처리하지 못했어요', '잠시 후 다시 시도해주세요.');
    }
  };

  /* ----- 화면 ----- */
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.appBar}>
        <Pressable onPress={() => (router.canGoBack() ? router.back() : router.replace('/team' as any))} hitSlop={12}>
          <Text style={styles.back}>‹</Text>
        </Pressable>
        <Text style={styles.appBarTitle} numberOfLines={1}>
          {team?.name ?? '팀'}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={COLORS.primary} />
        </View>
      ) : !team ? (
        <View style={styles.center}>
          <Text style={styles.muted}>팀을 찾을 수 없거나 속해 있지 않아요.</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.body}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                load();
              }}
            />
          }
        >
          {/* 초대 코드 */}
          <View style={styles.inviteBox}>
            <View style={{ flex: 1 }}>
              <Text style={styles.inviteLabel}>초대 코드</Text>
              <Text style={styles.inviteCode}>{team.inviteCode}</Text>
            </View>
            <Pressable style={styles.inviteButton} onPress={onInvite}>
              <Text style={styles.inviteButtonText}>팀원 초대</Text>
            </Pressable>
          </View>

          {/* 팀원 */}
          <Text style={styles.sectionTitle}>팀원 {team.members.length}명</Text>
          <View style={styles.memberRow}>
            {team.members.map(m => (
              <Pressable
                key={m.userId}
                style={styles.memberChip}
                onLongPress={
                  isOwner && m.userId !== myId ? () => onKick(m.userId, m.nickname) : undefined
                }
              >
                <Text style={styles.memberText}>
                  {m.role === 'owner' ? '👑 ' : ''}
                  {m.nickname}
                  {m.userId === myId ? ' (나)' : ''}
                </Text>
              </Pressable>
            ))}
          </View>
          {isOwner && team.members.length > 1 ? (
            <Text style={styles.hint}>팀원을 길게 누르면 내보낼 수 있어요.</Text>
          ) : null}

          {/* 후보지 */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>후보지 {sorted.length}곳</Text>
            <Pressable style={styles.addButton} onPress={openPicker}>
              <Text style={styles.addButtonText}>＋ 후보지 추가</Text>
            </Pressable>
          </View>

          {sorted.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyTitle}>아직 후보지가 없어요</Text>
              <Text style={styles.muted}>
                즐겨찾기한 분석을 추가하거나, 커뮤니티 글의 분석을 팀에 담아보세요.
              </Text>
            </View>
          ) : (
            sorted.map((c, index) => {
              const open = openId === c.id;
              const list = notes[c.id] ?? [];
              const canRemove = c.addedBy === myId || isOwner;
              return (
                <View key={c.id} style={styles.card}>
                  <View style={styles.cardTop}>
                    <Text style={styles.rankText}>{index + 1}위</Text>
                    <Text style={styles.addedBy}>
                      {c.addedByNickname} · {formatRelativeDate(c.createdAt)}
                    </Text>
                    {canRemove ? (
                      <Pressable onPress={() => onRemoveCandidate(c)} hitSlop={10}>
                        <Text style={styles.remove}>삭제</Text>
                      </Pressable>
                    ) : null}
                  </View>

                  <AnalysisSummary analysis={c.analysis} />

                  <View style={styles.actionRow}>
                    <Pressable
                      style={[styles.voteButton, c.myVote === 1 && styles.voteUp]}
                      onPress={() => onVote(c, 1)}
                    >
                      <Text style={[styles.voteText, c.myVote === 1 && styles.voteTextOn]}>👍 {c.up}</Text>
                    </Pressable>
                    <Pressable
                      style={[styles.voteButton, c.myVote === -1 && styles.voteDown]}
                      onPress={() => onVote(c, -1)}
                    >
                      <Text style={[styles.voteText, c.myVote === -1 && styles.voteTextOn]}>👎 {c.down}</Text>
                    </Pressable>
                    <Pressable style={styles.voteButton} onPress={() => toggleNotes(c)}>
                      <Text style={styles.voteText}>💬 메모 {c.noteCount}</Text>
                    </Pressable>
                    <ShareAnalysisButton analysis={c.analysis} label="🔗 공유" compact />
                  </View>

                  {open ? (
                    <View style={styles.noteBox}>
                      {list.length === 0 ? (
                        <Text style={styles.muted}>첫 메모를 남겨보세요.</Text>
                      ) : (
                        list.map(n => (
                          <View key={n.id} style={styles.noteRow}>
                            <View style={{ flex: 1 }}>
                              <Text style={styles.noteMeta}>
                                {n.nickname} · {formatRelativeDate(n.createdAt)}
                              </Text>
                              <Text style={styles.noteContent}>{n.content}</Text>
                            </View>
                            {n.userId === myId ? (
                              <Pressable onPress={() => onDeleteNote(c, n.id)} hitSlop={10}>
                                <Text style={styles.remove}>삭제</Text>
                              </Pressable>
                            ) : null}
                          </View>
                        ))
                      )}
                      <View style={styles.noteInputRow}>
                        <TextInput
                          style={styles.noteInput}
                          value={noteText}
                          onChangeText={setNoteText}
                          placeholder="의견이나 메모를 적어주세요"
                          placeholderTextColor={COLORS.textSecondary}
                          maxLength={300}
                          onSubmitEditing={() => onAddNote(c)}
                        />
                        <Pressable
                          style={[styles.sendButton, !noteText.trim() && { opacity: 0.5 }]}
                          onPress={() => onAddNote(c)}
                          disabled={!noteText.trim()}
                        >
                          <Text style={styles.sendText}>등록</Text>
                        </Pressable>
                      </View>
                    </View>
                  ) : null}
                </View>
              );
            })
          )}

          <Pressable style={styles.leaveButton} onPress={onLeave}>
            <Text style={styles.leaveText}>{isOwner ? '팀 삭제' : '팀 나가기'}</Text>
          </Pressable>
        </ScrollView>
      )}

      {/* 즐겨찾기에서 고르기 */}
      <Modal visible={pickerOpen} transparent animationType="slide" onRequestClose={() => setPickerOpen(false)}>
        <KeyboardAvoidingView style={styles.sheetBackdrop} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <Pressable style={{ flex: 1 }} onPress={() => setPickerOpen(false)} />
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>즐겨찾기에서 후보지 추가</Text>
            <ScrollView style={{ maxHeight: 360 }}>
              {favorites.length === 0 ? (
                <Text style={[styles.muted, { paddingVertical: 20 }]}>
                  즐겨찾기한 분석이 없어요. 분석 결과에서 ★를 눌러 즐겨찾기를 먼저 만들어주세요.
                </Text>
              ) : (
                favorites.map(f => (
                  <Pressable key={f.id} style={styles.pickRow} onPress={() => onPick(f)}>
                    <Text style={styles.pickTitle}>{f.title}</Text>
                    <Text style={styles.muted}>{f.businessName}</Text>
                  </Pressable>
                ))
              )}
            </ScrollView>
            <Pressable style={styles.closeRow} onPress={() => setPickerOpen(false)}>
              <Text style={styles.closeText}>닫기</Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  appBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 12,
    gap: 12,
  },
  back: { fontSize: 30, color: COLORS.text, lineHeight: 30 },
  appBarTitle: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '800', color: COLORS.text },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28 },
  body: { padding: 18, gap: 10, paddingBottom: 48 },
  muted: { fontSize: 13, lineHeight: 20, color: COLORS.textSecondary },
  hint: { fontSize: 12, color: COLORS.textSecondary },

  inviteBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    borderRadius: 16,
    padding: 16,
  },
  inviteLabel: { fontSize: 12, fontWeight: '700', color: COLORS.primaryDark },
  inviteCode: { fontSize: 26, fontWeight: '900', letterSpacing: 4, color: COLORS.text, marginTop: 2 },
  inviteButton: {
    height: 40,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inviteButtonText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  sectionTitle: { fontSize: 16, fontWeight: '800', color: COLORS.text, marginTop: 8 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  memberRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  memberChip: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  memberText: { fontSize: 13, color: COLORS.text, fontWeight: '600' },
  addButton: {
    height: 34,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: { color: '#fff', fontSize: 13, fontWeight: '700' },

  emptyBox: { alignItems: 'center', paddingVertical: 30, gap: 6 },
  emptyTitle: { fontSize: 16, fontWeight: '800', color: COLORS.text },

  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    gap: 12,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rankText: { fontSize: 13, fontWeight: '900', color: COLORS.primary },
  addedBy: { flex: 1, fontSize: 12, color: COLORS.textSecondary },
  remove: { fontSize: 12, color: COLORS.danger, fontWeight: '600' },

  actionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' },
  voteButton: {
    height: 32,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  voteUp: { backgroundColor: COLORS.primaryLight, borderColor: COLORS.primary },
  voteDown: { backgroundColor: '#FEF2F2', borderColor: COLORS.danger },
  voteText: { fontSize: 12, fontWeight: '700', color: COLORS.textSecondary },
  voteTextOn: { color: COLORS.text },

  noteBox: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 12,
    gap: 10,
  },
  noteRow: { flexDirection: 'row', gap: 10 },
  noteMeta: { fontSize: 11, color: COLORS.textSecondary },
  noteContent: { fontSize: 14, lineHeight: 20, color: COLORS.text, marginTop: 2 },
  noteInputRow: { flexDirection: 'row', gap: 8 },
  noteInput: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    fontSize: 14,
    color: COLORS.text,
  },
  sendButton: {
    width: 56,
    height: 40,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendText: { color: '#fff', fontWeight: '700', fontSize: 13 },

  leaveButton: { alignItems: 'center', paddingVertical: 18, marginTop: 10 },
  leaveText: { color: COLORS.danger, fontSize: 14, fontWeight: '700' },

  sheetBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 30,
  },
  sheetTitle: { fontSize: 17, fontWeight: '800', color: COLORS.text, marginBottom: 8 },
  pickRow: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: 3,
  },
  pickTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  closeRow: { alignItems: 'center', paddingTop: 16 },
  closeText: { fontSize: 14, color: COLORS.textSecondary, fontWeight: '600' },
});