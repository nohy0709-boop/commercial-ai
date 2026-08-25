import { businessCategories } from '@/constants/businessTypes';
import { COLORS } from '@/constants/colors';
import { sejongAreas } from '@/constants/sejongAreas';
import type { ScoredCommercialAnalysisResult } from '@/services/commercialAnalysis';
import {
  analyzeCommercialArea,
  calculateSuitabilityScores,
} from '@/services/commercialAnalysis';
import { LinearGradient } from 'expo-linear-gradient';
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
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <LinearGradient
        colors={[
          COLORS.mintBlue,
          '#E8F8D7',
          COLORS.neonLime,
        ]}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 1}}
        style={styles.headerBackground}
      >
        <Text style={styles.title}>분석 결과</Text>

        <Text style={styles.subTitle}>
          업종별 지역 적합도 순위를 확인해보세요
        </Text>

        <View style={styles.headerBadge}>
          <Text style={styles.headerBadgeText}>
            데이터 기반 분석
          </Text>
        </View>
      </LinearGradient>

      {loading && (
        <View style={styles.loadingBox}>
          <ActivityIndicator
            size="large"
            color={COLORS.primary}
          />

          <Text style={styles.loadingText}>
            상권 데이터를 분석하는 중...
          </Text>

          <Text style={styles.loadingSubText}>
            여러 업종이나 지역을 선택한 경우 시간이 걸릴 수 있어요.
          </Text>
        </View>
      )}

      {!loading && errorMessage !== '' && (
        <View style={styles.errorBox}>
          <Text style={styles.errorTitle}>
            분석 결과를 불러오지 못했어요
          </Text>

          <Text style={styles.error}>
            {errorMessage}
          </Text>
        </View>
      )}

      {!loading &&
        errorMessage === '' &&
        groupedResults.map(group => (
          <View
            key={group.businessName}
            style={styles.businessSection}
          >
            <View style={styles.businessHeader}>
              <View>
                <Text style={styles.businessSmallTitle}>
                  선택 업종
                </Text>

                <Text style={styles.businessTitle}>
                  {group.businessName}
                </Text>
              </View>

              <View style={styles.businessTag}>
                <Text style={styles.businessTagText}>
                  지역 순위
                </Text>
              </View>
            </View>

            {group.items.map(result => {
              const key =
                `${group.businessName}-${result.areaName}`;

              const expanded =
                expandedKey === key;

              const isFirst =
                result.rank === 1;

              return (
                <Pressable
                  key={key}
                  style={[
                    styles.card,
                    isFirst && styles.firstCard,
                  ]}
                  onPress={() =>
                    setExpandedKey(
                      expanded ? null : key,
                    )
                  }
                >
                  <View style={styles.cardTopRow}>
                    <View style={styles.cardLeft}>
                      <View
                        style={[
                          styles.rankBadge,
                          isFirst &&
                            styles.rankBadgeFirst,
                        ]}
                      >
                        <Text
                          style={[
                            styles.rank,
                            isFirst &&
                              styles.rankFirst,
                          ]}
                        >
                          {`${result.rank}위`}
                        </Text>
                      </View>

                      <Text style={styles.areaName}>
                        {result.areaName}
                      </Text>

                      {isFirst && (
                        <Text style={styles.bestText}>
                          가장 높은 적합도
                        </Text>
                      )}
                    </View>

                    <View style={styles.scoreBox}>
                      <Text style={styles.scoreLabel}>
                        상권 적합도
                      </Text>

                      <View style={styles.scoreRow}>
                        <Text style={styles.scoreValue}>
                          {result.suitabilityScore}
                        </Text>

                        <Text style={styles.scoreUnit}>
                          점
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.reasonBox}>
                    <Text style={styles.reasonTitle}>
                      추천 이유
                    </Text>

                    <Text style={styles.reasonText}>
                      {getReasonSummary(result)}
                    </Text>
                  </View>

                  <View style={styles.previewRow}>
                    <View style={styles.previewItem}>
                      <Text style={styles.previewLabel}>
                        유동인구
                      </Text>

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
                      <Text style={styles.previewLabel}>
                        경쟁밀도
                      </Text>

                      <Text style={styles.previewValue}>
                        {result.competitionDensity.toFixed(
                          3,
                        )}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.expandButton}>
                    <Text style={styles.expandText}>
                      {expanded
                        ? '상세 정보 접기  ▲'
                        : '상세 정보 보기  ▼'}
                    </Text>
                  </View>

                  {expanded && (
                    <View style={styles.detailContainer}>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>
                          생활인구
                        </Text>

                        <Text style={styles.detailValue}>
                          {`${result.livingPopulation.toLocaleString()}명`}
                        </Text>
                      </View>

                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>
                          생활인구 증감률
                        </Text>

                        <Text style={styles.detailValue}>
                          {formatChangeRate(
                            result.livingPopulationChangeRate,
                          )}
                        </Text>
                      </View>

                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>
                          유동인구 증감률
                        </Text>

                        <Text style={styles.detailValue}>
                          {formatChangeRate(
                            result.floatingPopulationChangeRate,
                          )}
                        </Text>
                      </View>

                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>
                          카드소비
                        </Text>

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
                        <Text style={styles.detailLabel}>
                          버스정류장
                        </Text>

                        <Text style={styles.detailValue}>
                          {`${result.busStopCount}개`}
                        </Text>
                      </View>

                      <View style={styles.divider} />

                      <LinearGradient
                        colors={[
                          '#F2F9DC',
                          '#EFFBFE',
                        ]}
                        start={{x: 0, y: 0}}
                        end={{x: 1, y: 1}}
                        style={styles.finalScoreBox}
                      >
                        <Text
                          style={styles.finalScoreLabel}
                        >
                          최종 상권 적합도
                        </Text>

                        <View
                          style={styles.finalScoreRow}
                        >
                          <Text
                            style={
                              styles.finalScoreValue
                            }
                          >
                            {result.suitabilityScore}
                          </Text>

                          <Text
                            style={styles.finalScoreUnit}
                          >
                            점
                          </Text>
                        </View>
                      </LinearGradient>
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
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  container: {
    padding: 20,
    paddingBottom: 40,
    backgroundColor: COLORS.background,
  },

  headerBackground: {
    marginHorizontal: -20,
    marginTop: -20,

    paddingTop: 38,
    paddingHorizontal: 20,
    paddingBottom: 28,

    marginBottom: 24,

    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },

  title: {
    fontSize: 27,
    fontWeight: '800',
    color: COLORS.primaryDark,
    marginBottom: 6,
  },

  subTitle: {
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.textSecondary,
  },

  headerBadge: {
    alignSelf: 'flex-start',

    marginTop: 14,

    paddingVertical: 7,
    paddingHorizontal: 12,

    borderRadius: 20,

    backgroundColor:
      'rgba(255,255,255,0.72)',
  },

  headerBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primaryDark,
  },

  loadingBox: {
    marginTop: 40,

    padding: 28,

    alignItems: 'center',

    borderRadius: 20,

    backgroundColor: '#F8FAF7',
  },

  loadingText: {
    marginTop: 14,

    fontSize: 15,
    fontWeight: '700',

    color: COLORS.primaryDark,
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
    flexDirection: 'row',

    justifyContent: 'space-between',
    alignItems: 'center',

    marginBottom: 14,

    padding: 18,

    borderRadius: 20,

    backgroundColor: COLORS.primaryDark,
  },

  businessSmallTitle: {
    fontSize: 12,

    color: '#DCE8D8',

    marginBottom: 4,
  },

  businessTitle: {
    fontSize: 23,
    fontWeight: '800',

    color: '#FFFFFF',
  },

  businessTag: {
    paddingVertical: 7,
    paddingHorizontal: 11,

    borderRadius: 20,

    backgroundColor: COLORS.neonLime,
  },

  businessTagText: {
    fontSize: 11,
    fontWeight: '800',

    color: COLORS.primaryDark,
  },

  card: {
    padding: 18,

    marginBottom: 14,

    borderWidth: 1,
    borderColor: '#E8EEDC',

    borderRadius: 20,

    backgroundColor: '#FFFFFF',

    shadowColor: '#000000',

    shadowOffset: {
      width: 0,
      height: 2,
    },

    shadowOpacity: 0.05,

    shadowRadius: 7,

    elevation: 2,
  },

  firstCard: {
    borderColor: COLORS.primary,

    backgroundColor: '#FBFDF4',
  },

  cardTopRow: {
    flexDirection: 'row',

    justifyContent: 'space-between',

    alignItems: 'flex-start',

    gap: 12,
  },

  cardLeft: {
    flex: 1,
  },

  rankBadge: {
    alignSelf: 'flex-start',

    paddingVertical: 5,
    paddingHorizontal: 9,

    borderRadius: 12,

    backgroundColor: COLORS.lightGray,

    marginBottom: 8,
  },

  rankBadgeFirst: {
    backgroundColor: COLORS.neonLime,
  },

  rank: {
    fontSize: 12,
    fontWeight: '800',

    color: COLORS.textSecondary,
  },

  rankFirst: {
    color: COLORS.primaryDark,
  },

  areaName: {
    fontSize: 21,
    fontWeight: '800',

    color: COLORS.text,
  },

  bestText: {
    marginTop: 5,

    fontSize: 11,
    fontWeight: '700',

    color: COLORS.primary,
  },

  scoreBox: {
    minWidth: 90,

    paddingVertical: 10,
    paddingHorizontal: 12,

    alignItems: 'center',

    borderRadius: 16,

    backgroundColor: '#F3FAD9',
  },

  scoreLabel: {
    fontSize: 11,

    color: COLORS.textSecondary,

    marginBottom: 2,
  },

  scoreRow: {
    flexDirection: 'row',

    alignItems: 'flex-end',
  },

  scoreValue: {
    fontSize: 25,
    fontWeight: '900',

    color: COLORS.primary,
  },

  scoreUnit: {
    fontSize: 13,
    fontWeight: '800',

    color: COLORS.primaryDark,

    marginBottom: 3,
    marginLeft: 2,
  },

  reasonBox: {
    marginTop: 16,

    padding: 14,

    borderRadius: 15,

    backgroundColor: '#EFFBFE',
  },

  reasonTitle: {
    fontSize: 12,
    fontWeight: '800',

    color: COLORS.primaryDark,

    marginBottom: 5,
  },

  reasonText: {
    fontSize: 13,
    lineHeight: 19,

    color: COLORS.textSecondary,
  },

  previewRow: {
    flexDirection: 'row',

    gap: 8,

    marginTop: 14,
  },

  previewItem: {
    flex: 1,

    padding: 11,

    borderRadius: 13,

    backgroundColor: '#F8FAF7',
  },

  previewLabel: {
    fontSize: 10,

    color: COLORS.textSecondary,

    marginBottom: 5,
  },

  previewValue: {
    fontSize: 13,
    fontWeight: '800',

    color: COLORS.primaryDark,
  },

  expandButton: {
    marginTop: 14,

    paddingVertical: 9,

    borderRadius: 12,

    backgroundColor: '#F5FBDD',
  },

  expandText: {
    textAlign: 'center',

    fontSize: 12,
    fontWeight: '700',

    color: COLORS.primaryDark,
  },

  detailContainer: {
    marginTop: 16,

    paddingTop: 16,

    borderTopWidth: 1,

    borderTopColor: '#E8EEDC',
  },

  detailRow: {
    flexDirection: 'row',

    justifyContent: 'space-between',

    alignItems: 'center',

    marginBottom: 12,
  },

  detailLabel: {
    fontSize: 13,

    color: COLORS.textSecondary,
  },

  detailValue: {
    fontSize: 13,
    fontWeight: '800',

    color: COLORS.text,
  },

  divider: {
    borderTopWidth: 1,

    borderTopColor: '#E8EEDC',

    marginVertical: 12,
  },

  finalScoreBox: {
    flexDirection: 'row',

    justifyContent: 'space-between',

    alignItems: 'center',

    borderRadius: 16,

    padding: 16,
  },

  finalScoreLabel: {
    fontSize: 13,
    fontWeight: '800',

    color: COLORS.primaryDark,
  },

  finalScoreRow: {
    flexDirection: 'row',

    alignItems: 'flex-end',
  },

  finalScoreValue: {
    fontSize: 24,
    fontWeight: '900',

    color: COLORS.primary,
  },

  finalScoreUnit: {
    fontSize: 13,
    fontWeight: '800',

    color: COLORS.primaryDark,

    marginBottom: 3,
    marginLeft: 2,
  },
});