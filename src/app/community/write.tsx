import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
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
import { getFavoriteAnalyses, type AnalysisHistoryItem } from '@/services/analysisHistory';
import { isLoggedIn } from '@/services/auth';
import {
  CATEGORY_LABELS,
  createPost,
  type AttachedAnalysis,
  type PostCategory,
} from '@/services/community';
import { notify } from '@/utils/dialog';

const CATEGORIES: PostCategory[] = ['question', 'review', 'info'];

function toAttached(item: AnalysisHistoryItem): AttachedAnalysis {
  const r: any = item.resultData ?? {};
  const first: any = Array.isArray(r) ? r[0] : r;
  return {
    businessName: item.businessName,
    areaName: first?.areaName ?? first?.region ?? item.regions?.[0] ?? '',
    rank: first?.rank,
    totalCount: first?.totalCount,
    suitabilityScore: first?.suitabilityScore ?? first?.score,
    floatingPopulation: first?.floatingPopulation,
    storeCount: first?.storeCount,
    competitionDensity: first?.competitionDensity,
    averageSalesPerStore: first?.averageSalesPerStore,
    analysisType: item.type,
    radius: first?.radius,
  };
}

export default function CommunityWriteScreen() {
  const router = useRouter();
  const { loginModal, openLoginModal } = useRequireLogin(
    '/community/write',
    '글쓰기는 로그인해야 이용 가능합니다.',
  );

  const [category, setCategory] = useState<PostCategory>('question');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [regionTag, setRegionTag] = useState('');
  const [businessTag, setBusinessTag] = useState('');
  const [favorites, setFavorites] = useState<AnalysisHistoryItem[]>([]);
  const [showPicker, setShowPicker] = useState(false);
  const [attached, setAttached] = useState<AnalysisHistoryItem | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      const logged = await isLoggedIn().catch(() => false);
      if (!logged) openLoginModal();
      try {
        setFavorites(await getFavoriteAnalyses());
      } catch {
        setFavorites([]);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const canSubmit = title.trim().length > 0 && content.trim().length > 0 && !submitting;

  const submit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const id = await createPost({
        category,
        title,
        content,
        regionTag: regionTag.trim() || attached?.regions?.[0] || null,
        businessTag: businessTag.trim() || attached?.businessName || null,
        attachedAnalysis: attached ? toAttached(attached) : null,
      });
      router.replace({ pathname: '/community/[id]', params: { id } } as any);
    } catch (e: any) {
      if (e?.message === 'LOGIN_REQUIRED') {
        openLoginModal();
      } else {
        notify('등록 실패', '글을 등록하지 못했어요. 잠시 후 다시 시도해주세요.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.appBar}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.back}>‹</Text>
        </Pressable>
        <Text style={styles.appBarTitle}>글쓰기</Text>
        <Pressable onPress={submit} disabled={!canSubmit} hitSlop={12}>
          <Text style={[styles.submit, !canSubmit && styles.submitDisabled]}>등록</Text>
        </Pressable>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
          <Text style={styles.label}>분류</Text>
          <View style={styles.row}>
            {CATEGORIES.map((c) => (
              <Pressable
                key={c}
                style={[styles.pill, category === c && styles.pillActive]}
                onPress={() => setCategory(c)}
              >
                <Text style={[styles.pillText, category === c && styles.pillTextActive]}>
                  {CATEGORY_LABELS[c]}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.label}>제목</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="제목을 입력하세요"
            placeholderTextColor={COLORS.textSecondary}
            maxLength={80}
          />

          <Text style={styles.label}>내용</Text>
          <TextInput
            style={[styles.input, styles.textarea]}
            value={content}
            onChangeText={setContent}
            placeholder="궁금한 점이나 경험을 자유롭게 남겨보세요"
            placeholderTextColor={COLORS.textSecondary}
            multiline
            textAlignVertical="top"
          />

          <Text style={styles.label}>태그 (선택)</Text>
          <View style={styles.row}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              value={regionTag}
              onChangeText={setRegionTag}
              placeholder="지역 (예: 나성동)"
              placeholderTextColor={COLORS.textSecondary}
              maxLength={20}
            />
            <TextInput
              style={[styles.input, { flex: 1 }]}
              value={businessTag}
              onChangeText={setBusinessTag}
              placeholder="업종 (예: 카페)"
              placeholderTextColor={COLORS.textSecondary}
              maxLength={20}
            />
          </View>

          <Text style={styles.label}>찜한 분석 첨부 (선택)</Text>
          {attached ? (
            <View style={styles.attachedBox}>
              <View style={{ flex: 1 }}>
                <Text style={styles.attachedTitle} numberOfLines={1}>
                  {attached.title}
                </Text>
                <Text style={styles.attachedSub}>{attached.businessName}</Text>
              </View>
              <Pressable onPress={() => setAttached(null)} hitSlop={10}>
                <Text style={styles.remove}>삭제</Text>
              </Pressable>
            </View>
          ) : (
            <Pressable style={styles.attachButton} onPress={() => setShowPicker((v) => !v)}>
              <Text style={styles.attachButtonText}>
                {showPicker ? '목록 닫기' : '📎 찜한 분석 불러오기'}
              </Text>
            </Pressable>
          )}

          {showPicker && !attached ? (
            <View style={styles.picker}>
              {favorites.length === 0 ? (
                <Text style={styles.pickerEmpty}>찜한 분석이 아직 없어요.</Text>
              ) : (
                favorites.map((f) => (
                  <Pressable
                    key={f.id}
                    style={styles.pickerItem}
                    onPress={() => {
                      setAttached(f);
                      setShowPicker(false);
                    }}
                  >
                    <Text style={styles.pickerTitle} numberOfLines={1}>
                      {f.title}
                    </Text>
                    <Text style={styles.pickerSub}>{f.businessName}</Text>
                  </Pressable>
                ))
              )}
            </View>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>

      {loginModal}
    </SafeAreaView>
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
  submit: { fontSize: 15, fontWeight: '800', color: COLORS.primary },
  submitDisabled: { color: COLORS.disabled },
  body: { padding: 16, paddingBottom: 60 },
  label: { fontSize: 13, fontWeight: '700', color: COLORS.text, marginTop: 16, marginBottom: 8 },
  row: { flexDirection: 'row', gap: 8 },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: COLORS.lightGray,
  },
  pillActive: { backgroundColor: COLORS.primary },
  pillText: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary },
  pillTextActive: { color: '#FFFFFF' },
  input: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: COLORS.text,
  },
  textarea: { minHeight: 180 },
  attachButton: {
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
  },
  attachButtonText: { color: COLORS.primaryDark, fontWeight: '700', fontSize: 13 },
  attachedBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    borderRadius: 12,
    padding: 14,
  },
  attachedTitle: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  attachedSub: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  remove: { color: COLORS.danger, fontWeight: '700', fontSize: 13 },
  picker: {
    marginTop: 8,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    overflow: 'hidden',
  },
  pickerItem: { padding: 14, borderBottomWidth: 1, borderBottomColor: COLORS.lightGray },
  pickerTitle: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  pickerSub: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  pickerEmpty: { padding: 16, textAlign: 'center', color: COLORS.textSecondary, fontSize: 13 },
});