import type {
    AnalysisHistoryItem,
} from '@/services/analysisHistory';

import type {
    ChatContext,
    ComparisonCandidate,
} from '@/services/chatbot';

/**
 * 찜 비교 화면에서 사용하는 동일한 지표입니다.
 * 값이 없으면 0 대신 null을 유지합니다.
 */
export const COMPARISON_METRICS = [
  {
    key: 'suitabilityScore',
    label: '종합 적합도',
    unit: '점',
  },
  {
    key: 'floatingPopulation',
    label: '유동인구',
    unit: '명',
  },
  {
    key: 'livingPopulation',
    label: '생활인구',
    unit: '명',
  },
  {
    key: 'storeCount',
    label: '동종 업종 점포 수',
    unit: '개',
  },
  {
    key: 'competitionDensity',
    label: '경쟁 밀도',
    unit: '원본 단위',
  },
  {
    key: 'salesAmount',
    label: '전체 카드소비',
    unit: '원',
  },
  {
    key: 'averageSalesPerStore',
    label: '점포당 카드소비',
    unit: '원',
  },
  {
    key: 'busStopCount',
    label: '버스정류장 수',
    unit: '개',
  },
  {
    key: 'livingPopulationChangeRate',
    label: '생활인구 증감률',
    unit: '%',
  },
  {
    key: 'floatingPopulationChangeRate',
    label: '유동인구 증감률',
    unit: '%',
  },
] as const;

function numberOrNull(value: unknown): number | null {
  if (
    value === null ||
    value === undefined ||
    value === '' ||
    typeof value === 'boolean'
  ) {
    return null;
  }

  if (
    typeof value !== 'string' &&
    typeof value !== 'number'
  ) {
    return null;
  }

  if (
    typeof value === 'string' &&
    !value.trim()
  ) {
    return null;
  }

  const number = Number(value);

  return Number.isFinite(number) ? number : null;
}

function text(value: unknown): string | null {
  return typeof value === 'string' && value.trim()
    ? value.trim()
    : null;
}

export function parseComparisonIds(
  value: string,
): string[] {
  const parsed: unknown = JSON.parse(value);

  if (
    !Array.isArray(parsed) ||
    parsed.length < 2 ||
    parsed.length > 3 ||
    !parsed.every(
      id => typeof id === 'string' && id.trim(),
    ) ||
    new Set(parsed).size !== parsed.length
  ) {
    throw new Error(
      '비교할 분석을 2~3개 다시 선택해주세요.',
    );
  }

  return parsed as string[];
}

export function resolveComparisonItems(
  items: AnalysisHistoryItem[],
  ids: string[],
): AnalysisHistoryItem[] {
  return ids.map(id => {
    const item = items.find(
      candidate => candidate.id === id,
    );

    if (!item) {
      throw new Error(
        '선택한 분석 기록을 찾을 수 없어요. 찜한 분석에서 다시 선택해주세요.',
      );
    }

    return item;
  });
}

export function createComparisonContext(
  items: AnalysisHistoryItem[],
  source: 'favorites' | 'history' = 'favorites',
): ChatContext {
  if (
    items.length < 2 ||
    items.length > 3 ||
    new Set(items.map(item => item.id)).size !==
      items.length
  ) {
    throw new Error(
      '서로 다른 분석을 2~3개 선택해주세요.',
    );
  }

  const candidates: ComparisonCandidate[] = items.map(
    (item, index) => {
      if (
        !item.resultData ||
        typeof item.resultData !== 'object' ||
        Array.isArray(item.resultData)
      ) {
        throw new Error(
          `'${item.title || item.businessName}'의 상세 결과가 없어요. 다시 분석한 결과를 저장해주세요.`,
        );
      }

      const data = item.resultData as unknown as Record<
        string,
        unknown
      >;

      const metrics: Record<
        string,
        number | null
      > = {};

      for (const metric of COMPARISON_METRICS) {
        metrics[metric.key] = numberOrNull(
          data[metric.key],
        );
      }

      if (
        !Object.values(metrics).some(
          value => value !== null,
        )
      ) {
        throw new Error(
          `'${item.title || item.businessName}'에 비교할 수치가 저장되어 있지 않아요.`,
        );
      }

      return {
        candidateNumber: index + 1,
        analysisHistoryId: item.id,
        title: item.title || `후보 ${index + 1}`,
        businessName: item.businessName,
        regions: [...(item.regions ?? [])],
        createdAt: item.createdAt,
        workflowType: item.type,
        areaName: text(data.areaName),
        dongName: text(data.dongName),
        analysisType: text(data.analysisType),
        latitude: numberOrNull(data.latitude),
        longitude: numberOrNull(data.longitude),
        radius: numberOrNull(data.radius),
        metrics,
      };
    },
  );

  return {
    comparisonMode: true,
    comparisonSource: source,
    comparisonTitle: `선택한 ${candidates.length}개 분석 비교`,
    comparisonCandidates: candidates,
    comparisonMetricDefinitions: COMPARISON_METRICS,

    // 기존 Edge Function에서 두 후보 필드를 사용하는 경우에도 전달합니다.
    firstAnalysis: {
      ...candidates[0],
      ...candidates[0].metrics,
    },
    secondAnalysis: {
      ...candidates[1],
      ...candidates[1].metrics,
    },
    ...(candidates[2]
      ? {
          thirdAnalysis: {
            ...candidates[2],
            ...candidates[2].metrics,
          },
        }
      : {}),
  };
}