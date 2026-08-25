import { businessCategories } from '@/constants/businessTypes';
import { sejongAreas } from '@/constants/sejongAreas';
import type { ScoredCommercialAnalysisResult } from '@/services/commercialAnalysis';
import {
  analyzeCommercialArea,
  calculateSuitabilityScores,
} from '@/services/commercialAnalysis';
import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

type RankedResult = ScoredCommercialAnalysisResult & {rank: number};

type GroupedResult = {
  businessName: string;
  items: RankedResult[];
};

const delay = (ms: number) =>
  new Promise(resolve => setTimeout(resolve, ms));

function getReasonSummary(result: ScoredCommercialAnalysisResult): string {
  const reasons = [
    {text: '유동인구가 풍부합니다', score: result.floatingPopulationScore},
    {text: '점포당 카드소비가 높습니다', score: result.averageSalesScore},
    {text: '전체 카드소비 규모가 큽니다', score: result.salesScore},
    {text: '경쟁 부담이 비교적 낮습니다', score: result.competitionScore},
    {text: '생활인구가 풍부합니다', score: result.livingPopulationScore},
    {
      text: '생활인구 증가세가 좋습니다',
      score: result.livingPopulationChangeScore,
    },
    {
      text: '유동인구 증가세가 좋습니다',
      score: result.floatingPopulationChangeScore,
    },
    {text: '대중교통 접근성이 좋습니다', score: result.accessibilityScore},
  ];

  return [...reasons]
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(reason => reason.text)
    .join(' · ');
}

function formatChangeRate(value?: number) {
  if (value === undefined || value === null) {
    return '데이터 없음';
  }
  return `${value > 0 ? '+' : ''}${value.toFixed(2)}%`;
}

