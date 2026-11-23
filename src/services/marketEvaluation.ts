/** 화면 배지, 점수 계산, AI 요청이 함께 사용하는 실제 앱 평가 규칙입니다. */
export const EVALUATION_VERSION = 'market-evaluation-v1';
export const SUITABILITY_RULES = [
  { key: 'floatingPopulation', scoreKey: 'floatingPopulationScore', title: '유동인구', weight: 0.18, reverse: false },
  { key: 'salesAmount', scoreKey: 'salesScore', title: '전체 카드소비', weight: 0.14, reverse: false },
  { key: 'averageSalesPerStore', scoreKey: 'averageSalesScore', title: '점포당 카드소비', weight: 0.18, reverse: false },
  { key: 'competitionDensity', scoreKey: 'competitionScore', title: '경쟁 수준', weight: 0.14, reverse: true },
  { key: 'livingPopulation', scoreKey: 'livingPopulationScore', title: '생활인구', weight: 0.09, reverse: false },
  { key: 'livingPopulationChangeRate', scoreKey: 'livingPopulationChangeScore', title: '생활인구 증감률', weight: 0.09, reverse: false },
  { key: 'floatingPopulationChangeRate', scoreKey: 'floatingPopulationChangeScore', title: '유동인구 증감률', weight: 0.09, reverse: false },
  { key: 'busStopCount', scoreKey: 'accessibilityScore', title: '버스정류장 접근성', weight: 0.09, reverse: false },
] as const;
export const BUSINESS_RULES = [
  { key: 'averageSalesPerStore', scoreKey: 'averageSalesScore', title: '점포당 카드소비', weight: 0.40, reverse: false },
  { key: 'competitionDensity', scoreKey: 'competitionScore', title: '경쟁 수준', weight: 0.35, reverse: true },
  { key: 'salesAmount', scoreKey: 'salesScore', title: '전체 카드소비', weight: 0.25, reverse: false },
] as const;
export const SUITABILITY_WEIGHTS = Object.fromEntries(SUITABILITY_RULES.map(rule => [rule.scoreKey, rule.weight])) as Record<typeof SUITABILITY_RULES[number]['scoreKey'], number>;
export const BUSINESS_WEIGHTS = Object.fromEntries(BUSINESS_RULES.map(rule => [rule.scoreKey, rule.weight])) as Record<typeof BUSINESS_RULES[number]['scoreKey'], number>;
export function normalizeMetric(value: number, min: number, max: number, reverse = false): number {
  // 기존 점수 계산의 동일값 처리(100점)를 유지합니다.
  if (max === min) return 100;
  return (reverse ? (max - value) / (max - min) : (value - min) / (max - min)) * 100;
}
export function getLevelLabel(score: number): string {
  if (!Number.isFinite(score)) return '평가 불가';
  if (score >= 75) return '매우 높음';
  if (score >= 50) return '높음';
  if (score >= 25) return '보통';
  return '낮음';
}
export function getCompetitionLabel(score: number): string {
  if (!Number.isFinite(score)) return '경쟁 평가 불가';
  if (score >= 75) return '경쟁 여유';
  if (score >= 50) return '경쟁 보통';
  if (score >= 25) return '경쟁 있음';
  return '경쟁 치열';
}
export type MetricEvaluation = {
  key: string; title: string; rawValue: number | null; normalizedScore: number | null;
  unroundedScore: number | null; weightedContribution: number | null;
  min: number | null; max: number | null; weight: number;
  direction: 'higher-is-better' | 'lower-is-better'; label: string;
  comparable: boolean; unit: string;
};
export type MarketEvaluation = {
  version: string; mode: 'suitability' | 'business-recommendation';
  comparisonScope: string; comparisonCount: number; comparisonTargets: string[];
  normalization: string; equalValuePolicy: string; thresholds: { min: number; general: string; competition: string }[];
  scoreFormula: string; totalScore: number | null; metrics: MetricEvaluation[];
  scope: { analysisType: string; areaName: string; dongName: string; radius: number | null; note: string };
  notes: string[];
};
const numberValue = (value: unknown): number | null =>
  typeof value === 'number' && Number.isFinite(value) ? value : null;
