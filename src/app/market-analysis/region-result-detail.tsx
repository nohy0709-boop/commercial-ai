import { businessCategories } from '@/constants/businessTypes';
import { COLORS } from '@/constants/colors';
import { sejongAreas } from '@/constants/sejongAreas';

import type { AIExplanation } from '@/services/aiExplanation';
import { generateAIExplanation } from '@/services/aiExplanation';
import type { NearbyStore } from '@/services/storeApi';
import { getStoreList } from '@/services/storeApi';

import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';

import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import Svg, { Circle, Line, Polyline, Text as SvgText } from 'react-native-svg';

// AI 응답 안의 **단어** 표시를, 실제로 굵고 강조된 글씨로 렌더링합니다.
function renderEmphasizedText(text: string, textStyle: object) {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return (
    <Text style={textStyle}>
      {parts.map((part, index) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return (
            <Text key={index} style={styles.aiHighlight}>
              {part.slice(2, -2)}
            </Text>
          );
        }
        return part;
      })}
    </Text>
  );
}

function formatChangeRate(value: number) {
  if (Number.isNaN(value)) {
    return '데이터 없음';
  }
  return `${value > 0 ? '+' : ''}${value.toFixed(2)}%`;
}

// 점수를 매길 때 쓴 8개 지표를, 화면에서 다루기 좋게 3개 범주로 묶었습니다.
const METRIC_GROUPS = [
  {
    key: 'population',
    label: '인구 지표',
    metrics: [
      { key: 'floatingPopulationScore', label: '유동인구' },
      { key: 'livingPopulationScore', label: '생활인구' },
      { key: 'floatingPopulationChangeScore', label: '유동인구 증가세' },
      { key: 'livingPopulationChangeScore', label: '생활인구 증가세' },
    ],
  },
  {
    key: 'sales',
    label: '소비 지표',
    metrics: [
      { key: 'salesScore', label: '전체 소비' },
      { key: 'averageSalesScore', label: '점포당 소비' },
    ],
  },
  {
    key: 'environment',
    label: '환경 지표',
    metrics: [
      { key: 'competitionScore', label: '경쟁 여유도' },
      { key: 'accessibilityScore', label: '교통 접근성' },
    ],
  },
];

const CHART_COLORS = [
  '#1D4ED8',
  '#F59E0B',
  '#10B981',
  '#EF4444',
  '#8B5CF6',
  '#0EA5E9',
];

type CompareItem = {
  areaName: string;
  rank: number;
  [scoreKey: string]: number | string;
};

// 여러 지역을 하나의 선그래프로 비교합니다 (온도 그래프처럼, 지역마다 선 하나씩).
function MultiAreaLineChart({
  metrics,
  series,
}: {
  metrics: { key: string; label: string }[];
  series: { name: string; color: string; values: number[] }[];
}) {
  const W = 300;
  const H = 170;
  const padLeft = 22;
  const padRight = 10;
  const padTop = 14;
  const padBottom = 30;
  const plotW = W - padLeft - padRight;
  const plotH = H - padTop - padBottom;

  const xFor = (i: number) =>
    metrics.length > 1
      ? padLeft + (i / (metrics.length - 1)) * plotW
      : padLeft + plotW / 2;
  const yFor = (v: number) =>
    padTop + plotH - (Math.max(0, Math.min(100, v)) / 100) * plotH;

  const gridLines = [0, 50, 100];

  return (
    <View>
      <View style={styles.legendRow}>
        {series.map(s => (
          <View key={s.name} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: s.color }]} />
            <Text style={styles.legendText}>{s.name}</Text>
          </View>
        ))}
      </View>

      <Svg width="100%" height={190} viewBox={`0 0 ${W} ${H}`}>
        {gridLines.map(g => (
          <Line
            key={g}
            x1={padLeft}
            x2={W - padRight}
            y1={yFor(g)}
            y2={yFor(g)}
            stroke="#E5E7EB"
            strokeWidth={1}
          />
        ))}

        {series.map(s => (
          <Polyline
            key={s.name}
            points={s.values.map((v, i) => `${xFor(i)},${yFor(v)}`).join(' ')}
            fill="none"
            stroke={s.color}
            strokeWidth={2}
          />
        ))}

        {series.map(s =>
          s.values.map((v, i) => (
            <Circle
              key={`${s.name}-${i}`}
              cx={xFor(i)}
              cy={yFor(v)}
              r={3}
              fill={s.color}
            />
          )),
        )}

        {metrics.map((m, i) => (
          <SvgText
            key={m.key}
            x={xFor(i)}
            y={H - 8}
            fontSize="9"
            fill="#6B7280"
            textAnchor="middle"
          >
            {m.label}
          </SvgText>
        ))}
      </Svg>
    </View>
  );
}

