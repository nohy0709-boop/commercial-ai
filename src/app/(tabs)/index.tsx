import { useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { businessCategories } from "../../constants/businessTypes";
import { sejongAreas } from "../../constants/sejongAreas";

import {
  analyzeCommercialArea,
  calculateSuitabilityScores,
} from "../../services/commercialAnalysis";

type Result = {
  areaName: string;
  storeCount: number;

  livingPopulation: number;
  floatingPopulation: number;

  livingPopulationChangeRate: number;
  floatingPopulationChangeRate: number;

  salesAmount: number;
  competitionDensity: number;
  averageSalesPerStore: number;

  floatingPopulationScore: number;
  salesScore: number;
  averageSalesScore: number;
  competitionScore: number;
  livingPopulationScore: number;

  livingPopulationChangeScore: number;
  floatingPopulationChangeScore: number;

  suitabilityScore: number;
};

export default function HomeScreen() {
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("음식점");
  const [selectedBusiness, setSelectedBusiness] = useState("한식");

  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const toggleArea = (areaName: string) => {
    if (selectedAreas.includes(areaName)) {
      setSelectedAreas(
        selectedAreas.filter((name) => name !== areaName)
      );
    } else {
      setSelectedAreas([...selectedAreas, areaName]);
    }
  };

  const currentCategory = businessCategories.find(
    (category) => category.categoryName === selectedCategory
  );

  const handleCategorySelect = (categoryName: string) => {
    setSelectedCategory(categoryName);

    const category = businessCategories.find(
      (item) => item.categoryName === categoryName
    );

    if (category && category.businesses.length > 0) {
      setSelectedBusiness(category.businesses[0].name);
    }

    setResults([]);
    setErrorMessage("");
  };

  const handleAnalysis = async () => {
    if (selectedAreas.length === 0) {
      setErrorMessage("분석할 지역을 1개 이상 선택해주세요.");
      return;
    }

    try {
      setLoading(true);
      setErrorMessage("");
      setResults([]);

      const business = currentCategory?.businesses.find(
        (item) => item.name === selectedBusiness
      );

      if (!business) {
        throw new Error("선택한 업종 정보를 찾을 수 없습니다.");
      }

      const targets = sejongAreas.filter((area) =>
        selectedAreas.includes(area.name)
      );

      const analysisResults = await Promise.all(
        targets.map((area) =>
          analyzeCommercialArea(
            area.name,
            area.code,
            business.name,
            business.lclsCode,
            business.mclsCode,
            business.sclsCode
          )
        )
      );

      const scoredResults =
        calculateSuitabilityScores(analysisResults);

      setResults(scoredResults);
    } catch (error) {
      console.error("상권 분석 오류:", error);

      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("상권 분석 중 오류가 발생했습니다.");
      }
    } finally {
      setLoading(false);
    }
  };

  const formatChangeRate = (value?: number) => {
  if (value === undefined || value === null) {
    return "데이터 없음";
  }

  if (value > 0) {
    return `+${value.toFixed(2)}%`;
  }

  return `${value.toFixed(2)}%`;
};

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>세종 상권 분석</Text>

      <Text style={styles.sectionTitle}>
        업종 대분류
      </Text>

      <View style={styles.categoryContainer}>
        {businessCategories.map((category) => {
          const selected =
            selectedCategory === category.categoryName;

          return (
            <TouchableOpacity
              key={category.categoryName}
              style={[
                styles.categoryButton,
                selected &&
                  styles.selectedCategoryButton,
              ]}
              onPress={() =>
                handleCategorySelect(
                  category.categoryName
                )
              }
            >
              <Text
                style={[
                  styles.categoryText,
                  selected &&
                    styles.selectedCategoryText,
                ]}
              >
                {category.categoryName}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={styles.sectionTitle}>
        세부 업종
      </Text>

      <View style={styles.businessContainer}>
        {currentCategory?.businesses.map(
          (business) => {
            const selected =
              selectedBusiness === business.name;

            return (
              <TouchableOpacity
                key={business.name}
                style={[
                  styles.businessButton,
                  selected &&
                    styles.selectedBusinessButton,
                ]}
                onPress={() => {
                  setSelectedBusiness(
                    business.name
                  );
                  setResults([]);
                  setErrorMessage("");
                }}
              >
                <Text
                  style={[
                    styles.businessText,
                    selected &&
                      styles.selectedBusinessText,
                  ]}
                >
                  {business.name}
                </Text>
              </TouchableOpacity>
            );
          }
        )}
      </View>

      <Text style={styles.sectionTitle}>
        지역 선택
      </Text>

      <Text style={styles.subtitle}>
        분석할 지역을 선택해주세요.
      </Text>

      {sejongAreas.map((area) => {
        const selected =
          selectedAreas.includes(area.name);

        return (
          <TouchableOpacity
            key={area.code}
            style={[
              styles.areaButton,
              selected &&
                styles.selectedButton,
            ]}
            onPress={() =>
              toggleArea(area.name)
            }
          >
            <Text
              style={[
                styles.areaText,
                selected &&
                  styles.selectedText,
              ]}
            >
              {selected ? "✓ " : ""}
              {area.name}
            </Text>
          </TouchableOpacity>
        );
      })}

      <Text style={styles.selectedCount}>
        {selectedAreas.length}개 지역 선택됨
      </Text>

      <Text style={styles.currentBusiness}>
        선택 업종: {selectedBusiness}
      </Text>

      <TouchableOpacity
        style={styles.analysisButton}
        onPress={handleAnalysis}
      >
        <Text
          style={styles.analysisButtonText}
        >
          상권 분석하기
        </Text>
      </TouchableOpacity>

      {loading && (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" />

          <Text style={styles.loadingText}>
            상권 데이터를 분석하는 중...
          </Text>
        </View>
      )}

      {errorMessage !== "" && (
        <Text style={styles.error}>
          {errorMessage}
        </Text>
      )}

      {!loading &&
        results.map((result, index) => (
          <View
            key={result.areaName}
            style={styles.resultCard}
          >
            <Text style={styles.rank}>
              상권 적합도 {index + 1}위
            </Text>

            <Text style={styles.resultName}>
              {result.areaName}
            </Text>

            <Text style={styles.resultBusiness}>
              {selectedBusiness}
            </Text>

            <View style={styles.scoreBox}>
              <Text style={styles.scoreLabel}>
                상권 적합도
              </Text>

              <Text style={styles.scoreValue}>
                {result.suitabilityScore}점
              </Text>
            </View>

            <View style={styles.dataRow}>
              <Text style={styles.resultLabel}>
                {selectedBusiness} 수
              </Text>

              <Text style={styles.resultValue}>
                {result.storeCount.toLocaleString()}개
              </Text>
            </View>

            <View style={styles.dataRow}>
              <Text style={styles.resultLabel}>
                생활인구
              </Text>

              <Text style={styles.resultValue}>
                {result.livingPopulation.toLocaleString()}
                명
              </Text>
            </View>

            <View style={styles.dataRow}>
              <Text style={styles.resultLabel}>
                생활인구 증감률
              </Text>

              <Text style={styles.resultValue}>
                {formatChangeRate(
                  result.livingPopulationChangeRate
                )}
              </Text>
            </View>

            <View style={styles.dataRow}>
              <Text style={styles.resultLabel}>
                유동인구
              </Text>

              <Text style={styles.resultValue}>
                {result.floatingPopulation.toLocaleString()}
                명
              </Text>
            </View>

            <View style={styles.dataRow}>
              <Text style={styles.resultLabel}>
                유동인구 증감률
              </Text>

              <Text style={styles.resultValue}>
                {formatChangeRate(
                  result.floatingPopulationChangeRate
                )}
              </Text>
            </View>

            <View style={styles.dataRow}>
              <Text style={styles.resultLabel}>
                {selectedBusiness} 카드소비
              </Text>

              <Text style={styles.resultValue}>
                {result.salesAmount.toLocaleString()}원
              </Text>
            </View>

            <View style={styles.dataRow}>
              <Text style={styles.resultLabel}>
                점포당 카드소비액
              </Text>

              <Text style={styles.resultValue}>
                {Math.round(
                  result.averageSalesPerStore
                ).toLocaleString()}
                원
              </Text>
            </View>

            <View style={styles.densityBox}>
              <Text style={styles.densityLabel}>
                경쟁밀도
              </Text>

              <Text style={styles.densityValue}>
                {result.competitionDensity.toFixed(3)}
              </Text>

              <Text
                style={styles.densityDescription}
              >
                유동인구 1,000명당{" "}
                {selectedBusiness} 수
              </Text>
            </View>

            <View style={styles.detailScoreBox}>
              <Text style={styles.detailTitle}>
                지표별 점수
              </Text>

              <Text style={styles.detailText}>
                유동인구:{" "}
                {result.floatingPopulationScore}점
              </Text>

              <Text style={styles.detailText}>
                전체 카드소비:{" "}
                {result.salesScore}점
              </Text>

              <Text style={styles.detailText}>
                점포당 카드소비:{" "}
                {result.averageSalesScore}점
              </Text>

              <Text style={styles.detailText}>
                경쟁도:{" "}
                {result.competitionScore}점
              </Text>

              <Text style={styles.detailText}>
                생활인구:{" "}
                {result.livingPopulationScore}점
              </Text>

              <Text style={styles.detailText}>
                생활인구 증감:{" "}
                {result.livingPopulationChangeScore}점
              </Text>

              <Text style={styles.detailText}>
                유동인구 증감:{" "}
                {result.floatingPopulationChangeScore}점
              </Text>
            </View>
          </View>
        ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f6f8",
  },

  contentContainer: {
    padding: 30,
    paddingTop: 70,
    paddingBottom: 60,
  },

  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 30,
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 12,
    marginTop: 15,
  },

  subtitle: {
    fontSize: 15,
    marginBottom: 20,
  },

  categoryContainer: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 20,
  },

  categoryButton: {
    flex: 1,
    backgroundColor: "white",
    padding: 16,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "transparent",
  },

  selectedCategoryButton: {
    backgroundColor: "#222",
  },

  categoryText: {
    textAlign: "center",
    fontSize: 16,
  },

  selectedCategoryText: {
    color: "white",
    fontWeight: "bold",
  },

  businessContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 25,
  },

  businessButton: {
    backgroundColor: "white",
    paddingVertical: 13,
    paddingHorizontal: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "transparent",
  },

  selectedBusinessButton: {
    borderColor: "#222",
    backgroundColor: "#eeeeee",
  },

  businessText: {
    fontSize: 15,
  },

  selectedBusinessText: {
    fontWeight: "bold",
  },

  areaButton: {
    backgroundColor: "white",
    padding: 18,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: "transparent",
  },

  selectedButton: {
    borderColor: "#222",
    backgroundColor: "#eeeeee",
  },

  areaText: {
    fontSize: 18,
  },

  selectedText: {
    fontWeight: "bold",
  },

  selectedCount: {
    marginTop: 10,
    fontSize: 15,
  },

  currentBusiness: {
    marginTop: 8,
    fontSize: 15,
    fontWeight: "bold",
  },

  analysisButton: {
    backgroundColor: "#222",
    padding: 18,
    borderRadius: 12,
    marginTop: 25,
  },

  analysisButtonText: {
    color: "white",
    fontSize: 17,
    fontWeight: "bold",
    textAlign: "center",
  },

  loadingBox: {
    marginTop: 30,
    alignItems: "center",
    gap: 10,
  },

  loadingText: {
    fontSize: 15,
  },

  error: {
    color: "red",
    fontSize: 16,
    marginTop: 20,
  },

  resultCard: {
    backgroundColor: "white",
    padding: 22,
    borderRadius: 14,
    marginTop: 18,
  },

  rank: {
    fontSize: 13,
    fontWeight: "bold",
    marginBottom: 5,
  },

  resultName: {
    fontSize: 24,
    fontWeight: "bold",
  },

  resultBusiness: {
    marginTop: 4,
    marginBottom: 15,
    fontSize: 14,
  },

  scoreBox: {
    backgroundColor: "#eeeeee",
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },

  scoreLabel: {
    fontSize: 14,
  },

  scoreValue: {
    fontSize: 30,
    fontWeight: "bold",
    marginTop: 5,
  },

  dataRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 13,
  },

  resultLabel: {
    fontSize: 15,
  },

  resultValue: {
    fontSize: 15,
    fontWeight: "bold",
  },

  densityBox: {
    marginTop: 12,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: "#dddddd",
  },

  densityLabel: {
    fontSize: 14,
    marginBottom: 5,
  },

  densityValue: {
    fontSize: 27,
    fontWeight: "bold",
  },

  densityDescription: {
    fontSize: 12,
    marginTop: 3,
  },

  detailScoreBox: {
    marginTop: 20,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: "#dddddd",
  },

  detailTitle: {
    fontSize: 15,
    fontWeight: "bold",
    marginBottom: 10,
  },

  detailText: {
    fontSize: 14,
    marginBottom: 5,
  },
});