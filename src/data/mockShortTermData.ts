export type OperatingField = '푸드트럭' | '팝업스토어' | '플리마켓 셀러' | '버스킹/공연';
export type EventName =
  | '성수 리버사이드 페스티벌'
  | '건대 청춘 프리마켓'
  | '왕십리 로컬푸드 마켓';
export type ShortTermCompetitionLevel = '낮음' | '보통' | '높음';

export interface ShortTermResult {
  field: OperatingField;
  eventName: EventName;
  eventRegion: string; // 행사가 열리는 지역
  eventPeriod: string; // 운영 기간
  expectedFootfall: string; // 예상 유동인구
  competitorBoothCount: number; // 예상 경쟁 부스/팀 수
  estimatedRevenue: string; // 부스(또는 회차)당 예상 수익
  mainVisitorAgeGroup: string; // 주요 방문객 연령층
  competitionLevel: ShortTermCompetitionLevel;
  suitabilityScore: number; // 0~100
  recommendationReasons: string[];
}

export interface ShortTermCombo {
  field: OperatingField;
  eventName: EventName;
}

/**
 * key 형식: "운영분야-행사명"
 * 장기 상권 분석 데이터(mockMarketAnalysisData.ts)와는 완전히 분리된 별도 mock 데이터입니다.
 */
const mockShortTermData: Record<string, ShortTermResult> = {
  '푸드트럭-성수 리버사이드 페스티벌': {
    field: '푸드트럭',
    eventName: '성수 리버사이드 페스티벌',
    eventRegion: '성수동',
    eventPeriod: '9월 5일~9월 7일 (3일간)',
    expectedFootfall: '일 평균 15,000명',
    competitorBoothCount: 22,
    estimatedRevenue: '부스당 일 평균 180만원',
    mainVisitorAgeGroup: '20~30대 (58%)',
    competitionLevel: '높음',
    suitabilityScore: 85,
    recommendationReasons: [
      '페스티벌 특성상 야외 취식 수요가 매우 높음',
      '성수동 특유의 트렌디한 방문객층과 궁합이 좋음',
    ],
  },
  '팝업스토어-성수 리버사이드 페스티벌': {
    field: '팝업스토어',
    eventName: '성수 리버사이드 페스티벌',
    eventRegion: '성수동',
    eventPeriod: '9월 5일~9월 7일 (3일간)',
    expectedFootfall: '일 평균 15,000명',
    competitorBoothCount: 15,
    estimatedRevenue: '부스당 일 평균 220만원',
    mainVisitorAgeGroup: '20~30대 (58%)',
    competitionLevel: '보통',
    suitabilityScore: 88,
    recommendationReasons: [
      '브랜드 팝업스토어 성지로 알려진 성수동 특성과 시너지',
      'SNS 인증샷 수요가 높은 방문객층',
    ],
  },
  '플리마켓 셀러-성수 리버사이드 페스티벌': {
    field: '플리마켓 셀러',
    eventName: '성수 리버사이드 페스티벌',
    eventRegion: '성수동',
    eventPeriod: '9월 5일~9월 7일 (3일간)',
    expectedFootfall: '일 평균 15,000명',
    competitorBoothCount: 30,
    estimatedRevenue: '부스당 일 평균 90만원',
    mainVisitorAgeGroup: '20~30대 (58%)',
    competitionLevel: '높음',
    suitabilityScore: 74,
    recommendationReasons: [
      '핸드메이드·소품 판매에 관심 많은 방문객 비중이 높음',
      '부스 수가 많은 편이라 경쟁이 있음',
    ],
  },
  '버스킹/공연-성수 리버사이드 페스티벌': {
    field: '버스킹/공연',
    eventName: '성수 리버사이드 페스티벌',
    eventRegion: '성수동',
    eventPeriod: '9월 5일~9월 7일 (3일간)',
    expectedFootfall: '일 평균 15,000명',
    competitorBoothCount: 8,
    estimatedRevenue: '회당 평균 후원·굿즈 수익 70만원',
    mainVisitorAgeGroup: '20~30대 (58%)',
    competitionLevel: '보통',
    suitabilityScore: 80,
    recommendationReasons: [
      '메인 무대 외 버스킹 공간 수요가 있음',
      '축제 분위기상 관객 호응도가 높은 편',
    ],
  },
  '푸드트럭-건대 청춘 프리마켓': {
    field: '푸드트럭',
    eventName: '건대 청춘 프리마켓',
    eventRegion: '건대입구',
    eventPeriod: '매주 토요일 상시 운영',
    expectedFootfall: '토요일 평균 8,000명',
    competitorBoothCount: 12,
    estimatedRevenue: '부스당 평균 110만원',
    mainVisitorAgeGroup: '20대 (65%)',
    competitionLevel: '보통',
    suitabilityScore: 76,
    recommendationReasons: [
      '대학가 특성상 저녁 시간대 방문객이 몰림',
      '가성비 위주 메뉴에 대한 선호도가 높음',
    ],
  },
  '팝업스토어-건대 청춘 프리마켓': {
    field: '팝업스토어',
    eventName: '건대 청춘 프리마켓',
    eventRegion: '건대입구',
    eventPeriod: '매주 토요일 상시 운영',
    expectedFootfall: '토요일 평균 8,000명',
    competitorBoothCount: 10,
    estimatedRevenue: '부스당 평균 95만원',
    mainVisitorAgeGroup: '20대 (65%)',
    competitionLevel: '보통',
    suitabilityScore: 72,
    recommendationReasons: ['20대 방문객 비중이 높아 트렌드 아이템에 반응이 좋음'],
  },
  '플리마켓 셀러-건대 청춘 프리마켓': {
    field: '플리마켓 셀러',
    eventName: '건대 청춘 프리마켓',
    eventRegion: '건대입구',
    eventPeriod: '매주 토요일 상시 운영',
    expectedFootfall: '토요일 평균 8,000명',
    competitorBoothCount: 35,
    estimatedRevenue: '부스당 평균 60만원',
    mainVisitorAgeGroup: '20대 (65%)',
    competitionLevel: '높음',
    suitabilityScore: 81,
    recommendationReasons: [
      '프리마켓 자체가 메인 컨셉이라 방문 목적과 셀러 수요가 일치',
      '경쟁은 있지만 방문객 대부분이 구매 목적으로 방문',
    ],
  },
  '버스킹/공연-건대 청춘 프리마켓': {
    field: '버스킹/공연',
    eventName: '건대 청춘 프리마켓',
    eventRegion: '건대입구',
    eventPeriod: '매주 토요일 상시 운영',
    expectedFootfall: '토요일 평균 8,000명',
    competitorBoothCount: 6,
    estimatedRevenue: '회당 평균 후원·굿즈 수익 40만원',
    mainVisitorAgeGroup: '20대 (65%)',
    competitionLevel: '낮음',
    suitabilityScore: 70,
    recommendationReasons: ['프리마켓 분위기와 어울리는 소규모 공연 수요가 있음'],
  },
  '푸드트럭-왕십리 로컬푸드 마켓': {
    field: '푸드트럭',
    eventName: '왕십리 로컬푸드 마켓',
    eventRegion: '왕십리',
    eventPeriod: '10월 1일~10월 3일 (3일간)',
    expectedFootfall: '일 평균 5,000명',
    competitorBoothCount: 8,
    estimatedRevenue: '부스당 평균 70만원',
    mainVisitorAgeGroup: '30~50대 (52%)',
    competitionLevel: '낮음',
    suitabilityScore: 65,
    recommendationReasons: ['로컬푸드 컨셉과 다소 결이 다를 수 있어 메뉴 구성에 유의 필요'],
  },
  '팝업스토어-왕십리 로컬푸드 마켓': {
    field: '팝업스토어',
    eventName: '왕십리 로컬푸드 마켓',
    eventRegion: '왕십리',
    eventPeriod: '10월 1일~10월 3일 (3일간)',
    expectedFootfall: '일 평균 5,000명',
    competitorBoothCount: 6,
    estimatedRevenue: '부스당 평균 65만원',
    mainVisitorAgeGroup: '30~50대 (52%)',
    competitionLevel: '낮음',
    suitabilityScore: 62,
    recommendationReasons: ['방문객 연령대가 높은 편이라 트렌드성 아이템은 반응이 제한적일 수 있음'],
  },
  '플리마켓 셀러-왕십리 로컬푸드 마켓': {
    field: '플리마켓 셀러',
    eventName: '왕십리 로컬푸드 마켓',
    eventRegion: '왕십리',
    eventPeriod: '10월 1일~10월 3일 (3일간)',
    expectedFootfall: '일 평균 5,000명',
    competitorBoothCount: 18,
    estimatedRevenue: '부스당 평균 75만원',
    mainVisitorAgeGroup: '30~50대 (52%)',
    competitionLevel: '보통',
    suitabilityScore: 77,
    recommendationReasons: [
      '로컬푸드·농산물 마켓과 궁합이 좋은 소규모 셀러 수요',
      '가족 단위 방문객이 많아 구매 전환율이 높은 편',
    ],
  },
  '버스킹/공연-왕십리 로컬푸드 마켓': {
    field: '버스킹/공연',
    eventName: '왕십리 로컬푸드 마켓',
    eventRegion: '왕십리',
    eventPeriod: '10월 1일~10월 3일 (3일간)',
    expectedFootfall: '일 평균 5,000명',
    competitorBoothCount: 4,
    estimatedRevenue: '회당 평균 후원·굿즈 수익 25만원',
    mainVisitorAgeGroup: '30~50대 (52%)',
    competitionLevel: '낮음',
    suitabilityScore: 60,
    recommendationReasons: ['행사 규모가 작아 공연 수요는 제한적인 편'],
  },
};

