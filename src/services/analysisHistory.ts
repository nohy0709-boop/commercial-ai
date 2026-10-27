import AsyncStorage from '@react-native-async-storage/async-storage';

import { supabase } from '@/lib/supabase';
import { getCurrentUser } from '@/services/auth';

/**
 * 분석 기록 / 찜 저장소
 *
 * - 로그인 상태: Supabase `analysis_history` 테이블에 저장 (계정 기준, 기기가 달라도 동일)
 * - 비로그인 상태: 기존처럼 이 기기의 AsyncStorage에 저장 (기존 동작 유지)
 * - 로그인 후 첫 조회 시, 이 기기에 남아있던 기존 로컬 기록을
 *   로그인한 계정으로 한 번 옮기고 로컬 기록은 삭제한다.
 *
 * 내보내는 함수 이름/인자/반환 타입은 기존과 동일하므로
 * 이 함수들을 호출하는 화면은 수정하지 않아도 된다.
 */

const LEGACY_STORAGE_KEY = 'analysis_history';

const TABLE = 'analysis_history';

export interface AnalysisHistoryItem {
  id: string;

  type:
    | 'comparison'
    | 'location'
    | 'owned';

  title: string;

  businessName: string;

  regions: string[];

  resultData: any;

  createdAt: string;

  isFavorite?: boolean;
}

/* ------------------------------------------------------------------ */
/* 공통 유틸                                                           */
/* ------------------------------------------------------------------ */

async function getUserId(): Promise<string | null> {
  try {
    const user = await getCurrentUser();

    return user?.id ?? null;
  } catch {
    return null;
  }
}

function rowToItem(row: any): AnalysisHistoryItem {
  return {
    id: String(row.id),
    type: row.type,
    title: row.title ?? '',
    businessName: row.business_name ?? '',
    regions: Array.isArray(row.regions) ? row.regions : [],
    resultData: row.result_data ?? null,
    createdAt: row.created_at,
    isFavorite: row.is_favorite === true,
  };
}

function sortByNewest(
  items: AnalysisHistoryItem[],
): AnalysisHistoryItem[] {
  return [...items].sort(
    (a, b) =>
      new Date(b.createdAt).getTime() -
      new Date(a.createdAt).getTime(),
  );
}

/* ------------------------------------------------------------------ */
/* 로컬(AsyncStorage) - 비로그인 + 기존 데이터 이전용                  */
/* ------------------------------------------------------------------ */

async function readLocal(): Promise<AnalysisHistoryItem[]> {
  const raw = await AsyncStorage.getItem(LEGACY_STORAGE_KEY);

  if (!raw) {
    return [];
  }

  const parsed = JSON.parse(raw);

  if (!Array.isArray(parsed)) {
    return [];
  }

  return sortByNewest(
    parsed.map((item: AnalysisHistoryItem) => ({
      ...item,
      isFavorite: item.isFavorite ?? false,
    })),
  );
}

async function writeLocal(
  items: AnalysisHistoryItem[],
): Promise<void> {
  await AsyncStorage.setItem(
    LEGACY_STORAGE_KEY,
    JSON.stringify(items),
  );
}

/* ------------------------------------------------------------------ */
/* 기존 로컬 기록 → 계정으로 1회 이전                                  */
/* ------------------------------------------------------------------ */

let migrationPromise: Promise<void> | null = null;

async function migrateLocalToAccount(
  userId: string,
): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(LEGACY_STORAGE_KEY);

    if (!raw) {
      return;
    }

    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed) || parsed.length === 0) {
      await AsyncStorage.removeItem(LEGACY_STORAGE_KEY);
      return;
    }

    const rows = parsed.map((item: AnalysisHistoryItem) => ({
      user_id: userId,
      type: item.type,
      title: item.title ?? '',
      business_name: item.businessName ?? '',
      regions: Array.isArray(item.regions) ? item.regions : [],
      result_data: item.resultData ?? null,
      is_favorite: item.isFavorite ?? false,
      created_at: item.createdAt ?? new Date().toISOString(),
    }));

    const { error } = await supabase.from(TABLE).insert(rows);

    if (error) {
      // 실패하면 로컬 기록을 지우지 않고 다음 기회에 다시 시도한다.
      console.error('기존 분석 기록 이전 실패:', error);
      return;
    }

    await AsyncStorage.removeItem(LEGACY_STORAGE_KEY);
  } catch (error) {
    console.error('기존 분석 기록 이전 중 오류:', error);
  }
}

