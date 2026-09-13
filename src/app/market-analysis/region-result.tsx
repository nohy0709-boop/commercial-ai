import { businessCategories } from '@/constants/businessTypes';
import { COLORS } from '@/constants/colors';
import { sejongAreas } from '@/constants/sejongAreas';

import type {
  ScoredCommercialAnalysisResult,
} from '@/services/commercialAnalysis';

import {
  analyzeCommercialArea,
  analyzeCommercialPoint,
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

type DetailedLocation = {
  label: string;

  dongName: string;

  coordinates: {
    lat: number;
    lng: number;
  };

  radius: number;
};

type RankedResult =
  ScoredCommercialAnalysisResult & {
    rank: number;

    analysisType?: 'point';

    dongName?: string;

    latitude?: number;

    longitude?: number;

    radius?: number;

    isEstimated?: boolean;
  };

type GroupedResult = {
  businessName: string;

  items: RankedResult[];
};

const delay = (ms: number) =>
  new Promise(resolve =>
    setTimeout(resolve, ms),
  );

function getLevelLabel(
  score: number,
): string {
  if (score >= 75) {
    return '매우 높음';
  }

  if (score >= 50) {
    return '높음';
  }

  if (score >= 25) {
    return '보통';
  }

  return '낮음';
}

function parseDetailedLocations(
  value?: string,
): DetailedLocation[] {
  if (!value) {
    return [];
  }

  try {
    const parsed =
      JSON.parse(value);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(
      (
        item: any,
      ): item is DetailedLocation =>
        typeof item?.label === 'string' &&
        typeof item?.dongName === 'string' &&
        typeof item?.coordinates?.lat === 'number' &&
        typeof item?.coordinates?.lng === 'number' &&
        typeof item?.radius === 'number',
    );
  } catch (error) {
    console.error(
      '상세 위치 파싱 실패:',
      error,
    );

    return [];
  }
}

export default function RegionResultScreen() {
  const router =
    useRouter();

  const {
    businesses,
    areas,
    detailedLocations:
      detailedLocationsParam,
  } =
    useLocalSearchParams<{
      businesses?: string;
      areas?: string;
      detailedLocations?: string;
    }>();

  const [
    groupedResults,
    setGroupedResults,
  ] =
    useState<
      GroupedResult[]
    >([]);

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    errorMessage,
    setErrorMessage,
  ] =
    useState('');

  const [
    topAiSummary,
    setTopAiSummary,
  ] =
    useState<
      Record<
        string,
        string
      >
    >({});

  const [
    topAiLoading,
    setTopAiLoading,
  ] =
    useState<
      Record<
        string,
        boolean
      >
    >({});

  useEffect(() => {
    if (!businesses) {
      setErrorMessage(
        '선택한 업종 정보를 찾을 수 없습니다.',
      );

      setLoading(false);

      return;
    }

    const selectedBusinessNames =
      businesses
        .split(',')
        .filter(Boolean);

    const selectedAreaNames =
      areas
        ? areas
            .split(',')
            .filter(Boolean)
        : [];

    const selectedDetailedLocations =
      parseDetailedLocations(
        detailedLocationsParam,
      );

    if (
      selectedAreaNames.length === 0 &&
      selectedDetailedLocations.length === 0
    ) {
      setErrorMessage(
        '선택한 지역 정보를 찾을 수 없습니다.',
      );

      setLoading(false);

      return;
    }

    const allBusinesses =
      businessCategories.flatMap(
        category =>
          category.businesses,
      );

    const targetBusinesses =
      allBusinesses.filter(
        business =>
          selectedBusinessNames.includes(
            business.name,
          ),
      );

    const targetAreas =
      sejongAreas.filter(
        area =>
          selectedAreaNames.includes(
            area.name,
          ),
      );

    const run =
      async () => {
        try {
          setLoading(true);

          setErrorMessage('');

          setGroupedResults([]);

          setTopAiSummary({});

          setTopAiLoading({});

          const groups: GroupedResult[] =
            [];

          for (
            const business of targetBusinesses
          ) {
            const analysisResults: any[] =
              [];

            /**
             * ================================
             * 동 전체 분석
             * ================================
             */
            for (
              const area of targetAreas
            ) {
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
                  result,
                );

                await delay(600);
              } catch (error) {
                console.error(
                  `${area.name} ${business.name} 분석 실패`,
                  error,
                );

                if (
                  error instanceof Error &&
                  error.message.includes(
                    '429',
                  )
                ) {
                  await delay(2000);
                }
              }
            }

            /**
             * ================================
             * 지도 선택 지점 + 반경 분석
             * ================================
             */
            for (
              const location of selectedDetailedLocations
            ) {
              try {
                const areaInfo =
                  sejongAreas.find(
                    area =>
                      area.name ===
                      location.dongName,
                  );

                if (!areaInfo) {
                  console.error(
                    `${location.dongName} 행정동 코드 없음`,
                  );

                  continue;
                }

                const result =
                  await analyzeCommercialPoint(
                    location.label,

                    location.dongName,

                    areaInfo.code,

                    location.coordinates.lat,

                    location.coordinates.lng,

                    location.radius,

                    business.name,

                    business.lclsCode,

                    business.mclsCode,

                    business.sclsCode,
                  );

                analysisResults.push(
                  result,
                );

                await delay(600);
              } catch (error) {
                console.error(
                  `${location.label} ${business.name} 반경 분석 실패`,
                  error,
                );

                if (
                  error instanceof Error &&
                  error.message.includes(
                    '429',
                  )
                ) {
                  await delay(2000);
                }
              }
            }

            if (
              analysisResults.length ===
              0
            ) {
              continue;
            }

            const scoredResults =
              calculateSuitabilityScores(
                analysisResults,
              );

            groups.push({
              businessName:
                business.name,

              items:
                scoredResults.map(
                  (
                    result,
                    index,
                  ) => ({
                    ...result,

                    rank:
                      index + 1,
                  }),
                ),
            });

            await delay(800);
          }

          if (
            groups.length ===
            0
          ) {
            setErrorMessage(
              '분석 결과를 가져오지 못했습니다. 잠시 후 다시 시도해주세요.',
            );

            return;
          }

          setGroupedResults(
            groups,
          );

          /**
           * 업종별 1위 AI 요약
           */
          groups.forEach(
            group => {
              const top =
                group.items[0];

              if (!top) {
                return;
              }

              setTopAiLoading(
                prev => ({
                  ...prev,

                  [group.businessName]:
                    true,
                }),
              );

              generateAIExplanation(
                {
                  지역:
                    top.areaName,

                  업종:
                    group.businessName,

                  유동인구:
                    top.floatingPopulation,

                  생활인구:
                    top.livingPopulation,

                  점포수:
                    top.storeCount,

                  경쟁밀도:
                    top.competitionDensity,

                  전체카드소비:
                    top.salesAmount,

                  점포당카드소비:
                    top.averageSalesPerStore,

                  버스정류장수:
                    top.busStopCount,

                  적합도점수:
                    top.suitabilityScore,

                  순위:
                    top.rank,
                },
              )
                .then(
                  explanation => {
                    setTopAiSummary(
                      prev => ({
                        ...prev,

                        [group.businessName]:
                          explanation.recommendationReason,
                      }),
                    );
                  },
                )
                .catch(
                  error => {
                    console.error(
                      'AI 요약 생성 오류:',
                      error,
                    );
                  },
                )
                .finally(
                  () => {
                    setTopAiLoading(
                      prev => ({
                        ...prev,

                        [group.businessName]:
                          false,
                      }),
                    );
                  },
                );
            },
          );
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

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    businesses,
    areas,
    detailedLocationsParam,
  ]);

  /**
   * 결과 카드 클릭
   */
  const handleCardPress = (
    businessName: string,
    result: RankedResult,
    totalCount: number,
  ) => {
    router.push({
      pathname:
        '/market-analysis/region-result-detail',

      params: {
        businessName,

        areaName:
          result.areaName,

        rank:
          String(
            result.rank,
          ),

        totalCount:
          String(
            totalCount,
          ),

        suitabilityScore:
          String(
            result.suitabilityScore,
          ),

        floatingPopulation:
          String(
            result.floatingPopulation,
          ),

        livingPopulation:
          String(
            result.livingPopulation,
          ),

        storeCount:
          String(
            result.storeCount,
          ),

        competitionDensity:
          String(
            result.competitionDensity,
          ),

        salesAmount:
          String(
            result.salesAmount,
          ),

        averageSalesPerStore:
          String(
            result.averageSalesPerStore,
          ),

        busStopCount:
          String(
            result.busStopCount,
          ),

        livingPopulationChangeRate:
          String(
            result.livingPopulationChangeRate,
          ),

        floatingPopulationChangeRate:
          String(
            result.floatingPopulationChangeRate,
          ),

        /**
         * 지도 반경 결과일 경우
         * 상세화면에서도 사용할 값
         */
        analysisType:
          result.analysisType ??
          'area',

        dongName:
          result.dongName ??
          result.areaName,

        latitude:
          result.latitude !==
          undefined
            ? String(
                result.latitude,
              )
            : '',

        longitude:
          result.longitude !==
          undefined
            ? String(
                result.longitude,
              )
            : '',

        radius:
          result.radius !==
          undefined
            ? String(
                result.radius,
              )
            : '',
      },
    });
  };

  return (
    <ScrollView
      style={
        styles.screen
      }
      contentContainerStyle={
        styles.container
      }
      showsVerticalScrollIndicator={
        false
      }
    >
      <View
        style={
          styles.headerBackground
        }
      >
        <Text
          style={
            styles.title
          }
        >
          분석 결과
        </Text>

        <Text
          style={
            styles.subTitle
          }
        >
          업종별 지역 적합도
          순위를 확인해보세요
        </Text>
      </View>

      {loading && (
        <View
          style={
            styles.loadingBox
          }
        >
          <ActivityIndicator
            size="large"
            color={
              COLORS.primary
            }
          />

          <Text
            style={
              styles.loadingText
            }
          >
            상권 데이터를
            분석하는 중...
          </Text>

          <Text
            style={
              styles.loadingSubText
            }
          >
            여러 업종이나 지역을
            선택한 경우 시간이
            걸릴 수 있어요.
          </Text>
        </View>
      )}

      {!loading &&
        errorMessage !==
          '' && (
          <View
            style={
              styles.errorBox
            }
          >
            <Text
              style={
                styles.errorTitle
              }
            >
              분석 결과를
              불러오지 못했어요
            </Text>

            <Text
              style={
                styles.error
              }
            >
              {
                errorMessage
              }
            </Text>
          </View>
        )}

      {!loading &&
        errorMessage ===
          '' &&
        groupedResults.map(
          group => (
            <View
              key={
                group.businessName
              }
              style={
                styles.businessSection
              }
            >
              <View
                style={
                  styles.businessHeader
                }
              >
                <Text
                  style={
                    styles.businessSmallTitle
                  }
                >
                  선택 업종
                </Text>

                <Text
                  style={
                    styles.businessTitle
                  }
                >
                  {
                    group.businessName
                  }
                </Text>
              </View>

              {(topAiLoading[
                group.businessName
              ] ||
                topAiSummary[
                  group.businessName
                ]) && (
                <View
                  style={
                    styles.aiCallout
                  }
                >
                  <Text
                    style={
                      styles.aiCalloutTitle
                    }
                  >
                    ✨ 이런 지역이
                    가장 적합해요!
                  </Text>

                  {topAiLoading[
                    group.businessName
                  ] ? (
                    <View
                      style={
                        styles.aiCalloutLoading
                      }
                    >
                      <ActivityIndicator
                        size="small"
                        color={
                          COLORS.primary
                        }
                      />

                      <Text
                        style={
                          styles.aiCalloutLoadingText
                        }
                      >
                        AI가 요약하는
                        중...
                      </Text>
                    </View>
                  ) : (
                    <Text
                      style={
                        styles.aiCalloutText
                      }
                    >
                      {
                        topAiSummary[
                          group.businessName
                        ]
                      }
                    </Text>
                  )}
                </View>
              )}

              {group.items.map(
                result => {
                  const isFirst =
                    result.rank ===
                    1;

                  const isPoint =
                    result.analysisType ===
                    'point';

                  return (
                    <Pressable
                      key={`${group.businessName}-${result.areaName}-${result.rank}`}
                      style={[
                        styles.card,

                        isFirst &&
                          styles.firstCard,
                      ]}
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

                          isFirst &&
                            styles.rankBadgeFirst,
                        ]}
                      >
                        <Text
                          style={[
                            styles.rankText,

                            isFirst &&
                              styles.rankTextFirst,
                          ]}
                        >
                          {
                            result.rank
                          }
                        </Text>
                      </View>

                      <View
                        style={
                          styles.cardBody
                        }
                      >
                        <View
                          style={
                            styles.cardTopRow
                          }
                        >
                          <View
                            style={{
                              flex: 1,
                            }}
                          >
                            <Text
                              style={
                                styles.areaName
                              }
                            >
                              {
                                result.areaName
                              }
                            </Text>

                            {isPoint &&
                              result.radius && (
                                <Text
                                  style={
                                    styles.pointInfo
                                  }
                                >
                                  반경{' '}
                                  {
                                    result.radius
                                  }
                                  m 분석
                                </Text>
                              )}
                          </View>

                          <View
                            style={
                              styles.scoreBox
                            }
                          >
                            <Text
                              style={
                                styles.scoreValue
                              }
                            >
                              {
                                result.suitabilityScore
                              }
                            </Text>

                            <Text
                              style={
                                styles.scoreUnit
                              }
                            >
                              점
                            </Text>
                          </View>
                        </View>

                        <View
                          style={
                            styles.tagRow
                          }
                        >
                          <View
                            style={
                              styles.tag
                            }
                          >
                            <Text
                              style={
                                styles.tagText
                              }
                            >
                              유동인구{' '}
                              {getLevelLabel(
                                result.floatingPopulationScore,
                              )}
                            </Text>
                          </View>

                          <View
                            style={
                              styles.tag
                            }
                          >
                            <Text
                              style={
                                styles.tagText
                              }
                            >
                              {
                                group.businessName
                              }{' '}
                              {
                                result.storeCount
                              }
                              개
                            </Text>
                          </View>

                          {isPoint && (
                            <View
                              style={
                                styles.pointTag
                              }
                            >
                              <Text
                                style={
                                  styles.pointTagText
                                }
                              >
                                위치 기반
                              </Text>
                            </View>
                          )}
                        </View>
                      </View>

                      <Text
                        style={
                          styles.arrow
                        }
                      >
                        ›
                      </Text>
                    </Pressable>
                  );
                },
              )}
            </View>
          ),
        )}
    </ScrollView>
  );
}