function record(value: object): Record<string, unknown> { return value as Record<string, unknown>; }
export function buildMarketEvaluation(
  item: object, comparedItems: object[], mode: MarketEvaluation['mode'],
): MarketEvaluation {
  const row = record(item);
  const rules = mode === 'suitability' ? SUITABILITY_RULES : BUSINESS_RULES;
  const targets = comparedItems.map(value => {
    const data = record(value);
    return mode === 'suitability' ? String(data.areaName ?? '') : String(data.businessName ?? '');
  });
  const point = row.analysisType === 'point';
  const metrics: MetricEvaluation[] = rules.map(rule => {
    const values = comparedItems.map(value => numberValue(record(value)[rule.key]));
    const validGroup = values.length > 0 && values.every(value => value !== null);
    const min = validGroup ? Math.min(...values as number[]) : null;
    const max = validGroup ? Math.max(...values as number[]) : null;
    const rawValue = numberValue(row[rule.key]);
    const score = numberValue(row[rule.scoreKey]);
    const comparable = min !== null && max !== null && max !== min && comparedItems.length > 1;
    const unroundedScore = rawValue !== null && min !== null && max !== null
      ? normalizeMetric(rawValue, min, max, rule.reverse) : null;
    const unit = rule.key === 'competitionDensity'
      ? point ? '반경 내 동일 업종 점포/km²' : '유동인구 1,000명당 동일 업종 점포 수'
      : rule.key.includes('ChangeRate') ? '%' : rule.key.includes('Population') ? '명'
      : rule.key === 'busStopCount' ? '개' : '원';
    return {
      key: rule.key, title: rule.title, rawValue, normalizedScore: score,
      unroundedScore, weightedContribution: unroundedScore === null ? null : unroundedScore * rule.weight,
      min, max, weight: rule.weight,
      direction: rule.reverse ? 'lower-is-better' : 'higher-is-better',
      label: score === null || rawValue === null || !validGroup ? '평가 불가'
        : !comparable ? '비교 차이 없음'
        : rule.reverse ? getCompetitionLabel(score) : getLevelLabel(score),
      comparable, unit,
    };
  });
  return {
    version: EVALUATION_VERSION, mode,
    comparisonScope: mode === 'suitability'
      ? '이번 분석에서 데이터 조회에 성공한 선택 지역 간 상대 비교'
      : '이번 지역에서 데이터 조회에 성공한 후보 업종 간 상대 비교',
    comparisonCount: comparedItems.length, comparisonTargets: targets,
    normalization: '일반=(값-최솟값)/(최댓값-최솟값)×100; 경쟁=(최댓값-값)/(최댓값-최솟값)×100',
    equalValuePolicy: '최댓값=최솟값이면 기존 계산대로 100점. 단일 후보/모두 같은 값은 우수함의 근거로 쓰지 않고 비교 차이 없음으로 표시.',
    thresholds: [
      { min: 75, general: '매우 높음', competition: '경쟁 여유' },
      { min: 50, general: '높음', competition: '경쟁 보통' },
      { min: 25, general: '보통', competition: '경쟁 있음' },
      { min: 0, general: '낮음', competition: '경쟁 치열' },
    ],
    scoreFormula: rules.map(rule => `${rule.title} 정규화점수×${rule.weight}`).join(' + '),
    totalScore: numberValue(row[mode === 'suitability' ? 'suitabilityScore' : 'recommendationScore']),
    metrics,
    scope: {
      analysisType: point ? 'point' : 'area', areaName: String(row.areaName ?? ''),
      dongName: String(row.dongName ?? row.areaName ?? ''), radius: numberValue(row.radius),
      note: point
        ? '점포 수/경쟁밀도는 반경 기준. 인구·카드소비·접근성은 행정동 참고 데이터. 반경 매출로 해석하지 않음.'
        : '행정동 단위 데이터. 다른 지역·기간까지 일반화하지 않음.',
    },
    notes: [
      '낮음/높음은 이번 비교 집합 안의 상대 평가이며 절대적인 인구 많음/적음 판정이 아님.',
      '증감률의 부호는 실제 증가·감소 방향이며 정규화 점수가 높아도 음수이면 감소한 것임.',
      '카드소비와 점포당 카드소비는 실제 개별 점포 매출·순이익이 아님. 단일 시점만으로 안정성·지속성을 판단하지 않음.',
      mode === 'business-recommendation'
        ? '유동인구·생활인구·접근성은 참고 지표이며 현재 업종 추천 순위 가중치에 포함되지 않음.'
        : '가중치는 현재 commercialAnalysis.ts 구현 기준이며 별도의 논문 가중치와 혼용하지 않음.',
      'UI 점수는 소수 첫째 자리 반올림. 최종 점수는 반올림 전 지표 점수의 가중합을 마지막에 반올림.',
    ],
  };
}
export function getMetricLabel(evaluation: MarketEvaluation | undefined, key: string): string | undefined {
  return evaluation?.metrics.find(metric => metric.key === key)?.label;
}
