import { COLORS } from '@/constants/colors';
import {
  AnalysisHistoryItem,
  getFavoriteAnalyses,
  toggleAnalysisFavorite,
} from '@/services/analysisHistory';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

type MetricKey =
  | 'suitabilityScore'
  | 'floatingPopulation'
  | 'livingPopulation'
  | 'storeCount'
  | 'competitionDensity'
  | 'salesAmount'
  | 'averageSalesPerStore'
  | 'busStopCount'
  | 'livingPopulationChangeRate'
  | 'floatingPopulationChangeRate';

const METRICS: { key: MetricKey; label: string; unit: string; digits?: number }[] = [
  { key: 'suitabilityScore', label: '종합 적합도', unit: '점', digits: 1 },
  { key: 'floatingPopulation', label: '유동인구', unit: '명' },
  { key: 'livingPopulation', label: '생활인구', unit: '명' },
  { key: 'storeCount', label: '동종 업종 점포 수', unit: '개' },
  { key: 'competitionDensity', label: '경쟁 밀도', unit: '', digits: 3 },
  { key: 'salesAmount', label: '전체 카드소비', unit: '원' },
  { key: 'averageSalesPerStore', label: '점포당 카드소비', unit: '원' },
  { key: 'busStopCount', label: '버스정류장 수', unit: '개' },
  { key: 'livingPopulationChangeRate', label: '생활인구 증감률', unit: '%', digits: 2 },
  { key: 'floatingPopulationChangeRate', label: '유동인구 증감률', unit: '%', digits: 2 },
];

function formatMetric(value: unknown, unit: string, digits = 0): string {
  if (value === null || value === undefined || value === '') return '데이터 없음';
  const number = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(number)) return '데이터 없음';
  const formatted = number.toLocaleString('ko-KR', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
  return `${formatted}${unit}`;
}

