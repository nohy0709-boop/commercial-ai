import { getAccessibilityByArea } from '../data/accessibilityData';
import { getPopulationByArea } from '../data/populationData';
import { getSalesByAreaAndBusiness } from '../data/salesData';

import {
  getStoreCount,
  getStoreCountInRadius,
} from './storeApi';

export type CommercialAnalysisResult = {
  areaName: string;

  storeCount: number;

  livingPopulation: number;
  floatingPopulation: number;

  livingPopulationChangeRate: number;
  floatingPopulationChangeRate: number;

  salesAmount: number;

  competitionDensity: number;

  averageSalesPerStore: number;

  busStopCount: number;
};

export type PointCommercialAnalysisResult =
  CommercialAnalysisResult & {
    dongName: string;

    latitude: number;
    longitude: number;

    radius: number;

    analysisType: 'point';

    radiusStoreCount: number;

    isEstimated: true;
  };

export type ScoredCommercialAnalysisResult =
  CommercialAnalysisResult & {
    floatingPopulationScore: number;

    salesScore: number;

    averageSalesScore: number;

    competitionScore: number;

    livingPopulationScore: number;

    livingPopulationChangeScore: number;

    floatingPopulationChangeScore: number;

    accessibilityScore: number;

    suitabilityScore: number;
  };

/**
 * =====================================================
 * 동 전체 상권 분석
 * =====================================================
 *
 * 예:
 * 종촌동 전체
 * 고운동 전체
 * 반곡동 전체
 */
export async function analyzeCommercialArea(
  areaName: string,
  adongCode: string,
  businessName: string,
  lclsCode: string,
  mclsCode?: string,
  sclsCode?: string,
): Promise<CommercialAnalysisResult> {
  /**
   * 해당 행정동의 동일 업종 점포 수
   */
  const storeResult =
    await getStoreCount(
      areaName,
      adongCode,
      lclsCode,
      mclsCode,
      sclsCode,
    );

  /**
   * 인구 데이터
   */
  const population =
    getPopulationByArea(
      areaName,
    );

  if (!population) {
    throw new Error(
      `${areaName} 인구 데이터를 찾을 수 없습니다.`,
    );
  }

  /**
   * 접근성 데이터
   */
  const accessibility =
    getAccessibilityByArea(
      areaName,
    );

  if (!accessibility) {
    throw new Error(
      `${areaName} 접근성 데이터를 찾을 수 없습니다.`,
    );
  }

  /**
   * 카드 소비 데이터
   */
  const sales =
    getSalesByAreaAndBusiness(
      areaName,
      businessName,
    );

  if (!sales) {
    throw new Error(
      `${areaName} ${businessName} 카드소비 데이터를 찾을 수 없습니다.`,
    );
  }

  /**
   * 경쟁밀도
   *
   * 유동인구 1000명당 동일 업종 점포 수
   */
  const competitionDensity =
    population.floatingPopulation > 0
      ? (
          storeResult.storeCount /
          population.floatingPopulation
        ) * 1000
      : 0;

  /**
   * 점포당 평균 카드소비
   */
  const averageSalesPerStore =
    storeResult.storeCount > 0
      ? sales.salesAmount /
        storeResult.storeCount
      : 0;

  return {
    areaName,

    storeCount:
      storeResult.storeCount,

    livingPopulation:
      population.livingPopulation,

    floatingPopulation:
      population.floatingPopulation,

    livingPopulationChangeRate:
      population.livingPopulationChangeRate,

    floatingPopulationChangeRate:
      population.floatingPopulationChangeRate,

    salesAmount:
      sales.salesAmount,

    competitionDensity,

    averageSalesPerStore,

    busStopCount:
      accessibility.busStopCount,
  };
}

/**
 * =====================================================
 * 좌표 + 반경 상권 분석
 * =====================================================
 *
 * label
 * → 화면에 표시할 이름
 *
 * 예:
 * "종촌동 내 선택 지점"
 * "정부세종청사 인근"
 *
 *
 * dongName
 * → 실제 데이터 조회용 행정동 이름
 *
 * 예:
 * "종촌동"
 * "어진동"
 *
 *
 * 실제 좌표 기반 데이터
 * → 반경 내 동일 업종 점포 수
 *
 *
 * 현재 동 단위 데이터를 기반으로 추정하는 값
 * → 생활인구
 * → 유동인구
 * → 카드소비
 * → 버스정류장
 */
