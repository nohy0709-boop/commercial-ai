/**
 * src/services/profileForAI.ts
 *
 * 챗봇 / AI 분석을 요청하기 직전에 "나의 창업 정보"를 최신 상태로 읽어서
 * 프롬프트에 넣을 요약 문장으로 만들어 준다.
 *
 * - 캐시하지 않는다. 요청할 때마다 Supabase에서 다시 읽기 때문에
 *   사용자가 MY에서 정보를 수정하면 바로 다음 질문/분석부터 반영된다.
 * - 프로필을 못 읽거나(비로그인 등) 아직 입력 전이면 빈 문자열을 돌려주고,
 *   그 경우 기존 동작(맞춤 정보 없음)과 똑같이 동작한다.
 */

import { buildProfileSummary } from '@/services/profileContext';
import { getUserProfile } from '@/services/userProfile';

export async function getProfileSummaryForAI(): Promise<string> {
  try {
    const profile = await getUserProfile();

    return buildProfileSummary(profile);
  } catch (error) {
    console.warn('사용자 창업 정보 요약 실패(맞춤 정보 없이 진행):', error);

    return '';
  }
}