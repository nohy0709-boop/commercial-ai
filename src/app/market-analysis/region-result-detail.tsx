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

      {/* ③ 핵심 지표 */}
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

      {/* 지역 환경 상세 (숫자 나열, 접어두기) */}
      <View style={styles.sectionBox}>
        <Text style={styles.sectionTitle}>지역 환경 상세</Text>
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

      {/* ⑥ AI 분석 이유 (구조화) */}
      <View style={styles.sectionBox}>
        <Text style={styles.sectionTitle}>AI 분석 요약</Text>

        {aiLoading && (
          <View style={styles.smallLoadingBox}>
            <ActivityIndicator size="small" color={COLORS.primary} />
            <Text style={styles.smallLoadingText}>
              AI가 분석하는 중...
            </Text>
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
  sectionDescription: { fontSize: 12, color: COLORS.textSecondary, marginBottom: 12 },

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