import { supabase } from '@/lib/supabase';
import { getCurrentUser } from '@/services/auth';

export interface StartupNeeds {
  businessType: string;
  budget: string;
  preferredAreas: string[];
  priorities: string[];
  targetCustomer: string;
  updatedAt: string;
}

export interface StartupNeedsHistoryItem {
  id: string;
  snapshot: StartupNeeds;
  createdAt: string;
}

async function getUser() {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error('로그인이 필요합니다.');
  }

  return user;
}

/**
 * 앱에서 사용하는 예산 문자열을
 * Supabase의 budget_min / budget_max로 변환
 */
function budgetToRange(budget: string) {
  switch (budget) {
    case '3,000만원 이하':
      return {
        min: 0,
        max: 30000000,
      };

    case '5,000만원 이하':
      return {
        min: 0,
        max: 50000000,
      };

    case '1억원 이하':
      return {
        min: 0,
        max: 100000000,
      };

    case '1억원 이상':
      return {
        min: 100000000,
        max: null,
      };

    default:
      return {
        min: null,
        max: null,
      };
  }
}

/**
 * Supabase 예산 데이터를
 * 앱에서 사용하는 문자열로 변환
 */
function rangeToBudget(
  min: number | null,
  max: number | null,
) {
  if (max === 30000000) {
    return '3,000만원 이하';
  }

  if (max === 50000000) {
    return '5,000만원 이하';
  }

  if (max === 100000000) {
    return '1억원 이하';
  }

  if (min === 100000000 && max === null) {
    return '1억원 이상';
  }

  return '';
}

/**
 * 현재 사용자의 창업 니즈 조회
 */
export async function getStartupNeeds(): Promise<
  StartupNeeds | null
> {
  try {
    const user = await getUser();

    const { data, error } = await supabase
      .from('user_profiles')
      .select(
        `
        interested_businesses,
        budget_min,
        budget_max,
        interested_regions,
        priority_factors,
        target_customer,
        setup_completed,
        updated_at
        `,
      )
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      return null;
    }

    if (data.setup_completed !== true) {
      return null;
    }

    const businesses = Array.isArray(
      data.interested_businesses,
    )
      ? data.interested_businesses
      : [];

    const regions = Array.isArray(
      data.interested_regions,
    )
      ? data.interested_regions
      : [];

    const priorities = Array.isArray(
      data.priority_factors,
    )
      ? data.priority_factors
      : [];

    return {
      businessType: businesses[0] ?? '',

      budget: rangeToBudget(
        data.budget_min,
        data.budget_max,
      ),

      preferredAreas: regions,

      priorities,

      targetCustomer:
        data.target_customer ?? '',

      updatedAt:
        data.updated_at ??
        new Date().toISOString(),
    };
  } catch (error) {
    console.error(
      '창업 니즈 조회 실패:',
      error,
    );

    return null;
  }
}

/**
 * 창업 니즈 저장
 *
 * AsyncStorage가 아니라
 * Supabase user_profiles에 저장
 */
export async function saveStartupNeeds(
  data: Omit<StartupNeeds, 'updatedAt'>,
): Promise<StartupNeeds> {
  const user = await getUser();

  const now = new Date().toISOString();

  const budgetRange = budgetToRange(
    data.budget,
  );

  const nickname =
    user.user_metadata?.nickname ?? null;

  const { error } = await supabase
    .from('user_profiles')
    .upsert(
      {
        user_id: user.id,

        nickname,

        interested_businesses: [
          data.businessType,
        ],

        budget_min: budgetRange.min,

        budget_max: budgetRange.max,

        interested_regions:
          data.preferredAreas,

        priority_factors:
          data.priorities,

        target_customer:
          data.targetCustomer,

        setup_completed: true,

        updated_at: now,
      },
      {
        onConflict: 'user_id',
      },
    );

  if (error) {
    console.error(
      'Supabase 창업 니즈 저장 실패:',
      error,
    );

    throw error;
  }

  return {
    ...data,
    updatedAt: now,
  };
}

/**
 * 기존 코드와의 호환용
 *
 * 현재 별도 history 테이블이 없으므로
 * 현재 저장된 값을 1개의 기록처럼 반환
 */
export async function getStartupNeedsHistory(): Promise<
  StartupNeedsHistoryItem[]
> {
  const needs = await getStartupNeeds();

  if (!needs) {
    return [];
  }

  return [
    {
      id: needs.updatedAt,
      snapshot: needs,
      createdAt: needs.updatedAt,
    },
  ];
}

/**
 * 최초 창업 설정 완료 여부
 */
export async function hasStartupNeeds() {
  try {
    const user = await getUser();

    const { data, error } = await supabase
      .from('user_profiles')
      .select('setup_completed')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return data?.setup_completed === true;
  } catch (error) {
    console.error(
      '창업 니즈 설정 여부 조회 실패:',
      error,
    );

    return false;
  }
}