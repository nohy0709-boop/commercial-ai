import { businessCategories } from '@/constants/businessTypes';
import { COLORS } from '@/constants/colors';
import { sejongAreas } from '@/constants/sejongAreas';

import type { ScoredCommercialAnalysisResult } from '@/services/commercialAnalysis';
import {
  analyzeCommercialArea,
  calculateSuitabilityScores,
} from '@/services/commercialAnalysis';

import type { AIExplanation } from '@/services/aiExplanation';
import { generateAIExplanation } from '@/services/aiExplanation';

import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';

import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
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

function getReasonSummary(
  result: ScoredCommercialAnalysisResult,
): string {
  const reasons = [
    {
      text: '유동인구가 풍부합니다',
      score: result.floatingPopulationScore,
    },
    {
      text: '점포당 카드소비가 높습니다',
      score: result.averageSalesScore,
    },
    {
      text: '전체 카드소비 규모가 큽니다',
      score: result.salesScore,
    },
    {
      text: '경쟁 부담이 비교적 낮습니다',
      score: result.competitionScore,
    },
    {
      text: '생활인구가 풍부합니다',
      score: result.livingPopulationScore,
    },
    {
      text: '생활인구 증가세가 좋습니다',
      score: result.livingPopulationChangeScore,
    },
    {
      text: '유동인구 증가세가 좋습니다',
      score: result.floatingPopulationChangeScore,
    },
    {
      text: '대중교통 접근성이 좋습니다',
      score: result.accessibilityScore,
    },
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

export default function RegionResultScreen() {
  const { businesses, areas } =
    useLocalSearchParams<{
      businesses: string;
      areas: string;
    }>();

  const [groupedResults, setGroupedResults] =
    useState<GroupedResult[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [errorMessage, setErrorMessage] =
    useState('');

  const [expandedKey, setExpandedKey] =
    useState<string | null>(null);

  // AI 설명은 카드마다 따로, 버튼 눌렀을 때만 요청합니다.
  const [aiExplanations, setAiExplanations] = useState<
    Record<string, AIExplanation>
  >({});
  const [aiLoadingKeys, setAiLoadingKeys] = useState<Record<string, boolean>>({});
  const [aiErrorKeys, setAiErrorKeys] = useState<Record<string, string>>({});
  const [aiDetailExpandedKeys, setAiDetailExpandedKeys] = useState<
    Record<string, boolean>
  >({});

  useEffect(() => {
    if (!businesses || !areas) {
      setErrorMessage(
        '선택한 업종 또는 지역 정보를 찾을 수 없습니다.',
      );

      setLoading(false);
      return;
    }

    const selectedBusinessNames =
      businesses.split(',');

    const selectedAreaNames =
      areas.split(',');

    const allBusinesses =
      businessCategories.flatMap(
        category => category.businesses,
      );

    const targetBusinesses =
      allBusinesses.filter(business =>
        selectedBusinessNames.includes(
          business.name,
        ),
      );

    const targetAreas =
      sejongAreas.filter(area =>
        selectedAreaNames.includes(
          area.name,
        ),
      );

    const run = async () => {
      try {
        setLoading(true);
        setErrorMessage('');
        setGroupedResults([]);
        setExpandedKey(null);

        const groups: GroupedResult[] = [];

        for (const business of targetBusinesses) {
          const analysisResults: ScoredCommercialAnalysisResult[] =
            [];

          for (const area of targetAreas) {
            try {
              const result =
                await analyzeCommercialArea(
                  area.name,
                  area.code,
                  business.name,
                  business.lclsCode,
                  business.mclsCode,
                  business.sclsCode,
                );

              analysisResults.push(
                result as ScoredCommercialAnalysisResult,
              );

              await delay(600);
            } catch (error) {
              console.error(
                `${area.name} ${business.name} 분석 실패`,
                error,
              );

              if (
                error instanceof Error &&
                error.message.includes('429')
              ) {
                await delay(2000);
              }
            }
          }

          if (analysisResults.length === 0) {
            continue;
          }

          const scoredResults =
            calculateSuitabilityScores(
              analysisResults,
            );

          groups.push({
            businessName: business.name,
            items: scoredResults.map(
              (result, index) => ({
                ...result,
                rank: index + 1,
              }),
            ),
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
        console.error(
          '상권 분석 오류:',
          error,
        );

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
  }, [businesses, areas]);

  const handleGenerateAI = async (
    businessName: string,
    result: RankedResult,
  ) => {
    const key = `${businessName}-${result.areaName}`;
    if (aiExplanations[key] || aiLoadingKeys[key]) {
      return;
    }

    setAiLoadingKeys(prev => ({...prev, [key]: true}));
    setAiErrorKeys(prev => ({...prev, [key]: ''}));

    try {
      const explanation = await generateAIExplanation({
        지역: result.areaName,
        업종: businessName,
        유동인구: result.floatingPopulation,
        생활인구: result.livingPopulation,
        점포수: result.storeCount,
        경쟁밀도: result.competitionDensity,
        전체카드소비: result.salesAmount,
        점포당카드소비: result.averageSalesPerStore,
        버스정류장수: result.busStopCount,
        적합도점수: result.suitabilityScore,
        순위: result.rank,
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

  const toggleAiDetail = (key: string) => {
    setAiDetailExpandedKeys(prev => ({...prev, [key]: !prev[key]}));
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.headerBackground}>
        <Text style={styles.title}>
          분석 결과
        </Text>

        <Text style={styles.subTitle}>
          업종별 지역 적합도 순위를 확인해보세요
        </Text>

        <View style={styles.headerBadge}>
          <Text style={styles.headerBadgeText}>
            데이터 기반 분석
          </Text>
        </View>
      </View>

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
            여러 업종이나 지역을 선택한 경우
            시간이 걸릴 수 있어요.
          </Text>
        </View>
      )}

      {!loading &&
        errorMessage !== '' && (
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
                <Text
                  style={styles.businessSmallTitle}
                >
                  선택 업종
                </Text>

                <Text
                  style={styles.businessTitle}
                >
                  {group.businessName}
                </Text>
              </View>

              <View style={styles.businessTag}>
                <Text
                  style={styles.businessTagText}
                >
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

              const explanation = aiExplanations[key];
              const aiLoading = aiLoadingKeys[key];
              const aiError = aiErrorKeys[key];
              const aiDetailExpanded = aiDetailExpandedKeys[key];

              return (
                <Pressable
                  key={key}
                  style={[
                    styles.card,
                    isFirst &&
                      styles.firstCard,
                  ]}
                  onPress={() =>
                    setExpandedKey(
                      expanded
                        ? null
                        : key,
                    )
                  }
                >
                  <View
                    style={styles.cardTopRow}
                  >
                    <View
                      style={styles.cardLeft}
                    >
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
                          {result.rank}위
                        </Text>
                      </View>

                      <Text
                        style={styles.areaName}
                      >
                        {result.areaName}
                      </Text>

                      {isFirst && (
                        <Text
                          style={styles.bestText}
                        >
                          가장 높은 적합도
                        </Text>
                      )}
                    </View>

                    <View
                      style={styles.scoreBox}
                    >
                      <Text
                        style={styles.scoreLabel}
                      >
                        상권 적합도
                      </Text>

                      <View
                        style={styles.scoreRow}
                      >
                        <Text
                          style={styles.scoreValue}
                        >
                          {
                            result.suitabilityScore
                          }
                        </Text>

                        <Text
                          style={styles.scoreUnit}
                        >
                          점
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View
                    style={styles.reasonBox}
                  >
                    <Text
                      style={styles.reasonTitle}
                    >
                      추천 이유
                    </Text>

                    <Text
                      style={styles.reasonText}
                    >
                      {getReasonSummary(
                        result,
                      )}
                    </Text>
                  </View>

                  <View
                    style={styles.previewRow}
                  >
                    <View
                      style={styles.previewItem}
                    >
                      <Text
                        style={styles.previewLabel}
                      >
                        유동인구
                      </Text>

                      <Text
                        style={styles.previewValue}
                      >
                        {`${result.floatingPopulation.toLocaleString()}명`}
                      </Text>
                    </View>

                    <View
                      style={styles.previewItem}
                    >
                      <Text
                        style={styles.previewLabel}
                      >
                        {group.businessName} 수
                      </Text>

                      <Text
                        style={styles.previewValue}
                      >
                        {result.storeCount}개
                      </Text>
                    </View>

                    <View
                      style={styles.previewItem}
                    >
                      <Text
                        style={styles.previewLabel}
                      >
                        경쟁밀도
                      </Text>

                      <Text
                        style={styles.previewValue}
                      >
                        {result.competitionDensity.toFixed(
                          3,
                        )}
                      </Text>
                    </View>
                  </View>

                  <View
                    style={styles.expandButton}
                  >
                    <Text
                      style={styles.expandText}
                    >
                      {expanded
                        ? '상세 정보 접기 ▲'
                        : '상세 정보 보기 ▼'}
                    </Text>
                  </View>

                  {expanded && (
                    <View
                      style={
                        styles.detailContainer
                      }
                    >
                      <View
                        style={styles.detailRow}
                      >
                        <Text
                          style={
                            styles.detailLabel
                          }
                        >
                          생활인구
                        </Text>

                        <Text
                          style={
                            styles.detailValue
                          }
                        >
                          {`${result.livingPopulation.toLocaleString()}명`}
                        </Text>
                      </View>

                      <View
                        style={styles.detailRow}
                      >
                        <Text
                          style={
                            styles.detailLabel
                          }
                        >
                          생활인구 증감률
                        </Text>

                        <Text
                          style={
                            styles.detailValue
                          }
                        >
                          {formatChangeRate(
                            result.livingPopulationChangeRate,
                          )}
                        </Text>
                      </View>

                      <View
                        style={styles.detailRow}
                      >
                        <Text
                          style={
                            styles.detailLabel
                          }
                        >
                          유동인구 증감률
                        </Text>

                        <Text
                          style={
                            styles.detailValue
                          }
                        >
                          {formatChangeRate(
                            result.floatingPopulationChangeRate,
                          )}
                        </Text>
                      </View>

                      <View
                        style={styles.detailRow}
                      >
                        <Text
                          style={
                            styles.detailLabel
                          }
                        >
                          카드소비
                        </Text>

                        <Text
                          style={
                            styles.detailValue
                          }
                        >
                          {`${result.salesAmount.toLocaleString()}원`}
                        </Text>
                      </View>

                      <View
                        style={styles.detailRow}
                      >
                        <Text
                          style={
                            styles.detailLabel
                          }
                        >
                          점포당 카드소비액
                        </Text>

                        <Text
                          style={
                            styles.detailValue
                          }
                        >
                          {`${Math.round(
                            result.averageSalesPerStore,
                          ).toLocaleString()}원`}
                        </Text>
                      </View>

                      <View
                        style={styles.detailRow}
                      >
                        <Text
                          style={
                            styles.detailLabel
                          }
                        >
                          버스정류장
                        </Text>

                        <Text
                          style={
                            styles.detailValue
                          }
                        >
                          {result.busStopCount}개
                        </Text>
                      </View>

                      <View
                        style={styles.divider}
                      />

                      <View
                        style={
                          styles.finalScoreBox
                        }
                      >
                        <Text
                          style={
                            styles.finalScoreLabel
                          }
                        >
                          최종 상권 적합도
                        </Text>

                        <View
                          style={
                            styles.finalScoreRow
                          }
                        >
                          <Text
                            style={
                              styles.finalScoreValue
                            }
                          >
                            {
                              result.suitabilityScore
                            }
                          </Text>

                          <Text
                            style={
                              styles.finalScoreUnit
                            }
                          >
                            점
                          </Text>
                        </View>
                      </View>
                    </View>
                  )}

                  {/* AI 상세 분석 (버튼 눌렀을 때만 요청) */}
                  {!explanation && (
                    <TouchableOpacity
                      style={styles.aiButton}
                      activeOpacity={0.7}
                      disabled={aiLoading}
                      onPress={() =>
                        handleGenerateAI(group.businessName, result)
                      }>
                      {aiLoading ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
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
                      <Text style={styles.aiLabel}>AI 추천 이유</Text>
                      {renderEmphasizedText(
                        explanation.recommendationReason,
                        styles.aiText,
                      )}

                      <TouchableOpacity
                        style={styles.detailToggleButton}
                        activeOpacity={0.7}
                        onPress={() => toggleAiDetail(key)}>
                        <Text style={styles.detailToggleText}>
                          {aiDetailExpanded
                            ? 'AI 상세 설명 접기 ▲'
                            : 'AI 상세 설명 보기 ▼'}
                        </Text>
                      </TouchableOpacity>

                      {aiDetailExpanded && (
                        <View style={styles.aiDetailSection}>
                          <Text style={styles.aiLabel}>주요 특징</Text>
                          {renderEmphasizedText(
                            explanation.keyFeatures,
                            styles.aiText,
                          )}

                          <Text style={styles.aiLabel}>장점</Text>
                          {explanation.advantages.map((advantage, index) => (
                            <Text key={index} style={styles.aiListItem}>
                              {`· ${advantage}`}
                            </Text>
                          ))}

                          <Text style={styles.aiLabel}>위험요소</Text>
                          {explanation.risks.map((risk, index) => (
                            <Text key={index} style={styles.aiListItem}>
                              {`· ${risk}`}
                            </Text>
                          ))}

                          <Text style={styles.aiLabel}>고려사항</Text>
                          <Text style={styles.aiText}>
                            {explanation.considerations}
                          </Text>
                        </View>
                      )}
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
    paddingBottom: 26,
    marginBottom: 24,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },

  title: {
    fontSize: 27,
    fontWeight: '900',
    color: COLORS.text,
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
    backgroundColor: COLORS.lime,
  },

  headerBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.primary,
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: '#111111',
    borderWidth: 1,
    borderColor: '#1F1F1F',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.1,
    shadowRadius: 7,
    elevation: 3,
  },

  businessSmallTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9CA3AF',
    marginBottom: 5,
  },

  businessTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFFFFF',
  },

  businessTag: {
    paddingVertical: 8,
    paddingHorizontal: 13,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
  },

  businessTagText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#FFFFFF',
  },

  card: {
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.04,
    shadowRadius: 7,
    elevation: 2,
  },

  firstCard: {
    borderColor: COLORS.primary,
    backgroundColor: '#FFFFFF',
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
    backgroundColor: COLORS.primary,
  },

  rank: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.textSecondary,
  },

  rankFirst: {
    color: '#FFFFFF',
  },

  areaName: {
    fontSize: 21,
    fontWeight: '900',
    color: COLORS.text,
  },

  bestText: {
    marginTop: 5,
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.primary,
  },

  scoreBox: {
    minWidth: 90,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
    borderRadius: 16,
    backgroundColor: '#F1FFF5',
    borderWidth: 1,
    borderColor: '#D8F5E2',
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
    color: COLORS.text,
    marginBottom: 3,
    marginLeft: 2,
  },

  reasonBox: {
    marginTop: 16,
    padding: 14,
    borderRadius: 15,
    backgroundColor: '#F7F7F7',
  },

  reasonTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: COLORS.text,
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
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  previewLabel: {
    fontSize: 10,
    color: COLORS.textSecondary,
    marginBottom: 5,
  },

  previewValue: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.text,
  },

  expandButton: {
    marginTop: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: COLORS.neonLime,
  },

  expandText: {
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '900',
    color: '#111111',
  },

  detailContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
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
    borderTopColor: COLORS.border,
    marginVertical: 12,
  },

  finalScoreBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 16,
    padding: 16,
    backgroundColor: '#F1FFF5',
    borderWidth: 1,
    borderColor: '#D8F5E2',
  },

  finalScoreLabel: {
    fontSize: 13,
    fontWeight: '900',
    color: COLORS.text,
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
    color: COLORS.text,
    marginBottom: 3,
    marginLeft: 2,
  },

  aiButton: {
    marginTop: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
  },

  aiButtonText: {
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '900',
    color: '#FFFFFF',
  },

  aiError: {
    marginTop: 10,
    fontSize: 12,
    color: '#D14343',
  },

  aiBox: {
    marginTop: 14,
    padding: 14,
    borderRadius: 15,
    backgroundColor: '#F7F7F7',
  },

  aiLabel: {
    fontSize: 12,
    fontWeight: '900',
    color: COLORS.text,
    marginTop: 8,
    marginBottom: 4,
  },

  aiText: {
    fontSize: 13,
    lineHeight: 19,
    color: COLORS.textSecondary,
  },

  aiHighlight: {
    fontWeight: '900',
    color: COLORS.primary,
  },

  aiListItem: {
    fontSize: 13,
    lineHeight: 19,
    color: COLORS.textSecondary,
    marginLeft: 4,
  },

  detailToggleButton: {
    marginTop: 10,
    alignItems: 'center',
  },

  detailToggleText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.textSecondary,
  },

  aiDetailSection: {
    marginTop: 8,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
});