const COMPARE_THEMES = [
  { main: '#202544', light: '#F3F5FA' },
  { main: COLORS.warning, light: COLORS.warningLight },
  { main: COLORS.textSecondary, light: COLORS.subtle },
];
function numericMetric(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatCompact(value: unknown, metric: typeof METRICS[number]): string {
  const n = numericMetric(value);
  if (n === null) return '데이터 없음';
  if (metric.unit === '원') {
    const abs = Math.abs(n);
    if (abs >= 100000000) return `${Number((n / 100000000).toFixed(2)).toLocaleString('ko-KR')}억 원`;
    if (abs >= 10000) return `${Number((n / 10000).toFixed(1)).toLocaleString('ko-KR')}만 원`;
  }
  return formatMetric(n, metric.unit, metric.digits);
}

function getBarWidth(value: number | null, values: (number | null)[]): `${number}%` {
  if (value === null) return '0%';
  const max = Math.max(0, ...values.map(v => v === null ? 0 : Math.abs(v)));
  if (max === 0) return '0%';
  return `${Math.max(0, Math.min(100, Math.abs(value) / max * 100))}%`;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return dateString;
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
}

function getTypeLabel(type: AnalysisHistoryItem['type']): string {
  switch (type) {
    case 'comparison': return '비교 분석';
    case 'location': return '입지 추천';
    case 'owned': return '보유 입지 분석';
    default: return '분석';
  }
}

export default function FavoriteAnalysesScreen() {
  const router = useRouter();
  const [favorites, setFavorites] = useState<AnalysisHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [compareMode, setCompareMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showComparison, setShowComparison] = useState(false);

  const loadFavorites = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getFavoriteAnalyses();
      setFavorites(data);
      setSelectedIds(previous => previous.filter(id => data.some(item => item.id === id)));
    } catch (error) {
      console.error('찜한 분석 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { void loadFavorites(); }, [loadFavorites]));

  const selectedAnalyses = useMemo(
    () => selectedIds.map(id => favorites.find(item => item.id === id)).filter((item): item is AnalysisHistoryItem => Boolean(item)),
    [favorites, selectedIds],
  );

  const toggleCompareMode = () => {
    setCompareMode(previous => !previous);
    setSelectedIds([]);
    setShowComparison(false);
  };

  const toggleSelected = (id: string) => {
    setShowComparison(false);
    setSelectedIds(previous => {
      if (previous.includes(id)) return previous.filter(item => item !== id);
      if (previous.length >= 3) {
        Alert.alert('선택 제한', '비교할 분석은 최대 3개까지 선택할 수 있어요.');
        return previous;
      }
      return [...previous, id];
    });
  };

  const handleUnlike = async (id: string) => {
    try {
      await toggleAnalysisFavorite(id);
      setFavorites(previous => previous.filter(item => item.id !== id));
      setSelectedIds(previous => previous.filter(item => item !== id));
      setShowComparison(false);
    } catch (error) {
      console.error('찜 해제 실패:', error);
      Alert.alert('오류', '찜 해제에 실패했습니다.');
    }
  };

  const handleView = (history: AnalysisHistoryItem) => {
    const data = history.resultData;
    if (!data) {
      Alert.alert('분석 데이터 없음', '이 분석의 상세 결과가 저장되지 않았어요.');
      return;
    }
    router.push({
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
        livingPopulationChangeRate: String(data.livingPopulationChangeRate ?? 0),
        floatingPopulationChangeRate: String(data.floatingPopulationChangeRate ?? 0),
        analysisType: data.analysisType ?? 'area',
        dongName: data.dongName ?? data.areaName ?? '',
        latitude: data.latitude != null ? String(data.latitude) : '',
        longitude: data.longitude != null ? String(data.longitude) : '',
        radius: data.radius != null ? String(data.radius) : '',
      },
    });
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>찜한 분석</Text>
        <Text style={styles.description}>마음에 든 분석 결과만 따로 모아볼 수 있어요.</Text>
      </View>

      <View style={styles.countCard}>
        <Text style={styles.countNumber}>{favorites.length}</Text>
        <Text style={styles.countLabel}>저장한 분석</Text>
      </View>

      {!loading && favorites.length >= 2 && (
        <View style={styles.compareToolbar}>
          <View style={styles.toolbarText}>
            <Text style={styles.toolbarTitle}>찜한 분석끼리 비교</Text>
            <Text style={styles.toolbarDescription}>
              {compareMode ? `비교할 후보 2~3개 선택 (${selectedIds.length}/3)` : '서로 다른 지역·업종의 지표를 나란히 비교해요'}
            </Text>
          </View>
          <TouchableOpacity style={styles.modeButton} onPress={toggleCompareMode} accessibilityRole="button">
            <Text style={styles.modeButtonText}>{compareMode ? '취소' : '비교 선택'}</Text>
          </TouchableOpacity>
        </View>
      )}

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>찜한 분석을 불러오고 있어요</Text>
        </View>
      ) : favorites.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyIcon}>♡</Text>
          <Text style={styles.emptyTitle}>아직 찜한 분석이 없어요</Text>
          <Text style={styles.emptyDescription}>분석 상세 화면에서 하트를 누르면 여기에 저장됩니다.</Text>
        </View>
      ) : (
        favorites.map(history => {
          const checked = selectedIds.includes(history.id);
          return (
            <View key={history.id} style={[styles.card, checked && styles.selectedCard]}>
              <View style={styles.cardTop}>
                <View style={styles.typeBadge}>
                  <Text style={styles.typeBadgeText}>{getTypeLabel(history.type)}</Text>
                </View>
                <TouchableOpacity style={styles.heartButton} activeOpacity={0.7} onPress={() => void handleUnlike(history.id)} accessibilityLabel="찜 해제">
                  <Text style={styles.heartText}>♥</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.businessName}>{history.businessName}</Text>
              <View style={styles.regionRow}>
                {history.regions.map((region, index) => (
                  <View key={`${region}-${index}`} style={styles.regionChip}>
                    <Text style={styles.regionText}>{region}</Text>
                  </View>
                ))}
              </View>
              <Text style={styles.date}>{formatDate(history.createdAt)}</Text>

              {compareMode && (
                <TouchableOpacity
                  style={[styles.selectButton, checked && styles.selectButtonActive]}
                  onPress={() => toggleSelected(history.id)}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked }}
                >
                  <Text style={[styles.selectButtonText, checked && styles.selectButtonTextActive]}>
                    {checked ? '✓ 비교 대상 선택됨' : '＋ 비교 대상으로 선택'}
                  </Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity style={styles.viewButton} activeOpacity={0.8} onPress={() => handleView(history)}>
                <Text style={styles.viewButtonText}>분석 다시 보기 →</Text>
              </TouchableOpacity>
            </View>
          );
        })
      )}

      {compareMode && selectedAnalyses.length >= 2 && (
        <TouchableOpacity style={styles.compareButton} onPress={() => setShowComparison(previous => !previous)}>
          <Text style={styles.compareButtonText}>
            {showComparison ? '비교 결과 접기 ▲' : `선택한 ${selectedAnalyses.length}개 분석 비교하기 →`}
          </Text>
        </TouchableOpacity>
      )}

      {compareMode && showComparison && selectedAnalyses.length >= 2 && (
        <View style={styles.resultCard}>
          <Text style={styles.resultTitle}>창업 후보 비교</Text>
          <Text style={styles.resultDescription}>
            저장된 분석 시점의 실제 수치를 비교해요. 색상은 후보 구분용이며, 특정 후보의 우수함을 뜻하지 않아요.
          </Text>

          <View style={styles.summaryRow}>
            {selectedAnalyses.map((item, index) => {
              const theme = COMPARE_THEMES[index];
              const score = numericMetric(item.resultData?.suitabilityScore);
              return (
                <View key={item.id} style={[styles.summaryCard, { backgroundColor: theme.light, borderColor: theme.main }]}>
                  <View style={styles.summaryNameRow}>
                    <View style={[styles.dot, { backgroundColor: theme.main }]} />
                    <Text style={styles.summaryCaption}>후보 {index + 1}</Text>
                  </View>
                  <Text style={styles.summaryBusiness} numberOfLines={1}>{item.businessName}</Text>
                  <Text style={styles.summaryRegion} numberOfLines={2}>{item.regions.join(', ')}</Text>
                  <Text style={[styles.summaryScore, { color: theme.main }]}>
                    {score === null ? '—' : `${score.toFixed(1)}점`}
                  </Text>
                  <Text style={styles.summaryScoreLabel}>종합 적합도</Text>
                  <View style={styles.summaryTrack}>
                    <View style={[styles.summaryFill, {
                      width: `${score === null ? 0 : Math.min(100, Math.max(0, score))}%`,
                      backgroundColor: theme.main,
                    }]} />
                  </View>
                </View>
              );
            })}
          </View>

          <Text style={styles.metricSectionTitle}>세부 지표 비교</Text>
          <Text style={styles.metricSectionHint}>같은 지표 안에서 막대 길이를 비교해요. 증감률이 음수면 막대는 크기만 표시해요.</Text>

          {METRICS.filter(metric => metric.key !== 'suitabilityScore').map(metric => {
            const values = selectedAnalyses.map(item => numericMetric(item.resultData?.[metric.key]));
            return (
              <View key={metric.key} style={styles.metricSection}>
                <Text style={styles.metricLabel}>{metric.label}</Text>
                <View style={styles.metricValuesRow}>
                  {selectedAnalyses.map((item, index) => {
                    const theme = COMPARE_THEMES[index];
                    return (
                      <View key={item.id} style={styles.metricColumn}>
                        <Text style={styles.metricCandidate} numberOfLines={1}>{item.businessName} · {item.regions[0] ?? '-'}</Text>
                        <Text style={[styles.metricValue, { color: theme.main }]} numberOfLines={2}>
                          {formatCompact(item.resultData?.[metric.key], metric)}
                        </Text>
                        <View style={styles.metricTrack}>
                          <View style={[styles.metricFill, {
                            width: getBarWidth(values[index], values),
                            backgroundColor: theme.main,
                          }]} />
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>
            );
          })}
          <View style={styles.noticeBox}>
            <Text style={styles.noticeText}>
              ※ 업종·분석 범위·분석 시점이 다르면 수치의 의미가 달라질 수 있어요. 경쟁 밀도는 낮을수록 부담이 작을 수 있지만, 모든 지표의 높은 값이 무조건 유리한 것은 아니에요. 저장되지 않은 값은 '데이터 없음'으로 표시해요.
            </Text>
          </View>
        </View>
      )}

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },
  container: { width: '100%', maxWidth: 900, alignSelf: 'center', padding: 20, paddingBottom: 60 },
  header: { marginTop: 10, marginBottom: 20 },
  title: { fontSize: 28, fontWeight: '900', color: COLORS.text },
  description: { marginTop: 6, fontSize: 13, lineHeight: 19, color: COLORS.textSecondary },
  countCard: { flexDirection: 'row', alignItems: 'flex-end', gap: 6, padding: 18, borderRadius: 18, borderWidth: 1, borderColor: COLORS.primaryLight, backgroundColor: COLORS.warningLight, marginBottom: 20 },
  countNumber: { fontSize: 28, fontWeight: '900', color: COLORS.primary },
  countLabel: { fontSize: 12, fontWeight: '700', color: COLORS.textSecondary, marginBottom: 4 },
  compareToolbar: { flexDirection: 'row', alignItems: 'center', gap: 10, justifyContent: 'space-between', marginBottom: 16 },
  toolbarText: { flex: 1 },
  toolbarTitle: { fontSize: 15, fontWeight: '900', color: COLORS.text },
  toolbarDescription: { marginTop: 4, fontSize: 11, color: COLORS.textSecondary },
  modeButton: { backgroundColor: COLORS.primaryLight, borderRadius: 12, paddingHorizontal: 15, paddingVertical: 11 },
  modeButtonText: { color: COLORS.primary, fontWeight: '800', fontSize: 13 },
  loadingBox: { minHeight: 250, alignItems: 'center', justifyContent: 'center' },
  loadingText: { marginTop: 12, fontSize: 12, color: COLORS.textSecondary },
  emptyBox: { minHeight: 260, borderRadius: 20, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.surface, alignItems: 'center', justifyContent: 'center', padding: 20 },
  emptyIcon: { fontSize: 46, color: COLORS.primary, marginBottom: 12 },
  emptyTitle: { fontSize: 16, fontWeight: '900', color: COLORS.text },
  emptyDescription: { marginTop: 6, fontSize: 12, lineHeight: 18, textAlign: 'center', color: COLORS.textSecondary },
  card: { padding: 18, marginBottom: 14, borderRadius: 18, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.surface },
  selectedCard: { borderWidth: 2, borderColor: COLORS.primary },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  typeBadge: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 999, backgroundColor: COLORS.primaryLight },
  typeBadgeText: { fontSize: 11, fontWeight: '800', color: COLORS.primary },
  heartButton: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.primaryLight },
  heartText: { fontSize: 21, color: COLORS.primary },
  businessName: { marginTop: 15, fontSize: 20, fontWeight: '900', color: COLORS.text },
  regionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 12 },
  regionChip: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 999, backgroundColor: COLORS.lightGray },
  regionText: { fontSize: 11, fontWeight: '700', color: COLORS.textSecondary },
  date: { marginTop: 12, fontSize: 11, color: COLORS.textSecondary },
  selectButton: { marginTop: 15, minHeight: 42, borderRadius: 12, borderWidth: 1, borderColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.surface },
  selectButtonActive: { backgroundColor: COLORS.primaryLight },
  selectButtonText: { color: COLORS.primary, fontWeight: '800', fontSize: 13 },
  selectButtonTextActive: { color: COLORS.primary },
  viewButton: { marginTop: 16, minHeight: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.primary },
  viewButtonText: { fontSize: 13, fontWeight: '900', color: COLORS.surface },
  compareButton: { marginTop: 4, marginBottom: 18, padding: 17, borderRadius: 14, alignItems: 'center', backgroundColor: COLORS.primary },
  compareButtonText: { fontSize: 14, fontWeight: '900', color: COLORS.surface },
  resultCard: { borderRadius: 18, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.surface, padding: 18 },
  resultTitle: { fontSize: 21, fontWeight: '900', color: COLORS.text },
  resultDescription: { marginTop: 7, marginBottom: 17, color: COLORS.textSecondary, fontSize: 12, lineHeight: 19 },
  summaryRow: { flexDirection: 'row', gap: 9, marginBottom: 24 },
  summaryCard: { flex: 1, minWidth: 0, borderWidth: 1, borderRadius: 14, padding: 11 },
  summaryNameRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 8 },
  dot: { width: 7, height: 7, borderRadius: 4 },
  summaryCaption: { fontSize: 11, color: COLORS.textSecondary, fontWeight: '700' },
  summaryBusiness: { fontSize: 16, fontWeight: '900', color: COLORS.text },
  summaryRegion: { fontSize: 11, color: COLORS.textSecondary, marginTop: 3, minHeight: 28 },
  summaryScore: { fontSize: 23, fontWeight: '900', marginTop: 7 },
  summaryScoreLabel: { fontSize: 10, color: COLORS.textSecondary, marginTop: 1 },
  summaryTrack: { height: 8, borderRadius: 5, backgroundColor: COLORS.border, overflow: 'hidden', marginTop: 10 },
  summaryFill: { height: '100%', borderRadius: 5 },
  metricSectionTitle: { fontSize: 17, fontWeight: '900', color: COLORS.text },
  metricSectionHint: { fontSize: 11, color: COLORS.textSecondary, lineHeight: 17, marginTop: 4, marginBottom: 8 },
  metricSection: {
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E9EDF5',
  },
  metricLabel: { fontSize: 14, fontWeight: '900', color: COLORS.text, marginBottom: 10 },
  metricValuesRow: {
    flexDirection: 'row',
    gap: 14,
    marginTop: 12,
  },
  metricColumn: {
    flex: 1,
    minWidth: 0,
  },
  metricCandidate: { fontSize: 10, color: COLORS.textSecondary, fontWeight: '700' },
  metricValue: {
    fontSize: 17,
    fontWeight: '900',
    marginBottom: 12,
  },
  metricTrack: {
    height: 10,
    backgroundColor: '#E6ECF5',
    borderRadius: 10,
    overflow: 'hidden',
  },

  metricFill: {
    height: '100%',
    borderRadius: 10,
  },
  noticeBox: { backgroundColor: COLORS.warningLight, padding: 13, borderRadius: 12, marginTop: 18 },
  noticeText: { fontSize: 11, lineHeight: 18, color: COLORS.textSecondary },
});
