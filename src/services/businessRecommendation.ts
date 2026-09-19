import type {
  CommercialAnalysisResult,
  PointCommercialAnalysisResult,
} from "./commercialAnalysis";

/**
 * 좌표 기반 분석에서 추가로 들어오는 정보
 *
 * 동 전체 분석에서는 없을 수 있으므로 optional 처리
 */
type PointAnalysisMetadata = {
  dongName?: string;

  latitude?: number;
  longitude?: number;

  radius?: number;

  analysisType?: "point";

  radiusStoreCount?: number;

  isEstimated?: boolean;
};

/**
 * =====================================================
 * 업종 추천 최종 결과
 * =====================================================
 *
 * 기존 동 단위 분석 결과 +
 * 좌표 기반 분석 메타데이터 +
 * 추천 점수
 */
export type BusinessRecommendationResult =
  CommercialAnalysisResult &
    PointAnalysisMetadata & {
      businessName: string;

      averageSalesScore: number;
      competitionScore: number;
      salesScore: number;

      recommendationScore: number;

      rank: number;
    };

/**
 * =====================================================
 * 추천 계산 입력 타입
 * =====================================================
 *
 * 기존 동 전체 분석과
 * 좌표 기반 분석 모두 받을 수 있음
 */
type BusinessAnalysisInput = {
  businessName: string;

  analysis:
    | CommercialAnalysisResult
    | PointCommercialAnalysisResult;
};

/**
 * =====================================================
 * 일반 정규화
 * =====================================================
 *
 * 값이 클수록 높은 점수
 */
function normalize(
  value: number,
  min: number,
  max: number,
): number {
  if (max === min) {
    return 100;
  }

  return (
    ((value - min) /
      (max - min)) *
    100
  );
}

/**
 * =====================================================
 * 역방향 정규화
 * =====================================================
 *
 * 값이 낮을수록 높은 점수
 *
 * 경쟁밀도 등에 사용
 */
function normalizeReverse(
  value: number,
  min: number,
  max: number,
): number {
  if (max === min) {
    return 100;
  }

  return (
    ((max - value) /
      (max - min)) *
    100
  );
}

/**
 * =====================================================
 * 입지 기반 업종 추천 점수 계산
 * =====================================================
 */
export function calculateBusinessRecommendationScores(
  items: BusinessAnalysisInput[],
): BusinessRecommendationResult[] {
  if (items.length === 0) {
    return [];
  }

  /**
   * =====================================================
   * 비교에 사용할 데이터
   * =====================================================
   */

  /**
   * 점포당 카드소비
   */
  const averageSalesValues =
    items.map(
      item =>
        item.analysis
          .averageSalesPerStore,
    );

  /**
   * 경쟁밀도
   */
  const competitionValues =
    items.map(
      item =>
        item.analysis
          .competitionDensity,
    );

  /**
   * 전체 카드소비
   *
   * 좌표 기반 분석에서는
   * 선택 위치 반경에 맞게 보정된 값
   */
  const salesValues =
    items.map(
      item =>
        item.analysis
          .salesAmount,
    );

  /**
   * =====================================================
   * 최소 / 최대값
   * =====================================================
   */
  const minAverageSales =
    Math.min(
      ...averageSalesValues,
    );

  const maxAverageSales =
    Math.max(
      ...averageSalesValues,
    );

  const minCompetition =
    Math.min(
      ...competitionValues,
    );

  const maxCompetition =
    Math.max(
      ...competitionValues,
    );

  const minSales =
    Math.min(
      ...salesValues,
    );

  const maxSales =
    Math.max(
      ...salesValues,
    );

  /**
   * =====================================================
   * 업종별 점수 계산
   * =====================================================
   */
  const scoredResults =
    items.map(
      item => {
        /**
         * 점포 하나당 소비가
         * 높을수록 좋은 점수
         */
        const averageSalesScore =
          normalize(
            item.analysis
              .averageSalesPerStore,

            minAverageSales,

            maxAverageSales,
          );

        /**
         * 경쟁밀도는
         * 낮을수록 좋은 점수
         */
        const competitionScore =
          normalizeReverse(
            item.analysis
              .competitionDensity,

            minCompetition,

            maxCompetition,
          );

        /**
         * 해당 위치에서
         * 해당 업종의 소비 규모
         */
        const salesScore =
          normalize(
            item.analysis
              .salesAmount,

            minSales,

            maxSales,
          );

        /**
         * =====================================================
         * 입지 기반 업종 추천 가중치
         * =====================================================
         *
         * 점포당 카드소비 : 40%
         * 경쟁도           : 35%
         * 전체 카드소비    : 25%
         *
         * 현재 생활인구 /
         * 유동인구 /
         * 접근성 데이터는
         *
         * 동 데이터를 기반으로
         * 세부 위치에 맞게 추정한 값이므로
         *
         * 일단 업종 추천 순위에는
         * 직접 사용하지 않음.
         */
        const recommendationScore =
          averageSalesScore *
            0.4 +
          competitionScore *
            0.35 +
          salesScore *
            0.25;

        return {
          /**
           * 분석 결과 전체 유지
           *
           * PointCommercialAnalysisResult라면
           *
           * latitude
           * longitude
           * radius
           * isEstimated
           *
           * 등의 정보도 같이 들어옴.
           */
          ...item.analysis,

          businessName:
            item.businessName,

          averageSalesScore:
            Number(
              averageSalesScore.toFixed(
                1,
              ),
            ),

          competitionScore:
            Number(
              competitionScore.toFixed(
                1,
              ),
            ),

          salesScore:
            Number(
              salesScore.toFixed(
                1,
              ),
            ),

          recommendationScore:
            Number(
              recommendationScore.toFixed(
                1,
              ),
            ),

          /**
           * 정렬 후 다시 부여
           */
          rank: 0,
        };
      },
    );

  /**
   * =====================================================
   * 추천 점수 높은 순 정렬
   * =====================================================
   */
  scoredResults.sort(
    (
      a,
      b,
    ) =>
      b.recommendationScore -
      a.recommendationScore,
  );

  /**
   * =====================================================
   * 최종 순위 부여
   * =====================================================
   */
  return scoredResults.map(
    (
      item,
      index,
    ) => ({
      ...item,

      rank:
        index + 1,
    }),
  );
}