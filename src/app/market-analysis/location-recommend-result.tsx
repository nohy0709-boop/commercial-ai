import {
  businessCategories,
} from '@/constants/businessTypes';

import {
  COLORS,
} from '@/constants/colors';

import {
  sejongAreas,
} from '@/constants/sejongAreas';

import {
  analyzeCommercialPoint,
} from '@/services/commercialAnalysis';

import {
  BusinessRecommendationResult,
  calculateBusinessRecommendationScores,
} from '@/services/businessRecommendation';

import {
  useLocalSearchParams,
  useRouter,
} from 'expo-router';

import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const ANALYSIS_RADIUS = 500;

/**
 * 금액 표시
 */
function formatMoney(
  value: number,
) {
  if (
    !Number.isFinite(
      value,
    )
  ) {
    return '-';
  }

  if (
    value >=
    100000000
  ) {
    return `${(
      value /
      100000000
    ).toFixed(
      1,
    )}억원`;
  }

  if (
    value >=
    10000
  ) {
    return `${Math.round(
      value /
        10000,
    ).toLocaleString()}만원`;
  }

  return `${Math.round(
    value,
  ).toLocaleString()}원`;
}

/**
 * 추천 이유
 */
function getRecommendationReason(
  item:
    BusinessRecommendationResult,
) {
  const reasons = [
    {
      text:
        '점포당 카드소비가 높은 편이에요.',
      score:
        item.averageSalesScore,
    },
    {
      text:
        '주변 경쟁 부담이 비교적 낮아요.',
      score:
        item.competitionScore,
    },
    {
      text:
        '해당 업종의 소비 규모가 큰 편이에요.',
      score:
        item.salesScore,
    },
  ];

  return [
    ...reasons,
  ]
    .sort(
      (
        a,
        b,
      ) =>
        b.score -
        a.score,
    )
    .slice(
      0,
      2,
    )
    .map(
      reason =>
        reason.text,
    )
    .join(' ');
}

/**
 * 점수에 따른 태그
 */
function getSalesLabel(
  score: number,
) {
  if (
    score >= 75
  ) {
    return '소비 강점';
  }

  if (
    score >= 50
  ) {
    return '소비 양호';
  }

  if (
    score >= 25
  ) {
    return '소비 보통';
  }

  return '소비 낮음';
}

function getCompetitionLabel(
  score: number,
) {
  if (
    score >= 75
  ) {
    return '경쟁 여유';
  }

  if (
    score >= 50
  ) {
    return '경쟁 보통';
  }

  if (
    score >= 25
  ) {
    return '경쟁 있음';
  }

  return '경쟁 치열';
}