export async function analyzeCommercialPoint(
  label: string,
  dongName: string,
  adongCode: string,

  latitude: number,
  longitude: number,

  radius: number,

  businessName: string,

  lclsCode: string,
  mclsCode?: string,
  sclsCode?: string,
): Promise<PointCommercialAnalysisResult> {
  /**
   * =====================================================
   * 반경 내 실제 동일 업종 점포 수
   * =====================================================
   */
  const radiusStoreCount =
    await getStoreCountInRadius(
      latitude,
      longitude,
      radius,

      adongCode,

      lclsCode,
      mclsCode,
      sclsCode,
    );

  /**
   * =====================================================
   * 동 전체 동일 업종 점포 수
   * =====================================================
   *
   * 반경 비중 계산용
   */
  const dongStoreResult =
    await getStoreCount(
      dongName,
      adongCode,

      lclsCode,
      mclsCode,
      sclsCode,
    );

  /**
   * =====================================================
   * 동 단위 인구 데이터
   * =====================================================
   */
  const population =
    getPopulationByArea(
      dongName,
    );

  if (!population) {
    throw new Error(
      `${dongName} 인구 데이터를 찾을 수 없습니다.`,
    );
  }

  /**
   * =====================================================
   * 동 단위 접근성 데이터
   * =====================================================
   */
  const accessibility =
    getAccessibilityByArea(
      dongName,
    );

  if (!accessibility) {
    throw new Error(
      `${dongName} 접근성 데이터를 찾을 수 없습니다.`,
    );
  }

  /**
   * =====================================================
   * 동 단위 카드소비 데이터
   * =====================================================
   */
  const sales =
    getSalesByAreaAndBusiness(
      dongName,
      businessName,
    );

  if (!sales) {
    throw new Error(
      `${dongName} ${businessName} 카드소비 데이터를 찾을 수 없습니다.`,
    );
  }

  /**
   * =====================================================
   * 상권 집중 비율
   * =====================================================
   *
   * 동 전체 동일 업종 점포 중
   * 사용자가 선택한 반경 안에 있는 비율
   *
   * 예:
   *
   * 종촌동 전체 카페 100개
   * 반경 500m 안 카페 25개
   *
   * storeRatio = 0.25
   */
  const storeRatio =
    dongStoreResult.storeCount > 0
      ? radiusStoreCount /
        dongStoreResult.storeCount
      : 0;

  /**
   * 비율이 0~1을 벗어나지 않도록 제한
   */
  const safeStoreRatio =
    Math.min(
      Math.max(
        storeRatio,
        0,
      ),
      1,
    );

  /**
   * =====================================================
   * 생활인구 추정
   * =====================================================
   *
   * 현재 실제 반경 단위 인구 데이터가 없기 때문에
   * 동 전체 생활인구를 점포 집중 비율로 보정
   */
  const estimatedLivingPopulation =
    population.livingPopulation *
    safeStoreRatio;

  /**
   * =====================================================
   * 유동인구 추정
   * =====================================================
   */
  const estimatedFloatingPopulation =
    population.floatingPopulation *
    safeStoreRatio;

  /**
   * =====================================================
   * 카드소비 추정
   * =====================================================
   */
  const estimatedSalesAmount =
    sales.salesAmount *
    safeStoreRatio;

  /**
   * =====================================================
   * 버스정류장 수 추정
   * =====================================================
   *
   * 추후 버스정류장 좌표 데이터를 연결하면
   * 실제 반경 계산 방식으로 바꾸는 게 좋음
   */
  const estimatedBusStopCount =
    Math.round(
      accessibility.busStopCount *
        safeStoreRatio,
    );

  /**
   * =====================================================
   * 경쟁밀도
   * =====================================================
   *
   * 추정 유동인구 1000명당
   * 반경 내 실제 동일 업종 점포 수
   */
  const competitionDensity =
    estimatedFloatingPopulation > 0
      ? (
          radiusStoreCount /
          estimatedFloatingPopulation
        ) * 1000
      : 0;

  /**
   * =====================================================
   * 점포당 평균 소비
   * =====================================================
   */
  const averageSalesPerStore =
    radiusStoreCount > 0
      ? estimatedSalesAmount /
        radiusStoreCount
      : 0;

  return {
    /**
     * 결과 화면 표시용 이름
     */
    areaName:
      label,

    /**
     * 실제 행정동
     */
    dongName,

    latitude,

    longitude,

    radius,

    analysisType:
      'point',

    /**
     * 현재 반경 기반 결과에는
     * 추정 데이터가 포함되어 있음
     */
    isEstimated:
      true,

    /**
     * 반경 안 실제 점포 수
     */
    storeCount:
      radiusStoreCount,

    radiusStoreCount,

    /**
     * 아래부터 일부 추정값
     */
    livingPopulation:
      Math.round(
        estimatedLivingPopulation,
      ),

    floatingPopulation:
      Math.round(
        estimatedFloatingPopulation,
      ),

    /**
     * 증감률은 현재 동 단위 추세를 그대로 사용
     */
    livingPopulationChangeRate:
      population.livingPopulationChangeRate,

    floatingPopulationChangeRate:
      population.floatingPopulationChangeRate,

    salesAmount:
      Math.round(
        estimatedSalesAmount,
      ),

    competitionDensity,

    averageSalesPerStore,

    busStopCount:
      estimatedBusStopCount,
  };
}

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
 * 상권 적합도 점수 계산
 * =====================================================
 */
