import { businessCategories } from '@/constants/businessTypes';
import { COLORS } from '@/constants/colors';
import { sejongAreas } from '@/constants/sejongAreas';

import type { ScoredCommercialAnalysisResult } from '@/services/commercialAnalysis';
import {
  analyzeCommercialArea,
  calculateSuitabilityScores,
} from '@/services/commercialAnalysis';

import { generateAIExplanation } from '@/services/aiExplanation';

import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';

import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

type RankedResult = ScoredCommercialAnalysisResult & {
  rank: number;
};

type GroupedResult = {
  businessName: string;
  items: RankedResult[];
};

const delay = (ms: number) =>
  new Promise(resolve => setTimeout(resolve, ms));

// 0~100점 점수를 사람이 읽기 편한 등급 문구로 바꿔줍니다. (숫자를 지어내지 않고, 이미 계산된 점수를 등급화만 함)
function getLevelLabel(score: number): string {
  if (score >= 75) return '매우 높음';
  if (score >= 50) return '높음';
  if (score >= 25) return '보통';
  return '낮음';
}

export default function RegionResultScreen() {
  const router = useRouter();
  const { businesses, areas } = useLocalSearchParams<{
    businesses: string;
    areas: string;
  }>();

  const [groupedResults, setGroupedResults] = useState<GroupedResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  // 각 업종 그룹의 1위 지역에 대해서만 AI 한줄 요약을 자동으로 가져옵니다.
  const [topAiSummary, setTopAiSummary] = useState<Record<string, string>>({});
  const [topAiLoading, setTopAiLoading] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!businesses || !areas) {
      setErrorMessage('선택한 업종 또는 지역 정보를 찾을 수 없습니다.');
      setLoading(false);
      return;
    }

    const selectedBusinessNames = businesses.split(',');
    const selectedAreaNames = areas.split(',');

    const allBusinesses = businessCategories.flatMap(
      category => category.businesses,
    );
    const targetBusinesses = allBusinesses.filter(business =>
      selectedBusinessNames.includes(business.name),
    );
    const targetAreas = sejongAreas.filter(area =>
      selectedAreaNames.includes(area.name),
    );

    const run = async () => {
      try {
        setLoading(true);
        setErrorMessage('');
        setGroupedResults([]);

        const groups: GroupedResult[] = [];

        for (const business of targetBusinesses) {
          const analysisResults: ScoredCommercialAnalysisResult[] = [];

          for (const area of targetAreas) {
            try {
              const result = await analyzeCommercialArea(
                area.name,
                area.code,
                business.name,
                business.lclsCode,
                business.mclsCode,
                business.sclsCode,
              );
              analysisResults.push(result as ScoredCommercialAnalysisResult);
              await delay(600);
            } catch (error) {
              console.error(`${area.name} ${business.name} 분석 실패`, error);
              if (error instanceof Error && error.message.includes('429')) {
                await delay(2000);
              }
            }
          }

          if (analysisResults.length === 0) {
            continue;
          }

          const scoredResults = calculateSuitabilityScores(analysisResults);
          groups.push({
            businessName: business.name,
            items: scoredResults.map((result, index) => ({
              ...result,
              rank: index + 1,
            })),
          });

          await delay(800);
        }

        if (groups.length === 0) {
          setErrorMessage(
            '분석 결과를 가져오지 못했습니다. 잠시 후 다시 시도해주세요.',
          );
          return;
        }

        setGroupedResults(groups);

        // 각 업종 그룹의 1위 지역에 대해 AI 요약을 자동으로 요청합니다 (그룹당 1번만).
        groups.forEach(group => {
          const top = group.items[0];
          if (!top) return;

          setTopAiLoading(prev => ({ ...prev, [group.businessName]: true }));

          generateAIExplanation({
            지역: top.areaName,
            업종: group.businessName,
            유동인구: top.floatingPopulation,
            생활인구: top.livingPopulation,
            점포수: top.storeCount,
            경쟁밀도: top.competitionDensity,
            전체카드소비: top.salesAmount,
            점포당카드소비: top.averageSalesPerStore,
            버스정류장수: top.busStopCount,
            적합도점수: top.suitabilityScore,
            순위: top.rank,
          })
            .then(explanation => {
              setTopAiSummary(prev => ({
                ...prev,
                [group.businessName]: explanation.recommendationReason,
              }));
            })
            .catch(error => {
              console.error('AI 요약 생성 오류:', error);
            })
            .finally(() => {
              setTopAiLoading(prev => ({
                ...prev,
                [group.businessName]: false,
              }));
            });
        });
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
  }, [businesses, areas]);

  const handleCardPress = (businessName: string, result: RankedResult, totalCount: number) => {
    router.push({
      pathname: '/market-analysis/region-result-detail',
      params: {
        businessName,
        areaName: result.areaName,
        rank: String(result.rank),
        totalCount: String(totalCount),
        suitabilityScore: String(result.suitabilityScore),
        floatingPopulation: String(result.floatingPopulation),
        livingPopulation: String(result.livingPopulation),
        storeCount: String(result.storeCount),
        competitionDensity: String(result.competitionDensity),
        salesAmount: String(result.salesAmount),
        averageSalesPerStore: String(result.averageSalesPerStore),
        busStopCount: String(result.busStopCount),
        livingPopulationChangeRate: String(result.livingPopulationChangeRate),
        floatingPopulationChangeRate: String(
          result.floatingPopulationChangeRate,
        ),
      },
    });
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.headerBackground}>
        <Text style={styles.title}>분석 결과</Text>
        <Text style={styles.subTitle}>
          업종별 지역 적합도 순위를 확인해보세요
        </Text>
      </View>

      {loading && (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>상권 데이터를 분석하는 중...</Text>
          <Text style={styles.loadingSubText}>
            여러 업종이나 지역을 선택한 경우 시간이 걸릴 수 있어요.
          </Text>
        </View>
      )}

      {!loading && errorMessage !== '' && (
        <View style={styles.errorBox}>
          <Text style={styles.errorTitle}>분석 결과를 불러오지 못했어요</Text>
          <Text style={styles.error}>{errorMessage}</Text>
        </View>
      )}

      {!loading &&
        errorMessage === '' &&
        groupedResults.map(group => (
          <View key={group.businessName} style={styles.businessSection}>
            <View style={styles.businessHeader}>
              <Text style={styles.businessSmallTitle}>선택 업종</Text>
              <Text style={styles.businessTitle}>{group.businessName}</Text>
            </View>

            {/* AI 추천 요약 콜아웃 (1위 지역 기준) */}
            {(topAiLoading[group.businessName] ||
              topAiSummary[group.businessName]) && (
              <View style={styles.aiCallout}>
                <Text style={styles.aiCalloutTitle}>
                  ✨ 이런 지역이 가장 적합해요!
                </Text>
                {topAiLoading[group.businessName] ? (
                  <View style={styles.aiCalloutLoading}>
                    <ActivityIndicator size="small" color={COLORS.primary} />
                    <Text style={styles.aiCalloutLoadingText}>
                      AI가 요약하는 중...
                    </Text>
                  </View>
                ) : (
                  <Text style={styles.aiCalloutText}>
                    {topAiSummary[group.businessName]}
                  </Text>
                )}
              </View>
            )}

            {group.items.map(result => {
              const isFirst = result.rank === 1;

              return (
                <Pressable
                  key={result.areaName}
                  style={[styles.card, isFirst && styles.firstCard]}
                  onPress={() =>
                    handleCardPress(
                      group.businessName,
                      result,
                      group.items.length,
                    )
                  }
                >
                  <View
                    style={[
                      styles.rankBadge,
                      isFirst && styles.rankBadgeFirst,
                    ]}
                  >
                    <Text
                      style={[styles.rankText, isFirst && styles.rankTextFirst]}
                    >
                      {result.rank}
                    </Text>
                  </View>

                  <View style={styles.cardBody}>
                    <View style={styles.cardTopRow}>
                      <Text style={styles.areaName}>
                        {result.areaName} 일대
                      </Text>
                      <View style={styles.scoreBox}>
                        <Text style={styles.scoreValue}>
                          {result.suitabilityScore}
                        </Text>
                        <Text style={styles.scoreUnit}>점</Text>
                      </View>
                    </View>

                    <View style={styles.tagRow}>
                      <View style={styles.tag}>
                        <Text style={styles.tagText}>
                          유동인구{' '}
                          {getLevelLabel(result.floatingPopulationScore)}
                        </Text>
                      </View>
                      <View style={styles.tag}>
                        <Text style={styles.tagText}>
                          {group.businessName} {result.storeCount}개
                        </Text>
                      </View>
                    </View>
                  </View>

                  <Text style={styles.arrow}>›</Text>
                </Pressable>
              );
            })}
          </View>
        ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  container: {
    padding: 20,
    paddingBottom: 40,
  },

  headerBackground: {
    marginBottom: 20,
  },

  title: {
    fontSize: 26,
    fontWeight: '900',
    color: COLORS.text,
    marginBottom: 6,
  },

  subTitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },

  loadingBox: {
    marginTop: 40,
    padding: 28,
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  loadingText: {
    marginTop: 14,
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.text,
  },

  loadingSubText: {
    marginTop: 6,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    color: COLORS.textSecondary,
  },

  errorBox: {
    padding: 18,
    borderRadius: 18,
    backgroundColor: '#FFF3F3',
  },

  errorTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#B42318',
    marginBottom: 6,
  },

  error: {
    fontSize: 13,
    lineHeight: 19,
    color: '#D14343',
  },

  businessSection: {
    marginBottom: 26,
  },

  businessHeader: {
    marginBottom: 14,
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderRadius: 18,
    backgroundColor: '#111111',
  },

  businessSmallTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9CA3AF',
    marginBottom: 4,
  },

  businessTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
  },

  aiCallout: {
    marginBottom: 14,
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#F1FFF5',
    borderWidth: 1,
    borderColor: '#D8F5E2',
  },

  aiCalloutTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.primary,
    marginBottom: 6,
  },

  aiCalloutText: {
    fontSize: 13,
    lineHeight: 19,
    color: COLORS.text,
  },

  aiCalloutLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  aiCalloutLoadingText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    marginBottom: 10,
    borderRadius: 16,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  firstCard: {
    borderColor: COLORS.primary,
    backgroundColor: '#FFFFFF',
  },

  rankBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.lightGray,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  rankBadgeFirst: {
    backgroundColor: COLORS.primary,
  },

  rankText: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.textSecondary,
  },

  rankTextFirst: {
    color: '#FFFFFF',
  },

  cardBody: {
    flex: 1,
  },

  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },

  areaName: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text,
    flexShrink: 1,
  },

  scoreBox: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginLeft: 8,
  },

  scoreValue: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.primary,
  },

  scoreUnit: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.text,
    marginLeft: 1,
    marginBottom: 2,
  },

  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },

  tag: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: COLORS.background,
  },

  tagText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },

  arrow: {
    fontSize: 24,
    color: COLORS.textSecondary,
    marginLeft: 8,
  },
});