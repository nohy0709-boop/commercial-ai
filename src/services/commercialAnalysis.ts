import {
  getAccessibilityByArea,
} from '../data/accessibilityData';

import {
  getPopulationByArea,
} from '../data/populationData';

import {
  getSalesByAreaAndBusiness,
} from '../data/salesData';

import {
  getStoreCount,
  getStoreCountInRadius,
} from './storeApi';

/**
 * =====================================================
 * 공통 상권 분석 결과
 * =====================================================
 */
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

/**
 * =====================================================
 * 좌표 기반 상권 분석 결과
 * =====================================================
 *
 * 점포 수 / 경쟁밀도
 * → 실제 반경 기준
 *
 * 인구 / 매출 / 접근성
 * → 현재는 행정동 기준 참고 데이터
 */
export type PointCommercialAnalysisResult =
  CommercialAnalysisResult & {
    /**
     * 실제 행정동 이름
     */
    dongName: string;

    /**
     * 사용자 선택 좌표
     */
    latitude: number;

    longitude: number;

    /**
     * 분석 반경
     */
    radius: number;

    /**
     * 분석 반경 면적
     * 단위: km²
     */
    radiusAreaKm2: number;

    /**
     * 분석 타입
     */
    analysisType: 'point';

    /**
     * 반경 안 실제 동일 업종 점포 수
     */
    radiusStoreCount: number;

    /**
     * 현재 인구 / 매출 / 접근성은
     * 행정동 단위 데이터를 참고한다는 표시
     */
    contextLevel: 'dong';
  };

/**
 * =====================================================
 * 적합도 점수가 포함된 결과
 * =====================================================
 */
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
 *
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
   * 카드소비 데이터
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
   * =====================================================
   * 경쟁밀도
   * =====================================================
   *
   * 유동인구 1000명당 동일 업종 점포 수
   *
   * 동 전체 분석에서는 기존 방식 유지
   */
  const competitionDensity =
    population.floatingPopulation >
    0
      ? (
          storeResult.storeCount /
          population.floatingPopulation
        ) * 1000
      : 0;

  /**
   * =====================================================
   * 점포당 평균 카드소비
   * =====================================================
   */
  const averageSalesPerStore =
    storeResult.storeCount >
    0
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
 * 핵심:
 *
 * 사용자가 선택한 정확한 위치를 기준으로
 * 반경 안 실제 점포 수를 구한다.
 *
 * 점포 수 / 경쟁밀도
 * → 실제 좌표 기반
 *
 * 생활인구 / 유동인구 / 카드소비 / 버스정류장
 * → 현재는 행정동 데이터를 참고값으로 사용
 *
 *
 * 이후 격자 데이터가 연결되면
 * 인구 / 매출 / 접근성도 좌표 기반으로 교체 가능
 */
