
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

export type ShareResult =
  | 'shared'
  | 'copied'
  | 'cancelled'
  | 'unsupported';

const TABLE_NAME = 'shared_analyses';

/**
 * 공유 사이트 주소 확인
 *
 * EXPO_PUBLIC_APP_URL이 실제 실행 환경에
 * 전달되는지 로그로 확인한다.
 */
function getPublicAppOrigin(): string {
  const envUrl =
    process.env.EXPO_PUBLIC_APP_URL?.trim();

  console.log(
    '[공유 URL 확인]',
    envUrl ?? 'undefined',
  );

  console.log(
    '[공유 플랫폼 확인]',
    Platform.OS,
  );

  if (!envUrl) {
    console.error(
      '[공유 URL 오류] EXPO_PUBLIC_APP_URL이 없습니다.',
    );

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
      throw new Error('잘못된 공개 사이트 주소');
    }

    console.log(
      '[공유 URL 정상]',
      parsedUrl.origin,
    );

    return parsedUrl.origin;
  } catch (error) {
    console.error(
      '[공유 URL 형식 오류]',
      error,
    );

    throw new Error(
      '공유 사이트 주소는 외부에서 접속 가능한 HTTPS 주소여야 합니다.',
    );
  }
}

/**
 * 공유 분석 저장
 *
 * Supabase에 분석 결과를 저장하고
 * 외부에서 접근할 수 있는 공유 URL을 반환한다.
 */
export async function createSharedAnalysis(
  payload: AnalysisReportData,
): Promise<{ id: string; url: string }> {
  console.log(
    '[공유 생성] 시작',
  );

  const origin = getPublicAppOrigin();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) {
    console.error(
      '[공유 생성] 인증 오류',
      authError,
    );

    throw new Error(
      '로그인 정보를 확인하지 못했습니다.',
    );
  }

  if (!user) {
    throw new Error(
      '공유 링크를 만들려면 로그인이 필요합니다.',
    );
  }

  console.log(
    '[공유 생성] 로그인 확인 완료',
  );

  const { data, error } = await supabase
    .from(TABLE_NAME)
    .insert({
      owner_id: user.id,
      payload,
    })
    .select('id')
    .single();

  if (error) {
    console.error(
      '[공유 생성] Supabase 저장 실패',
      error,
    );

    throw new Error(
      '분석 결과를 저장하지 못했습니다.',
    );
  }

  if (!data?.id) {
    throw new Error(
      '공유 링크 ID를 생성하지 못했습니다.',
    );
  }

  const url =
    `${origin}/share/${encodeURIComponent(data.id)}`;

  console.log(
    '[공유 생성] 링크 생성 성공',
    url,
  );

  return {
    id: data.id,
    url,
  };
}

/**
 * 공유 분석 불러오기
 */
export async function getSharedAnalysis(
  id: string,
): Promise<SharedAnalysisRecord | null> {
  if (!id?.trim()) {
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
    console.error(
      '[공유 조회] 오류',
      error,
    );

    throw new Error(
      '공유된 분석 결과를 불러오지 못했습니다.',
    );
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
 * 웹 / 모바일 공유 처리
 *
 * 웹: 브라우저 공유 또는 링크 복사
 * iOS / Android: 시스템 공유 창 실행
 */
export async function sharePublicAnalysisLink(
  url: string,
  title: string,
  text: string,
): Promise<ShareResult> {
  console.log(
    '[공유 실행] 플랫폼',
    Platform.OS,
  );

  console.log(
    '[공유 실행] URL',
    url,
  );

  // 웹 브라우저
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

        console.log(
          '[공유 실행] 웹 공유 성공',
        );

        return 'shared';
      } catch (error) {
        if (
          error instanceof Error &&
          error.name === 'AbortError'
        ) {
          return 'cancelled';
        }

        console.error(
          '[공유 실행] 웹 공유 오류',
          error,
        );

        // 공유 창 호출이 실패했다면 복사 시도
      }
    }

    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(url);

      console.log(
        '[공유 실행] 링크 복사 완료',
      );

      return 'copied';
    }

    return 'unsupported';
  }

  // iOS / Android
  try {
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
      console.log(
        '[공유 실행] 모바일 공유 완료',
      );

      return 'shared';
    }

    return 'unsupported';
  } catch (error) {
    console.error(
      '[공유 실행] 모바일 공유 실패',
      error,
    );

    throw error;
  }
}
