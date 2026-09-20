import MonthlyCandidateComparison from '@/components/MonthlyCandidateComparison';

import { COLORS } from '@/constants/colors';
import { sejongAreas } from '@/constants/sejongAreas';

import type {
  AIExplanation,
} from '@/services/aiExplanation';

import {
  generateAIExplanation,
} from '@/services/aiExplanation';

import type {
  ScoredCommercialAnalysisResult,
} from '@/services/commercialAnalysis';

import {
  analyzeCommercialArea,
  calculateSuitabilityScores,
} from '@/services/commercialAnalysis';

import type {
  Coordinates,
} from '@/services/geocoding';

import {
  searchLocation,
} from '@/services/geocoding';

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
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

/**
 * =====================================================
 * TYPES
 * =====================================================
 */

type RankedResult =
  ScoredCommercialAnalysisResult & {
    rank: number;
  };

/**
 * =====================================================
 * UTIL
 * =====================================================
 */

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

/**
 * AI **강조** 처리
 */
function renderEmphasizedText(
  text: string,
  textStyle: object,
) {
  const parts =
    text.split(
      /(\*\*.*?\*\*)/g,
    );

  return (
    <Text
      style={
        textStyle
      }
    >
      {parts.map(
        (
          part,
          index,
        ) => {
          if (
            part.startsWith(
              '**',
            ) &&
            part.endsWith(
              '**',
            )
          ) {
            return (
              <Text
                key={
                  index
                }
                style={
                  styles.aiHighlight
                }
              >
                {part.slice(
                  2,
                  -2,
                )}
              </Text>
            );
          }

          return part;
        },
      )}
    </Text>
  );
}

/**
 * 동점 순위
 */
function assignRanksWithTies(
  sortedResults:
    ScoredCommercialAnalysisResult[],
): RankedResult[] {
  const ranked:
    RankedResult[] = [];

  sortedResults.forEach(
    (
      item,
      index,
    ) => {
      const rank =
        index > 0 &&
        sortedResults[
          index - 1
        ].suitabilityScore ===
          item.suitabilityScore
          ? ranked[
              index - 1
            ].rank
          : index + 1;

      ranked.push({
        ...item,
        rank,
      });
    },
  );

  return ranked;
}

function getRankLabel(
  item: RankedResult,
  allResults: RankedResult[],
) {
  const tiedCount =
    allResults.filter(
      result =>
        result.rank ===
        item.rank,
    ).length;

  return tiedCount > 1
    ? `공동 ${item.rank}위`
    : `${item.rank}위`;
}

