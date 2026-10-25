import { supabase } from '@/lib/supabase';
import { getCurrentUser } from '@/services/auth';

/**
 * 초기 창업 비용 계산 저장소 (계정별, Supabase `startup_cost_plans`)
 *
 * 금액 단위는 모두 "만원"이다.
 */

const TABLE = 'startup_cost_plans';

export interface CostPlan {
  id: string;
  title: string;
  /** 항목 키 → 금액(만원) */
  items: Record<string, number>;
  /** 운영자금으로 확보할 개월 수 */
  months: number;
  /** 총 필요 자금(만원) */
  totalManwon: number;
  createdAt: string;
  updatedAt: string;
}

export interface SaveCostPlanInput {
  /** 있으면 수정, 없으면 새로 저장 */
  id?: string | null;
  title: string;
  items: Record<string, number>;
  months: number;
  totalManwon: number;
}

function rowToPlan(row: any): CostPlan {
  return {
    id: String(row.id),
    title: row.title ?? '',
    items:
      row.items && typeof row.items === 'object' ? row.items : {},
    months: Number(row.months ?? 3),
    totalManwon: Number(row.total_manwon ?? 0),
    createdAt: row.created_at,
    updatedAt: row.updated_at ?? row.created_at,
  };
}

async function getUserId(): Promise<string | null> {
  try {
    const user = await getCurrentUser();

    return user?.id ?? null;
  } catch {
    return null;
  }
}

/** 로그인하지 않았다면 빈 목록을 돌려준다. */
export async function getCostPlans(): Promise<CostPlan[]> {
  try {
    const userId = await getUserId();

    if (!userId) {
      return [];
    }

    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) {
      throw error;
    }

    return (data ?? []).map(rowToPlan);
  } catch (error) {
    console.error('비용 계산 목록 조회 실패:', error);

    return [];
  }
}

/** 로그인이 필요하다. 로그인하지 않았다면 오류를 던진다. */
export async function saveCostPlan(
  input: SaveCostPlanInput,
): Promise<CostPlan> {
  const userId = await getUserId();

  if (!userId) {
    throw new Error('로그인이 필요합니다.');
  }

  const now = new Date().toISOString();

  const payload = {
    title: input.title,
    items: input.items,
    months: input.months,
    total_manwon: input.totalManwon,
    updated_at: now,
  };

  if (input.id) {
    const { data, error } = await supabase
      .from(TABLE)
      .update(payload)
      .eq('id', input.id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('비용 계산 수정 실패:', error);
      throw error;
    }

    return rowToPlan(data);
  }

  const { data, error } = await supabase
    .from(TABLE)
    .insert({ ...payload, user_id: userId })
    .select()
    .single();

  if (error) {
    console.error('비용 계산 저장 실패:', error);
    throw error;
  }

  return rowToPlan(data);
}

export async function deleteCostPlan(id: string): Promise<void> {
  const userId = await getUserId();

  if (!userId) {
    throw new Error('로그인이 필요합니다.');
  }

  const { error } = await supabase
    .from(TABLE)
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  if (error) {
    console.error('비용 계산 삭제 실패:', error);
    throw error;
  }
}