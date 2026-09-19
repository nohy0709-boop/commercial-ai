import { COLORS } from '@/constants/colors';
import { sejongAreas } from '@/constants/sejongAreas';
import type { AIExplanation } from '@/services/aiExplanation';
import { generateAIExplanation } from '@/services/aiExplanation';
import type { ScoredCommercialAnalysisResult } from '@/services/commercialAnalysis';
import {
  analyzeCommercialArea,
  calculateSuitabilityScores,
} from '@/services/commercialAnalysis';
import type { Coordinates } from '@/services/geocoding';
import { searchLocation } from '@/services/geocoding';
import { useLocalSearchParams, useRouter } from 'expo-router';
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

type RankedResult = ScoredCommercialAnalysisResult & {rank: number};

const delay = (ms: number) =>
  new Promise(resolve => setTimeout(resolve, ms));

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

// 점수가 같으면 같은 순위를 부여합니다 (예: 1위, 1위, 3위 — 근거 없이 임의로 순서를 나누지 않기 위함).
function assignRanksWithTies(
  sortedResults: ScoredCommercialAnalysisResult[],
): RankedResult[] {
  const ranked: RankedResult[] = [];
  sortedResults.forEach((item, index) => {
    const rank =
      index > 0 &&
      sortedResults[index - 1].suitabilityScore === item.suitabilityScore
        ? ranked[index - 1].rank
        : index + 1;
    ranked.push({...item, rank});
  });
  return ranked;
}

// 같은 순위를 가진 항목이 2개 이상이면 "공동 N위"로 표시합니다.
function getRankLabel(item: RankedResult, allResults: RankedResult[]) {
  const tiedCount = allResults.filter(r => r.rank === item.rank).length;
  return tiedCount > 1 ? `공동 ${item.rank}위` : `${item.rank}위`;
}

function getLevelLabel(score: number): string {
  if (score >= 75) return '매우 높음';
  if (score >= 50) return '높음';
  if (score >= 25) return '보통';
  return '낮음';
}

function getCompetitionLabel(score: number): string {
  if (score >= 75) return '경쟁 여유';
  if (score >= 50) return '경쟁 보통';
  if (score >= 25) return '경쟁 있음';
  return '경쟁 치열';
}

