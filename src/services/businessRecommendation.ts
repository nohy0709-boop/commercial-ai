import type {
    CommercialAnalysisResult,
} from "./commercialAnalysis";

export type BusinessRecommendationResult =
  CommercialAnalysisResult & {
    businessName: string;

    averageSalesScore: number;
    competitionScore: number;
    salesScore: number;

    recommendationScore: number;

    rank: number;
  };

type BusinessAnalysisInput = {
  businessName: string;
  analysis: CommercialAnalysisResult;
};

// 일반 정규화
function normalize(
  value: number,
  min: number,
  max: number
) {
  if (max === min) {
    return 100;
  }

  return (
    ((value - min) /
      (max - min)) *
    100
  );
}

// 낮을수록 높은 점수
function normalizeReverse(
  value: number,
  min: number,
  max: number
) {
  if (max === min) {
    return 100;
  }

  return (
    ((max - value) /
      (max - min)) *
    100
  );
}

export function calculateBusinessRecommendationScores(
  items: BusinessAnalysisInput[]
): BusinessRecommendationResult[] {
  if (items.length === 0) {
    return [];
  }

  const averageSalesValues =
    items.map(
      (item) =>
        item.analysis.averageSalesPerStore
    );

  const competitionValues =
    items.map(
      (item) =>
        item.analysis.competitionDensity
    );

  const salesValues =
    items.map(
      (item) =>
        item.analysis.salesAmount
    );

  const minAverageSales =
    Math.min(...averageSalesValues);

  const maxAverageSales =
    Math.max(...averageSalesValues);

  const minCompetition =
    Math.min(...competitionValues);

  const maxCompetition =
    Math.max(...competitionValues);

  const minSales =
    Math.min(...salesValues);

  const maxSales =
    Math.max(...salesValues);

  const scoredResults =
    items.map((item) => {
      // 점포 하나당 소비가 높을수록 좋음
      const averageSalesScore =
        normalize(
          item.analysis.averageSalesPerStore,
          minAverageSales,
          maxAverageSales
        );

      // 경쟁밀도는 낮을수록 좋음
      const competitionScore =
        normalizeReverse(
          item.analysis.competitionDensity,
          minCompetition,
          maxCompetition
        );

      // 해당 업종의 전체 소비 규모
      const salesScore =
        normalize(
          item.analysis.salesAmount,
          minSales,
          maxSales
        );

      /*
        입지 기반 업종 추천 가중치

        점포당 카드소비 : 40%
        경쟁도           : 35%
        전체 카드소비    : 25%

        같은 지역에서는
        생활인구/유동인구/접근성이
        모든 업종에 동일하므로
        순위 계산에는 사용하지 않음.
      */

      const recommendationScore =
        averageSalesScore * 0.4 +
        competitionScore * 0.35 +
        salesScore * 0.25;

      return {
        ...item.analysis,

        businessName:
          item.businessName,

        averageSalesScore:
          Number(
            averageSalesScore.toFixed(1)
          ),

        competitionScore:
          Number(
            competitionScore.toFixed(1)
          ),

        salesScore:
          Number(
            salesScore.toFixed(1)
          ),

        recommendationScore:
          Number(
            recommendationScore.toFixed(1)
          ),

        rank: 0,
      };
    });

  scoredResults.sort(
    (a, b) =>
      b.recommendationScore -
      a.recommendationScore
  );

  return scoredResults.map(
    (item, index) => ({
      ...item,
      rank: index + 1,
    })
  );
}