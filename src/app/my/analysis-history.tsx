import { COLORS } from '@/constants/colors';
import {
    AnalysisHistoryItem,
    getAnalysisHistory,
} from '@/services/analysisHistory';
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

type FilterType = 'all' | 'comparison';

export default function AnalysisHistoryScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ filter?: string }>();

  const filter: FilterType =
    params.filter === 'comparison' ? 'comparison' : 'all';

  const [histories, setHistories] = useState<AnalysisHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getAnalysisHistory();
      setHistories(data);
    } catch (error) {
      console.error('분석 기록 조회 실패:', error);
      setHistories([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData]),
  );

  const filteredHistories = useMemo(() => {
    const sorted = [...histories].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() -
        new Date(a.createdAt).getTime(),
    );

    return filter === 'comparison'
      ? sorted.filter(item => item.type === 'comparison')
      : sorted;
  }, [histories, filter]);

  const title =
    filter === 'comparison' ? '비교 분석 기록' : '전체 분석 기록';

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);

    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(
      2,
      '0',
    )}.${String(date.getDate()).padStart(2, '0')}`;
  };

  const getTypeLabel = (type: AnalysisHistoryItem['type']) => {
    switch (type) {
      case 'comparison':
        return '비교 분석';
      case 'location':
        return '입지 추천';
      case 'owned':
        return '보유 입지 분석';
      default:
        return '분석';
    }
  };

  const handleView = (history: AnalysisHistoryItem) => {
    const data = history.resultData;

    if (!data) {
      return;
    }

    (router as any).push({
      pathname: '/market-analysis/region-result-detail',
      params: {
        businessName: data.businessName ?? history.businessName,
        areaName: data.areaName ?? history.regions[0] ?? '',
        rank: String(data.rank ?? 1),
        totalCount: String(data.totalCount ?? 1),
        suitabilityScore: String(data.suitabilityScore ?? 0),
        floatingPopulation: String(data.floatingPopulation ?? 0),
        livingPopulation: String(data.livingPopulation ?? 0),
        storeCount: String(data.storeCount ?? 0),
        competitionDensity: String(data.competitionDensity ?? 0),
        salesAmount: String(data.salesAmount ?? 0),
        averageSalesPerStore: String(data.averageSalesPerStore ?? 0),
        busStopCount: String(data.busStopCount ?? 0),
        livingPopulationChangeRate: String(
          data.livingPopulationChangeRate ?? 0,
        ),
        floatingPopulationChangeRate: String(
          data.floatingPopulationChangeRate ?? 0,
        ),
        analysisType: data.analysisType ?? 'area',
        dongName: data.dongName ?? data.areaName ?? '',
        latitude:
          data.latitude != null ? String(data.latitude) : '',
        longitude:
          data.longitude != null ? String(data.longitude) : '',
        radius: data.radius != null ? String(data.radius) : '',
      },
    });
  };

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          activeOpacity={0.7}
          onPress={() => router.back()}
        >
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>

        <View>
          <Text style={styles.headerTitle}>{title}</Text>
          <Text style={styles.headerSubtitle}>
            저장된 분석 결과를 다시 확인할 수 있어요.
          </Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <ScrollView
          style={styles.list}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.countRow}>
            <Text style={styles.countLabel}>{title}</Text>
            <Text style={styles.count}>{filteredHistories.length}개</Text>
          </View>

          {filteredHistories.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>저장된 분석이 없어요</Text>
              <Text style={styles.emptyDescription}>
                분석을 진행하면 이곳에서 다시 확인할 수 있어요.
              </Text>
            </View>
          ) : (
            filteredHistories.map(history => (
              <TouchableOpacity
                key={history.id}
                style={styles.historyCard}
                activeOpacity={0.75}
                onPress={() => handleView(history)}
              >
                <View style={styles.cardTop}>
                  <View style={styles.typeBadge}>
                    <Text style={styles.typeBadgeText}>
                      {getTypeLabel(history.type)}
                    </Text>
                  </View>

                  <Text style={styles.date}>
                    {formatDate(history.createdAt)}
                  </Text>
                </View>

                <Text style={styles.businessName}>
                  {history.businessName}
                </Text>

                <View style={styles.regionRow}>
                  {history.regions.map(region => (
                    <View key={region} style={styles.regionChip}>
                      <Text style={styles.regionText}>{region}</Text>
                    </View>
                  ))}
                </View>

                <View style={styles.viewRow}>
                  <Text style={styles.viewText}>결과 다시 보기</Text>
                  <Text style={styles.arrow}>›</Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    minHeight: 76,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: 32,
    color: COLORS.text,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.text,
  },
  headerSubtitle: {
    marginTop: 3,
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    flex: 1,
  },
  listContent: {
    width: '100%',
    maxWidth: 900,
    alignSelf: 'center',
    padding: 20,
    paddingBottom: 60,
  },
  countRow: {
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  countLabel: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.text,
  },
  count: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.primary,
  },
  historyCard: {
    padding: 18,
    marginBottom: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: '#FFFFFF',
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  typeBadge: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: '#E9F8EC',
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.primary,
  },
  date: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  businessName: {
    marginTop: 14,
    fontSize: 19,
    fontWeight: '900',
    color: COLORS.text,
  },
  regionRow: {
    marginTop: 11,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
  },
  regionChip: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: '#F4F5F4',
  },
  regionText: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  viewRow: {
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#EEF1EF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  viewText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.primary,
  },
  arrow: {
    fontSize: 22,
    color: COLORS.primary,
  },
  emptyCard: {
    minHeight: 220,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: '#FFFFFF',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.text,
  },
  emptyDescription: {
    marginTop: 6,
    fontSize: 12,
    color: COLORS.textSecondary,
  },
});
