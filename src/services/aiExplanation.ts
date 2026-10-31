/**
 * Supabase Edge Function을 호출해서, 구조화된 분석 데이터를
 * AI가 생성한 자연어 설명(추천 이유, 특징, 장점, 위험요소, 고려사항)으로 바꿔줍니다.
 *
 * 중요: Gemini API 키는 이 파일이나 앱 어디에도 없습니다.
 * 앱은 Supabase Edge Function(서버)만 호출하고, 실제 AI 키는 서버 쪽 Secret에만 있습니다.
 */

import { getProfileSummaryForAI } from '@/services/profileForAI';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

/**
 * 사용자 맞춤형 판단.
 * 서버가 아직 이 값을 만들어 주지 않으면 undefined 이므로 화면에서는 값이 있을 때만 보여준다.
 */
export interface PersonalizedAssessment {
  /** 한 줄 요약: 이 사용자에게 이 지역이 어떤지 */
  summary: string;
  /** 사용자 조건(예산, 고객층, 우선순위 등)에 잘 맞는 점 */
  fits: string[];
  /** 사용자 조건 기준으로 유의할 점 */
  cautions: string[];
}

export interface AIExplanation {
  recommendationReason: string;
  keyFeatures: string;
  advantages: string[];
  risks: string[];
  considerations: string;
  personalized?: PersonalizedAssessment;
}

export async function generateAIExplanation(
  analysisData: Record<string, unknown>,
): Promise<AIExplanation> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error(
      'Supabase 설정을 불러오지 못했습니다. .env 파일을 확인해주세요.',
    );
  }

  /**
   * 사용자가 "나의 창업 정보"에 입력한 내용을 최신 상태로 읽어서 같이 보낸다.
   * (입력 전이거나 읽기 실패 시에는 보내지 않아 기존 동작 그대로)
   */
  const userProfile = await getProfileSummaryForAI();

  const response = await fetch(
    `${SUPABASE_URL}/functions/v1/generate-recommendation`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        ...analysisData,
        ...(userProfile ? { userProfile } : {}),
      }),
    },
  );

  // 실패한 경우에도 서버가 보내준 실제 에러 메시지(JSON body)를 읽어서 보여줍니다.
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      data?.error ?? `AI 설명 생성 요청 실패 (HTTP ${response.status})`;
    console.error('Edge Function 에러 응답:', data);
    throw new Error(message);
  }

  if (data?.error) {
    throw new Error(data.error);
  }

  return data as AIExplanation;
}