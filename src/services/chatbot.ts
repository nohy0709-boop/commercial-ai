const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export type ChatRole = 'user' | 'assistant';

export interface ChatHistoryItem {
  role: ChatRole;
  content: string;
}

export interface ChatContext {
  businessName?: string;
  areaName?: string;
  suitabilityScore?: number | string;
  floatingPopulation?: number | string;
  livingPopulation?: number | string;
  storeCount?: number | string;
  competitionDensity?: number | string;
  salesAmount?: number | string;
  averageSalesPerStore?: number | string;

  [key: string]: unknown;
}

interface ChatbotResponse {
  answer?: string;
  error?: string;
}

export async function sendChatMessage(
  message: string,
  context: ChatContext = {},
  history: ChatHistoryItem[] = [],
): Promise<string> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error(
      'Supabase 설정을 불러오지 못했습니다. .env 파일을 확인해주세요.',
    );
  }

  if (!message.trim()) {
    throw new Error('질문을 입력해주세요.');
  }

  const response = await fetch(
    `${SUPABASE_URL}/functions/v1/chat-assistant`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        apikey: SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({
        message: message.trim(),
        context,
        history,
      }),
    },
  );

  const data = (await response.json().catch(() => null)) as
    | ChatbotResponse
    | null;

  if (!response.ok) {
    const message =
      data?.error ?? `챗봇 요청 실패 (HTTP ${response.status})`;

    console.error('chat-assistant Edge Function error:', data);

    throw new Error(message);
  }

  if (data?.error) {
    throw new Error(data.error);
  }

  if (!data?.answer) {
    throw new Error('AI 응답을 받아오지 못했습니다.');
  }

  return data.answer;
}