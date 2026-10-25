import { supabase } from '@/lib/supabase';
import { getCurrentUser } from '@/services/auth';

export interface StartupNeeds {
  /** 대표 업종 (관심 업종 중 첫 번째) - 기존 화면 호환용 */
  businessType: string;
  /** 관심 업종 전체 목록 */
  businessTypes: string[];
  budget: string;
  preferredAreas: string[];
  priorities: string[];
  targetCustomer: string;
  /** 현재 창업 준비 단계 (예: 아이디어 탐색, 업종 결정 ...) */
  startupStage: string;
  /** 생각 중인 창업 형태 (개인 창업 / 프랜차이즈 / 아직 미정) */
  startupType: string;
  /** 보유한 점포/장소가 있는지 여부 */
  hasLocation: boolean;
  /** 보유한 장소의 주소 (hasLocation이 true일 때만 값이 있을 수 있음) */
  locationAddress: string | null;
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
 *
 * needs-setup.tsx에서 services/userProfile.ts의 saveUserProfile()로
 * 저장하는 user_profiles 테이블을 그대로 읽어온다.
 *
 * (이전엔 일부 필드만 선택해서 읽어와서,
 *  질문지에서 입력한 준비 단계 / 창업 형태 / 보유 장소 /
 *  복수 관심 업종 중 첫 번째 외의 나머지가 MY 페이지에
 *  반영되지 않는 문제가 있었음 → 전체 필드로 확장)
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
        startup_stage,
        startup_type,
        has_location,
        location_address,
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
      businessTypes: businesses,

      budget: rangeToBudget(
        data.budget_min,
        data.budget_max,
      ),

      preferredAreas: regions,

      priorities,

      targetCustomer:
        data.target_customer ?? '',

      startupStage:
        data.startup_stage ?? '',

      startupType:
        data.startup_type ?? '',

      hasLocation:
        data.has_location === true,

      locationAddress:
        data.location_address ?? null,

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
 *
 * 참고: 실제 질문지(needs-setup.tsx)는 이 함수가 아니라
 * services/userProfile.ts의 saveUserProfile()을 직접 호출한다.
 * 이 함수는 (혹시 다른 곳에서 쓰고 있을 수 있는) 기존 호출부와의
 * 호환을 위해 시그니처를 그대로 유지했다.
 */
export async function saveStartupNeeds(
  data: {
    businessType: string;
    budget: string;
    preferredAreas: string[];
    priorities: string[];
    targetCustomer: string;
  },
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
    businessTypes: [data.businessType],
    startupStage: '',
    startupType: '',
    hasLocation: false,
    locationAddress: null,
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
 * 창업 니즈 설정 진행률
 *
 * 질문지의 핵심 항목 8개 중 몇 개를 채웠는지 계산해서
 * MY 페이지의 진행 상태 표시에 사용한다.
 */
export function getStartupNeedsProgress(
  needs: StartupNeeds | null,
): { completed: number; total: number; percent: number } {
  const total = 8;

  if (!needs) {
    return { completed: 0, total, percent: 0 };
  }

  const checks = [
    !!needs.startupStage,
    needs.businessTypes.length > 0,
    !!needs.budget,
    needs.preferredAreas.length > 0,
    !!needs.startupType,
    needs.priorities.length > 0,
    !!needs.targetCustomer,
    needs.hasLocation === true || needs.hasLocation === false,
  ];

  const completed = checks.filter(Boolean).length;

  return {
    completed,
    total,
    percent: Math.round((completed / total) * 100),
  };
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