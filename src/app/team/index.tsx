import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { COLORS } from '@/constants/colors';
import { isLoggedIn } from '@/services/auth';
import { createTeam, getMyTeams, joinTeam, teamErrorMessage, type Team } from '@/services/team';
import { notify } from '@/utils/dialog';

type Mode = 'create' | 'join' | null;

export default function TeamListScreen() {
  const router = useRouter();
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [mode, setMode] = useState<Mode>(null);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const ok = await isLoggedIn();
      setLoggedIn(ok);
      setTeams(ok ? await getMyTeams() : []);
    } catch {
      setTeams([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const closeForm = () => {
    setMode(null);
    setInput('');
  };

  const submit = async () => {
    const value = input.trim();
    if (!value || busy) return;
    setBusy(true);
    try {
      const teamId = mode === 'create' ? await createTeam(value) : await joinTeam(value);
      closeForm();
      router.push({ pathname: '/team/detail', params: { id: teamId } } as any);
    } catch (e) {
      notify(mode === 'create' ? '팀을 만들지 못했어요' : '참여하지 못했어요', teamErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.appBar}>
        <Pressable onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} hitSlop={12}>
          <Text style={styles.back}>‹</Text>
        </Pressable>
        <Text style={styles.appBarTitle}>팀 후보지</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={COLORS.primary} />
        </View>
      ) : loggedIn === false ? (
        <View style={styles.center}>
          <Text style={styles.emptyTitle}>로그인이 필요해요</Text>
          <Text style={styles.emptyText}>
            팀을 만들고 후보지를 함께 비교하려면 먼저 로그인해주세요.
          </Text>
          <Pressable
            style={styles.primaryButton}
            onPress={() =>
              router.push({ pathname: '/auth/login', params: { redirect: '/team' } } as any)
            }
          >
            <Text style={styles.primaryText}>로그인하러 가기</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.body}
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
          <Text style={styles.intro}>
            같이 창업을 준비하는 사람들과 후보지를 모아 놓고, 투표와 메모로 의견을 나눠요.
          </Text>

          <View style={styles.buttonRow}>
            <Pressable style={[styles.primaryButton, { flex: 1 }]} onPress={() => setMode('create')}>
              <Text style={styles.primaryText}>＋ 팀 만들기</Text>
            </Pressable>
            <Pressable style={[styles.outlineButton, { flex: 1 }]} onPress={() => setMode('join')}>
              <Text style={styles.outlineText}>초대 코드로 참여</Text>
            </Pressable>
          </View>

          {teams.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyTitle}>아직 속한 팀이 없어요</Text>
              <Text style={styles.emptyText}>팀을 만들거나, 받은 초대 코드로 참여해보세요.</Text>
            </View>
          ) : (
            teams.map(t => (
              <Pressable
                key={t.id}
                style={styles.card}
                onPress={() =>
                  router.push({ pathname: '/team/detail', params: { id: t.id } } as any)
                }
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>{t.name}</Text>
                  <Text style={styles.cardMeta}>팀원 {t.memberCount}명</Text>
                </View>
                {t.role === 'owner' ? (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>팀장</Text>
                  </View>
                ) : null}
                <Text style={styles.chevron}>›</Text>
              </Pressable>
            ))
          )}
        </ScrollView>
      )}

      <Modal visible={mode !== null} transparent animationType="fade" onRequestClose={closeForm}>
        <KeyboardAvoidingView
          style={styles.backdrop}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>{mode === 'create' ? '팀 만들기' : '초대 코드로 참여'}</Text>
            <TextInput
              style={styles.input}
              value={input}
              onChangeText={setInput}
              placeholder={mode === 'create' ? '팀 이름 (예: 세종 카페 준비팀)' : '초대 코드 6자리'}
              placeholderTextColor={COLORS.textSecondary}
              autoCapitalize={mode === 'join' ? 'characters' : 'none'}
              maxLength={mode === 'create' ? 30 : 6}
              autoFocus
              onSubmitEditing={submit}
            />
            <View style={styles.buttonRow}>
              <Pressable style={[styles.outlineButton, { flex: 1 }]} onPress={closeForm}>
                <Text style={styles.outlineText}>취소</Text>
              </Pressable>
              <Pressable
                style={[styles.primaryButton, { flex: 1 }, !input.trim() && { opacity: 0.5 }]}
                onPress={submit}
                disabled={!input.trim() || busy}
              >
                {busy ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.primaryText}>{mode === 'create' ? '만들기' : '참여하기'}</Text>
                )}
              </Pressable>
            </View>
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
  },
  back: { fontSize: 30, color: COLORS.text, lineHeight: 30 },
  appBarTitle: { fontSize: 18, fontWeight: '800', color: COLORS.text },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28 },
  body: { padding: 18, gap: 12, paddingBottom: 40 },
  intro: { fontSize: 14, lineHeight: 21, color: COLORS.textSecondary },
  buttonRow: { flexDirection: 'row', gap: 10 },
  primaryButton: {
    height: 48,
    paddingHorizontal: 18,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  outlineButton: {
    height: 48,
    paddingHorizontal: 18,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outlineText: { color: COLORS.text, fontSize: 15, fontWeight: '600' },
  emptyBox: { alignItems: 'center', paddingVertical: 40 },
  emptyTitle: { fontSize: 17, fontWeight: '800', color: COLORS.text, marginBottom: 6, textAlign: 'center' },
  emptyText: {
    fontSize: 14,
    lineHeight: 21,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
  },
  cardTitle: { fontSize: 16, fontWeight: '800', color: COLORS.text },
  cardMeta: { fontSize: 13, color: COLORS.textSecondary, marginTop: 3 },
  badge: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: { fontSize: 11, fontWeight: '700', color: COLORS.primaryDark },
  chevron: { fontSize: 24, color: COLORS.textSecondary },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  formCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 20,
    gap: 14,
  },
  formTitle: { fontSize: 18, fontWeight: '800', color: COLORS.text },
  input: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 14,
    fontSize: 15,
    color: COLORS.text,
  },
});