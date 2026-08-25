import { getAccessibilityByArea } from "../data/accessibilityData";
import { getPopulationByArea } from "../data/populationData";
import { getSalesByAreaAndBusiness } from "../data/salesData";
import { getStoreCount } from "./storeApi";

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

export async function analyzeCommercialArea(
  areaName: string,
  adongCode: string,
  businessName: string,
  lclsCode: string,
  mclsCode?: string,
  sclsCode?: string
): Promise<CommercialAnalysisResult> {
  const storeResult = await getStoreCount(
    areaName,
    adongCode,
    lclsCode,
    mclsCode,
    sclsCode
  );

  const population = getPopulationByArea(areaName);

  if (!population) {
    throw new Error(
      `${areaName} 인구 데이터를 찾을 수 없습니다.`
    );
  }

  const accessibility =
    getAccessibilityByArea(areaName);

  if (!accessibility) {
    throw new Error(
      `${areaName} 접근성 데이터를 찾을 수 없습니다.`
    );
  }

  const sales = getSalesByAreaAndBusiness(
    areaName,
    businessName
  );

  if (!sales) {
    throw new Error(
      `${areaName} ${businessName} 카드소비 데이터를 찾을 수 없습니다.`
    );
  }

  const competitionDensity =
    population.floatingPopulation > 0
      ? (storeResult.storeCount /
          population.floatingPopulation) *
        1000
      : 0;

  const averageSalesPerStore =
    storeResult.storeCount > 0
      ? sales.salesAmount /
        storeResult.storeCount
      : 0;

  return {
    areaName,

    storeCount: storeResult.storeCount,

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

export function calculateSuitabilityScores(
  results: CommercialAnalysisResult[]
): ScoredCommercialAnalysisResult[] {
  if (results.length === 0) {
    return [];
  }

  const floatingPopulations =
    results.map(
      (item) =>
        item.floatingPopulation
    );

  const livingPopulations =
    results.map(
      (item) =>
        item.livingPopulation
    );

  const salesAmounts =
    results.map(
      (item) =>
        item.salesAmount
    );

  const averageSales =
    results.map(
      (item) =>
        item.averageSalesPerStore
    );

  const competitionDensities =
    results.map(
      (item) =>
        item.competitionDensity
    );

  const livingChangeRates =
    results.map(
      (item) =>
        item.livingPopulationChangeRate
    );

  const floatingChangeRates =
    results.map(
      (item) =>
        item.floatingPopulationChangeRate
    );

  const busStopCounts =
    results.map(
      (item) =>
        item.busStopCount
    );

  const minFloating =
    Math.min(...floatingPopulations);

  const maxFloating =
    Math.max(...floatingPopulations);

  const minLiving =
    Math.min(...livingPopulations);

  const maxLiving =
    Math.max(...livingPopulations);

  const minSales =
    Math.min(...salesAmounts);

  const maxSales =
    Math.max(...salesAmounts);

  const minAverageSales =
    Math.min(...averageSales);

  const maxAverageSales =
    Math.max(...averageSales);

  const minCompetition =
    Math.min(...competitionDensities);

  const maxCompetition =
    Math.max(...competitionDensities);

  const minLivingChange =
    Math.min(...livingChangeRates);

  const maxLivingChange =
    Math.max(...livingChangeRates);

  const minFloatingChange =
    Math.min(...floatingChangeRates);

  const maxFloatingChange =
    Math.max(...floatingChangeRates);

  const minBusStop =
    Math.min(...busStopCounts);

  const maxBusStop =
    Math.max(...busStopCounts);

  const scoredResults =
    results.map((item) => {
      const floatingPopulationScore =
        normalize(
          item.floatingPopulation,
          minFloating,
          maxFloating
        );

      const livingPopulationScore =
        normalize(
          item.livingPopulation,
          minLiving,
          maxLiving
        );

      const salesScore =
        normalize(
          item.salesAmount,
          minSales,
          maxSales
        );

      const averageSalesScore =
        normalize(
          item.averageSalesPerStore,
          minAverageSales,
          maxAverageSales
        );

      const competitionScore =
        normalizeReverse(
          item.competitionDensity,
          minCompetition,
          maxCompetition
        );

      const livingPopulationChangeScore =
        normalize(
          item.livingPopulationChangeRate,
          minLivingChange,
          maxLivingChange
        );

      const floatingPopulationChangeScore =
        normalize(
          item.floatingPopulationChangeRate,
          minFloatingChange,
          maxFloatingChange
        );

      const accessibilityScore =
        normalize(
          item.busStopCount,
          minBusStop,
          maxBusStop
        );

      const suitabilityScore =
        floatingPopulationScore * 0.18 +
        salesScore * 0.14 +
        averageSalesScore * 0.18 +
        competitionScore * 0.14 +
        livingPopulationScore * 0.09 +
        livingPopulationChangeScore * 0.09 +
        floatingPopulationChangeScore * 0.09 +
        accessibilityScore * 0.09;

      return {
        ...item,

        floatingPopulationScore:
          Number(
            floatingPopulationScore.toFixed(1)
          ),

        salesScore:
          Number(
            salesScore.toFixed(1)
          ),

        averageSalesScore:
          Number(
            averageSalesScore.toFixed(1)
          ),

        competitionScore:
          Number(
            competitionScore.toFixed(1)
          ),

        livingPopulationScore:
          Number(
            livingPopulationScore.toFixed(1)
          ),

        livingPopulationChangeScore:
          Number(
            livingPopulationChangeScore.toFixed(1)
          ),

        floatingPopulationChangeScore:
          Number(
            floatingPopulationChangeScore.toFixed(1)
          ),

        accessibilityScore:
          Number(
            accessibilityScore.toFixed(1)
          ),

        suitabilityScore:
          Number(
            suitabilityScore.toFixed(1)
          ),
      };
    });

  scoredResults.sort(
    (a, b) =>
      b.suitabilityScore -
      a.suitabilityScore
  );

  return scoredResults;
}