// 네이티브(폰)에서만 지도를 렌더링합니다. react-native-maps는 웹에서 동작하지 않아요.
function CardMapThumbnail({ coords }: { coords: Coordinates | undefined }) {
  if (Platform.OS === 'web' || !coords) {
    return (
      <View style={styles.mapFallback}>
        <Text style={styles.mapFallbackText}>📍</Text>
      </View>
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const MapView = require('react-native-maps').default;
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { Marker } = require('react-native-maps');

  return (
    <MapView
      style={styles.cardMap}
      pointerEvents="none"
      scrollEnabled={false}
      zoomEnabled={false}
      pitchEnabled={false}
      rotateEnabled={false}
      initialRegion={{
        latitude: coords.lat,
        longitude: coords.lng,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      }}
    >
      <Marker coordinate={{ latitude: coords.lat, longitude: coords.lng }} />
    </MapView>
  );
}

export default function ResultScreen() {
  const router = useRouter();

  const {businessName, lclsCode, mclsCode, sclsCode, areas} =
    useLocalSearchParams<{
      businessName: string;
      lclsCode: string;
      mclsCode: string;
      sclsCode: string;
      areas: string;
    }>();

  const [results, setResults] = useState<RankedResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const [areaCoordinates, setAreaCoordinates] = useState<
    Record<string, Coordinates>
  >({});

  const [aiExplanations, setAiExplanations] = useState<
    Record<string, AIExplanation>
  >({});
  const [aiLoadingKeys, setAiLoadingKeys] = useState<Record<string, boolean>>(
    {},
  );
  const [aiErrorKeys, setAiErrorKeys] = useState<Record<string, string>>({});
  // 카드별로 "상세 설명" 펼침 여부를 따로 관리합니다.
  const [detailExpandedKeys, setDetailExpandedKeys] = useState<
    Record<string, boolean>
  >({});

  useEffect(() => {
    const selectedAreaNames = areas.split(',');
    const targets = sejongAreas.filter(area =>
      selectedAreaNames.includes(area.name),
    );

    // 카드에 쓸 각 지역의 실제 좌표를 미리 가져옵니다.
    Promise.all(
      targets.map(async area => {
        try {
          const coords = await searchLocation(`세종특별자치시 ${area.name}`);
          return [area.name, coords] as const;
        } catch (error) {
          console.error(`${area.name} 좌표 조회 실패`, error);
          return [area.name, null] as const;
        }
      }),
    ).then(results => {
      const map: Record<string, Coordinates> = {};
      results.forEach(([name, coords]) => {
        if (coords) map[name] = coords;
      });
      setAreaCoordinates(map);
    });

    const run = async () => {
      try {
        setLoading(true);
        setErrorMessage('');
        setResults([]);

        const analysisResults = [];

        for (const area of targets) {
          try {
            const result = await analyzeCommercialArea(
              area.name,
              area.code,
              businessName,
              lclsCode,
              mclsCode || undefined,
              sclsCode || undefined,
            );
            analysisResults.push(result);
            await delay(600);
          } catch (error) {
            console.error(`${area.name} 분석 실패`, error);
            if (error instanceof Error && error.message.includes('429')) {
              await delay(2000);
            }
          }
        }

        if (analysisResults.length === 0) {
          setErrorMessage(
            '분석 결과를 가져오지 못했습니다. 잠시 후 다시 시도해주세요.',
          );
          return;
        }

        const scoredResults = calculateSuitabilityScores(analysisResults);
        setResults(assignRanksWithTies(scoredResults));
      } catch (error) {
        console.error('상권 분석 오류:', error);
        setErrorMessage(
          error instanceof Error
            ? error.message
            : '상권 분석 중 오류가 발생했습니다.',
        );
      } finally {
        setLoading(false);
      }
    };

    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessName, lclsCode, mclsCode, sclsCode, areas]);

  const handleGenerateAI = async (item: RankedResult) => {
    const key = item.areaName;
    if (aiExplanations[key] || aiLoadingKeys[key]) {
      return;
    }

    setAiLoadingKeys(prev => ({...prev, [key]: true}));
    setAiErrorKeys(prev => ({...prev, [key]: ''}));

    try {
      const explanation = await generateAIExplanation({
        지역: item.areaName,
        업종: businessName,
        유동인구: item.floatingPopulation,
        생활인구: item.livingPopulation,
        점포수: item.storeCount,
        경쟁밀도: item.competitionDensity,
        전체카드소비: item.salesAmount,
        점포당카드소비: item.averageSalesPerStore,
        버스정류장수: item.busStopCount,
        적합도점수: item.suitabilityScore,
        순위: item.rank,
      });
      setAiExplanations(prev => ({...prev, [key]: explanation}));
    } catch (error) {
      console.error('AI 설명 생성 오류:', error);
      setAiErrorKeys(prev => ({
        ...prev,
        [key]:
          error instanceof Error
            ? error.message
            : 'AI 설명을 가져오지 못했습니다.',
      }));
    } finally {
      setAiLoadingKeys(prev => ({...prev, [key]: false}));
    }
  };

  const toggleDetail = (key: string) => {
    setDetailExpandedKeys(prev => ({...prev, [key]: !prev[key]}));
  };

  return (
    <View style={styles.screen}>
      {/* 상단 앱바 */}
      <View style={styles.appBar}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.backButtonText}>‹</Text>
        </TouchableOpacity>
        <View>
          <Text style={styles.appBarTitle}>적합성 분석 결과</Text>
          <Text style={styles.appBarSubtitle}>
            {businessName} · 지역 {areas ? areas.split(',').filter(Boolean).length : 0}개
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
      <Text style={styles.title}>{`'${businessName}' 지역별 적합도 순위`}</Text>

      {loading && (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>상권 데이터를 분석하는 중...</Text>
        </View>
      )}

      {!loading && errorMessage !== '' && (
        <View style={styles.errorBox}>
          <Text style={styles.error}>{errorMessage}</Text>
        </View>
      )}

      {!loading &&
        errorMessage === '' &&
        results.map(item => {
          const key = item.areaName;
          const explanation = aiExplanations[key];
          const aiLoading = aiLoadingKeys[key];
          const aiError = aiErrorKeys[key];
          const detailExpanded = detailExpandedKeys[key];
          const isFirst = item.rank === 1;

          return (
            <View key={key} style={[styles.card, isFirst && styles.firstCard]}>
              <View style={styles.cardImageWrap}>
                <CardMapThumbnail coords={areaCoordinates[item.areaName]} />
                <View style={[styles.rankBadge, isFirst && styles.rankBadgeFirst]}>
                  <Text style={[styles.rankText, isFirst && styles.rankTextFirst]}>
                    {getRankLabel(item, results)}
                  </Text>
                </View>
              </View>

              <View style={styles.cardBody}>
                <View style={styles.cardTopRow}>
                  <Text style={styles.name}>{item.areaName} 일대</Text>
                  <View style={styles.scoreBox}>
                    <Text style={styles.scoreValue}>{item.suitabilityScore}</Text>
                    <Text style={styles.scoreUnit}>점</Text>
                  </View>
                </View>

                <View style={styles.tagRow}>
                  <View style={styles.tag}>
                    <Text style={styles.tagText}>
                      유동인구 {getLevelLabel(item.floatingPopulationScore)}
                    </Text>
                  </View>
                  <View style={styles.tag}>
                    <Text style={styles.tagText}>
                      {getCompetitionLabel(item.competitionScore)}
                    </Text>
                  </View>
                </View>

                <Text style={styles.metaLine}>
                  {`${businessName} ${item.storeCount}개 · 점포당 카드소비 ${Math.round(
                    item.averageSalesPerStore,
                  ).toLocaleString()}원`}
                </Text>

                {!explanation && (
                  <TouchableOpacity
                    style={styles.aiButton}
                    activeOpacity={0.7}
                    disabled={aiLoading}
                    onPress={() => handleGenerateAI(item)}>
                    {aiLoading ? (
                      <ActivityIndicator size="small" color={COLORS.primary} />
                    ) : (
                      <Text style={styles.aiButtonText}>AI 설명 보기</Text>
                    )}
                  </TouchableOpacity>
                )}

                {aiError && !aiLoading && (
                  <Text style={styles.aiError}>{aiError}</Text>
                )}

                {explanation && (
                  <View style={styles.aiBox}>
                    <View style={styles.aiTitleRow}>
                      <View style={styles.aiIconBox}>
                        <Text style={styles.aiIconText}>✨</Text>
                      </View>
                      <Text style={styles.aiLabel}>AI 추천 이유</Text>
                    </View>

                    {renderEmphasizedText(
                      explanation.recommendationReason,
                      styles.aiText,
                    )}

                    <TouchableOpacity
                      style={styles.detailToggleButton}
                      activeOpacity={0.7}
                      onPress={() => toggleDetail(key)}>
                      <Text style={styles.detailToggleText}>
                        {detailExpanded ? '상세 설명 접기 ▲' : '상세 설명 보기 ▼'}
                      </Text>
                    </TouchableOpacity>

                    {detailExpanded && (
                      <View style={styles.detailSection}>
                        <Text style={styles.detailLabel}>주요 특징</Text>
                        {renderEmphasizedText(
                          explanation.keyFeatures,
                          styles.aiText,
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

                        <Text style={styles.detailLabel}>고려사항</Text>
                        <Text style={styles.aiText}>
                          {explanation.considerations}
                        </Text>
                      </View>
                    )}
                  </View>
                )}
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },

  appBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    marginLeft: -6,
  },
  backButtonText: { fontSize: 26, color: COLORS.text, marginTop: -2 },
  appBarTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  appBarSubtitle: { fontSize: 11, color: COLORS.textSecondary, marginTop: 1 },

  scroll: { flex: 1 },

  container: {
    padding: 20,
    paddingBottom: 40,
  },

  title: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 16,
  },

  loadingBox: {
    marginTop: 30,
    alignItems: 'center',
    gap: 10,
  },

  loadingText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },

  errorBox: {
    padding: 18,
    borderRadius: 18,
    backgroundColor: COLORS.dangerLight,
  },

  error: {
    color: COLORS.danger,
    fontSize: 14,
  },

  card: {
    borderRadius: 18,
    marginBottom: 14,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },

  firstCard: {
    borderColor: COLORS.primary,
    borderWidth: 2,
  },

  cardImageWrap: { position: 'relative' },
  cardMap: { width: '100%', height: 130 },
  mapFallback: {
    width: '100%',
    height: 130,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.lightGray,
  },
  mapFallbackText: { fontSize: 28 },

  rankBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    height: 28,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(17,17,17,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankBadgeFirst: { backgroundColor: COLORS.primary },
  rankText: { fontSize: 12, fontWeight: '800', color: '#FFFFFF' },
  rankTextFirst: { color: '#FFFFFF' },

  cardBody: { padding: 14 },

  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },

  name: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text,
    flexShrink: 1,
  },

  scoreBox: { flexDirection: 'row', alignItems: 'flex-end', marginLeft: 8 },
  scoreValue: { fontSize: 18, fontWeight: '900', color: COLORS.primary },
  scoreUnit: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.text,
    marginLeft: 1,
    marginBottom: 2,
  },

  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  tag: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: COLORS.background,
  },
  tagText: { fontSize: 11, fontWeight: '700', color: COLORS.textSecondary },

  metaLine: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 17,
  },

  aiButton: {
    marginTop: 12,
    paddingVertical: 11,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.primary,
    alignItems: 'center',
  },

  aiButtonText: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.primary,
  },

  aiError: {
    fontSize: 12,
    color: COLORS.danger,
    marginTop: 10,
  },

  aiBox: {
    marginTop: 14,
    padding: 14,
    borderRadius: 14,
    backgroundColor: COLORS.aiLight,
    borderWidth: 1,
    borderColor: 'rgba(14,165,233,0.2)',
  },

  aiTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },

  aiIconBox: {
    width: 24,
    height: 24,
    borderRadius: 8,
    backgroundColor: COLORS.ai,
    alignItems: 'center',
    justifyContent: 'center',
  },

  aiIconText: { fontSize: 11 },

  aiLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.ai,
  },

  aiText: {
    fontSize: 13,
    color: COLORS.text,
    lineHeight: 19,
  },

  aiHighlight: {
    fontWeight: '900',
    color: COLORS.primary,
  },

  detailToggleButton: {
    marginTop: 12,
    alignItems: 'center',
  },

  detailToggleText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },

  detailSection: {
    marginTop: 10,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },

  detailLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.textSecondary,
    marginTop: 8,
    marginBottom: 4,
  },

  chunkList: { marginTop: 8, marginBottom: 4, gap: 8 },
  chunkRowGood: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: COLORS.primaryLight,
    borderRadius: 10,
    padding: 10,
  },
  chunkIconGood: { color: COLORS.primary, fontWeight: '900', fontSize: 13 },
  chunkTextGood: { flex: 1, fontSize: 12, lineHeight: 18, color: COLORS.primaryDark },
  chunkRowWarn: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: COLORS.warningLight,
    borderRadius: 10,
    padding: 10,
  },
  chunkIconWarn: { color: COLORS.warning, fontWeight: '900', fontSize: 13 },
  chunkTextWarn: { flex: 1, fontSize: 12, lineHeight: 18, color: '#7C4A03' },
});