async function ensureMigrated(userId: string): Promise<void> {
  if (!migrationPromise) {
    migrationPromise = migrateLocalToAccount(userId).finally(() => {
      migrationPromise = null;
    });
  }

  await migrationPromise;
}

/* ------------------------------------------------------------------ */
/* 공개 함수 (기존 시그니처 유지)                                      */
/* ------------------------------------------------------------------ */

export async function getAnalysisHistory(): Promise<
  AnalysisHistoryItem[]
> {
  try {
    const userId = await getUserId();

    if (!userId) {
      return await readLocal();
    }

    await ensureMigrated(userId);

    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return (data ?? []).map(rowToItem);
  } catch (error) {
    console.error('분석 기록 조회 실패:', error);

    return [];
  }
}

export async function saveAnalysis(
  data: Omit<
    AnalysisHistoryItem,
    'id' | 'createdAt'
  >,
): Promise<AnalysisHistoryItem> {
  try {
    const userId = await getUserId();

    if (!userId) {
      const histories = await readLocal();

      const newItem: AnalysisHistoryItem = {
        ...data,

        id: `${Date.now()}-${Math.random()
          .toString(36)
          .slice(2, 8)}`,

        createdAt: new Date().toISOString(),

        isFavorite: data.isFavorite ?? false,
      };

      await writeLocal([newItem, ...histories]);

      return newItem;
    }

    const { data: row, error } = await supabase
      .from(TABLE)
      .insert({
        user_id: userId,
        type: data.type,
        title: data.title ?? '',
        business_name: data.businessName ?? '',
        regions: data.regions ?? [],
        result_data: data.resultData ?? null,
        is_favorite: data.isFavorite ?? false,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return rowToItem(row);
  } catch (error) {
    console.error('분석 기록 저장 실패:', error);

    throw error;
  }
}

export async function deleteAnalysis(
  id: string,
): Promise<void> {
  try {
    const userId = await getUserId();

    if (!userId) {
      const histories = await readLocal();

      await writeLocal(
        histories.filter(item => item.id !== id),
      );

      return;
    }

    const { error } = await supabase
      .from(TABLE)
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error('분석 기록 삭제 실패:', error);

    throw error;
  }
}

export async function setAnalysisFavorite(
  id: string,
  isFavorite: boolean,
): Promise<AnalysisHistoryItem | null> {
  try {
    const userId = await getUserId();

    if (!userId) {
      const histories = await readLocal();

      let changedItem: AnalysisHistoryItem | null = null;

      const updated = histories.map(item => {
        if (item.id !== id) {
          return item;
        }

        changedItem = {
          ...item,
          isFavorite,
        };

        return changedItem;
      });

      await writeLocal(updated);

      return changedItem;
    }

    const { data: row, error } = await supabase
      .from(TABLE)
      .update({ is_favorite: isFavorite })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .maybeSingle();

    if (error) {
      throw error;
    }

    return row ? rowToItem(row) : null;
  } catch (error) {
    console.error('찜 상태 저장 실패:', error);

    throw error;
  }
}

export async function toggleAnalysisFavorite(
  id: string,
): Promise<AnalysisHistoryItem | null> {
  try {
    const current = await getAnalysisById(id);

    if (!current) {
      return null;
    }

    return await setAnalysisFavorite(
      id,
      !(current.isFavorite ?? false),
    );
  } catch (error) {
    console.error('찜 상태 변경 실패:', error);

    throw error;
  }
}

export async function getFavoriteAnalyses(): Promise<
  AnalysisHistoryItem[]
> {
  try {
    const histories = await getAnalysisHistory();

    return histories.filter(
      item => item.isFavorite === true,
    );
  } catch (error) {
    console.error('찜한 분석 조회 실패:', error);

    return [];
  }
}

export async function getAnalysisById(
  id: string,
): Promise<AnalysisHistoryItem | null> {
  try {
    const userId = await getUserId();

    if (!userId) {
      const histories = await readLocal();

      return histories.find(item => item.id === id) ?? null;
    }

    const { data: row, error } = await supabase
      .from(TABLE)
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return row ? rowToItem(row) : null;
  } catch (error) {
    console.error('분석 기록 단건 조회 실패:', error);

    return null;
  }
}

export async function clearAnalysisHistory(): Promise<void> {
  try {
    const userId = await getUserId();

    if (userId) {
      const { error } = await supabase
        .from(TABLE)
        .delete()
        .eq('user_id', userId);

      if (error) {
        throw error;
      }
    }

    await AsyncStorage.removeItem(LEGACY_STORAGE_KEY);
  } catch (error) {
    console.error('분석 기록 전체 삭제 실패:', error);

    throw error;
  }
}