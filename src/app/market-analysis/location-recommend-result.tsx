import {
  businessCategories,
} from "@/constants/businessTypes";

import {
  sejongAreas,
} from "@/constants/sejongAreas";

import {
  analyzeCommercialArea,
} from "@/services/commercialAnalysis";

import {
  BusinessRecommendationResult,
  calculateBusinessRecommendationScores,
} from "@/services/businessRecommendation";

import {
  useLocalSearchParams,
} from "expo-router";

import React, {
  useEffect,
  useState,
} from "react";

import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

export default function LocationRecommendResultScreen() {
  const { region } =
    useLocalSearchParams<{
      region: string;
    }>();

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
    useState<string | null>(
      null
    );

  const delay = (
    ms: number
  ) =>
    new Promise((resolve) =>
      setTimeout(
        resolve,
        ms
      )
    );

  useEffect(() => {
    if (!region) {
      setErrorMessage(
        "선택한 지역 정보를 찾을 수 없습니다."
      );

      setLoading(false);

      return;
    }

    analyzeBusinesses();
  }, [region]);

  const analyzeBusinesses =
    async () => {
      try {
        setLoading(true);
        setErrorMessage("");

        const area =
          sejongAreas.find(
            (item) =>
              item.name ===
              region
          );

        if (!area) {
          throw new Error(
            `${region} 지역 정보를 찾을 수 없습니다.`
          );
        }

        // 현재 등록된 모든 업종
        const businesses =
          businessCategories.flatMap(
            (category) =>
              category.businesses
          );

        const businessResults: {
          businessName: string;
          analysis: any;
        }[] = [];

        // API 429 방지를 위해
        // 업종별 순차 요청
        for (
          const business
          of businesses
        ) {
          try {
            const analysis =
              await analyzeCommercialArea(
                area.name,
                area.code,
                business.name,
                business.lclsCode,
                business.mclsCode,
                business.sclsCode
              );

            businessResults.push({
              businessName:
                business.name,

              analysis,
            });

            // 공공데이터 API
            // 과도한 요청 방지
            await delay(700);
          } catch (error) {
            console.error(
              `${business.name} 분석 실패`,
              error
            );

            if (
              error instanceof
                Error &&
              error.message.includes(
                "429"
              )
            ) {
              // 요청 제한이면
              // 조금 더 대기
              await delay(2000);
            }
          }
        }

        if (
          businessResults.length ===
          0
        ) {
          throw new Error(
            "분석 가능한 업종 데이터를 가져오지 못했습니다."
          );
        }

        const rankedResults =
          calculateBusinessRecommendationScores(
            businessResults
          );

        setResults(
          rankedResults
        );
      } catch (error) {
        console.error(
          "업종 추천 분석 오류:",
          error
        );

        if (
          error instanceof Error
        ) {
          setErrorMessage(
            error.message
          );
        } else {
          setErrorMessage(
            "업종 추천 분석 중 오류가 발생했습니다."
          );
        }
      } finally {
        setLoading(false);
      }
    };

  const formatChangeRate = (
    value: number
  ) => {
    return `${
      value > 0 ? "+" : ""
    }${value.toFixed(
      2
    )}%`;
  };

  // 추천 근거
  const getRecommendationReason =
    (
      item:
        BusinessRecommendationResult
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
            "경쟁 부담이 비교적 낮습니다.",
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

      return [...reasons]
        .sort(
          (a, b) =>
            b.score -
            a.score
        )
        .slice(0, 2)
        .map(
          (reason) =>
            reason.text
        )
        .join(" ");
    };

  if (loading) {
    return (
      <View
        style={
          styles.centerContainer
        }
      >
        <ActivityIndicator
          size="large"
          color="#1D4ED8"
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
          업종별 데이터를
          비교하는 중입니다.
        </Text>
      </View>
    );
  }

  if (
    errorMessage !== ""
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
          {errorMessage}
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={
        styles.container
      }
      showsVerticalScrollIndicator={
        false
      }
    >
      {/* =====================
          상단
      ====================== */}

      <Text
        style={
          styles.smallTitle
        }
      >
        보유 입지 분석
      </Text>

      <Text
        style={styles.title}
      >
        {region}
      </Text>

      <Text
        style={
          styles.description
        }
      >
        해당 지역에서
        창업하기 좋은 업종을
        데이터 기반으로
        비교했습니다.
      </Text>

      <View
        style={
          styles.summaryBox
        }
      >
        <Text
          style={
            styles.summaryLabel
          }
        >
          가장 추천하는 업종
        </Text>

        <Text
          style={
            styles.summaryBusiness
          }
        >
          {results[0]
            ?.businessName}
        </Text>

        <Text
          style={
            styles.summaryScore
          }
        >
          추천점수{" "}
          {results[0]
            ?.recommendationScore}
          점
        </Text>

        <Text
          style={
            styles.summaryReason
          }
        >
          {results[0] &&
            getRecommendationReason(
              results[0]
            )}
        </Text>
      </View>

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

      {/* =====================
          순위
      ====================== */}

      {results.map(
        (item) => {
          const expanded =
            expandedBusiness ===
            item.businessName;

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
                    : item.businessName
                )
              }
            >
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
                    {item.rank}위
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
                      item
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

              {/* 핵심 미리보기 */}

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
                    점포 수
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
                    경쟁밀도
                  </Text>

                  <Text
                    style={
                      styles.previewValue
                    }
                  >
                    {item.competitionDensity.toFixed(
                      3
                    )}
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
                      item.averageSalesPerStore
                    ).toLocaleString()}
                    원
                  </Text>
                </View>
              </View>

              <Text
                style={
                  styles.expandText
                }
              >
                {expanded
                  ? "상세 정보 접기 ▲"
                  : "상세 정보 보기 ▼"}
              </Text>

              {/* =====================
                  상세
              ====================== */}

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
                    {item.businessName}{" "}
                    상세 분석
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
                      점포 수
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
                      전체 카드소비
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
                        item.averageSalesPerStore
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
                      경쟁밀도
                    </Text>

                    <Text
                      style={
                        styles.detailValue
                      }
                    >
                      {item.competitionDensity.toFixed(
                        3
                      )}
                    </Text>
                  </View>

                  <View
                    style={
                      styles.divider
                    }
                  />

                  <Text
                    style={
                      styles.detailTitle
                    }
                  >
                    지역 환경
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
                        item.livingPopulationChangeRate
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
                        item.floatingPopulationChangeRate
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
                      버스정류장
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
                      경쟁도
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
                      전체 카드소비
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
            </Pressable>
          );
        }
      )}
    </ScrollView>
  );
}

