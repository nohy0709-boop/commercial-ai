import { supabase } from '@/lib/supabase';

import { getPopulationByArea } from '../data/populationData';
import type {
    MarketEvaluation,
    MetricEvaluation,
} from './marketEvaluation';
import {
    EVALUATION_VERSION,
    getCompetitionLabel,
    getLevelLabel,
    normalizeMetric,
} from './marketEvaluation';

/**
 * =====================================================
 * 학원 업종 (세부 업종 버튼과 DB 분류 이름이 같아야 합니다)
 * =====================================================
 *
 * Supabase academies.category 값과 글자가 똑같아야 합니다.
 * ("기타 학원"은 버튼이 없고 집계에서도 제외됩니다.)
 */
export const ACADEMY_CATEGORIES = [
  '입시·보습',
  '영어학원',
  '수학학원',
  '외국어학원',
  '음악학원',
  '미술학원',
  '체육·무용',
  '코딩·컴퓨터',
  '직업·자격증',
  '독서실',
] as const;

export type AcademyCategory =
  typeof ACADEMY_CATEGORIES[number];

export function isAcademyCategory(
  value: string,
): value is AcademyCategory {
  return (ACADEMY_CATEGORIES as readonly string[]).includes(
    value,
  );
}

/** 버튼 아래에 붙일 한 줄 도움말 */
export const ACADEMY_CATEGORY_HINTS: Record<
  AcademyCategory,
  string
> = {
  '입시·보습': '국영수 종합 · 교과 전반 · 입시 · 검정',
  영어학원: '영어 전문 학원',
  수학학원: '수학 · 주산 · 암산 전문 학원',
  외국어학원: '중국어 · 일본어 등 영어 외 외국어',
  음악학원: '피아노 · 실용음악 · 국악기 · 기타 악기',
  미술학원: '미술 · 디자인 · 공예',
  '체육·무용': '댄스 · 무용 등',
  '코딩·컴퓨터': '코딩 · 컴퓨터 · 정보',
  '직업·자격증': '직업기술 · 성인 대상 교육',
  독서실: '교육청에 등록된 독서실 기준',
};

/**
 * =====================================================
 * 학원 지표 가중치 (임시값)
 * =====================================================
 *
 * 논문의 8개 지표 가중치와는 별개로 학원 사례에만 쓰는 값입니다.
 * 팀 / 교수님과 상의해서 확정한 뒤 이 값만 바꾸면 됩니다.
 * 합계는 1이어야 합니다.
 */
export const ACADEMY_WEIGHTS = {
  /** 같은 업종 학원 경쟁 (생활인구 1,000명당 학원 수, 낮을수록 유리) */
  competition: 0.6,
  /** 학원가 밀집도 (앱이 지원하는 학원 전체 수, 높을수록 학원가) */
  cluster: 0.4,
  /**
   * 생활인구는 경쟁 지표의 분모로 이미 반영되므로
   * 점수에는 한 번 더 넣지 않고(0) 참고값으로만 보여줍니다.
   * (이중 반영 방지. 학령인구가 생기면 분모를 바꾸고
   *  이 값을 0.1 정도로 올려 규모 지표로 쓸 수 있습니다.)
   */
  livingPopulation: 0,
} as const;

/**
 * 경쟁 지표의 분모(수요 근사치).
 * 지금은 생활인구. 학령인구 데이터가 생기면 이 함수만 바꾸면 됩니다.
 */
function getDemandBase(population: {
  livingPopulation: number;
}): number {
  return population.livingPopulation;
}

/** 세종 전체 학원 수가 이 값보다 적은 업종은 "참고용"으로 안내합니다. */
const THIN_CATEGORY_LIMIT = 50;

/**
 * =====================================================
 * Supabase 집계 읽기
 * =====================================================
 *
 * academy_counts_by_dong_category 뷰:
 * 동 / 업종 / 개원 학원 수 (기타 학원은 이미 제외됨)
 */
export type AcademyCountTable = Map<
  string,
  Map<string, number>
>;

type CountRow = {
  dong: string | null;
  category: string | null;
  academy_count: number | string | null;
};

export async function fetchAcademyCountTable(): Promise<AcademyCountTable> {
  const { data, error } = await supabase
    .from('academy_counts_by_dong_category')
    .select('dong, category, academy_count')
    .limit(5000);

  if (error) {
    throw error;
  }

  const table: AcademyCountTable = new Map();

  for (const row of (data ?? []) as CountRow[]) {
    if (!row.dong || !row.category) {
      continue;
    }

    const count = Number(row.academy_count);

    if (!Number.isFinite(count)) {
      continue;
    }

    const byCategory =
      table.get(row.dong) ?? new Map<string, number>();

    byCategory.set(row.category, count);
    table.set(row.dong, byCategory);
  }

  return table;
}

/**
 * =====================================================
 * 결과 타입
 * =====================================================
 */