export default function LocationRecommendResultScreen() {
  const router =
    useRouter();

  const {
    region,
    latitude,
    longitude,
    address,
  } =
    useLocalSearchParams<{
      region?: string;
      latitude?: string;
      longitude?: string;
      address?: string;
    }>();

  const selectedLatitude =
    latitude
      ? Number(
          latitude,
        )
      : null;

  const selectedLongitude =
    longitude
      ? Number(
          longitude,
        )
      : null;

  const hasValidCoordinates =
    selectedLatitude !==
      null &&
    selectedLongitude !==
      null &&
    Number.isFinite(
      selectedLatitude,
    ) &&
    Number.isFinite(
      selectedLongitude,
    );

  const [
    results,
    setResults,
  ] =
    useState<
      BusinessRecommendationResult[]
    >([]);

  const [
    loading,
    setLoading,
  ] =
    useState(
      true,
    );

  const [
    errorMessage,
    setErrorMessage,
  ] =
    useState(
      '',
    );

  /**
   * 전체 업종을 비교한 뒤
   * 결과 화면에는 상위 3개만 표시
   */
  const topResults =
    useMemo(
      () =>
        results.slice(
          0,
          3,
        ),
      [
        results,
      ],
    );

  const delay = (
    ms: number,
  ) =>
    new Promise(
      resolve =>
        setTimeout(
          resolve,
          ms,
        ),
    );

  useEffect(() => {
    if (
      !region
    ) {
      setErrorMessage(
        '선택한 지역 정보를 찾을 수 없습니다.',
      );

      setLoading(
        false,
      );

      return;
    }

    if (
      !hasValidCoordinates
    ) {
      setErrorMessage(
        '세부 상권 분석을 위한 위치 좌표를 확인할 수 없습니다.',
      );

      setLoading(
        false,
      );

      return;
    }

    analyzeBusinesses();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    region,
    latitude,
    longitude,
  ]);

  /**
   * =====================================================
   * 업종 분석
   * =====================================================
   */

  const analyzeBusinesses =
    async () => {
      try {
        setLoading(
          true,
        );

        setErrorMessage(
          '',
        );

        const area =
          sejongAreas.find(
            item =>
              item.name ===
              region,
          );

        if (
          !area
        ) {
          throw new Error(
            `${region} 지역 정보를 찾을 수 없습니다.`,
          );
        }

        if (
          selectedLatitude ===
            null ||
          selectedLongitude ===
            null ||
          !Number.isFinite(
            selectedLatitude,
          ) ||
          !Number.isFinite(
            selectedLongitude,
          )
        ) {
          throw new Error(
            '세부 분석을 위한 위치 좌표를 확인할 수 없습니다.',
          );
        }

        const businesses =
          businessCategories.flatMap(
            category =>
              category.businesses,
          );

        const businessResults: {
          businessName: string;
          analysis: any;
        }[] = [];

        for (
          const business
          of businesses
        ) {
          try {
            const locationLabel =
              address?.trim() ||
              `${area.name} 내 선택 위치`;

            const analysis =
              await analyzeCommercialPoint(
                locationLabel,
                area.name,
                area.code,
                selectedLatitude,
                selectedLongitude,
                ANALYSIS_RADIUS,
                business.name,
                business.lclsCode,
                business.mclsCode,
                business.sclsCode,
              );

            businessResults.push(
              {
                businessName:
                  business.name,
                analysis,
              },
            );

            await delay(
              700,
            );
          } catch (
            error
          ) {
            console.error(
              `${business.name} 분석 실패`,
              error,
            );

            if (
              error instanceof
                Error &&
              error.message.includes(
                '429',
              )
            ) {
              await delay(
                2000,
              );
            }
          }
        }

        if (
          businessResults.length ===
          0
        ) {
          throw new Error(
            '분석 가능한 업종 데이터를 가져오지 못했습니다.',
          );
        }

        /**
         * 여기서 전체 업종을 먼저 계산함.
         * TOP 3만 계산하는 것이 아님.
         */
        const rankedResults =
          calculateBusinessRecommendationScores(
            businessResults,
          );

        setResults(
          rankedResults,
        );
      } catch (
        error
      ) {
        console.error(
          '업종 추천 분석 오류:',
          error,
        );

        setErrorMessage(
          error instanceof
            Error
            ? error.message
            : '업종 추천 분석 중 오류가 발생했습니다.',
        );
      } finally {
        setLoading(
          false,
        );
      }
    };

  /**
   * =====================================================
   * 상세 화면 이동
   * =====================================================
   */

  const openDetail =
    (
      item:
        BusinessRecommendationResult,
    ) => {
      router.push({
        pathname:
          '/market-analysis/region-result-detail',

        params: {
          businessName:
            item.businessName,

          areaName:
            address?.trim() ||
            `${region} 선택 위치`,

          rank:
            String(
              item.rank,
            ),

          totalCount:
            String(
              results.length,
            ),

          /**
           * 기존 상세화면이
           * suitabilityScore라는 이름을 사용하므로
           * 추천점수를 전달
           */
          suitabilityScore:
            String(
              item.recommendationScore,
            ),

          floatingPopulation:
            String(
              item.floatingPopulation,
            ),

          livingPopulation:
            String(
              item.livingPopulation,
            ),

          storeCount:
            String(
              item.storeCount,
            ),

          competitionDensity:
            String(
              item.competitionDensity,
            ),

          salesAmount:
            String(
              item.salesAmount,
            ),

          averageSalesPerStore:
            String(
              item.averageSalesPerStore,
            ),

          busStopCount:
            String(
              item.busStopCount,
            ),

          livingPopulationChangeRate:
            String(
              item.livingPopulationChangeRate,
            ),

          floatingPopulationChangeRate:
            String(
              item.floatingPopulationChangeRate,
            ),

          /**
           * 위치 기반 분석임을
           * 기존 상세화면에 알려줌
           */
          analysisType:
            'point',

          dongName:
            region ?? '',

          latitude:
            String(
              selectedLatitude,
            ),

          longitude:
            String(
              selectedLongitude,
            ),

          radius:
            String(
              ANALYSIS_RADIUS,
            ),
        },
      });
    };

  /**
   * =====================================================
   * LOADING
   * =====================================================
   */

  if (
    loading
  ) {
    return (
      <View
        style={
          styles.centerContainer
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
            styles.loadingTitle
          }
        >
          {region} 상권을
          분석하고 있습니다
        </Text>

        <Text
          style={
            styles.loadingDescription
          }
        >
          선택 지점 기준 반경{' '}
          {ANALYSIS_RADIUS}m의
          업종 데이터를 비교하고
          있어요.
        </Text>
      </View>
    );
  }

  /**
   * =====================================================
   * ERROR
   * =====================================================
   */

  if (
    errorMessage !==
    ''
  ) {
    return (
      <View
        style={
          styles.centerContainer
        }
      >
        <Text
          style={
            styles.errorText
          }
        >
          {
            errorMessage
          }
        </Text>

        <TouchableOpacity
          style={
            styles.errorButton
          }
          onPress={() =>
            router.back()
          }
        >
          <Text
            style={
              styles.errorButtonText
            }
          >
            이전 화면으로
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View
      style={
        styles.screen
      }
    >
      {/* APP BAR */}

      <View
        style={
          styles.appBar
        }
      >
        <TouchableOpacity
          onPress={() =>
            router.back()
          }
          style={
            styles.backButton
          }
          hitSlop={{
            top: 8,
            bottom: 8,
            left: 8,
            right: 8,
          }}
        >
          <Text
            style={
              styles.backButtonText
            }
          >
            ‹
          </Text>
        </TouchableOpacity>

        <View>
          <Text
            style={
              styles.appBarTitle
            }
          >
            업종 추천 결과
          </Text>

          <Text
            style={
              styles.appBarSubtitle
            }
          >
            {region} · 반경{' '}
            {ANALYSIS_RADIUS}m
          </Text>
        </View>
      </View>

      <ScrollView
        style={
          styles.scroll
        }
        contentContainerStyle={
          styles.container
        }
        showsVerticalScrollIndicator={
          false
        }
      >
        {/* TITLE */}

        <Text
          style={
            styles.eyebrow
          }
        >
          보유 장소 기반 업종 추천
        </Text>

        <Text
          style={
            styles.title
          }
        >
          이 위치에 어울리는
          {'\n'}
          업종 TOP 3
        </Text>

        <Text
          style={
            styles.description
          }
        >
          선택한 위치의 주변 점포와
          {region} 상권 데이터를 함께
          비교해 추천 순위를 만들었어요.
        </Text>

        {/* LOCATION */}

        <View
          style={
            styles.locationCard
          }
        >
          <View
            style={
              styles.locationTop
            }
          >
            <View
              style={
                styles.pinCircle
              }
            >
              <Text
                style={
                  styles.pinText
                }
              >
                📍
              </Text>
            </View>

            <View
              style={
                styles.locationTextArea
              }
            >
              <Text
                style={
                  styles.locationLabel
                }
              >
                분석 기준 위치
              </Text>

              <Text
                style={
                  styles.locationTitle
                }
              >
                {address?.trim() ||
                  `${region} 내 선택 위치`}
              </Text>
            </View>

            <View
              style={
                styles.regionBadge
              }
            >
              <Text
                style={
                  styles.regionBadgeText
                }
              >
                {region}
              </Text>
            </View>
          </View>

          <View
            style={
              styles.locationDivider
            }
          />

          <View
            style={
              styles.locationBottom
            }
          >
            <Text
              style={
                styles.locationBottomLabel
              }
            >
              세부 분석 범위
            </Text>

            <Text
              style={
                styles.locationBottomValue
              }
            >
              반경{' '}
              {ANALYSIS_RADIUS}m
            </Text>
          </View>
        </View>

        {/* TOP 3 HEADER */}

        <View
          style={
            styles.resultHeader
          }
        >
          <View>
            <Text
              style={
                styles.resultTitle
              }
            >
              추천 업종 TOP 3
            </Text>

            <Text
              style={
                styles.resultDescription
              }
            >
              카드를 누르면 상세 분석을
              확인할 수 있어요.
            </Text>
          </View>

          <View
            style={
              styles.countBadge
            }
          >
            <Text
              style={
                styles.countBadgeText
              }
            >
              {
                topResults.length
              }
              개
            </Text>
          </View>
        </View>

        {/* RESULT CARDS */}

        {topResults.map(
          item => {
            const isFirst =
              item.rank ===
              1;

            return (
              <Pressable
                key={
                  item.businessName
                }
                style={[
                  styles.card,

                  isFirst &&
                    styles.firstCard,
                ]}
                onPress={() =>
                  openDetail(
                    item,
                  )
                }
              >
                {/* 카드 상단 */}

                <View
                  style={
                    styles.cardTop
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
                        item.rank
                      }
                      위
                    </Text>
                  </View>

                  <Text
                    style={
                      styles.chevron
                    }
                  >
                    ›
                  </Text>
                </View>

                {/* 업종 */}

                <View
                  style={
                    styles.businessRow
                  }
                >
                  <View
                    style={
                      styles.businessInfo
                    }
                  >
                    <Text
                      style={
                        styles.businessName
                      }
                    >
                      {
                        item.businessName
                      }
                    </Text>

                    <Text
                      style={
                        styles.businessLocation
                      }
                    >
                      {region} · 선택 위치 기준
                    </Text>
                  </View>

                  <View
                    style={
                      styles.scoreArea
                    }
                  >
                    <Text
                      style={
                        styles.scoreValue
                      }
                    >
                      {
                        item.recommendationScore
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

                {/* TAGS */}

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
                      {getSalesLabel(
                        item.averageSalesScore,
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
                        item.competitionScore,
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
                      반경 점포{' '}
                      {Math.round(
                        item.storeCount,
                      )}
                      개
                    </Text>
                  </View>
                </View>

                {/* REASON */}

                <Text
                  style={
                    styles.reason
                  }
                >
                  {getRecommendationReason(
                    item,
                  )}
                </Text>

                {/* METRICS */}

                <View
                  style={
                    styles.metricRow
                  }
                >
                  <View
                    style={
                      styles.metricItem
                    }
                  >
                    <Text
                      style={
                        styles.metricLabel
                      }
                    >
                      점포당 카드소비
                    </Text>

                    <Text
                      style={
                        styles.metricValue
                      }
                    >
                      {formatMoney(
                        item.averageSalesPerStore,
                      )}
                    </Text>
                  </View>

                  <View
                    style={
                      styles.metricDivider
                    }
                  />

                  <View
                    style={
                      styles.metricItem
                    }
                  >
                    <Text
                      style={
                        styles.metricLabel
                      }
                    >
                      경쟁밀도
                    </Text>

                    <Text
                      style={
                        styles.metricValue
                      }
                    >
                      {item.competitionDensity.toFixed(
                        2,
                      )}
                    </Text>
                  </View>

                  <View
                    style={
                      styles.metricDivider
                    }
                  />

                  <View
                    style={
                      styles.metricItem
                    }
                  >
                    <Text
                      style={
                        styles.metricLabel
                      }
                    >
                      카드소비
                    </Text>

                    <Text
                      style={
                        styles.metricValue
                      }
                    >
                      {formatMoney(
                        item.salesAmount,
                      )}
                    </Text>
                  </View>
                </View>
              </Pressable>
            );
          },
        )}

        {/* NOTICE */}

        <View
          style={
            styles.notice
          }
        >
          <Text
            style={
              styles.noticeTitle
            }
          >
            분석 기준
          </Text>

          <Text
            style={
              styles.noticeText
            }
          >
            주변 점포 수와 경쟁밀도는 선택
            지점 반경 {ANALYSIS_RADIUS}m를
            기준으로 분석합니다. 인구·카드소비·
            접근성 등은 해당 행정동 데이터를
            참고합니다.
          </Text>
        </View>
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

    appBar: {
      flexDirection:
        'row',
      alignItems:
        'center',
      backgroundColor:
        COLORS.surface,
      borderBottomWidth: 1,
      borderBottomColor:
        COLORS.border,
      paddingHorizontal: 20,
      paddingVertical: 12,
    },

    backButton: {
      width: 32,
      height: 32,
      alignItems:
        'center',
      justifyContent:
        'center',
      marginRight: 8,
      marginLeft: -6,
    },

    backButtonText: {
      fontSize: 26,
      color:
        COLORS.text,
      marginTop: -2,
    },

    appBarTitle: {
      fontSize: 16,
      fontWeight:
        '700',
      color:
        COLORS.text,
    },

    appBarSubtitle: {
      fontSize: 11,
      color:
        COLORS.textSecondary,
      marginTop: 1,
    },

    scroll: {
      flex: 1,
    },

    container: {
      width:
        '100%',
      maxWidth: 900,
      alignSelf:
        'center',
      padding: 20,
      paddingBottom: 50,
    },

    centerContainer: {
      flex: 1,
      justifyContent:
        'center',
      alignItems:
        'center',
      padding: 30,
      backgroundColor:
        COLORS.background,
    },

    loadingTitle: {
      marginTop: 20,
      fontSize: 18,
      fontWeight:
        '800',
      color:
        COLORS.text,
      textAlign:
        'center',
    },

    loadingDescription: {
      marginTop: 8,
      fontSize: 13,
      lineHeight: 19,
      color:
        COLORS.textSecondary,
      textAlign:
        'center',
    },

    errorText: {
      fontSize: 14,
      lineHeight: 20,
      color:
        COLORS.danger,
      textAlign:
        'center',
    },

    errorButton: {
      marginTop: 20,
      paddingVertical: 11,
      paddingHorizontal: 18,
      borderRadius: 12,
      backgroundColor:
        COLORS.primary,
    },

    errorButtonText: {
      fontSize: 13,
      fontWeight:
        '800',
      color:
        '#FFFFFF',
    },

    eyebrow: {
      marginTop: 4,
      fontSize: 12,
      fontWeight:
        '800',
      color:
        COLORS.primary,
    },

    title: {
      marginTop: 6,
      fontSize: 27,
      lineHeight: 34,
      fontWeight:
        '900',
      color:
        COLORS.text,
    },

    description: {
      marginTop: 8,
      marginBottom: 18,
      fontSize: 13,
      lineHeight: 20,
      color:
        COLORS.textSecondary,
    },

    /**
     * LOCATION
     */

    locationCard: {
      padding: 16,
      marginBottom: 28,
      borderWidth: 1,
      borderColor:
        COLORS.border,
      borderRadius: 18,
      backgroundColor:
        COLORS.surface,
    },

    locationTop: {
      flexDirection:
        'row',
      alignItems:
        'center',
    },

    pinCircle: {
      width: 40,
      height: 40,
      marginRight: 11,
      alignItems:
        'center',
      justifyContent:
        'center',
      borderRadius: 20,
      backgroundColor:
        COLORS.primaryLight,
    },

    pinText: {
      fontSize: 18,
    },

    locationTextArea: {
      flex: 1,
      paddingRight: 8,
    },

    locationLabel: {
      marginBottom: 3,
      fontSize: 10,
      color:
        COLORS.textSecondary,
    },

    locationTitle: {
      fontSize: 13,
      lineHeight: 18,
      fontWeight:
        '800',
      color:
        COLORS.text,
    },

    regionBadge: {
      paddingVertical: 5,
      paddingHorizontal: 9,
      borderRadius: 999,
      backgroundColor:
        COLORS.primaryLight,
    },

    regionBadgeText: {
      fontSize: 10,
      fontWeight:
        '800',
      color:
        COLORS.primary,
    },

    locationDivider: {
      height: 1,
      marginVertical: 13,
      backgroundColor:
        COLORS.border,
    },

    locationBottom: {
      flexDirection:
        'row',
      alignItems:
        'center',
      justifyContent:
        'space-between',
    },

    locationBottomLabel: {
      fontSize: 11,
      color:
        COLORS.textSecondary,
    },

    locationBottomValue: {
      fontSize: 12,
      fontWeight:
        '900',
      color:
        COLORS.primary,
    },

    /**
     * RESULT HEADER
     */

    resultHeader: {
      flexDirection:
        'row',
      alignItems:
        'center',
      justifyContent:
        'space-between',
      marginBottom: 14,
    },

    resultTitle: {
      fontSize: 19,
      fontWeight:
        '900',
      color:
        COLORS.text,
    },

    resultDescription: {
      marginTop: 4,
      fontSize: 12,
      color:
        COLORS.textSecondary,
    },

    countBadge: {
      paddingVertical: 5,
      paddingHorizontal: 10,
      borderRadius: 999,
      backgroundColor:
        COLORS.primaryLight,
    },

    countBadgeText: {
      fontSize: 11,
      fontWeight:
        '800',
      color:
        COLORS.primary,
    },

    /**
     * CARD
     */

    card: {
      padding: 17,
      marginBottom: 14,
      borderWidth: 1,
      borderColor:
        COLORS.border,
      borderRadius: 18,
      backgroundColor:
        COLORS.surface,

      shadowColor:
        '#000000',

      shadowOffset: {
        width: 0,
        height: 2,
      },

      shadowOpacity:
        0.035,

      shadowRadius: 6,

      elevation: 1,
    },

    firstCard: {
      borderWidth: 2,
      borderColor:
        COLORS.primary,
    },

    cardTop: {
      flexDirection:
        'row',
      alignItems:
        'center',
      justifyContent:
        'space-between',
      marginBottom: 12,
    },

    rankBadge: {
      paddingVertical: 5,
      paddingHorizontal: 11,
      borderRadius: 999,
      backgroundColor:
        '#EEF1EF',
    },

    rankBadgeFirst: {
      backgroundColor:
        COLORS.primary,
    },

    rankText: {
      fontSize: 11,
      fontWeight:
        '900',
      color:
        COLORS.textSecondary,
    },

    rankTextFirst: {
      color:
        '#FFFFFF',
    },

    chevron: {
      marginTop: -4,
      fontSize: 27,
      color:
        COLORS.textSecondary,
    },

    businessRow: {
      flexDirection:
        'row',
      alignItems:
        'flex-start',
      justifyContent:
        'space-between',
      gap: 12,
    },

    businessInfo: {
      flex: 1,
    },

    businessName: {
      fontSize: 20,
      fontWeight:
        '900',
      color:
        COLORS.text,
    },

    businessLocation: {
      marginTop: 4,
      fontSize: 11,
      color:
        COLORS.textSecondary,
    },

    scoreArea: {
      flexDirection:
        'row',
      alignItems:
        'flex-end',
    },

    scoreValue: {
      fontSize: 23,
      fontWeight:
        '900',
      color:
        COLORS.primary,
    },

    scoreUnit: {
      marginLeft: 2,
      marginBottom: 3,
      fontSize: 11,
      fontWeight:
        '700',
      color:
        COLORS.text,
    },

    tagRow: {
      flexDirection:
        'row',
      flexWrap:
        'wrap',
      gap: 6,
      marginTop: 13,
    },

    tag: {
      paddingVertical: 5,
      paddingHorizontal: 9,
      borderRadius: 9,
      backgroundColor:
        COLORS.background,
    },

    tagText: {
      fontSize: 10,
      fontWeight:
        '700',
      color:
        COLORS.textSecondary,
    },

    reason: {
      marginTop: 13,
      fontSize: 12,
      lineHeight: 18,
      color:
        COLORS.textSecondary,
    },

    metricRow: {
      flexDirection:
        'row',
      marginTop: 15,
      paddingTop: 14,
      borderTopWidth: 1,
      borderTopColor:
        COLORS.border,
    },

    metricItem: {
      flex: 1,
    },

    metricDivider: {
      width: 1,
      marginHorizontal: 9,
      backgroundColor:
        COLORS.border,
    },

    metricLabel: {
      marginBottom: 5,
      fontSize: 9,
      color:
        COLORS.textSecondary,
    },

    metricValue: {
      fontSize: 11,
      fontWeight:
        '800',
      color:
        COLORS.text,
    },

    /**
     * NOTICE
     */

    notice: {
      marginTop: 8,
      padding: 14,
      borderRadius: 14,
      backgroundColor:
        '#F5F7F6',
    },

    noticeTitle: {
      marginBottom: 5,
      fontSize: 11,
      fontWeight:
        '800',
      color:
        COLORS.text,
    },

    noticeText: {
      fontSize: 10,
      lineHeight: 16,
      color:
        COLORS.textSecondary,
    },
  });