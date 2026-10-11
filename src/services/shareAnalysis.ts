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

function getPublicAppOrigin() {
  const envUrl = process.env.EXPO_PUBLIC_APP_URL?.trim();

  if (envUrl) {
    return envUrl.replace(/\/+$/, '');
  }

  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return window.location.origin;
  }

  return '';
}

export async function createSharedAnalysis(
  payload: AnalysisReportData,
): Promise<{ id: string; url: string }> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
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

  const origin = getPublicAppOrigin();

  if (!origin) {
    throw new Error(
      '공개 앱 주소가 설정되지 않았습니다. EXPO_PUBLIC_APP_URL을 설정해주세요.',
    );
  }

  return {
    id: data.id,
    url: `${origin}/share/${data.id}`,
  };
}

export async function getSharedAnalysis(
  id: string,
): Promise<SharedAnalysisRecord | null> {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('id, owner_id, payload, created_at, expires_at')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    console.error('공유 분석 조회 실패:', error);
    throw new Error('공유된 분석 결과를 불러오지 못했습니다.');
  }

  return data as SharedAnalysisRecord | null;
}

export async function sharePublicAnalysisLink(
  url: string,
  title: string,
  text: string,
) {
  if (Platform.OS === 'web' && typeof navigator !== 'undefined') {
    if (navigator.share) {
      await navigator.share({
        title,
        text,
        url,
      });

      return 'shared' as const;
    }

    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(url);
      return 'copied' as const;
    }

    throw new Error(
      '이 브라우저에서는 공유 기능을 지원하지 않습니다.',
    );
  }

  return 'unsupported' as const;
}