export type AcademyAreaResult = {
  areaName: string;
  category: AcademyCategory;

  /** 해당 동의 같은 업종 학원 수 */
  sameCategoryCount: number;

  /** 해당 동의 앱 지원 학원 전체 수 (밀집도) */
  totalAcademyCount: number;

  livingPopulation: number;

  /** 생활인구 1,000명당 같은 업종 학원 수 */
  competitionDensity: number;

  competitionScore: number;
  clusterScore: number;
  livingPopulationScore: number;

  suitabilityScore: number;

  evaluation: MarketEvaluation;
};

export type AcademyAnalysisOutcome = {
  results: AcademyAreaResult[];

  /** 인구 데이터가 없어 비교에서 빠진 지역 */
  skippedAreas: string[];
};

/**
 * =====================================================
 * 학원 지역 비교
 * =====================================================
 *
 * 선택한 학원 업종(category)을 기준으로
 * 지역(동)들을 상대 비교해서 점수·순위·평가(evaluation)를 만듭니다.
 *
 * table을 넘기지 않으면 Supabase에서 새로 읽습니다.
 */
export async function analyzeAcademyAreas(
  areaNames: string[],
  category: AcademyCategory,
  table?: AcademyCountTable,
): Promise<AcademyAnalysisOutcome> {
  const counts = table ?? (await fetchAcademyCountTable());

  const skippedAreas: string[] = [];

  type Base = {
    areaName: string;
    sameCategoryCount: number;
    totalAcademyCount: number;
    livingPopulation: number;
    competitionDensity: number;
  };

  const bases: Base[] = [];

  for (const areaName of areaNames) {
    const population = getPopulationByArea(areaName);

    if (!population) {
      skippedAreas.push(areaName);
      continue;
    }

    const byCategory = counts.get(areaName);

    const sameCategoryCount =
      byCategory?.get(category) ?? 0;

    let totalAcademyCount = 0;

    byCategory?.forEach(value => {
      totalAcademyCount += value;
    });

    const livingPopulation = population.livingPopulation;
    const demandBase = getDemandBase(population);

    bases.push({
      areaName,
      sameCategoryCount,
      totalAcademyCount,
      livingPopulation,
      competitionDensity:
        demandBase > 0
          ? (sameCategoryCount / demandBase) * 1000
          : 0,
    });
  }

  if (bases.length === 0) {
    return { results: [], skippedAreas };
  }

  // 세종 전체에서 이 업종이 몇 곳인지 (너무 적으면 참고용 안내)
  let categoryTotal = 0;

  counts.forEach(byCategory => {
    categoryTotal += byCategory.get(category) ?? 0;
  });

  const range = (values: number[]) => ({
    min: Math.min(...values),
    max: Math.max(...values),
  });

  const competitionRange = range(
    bases.map(item => item.competitionDensity),
  );
  const clusterRange = range(
    bases.map(item => item.totalAcademyCount),
  );
  const populationRange = range(
    bases.map(item => item.livingPopulation),
  );

  const scored = bases.map(item => {
    const competitionScore = normalizeMetric(
      item.competitionDensity,
      competitionRange.min,
      competitionRange.max,
      true,
    );
    const clusterScore = normalizeMetric(
      item.totalAcademyCount,
      clusterRange.min,
      clusterRange.max,
    );
    const livingPopulationScore = normalizeMetric(
      item.livingPopulation,
      populationRange.min,
      populationRange.max,
    );

    const total =
      competitionScore * ACADEMY_WEIGHTS.competition +
      clusterScore * ACADEMY_WEIGHTS.cluster +
      livingPopulationScore *
        ACADEMY_WEIGHTS.livingPopulation;

    return {
      item,
      competitionScore,
      clusterScore,
      livingPopulationScore,
      total,
    };
  });

  scored.sort((a, b) => b.total - a.total);

  const comparable = bases.length > 1;

  const results: AcademyAreaResult[] = scored.map(
    ({
      item,
      competitionScore,
      clusterScore,
      livingPopulationScore,
      total,
    }) => {
      const metric = (
        key: string,
        title: string,
        weight: number,
        reverse: boolean,
        unit: string,
        rawValue: number,
        score: number,
        range: { min: number; max: number },
      ): MetricEvaluation => {
        const isComparable =
          comparable && range.max !== range.min;

        return {
          key,
          title,
          rawValue,
          normalizedScore: Number(score.toFixed(1)),
          unroundedScore: score,
          weightedContribution: score * weight,
          min: range.min,
          max: range.max,
          weight,
          direction: reverse
            ? 'lower-is-better'
            : 'higher-is-better',
          label: !isComparable
            ? '비교 차이 없음'
            : reverse
              ? getCompetitionLabel(score)
              : getLevelLabel(score),
          comparable: isComparable,
          unit,
        };
      };

      const metrics: MetricEvaluation[] = [
        metric(
          'competitionDensity',
          `경쟁 수준 (같은 업종 ${category})`,
          ACADEMY_WEIGHTS.competition,
          true,
          '생활인구 1,000명당 같은 업종 학원 수',
          item.competitionDensity,
          competitionScore,
          competitionRange,
        ),
        metric(
          'academyCluster',
          '학원 밀집도 (앱 지원 학원 전체 수)',
          ACADEMY_WEIGHTS.cluster,
          false,
          '곳',
          item.totalAcademyCount,
          clusterScore,
          clusterRange,
        ),
        metric(
          'livingPopulation',
          '생활인구 (참고값, 경쟁 지표 분모로 반영)',
          ACADEMY_WEIGHTS.livingPopulation,
          false,
          '명',
          item.livingPopulation,
          livingPopulationScore,
          populationRange,
        ),
      ];

      const notes = [
        '낮음/높음은 이번 비교 집합 안의 상대 평가이며 절대적인 많음/적음 판정이 아님.',
        '학령인구(학생 수) 데이터는 반영하지 않았고, 수요는 생활인구로 근사함. 생활인구는 경쟁 지표의 분모로 반영되며 별도 점수에는 넣지 않고 참고값으로만 표시함(이중 반영 방지). 학원 수가 많다는 것만으로 수요가 크다고 단정하지 않음.',
        '교육청에 등록된 학원·교습소 중 현재 운영 중인 곳 기준이며, 정원·수강생 수·매출은 평가에 쓰지 않음.',
        '학원 분류는 학원명과 교습과정의 단어로 자동 분류한 것이라 일부 오분류가 있을 수 있음. 앱이 지원하지 않는 학원(바둑·스피치 등)은 집계에서 제외됨.',
        '학원 밀집도가 높다는 것은 학원가가 형성됐다는 신호일 수 있으나, 같은 업종 경쟁이 심하다는 뜻일 수도 있어 단정하지 않음.',
      ];

      if (category === '독서실') {
        notes.push(
          '독서실은 교육청에 독서실로 등록된 곳만 집계되어 스터디카페 등 일부 시설이 빠질 수 있음.',
        );
      }

      if (categoryTotal < THIN_CATEGORY_LIMIT) {
        notes.push(
          `"${category}" 업종이 세종 전체에서 ${categoryTotal}곳뿐이라 동별 비교는 참고용으로만 해석함.`,
        );
      }

      const evaluation: MarketEvaluation = {
        version: EVALUATION_VERSION,
        mode: 'suitability',
        comparisonScope:
          '이번 분석에서 데이터 조회에 성공한 선택 지역 간 상대 비교',
        comparisonCount: bases.length,
        comparisonTargets: bases.map(base => base.areaName),
        normalization:
          '일반=(값-최솟값)/(최댓값-최솟값)×100; 경쟁=(최댓값-값)/(최댓값-최솟값)×100',
        equalValuePolicy:
          '최댓값=최솟값이면 계산상 100점이지만 우수함의 근거로 쓰지 않고 비교 차이 없음으로 표시.',
        thresholds: [
          { min: 75, general: '매우 높음', competition: '경쟁 여유' },
          { min: 50, general: '높음', competition: '경쟁 보통' },
          { min: 25, general: '보통', competition: '경쟁 있음' },
          { min: 0, general: '낮음', competition: '경쟁 치열' },
        ],
        scoreFormula: `경쟁(같은 업종 학원 수/생활인구 1,000명) 정규화점수×${ACADEMY_WEIGHTS.competition} + 학원 밀집도 정규화점수×${ACADEMY_WEIGHTS.cluster} (생활인구는 경쟁 분모로 반영, 참고값)`,
        totalScore: total,
        metrics,
        scope: {
          analysisType: 'area',
          areaName: item.areaName,
          dongName: item.areaName,
          radius: null,
          note: `${item.areaName}: ${category} ${item.sameCategoryCount}곳, 앱 지원 학원 전체 ${item.totalAcademyCount}곳, 생활인구 ${item.livingPopulation.toLocaleString('ko-KR')}명. 행정동 단위 데이터이며 다른 지역·기간까지 일반화하지 않음.`,
        },
        notes,
      };

      return {
        areaName: item.areaName,
        category,
        sameCategoryCount: item.sameCategoryCount,
        totalAcademyCount: item.totalAcademyCount,
        livingPopulation: item.livingPopulation,
        competitionDensity: Number(
          item.competitionDensity.toFixed(3),
        ),
        competitionScore: Number(competitionScore.toFixed(1)),
        clusterScore: Number(clusterScore.toFixed(1)),
        livingPopulationScore: Number(
          livingPopulationScore.toFixed(1),
        ),
        suitabilityScore: Number(total.toFixed(1)),
        evaluation,
      };
    },
  );

  return { results, skippedAreas };
}