import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { COLORS } from '@/constants/colors';
import { useRequireLogin } from '@/hooks/use-require-login';
import { PostActions } from '@/components/PostActions';
import { getCurrentUser, isLoggedIn } from '@/services/auth';
import {
  addComment,
  CATEGORY_COLORS,
  CATEGORY_LABELS,
  deleteComment,
  deletePost,
  formatRelativeDate,
  getComments,
  getPost,
  type Comment,
  type Post,
} from '@/services/community';
import { confirmDialog, notify } from '@/utils/dialog';

export default function CommunityDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { loginModal, openLoginModal } = useRequireLogin(
    `/community/${id}`,
    '댓글 작성은 로그인해야 이용 가능합니다.',
  );

  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [myId, setMyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const [p, c, user] = await Promise.all([
        getPost(id),
        getComments(id),
        getCurrentUser().catch(() => null),
      ]);
      setPost(p);
      setComments(c);
      setMyId(user?.id ?? null);
    } catch {
      setPost(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const onSend = async () => {
    if (!text.trim() || !id) return;
    const logged = await isLoggedIn().catch(() => false);
    if (!logged) {
      openLoginModal();
      return;
    }
    setSending(true);
    try {
      await addComment(id, text);
      setText('');
      setComments(await getComments(id));
    } catch {
      notify('등록 실패', '댓글을 등록하지 못했어요.');
    } finally {
      setSending(false);
    }
  };

  const onDeletePost = async () => {
    if (!post) return;
    const ok = await confirmDialog('글 삭제', '이 글을 삭제할까요?', '삭제', true);
    if (!ok) return;
    try {
      await deletePost(post.id);
      router.back();
    } catch {
      notify('삭제 실패', '잠시 후 다시 시도해주세요.');
    }
  };

  const onDeleteComment = async (cid: string) => {
    const ok = await confirmDialog('댓글 삭제', '이 댓글을 삭제할까요?', '삭제', true);
    if (!ok) return;
    try {
      await deleteComment(cid);
      setComments((prev) => prev.filter((c) => c.id !== cid));
    } catch {
      notify('삭제 실패', '잠시 후 다시 시도해주세요.');
    }
  };

  const a = post?.attached_analysis;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.appBar}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.back}>‹</Text>
        </Pressable>
        <Text style={styles.appBarTitle}>게시글</Text>
        {post && myId === post.user_id ? (
          <Pressable onPress={onDeletePost} hitSlop={12}>
            <Text style={styles.delete}>삭제</Text>
          </Pressable>
        ) : (
          <View style={{ width: 24 }} />
        )}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={COLORS.primary} />
        </View>
      ) : !post ? (
        <View style={styles.center}>
          <Text style={styles.meta}>글을 찾을 수 없어요.</Text>
        </View>
      ) : (
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
            <View style={styles.tagRow}>
              <View
                style={[styles.badge, { backgroundColor: CATEGORY_COLORS[post.category].bg }]}
              >
                <Text style={[styles.badgeText, { color: CATEGORY_COLORS[post.category].fg }]}>
                  {CATEGORY_LABELS[post.category]}
                </Text>
              </View>
              {post.region_tag ? <Text style={styles.tag}>#{post.region_tag}</Text> : null}
              {post.business_tag ? <Text style={styles.tag}>#{post.business_tag}</Text> : null}
            </View>

            <Text style={styles.title}>{post.title}</Text>
            <Text style={styles.meta}>
              {post.author_nickname} · {formatRelativeDate(post.created_at)}
            </Text>
            <Text style={styles.content}>{post.content}</Text>

            <PostActions postId={post.id} analysis={post.attached_analysis} />

            {a ? (
              <View style={styles.analysisCard}>
                <Text style={styles.analysisLabel}>📎 첨부된 분석</Text>
                <Text style={styles.analysisTitle}>
                  {a.areaName} · {a.businessName}
                </Text>
                <View style={styles.statRow}>
                  {a.rank != null ? (
                    <Stat label="순위" value={`${a.rank}${a.totalCount ? `/${a.totalCount}` : ''}위`} />
                  ) : null}
                  {a.suitabilityScore != null ? (
                    <Stat label="적합도" value={`${a.suitabilityScore}점`} />
                  ) : null}
                  {a.storeCount != null ? <Stat label="점포 수" value={`${a.storeCount}개`} /> : null}
                  {a.floatingPopulation != null ? (
                    <Stat label="유동인구" value={a.floatingPopulation.toLocaleString()} />
                  ) : null}
                </View>
              </View>
            ) : null}

            <Text style={styles.sectionTitle}>댓글 {comments.length}</Text>
            {comments.length === 0 ? (
              <Text style={styles.noComment}>첫 댓글을 남겨보세요.</Text>
            ) : (
              comments.map((c) => (
                <View key={c.id} style={styles.comment}>
                  <View style={styles.commentTop}>
                    <Text style={styles.commentAuthor}>{c.author_nickname}</Text>
                    <Text style={styles.commentTime}>{formatRelativeDate(c.created_at)}</Text>
                    {myId === c.user_id ? (
                      <Pressable onPress={() => onDeleteComment(c.id)} hitSlop={8}>
                        <Text style={styles.commentDelete}>삭제</Text>
                      </Pressable>
                    ) : null}
                  </View>
                  <Text style={styles.commentText}>{c.content}</Text>
                </View>
              ))
            )}
          </ScrollView>

          <View style={styles.inputBar}>
            <TextInput
              style={styles.commentInput}
              value={text}
              onChangeText={setText}
              onFocus={async () => {
                const logged = await isLoggedIn().catch(() => false);
                if (!logged) openLoginModal();
              }}
              placeholder="댓글을 입력하세요"
              placeholderTextColor={COLORS.textSecondary}
              maxLength={500}
            />
            <Pressable
              style={[styles.send, (!text.trim() || sending) && styles.sendDisabled]}
              onPress={onSend}
              disabled={!text.trim() || sending}
            >
              <Text style={styles.sendText}>등록</Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      )}

      {loginModal}
    </SafeAreaView>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  appBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  back: { fontSize: 28, color: COLORS.text, width: 24 },
  appBarTitle: { fontSize: 17, fontWeight: '800', color: COLORS.text },
  delete: { fontSize: 14, fontWeight: '700', color: COLORS.danger },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  body: { padding: 16, paddingBottom: 24 },
  tagRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  badgeText: { fontSize: 11, fontWeight: '800' },
  tag: { fontSize: 12, color: COLORS.textSecondary },
  title: { fontSize: 20, fontWeight: '800', color: COLORS.text, marginBottom: 6 },
  meta: { fontSize: 12, color: COLORS.textSecondary },
  content: { fontSize: 15, color: COLORS.text, lineHeight: 23, marginTop: 16 },
  analysisCard: {
    marginTop: 20,
    backgroundColor: COLORS.primaryLight,
    borderRadius: 16,
    padding: 16,
  },
  analysisLabel: { fontSize: 12, fontWeight: '700', color: COLORS.primaryDark },
  analysisTitle: { fontSize: 16, fontWeight: '800', color: COLORS.text, marginTop: 4 },
  statRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  stat: {
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: 72,
  },
  statValue: { fontSize: 14, fontWeight: '800', color: COLORS.text },
  statLabel: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },
  sectionTitle: { fontSize: 14, fontWeight: '800', color: COLORS.text, marginTop: 28, marginBottom: 10 },
  noComment: { fontSize: 13, color: COLORS.textSecondary },
  comment: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  commentTop: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  commentAuthor: { fontSize: 13, fontWeight: '700', color: COLORS.text },
  commentTime: { fontSize: 11, color: COLORS.textSecondary, flex: 1 },
  commentDelete: { fontSize: 12, color: COLORS.danger, fontWeight: '600' },
  commentText: { fontSize: 14, color: COLORS.text, lineHeight: 20 },
  inputBar: {
    flexDirection: 'row',
    gap: 8,
    padding: 12,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  commentInput: {
    flex: 1,
    backgroundColor: COLORS.lightGray,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    color: COLORS.text,
  },
  send: {
    backgroundColor: COLORS.primary,
    borderRadius: 999,
    paddingHorizontal: 18,
    justifyContent: 'center',
  },
  sendDisabled: { backgroundColor: COLORS.disabled },
  sendText: { color: '#FFFFFF', fontWeight: '800', fontSize: 14 },
});