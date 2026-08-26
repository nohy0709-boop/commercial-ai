import {
  businessCategories,
} from "@/constants/businessTypes";
import { COLORS } from "@/constants/colors";
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

import type { AIExplanation } from "@/services/aiExplanation";
import {
  generateAIExplanation,
} from "@/services/aiExplanation";

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
  TouchableOpacity,
  View,
} from "react-native";

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

  // AI 설명은 업종마다 따로, 버튼 눌렀을 때만 요청합니다.
  const [aiExplanations, setAiExplanations] = useState<
    Record<string, AIExplanation>
  >({});
  const [aiLoadingKeys, setAiLoadingKeys] = useState<Record<string, boolean>>({});
  const [aiErrorKeys, setAiErrorKeys] = useState<Record<string, string>>({});
  const [aiDetailExpandedKeys, setAiDetailExpandedKeys] = useState<
    Record<string, boolean>
  >({});

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

        const businesses =
          businessCategories.flatMap(
            (category) =>
              category.businesses
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

  const handleGenerateAI = async (
    item: BusinessRecommendationResult,
  ) => {
    const key = item.businessName;
    if (aiExplanations[key] || aiLoadingKeys[key]) {
      return;
    }

    setAiLoadingKeys(prev => ({...prev, [key]: true}));
    setAiErrorKeys(prev => ({...prev, [key]: ''}));

    try {
      const explanation = await generateAIExplanation({
        지역: region,
        업종: item.businessName,
        유동인구: item.floatingPopulation,
        생활인구: item.livingPopulation,
        점포수: item.storeCount,
        경쟁밀도: item.competitionDensity,
        전체카드소비: item.salesAmount,
        점포당카드소비: item.averageSalesPerStore,
        버스정류장수: item.busStopCount,
        추천점수: item.recommendationScore,
        순위: item.rank,
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

  if (loading) {
    return (
      <View
        style={
          styles.centerContainer
        }
      >
        <ActivityIndicator
          size="large"
          color={COLORS.primary}
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

      {results.map(
        (item) => {
          const expanded =
            expandedBusiness ===
            item.businessName;

          const aiKey = item.businessName;
          const explanation = aiExplanations[aiKey];
          const aiLoading = aiLoadingKeys[aiKey];
          const aiError = aiErrorKeys[aiKey];
          const aiDetailExpanded = aiDetailExpandedKeys[aiKey];

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

              {/* AI 상세 분석 (버튼 눌렀을 때만 요청) */}
              {!explanation && (
                <TouchableOpacity
                  style={styles.aiButton}
                  activeOpacity={0.7}
                  disabled={aiLoading}
                  onPress={() => handleGenerateAI(item)}>
                  {aiLoading ? (
                    <ActivityIndicator size="small" color={COLORS.primary} />
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
                    onPress={() => toggleAiDetail(aiKey)}>
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
        COLORS.background,
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
      fontWeight: "800",
      marginTop: 20,
      color:
        COLORS.text,
    },

    loadingDescription: {
      fontSize: 13,
      color:
        COLORS.textSecondary,
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
      fontWeight: "700",
      color:
        COLORS.primary,
    },

    title: {
      fontSize: 30,
      fontWeight: "900",
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
      marginBottom: 22,
    },

    summaryBox: {
      backgroundColor:
        "#111111",
      borderRadius: 18,
      padding: 22,
      marginBottom: 30,
      borderWidth: 1,
      borderColor:
        "#252525",
    },

    summaryLabel: {
      fontSize: 12,
      color:
        "#A8B0A9",
    },

    summaryBusiness: {
      fontSize: 28,
      fontWeight: "900",
      color:
        "#FFFFFF",
      marginTop: 5,
    },

    summaryScore: {
      fontSize: 15,
      fontWeight: "800",
      color:
        COLORS.neonLime,
      marginTop: 6,
    },

    summaryReason: {
      fontSize: 12,
      lineHeight: 18,
      color:
        "#C8CEC9",
      marginTop: 8,
    },

    sectionTitle: {
      fontSize: 20,
      fontWeight: "900",
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
      shadowOpacity: 0.04,
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
      paddingHorizontal: 9,
      borderRadius: 12,
      backgroundColor:
        COLORS.lime,
    },

    rank: {
      fontSize: 13,
      fontWeight: "900",
      color:
        COLORS.primary,
    },

    nameContainer: {
      flex: 1,
    },

    name: {
      fontSize: 18,
      fontWeight: "900",
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
      fontWeight: "900",
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
        "#F7F9F7",
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
      fontWeight: "800",
      color:
        COLORS.text,
    },

    expandButton: {
      marginTop: 14,
      paddingVertical: 10,
      borderRadius: 12,
      backgroundColor:
        COLORS.neonLime,
    },

    expandText: {
      textAlign: "center",
      color:
        COLORS.text,
      fontSize: 12,
      fontWeight: "900",
    },

    detailContainer: {
      borderTopWidth: 1,
      borderTopColor:
        COLORS.border,
      paddingTop: 18,
      marginTop: 18,
    },

    detailTitle: {
      fontSize: 16,
      fontWeight: "900",
      marginBottom: 13,
      color:
        COLORS.text,
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
      fontWeight: "800",
      color:
        COLORS.text,
    },

    divider: {
      borderTopWidth: 1,
      borderTopColor:
        COLORS.border,
      marginVertical: 18,
    },

    finalScoreBox: {
      flexDirection:
        "row",
      justifyContent:
        "space-between",
      alignItems:
        "center",
      backgroundColor:
        "#F1FFF5",
      borderRadius: 14,
      padding: 16,
      marginTop: 10,
      borderWidth: 1,
      borderColor:
        "#D8F5E2",
    },

    finalScoreLabel: {
      fontSize: 14,
      fontWeight: "900",
      color:
        COLORS.text,
    },

    finalScoreValue: {
      fontSize: 21,
      fontWeight: "900",
      color:
        COLORS.primary,
    },

    aiButton: {
      marginTop: 14,
      paddingVertical: 10,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: COLORS.primary,
      alignItems: 'center',
    },
    aiButtonText: {fontSize: 13, fontWeight: '800', color: COLORS.primary},
    aiError: {fontSize: 12, color: '#D64545', marginTop: 10},
    aiBox: {
      marginTop: 14,
      paddingTop: 14,
      borderTopWidth: 1,
      borderTopColor: COLORS.border,
    },
    aiLabel: {
      fontSize: 12,
      fontWeight: '800',
      color: COLORS.textSecondary,
      marginTop: 10,
      marginBottom: 4,
    },
    aiText: {fontSize: 13, color: COLORS.text, lineHeight: 19},
    aiHighlight: {fontWeight: '900', color: COLORS.primary},
    aiListItem: {fontSize: 13, color: COLORS.text, lineHeight: 19, marginLeft: 4},
    detailToggleButton: {marginTop: 12, alignItems: 'center'},
    detailToggleText: {fontSize: 12, fontWeight: '700', color: COLORS.textSecondary},
    aiDetailSection: {
      marginTop: 6,
      paddingTop: 10,
      borderTopWidth: 1,
      borderTopColor: COLORS.border,
    },
  });