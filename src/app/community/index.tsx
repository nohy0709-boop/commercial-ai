import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Pressable,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { COLORS } from '@/constants/colors';
import { useRequireLogin } from '@/hooks/use-require-login';
import {
    CATEGORY_COLORS,
    CATEGORY_LABELS,
    formatRelativeDate,
    getPosts,
    type Post,
    type PostCategory,
} from '@/services/community';

const CATEGORY_TABS: { key: PostCategory | 'all'; label: string }[] = [
  { key: 'all', label: '전체' },
  { key: 'question', label: CATEGORY_LABELS.question },
  { key: 'review', label: CATEGORY_LABELS.review },
  { key: 'info', label: CATEGORY_LABELS.info },
];

export default function CommunityScreen() {
  const router = useRouter();
  const { requireLogin, loginModal } = useRequireLogin(
    '/community',
    '글쓰기는 로그인해야 이용 가능합니다.',
  );

  const [category, setCategory] = useState<PostCategory | 'all'>('all');
  const [regionFilter, setRegionFilter] = useState<string | null>(null);
  const [businessFilter, setBusinessFilter] = useState<string | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      setError(null);
      try {
        const data = await getPosts({
          category,
          region: regionFilter,
          business: businessFilter,
        });
        setPosts(data);
      } catch (e) {
        setError('글을 불러오지 못했어요. 잠시 후 다시 시도해주세요.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [category, regionFilter, businessFilter],
  );

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const regionChips = Array.from(
    new Set(posts.map((p) => p.region_tag).filter(Boolean) as string[]),
  );
  const businessChips = Array.from(
    new Set(posts.map((p) => p.business_tag).filter(Boolean) as string[]),
  );

  const renderItem = ({ item }: { item: Post }) => {
    const color = CATEGORY_COLORS[item.category];
    return (
      <Pressable
        style={styles.card}
        onPress={() =>
          router.push({ pathname: '/community/[id]', params: { id: item.id } } as any)
        }
      >
        <View style={styles.cardTop}>
          <View style={[styles.badge, { backgroundColor: color.bg }]}>
            <Text style={[styles.badgeText, { color: color.fg }]}>
              {CATEGORY_LABELS[item.category]}
            </Text>
          </View>
          {item.region_tag ? <Text style={styles.tag}>#{item.region_tag}</Text> : null}
          {item.business_tag ? <Text style={styles.tag}>#{item.business_tag}</Text> : null}
          {item.attached_analysis ? <Text style={styles.attach}>📎 분석첨부</Text> : null}
        </View>
        <Text style={styles.cardTitle} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={styles.cardContent} numberOfLines={2}>
          {item.content}
        </Text>
        <View style={styles.cardBottom}>
          <Text style={styles.meta}>
            {item.author_nickname} · {formatRelativeDate(item.created_at)}
          </Text>
          <Text style={styles.meta}>💬 {item.commentCount}</Text>
        </View>
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.appBar}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.back}>‹</Text>
        </Pressable>
        <Text style={styles.appBarTitle}>커뮤니티</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.tabs}>
        {CATEGORY_TABS.map((t) => {
          const active = category === t.key;
          return (
            <Pressable
              key={t.key}
              style={[styles.tab, active && styles.tabActive]}
              onPress={() => setCategory(t.key)}
            >
              <Text style={[styles.tabText, active && styles.tabTextActive]}>{t.label}</Text>
            </Pressable>
          );
        })}
      </View>

      {regionChips.length + businessChips.length > 0 || regionFilter || businessFilter ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.chipScroll}
          contentContainerStyle={styles.chipRow}
        >
          {Array.from(new Set([...(regionFilter ? [regionFilter] : []), ...regionChips])).map(
            (r) => (
              <Pressable
                key={`r-${r}`}
                style={[styles.chip, regionFilter === r && styles.chipActive]}
                onPress={() => setRegionFilter(regionFilter === r ? null : r)}
              >
                <Text style={[styles.chipText, regionFilter === r && styles.chipTextActive]}>
                  📍 {r}
                </Text>
              </Pressable>
            ),
          )}
          {Array.from(
            new Set([...(businessFilter ? [businessFilter] : []), ...businessChips]),
          ).map((b) => (
            <Pressable
              key={`b-${b}`}
              style={[styles.chip, businessFilter === b && styles.chipActive]}
              onPress={() => setBusinessFilter(businessFilter === b ? null : b)}
            >
              <Text style={[styles.chipText, businessFilter === b && styles.chipTextActive]}>
                🏪 {b}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      ) : null}

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={COLORS.primary} />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>{error}</Text>
          <Pressable style={styles.retry} onPress={() => load()}>
            <Text style={styles.retryText}>다시 시도</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(p) => p.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                load(true);
              }}
              tintColor={COLORS.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyText}>아직 글이 없어요.{'\n'}첫 글을 남겨보세요!</Text>
            </View>
          }
        />
      )}

      <Pressable
        style={styles.fab}
        onPress={() => requireLogin(() => router.push('/community/write' as any))}
      >
        <Text style={styles.fabText}>✏️ 글쓰기</Text>
      </Pressable>

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
  tabs: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    paddingHorizontal: 12,
    paddingBottom: 10,
    gap: 8,
  },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: COLORS.lightGray,
  },
  tabActive: { backgroundColor: COLORS.primary },
  tabText: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary },
  tabTextActive: { color: '#FFFFFF' },
  chipScroll: { flexGrow: 0, backgroundColor: COLORS.surface },
  chipRow: { paddingHorizontal: 12, paddingBottom: 10, gap: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  chipActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight },
  chipText: { fontSize: 12, color: COLORS.textSecondary, fontWeight: '600' },
  chipTextActive: { color: COLORS.primaryDark },
  list: { padding: 16, paddingBottom: 100, gap: 12, flexGrow: 1 },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  badgeText: { fontSize: 11, fontWeight: '800' },
  tag: { fontSize: 11, color: COLORS.textSecondary },
  attach: { fontSize: 11, color: COLORS.primaryDark, fontWeight: '600' },
  cardTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text, marginBottom: 4 },
  cardContent: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 19 },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  meta: { fontSize: 12, color: COLORS.textSecondary },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 22 },
  retry: {
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: COLORS.primary,
  },
  retryText: { color: '#FFFFFF', fontWeight: '700' },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 28,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 999,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  fabText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
});