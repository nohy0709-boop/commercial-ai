import { supabase } from '@/lib/supabase';

export type UserProfileInput = {
  nickname?: string;

  startupStage: string;

  budgetMin: number | null;
  budgetMax: number | null;

  interestedBusinesses: string[];
  interestedRegions: string[];

  startupType: string;

  hasLocation: boolean;
  locationAddress: string | null;

  priorityFactors: string[];

  targetCustomer: string;
};

/*
 * 현재 로그인한 사용자의
 * 창업 프로필 가져오기
 */
export async function getUserProfile() {
  const {
    data: userData,
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw userError;
  }

  const user = userData.user;

  if (!user) {
    return null;
  }

  const {
    data,
    error,
  } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

/*
 * 최초 창업정보 입력이
 * 완료됐는지 확인
 */
export async function hasCompletedUserProfile() {
  const profile =
    await getUserProfile();

  return (
    profile?.setup_completed === true
  );
}

/*
 * 사용자 창업정보 저장
 *
 * 이미 프로필이 있으면 수정,
 * 없으면 새로 생성
 */
export async function saveUserProfile(
  input: UserProfileInput,
) {
  const {
    data: userData,
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw userError;
  }

  const user = userData.user;

  if (!user) {
    throw new Error(
      '로그인한 사용자 정보를 찾을 수 없습니다.',
    );
  }

  /*
   * 회원가입할 때 Supabase Auth metadata에
   * 저장했던 nickname도 사용할 수 있게 함.
   */
  const nickname =
    input.nickname ??
    user.user_metadata?.nickname ??
    null;

  const {
    data,
    error,
  } = await supabase
    .from('user_profiles')
    .upsert(
      {
        user_id: user.id,

        nickname,

        startup_stage:
          input.startupStage,

        budget_min:
          input.budgetMin,

        budget_max:
          input.budgetMax,

        interested_businesses:
          input.interestedBusinesses,

        interested_regions:
          input.interestedRegions,

        startup_type:
          input.startupType,

        has_location:
          input.hasLocation,

        location_address:
          input.hasLocation
            ? input.locationAddress
            : null,

        priority_factors:
          input.priorityFactors,

        target_customer:
          input.targetCustomer,

        setup_completed: true,

        updated_at:
          new Date().toISOString(),
      },
      {
        onConflict: 'user_id',
      },
    )
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}