const styles =
  StyleSheet.create({
    container: {
      padding: 20,
      paddingBottom: 50,
      backgroundColor:
        "#FFFFFF",
    },

    centerContainer: {
      flex: 1,
      justifyContent:
        "center",
      alignItems: "center",
      padding: 30,
      backgroundColor:
        "#FFFFFF",
    },

    loadingTitle: {
      fontSize: 18,
      fontWeight: "700",
      marginTop: 20,
    },

    loadingDescription: {
      fontSize: 13,
      color: "#777",
      marginTop: 8,
    },

    errorText: {
      color: "#D64545",
      fontSize: 15,
      textAlign: "center",
    },

    smallTitle: {
      marginTop: 12,
      fontSize: 13,
      color: "#777",
    },

    title: {
      fontSize: 30,
      fontWeight: "800",
      marginTop: 5,
    },

    description: {
      fontSize: 14,
      color: "#777",
      lineHeight: 20,
      marginTop: 7,
      marginBottom: 22,
    },

    summaryBox: {
      backgroundColor:
        "#1D4ED8",
      borderRadius: 16,
      padding: 22,
      marginBottom: 30,
    },

    summaryLabel: {
      fontSize: 12,
      color: "#DCE7FF",
    },

    summaryBusiness: {
      fontSize: 28,
      fontWeight: "800",
      color: "#FFFFFF",
      marginTop: 5,
    },

    summaryScore: {
      fontSize: 15,
      fontWeight: "700",
      color: "#FFFFFF",
      marginTop: 6,
    },

    summaryReason: {
      fontSize: 12,
      lineHeight: 18,
      color: "#DCE7FF",
      marginTop: 8,
    },

    sectionTitle: {
      fontSize: 20,
      fontWeight: "800",
    },

    sectionDescription: {
      fontSize: 13,
      color: "#888",
      marginTop: 5,
      marginBottom: 18,
    },

    card: {
      borderWidth: 1,
      borderColor:
        "#E5E5E5",
      borderRadius: 14,
      padding: 16,
      marginBottom: 13,
      backgroundColor:
        "#F8F9FA",
    },

    cardHeader: {
      flexDirection: "row",
      alignItems:
        "flex-start",
    },

    rankBox: {
      marginRight: 10,
    },

    rank: {
      fontSize: 14,
      fontWeight: "800",
      color: "#1D4ED8",
    },

    nameContainer: {
      flex: 1,
    },

    name: {
      fontSize: 18,
      fontWeight: "800",
      color: "#1A1A1A",
    },

    reason: {
      fontSize: 12,
      color: "#777",
      lineHeight: 18,
      marginTop: 5,
    },

    score: {
      fontSize: 16,
      fontWeight: "800",
      color: "#1D4ED8",
      marginLeft: 8,
    },

    previewContainer: {
      flexDirection: "row",
      gap: 7,
      marginTop: 16,
    },

    previewItem: {
      flex: 1,
      backgroundColor:
        "#FFFFFF",
      borderRadius: 10,
      padding: 10,
    },

    previewLabel: {
      fontSize: 10,
      color: "#888",
      marginBottom: 4,
    },

    previewValue: {
      fontSize: 12,
      fontWeight: "700",
      color: "#222",
    },

    expandText: {
      textAlign: "center",
      color: "#666",
      fontSize: 12,
      fontWeight: "600",
      marginTop: 14,
    },

    detailContainer: {
      borderTopWidth: 1,
      borderTopColor:
        "#E5E5E5",
      paddingTop: 18,
      marginTop: 18,
    },

    detailTitle: {
      fontSize: 16,
      fontWeight: "800",
      marginBottom: 13,
    },

    detailRow: {
      flexDirection: "row",
      justifyContent:
        "space-between",
      marginBottom: 11,
    },

    detailLabel: {
      fontSize: 13,
      color: "#666",
    },

    detailValue: {
      fontSize: 13,
      fontWeight: "700",
      color: "#222",
    },

    divider: {
      borderTopWidth: 1,
      borderTopColor:
        "#E5E5E5",
      marginVertical: 18,
    },

    finalScoreBox: {
      flexDirection: "row",
      justifyContent:
        "space-between",
      alignItems: "center",

      backgroundColor:
        "#EAF2FF",

      borderRadius: 12,

      padding: 16,

      marginTop: 10,
    },

    finalScoreLabel: {
      fontSize: 14,
      fontWeight: "800",
    },

    finalScoreValue: {
      fontSize: 21,
      fontWeight: "800",
      color: "#1D4ED8",
    },
  });