const styles =
  StyleSheet.create({
    screen: {
      flex: 1,

      backgroundColor:
        COLORS.background,
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

      color:
        COLORS.text,

      marginBottom: 6,
    },

    subTitle: {
      fontSize: 14,

      color:
        COLORS.textSecondary,
    },

    loadingBox: {
      marginTop: 40,

      padding: 28,

      alignItems:
        'center',

      borderRadius: 20,

      backgroundColor:
        COLORS.surface,

      borderWidth: 1,

      borderColor:
        COLORS.border,
    },

    loadingText: {
      marginTop: 14,

      fontSize: 15,

      fontWeight: '800',

      color:
        COLORS.text,
    },

    loadingSubText: {
      marginTop: 6,

      fontSize: 12,

      lineHeight: 18,

      textAlign:
        'center',

      color:
        COLORS.textSecondary,
    },

    errorBox: {
      padding: 18,

      borderRadius: 18,

      backgroundColor:
        '#FFF3F3',
    },

    errorTitle: {
      fontSize: 15,

      fontWeight: '800',

      color:
        '#B42318',

      marginBottom: 6,
    },

    error: {
      fontSize: 13,

      lineHeight: 19,

      color:
        '#D14343',
    },

    businessSection: {
      marginBottom: 26,
    },

    businessHeader: {
      marginBottom: 14,

      paddingVertical: 16,

      paddingHorizontal: 18,

      borderRadius: 18,

      backgroundColor:
        '#111111',
    },

    businessSmallTitle: {
      fontSize: 11,

      fontWeight: '600',

      color:
        '#9CA3AF',

      marginBottom: 4,
    },

    businessTitle: {
      fontSize: 20,

      fontWeight: '900',

      color:
        '#FFFFFF',
    },

    aiCallout: {
      marginBottom: 14,

      padding: 16,

      borderRadius: 16,

      backgroundColor:
        '#F1FFF5',

      borderWidth: 1,

      borderColor:
        '#D8F5E2',
    },

    aiCalloutTitle: {
      fontSize: 13,

      fontWeight: '800',

      color:
        COLORS.primary,

      marginBottom: 6,
    },

    aiCalloutText: {
      fontSize: 13,

      lineHeight: 19,

      color:
        COLORS.text,
    },

    aiCalloutLoading: {
      flexDirection:
        'row',

      alignItems:
        'center',

      gap: 8,
    },

    aiCalloutLoadingText: {
      fontSize: 12,

      color:
        COLORS.textSecondary,
    },

    card: {
      flexDirection:
        'row',

      alignItems:
        'center',

      padding: 14,

      marginBottom: 10,

      borderRadius: 16,

      backgroundColor:
        COLORS.surface,

      borderWidth: 1,

      borderColor:
        COLORS.border,
    },

    firstCard: {
      borderColor:
        COLORS.primary,

      backgroundColor:
        '#FFFFFF',
    },

    rankBadge: {
      width: 30,

      height: 30,

      borderRadius: 15,

      backgroundColor:
        COLORS.lightGray,

      alignItems:
        'center',

      justifyContent:
        'center',

      marginRight: 12,
    },

    rankBadgeFirst: {
      backgroundColor:
        COLORS.primary,
    },

    rankText: {
      fontSize: 13,

      fontWeight: '800',

      color:
        COLORS.textSecondary,
    },

    rankTextFirst: {
      color:
        '#FFFFFF',
    },

    cardBody: {
      flex: 1,
    },

    cardTopRow: {
      flexDirection:
        'row',

      justifyContent:
        'space-between',

      alignItems:
        'center',

      marginBottom: 8,
    },

    areaName: {
      fontSize: 16,

      fontWeight: '800',

      color:
        COLORS.text,

      flexShrink: 1,
    },

    pointInfo: {
      marginTop: 3,

      fontSize: 11,

      fontWeight: '600',

      color:
        COLORS.primary,
    },

    scoreBox: {
      flexDirection:
        'row',

      alignItems:
        'flex-end',

      marginLeft: 8,
    },

    scoreValue: {
      fontSize: 18,

      fontWeight: '900',

      color:
        COLORS.primary,
    },

    scoreUnit: {
      fontSize: 12,

      fontWeight: '700',

      color:
        COLORS.text,

      marginLeft: 1,

      marginBottom: 2,
    },

    tagRow: {
      flexDirection:
        'row',

      flexWrap:
        'wrap',

      gap: 6,
    },

    tag: {
      paddingVertical: 4,

      paddingHorizontal: 10,

      borderRadius: 10,

      backgroundColor:
        COLORS.background,
    },

    tagText: {
      fontSize: 11,

      fontWeight: '600',

      color:
        COLORS.textSecondary,
    },

    pointTag: {
      paddingVertical: 4,

      paddingHorizontal: 10,

      borderRadius: 10,

      backgroundColor:
        '#F1FFF5',
    },

    pointTagText: {
      fontSize: 11,

      fontWeight: '700',

      color:
        COLORS.primary,
    },

    arrow: {
      fontSize: 24,

      color:
        COLORS.textSecondary,

      marginLeft: 8,
    },
  });