export default function RegionResultScreen() {
  const {businesses, areas} = useLocalSearchParams<{
    businesses: string;
    areas: string;
  }>();

  const [groupedResults, setGroupedResults] = useState<GroupedResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [expandedKey, setExpandedKey] = useState<string | null>(null);

  useEffect(() => {
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
        setExpandedKey(null);

        const groups: GroupedResult[] = [];

        for (const business of targetBusinesses) {
          const analysisResults = [];

          // API 429(요청 과다) 방지를 위해 Promise.all 대신 지역별로 순차 요청합니다.
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
              analysisResults.push(result);
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

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>업종별 지역 적합도 순위</Text>

      {loading && (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" />
          <Text style={styles.loadingText}>상권 데이터를 분석하는 중...</Text>
          <Text style={styles.loadingSubText}>
            여러 업종/지역을 선택한 경우 시간이 걸릴 수 있어요.
          </Text>
        </View>
      )}

      {!loading && errorMessage !== '' && (
        <Text style={styles.error}>{errorMessage}</Text>
      )}

      {!loading &&
        errorMessage === '' &&
        groupedResults.map(group => (
          <View key={group.businessName} style={styles.businessSection}>
            <View style={styles.businessHeader}>
              <Text style={styles.businessSmallTitle}>선택 업종</Text>
              <Text style={styles.businessTitle}>{group.businessName}</Text>
            </View>

            {group.items.map(result => {
              const key = `${group.businessName}-${result.areaName}`;
              const expanded = expandedKey === key;

              return (
                <Pressable
                  key={key}
                  style={styles.card}
                  onPress={() => setExpandedKey(expanded ? null : key)}>
                  <View style={styles.cardTopRow}>
                    <View style={styles.cardLeft}>
                      <Text style={styles.rank}>{`${result.rank}위`}</Text>
                      <Text style={styles.areaName}>{result.areaName}</Text>
                    </View>
                    <View style={styles.scoreBox}>
                      <Text style={styles.scoreLabel}>적합도</Text>
                      <Text style={styles.scoreValue}>
                        {`${result.suitabilityScore}점`}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.reasonTitle}>추천 이유</Text>
                  <Text style={styles.reasonText}>
                    {getReasonSummary(result)}
                  </Text>

                  <View style={styles.previewRow}>
                    <View style={styles.previewItem}>
                      <Text style={styles.previewLabel}>유동인구</Text>
                      <Text style={styles.previewValue}>
                        {`${result.floatingPopulation.toLocaleString()}명`}
                      </Text>
                    </View>
                    <View style={styles.previewItem}>
                      <Text style={styles.previewLabel}>
                        {`${group.businessName} 수`}
                      </Text>
                      <Text style={styles.previewValue}>
                        {`${result.storeCount}개`}
                      </Text>
                    </View>
                    <View style={styles.previewItem}>
                      <Text style={styles.previewLabel}>경쟁밀도</Text>
                      <Text style={styles.previewValue}>
                        {result.competitionDensity.toFixed(3)}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.expandText}>
                    {expanded ? '상세 정보 접기 ▲' : '상세 정보 보기 ▼'}
                  </Text>

                  {expanded && (
                    <View style={styles.detailContainer}>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>생활인구</Text>
                        <Text style={styles.detailValue}>
                          {`${result.livingPopulation.toLocaleString()}명`}
                        </Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>생활인구 증감률</Text>
                        <Text style={styles.detailValue}>
                          {formatChangeRate(result.livingPopulationChangeRate)}
                        </Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>유동인구 증감률</Text>
                        <Text style={styles.detailValue}>
                          {formatChangeRate(
                            result.floatingPopulationChangeRate,
                          )}
                        </Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>카드소비</Text>
                        <Text style={styles.detailValue}>
                          {`${result.salesAmount.toLocaleString()}원`}
                        </Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>
                          점포당 카드소비액
                        </Text>
                        <Text style={styles.detailValue}>
                          {`${Math.round(
                            result.averageSalesPerStore,
                          ).toLocaleString()}원`}
                        </Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>버스정류장</Text>
                        <Text style={styles.detailValue}>
                          {`${result.busStopCount}개`}
                        </Text>
                      </View>

                      <View style={styles.divider} />

                      <View style={styles.finalScoreBox}>
                        <Text style={styles.finalScoreLabel}>
                          최종 상권 적합도
                        </Text>
                        <Text style={styles.finalScoreValue}>
                          {`${result.suitabilityScore}점`}
                        </Text>
                      </View>
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>
        ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {padding: 20, paddingBottom: 40, backgroundColor: '#FFFFFF'},
  title: {fontSize: 20, fontWeight: '700', marginTop: 12, marginBottom: 12},
  loadingBox: {marginTop: 30, alignItems: 'center', gap: 8},
  loadingText: {fontSize: 14, fontWeight: '600', color: '#1A1A1A'},
  loadingSubText: {fontSize: 12, color: '#8A8A8A'},
  error: {color: '#D14343', fontSize: 14, marginTop: 12},
  businessSection: {marginTop: 24},
  businessHeader: {
    backgroundColor: '#1A1A1A',
    borderRadius: 14,
    padding: 18,
    marginBottom: 14,
  },
  businessSmallTitle: {color: '#CCCCCC', fontSize: 12, marginBottom: 4},
  businessTitle: {color: '#FFFFFF', fontSize: 24, fontWeight: '700'},
  card: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 14,
    padding: 18,
    marginBottom: 12,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  cardLeft: {flex: 1},
  rank: {fontSize: 13, fontWeight: '700', color: '#6B6B6B', marginBottom: 2},
  areaName: {fontSize: 20, fontWeight: '700', color: '#1A1A1A'},
  scoreBox: {
    backgroundColor: '#EAF2FF',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  scoreLabel: {fontSize: 11, color: '#4A6FA5', marginBottom: 2},
  scoreValue: {fontSize: 17, fontWeight: '700', color: '#1D4ED8'},
  reasonTitle: {marginTop: 12, fontSize: 12, fontWeight: '700', color: '#6B6B6B'},
  reasonText: {marginTop: 4, fontSize: 13, lineHeight: 19, color: '#3A3A3A'},
  previewRow: {flexDirection: 'row', gap: 8, marginTop: 14},
  previewItem: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 10,
  },
  previewLabel: {fontSize: 11, color: '#8A8A8A', marginBottom: 4},
  previewValue: {fontSize: 13, fontWeight: '700', color: '#1A1A1A'},
  expandText: {
    textAlign: 'center',
    marginTop: 14,
    fontSize: 12,
    fontWeight: '600',
    color: '#6B6B6B',
  },
  detailContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  detailLabel: {fontSize: 13, color: '#6B6B6B'},
  detailValue: {fontSize: 13, fontWeight: '700', color: '#1A1A1A'},
  divider: {borderTopWidth: 1, borderTopColor: '#E0E0E0', marginVertical: 12},
  finalScoreBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#EAF2FF',
    borderRadius: 10,
    padding: 14,
  },
  finalScoreLabel: {fontSize: 13, fontWeight: '700', color: '#1A1A1A'},
  finalScoreValue: {fontSize: 20, fontWeight: '700', color: '#1D4ED8'},
});