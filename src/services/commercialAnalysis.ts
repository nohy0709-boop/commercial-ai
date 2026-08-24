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

      /*
        최종 가중치

        유동인구              20%
        전체 카드소비          15%
        점포당 카드소비        20%
        경쟁도                15%
        생활인구              10%
        생활인구 증감률        10%
        유동인구 증감률        10%

        총 100%
      */

      const suitabilityScore =
        floatingPopulationScore * 0.2 +
        salesScore * 0.15 +
        averageSalesScore * 0.2 +
        competitionScore * 0.15 +
        livingPopulationScore * 0.1 +
        livingPopulationChangeScore * 0.1 +
        floatingPopulationChangeScore * 0.1;

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