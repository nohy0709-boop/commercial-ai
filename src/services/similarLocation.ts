import { sejongAreas } from "../constants/sejongAreas";

import {
  analyzeCommercialArea,
  calculateSuitabilityScores,
  CommercialAnalysisResult,
  ScoredCommercialAnalysisResult,
} from "./commercialAnalysis";

export type SimilarLocationResult = {
  areaName: string;
  similarityScore: number;
  analysis: ScoredCommercialAnalysisResult;
};

function calculateSimilarity(
  base: ScoredCommercialAnalysisResult,
  target: ScoredCommercialAnalysisResult
): number {
  const differences = [
    Math.abs(
      base.floatingPopulationScore -
        target.floatingPopulationScore
    ),

    Math.abs(
      base.livingPopulationScore -
        target.livingPopulationScore
    ),

    Math.abs(
      base.salesScore -
        target.salesScore
    ),

    Math.abs(
      base.averageSalesScore -
        target.averageSalesScore
    ),

    Math.abs(
      base.competitionScore -
        target.competitionScore
    ),

    Math.abs(
      base.livingPopulationChangeScore -
        target.livingPopulationChangeScore
    ),

    Math.abs(
      base.floatingPopulationChangeScore -
        target.floatingPopulationChangeScore
    ),

    Math.abs(
      base.accessibilityScore -
        target.accessibilityScore
    ),
  ];

  const averageDifference =
    differences.reduce(
      (sum, value) => sum + value,
      0
    ) / differences.length;

  const similarityScore =
    100 - averageDifference;

  return Number(
    Math.max(0, similarityScore).toFixed(1)
  );
}

export async function findSimilarLocations(
  selectedAreaName: string,
  businessName: string,
  lclsCode: string,
  mclsCode?: string,
  sclsCode?: string,
  limit: number = 3
): Promise<SimilarLocationResult[]> {
  const analysisResults =
    await Promise.all(
      sejongAreas.map(async (area) => {
        try {
          return await analyzeCommercialArea(
            area.name,
            area.code,
            businessName,
            lclsCode,
            mclsCode,
            sclsCode
          );
        } catch (error) {
          console.warn(
            `${area.name} 분석 실패`,
            error
          );

          return null;
        }
      })
    );

  const validResults =
    analysisResults.filter(
      (
        item
      ): item is CommercialAnalysisResult =>
        item !== null
    );

  const scoredResults =
    calculateSuitabilityScores(
      validResults
    );

  const selectedArea =
    scoredResults.find(
      (item) =>
        item.areaName ===
        selectedAreaName
    );

  if (!selectedArea) {
    throw new Error(
      `${selectedAreaName} 분석 결과를 찾을 수 없습니다.`
    );
  }

  const similarLocations =
    scoredResults
      .filter(
        (item) =>
          item.areaName !==
          selectedAreaName
      )
      .map((item) => ({
        areaName: item.areaName,

        similarityScore:
          calculateSimilarity(
            selectedArea,
            item
          ),

        analysis: item,
      }))
      .sort(
        (a, b) =>
          b.similarityScore -
          a.similarityScore
      );

  return similarLocations.slice(
    0,
    limit
  );
}