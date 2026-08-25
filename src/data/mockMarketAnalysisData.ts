export type Industry = '카페' | '음식점' | '베이커리' | '편의점';
export type Region = '성수동' | '건대입구' | '왕십리';
export type CompetitionLevel = '낮음' | '보통' | '높음';

export interface MarketAnalysisResult {
  industry: Industry;
  region: Region;
  floatingPopulation: string; // 유동인구
  competitorCount: number; // 경쟁업체 수
  estimatedRevenue: string; // 추정매출
  mainAgeGroup: string; // 주요 연령층
  competitionLevel: CompetitionLevel; // 경쟁도
  suitabilityScore: number; // 적합도 점수 (0~100)
  recommendationReasons: string[]; // 추천 이유
}

export interface IndustryRegionCombo {
  industry: Industry;
  region: Region;
}

/**
 * key 형식: "업종-지역" 예) "카페-성수동"
 * 백엔드 연동 전까지 사용할 더미(mock) 데이터입니다.
 */
const mockMarketAnalysisData: Record<string, MarketAnalysisResult> = {
  '카페-성수동': {
    industry: '카페',
    region: '성수동',
    floatingPopulation: '평일 일 평균 48,200명',
    competitorCount: 132,
    estimatedRevenue: '월 평균 3,400만원',
    mainAgeGroup: '20~30대 (61%)',
    competitionLevel: '높음',
    suitabilityScore: 82,
    recommendationReasons: [
      '20~30대 유동인구 비중이 매우 높아 카페 수요가 꾸준함',
      '개성 있는 컨셉의 카페가 특히 잘 되는 상권 특성',
      '주말 방문객 수가 평일 대비 1.4배 증가하는 트렌디한 상권',
    ],
  },
  '음식점-성수동': {
    industry: '음식점',
    region: '성수동',
    floatingPopulation: '평일 일 평균 46,500명',
    competitorCount: 98,
    estimatedRevenue: '월 평균 4,100만원',
    mainAgeGroup: '20~40대 (55%)',
    competitionLevel: '보통',
    suitabilityScore: 76,
    recommendationReasons: [
      '직장인과 방문객이 섞여 있어 점심·저녁 수요가 모두 안정적',
      '카페 상권 대비 음식점 경쟁 밀도는 상대적으로 낮은 편',
    ],
  },
  '베이커리-성수동': {
    industry: '베이커리',
    region: '성수동',
    floatingPopulation: '평일 일 평균 45,000명',
    competitorCount: 41,
    estimatedRevenue: '월 평균 2,600만원',
    mainAgeGroup: '20~30대 (58%)',
    competitionLevel: '보통',
    suitabilityScore: 79,
    recommendationReasons: [
      'SNS 노출에 민감한 20~30대 비중이 높아 비주얼 특화 베이커리에 유리',
      '경쟁업체 수 대비 유동인구가 충분히 많은 편',
    ],
  },
  '편의점-성수동': {
    industry: '편의점',
    region: '성수동',
    floatingPopulation: '평일 일 평균 47,000명',
    competitorCount: 27,
    estimatedRevenue: '월 평균 2,200만원',
    mainAgeGroup: '20~40대 (50%)',
    competitionLevel: '낮음',
    suitabilityScore: 71,
    recommendationReasons: [
      '유동인구 대비 편의점 수가 적어 상대적으로 경쟁 부담이 낮음',
      '야간 유동인구도 꾸준해 24시간 운영에 유리',
    ],
  },
  '카페-건대입구': {
    industry: '카페',
    region: '건대입구',
    floatingPopulation: '평일 일 평균 52,000명',
    competitorCount: 145,
    estimatedRevenue: '월 평균 3,100만원',
    mainAgeGroup: '20대 (68%)',
    competitionLevel: '높음',
    suitabilityScore: 74,
    recommendationReasons: [
      '대학가 특성상 20대 집중도가 매우 높음',
      '경쟁이 치열해 가격 경쟁력이나 차별화 포인트가 필요한 상권',
    ],
  },
  '음식점-건대입구': {
    industry: '음식점',
    region: '건대입구',
    floatingPopulation: '평일 일 평균 55,300명',
    competitorCount: 210,
    estimatedRevenue: '월 평균 4,600만원',
    mainAgeGroup: '20대 (63%)',
    competitionLevel: '높음',
    suitabilityScore: 80,
    recommendationReasons: [
      '유동인구가 가장 많은 지역 중 하나로 저녁 상권이 특히 강함',
      '경쟁은 치열하지만 그만큼 전체 수요 자체가 커서 매출 잠재력이 높음',
    ],
  },
  '베이커리-건대입구': {
    industry: '베이커리',
    region: '건대입구',
    floatingPopulation: '평일 일 평균 50,100명',
    competitorCount: 55,
    estimatedRevenue: '월 평균 2,400만원',
    mainAgeGroup: '20대 (57%)',
    competitionLevel: '보통',
    suitabilityScore: 73,
    recommendationReasons: [
      '대학가 특성상 가성비 있는 디저트류 수요가 꾸준함',
      '카페·음식점 대비 베이커리 경쟁 밀도는 낮은 편',
    ],
  },
  '편의점-건대입구': {
    industry: '편의점',
    region: '건대입구',
    floatingPopulation: '평일 일 평균 53,800명',
    competitorCount: 33,
    estimatedRevenue: '월 평균 2,500만원',
    mainAgeGroup: '20대 (52%)',
    competitionLevel: '보통',
    suitabilityScore: 75,
    recommendationReasons: [
      '심야 시간대 유동인구가 많아 야간 매출 비중이 높음',
      '1인 가구 및 자취생 수요가 꾸준한 상권',
    ],
  },
  '카페-왕십리': {
    industry: '카페',
    region: '왕십리',
    floatingPopulation: '평일 일 평균 31,200명',
    competitorCount: 58,
    estimatedRevenue: '월 평균 2,300만원',
    mainAgeGroup: '20~30대 (47%)',
    competitionLevel: '보통',
    suitabilityScore: 68,
    recommendationReasons: [
      '경쟁 밀도가 낮아 신규 진입 부담이 상대적으로 적음',
      '주거 인구 비중이 높아 안정적인 단골 확보에 유리',
    ],
  },
  '음식점-왕십리': {
    industry: '음식점',
    region: '왕십리',
    floatingPopulation: '평일 일 평균 33,000명',
    competitorCount: 76,
    estimatedRevenue: '월 평균 2,900만원',
    mainAgeGroup: '20~40대 (45%)',
    competitionLevel: '보통',
    suitabilityScore: 70,
    recommendationReasons: [
      '주거·직장 인구가 고르게 분포되어 있어 수요가 안정적',
      '한양대 인근 학생 수요도 함께 기대할 수 있음',
    ],
  },
  '베이커리-왕십리': {
    industry: '베이커리',
    region: '왕십리',
    floatingPopulation: '평일 일 평균 30,500명',
    competitorCount: 22,
    estimatedRevenue: '월 평균 1,800만원',
    mainAgeGroup: '전 연령대 고른 분포',
    competitionLevel: '낮음',
    suitabilityScore: 66,
    recommendationReasons: [
      '경쟁업체 수가 적어 상권 선점 효과를 기대할 수 있음',
      '다만 유동인구 자체가 크지 않아 초기 매출은 완만하게 증가하는 편',
    ],
  },
  '편의점-왕십리': {
    industry: '편의점',
    region: '왕십리',
    floatingPopulation: '평일 일 평균 34,100명',
    competitorCount: 19,
    estimatedRevenue: '월 평균 2,000만원',
    mainAgeGroup: '20~30대 (49%)',
    competitionLevel: '낮음',
    suitabilityScore: 72,
    recommendationReasons: [
      '주거 밀집 지역으로 생활 필수 소비가 꾸준함',
      '경쟁업체 수가 적어 상대적으로 안정적인 운영이 가능',
    ],
  },
};

