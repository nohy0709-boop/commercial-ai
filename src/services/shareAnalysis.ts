import { supabase } from '@/lib/supabase';
import type { AnalysisReportData } from '@/services/pdfExport';
import { Platform } from 'react-native';

export interface SharedAnalysisRecord {
  id: string;
  owner_id: string | null;
  payload: AnalysisReportData;
  created_at: string;
  expires_at: string | null;
}

const TABLE_NAME = 'shared_analyses';

/**
 * 외부에서 접속할 수 있는 공개 앱 주소
 *
 * localhost 주소가 공유 링크에 포함되지 않도록
 * EXPO_PUBLIC_APP_URL만 사용한다.
 */
function getPublicAppOrigin(): string {
  const envUrl = process.env.EXPO_PUBLIC_APP_URL?.trim();

  if (!envUrl) {
    throw new Error(
      '공유 사이트 주소가 설정되지 않았습니다. .env의 EXPO_PUBLIC_APP_URL을 확인해주세요.',
    );
  }

  const origin = envUrl.replace(/\/+$/, '');

  try {
    const parsedUrl = new URL(origin);

    if (
      parsedUrl.protocol !== 'https:' ||
      parsedUrl.hostname === 'localhost' ||
      parsedUrl.hostname === '127.0.0.1'
    ) {
      throw new Error('Invalid public URL');
    }

    if (
      parsedUrl.username ||
      parsedUrl.password ||
      parsedUrl.search ||
      parsedUrl.hash
    ) {
      throw new Error('Invalid public URL');
    }

    return parsedUrl.origin;
  } catch {
    throw new Error(
      '올바른 공개 HTTPS 주소를 설정해주세요. 예: https://commercial-ai-psi.vercel.app',
    );
  }
}

/**
 * 공유할 분석 결과를 Supabase에 저장하고
 * 외부에서 접속할 수 있는 공유 링크를 생성한다.
 */
export async function createSharedAnalysis(
  payload: AnalysisReportData,
): Promise<{ id: string; url: string }> {
  // 잘못된 공유 URL이면 데이터를 저장하기 전에 오류를 발생시킨다.
  const origin = getPublicAppOrigin();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error(
      '공유 링크를 만들려면 로그인이 필요합니다.',
    );
  }

  const { data, error } = await supabase
    .from(TABLE_NAME)
    .insert({
      owner_id: user.id,
      payload,
    })
    .select('id')
    .single();

  if (error) {
    console.error('공유 분석 저장 실패:', error);

    throw new Error(
      '공유 링크를 만들지 못했습니다.',
    );
  }

  if (!data?.id) {
    throw new Error(
      '공유 링크 ID를 생성하지 못했습니다.',
    );
  }

  const url = `${origin}/share/${encodeURIComponent(data.id)}`;

  return {
    id: data.id,
    url,
  };
}

/**
 * 공유 ID를 이용하여 Supabase에서
 * 저장된 상권 분석 결과를 조회한다.
 */
export async function getSharedAnalysis(
  id: string,
): Promise<SharedAnalysisRecord | null> {
  if (!id || !id.trim()) {
    throw new Error(
      '유효하지 않은 공유 링크입니다.',
    );
  }

  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select(
      'id, owner_id, payload, created_at, expires_at',
    )
    .eq('id', id)
    .maybeSingle();

  if (error) {
    console.error('공유 분석 조회 실패:', error);

    throw new Error(
      '공유된 분석 결과를 불러오지 못했습니다.',
    );
  }

  if (!data) {
    return null;
  }

  // 만료된 공유 링크인지 확인
  if (
    data.expires_at &&
    new Date(data.expires_at).getTime() <= Date.now()
  ) {
    return null;
  }

  return data as SharedAnalysisRecord;
}

/**
 * 공유 링크 전달
 *
 * 웹 브라우저에서 Web Share API를 지원하면
 * 시스템 공유 창을 띄운다.
 *
 * 지원하지 않으면 클립보드에 링크를 복사한다.
 */
export async function sharePublicAnalysisLink(
  url: string,
  title: string,
  text: string,
): Promise<'shared' | 'copied' | 'unsupported'> {
  if (
    Platform.OS === 'web' &&
    typeof navigator !== 'undefined'
  ) {
    // 모바일 브라우저 등에서 공유 기능 지원
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text,
          url,
        });

        return 'shared';
      } catch (error) {
        // 사용자가 공유 창을 닫은 경우
        if (
          error instanceof Error &&
          error.name === 'AbortError'
        ) {
          return 'unsupported';
        }

        console.error('공유하기 실패:', error);
        throw error;
      }
    }

    // 공유 기능 미지원 시 링크 복사
    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(url);

        return 'copied';
      } catch (error) {
        console.error('링크 복사 실패:', error);
      }
    }

    throw new Error(
      '이 브라우저에서는 공유 기능을 지원하지 않습니다.',
    );
  }

  return 'unsupported';
}