export async function analyzeCommercialPoint(
  /**
   * 화면 표시용 이름
   *
   * 예:
   *
   * 정부세종청사
   * 나성동 주민센터
   * 현재 위치
   */
  label: string,

  /**
   * 실제 데이터 조회용 행정동
   */
  dongName: string,

  /**
   * 행정동 코드
   */
  adongCode: string,

  /**
   * 정확한 사용자 위치
   */
  latitude: number,

  longitude: number,

  /**
   * 분석 반경
   *
   * 예:
   *
   * 300
   * 500
   * 1000
   */
  radius: number,

  /**
   * 업종
   */
  businessName: string,

  /**
   * 업종 코드
   */
  lclsCode: string,

  mclsCode?: string,

  sclsCode?: string,
): Promise<PointCommercialAnalysisResult> {
  /**
   * =====================================================
   * 1. 반경 안 실제 동일 업종 점포 수
   * =====================================================
   *
   * storeApi.ts에서
   *
   * 동 전체 점포 좌표 조회
   * →
   * 사용자 위치와 거리 계산
   * →
   * radius 이하 점포만 필터링
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
   * 2. 행정동 전체 동일 업종 점포 수
   * =====================================================
   *
   * 점포당 평균 카드소비 계산에 사용
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
   * 3. 행정동 인구 데이터
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
   * 4. 행정동 접근성 데이터
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
   * 5. 행정동 카드소비 데이터
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
   * 6. 반경 면적 계산
   * =====================================================
   *
   * radius:
   * meter
   *
   * km로 변환 후
   * 원의 넓이 πr² 계산
   *
   *
   * 반경 500m 예시:
   *
   * 0.5km
   *
   * π × 0.5²
   *
   * 약 0.785km²
   */
  const radiusKm =
    radius /
    1000;

  const radiusAreaKm2 =
    Math.PI *
    radiusKm *
    radiusKm;

  /**
   * =====================================================
   * 7. 세부 위치 경쟁밀도
   * =====================================================
   *
   * 이전 방식:
   *
   * 반경 점포수
   * ÷
   * 점포비율로 추정한 유동인구
   *
   *
   * 문제:
   *
   * 유동인구도 점포 수 비율로 줄였기 때문에
   * 반경 점포수가 사실상 약분될 수 있었음.
   *
   *
   * 현재 방식:
   *
   * 반경 안 실제 동일 업종 점포 수
   * ÷
   * 반경 면적(km²)
   *
   *
   * 즉:
   *
   * 1km²당 동일 업종 점포 수
   */
  const competitionDensity =
    radiusAreaKm2 >
    0
      ? radiusStoreCount /
        radiusAreaKm2
      : 0;

  /**
   * =====================================================
   * 8. 점포당 평균 카드소비
   * =====================================================
   *
   * 아직 반경 단위 실제 카드소비 데이터가 없음.
   *
   * 따라서 행정동 전체 업종 카드소비를
   * 행정동 전체 점포 수로 나눠서
   * 업종 평균값으로 사용.
   *
   *
   * 억지로 반경 점포 비율을 이용해서
   * 매출을 추정하지 않음.
   */
  const averageSalesPerStore =
    dongStoreResult.storeCount >
    0
      ? sales.salesAmount /
        dongStoreResult.storeCount
      : 0;

  /**
   * =====================================================
   * 9. 결과 반환
   * =====================================================
   */
  return {
    /**
     * 화면 표시용 위치
     */
    areaName:
      label,

    /**
     * 행정동 이름
     */
    dongName,

    /**
     * 정확한 분석 좌표
     */
    latitude,

    longitude,

    /**
     * 분석 반경
     */
    radius,

    /**
     * 반경 면적
     */
    radiusAreaKm2,

    /**
     * 좌표 기반 분석 표시
     */
    analysisType:
      'point',

    /**
     * 인구 / 매출 / 접근성 데이터는
     * 아직 행정동 참고 데이터임
     */
    contextLevel:
      'dong',

    /**
     * =================================================
     * 실제 세부 위치 데이터
     * =================================================
     */

    /**
     * 반경 내 실제 동일 업종 점포 수
     */
    storeCount:
      radiusStoreCount,

    radiusStoreCount,

    /**
     * 실제 반경 기반 경쟁밀도
     *
     * 단위:
     * 점포 / km²
     */
    competitionDensity,

    /**
     * =================================================
     * 행정동 참고 데이터
     * =================================================
     */

    livingPopulation:
      population.livingPopulation,

    floatingPopulation:
      population.floatingPopulation,

    livingPopulationChangeRate:
      population.livingPopulationChangeRate,

    floatingPopulationChangeRate:
      population.floatingPopulationChangeRate,

    /**
     * 현재는 행정동 전체 업종 카드소비
     */
    salesAmount:
      sales.salesAmount,

    /**
     * 현재는 행정동 업종 평균
     */
    averageSalesPerStore,

    /**
     * 현재는 행정동 전체 버스정류장 수
     */
    busStopCount:
      accessibility.busStopCount,
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
  if (
    max === min
  ) {
    return 100;
  }

  return (
    (
      value -
      min
    ) /
    (
      max -
      min
    )
  ) *
    100;
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
  if (
    max === min
  ) {
    return 100;
  }

  return (
    (
      max -
      value
    ) /
    (
      max -
      min
    )
  ) *
    100;
}

/**
 * =====================================================
 * 상권 적합도 점수 계산
 * =====================================================
 *
 * 여러 지역의 상권을 비교하는 용도
 */
export function calculateSuitabilityScores(
  results:
    CommercialAnalysisResult[],
): ScoredCommercialAnalysisResult[] {
  if (
    results.length ===
    0
  ) {
    return [];
  }

  /**
   * =====================================================
   * 비교 대상 데이터 배열
   * =====================================================
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
   * 최소값 / 최대값
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
   * 상권별 점수 계산
   * =====================================================
   */
  const scoredResults =
    results.map(
      item => {
        /**
         * 유동인구 점수
         */
        const floatingPopulationScore =
          normalize(
            item.floatingPopulation,

            minFloating,

            maxFloating,
          );

        /**
         * 생활인구 점수
         */
        const livingPopulationScore =
          normalize(
            item.livingPopulation,

            minLiving,

            maxLiving,
          );

        /**
         * 카드소비 점수
         */
        const salesScore =
          normalize(
            item.salesAmount,

            minSales,

            maxSales,
          );

        /**
         * 점포당 소비 점수
         */
        const averageSalesScore =
          normalize(
            item.averageSalesPerStore,

            minAverageSales,

            maxAverageSales,
          );

        /**
         * 경쟁도 점수
         *
         * 경쟁밀도가 낮을수록 높은 점수
         */
        const competitionScore =
          normalizeReverse(
            item.competitionDensity,

            minCompetition,

            maxCompetition,
          );

        /**
         * 생활인구 증감 점수
         */
        const livingPopulationChangeScore =
          normalize(
            item.livingPopulationChangeRate,

            minLivingChange,

            maxLivingChange,
          );

        /**
         * 유동인구 증감 점수
         */
        const floatingPopulationChangeScore =
          normalize(
            item.floatingPopulationChangeRate,

            minFloatingChange,

            maxFloatingChange,
          );

        /**
         * 접근성 점수
         */
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
         * 점포당 평균소비      18%
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
    (
      a,
      b,
    ) =>
      b.suitabilityScore -
      a.suitabilityScore,
  );

  return scoredResults;
}