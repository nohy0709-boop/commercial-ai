/**
 * Supabase Edge Function을 호출해서, 구조화된 분석 데이터를
 * AI가 생성한 자연어 설명(추천 이유, 특징, 장점, 위험요소, 고려사항)으로 바꿔줍니다.
 *
 * 중요: Gemini API 키는 이 파일이나 앱 어디에도 없습니다.
 * 앱은 Supabase Edge Function(서버)만 호출하고, 실제 AI 키는 서버 쪽 Secret에만 있습니다.
 */

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export interface AIExplanation {
  recommendationReason: string;
  keyFeatures: string;
  advantages: string[];
  risks: string[];
  considerations: string;
}

export async function generateAIExplanation(
  analysisData: Record<string, unknown>,
): Promise<AIExplanation> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error(
      'Supabase 설정을 불러오지 못했습니다. .env 파일을 확인해주세요.',
    );
  }

  const response = await fetch(
    `${SUPABASE_URL}/functions/v1/generate-recommendation`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify(analysisData),
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