export const ALL_FIELDS: OperatingField[] = [
  '푸드트럭',
  '팝업스토어',
  '플리마켓 셀러',
  '버스킹/공연',
];

export const ALL_EVENTS: EventName[] = [
  '성수 리버사이드 페스티벌',
  '건대 청춘 프리마켓',
  '왕십리 로컬푸드 마켓',
];

/**
 * 운영 분야 + 행사명 조합으로 결과 하나를 조회합니다.
 */
export function getShortTermResult(
  field: OperatingField,
  eventName: EventName,
): ShortTermResult {
  const key = `${field}-${eventName}`;
  const found = mockShortTermData[key];

  if (found) {
    return found;
  }

  return {
    field,
    eventName,
    eventRegion: '데이터 준비 중',
    eventPeriod: '데이터 준비 중',
    expectedFootfall: '데이터 준비 중',
    competitorBoothCount: 0,
    estimatedRevenue: '데이터 준비 중',
    mainVisitorAgeGroup: '데이터 준비 중',
    competitionLevel: '보통',
    suitabilityScore: 0,
    recommendationReasons: ['아직 분석 데이터가 준비되지 않은 조합입니다.'],
  };
}

/**
 * 여러 개의 (운영분야, 행사) 조합을 한 번에 받아서, 적합도 점수 높은 순으로 정렬해 반환합니다.
 */
export function getRankedShortTermResults(
  combos: ShortTermCombo[],
): ShortTermResult[] {
  return combos
    .map(combo => getShortTermResult(combo.field, combo.eventName))
    .sort((a, b) => b.suitabilityScore - a.suitabilityScore);
}