import type { CommercialAnalysisResult, PointCommercialAnalysisResult } from './commercialAnalysis';
import type { MarketEvaluation } from './marketEvaluation';
import { BUSINESS_WEIGHTS, buildMarketEvaluation, normalizeMetric } from './marketEvaluation';

type PointAnalysisMetadata = {
  dongName?: string; latitude?: number; longitude?: number; radius?: number;
  analysisType?: 'point'; radiusStoreCount?: number; isEstimated?: boolean;
};
export type BusinessRecommendationResult = CommercialAnalysisResult & PointAnalysisMetadata & {
  businessName: string; averageSalesScore: number; competitionScore: number; salesScore: number;
  recommendationScore: number; rank: number; evaluation?: MarketEvaluation;
};
type BusinessAnalysisInput = {
  businessName: string; analysis: CommercialAnalysisResult | PointCommercialAnalysisResult;
};
/** 기존 업종 추천 계산: 점포당 카드소비 40%, 경쟁 여유도 35%, 전체 카드소비 25%. */
export function calculateBusinessRecommendationScores(items: BusinessAnalysisInput[]): BusinessRecommendationResult[] {
  if (!items.length) return [];
  const compared = items.map(item => ({ ...item.analysis, businessName: item.businessName }));
  const average = compared.map(item => item.averageSalesPerStore);
  const competition = compared.map(item => item.competitionDensity);
  const sales = compared.map(item => item.salesAmount);
  const scored = compared.map(item => {
    const averageSalesScore = normalizeMetric(item.averageSalesPerStore, Math.min(...average), Math.max(...average));
    const competitionScore = normalizeMetric(item.competitionDensity, Math.min(...competition), Math.max(...competition), true);
    const salesScore = normalizeMetric(item.salesAmount, Math.min(...sales), Math.max(...sales));
    const recommendationScore = averageSalesScore * BUSINESS_WEIGHTS.averageSalesScore
      + competitionScore * BUSINESS_WEIGHTS.competitionScore + salesScore * BUSINESS_WEIGHTS.salesScore;
    return {
      ...item,
      averageSalesScore: Number(averageSalesScore.toFixed(1)),
      competitionScore: Number(competitionScore.toFixed(1)),
      salesScore: Number(salesScore.toFixed(1)),
      recommendationScore: Number(recommendationScore.toFixed(1)), rank: 0,
    };
  });
  scored.sort((a, b) => b.recommendationScore - a.recommendationScore);
  return scored.map((item, index) => ({ ...item, rank: index + 1,
    evaluation: buildMarketEvaluation(item, compared, 'business-recommendation'),
  }));
}