function getLevelLabel(
  score: number,
) {
  if (
    score >= 75
  ) {
    return '매우 높음';
  }

  if (
    score >= 50
  ) {
    return '높음';
  }

  if (
    score >= 25
  ) {
    return '보통';
  }

  return '낮음';
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

function formatChangeRate(
  value: number,
) {
  if (
    !Number.isFinite(
      value,
    )
  ) {
    return '-';
  }

  return `${
    value > 0
      ? '+'
      : ''
  }${value.toFixed(
    2,
  )}%`;
}

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
    value >= 10000
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
 * =====================================================
 * MAP THUMBNAIL
 * =====================================================
 */

function CardMapThumbnail({
  coords,
}: {
  coords:
    | Coordinates
    | undefined;
}) {
  if (
    Platform.OS ===
      'web' ||
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

/**
 * =====================================================
 * MAIN
 * =====================================================
 */

export default function ResultScreen() {
  const router =
    useRouter();

  const {
    businessName,
    lclsCode,
    mclsCode,
    sclsCode,
    areas,
  } =
    useLocalSearchParams<{
      businessName: string;
      lclsCode: string;
      mclsCode: string;
      sclsCode: string;
      areas: string;
    }>();

  const [
    results,
    setResults,
  ] =
    useState<
      RankedResult[]
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

  /**
   * 카드 상세
   */
  const [
    expandedKeys,
    setExpandedKeys,
  ] =
    useState<
      Record<
        string,
        boolean
      >
    >({});

  /**
   * AI
   */
  const [
    aiExplanations,
    setAiExplanations,
  ] =
    useState<
      Record<
        string,
        AIExplanation
      >
    >({});

  const [
    aiLoadingKeys,
    setAiLoadingKeys,
  ] =
    useState<
      Record<
        string,
        boolean
      >
    >({});

  const [
    aiErrorKeys,
    setAiErrorKeys,
  ] =
    useState<
      Record<
        string,
        string
      >
    >({});

  const [
    aiDetailExpandedKeys,
    setAiDetailExpandedKeys,
  ] =
    useState<
      Record<
        string,
        boolean
      >
    >({});

  /**
   * 월별 비교 컴포넌트용
   */
  const comparisonItems =
    useMemo(
      () =>
        results.map(
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
      [
        results,
      ],
    );

  /**
   * =====================================================
   * ANALYSIS
   * =====================================================
   */

  useEffect(() => {
    const selectedAreaNames =
      areas
        ?.split(
          ',',
        )
        .filter(
          Boolean,
        ) ?? [];

    const targets =
      sejongAreas.filter(
        area =>
          selectedAreaNames.includes(
            area.name,
          ),
      );

    /**
     * 지역 좌표
     */
    Promise.all(
      targets.map(
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
          } catch (
            error
          ) {
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
    ).then(
      coordinateResults => {
        const map:
          Record<
            string,
            Coordinates
          > = {};

        coordinateResults.forEach(
          ([
            name,
            coords,
          ]) => {
            if (
              coords
            ) {
              map[
                name
              ] =
                coords;
            }
          },
        );

        setAreaCoordinates(
          map,
        );
      },
    );

    /**
     * 상권 분석
     */
    const run =
      async () => {
        try {
          setLoading(
            true,
          );

          setErrorMessage(
            '',
          );

          setResults(
            [],
          );

          const analysisResults:
            ScoredCommercialAnalysisResult[] =
            [];

          for (
            const area
            of targets
          ) {
            try {
              const result =
                await analyzeCommercialArea(
                  area.name,

                  area.code,

                  businessName,

                  lclsCode,

                  mclsCode ||
                    undefined,

                  sclsCode ||
                    undefined,
                );

              analysisResults.push(
                result as ScoredCommercialAnalysisResult,
              );

              await delay(
                600,
              );
            } catch (
              error
            ) {
              console.error(
                `${area.name} 분석 실패`,
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
            analysisResults.length ===
            0
          ) {
            setErrorMessage(
              '분석 결과를 가져오지 못했습니다. 잠시 후 다시 시도해주세요.',
            );

            return;
          }

          const scoredResults =
            calculateSuitabilityScores(
              analysisResults,
            );

          const ranked =
            assignRanksWithTies(
              scoredResults,
            );

          setResults(
            ranked,
          );

          /**
           * 1위는 기본적으로 상세 펼침
           */
          const first =
            ranked[0];

          if (
            first
          ) {
            setExpandedKeys({
              [first.areaName]:
                true,
            });
          }
        } catch (
          error
        ) {
          console.error(
            '상권 분석 오류:',
            error,
          );

          setErrorMessage(
            error instanceof
              Error
              ? error.message
              : '상권 분석 중 오류가 발생했습니다.',
          );
        } finally {
          setLoading(
            false,
          );
        }
      };

    run();
  }, [
    businessName,
    lclsCode,
    mclsCode,
    sclsCode,
    areas,
  ]);

  /**
   * =====================================================
   * AI
   * =====================================================
   */

  const handleGenerateAI =
    async (
      item: RankedResult,
    ) => {
      const key =
        item.areaName;

      if (
        aiExplanations[
          key
        ] ||
        aiLoadingKeys[
          key
        ]
      ) {
        return;
      }

      setAiLoadingKeys(
        previous => ({
          ...previous,

          [key]:
            true,
        }),
      );

      setAiErrorKeys(
        previous => ({
          ...previous,

          [key]:
            '',
        }),
      );

      try {
        const explanation =
          await generateAIExplanation(
            {
              지역:
                item.areaName,

              업종:
                businessName,

              유동인구:
                item.floatingPopulation,

              생활인구:
                item.livingPopulation,

              점포수:
                item.storeCount,

              경쟁밀도:
                item.competitionDensity,

              전체카드소비:
                item.salesAmount,

              점포당카드소비:
                item.averageSalesPerStore,

              버스정류장수:
                item.busStopCount,

              적합도점수:
                item.suitabilityScore,

              순위:
                item.rank,
            },
          );

        setAiExplanations(
          previous => ({
            ...previous,

            [key]:
              explanation,
          }),
        );
      } catch (
        error
      ) {
        console.error(
          'AI 설명 생성 오류:',
          error,
        );

        setAiErrorKeys(
          previous => ({
            ...previous,

            [key]:
              error instanceof
                Error
                ? error.message
                : 'AI 설명을 가져오지 못했습니다.',
          }),
        );
      } finally {
        setAiLoadingKeys(
          previous => ({
            ...previous,

            [key]:
              false,
          }),
        );
      }
    };

  const toggleExpanded =
    (
      key: string,
    ) => {
      setExpandedKeys(
        previous => ({
          ...previous,

          [key]:
            !previous[
              key
            ],
        }),
      );
    };

  const toggleAiDetail =
    (
      key: string,
    ) => {
      setAiDetailExpandedKeys(
        previous => ({
          ...previous,

          [key]:
            !previous[
              key
            ],
        }),
      );
    };

  /**
   * =====================================================
   * RENDER
   * =====================================================
   */

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
            router.replace(
              '/market-analysis',
            )
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
            적합성 분석 결과
          </Text>

          <Text
            style={
              styles.appBarSubtitle
            }
          >
            {businessName}
            {' · '}
            지역{' '}
            {areas
              ? areas
                  .split(
                    ',',
                  )
                  .filter(
                    Boolean,
                  ).length
              : 0}
            개
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
        <Text
          style={
            styles.title
          }
        >
          {`'${businessName}' 지역별 적합도 순위`}
        </Text>

        {/* LOADING */}

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
          </View>
        )}

        {/* ERROR */}

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
                  styles.error
                }
              >
                {
                  errorMessage
                }
              </Text>
            </View>
          )}

        {/* RESULTS */}

        {!loading &&
          errorMessage ===
            '' &&
          results.map(
            item => {
              const key =
                item.areaName;

              const explanation =
                aiExplanations[
                  key
                ];

              const aiLoading =
                aiLoadingKeys[
                  key
                ];

              const aiError =
                aiErrorKeys[
                  key
                ];

              const expanded =
                expandedKeys[
                  key
                ] ??
                false;

              const aiDetailExpanded =
                aiDetailExpandedKeys[
                  key
                ];

              const isFirst =
                item.rank ===
                1;

              return (
                <View
                  key={
                    key
                  }
                  style={[
                    styles.card,

                    isFirst &&
                      styles.firstCard,
                  ]}
                >
                  {/* MAP */}

                  <View
                    style={
                      styles.cardImageWrap
                    }
                  >
                    <CardMapThumbnail
                      coords={
                        areaCoordinates[
                          item.areaName
                        ]
                      }
                    />

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
                        {getRankLabel(
                          item,
                          results,
                        )}
                      </Text>
                    </View>
                  </View>

                  <View
                    style={
                      styles.cardBody
                    }
                  >
                    {/* 지역명 */}

                    <View
                      style={
                        styles.cardTopRow
                      }
                    >
                      <Text
                        style={
                          styles.name
                        }
                      >
                        {item.areaName}{' '}
                        일대
                      </Text>

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
                            item.suitabilityScore
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

                    {/* TAG */}

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
                            item.floatingPopulationScore,
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
                    </View>

                    {/* ===================================
                        핵심 상권 지표
                    ==================================== */}

                    <View
                      style={
                        styles.sectionHeader
                      }
                    >
                      <Text
                        style={
                          styles.sectionTitle
                        }
                      >
                        핵심 상권 지표
                      </Text>

                      <Text
                        style={
                          styles.sectionDescription
                        }
                      >
                        이 지역에서 {businessName} 업종을 운영할 때의 주요 데이터를 확인해보세요.
                      </Text>
                    </View>

                    <View
                      style={
                        styles.metricGrid
                      }
                    >
                      <MetricCard
                        label="유동인구"
                        value={`${Math.round(
                          item.floatingPopulation,
                        ).toLocaleString()}명`}
                      />

                      <MetricCard
                        label="생활인구"
                        value={`${Math.round(
                          item.livingPopulation,
                        ).toLocaleString()}명`}
                      />

                      <MetricCard
                        label={`${businessName} 점포`}
                        value={`${Math.round(
                          item.storeCount,
                        ).toLocaleString()}개`}
                      />

                      <MetricCard
                        label="경쟁밀도"
                        value={
                          item.competitionDensity.toFixed(
                            3,
                          )
                        }
                      />

                      <MetricCard
                        label="전체 카드소비"
                        value={
                          formatMoney(
                            item.salesAmount,
                          )
                        }
                      />

                      <MetricCard
                        label="점포당 카드소비"
                        value={
                          formatMoney(
                            item.averageSalesPerStore,
                          )
                        }
                      />

                      <MetricCard
                        label="유동인구 증감률"
                        value={
                          formatChangeRate(
                            item.floatingPopulationChangeRate,
                          )
                        }
                      />

                      <MetricCard
                        label="생활인구 증감률"
                        value={
                          formatChangeRate(
                            item.livingPopulationChangeRate,
                          )
                        }
                      />

                      <MetricCard
                        label="버스정류장"
                        value={`${Math.round(
                          item.busStopCount,
                        ).toLocaleString()}개`}
                      />
                    </View>

                    {/* 상세 토글 */}

                    <TouchableOpacity
                      style={
                        styles.expandButton
                      }
                      activeOpacity={
                        0.75
                      }
                      onPress={() =>
                        toggleExpanded(
                          key,
                        )
                      }
                    >
                      <Text
                        style={
                          styles.expandButtonText
                        }
                      >
                        {expanded
                          ? '상세 분석 접기 ▲'
                          : '상세 분석 보기 ▼'}
                      </Text>
                    </TouchableOpacity>

                    {expanded && (
                      <>
                        {/* ===================================
                            월별 그래프
                        ==================================== */}

                        <View
                          style={
                            styles.detailBlock
                          }
                        >
                          <Text
                            style={
                              styles.blockTitle
                            }
                          >
                            월별 상권 흐름
                          </Text>

                          <Text
                            style={
                              styles.blockDescription
                            }
                          >
                            현재 지역은 실선, 다른 후보 지역은 점선으로 비교됩니다.
                          </Text>

                          <MonthlyCandidateComparison
                            compareItems={
                              comparisonItems
                            }
                            currentAreaName={
                              item.areaName
                            }
                          />
                        </View>

                        {/* ===================================
                            지표별 점수
                        ==================================== */}

                        <View
                          style={
                            styles.scoreDetailBox
                          }
                        >
                          <Text
                            style={
                              styles.blockTitle
                            }
                          >
                            지표별 평가
                          </Text>

                          <Text
                            style={
                              styles.blockDescription
                            }
                          >
                            종합 적합도에 반영된 세부 평가 점수입니다.
                          </Text>

                          <ScoreBar
                            label="유동인구"
                            value={
                              item.floatingPopulationScore
                            }
                          />

                          <ScoreBar
                            label="생활인구"
                            value={
                              item.livingPopulationScore
                            }
                          />

                          <ScoreBar
                            label="전체 카드소비"
                            value={
                              item.salesScore
                            }
                          />

                          <ScoreBar
                            label="점포당 카드소비"
                            value={
                              item.averageSalesScore
                            }
                          />

                          <ScoreBar
                            label="경쟁 여유도"
                            value={
                              item.competitionScore
                            }
                          />

                          <ScoreBar
                            label="유동인구 증가세"
                            value={
                              item.floatingPopulationChangeScore
                            }
                          />

                          <ScoreBar
                            label="생활인구 증가세"
                            value={
                              item.livingPopulationChangeScore
                            }
                          />

                          <ScoreBar
                            label="교통 접근성"
                            value={
                              item.accessibilityScore
                            }
                          />
                        </View>
                      </>
                    )}

                    {/* ===================================
                        AI
                    ==================================== */}

                    <View
                      style={
                        styles.aiArea
                      }
                    >
                      <Text
                        style={
                          styles.blockTitle
                        }
                      >
                        AI 분석
                      </Text>

                      {!explanation && (
                        <TouchableOpacity
                          style={
                            styles.aiButton
                          }
                          activeOpacity={
                            0.7
                          }
                          disabled={
                            aiLoading
                          }
                          onPress={() =>
                            handleGenerateAI(
                              item,
                            )
                          }
                        >
                          {aiLoading ? (
                            <ActivityIndicator
                              size="small"
                              color={
                                COLORS.primary
                              }
                            />
                          ) : (
                            <Text
                              style={
                                styles.aiButtonText
                              }
                            >
                              AI 설명 보기
                            </Text>
                          )}
                        </TouchableOpacity>
                      )}

                      {aiError &&
                        !aiLoading && (
                        <Text
                          style={
                            styles.aiError
                          }
                        >
                          {
                            aiError
                          }
                        </Text>
                      )}

                      {explanation && (
                        <View
                          style={
                            styles.aiBox
                          }
                        >
                          <View
                            style={
                              styles.aiTitleRow
                            }
                          >
                            <View
                              style={
                                styles.aiIconBox
                              }
                            >
                              <Text
                                style={
                                  styles.aiIconText
                                }
                              >
                                ✨
                              </Text>
                            </View>

                            <Text
                              style={
                                styles.aiLabel
                              }
                            >
                              AI 추천 이유
                            </Text>
                          </View>

                          {renderEmphasizedText(
                            explanation.recommendationReason,
                            styles.aiText,
                          )}

                          {/* 장점/리스크는 기본 표시 */}

                          <View
                            style={
                              styles.chunkList
                            }
                          >
                            {explanation.advantages.map(
                              (
                                advantage,
                                index,
                              ) => (
                                <View
                                  key={`adv-${index}`}
                                  style={
                                    styles.chunkRowGood
                                  }
                                >
                                  <Text
                                    style={
                                      styles.chunkIconGood
                                    }
                                  >
                                    ✓
                                  </Text>

                                  {renderEmphasizedText(
                                    advantage,
                                    styles.chunkTextGood,
                                  )}
                                </View>
                              ),
                            )}

                            {explanation.risks.map(
                              (
                                risk,
                                index,
                              ) => (
                                <View
                                  key={`risk-${index}`}
                                  style={
                                    styles.chunkRowWarn
                                  }
                                >
                                  <Text
                                    style={
                                      styles.chunkIconWarn
                                    }
                                  >
                                    !
                                  </Text>

                                  {renderEmphasizedText(
                                    risk,
                                    styles.chunkTextWarn,
                                  )}
                                </View>
                              ),
                            )}
                          </View>

                          <TouchableOpacity
                            style={
                              styles.detailToggleButton
                            }
                            activeOpacity={
                              0.7
                            }
                            onPress={() =>
                              toggleAiDetail(
                                key,
                              )
                            }
                          >
                            <Text
                              style={
                                styles.detailToggleText
                              }
                            >
                              {aiDetailExpanded
                                ? 'AI 상세 설명 접기 ▲'
                                : 'AI 상세 설명 보기 ▼'}
                            </Text>
                          </TouchableOpacity>

                          {aiDetailExpanded && (
                            <View
                              style={
                                styles.detailSection
                              }
                            >
                              <Text
                                style={
                                  styles.detailLabel
                                }
                              >
                                주요 특징
                              </Text>

                              {renderEmphasizedText(
                                explanation.keyFeatures,
                                styles.aiText,
                              )}

                              <Text
                                style={
                                  styles.detailLabel
                                }
                              >
                                고려사항
                              </Text>

                              <Text
                                style={
                                  styles.aiText
                                }
                              >
                                {
                                  explanation.considerations
                                }
                              </Text>
                            </View>
                          )}
                        </View>
                      )}
                    </View>
                  </View>
                </View>
              );
            },
          )}
      </ScrollView>
    </View>
  );
}

/**
 * =====================================================
 * METRIC CARD
 * =====================================================
 */

function MetricCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <View
      style={
        styles.metricCard
      }
    >
      <Text
        style={
          styles.metricLabel
        }
      >
        {label}
      </Text>

      <Text
        style={
          styles.metricValue
        }
      >
        {value}
      </Text>
    </View>
  );
}

