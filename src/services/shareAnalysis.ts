
import { supabase } from '@/lib/supabase';
import type { AnalysisReportData } from '@/services/pdfExport';
import { Platform, Share } from 'react-native';

export interface SharedAnalysisRecord {
  id: string;
  owner_id: string | null;
  payload: AnalysisReportData;
  created_at: string;
  expires_at: string | null;
}

export type ShareResult = 'shared' | 'copied' | 'cancelled' | 'unsupported';

const TABLE_NAME = 'shared_analyses';

/**
 * 공개 공유 사이트 주소를 가져온다.
 * localhost는 외부 공유 주소로 사용할 수 없다.
 */
function getPublicAppOrigin(): string {
  const envUrl = process.env.EXPO_PUBLIC_APP_URL?.trim();

  if (!envUrl) {
    throw new Error(
      '공유 사이트 주소가 설정되지 않았습니다. EXPO_PUBLIC_APP_URL을 확인해주세요.',
    );
  }

  try {
    const parsedUrl = new URL(envUrl);

    if (
      parsedUrl.protocol !== 'https:' ||
      parsedUrl.hostname === 'localhost' ||
      parsedUrl.hostname === '127.0.0.1' ||
      parsedUrl.username ||
      parsedUrl.password ||
      parsedUrl.search ||
      parsedUrl.hash
    ) {
      throw new Error('Invalid URL');
    }

    return parsedUrl.origin;
  } catch {
    throw new Error(
      '공유 사이트 주소는 외부에서 접속 가능한 HTTPS 주소여야 합니다.',
    );
  }
}

/**
 * Supabase에 분석 결과를 저장하고 공개 공유 URL 생성
 */
export async function createSharedAnalysis(
  payload: AnalysisReportData,
): Promise<{ id: string; url: string }> {
  const origin = getPublicAppOrigin();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error('공유 링크를 만들려면 로그인이 필요합니다.');
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
    throw new Error('공유 링크를 만들지 못했습니다.');
  }

  if (!data?.id) {
    throw new Error('공유 링크 ID를 생성하지 못했습니다.');
  }

  return {
    id: data.id,
    url: `${origin}/share/${encodeURIComponent(data.id)}`,
  };
}

/**
 * 공유된 분석 데이터 조회
 */
export async function getSharedAnalysis(
  id: string,
): Promise<SharedAnalysisRecord | null> {
  if (!id?.trim()) {
    throw new Error('유효하지 않은 공유 링크입니다.');
  }

  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('id, owner_id, payload, created_at, expires_at')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    console.error('공유 분석 조회 실패:', error);
    throw new Error('공유된 분석 결과를 불러오지 못했습니다.');
  }

  if (!data) {
    return null;
  }

  if (
    data.expires_at &&
    new Date(data.expires_at).getTime() <= Date.now()
  ) {
    return null;
  }

  return data as SharedAnalysisRecord;
}

/**
 * 웹: 브라우저 기본 공유 또는 링크 복사
 * iOS/Android: 시스템 기본 공유 창
 */
export async function sharePublicAnalysisLink(
  url: string,
  title: string,
  text: string,
): Promise<ShareResult> {
  if (Platform.OS === 'web') {
    if (typeof navigator === 'undefined') {
      return 'unsupported';
    }

    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({
          title,
          text,
          url,
        });
        return 'shared';
      } catch (error) {
        if (
          error instanceof Error &&
          error.name === 'AbortError'
        ) {
          return 'cancelled';
        }
        throw error;
      }
    }

    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(url);
      return 'copied';
    }

    return 'unsupported';
  }

  const result = await Share.share(
    Platform.OS === 'ios'
      ? {
          title,
          message: text,
          url,
        }
      : {
          title,
          message: `${text}\n\n${url}`,
        },
    {
      dialogTitle: title,
    },
  );

  if (result.action === Share.dismissedAction) {
    return 'cancelled';
  }

  if (result.action === Share.sharedAction) {
    return 'shared';
  }

  return 'unsupported';
}