export function calculateSuitabilityScores(
  results: CommercialAnalysisResult[],
): ScoredCommercialAnalysisResult[] {
  if (results.length === 0) {
    return [];
  }

  /**
   * 비교 대상 데이터 배열 생성
   */
  const floatingPopulations =
    results.map(
      item =>
        item.floatingPopulation,
    );

  const livingPopulations =
    results.map(
      item =>
        item.livingPopulation,
    );

  const salesAmounts =
    results.map(
      item =>
        item.salesAmount,
    );

  const averageSales =
    results.map(
      item =>
        item.averageSalesPerStore,
    );

  const competitionDensities =
    results.map(
      item =>
        item.competitionDensity,
    );

  const livingChangeRates =
    results.map(
      item =>
        item.livingPopulationChangeRate,
    );

  const floatingChangeRates =
    results.map(
      item =>
        item.floatingPopulationChangeRate,
    );

  const busStopCounts =
    results.map(
      item =>
        item.busStopCount,
    );

  /**
   * =====================================================
   * 각 지표 최소/최대값
   * =====================================================
   */
  const minFloating =
    Math.min(
      ...floatingPopulations,
    );

  const maxFloating =
    Math.max(
      ...floatingPopulations,
    );

  const minLiving =
    Math.min(
      ...livingPopulations,
    );

  const maxLiving =
    Math.max(
      ...livingPopulations,
    );

  const minSales =
    Math.min(
      ...salesAmounts,
    );

  const maxSales =
    Math.max(
      ...salesAmounts,
    );

  const minAverageSales =
    Math.min(
      ...averageSales,
    );

  const maxAverageSales =
    Math.max(
      ...averageSales,
    );

  const minCompetition =
    Math.min(
      ...competitionDensities,
    );

  const maxCompetition =
    Math.max(
      ...competitionDensities,
    );

  const minLivingChange =
    Math.min(
      ...livingChangeRates,
    );

  const maxLivingChange =
    Math.max(
      ...livingChangeRates,
    );

  const minFloatingChange =
    Math.min(
      ...floatingChangeRates,
    );

  const maxFloatingChange =
    Math.max(
      ...floatingChangeRates,
    );

  const minBusStop =
    Math.min(
      ...busStopCounts,
    );

  const maxBusStop =
    Math.max(
      ...busStopCounts,
    );

  /**
   * =====================================================
   * 각 상권별 점수 계산
   * =====================================================
   */
  const scoredResults =
    results.map(
      item => {
        const floatingPopulationScore =
          normalize(
            item.floatingPopulation,
            minFloating,
            maxFloating,
          );

        const livingPopulationScore =
          normalize(
            item.livingPopulation,
            minLiving,
            maxLiving,
          );

        const salesScore =
          normalize(
            item.salesAmount,
            minSales,
            maxSales,
          );

        const averageSalesScore =
          normalize(
            item.averageSalesPerStore,
            minAverageSales,
            maxAverageSales,
          );

        const competitionScore =
          normalizeReverse(
            item.competitionDensity,
            minCompetition,
            maxCompetition,
          );

        const livingPopulationChangeScore =
          normalize(
            item.livingPopulationChangeRate,
            minLivingChange,
            maxLivingChange,
          );

        const floatingPopulationChangeScore =
          normalize(
            item.floatingPopulationChangeRate,
            minFloatingChange,
            maxFloatingChange,
          );

        const accessibilityScore =
          normalize(
            item.busStopCount,
            minBusStop,
            maxBusStop,
          );

        /**
         * =====================================================
         * 최종 적합도 가중치
         * =====================================================
         *
         * 유동인구             18%
         * 카드소비             14%
         * 점포당 평균매출      18%
         * 경쟁도               14%
         * 생활인구              9%
         * 생활인구 증감률       9%
         * 유동인구 증감률       9%
         * 접근성                9%
         *
         * 총 100%
         */
        const suitabilityScore =
          floatingPopulationScore *
            0.18 +
          salesScore *
            0.14 +
          averageSalesScore *
            0.18 +
          competitionScore *
            0.14 +
          livingPopulationScore *
            0.09 +
          livingPopulationChangeScore *
            0.09 +
          floatingPopulationChangeScore *
            0.09 +
          accessibilityScore *
            0.09;

        return {
          ...item,

          floatingPopulationScore:
            Number(
              floatingPopulationScore.toFixed(
                1,
              ),
            ),

          salesScore:
            Number(
              salesScore.toFixed(
                1,
              ),
            ),

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

          livingPopulationScore:
            Number(
              livingPopulationScore.toFixed(
                1,
              ),
            ),

          livingPopulationChangeScore:
            Number(
              livingPopulationChangeScore.toFixed(
                1,
              ),
            ),

          floatingPopulationChangeScore:
            Number(
              floatingPopulationChangeScore.toFixed(
                1,
              ),
            ),

          accessibilityScore:
            Number(
              accessibilityScore.toFixed(
                1,
              ),
            ),

          suitabilityScore:
            Number(
              suitabilityScore.toFixed(
                1,
              ),
            ),
        };
      },
    );

  /**
   * 적합도 높은 순으로 정렬
   */
  scoredResults.sort(
    (a, b) =>
      b.suitabilityScore -
      a.suitabilityScore,
  );

  return scoredResults;
}