/**
 * =====================================================
 * SCORE BAR
 * =====================================================
 */

function ScoreBar({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  const safeValue =
    Math.max(
      0,
      Math.min(
        100,
        Number(
          value,
        ) || 0,
      ),
    );

  return (
    <View
      style={
        styles.scoreBarItem
      }
    >
      <View
        style={
          styles.scoreBarHeader
        }
      >
        <Text
          style={
            styles.scoreBarLabel
          }
        >
          {label}
        </Text>

        <Text
          style={
            styles.scoreBarNumber
          }
        >
          {Math.round(
            safeValue,
          )}
        </Text>
      </View>

      <View
        style={
          styles.scoreTrack
        }
      >
        <View
          style={[
            styles.scoreFill,

            {
              width:
                `${safeValue}%`,
            },
          ]}
        />
      </View>
    </View>
  );
}

/**
 * =====================================================
 * STYLES
 * =====================================================
 */

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
      maxWidth: 1200,
      alignSelf:
        'center',
      padding: 20,
      paddingBottom: 40,
    },

    title: {
      fontSize: 18,
      fontWeight:
        '800',
      color:
        COLORS.text,
      marginBottom: 16,
    },

    loadingBox: {
      marginTop: 30,
      alignItems:
        'center',
      gap: 10,
    },

    loadingText: {
      fontSize: 14,
      color:
        COLORS.textSecondary,
    },

    errorBox: {
      padding: 18,
      borderRadius: 18,
      backgroundColor:
        COLORS.dangerLight,
    },

    error: {
      color:
        COLORS.danger,
      fontSize: 14,
    },

    /**
     * CARD
     */

    card: {
      borderRadius: 18,
      marginBottom: 20,
      backgroundColor:
        COLORS.surface,
      borderWidth: 1,
      borderColor:
        COLORS.border,
      overflow:
        'hidden',
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
      width:
        '100%',
      height: 130,
    },

    mapFallback: {
      width:
        '100%',
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
      height: 28,
      paddingHorizontal: 12,
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
      fontSize: 12,
      fontWeight:
        '800',
      color:
        '#FFFFFF',
    },

    rankTextFirst: {
      color:
        '#FFFFFF',
    },

    cardBody: {
      padding: 16,
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

    name: {
      fontSize: 17,
      fontWeight:
        '900',
      color:
        COLORS.text,
      flexShrink: 1,
    },

    scoreBox: {
      flexDirection:
        'row',
      alignItems:
        'flex-end',
      marginLeft: 8,
    },

    scoreValue: {
      fontSize: 21,
      fontWeight:
        '900',
      color:
        COLORS.primary,
    },

    scoreUnit: {
      fontSize: 12,
      fontWeight:
        '700',
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
      marginBottom: 14,
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
      fontWeight:
        '700',
      color:
        COLORS.textSecondary,
    },

    /**
     * SECTION
     */

    sectionHeader: {
      marginTop: 6,
      marginBottom: 10,
    },

    sectionTitle: {
      fontSize: 14,
      fontWeight:
        '900',
      color:
        COLORS.text,
    },

    sectionDescription: {
      marginTop: 4,
      fontSize: 11,
      lineHeight: 16,
      color:
        COLORS.textSecondary,
    },

    /**
     * METRICS
     */

    metricGrid: {
      flexDirection:
        'row',
      flexWrap:
        'wrap',
      gap: 8,
    },

    metricCard: {
      flexGrow: 1,
      flexBasis:
        '30%',
      minWidth: 150,
      padding: 12,
      borderRadius: 12,
      borderWidth: 1,
      borderColor:
        '#E6E9E7',
      backgroundColor:
        '#F9FAF9',
    },

    metricLabel: {
      fontSize: 10,
      color:
        COLORS.textSecondary,
      marginBottom: 5,
    },

    metricValue: {
      fontSize: 13,
      fontWeight:
        '900',
      color:
        COLORS.text,
    },

    expandButton: {
      marginTop: 14,
      paddingVertical: 11,
      borderRadius: 12,
      alignItems:
        'center',
      backgroundColor:
        '#F2F4F3',
    },

    expandButtonText: {
      fontSize: 11,
      fontWeight:
        '800',
      color:
        '#475467',
    },

    detailBlock: {
      marginTop: 20,
    },

    blockTitle: {
      fontSize: 14,
      fontWeight:
        '900',
      color:
        COLORS.text,
    },

    blockDescription: {
      marginTop: 4,
      marginBottom: 10,
      fontSize: 11,
      color:
        COLORS.textSecondary,
    },

    /**
     * SCORE
     */

    scoreDetailBox: {
      marginTop: 18,
      padding: 15,
      borderRadius: 14,
      borderWidth: 1,
      borderColor:
        COLORS.border,
      backgroundColor:
        '#FAFBFA',
    },

    scoreBarItem: {
      marginTop: 12,
    },

    scoreBarHeader: {
      flexDirection:
        'row',
      justifyContent:
        'space-between',
      alignItems:
        'center',
      marginBottom: 6,
    },

    scoreBarLabel: {
      fontSize: 11,
      color:
        '#475467',
    },

    scoreBarNumber: {
      fontSize: 11,
      fontWeight:
        '900',
      color:
        COLORS.primary,
    },

    scoreTrack: {
      width:
        '100%',
      height: 8,
      overflow:
        'hidden',
      borderRadius: 999,
      backgroundColor:
        '#E9ECEA',
    },

    scoreFill: {
      height:
        '100%',
      borderRadius: 999,
      backgroundColor:
        COLORS.primary,
    },

    /**
     * AI
     */

    aiArea: {
      marginTop: 20,
    },

    aiButton: {
      marginTop: 10,
      paddingVertical: 11,
      borderRadius: 12,
      borderWidth: 1,
      borderColor:
        COLORS.primary,
      alignItems:
        'center',
    },

    aiButtonText: {
      fontSize: 13,
      fontWeight:
        '800',
      color:
        COLORS.primary,
    },

    aiError: {
      fontSize: 12,
      color:
        COLORS.danger,
      marginTop: 10,
    },

    aiBox: {
      marginTop: 12,
      padding: 14,
      borderRadius: 14,
      backgroundColor:
        COLORS.aiLight,
      borderWidth: 1,
      borderColor:
        'rgba(14,165,233,0.2)',
    },

    aiTitleRow: {
      flexDirection:
        'row',
      alignItems:
        'center',
      gap: 8,
      marginBottom: 8,
    },

    aiIconBox: {
      width: 24,
      height: 24,
      borderRadius: 8,
      backgroundColor:
        COLORS.ai,
      alignItems:
        'center',
      justifyContent:
        'center',
    },

    aiIconText: {
      fontSize: 11,
    },

    aiLabel: {
      fontSize: 12,
      fontWeight:
        '800',
      color:
        COLORS.ai,
    },

    aiText: {
      fontSize: 13,
      color:
        COLORS.text,
      lineHeight: 19,
    },

    aiHighlight: {
      fontWeight:
        '900',
      color:
        COLORS.primary,
    },

    chunkList: {
      marginTop: 10,
      marginBottom: 4,
      gap: 8,
    },

    chunkRowGood: {
      flexDirection:
        'row',
      alignItems:
        'flex-start',
      gap: 8,
      backgroundColor:
        COLORS.primaryLight,
      borderRadius: 10,
      padding: 10,
    },

    chunkIconGood: {
      color:
        COLORS.primary,
      fontWeight:
        '900',
      fontSize: 13,
    },

    chunkTextGood: {
      flex: 1,
      fontSize: 12,
      lineHeight: 18,
      color:
        COLORS.primaryDark,
    },

    chunkRowWarn: {
      flexDirection:
        'row',
      alignItems:
        'flex-start',
      gap: 8,
      backgroundColor:
        COLORS.warningLight,
      borderRadius: 10,
      padding: 10,
    },

    chunkIconWarn: {
      color:
        COLORS.warning,
      fontWeight:
        '900',
      fontSize: 13,
    },

    chunkTextWarn: {
      flex: 1,
      fontSize: 12,
      lineHeight: 18,
      color:
        '#7C4A03',
    },

    detailToggleButton: {
      marginTop: 12,
      alignItems:
        'center',
    },

    detailToggleText: {
      fontSize: 12,
      fontWeight:
        '700',
      color:
        COLORS.textSecondary,
    },

    detailSection: {
      marginTop: 10,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor:
        COLORS.border,
    },

    detailLabel: {
      fontSize: 12,
      fontWeight:
        '800',
      color:
        COLORS.textSecondary,
      marginTop: 8,
      marginBottom: 4,
    },
  });