export const ALL_INDUSTRIES: Industry[] = ['카페', '음식점', '베이커리', '편의점'];
export const ALL_REGIONS: Region[] = ['성수동', '건대입구', '왕십리'];

/**
 * 업종 + 지역 조합으로 분석 결과 하나를 조회합니다.
 * ("업종+입지 적합성 분석" 등 단일 조합 조회에 사용)
 */
export function getMarketAnalysisResult(
  industry: Industry,
  region: Region,
): MarketAnalysisResult {
  const key = `${industry}-${region}`;
  const found = mockMarketAnalysisData[key];

  if (found) {
    return found;
  }

  return {
    industry,
    region,
    floatingPopulation: '데이터 준비 중',
    competitorCount: 0,
    estimatedRevenue: '데이터 준비 중',
    mainAgeGroup: '데이터 준비 중',
    competitionLevel: '보통',
    suitabilityScore: 0,
    recommendationReasons: ['아직 분석 데이터가 준비되지 않은 조합입니다.'],
  };
}

/**
 * 여러 개의 (업종, 지역) 조합을 한 번에 받아서, 적합도 점수 높은 순으로 정렬해 반환합니다.
 *
 * 사용 예:
 * - "업종 기반 입지 추천"에서 사용자가 지역을 여러 개 선택한 경우:
 *   업종은 고정, 지역만 여러 개 → combos = 선택한 지역들.map(region => ({industry, region}))
 * - "보유 장소 기반 업종 추천"에서 사용자가 보유 장소를 여러 개 선택한 경우:
 *   모든 업종 × 선택한 지역들의 전체 조합 → combos = 선택한 지역들.flatMap(region => 모든 업종.map(industry => ({industry, region})))
 */
export function getRankedResults(
  combos: IndustryRegionCombo[],
): MarketAnalysisResult[] {
  return combos
    .map(combo => getMarketAnalysisResult(combo.industry, combo.region))
    .sort((a, b) => b.suitabilityScore - a.suitabilityScore);
}