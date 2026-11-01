/** 원본 지표와 앱의 평가 기준·결과를 Supabase 서버에 함께 전달합니다. */
import { getProfileSummaryForAI } from '@/services/profileForAI';
import type { MarketEvaluation } from './marketEvaluation';
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
export interface PersonalizedAssessment { summary: string; fits: string[]; cautions: string[]; }
export interface AIExplanation {
  recommendationReason: string; keyFeatures: string; advantages: string[]; risks: string[]; considerations: string;
  personalized?: PersonalizedAssessment;
  evaluationVersion?: string | null;
  consistencyStatus?: 'checked' | 'app-evaluation-fallback' | 'no-evaluation';
}
export async function generateAIExplanation(
  analysisData: Record<string, unknown> & { evaluation?: MarketEvaluation },
): Promise<AIExplanation> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) throw new Error('Supabase 설정을 불러오지 못했습니다. .env 파일을 확인해주세요.');
  const userProfile = await getProfileSummaryForAI().catch(() => undefined);
  const response = await fetch(`${SUPABASE_URL}/functions/v1/generate-recommendation`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${SUPABASE_ANON_KEY}`, apikey: SUPABASE_ANON_KEY },
    body: JSON.stringify({ ...analysisData, ...(userProfile ? { userProfile } : {}) }),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok || data?.error) throw new Error(data?.error ?? `AI 설명 생성 요청 실패 (HTTP ${response.status})`);
  if (analysisData.evaluation && data?.evaluationVersion !== analysisData.evaluation.version) {
    throw new Error('AI 서버의 평가 연동 버전이 일치하지 않아요. generate-recommendation 함수를 최신 코드로 배포한 뒤 다시 시도해주세요.');
  }
  if (!data || typeof data.recommendationReason !== 'string' || typeof data.keyFeatures !== 'string'
      || typeof data.considerations !== 'string' || !Array.isArray(data.advantages) || !Array.isArray(data.risks)
      || !data.advantages.every((value: unknown) => typeof value === 'string')
      || !data.risks.every((value: unknown) => typeof value === 'string')) {
    throw new Error('AI 설명 형식이 올바르지 않습니다. 다시 시도해주세요.');
  }
  return data as AIExplanation;
}