export default function RegionResultDetailScreen() {
  const params = useLocalSearchParams<{
    businessName: string;
    areaName: string;
    rank: string;
    totalCount: string;
    suitabilityScore: string;
    floatingPopulation: string;
    livingPopulation: string;
    storeCount: string;
    competitionDensity: string;
    salesAmount: string;
    averageSalesPerStore: string;
    busStopCount: string;
    livingPopulationChangeRate: string;
    floatingPopulationChangeRate: string;
    compareData: string;
  }>();

  const {
    businessName,
    areaName,
    rank,
    totalCount,
    suitabilityScore,
    floatingPopulation,
    livingPopulation,
    storeCount,
    competitionDensity,
    salesAmount,
    averageSalesPerStore,
    busStopCount,
    livingPopulationChangeRate,
    floatingPopulationChangeRate,
    compareData,
  } = params;

  const area = sejongAreas.find(item => item.name === areaName);
  const business = businessCategories
    .flatMap(category => category.businesses)
    .find(item => item.name === businessName);

  const [explanation, setExplanation] = useState<AIExplanation | null>(null);
  const [aiLoading, setAiLoading] = useState(true);
  const [aiError, setAiError] = useState('');
  const [detailExpanded, setDetailExpanded] = useState(false);

  const [nearbyStores, setNearbyStores] = useState<NearbyStore[]>([]);
  const [storesLoading, setStoresLoading] = useState(true);
  const [storesError, setStoresError] = useState('');

  const [rawNumbersExpanded, setRawNumbersExpanded] = useState(false);
  const [activeMetricGroup, setActiveMetricGroup] = useState(
    METRIC_GROUPS[0].key,
  );

  useEffect(() => {
    const run = async () => {
      try {
        setAiLoading(true);
        setAiError('');
        const result = await generateAIExplanation({
          지역: areaName,
          업종: businessName,
          유동인구: Number(floatingPopulation),
          생활인구: Number(livingPopulation),
          점포수: Number(storeCount),
          경쟁밀도: Number(competitionDensity),
          전체카드소비: Number(salesAmount),
          점포당카드소비: Number(averageSalesPerStore),
          버스정류장수: Number(busStopCount),
          적합도점수: Number(suitabilityScore),
          순위: Number(rank),
        });
        setExplanation(result);
      } catch (error) {
        console.error('AI 설명 생성 오류:', error);
        setAiError(
          error instanceof Error
            ? error.message
            : 'AI 설명을 가져오지 못했습니다.',
        );
      } finally {
        setAiLoading(false);
      }
    };

    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!area || !business) {
      setStoresLoading(false);
      return;
    }

    const run = async () => {
      try {
        setStoresLoading(true);
        setStoresError('');
        const stores = await getStoreList(
          area.code,
          business.lclsCode,
          business.mclsCode,
          business.sclsCode,
          10,
        );
        setNearbyStores(stores);
      } catch (error) {
        console.error('주변 점포 조회 오류:', error);
        setStoresError(
          error instanceof Error
            ? error.message
            : '주변 점포 정보를 가져오지 못했습니다.',
        );
      } finally {
        setStoresLoading(false);
      }
    };

    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 비교 데이터 파싱 (최대 5개 + 지금 보고 있는 지역은 항상 포함)
  let compareItems: CompareItem[] = [];
  try {
    compareItems = JSON.parse(compareData || '[]');
  } catch (error) {
    console.error('비교 데이터 파싱 오류:', error);
  }

  let chartItems = compareItems.slice(0, 5);
  if (!chartItems.find(item => item.areaName === areaName)) {
    const current = compareItems.find(item => item.areaName === areaName);
    if (current) {
      chartItems = [...chartItems, current];
    }
  }

  const activeGroup =
    METRIC_GROUPS.find(group => group.key === activeMetricGroup) ??
    METRIC_GROUPS[0];

  const chartSeries = chartItems.map((item, index) => ({
    name: `${item.rank}위 ${item.areaName}`,
    color: CHART_COLORS[index % CHART_COLORS.length],
    values: activeGroup.metrics.map(m => Number(item[m.key]) || 0),
  }));

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* ① 선택한 위치/업종 */}
      <View style={styles.headerCard}>
        <View style={styles.headerTopRow}>
          <View style={styles.rankPill}>
            <Text style={styles.rankPillText}>{rank}위</Text>
          </View>
          <Text style={styles.headerSubText}>
            {`${businessName} 후보 ${totalCount}곳 중`}
          </Text>
        </View>
        <Text style={styles.headerTitle}>{`${areaName} 일대`}</Text>
        <Text style={styles.headerBusiness}>{businessName}</Text>
        <View style={styles.scoreRow}>
          <Text style={styles.scoreLabel}>종합 적합도</Text>
          <Text style={styles.scoreValue}>{suitabilityScore}</Text>
          <Text style={styles.scoreUnit}>/ 100</Text>
        </View>
      </View>

      {/* ③ 핵심 지표 (요약 4개) */}
      <View style={styles.metricGrid}>
        <View style={styles.metricBox}>
          <Text style={styles.metricLabel}>유동인구</Text>
          <Text style={styles.metricValue}>
            {Number(floatingPopulation).toLocaleString()}명
          </Text>
        </View>
        <View style={styles.metricBox}>
          <Text style={styles.metricLabel}>{`${businessName} 수`}</Text>
          <Text style={styles.metricValue}>{storeCount}개</Text>
        </View>
        <View style={styles.metricBox}>
          <Text style={styles.metricLabel}>경쟁밀도</Text>
          <Text style={styles.metricValue}>
            {Number(competitionDensity).toFixed(3)}
          </Text>
        </View>
        <View style={styles.metricBox}>
          <Text style={styles.metricLabel}>점포당 카드소비</Text>
          <Text style={styles.metricValue}>
            {Math.round(Number(averageSalesPerStore)).toLocaleString()}원
          </Text>
        </View>
      </View>

      {/* 핵심 지표 분석: 다른 후보 지역들과 비교하는 선그래프 */}
      <View style={styles.sectionBox}>
        <Text style={styles.sectionTitle}>다른 후보와 비교</Text>
        <Text style={styles.sectionDescription}>
          같이 분석한 다른 지역들과 점수를 비교해봤어요 (0~100점).
        </Text>

        <View style={styles.tabRow}>
          {METRIC_GROUPS.map(group => {
            const isActive = activeMetricGroup === group.key;
            return (
              <TouchableOpacity
                key={group.key}
                style={[styles.tabButton, isActive && styles.tabButtonActive]}
                activeOpacity={0.7}
                onPress={() => setActiveMetricGroup(group.key)}
              >
                <Text
                  style={[
                    styles.tabButtonText,
                    isActive && styles.tabButtonTextActive,
                  ]}
                >
                  {group.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {chartSeries.length > 0 && (
          <MultiAreaLineChart metrics={activeGroup.metrics} series={chartSeries} />
        )}

        <TouchableOpacity
          style={styles.detailToggleButton}
          activeOpacity={0.7}
          onPress={() => setRawNumbersExpanded(prev => !prev)}
        >
          <Text style={styles.detailToggleText}>
            {rawNumbersExpanded ? '실제 수치 접기 ▲' : '실제 수치로 보기 ▼'}
          </Text>
        </TouchableOpacity>

        {rawNumbersExpanded && (
          <View style={styles.aiDetailSection}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>생활인구</Text>
              <Text style={styles.detailValue}>
                {Number(livingPopulation).toLocaleString()}명
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>생활인구 증감률</Text>
              <Text style={styles.detailValue}>
                {formatChangeRate(Number(livingPopulationChangeRate))}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>유동인구 증감률</Text>
              <Text style={styles.detailValue}>
                {formatChangeRate(Number(floatingPopulationChangeRate))}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>전체 카드소비</Text>
              <Text style={styles.detailValue}>
                {Number(salesAmount).toLocaleString()}원
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>버스정류장</Text>
              <Text style={styles.detailValue}>{busStopCount}개</Text>
            </View>
          </View>
        )}
      </View>

      {/* ④ 지도 + ⑤ 주변 실제 점포 */}
      <View style={styles.sectionBox}>
        <Text style={styles.sectionTitle}>주변 실제 {businessName} 매장</Text>
        <Text style={styles.sectionDescription}>
          공공데이터에 등록된 이 지역의 실제 매장 정보예요.
        </Text>

        {Platform.OS !== 'web' && nearbyStores.length > 0 && (
          <NativeStoreMap stores={nearbyStores} />
        )}

        {storesLoading && (
          <View style={styles.smallLoadingBox}>
            <ActivityIndicator size="small" color={COLORS.primary} />
            <Text style={styles.smallLoadingText}>
              주변 매장 정보를 불러오는 중...
            </Text>
          </View>
        )}

        {!storesLoading && storesError !== '' && (
          <Text style={styles.storesError}>{storesError}</Text>
        )}

        {!storesLoading && storesError === '' && nearbyStores.length === 0 && (
          <Text style={styles.storesEmpty}>
            등록된 매장 정보를 찾지 못했어요.
          </Text>
        )}

        {!storesLoading &&
          nearbyStores.map((store, index) => (
            <View key={index} style={styles.storeRow}>
              <Text style={styles.storeName}>{store.name}</Text>
              <Text style={styles.storeAddress}>{store.address}</Text>
            </View>
          ))}
      </View>

      {/* ⑥ AI 분석 이유 (구조화) */}
      <View style={styles.sectionBox}>
        <Text style={styles.sectionTitle}>AI 분석 요약</Text>

        {aiLoading && (
          <View style={styles.smallLoadingBox}>
            <ActivityIndicator size="small" color={COLORS.primary} />
            <Text style={styles.smallLoadingText}>AI가 분석하는 중...</Text>
          </View>
        )}

        {!aiLoading && aiError !== '' && (
          <Text style={styles.storesError}>{aiError}</Text>
        )}

        {!aiLoading && explanation && (
          <>
            {renderEmphasizedText(
              explanation.recommendationReason,
              styles.aiReasonText,
            )}

            <View style={styles.chunkList}>
              {explanation.advantages.map((advantage, index) => (
                <View key={`adv-${index}`} style={styles.chunkRowGood}>
                  <Text style={styles.chunkIconGood}>✓</Text>
                  {renderEmphasizedText(advantage, styles.chunkTextGood)}
                </View>
              ))}
              {explanation.risks.map((risk, index) => (
                <View key={`risk-${index}`} style={styles.chunkRowWarn}>
                  <Text style={styles.chunkIconWarn}>!</Text>
                  {renderEmphasizedText(risk, styles.chunkTextWarn)}
                </View>
              ))}
            </View>

            <TouchableOpacity
              style={styles.detailToggleButton}
              activeOpacity={0.7}
              onPress={() => setDetailExpanded(prev => !prev)}
            >
              <Text style={styles.detailToggleText}>
                {detailExpanded
                  ? 'AI 상세 분석 접기 ▲'
                  : 'AI 상세 분석 더보기 ▼'}
              </Text>
            </TouchableOpacity>

            {detailExpanded && (
              <View style={styles.aiDetailSection}>
                <Text style={styles.aiLabel}>주요 특징</Text>
                {renderEmphasizedText(
                  explanation.keyFeatures,
                  styles.aiReasonText,
                )}

                <Text style={styles.aiLabel}>고려사항</Text>
                <Text style={styles.aiReasonText}>
                  {explanation.considerations}
                </Text>
              </View>
            )}
          </>
        )}
      </View>
    </ScrollView>
  );
}

// 네이티브(폰)에서만 지도를 렌더링합니다. react-native-maps는 웹에서 동작하지 않아요.
function NativeStoreMap({ stores }: { stores: NearbyStore[] }) {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const MapView = require('react-native-maps').default;
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { Marker } = require('react-native-maps');

  const center = stores[0];

  return (
    <MapView
      style={styles.map}
      initialRegion={{
        latitude: center.lat,
        longitude: center.lng,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      }}
    >
      {stores.map((store, index) => (
        <Marker
          key={index}
          coordinate={{ latitude: store.lat, longitude: store.lng }}
          title={store.name}
          description={store.address}
        />
      ))}
    </MapView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },
  container: { padding: 20, paddingBottom: 40 },

  headerCard: {
    backgroundColor: '#111111',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  rankPill: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  rankPillText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },
  headerSubText: { color: '#9CA3AF', fontSize: 12 },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '900',
    marginBottom: 4,
  },
  headerBusiness: { color: '#D1D5DB', fontSize: 14, marginBottom: 16 },
  scoreRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 6 },
  scoreLabel: { color: '#9CA3AF', fontSize: 12, marginBottom: 4 },
  scoreValue: { color: COLORS.neonLime, fontSize: 30, fontWeight: '900' },
  scoreUnit: { color: '#9CA3AF', fontSize: 13, marginBottom: 4 },

  metricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  metricBox: {
    width: '47%',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    padding: 14,
  },
  metricLabel: { fontSize: 11, color: COLORS.textSecondary, marginBottom: 6 },
  metricValue: { fontSize: 15, fontWeight: '800', color: COLORS.text },

  sectionBox: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: COLORS.text, marginBottom: 4 },
  sectionDescription: { fontSize: 12, color: COLORS.textSecondary, marginBottom: 14 },

  tabRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  tabButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tabButtonActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  tabButtonText: { fontSize: 12, fontWeight: '700', color: COLORS.textSecondary },
  tabButtonTextActive: { color: '#FFFFFF' },

  legendRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 6 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 11, color: COLORS.textSecondary, fontWeight: '600' },

  map: { width: '100%', height: 200, borderRadius: 14, marginBottom: 12 },

  smallLoadingBox: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10 },
  smallLoadingText: { fontSize: 12, color: COLORS.textSecondary },
  storesError: { fontSize: 12, color: '#D14343' },
  storesEmpty: { fontSize: 12, color: COLORS.textSecondary },

  storeRow: {
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  storeName: { fontSize: 13, fontWeight: '700', color: COLORS.text },
  storeAddress: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },

  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  detailLabel: { fontSize: 13, color: COLORS.textSecondary },
  detailValue: { fontSize: 13, fontWeight: '800', color: COLORS.text },

  aiReasonText: { fontSize: 13, lineHeight: 20, color: COLORS.text },
  aiHighlight: { fontWeight: '900', color: COLORS.primary },

  chunkList: { marginTop: 12, gap: 8 },
  chunkRowGood: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#F1FFF5',
    borderRadius: 10,
    padding: 10,
  },
  chunkIconGood: { color: '#1B9C4F', fontWeight: '900', fontSize: 13 },
  chunkTextGood: { flex: 1, fontSize: 12, lineHeight: 18, color: '#1B4332' },
  chunkRowWarn: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#FFF8E8',
    borderRadius: 10,
    padding: 10,
  },
  chunkIconWarn: { color: '#B45309', fontWeight: '900', fontSize: 13 },
  chunkTextWarn: { flex: 1, fontSize: 12, lineHeight: 18, color: '#7C4A03' },

  detailToggleButton: { marginTop: 14, alignItems: 'center' },
  detailToggleText: { fontSize: 12, fontWeight: '700', color: COLORS.textSecondary },
  aiDetailSection: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  aiLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.textSecondary,
    marginTop: 8,
    marginBottom: 4,
  },
});