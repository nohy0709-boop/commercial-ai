import {
  businessCategories,
} from "@/constants/businessTypes";

import {
  COLORS,
} from "@/constants/colors";

import {
  sejongAreas,
} from "@/constants/sejongAreas";

import {
  analyzeCommercialPoint,
} from "@/services/commercialAnalysis";

import {
  BusinessRecommendationResult,
  calculateBusinessRecommendationScores,
} from "@/services/businessRecommendation";

import type {
  AIExplanation,
} from "@/services/aiExplanation";

import {
  generateAIExplanation,
} from "@/services/aiExplanation";

import {
  useLocalSearchParams,
  useRouter,
} from "expo-router";

import {
  useEffect,
  useState,
} from "react";

import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

/**
 * 사용자 위치 기준 분석 반경
 */
const ANALYSIS_RADIUS = 500;

/**
 * AI 응답 안의 **강조 텍스트** 렌더링
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
    <Text style={textStyle}>
      {parts.map(
        (
          part,
          index,
        ) => {
          if (
            part.startsWith(
              "**",
            ) &&
            part.endsWith(
              "**",
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

export default function LocationRecommendResultScreen() {
  const router = useRouter();

  const {
    region,
    latitude,
    longitude,
    address,
  } = useLocalSearchParams<{
      region?: string;
      latitude?: string;
      longitude?: string;
      address?: string;
    }>();

  /**
   * 문자열 좌표 → 숫자 변환
   */
  const selectedLatitude =
    latitude
      ? Number(latitude)
      : null;

  const selectedLongitude =
    longitude
      ? Number(longitude)
      : null;

  /**
   * 좌표 유효성 확인
   */
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
    useState(true);

  const [
    errorMessage,
    setErrorMessage,
  ] =
    useState("");

  const [
    expandedBusiness,
    setExpandedBusiness,
  ] =
    useState<
      string | null
    >(null);

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

  const delay = (
    ms: number,
  ) =>
    new Promise(
      (
        resolve,
      ) =>
        setTimeout(
          resolve,
          ms,
        ),
    );

  /**
   * 화면 진입 시 분석 시작
   */
  useEffect(() => {
    if (!region) {
      setErrorMessage(
        "선택한 지역 정보를 찾을 수 없습니다.",
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
        "세부 상권 분석을 위한 위치 좌표를 확인할 수 없습니다.",
      );

      setLoading(
        false,
      );

      return;
    }

    analyzeBusinesses();
  }, [
    region,
    latitude,
    longitude,
  ]);

  /**
   * =====================================================
   * 업종별 세부 상권 분석
   * =====================================================
   */
  const analyzeBusinesses =
    async () => {
      try {
        setLoading(
          true,
        );

        setErrorMessage(
          "",
        );

        /**
         * 행정동 원천 데이터 조회
         */
        const area =
          sejongAreas.find(
            (
              item,
            ) =>
              item.name ===
              region,
          );

        if (!area) {
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
            "세부 분석을 위한 위치 좌표를 확인할 수 없습니다.",
          );
        }

        console.log(
          "세부 상권 분석 시작:",
          {
            region:
              area.name,

            latitude:
              selectedLatitude,

            longitude:
              selectedLongitude,

            radius:
              ANALYSIS_RADIUS,

            address,
          },
        );

        /**
         * 전체 업종 목록
         */
        const businesses =
          businessCategories.flatMap(
            (
              category,
            ) =>
              category.businesses,
          );

        const businessResults: {
          businessName: string;
          analysis: any;
        }[] = [];

        /**
         * 업종별 분석
         */
        for (
          const business
          of businesses
        ) {
          try {
            const locationLabel =
              address?.trim() ||
              `${area.name} 내 선택 위치`;

            /**
             * 사용자 좌표 기준
             * 반경 상권 분석
             */
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

            /**
             * 공공데이터 API 과호출 방지
             */
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
                "429",
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
            "분석 가능한 업종 데이터를 가져오지 못했습니다.",
          );
        }

        /**
         * 추천 점수 계산
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
          "업종 추천 분석 오류:",
          error,
        );

        if (
          error instanceof
          Error
        ) {
          setErrorMessage(
            error.message,
          );
        } else {
          setErrorMessage(
            "업종 추천 분석 중 오류가 발생했습니다.",
          );
        }
      } finally {
        setLoading(
          false,
        );
      }
    };

  /**
   * 증감률 표시
   */
  const formatChangeRate =
    (
      value: number,
    ) => {
      return `${
        value > 0
          ? "+"
          : ""
      }${value.toFixed(
        2,
      )}%`;
    };

  /**
   * 추천 이유
   */
  const getRecommendationReason =
    (
      item:
        BusinessRecommendationResult,
    ) => {
      const reasons = [
        {
          text:
            "점포당 카드소비가 높은 편입니다.",

          score:
            item.averageSalesScore,
        },

        {
          text:
            "주변 경쟁 부담이 비교적 낮습니다.",

          score:
            item.competitionScore,
        },

        {
          text:
            "해당 업종의 소비 규모가 큽니다.",

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
          (
            reason,
          ) =>
            reason.text,
        )
        .join(
          " ",
        );
    };

  /**
   * AI 설명 생성
   */
  const handleGenerateAI =
    async (
      item:
        BusinessRecommendationResult,
    ) => {
      const key =
        item.businessName;

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
        (
          prev,
        ) => ({
          ...prev,

          [key]:
            true,
        }),
      );

      setAiErrorKeys(
        (
          prev,
        ) => ({
          ...prev,

          [key]:
            "",
        }),
      );

      try {
        const explanation =
          await generateAIExplanation(
            {
              지역:
                region ??
                "",

              업종:
                item.businessName,

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

              추천점수:
                item.recommendationScore,

              순위:
                item.rank,
            },
          );

        setAiExplanations(
          (
            prev,
          ) => ({
            ...prev,

            [key]:
              explanation,
          }),
        );
      } catch (
        error
      ) {
        console.error(
          "AI 설명 생성 오류:",
          error,
        );

        setAiErrorKeys(
          (
            prev,
          ) => ({
            ...prev,

            [key]:
              error instanceof
              Error
                ? error.message
                : "AI 설명을 가져오지 못했습니다.",
          }),
        );
      } finally {
        setAiLoadingKeys(
          (
            prev,
          ) => ({
            ...prev,

            [key]:
              false,
          }),
        );
      }
    };

  /**
   * AI 상세 토글
   */
  const toggleAiDetail =
    (
      key: string,
    ) => {
      setAiDetailExpandedKeys(
        (
          prev,
        ) => ({
          ...prev,

          [key]:
            !prev[
              key
            ],
        }),
      );
    };

  /**
   * =====================================================
   * 로딩 화면
   * =====================================================
   */
  if (loading) {
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
          선택 지점 기준 반경{" "}
          {ANALYSIS_RADIUS}m의
          업종별 데이터를
          비교하는 중입니다.
        </Text>
      </View>
    );
  }

  /**
   * =====================================================
   * 오류 화면
   * =====================================================
   */
  if (
    errorMessage !==
    ""
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
      </View>
    );
  }

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
          <Text style={styles.appBarTitle}>업종 추천 결과</Text>
          <Text style={styles.appBarSubtitle}>{region}</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={
          styles.container
        }
        showsVerticalScrollIndicator={
          false
        }
      >
      <Text
        style={
          styles.smallTitle
        }
      >
        보유 입지 분석
      </Text>

      <Text
        style={
          styles.title
        }
      >
        {region}
      </Text>

      <Text
        style={
          styles.description
        }
      >
        선택한 위치 주변의
        실제 점포 경쟁도와
        행정동 상권 데이터를
        함께 비교했습니다.
      </Text>

      {/* 분석 위치 */}

      <View
        style={
          styles.locationBox
        }
      >
        <View
          style={
            styles.locationBoxHeader
          }
        >
          <Text
            style={
              styles.locationBoxLabel
            }
          >
            📍 분석 기준 위치
          </Text>

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

        {!!address && (
          <Text
            style={
              styles.locationAddress
            }
          >
            {address}
          </Text>
        )}

        <Text
          style={
            styles.coordinateText
          }
        >
          위도{" "}
          {selectedLatitude?.toFixed(
            6,
          )}
          {"  ·  "}
          경도{" "}
          {selectedLongitude?.toFixed(
            6,
          )}
        </Text>

        <View
          style={
            styles.radiusBox
          }
        >
          <Text
            style={
              styles.radiusLabel
            }
          >
            세부 분석 범위
          </Text>

          <Text
            style={
              styles.radiusValue
            }
          >
            반경{" "}
            {
              ANALYSIS_RADIUS
            }
            m
          </Text>
        </View>

        <Text
          style={
            styles.locationNotice
          }
        >
          점포 수와 경쟁밀도는
          선택 지점 기준 반경{" "}
          {ANALYSIS_RADIUS}m를
          분석합니다. 생활인구,
          유동인구, 카드소비,
          접근성은 현재 해당
          행정동의 데이터를
          참고합니다.
        </Text>
      </View>

      {/* 가장 추천하는 업종 */}

      <View
        style={
          styles.summaryBox
        }
      >
        <View style={styles.summaryPill}>
          <Text style={styles.summaryPillText}>가장 추천하는 업종</Text>
        </View>

        <Text
          style={
            styles.summaryBusiness
          }
        >
          {
            results[
              0
            ]?.businessName
          }
        </Text>

        <Text
          style={
            styles.summaryReason
          }
        >
          {results[
            0
          ] &&
            getRecommendationReason(
              results[
                0
              ],
            )}
        </Text>

        <View style={styles.summaryScoreRow}>
          <Text
            style={
              styles.summaryScore
            }
          >
            {results[0]
              ?.recommendationScore}
          </Text>
          <Text style={styles.summaryScoreUnit}>점 추천점수</Text>
        </View>
      </View>

      {/* 추천 순위 */}

      <Text
        style={
          styles.sectionTitle
        }
      >
        업종 추천 순위
      </Text>

      <Text
        style={
          styles.sectionDescription
        }
      >
        업종을 누르면 상세
        분석 결과를 확인할 수
        있습니다.
      </Text>

      {results.map(
        (
          item,
        ) => {
          const expanded =
            expandedBusiness ===
            item.businessName;

          const aiKey =
            item.businessName;

          const explanation =
            aiExplanations[
              aiKey
            ];

          const aiLoading =
            aiLoadingKeys[
              aiKey
            ];

          const aiError =
            aiErrorKeys[
              aiKey
            ];

          const aiDetailExpanded =
            aiDetailExpandedKeys[
              aiKey
            ];

          return (
            <Pressable
              key={
                item.businessName
              }
              style={
                styles.card
              }
              onPress={() =>
                setExpandedBusiness(
                  expanded
                    ? null
                    : item.businessName,
                )
              }
            >
              {/* 카드 상단 */}

              <View
                style={
                  styles.cardHeader
                }
              >
                <View
                  style={
                    styles.rankBox
                  }
                >
                  <Text
                    style={
                      styles.rank
                    }
                  >
                    {
                      item.rank
                    }
                    위
                  </Text>
                </View>

                <View
                  style={
                    styles.nameContainer
                  }
                >
                  <Text
                    style={
                      styles.name
                    }
                  >
                    {
                      item.businessName
                    }
                  </Text>

                  <Text
                    style={
                      styles.reason
                    }
                  >
                    {getRecommendationReason(
                      item,
                    )}
                  </Text>
                </View>

                <Text
                  style={
                    styles.score
                  }
                >
                  {
                    item.recommendationScore
                  }
                  점
                </Text>
              </View>

              {/* 미리보기 */}

              <View
                style={
                  styles.previewContainer
                }
              >
                <View
                  style={
                    styles.previewItem
                  }
                >
                  <Text
                    style={
                      styles.previewLabel
                    }
                  >
                    반경 내 점포
                  </Text>

                  <Text
                    style={
                      styles.previewValue
                    }
                  >
                    {
                      item.storeCount
                    }
                    개
                  </Text>
                </View>

                <View
                  style={
                    styles.previewItem
                  }
                >
                  <Text
                    style={
                      styles.previewLabel
                    }
                  >
                    점포 밀도
                  </Text>

                  <Text
                    style={
                      styles.previewValue
                    }
                  >
                    {item.competitionDensity.toFixed(
                      1,
                    )}
                    /㎢
                  </Text>
                </View>

                <View
                  style={
                    styles.previewItem
                  }
                >
                  <Text
                    style={
                      styles.previewLabel
                    }
                  >
                    점포당 소비
                  </Text>

                  <Text
                    style={
                      styles.previewValue
                    }
                  >
                    {Math.round(
                      item.averageSalesPerStore,
                    ).toLocaleString()}
                    원
                  </Text>
                </View>
              </View>

              {/* 상세보기 */}

              <View
                style={
                  styles.expandButton
                }
              >
                <Text
                  style={
                    styles.expandText
                  }
                >
                  {expanded
                    ? "상세 정보 접기 ▲"
                    : "상세 정보 보기 ▼"}
                </Text>
              </View>

              {expanded && (
                <View
                  style={
                    styles.detailContainer
                  }
                >
                  <Text
                    style={
                      styles.detailTitle
                    }
                  >
                    {
                      item.businessName
                    }{" "}
                    상세 분석
                  </Text>

                  {/* 세부 위치 데이터 */}

                  <Text
                    style={
                      styles.subSectionLabel
                    }
                  >
                    선택 지점 주변
                  </Text>

                  <View
                    style={
                      styles.detailRow
                    }
                  >
                    <Text
                      style={
                        styles.detailLabel
                      }
                    >
                      반경 내 점포 수
                    </Text>

                    <Text
                      style={
                        styles.detailValue
                      }
                    >
                      {
                        item.storeCount
                      }
                      개
                    </Text>
                  </View>

                  <View
                    style={
                      styles.detailRow
                    }
                  >
                    <Text
                      style={
                        styles.detailLabel
                      }
                    >
                      점포 밀도
                    </Text>

                    <Text
                      style={
                        styles.detailValue
                      }
                    >
                      {item.competitionDensity.toFixed(
                        2,
                      )}
                      개/㎢
                    </Text>
                  </View>

                  <View
                    style={
                      styles.divider
                    }
                  />

                  {/* 행정동 데이터 */}

                  <Text
                    style={
                      styles.subSectionLabel
                    }
                  >
                    {region} 참고 데이터
                  </Text>

                  <View
                    style={
                      styles.detailRow
                    }
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
                      {item.livingPopulation.toLocaleString()}
                      명
                    </Text>
                  </View>

                  <View
                    style={
                      styles.detailRow
                    }
                  >
                    <Text
                      style={
                        styles.detailLabel
                      }
                    >
                      생활인구 증감
                    </Text>

                    <Text
                      style={
                        styles.detailValue
                      }
                    >
                      {formatChangeRate(
                        item.livingPopulationChangeRate,
                      )}
                    </Text>
                  </View>

                  <View
                    style={
                      styles.detailRow
                    }
                  >
                    <Text
                      style={
                        styles.detailLabel
                      }
                    >
                      유동인구
                    </Text>

                    <Text
                      style={
                        styles.detailValue
                      }
                    >
                      {item.floatingPopulation.toLocaleString()}
                      명
                    </Text>
                  </View>

                  <View
                    style={
                      styles.detailRow
                    }
                  >
                    <Text
                      style={
                        styles.detailLabel
                      }
                    >
                      유동인구 증감
                    </Text>

                    <Text
                      style={
                        styles.detailValue
                      }
                    >
                      {formatChangeRate(
                        item.floatingPopulationChangeRate,
                      )}
                    </Text>
                  </View>

                  <View
                    style={
                      styles.detailRow
                    }
                  >
                    <Text
                      style={
                        styles.detailLabel
                      }
                    >
                      행정동 카드소비
                    </Text>

                    <Text
                      style={
                        styles.detailValue
                      }
                    >
                      {item.salesAmount.toLocaleString()}
                      원
                    </Text>
                  </View>

                  <View
                    style={
                      styles.detailRow
                    }
                  >
                    <Text
                      style={
                        styles.detailLabel
                      }
                    >
                      점포당 카드소비
                    </Text>

                    <Text
                      style={
                        styles.detailValue
                      }
                    >
                      {Math.round(
                        item.averageSalesPerStore,
                      ).toLocaleString()}
                      원
                    </Text>
                  </View>

                  <View
                    style={
                      styles.detailRow
                    }
                  >
                    <Text
                      style={
                        styles.detailLabel
                      }
                    >
                      행정동 버스정류장
                    </Text>

                    <Text
                      style={
                        styles.detailValue
                      }
                    >
                      {
                        item.busStopCount
                      }
                      개
                    </Text>
                  </View>

                  <View
                    style={
                      styles.divider
                    }
                  />

                  {/* 점수 */}

                  <Text
                    style={
                      styles.detailTitle
                    }
                  >
                    업종 추천 점수
                  </Text>

                  <View
                    style={
                      styles.detailRow
                    }
                  >
                    <Text
                      style={
                        styles.detailLabel
                      }
                    >
                      점포당 카드소비
                    </Text>

                    <Text
                      style={
                        styles.detailValue
                      }
                    >
                      {
                        item.averageSalesScore
                      }
                      점
                    </Text>
                  </View>

                  <View
                    style={
                      styles.detailRow
                    }
                  >
                    <Text
                      style={
                        styles.detailLabel
                      }
                    >
                      주변 경쟁도
                    </Text>

                    <Text
                      style={
                        styles.detailValue
                      }
                    >
                      {
                        item.competitionScore
                      }
                      점
                    </Text>
                  </View>

                  <View
                    style={
                      styles.detailRow
                    }
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
                      {
                        item.salesScore
                      }
                      점
                    </Text>
                  </View>

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
                      최종 추천점수
                    </Text>

                    <Text
                      style={
                        styles.finalScoreValue
                      }
                    >
                      {
                        item.recommendationScore
                      }
                      점
                    </Text>
                  </View>
                </View>
              )}

              {/* AI 설명 */}

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
                  <Text
                    style={
                      styles.aiLabel
                    }
                  >
                    AI 추천 이유
                  </Text>

                  {renderEmphasizedText(
                    explanation.recommendationReason,
                    styles.aiText,
                  )}

                  <TouchableOpacity
                    style={
                      styles.detailToggleButton
                    }
                    activeOpacity={
                      0.7
                    }
                    onPress={() =>
                      toggleAiDetail(
                        aiKey,
                      )
                    }
                  >
                    <Text
                      style={
                        styles.detailToggleText
                      }
                    >
                      {aiDetailExpanded
                        ? "AI 상세 설명 접기 ▲"
                        : "AI 상세 설명 보기 ▼"}
                    </Text>
                  </TouchableOpacity>

                  {aiDetailExpanded && (
                    <View
                      style={
                        styles.aiDetailSection
                      }
                    >
                      <Text
                        style={
                          styles.aiLabel
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
                          styles.aiLabel
                        }
                      >
                        장점
                      </Text>

                      {explanation.advantages.map(
                        (
                          advantage,
                          index,
                        ) => (
                          <Text
                            key={
                              index
                            }
                            style={
                              styles.aiListItem
                            }
                          >
                            {`· ${advantage}`}
                          </Text>
                        ),
                      )}

                      <Text
                        style={
                          styles.aiLabel
                        }
                      >
                        위험요소
                      </Text>

                      {explanation.risks.map(
                        (
                          risk,
                          index,
                        ) => (
                          <Text
                            key={
                              index
                            }
                            style={
                              styles.aiListItem
                            }
                          >
                            {`· ${risk}`}
                          </Text>
                        ),
                      )}

                      <Text
                        style={
                          styles.aiLabel
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
            </Pressable>
          );
        },
      )}
      </ScrollView>
    </View>
  );
}

const styles =
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: COLORS.background,
    },

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
      paddingBottom: 50,
    },

    centerContainer: {
      flex: 1,
      justifyContent:
        "center",
      alignItems:
        "center",
      padding: 30,
      backgroundColor:
        COLORS.background,
    },

    loadingTitle: {
      fontSize: 18,
      fontWeight:
        "800",
      marginTop: 20,
      color:
        COLORS.text,
      textAlign:
        "center",
    },

    loadingDescription: {
      fontSize: 13,
      color:
        COLORS.textSecondary,
      marginTop: 8,
      lineHeight: 19,
      textAlign:
        "center",
    },

    errorText: {
      color: COLORS.danger,
      fontSize: 15,
      textAlign:
        "center",
    },

    smallTitle: {
      marginTop: 4,
      fontSize: 13,
      fontWeight:
        "700",
      color:
        COLORS.primary,
    },

    title: {
      fontSize: 30,
      fontWeight:
        "900",
      marginTop: 5,
      color:
        COLORS.text,
    },

    description: {
      fontSize: 14,
      color:
        COLORS.textSecondary,
      lineHeight: 20,
      marginTop: 7,
      marginBottom: 18,
    },

    locationBox: {
      padding: 16,
      borderRadius: 16,
      marginBottom: 20,
      borderWidth: 1,
      borderColor:
        "#DCEFE0",
      backgroundColor:
        "#FAFFFB",
    },

    locationBoxHeader: {
      flexDirection:
        "row",
      justifyContent:
        "space-between",
      alignItems:
        "center",
      marginBottom: 10,
    },

    locationBoxLabel: {
      fontSize: 13,
      fontWeight:
        "900",
      color:
        COLORS.text,
    },

    regionBadge: {
      paddingHorizontal:
        10,
      paddingVertical: 5,
      borderRadius: 999,
      backgroundColor:
        "#E9F8EC",
    },

    regionBadgeText: {
      fontSize: 10,
      fontWeight:
        "800",
      color:
        COLORS.primary,
    },

    locationAddress: {
      fontSize: 15,
      fontWeight:
        "900",
      color:
        COLORS.text,
      marginBottom: 6,
    },

    coordinateText: {
      fontSize: 11,
      color:
        COLORS.textSecondary,
    },

    radiusBox: {
      flexDirection:
        "row",
      justifyContent:
        "space-between",
      alignItems:
        "center",
      marginTop: 12,
      paddingVertical:
        10,
      paddingHorizontal:
        12,
      borderRadius: 10,
      backgroundColor:
        "#FFFFFF",
      borderWidth: 1,
      borderColor:
        COLORS.border,
    },

    radiusLabel: {
      fontSize: 11,
      color:
        COLORS.textSecondary,
    },

    radiusValue: {
      fontSize: 12,
      fontWeight:
        "900",
      color:
        COLORS.primary,
    },

    locationNotice: {
      marginTop: 10,
      fontSize: 11,
      lineHeight: 17,
      color:
        COLORS.textSecondary,
    },

    summaryBox: {
      backgroundColor:
        COLORS.surface,
      borderRadius: 18,
      padding: 22,
      marginBottom: 30,
      borderWidth: 1,
      borderColor:
        COLORS.border,
    },

    summaryPill: {
      alignSelf: 'flex-start',
      backgroundColor: COLORS.primaryLight,
      borderRadius: 999,
      paddingVertical: 5,
      paddingHorizontal: 12,
      marginBottom: 10,
    },

    summaryPillText: {
      fontSize: 11,
      fontWeight: '800',
      color: COLORS.primary,
    },

    summaryBusiness: {
      fontSize: 26,
      fontWeight: "900",
      color:
        COLORS.text,
    },

    summaryReason: {
      fontSize: 12,
      lineHeight: 18,
      color:
        COLORS.textSecondary,
      marginTop: 8,
    },

    summaryScoreRow: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: 5,
      marginTop: 14,
    },

    summaryScore: {
      fontSize: 24,
      fontWeight: "900",
      color:
        COLORS.primary,
    },

    summaryScoreUnit: {
      fontSize: 12,
      fontWeight: '700',
      color: COLORS.textSecondary,
      marginBottom: 3,
    },

    sectionTitle: {
      fontSize: 20,
      fontWeight:
        "900",
      color:
        COLORS.text,
    },

    sectionDescription: {
      fontSize: 13,
      color:
        COLORS.textSecondary,
      marginTop: 5,
      marginBottom: 18,
    },

    card: {
      borderWidth: 1,
      borderColor:
        COLORS.border,
      borderRadius: 16,
      padding: 16,
      marginBottom: 13,
      backgroundColor:
        COLORS.surface,

      shadowColor:
        "#000000",

      shadowOffset: {
        width: 0,
        height: 2,
      },

      shadowOpacity:
        0.04,

      shadowRadius: 5,

      elevation: 1,
    },

    cardHeader: {
      flexDirection:
        "row",
      alignItems:
        "flex-start",
    },

    rankBox: {
      marginRight: 10,
      paddingVertical: 5,
      paddingHorizontal:
        9,
      borderRadius: 12,
      backgroundColor:
        COLORS.primaryLight,
    },

    rank: {
      fontSize: 13,
      fontWeight:
        "900",
      color:
        COLORS.primary,
    },

    nameContainer: {
      flex: 1,
    },

    name: {
      fontSize: 18,
      fontWeight:
        "900",
      color:
        COLORS.text,
    },

    reason: {
      fontSize: 12,
      color:
        COLORS.textSecondary,
      lineHeight: 18,
      marginTop: 5,
    },

    score: {
      fontSize: 18,
      fontWeight:
        "900",
      color:
        COLORS.primary,
      marginLeft: 8,
    },

    previewContainer: {
      flexDirection:
        "row",
      gap: 7,
      marginTop: 16,
    },

    previewItem: {
      flex: 1,
      backgroundColor:
        COLORS.background,
      borderRadius: 12,
      padding: 10,
      borderWidth: 1,
      borderColor:
        COLORS.border,
    },

    previewLabel: {
      fontSize: 10,
      color:
        COLORS.textSecondary,
      marginBottom: 4,
    },

    previewValue: {
      fontSize: 12,
      fontWeight:
        "800",
      color:
        COLORS.text,
    },

    expandButton: {
      marginTop: 14,
      paddingVertical:
        10,
      borderRadius: 12,
      backgroundColor:
        COLORS.primary,
    },

    expandText: {
      textAlign:
        "center",
      color:
        '#FFFFFF',
      fontSize: 12,
      fontWeight:
        "900",
    },

    detailContainer: {
      borderTopWidth:
        1,
      borderTopColor:
        COLORS.border,
      paddingTop: 18,
      marginTop: 18,
    },

    detailTitle: {
      fontSize: 16,
      fontWeight:
        "900",
      marginBottom: 13,
      color:
        COLORS.text,
    },

    subSectionLabel: {
      fontSize: 12,
      fontWeight:
        "900",
      color:
        COLORS.primary,
      marginBottom: 12,
    },

    detailRow: {
      flexDirection:
        "row",
      justifyContent:
        "space-between",
      marginBottom: 11,
    },

    detailLabel: {
      fontSize: 13,
      color:
        COLORS.textSecondary,
    },

    detailValue: {
      fontSize: 13,
      fontWeight:
        "800",
      color:
        COLORS.text,
    },

    divider: {
      borderTopWidth:
        1,
      borderTopColor:
        COLORS.border,
      marginVertical:
        18,
    },

    finalScoreBox: {
      flexDirection:
        "row",
      justifyContent:
        "space-between",
      alignItems:
        "center",
      backgroundColor:
        COLORS.primaryLight,
      borderRadius: 14,
      padding: 16,
      marginTop: 10,
      borderWidth: 1,
      borderColor:
        COLORS.border,
    },

    finalScoreLabel: {
      fontSize: 14,
      fontWeight:
        "900",
      color:
        COLORS.text,
    },

    finalScoreValue: {
      fontSize: 21,
      fontWeight:
        "900",
      color:
        COLORS.primary,
    },

    aiButton: {
      marginTop: 14,
      paddingVertical:
        10,
      borderRadius: 12,
      borderWidth: 1,
      borderColor:
        COLORS.primary,
      alignItems:
        "center",
    },
    aiButtonText: {fontSize: 13, fontWeight: '800', color: COLORS.primary},
    aiError: {fontSize: 12, color: COLORS.danger, marginTop: 10},
    aiBox: {
      marginTop: 14,
      paddingTop: 14,
      borderTopWidth:
        1,
      borderTopColor:
        COLORS.border,
    },

    aiLabel: {
      fontSize: 12,
      fontWeight:
        "800",
      color:
        COLORS.textSecondary,
      marginTop: 10,
      marginBottom: 4,
    },

    aiText: {
      fontSize: 13,
      color:
        COLORS.text,
      lineHeight: 19,
    },

    aiHighlight: {
      fontWeight:
        "900",
      color:
        COLORS.primary,
    },

    aiListItem: {
      fontSize: 13,
      color:
        COLORS.text,
      lineHeight: 19,
      marginLeft: 4,
    },

    detailToggleButton: {
      marginTop: 12,
      alignItems:
        "center",
    },

    detailToggleText: {
      fontSize: 12,
      fontWeight:
        "700",
      color:
        COLORS.textSecondary,
    },

    aiDetailSection: {
      marginTop: 6,
      paddingTop: 10,
      borderTopWidth:
        1,
      borderTopColor:
        COLORS.border,
    },
  });