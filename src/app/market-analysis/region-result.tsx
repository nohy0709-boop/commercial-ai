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
import type { Coordinates } from '@/services/geocoding';
import { searchLocation } from '@/services/geocoding';

import AnalysisHeader from '@/components/analysis-header';
import AnalysisStepper from '@/components/analysis-stepper';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';

import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
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

function getCompetitionLabel(
  score: number,
): string {
  if (score >= 75) return '경쟁 여유';
  if (score >= 50) return '경쟁 보통';
  if (score >= 25) return '경쟁 있음';
  return '경쟁 치열';
}

function getOneLineSummary(
  result: ScoredCommercialAnalysisResult,
): string {
  const reasons = [
    {
      text: '유동인구가 풍부해요',
      score:
        result.floatingPopulationScore,
    },
    {
      text: '점포당 소비 규모가 커요',
      score:
        result.averageSalesScore,
    },
    {
      text: '경쟁 부담이 적은 편이에요',
      score:
        result.competitionScore,
    },
    {
      text: '생활인구가 꾸준해요',
      score:
        result.livingPopulationScore,
    },
    {
      text: '접근성이 좋아요',
      score:
        result.accessibilityScore,
    },
  ];

  const top = [...reasons].sort(
    (a, b) =>
      b.score - a.score,
  )[0];

  return top.text;
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

function CardMapThumbnail({
  coords,
}: {
  coords: Coordinates | undefined;
}) {
  if (
    Platform.OS === 'web' ||
    !coords
  ) {
    return (
      <View
        style={
          styles.mapFallback
        }
      >
        <Text
          style={
            styles.mapFallbackText
          }
        >
          📍
        </Text>
      </View>
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const MapView =
    require(
      'react-native-maps',
    ).default;

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const {
    Marker,
  } =
    require(
      'react-native-maps',
    );

  return (
    <MapView
      style={
        styles.cardMap
      }
      pointerEvents="none"
      scrollEnabled={
        false
      }
      zoomEnabled={
        false
      }
      pitchEnabled={
        false
      }
      rotateEnabled={
        false
      }
      initialRegion={{
        latitude:
          coords.lat,
        longitude:
          coords.lng,
        latitudeDelta:
          0.02,
        longitudeDelta:
          0.02,
      }}
    >
      <Marker
        coordinate={{
          latitude:
            coords.lat,
          longitude:
            coords.lng,
        }}
      />
    </MapView>
  );
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
      Record<string, string>
    >({});

  const [
    topAiLoading,
    setTopAiLoading,
  ] =
    useState<
      Record<string, boolean>
    >({});

  const [
    activeTab,
    setActiveTab,
  ] =
    useState<
      string | null
    >(null);

  const [
    areaCoordinates,
    setAreaCoordinates,
  ] =
    useState<
      Record<
        string,
        Coordinates
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

    Promise.all(
      targetAreas.map(
        async area => {
          try {
            const coords =
              await searchLocation(
                `세종특별자치시 ${area.name}`,
              );

            return [
              area.name,
              coords,
            ] as const;
          } catch (error) {
            console.error(
              `${area.name} 좌표 조회 실패`,
              error,
            );

            return [
              area.name,
              null,
            ] as const;
          }
        },
      ),
    ).then(results => {
      const map: Record<
        string,
        Coordinates
      > = {};

      results.forEach(
        (
          [
            name,
            coords,
          ],
        ) => {
          if (coords) {
            map[name] =
              coords;
          }
        },
      );

      setAreaCoordinates(
        map,
      );
    });

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
              analysisResults.length === 0
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
            groups.length === 0
          ) {
            setErrorMessage(
              '분석 결과를 가져오지 못했습니다. 잠시 후 다시 시도해주세요.',
            );

            return;
          }

          setGroupedResults(
            groups,
          );

          setActiveTab(
            groups[0]?.businessName ??
              null,
          );

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

  const handleCardPress = (
    businessName: string,
    result: RankedResult,
    allItems: RankedResult[],
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
            allItems.length,
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
        floatingPopulationScore:
          String(
            result.floatingPopulationScore,
          ),
        salesScore:
          String(
            result.salesScore,
          ),
        averageSalesScore:
          String(
            result.averageSalesScore,
          ),
        competitionScore:
          String(
            result.competitionScore,
          ),
        livingPopulationScore:
          String(
            result.livingPopulationScore,
          ),
        livingPopulationChangeScore:
          String(
            result.livingPopulationChangeScore,
          ),
        floatingPopulationChangeScore:
          String(
            result.floatingPopulationChangeScore,
          ),
        accessibilityScore:
          String(
            result.accessibilityScore,
          ),
        compareData:
          JSON.stringify(
            allItems.map(
              item => ({
                areaName:
                  item.areaName,
                rank:
                  item.rank,
                floatingPopulationScore:
                  item.floatingPopulationScore,
                salesScore:
                  item.salesScore,
                averageSalesScore:
                  item.averageSalesScore,
                competitionScore:
                  item.competitionScore,
                livingPopulationScore:
                  item.livingPopulationScore,
                livingPopulationChangeScore:
                  item.livingPopulationChangeScore,
                floatingPopulationChangeScore:
                  item.floatingPopulationChangeScore,
                accessibilityScore:
                  item.accessibilityScore,
              }),
            ),
          ),
      },
    });
  };

  const visibleGroups =
    groupedResults.length > 1
      ? groupedResults.filter(
          group =>
            group.businessName ===
            activeTab,
        )
      : groupedResults;

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ headerShown: false }} />

      <AnalysisHeader
        title="분석 결과"
        onBack={() =>
          router.replace({
            pathname: '/market-analysis/region',
            params: { businesses },
          })
        }
      />

      <AnalysisStepper
        steps={['업종 선택', '지역 선택', '분석 결과']}
        currentStep={3}
      />

      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
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
          입지 추천 결과
        </Text>

        <Text
          style={
            styles.subTitle
          }
        >
          데이터와 AI 분석을 통해 적합한 입지를 추천해드려요
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
            상권 데이터를 분석하는 중...
          </Text>

          <Text
            style={
              styles.loadingSubText
            }
          >
            여러 업종이나 지역을 선택한 경우 시간이 걸릴 수 있어요.
          </Text>
        </View>
      )}

      {!loading &&
        errorMessage !== '' && (
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
              분석 결과를 불러오지 못했어요
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
        errorMessage === '' &&
        groupedResults.length > 1 && (
          <View
            style={
              styles.tabRow
            }
          >
            {groupedResults.map(
              group => {
                const isActive =
                  activeTab ===
                  group.businessName;

                return (
                  <TouchableOpacity
                    key={
                      group.businessName
                    }
                    style={[
                      styles.tabButton,
                      isActive &&
                        styles.tabButtonActive,
                    ]}
                    activeOpacity={
                      0.7
                    }
                    onPress={() =>
                      setActiveTab(
                        group.businessName,
                      )
                    }
                  >
                    <Text
                      style={[
                        styles.tabButtonText,
                        isActive &&
                          styles.tabButtonTextActive,
                      ]}
                    >
                      {
                        group.businessName
                      }
                    </Text>
                  </TouchableOpacity>
                );
              },
            )}
          </View>
        )}

      {!loading &&
        errorMessage === '' &&
        visibleGroups.map(
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
                  styles.businessChip
                }
              >
                <Text
                  style={
                    styles.businessChipLabel
                  }
                >
                  선택한 업종
                </Text>

                <Text
                  style={
                    styles.businessChipName
                  }
                >
                  {
                    group.businessName
                  }
                </Text>
              </View>

              <Text
                style={
                  styles.groupTitle
                }
              >
                {`${group.businessName} 업종에 적합한 입지 TOP ${group.items.length}를 분석했어요!`}
              </Text>

              <Text
                style={
                  styles.groupDescription
                }
              >
                유동인구, 소비 패턴, 주변 환경 등을 종합적으로 분석한 결과예요.
              </Text>

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
                    💡 AI 한줄 요약
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
                        AI가 요약하는 중...
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
                    result.rank === 1;

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
                          group.items,
                        )
                      }
                    >
                      <View
                        style={
                          styles.cardImageWrap
                        }
                      >
                        {isPoint &&
                        result.latitude !== undefined &&
                        result.longitude !== undefined ? (
                          <CardMapThumbnail
                            coords={{
                              lat:
                                result.latitude,
                              lng:
                                result.longitude,
                            }}
                          />
                        ) : (
                          <CardMapThumbnail
                            coords={
                              areaCoordinates[
                                result.areaName
                              ]
                            }
                          />
                        )}

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
                              {getCompetitionLabel(
                                result.competitionScore,
                              )}
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

                        <View
                          style={
                            styles.cardBottomRow
                          }
                        >
                          <Text
                            style={
                              styles.oneLineSummary
                            }
                          >
                            {getOneLineSummary(
                              result,
                            )}
                          </Text>

                          <Text
                            style={
                              styles.arrow
                            }
                          >
                            ›
                          </Text>
                        </View>
                      </View>
                    </Pressable>
                  );
                },
              )}
            </View>
          ),
        )}
      </ScrollView>
    </View>
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
      fontSize: 13,
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
      marginBottom: 30,
    },

    tabRow: {
      flexDirection:
        'row',
      flexWrap:
        'wrap',
      gap: 8,
      marginBottom: 18,
    },

    tabButton: {
      paddingVertical: 9,
      paddingHorizontal: 16,
      borderRadius: 20,
      backgroundColor:
        COLORS.surface,
      borderWidth: 1,
      borderColor:
        COLORS.border,
    },

    tabButtonActive: {
      backgroundColor:
        COLORS.primary,
      borderColor:
        COLORS.primary,
    },

    tabButtonText: {
      fontSize: 13,
      fontWeight: '700',
      color:
        COLORS.textSecondary,
    },

    tabButtonTextActive: {
      color:
        '#FFFFFF',
    },

    businessChip: {
      flexDirection:
        'row',
      alignItems:
        'center',
      gap: 8,
      alignSelf:
        'flex-start',
      backgroundColor:
        '#F1FFF5',
      borderRadius: 14,
      paddingVertical: 8,
      paddingHorizontal: 14,
      marginBottom: 14,
    },

    businessChipLabel: {
      fontSize: 11,
      color:
        COLORS.textSecondary,
    },

    businessChipName: {
      fontSize: 14,
      fontWeight: '900',
      color:
        COLORS.primary,
    },

    groupTitle: {
      fontSize: 16,
      fontWeight: '900',
      color:
        COLORS.text,
      marginBottom: 4,
    },

    groupDescription: {
      fontSize: 12,
      color:
        COLORS.textSecondary,
      marginBottom: 16,
      lineHeight: 18,
    },

    aiCallout: {
      marginBottom: 14,
      padding: 16,
      borderRadius: 16,
      backgroundColor:
        '#EFF6FF',
      borderWidth: 1,
      borderColor:
        '#DBEAFE',
    },

    aiCalloutTitle: {
      fontSize: 13,
      fontWeight: '800',
      color:
        '#1D4ED8',
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
      borderRadius: 18,
      marginBottom: 14,
      backgroundColor:
        COLORS.surface,
      borderWidth: 1,
      borderColor:
        COLORS.border,
      overflow: 'hidden',
    },

    firstCard: {
      borderColor:
        COLORS.primary,
      borderWidth: 2,
    },

    cardImageWrap: {
      position:
        'relative',
    },

    cardMap: {
      width: '100%',
      height: 130,
    },

    mapFallback: {
      width: '100%',
      height: 130,
      alignItems:
        'center',
      justifyContent:
        'center',
      backgroundColor:
        COLORS.lightGray,
    },

    mapFallbackText: {
      fontSize: 28,
    },

    rankBadge: {
      position:
        'absolute',
      top: 10,
      left: 10,
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor:
        'rgba(17,17,17,0.75)',
      alignItems:
        'center',
      justifyContent:
        'center',
    },

    rankBadgeFirst: {
      backgroundColor:
        COLORS.primary,
    },

    rankText: {
      fontSize: 13,
      fontWeight: '800',
      color:
        '#FFFFFF',
    },

    rankTextFirst: {
      color:
        '#FFFFFF',
    },

    cardBody: {
      padding: 14,
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
      marginBottom: 8,
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
      fontWeight: '700',
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

    cardBottomRow: {
      flexDirection:
        'row',
      justifyContent:
        'space-between',
      alignItems:
        'center',
    },

    oneLineSummary: {
      flex: 1,
      fontSize: 12,
      color:
        COLORS.textSecondary,
      lineHeight: 17,
    },

    arrow: {
      fontSize: 22,
      fontWeight: '700',
      color:
        COLORS.textSecondary,
      marginLeft: 8,
    },
  });
