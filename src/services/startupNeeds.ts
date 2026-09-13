import AsyncStorage from '@react-native-async-storage/async-storage';

import {
    getCurrentUser,
} from '@/services/auth';

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

async function getUserId() {
  const user =
    await getCurrentUser();

  if (!user) {
    throw new Error(
      '로그인이 필요합니다.',
    );
  }

  return user.id;
}

function getNeedsKey(
  userId: string,
) {
  return `startup_needs_${userId}`;
}

function getNeedsHistoryKey(
  userId: string,
) {
  return `startup_needs_history_${userId}`;
}

/**
 * 현재 창업 니즈 조회
 */
export async function getStartupNeeds(): Promise<
  StartupNeeds | null
> {
  try {
    const userId =
      await getUserId();

    const raw =
      await AsyncStorage.getItem(
        getNeedsKey(
          userId,
        ),
      );

    if (!raw) {
      return null;
    }

    return JSON.parse(
      raw,
    ) as StartupNeeds;
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
 * 저장할 때마다 변경 내역에도 기록
 */
export async function saveStartupNeeds(
  data: Omit<
    StartupNeeds,
    'updatedAt'
  >,
): Promise<StartupNeeds> {
  const userId =
    await getUserId();

  const now =
    new Date().toISOString();

  const needs: StartupNeeds = {
    ...data,

    updatedAt:
      now,
  };

  await AsyncStorage.setItem(
    getNeedsKey(
      userId,
    ),
    JSON.stringify(
      needs,
    ),
  );

  const history =
    await getStartupNeedsHistory();

  const historyItem: StartupNeedsHistoryItem =
    {
      id:
        `${Date.now()}-${Math.random()
          .toString(36)
          .slice(2, 8)}`,

      snapshot:
        needs,

      createdAt:
        now,
    };

  await AsyncStorage.setItem(
    getNeedsHistoryKey(
      userId,
    ),
    JSON.stringify([
      historyItem,
      ...history,
    ]),
  );

  return needs;
}

/**
 * 변경 내역 조회
 */
export async function getStartupNeedsHistory(): Promise<
  StartupNeedsHistoryItem[]
> {
  try {
    const userId =
      await getUserId();

    const raw =
      await AsyncStorage.getItem(
        getNeedsHistoryKey(
          userId,
        ),
      );

    if (!raw) {
      return [];
    }

    const parsed =
      JSON.parse(
        raw,
      );

    if (
      !Array.isArray(
        parsed,
      )
    ) {
      return [];
    }

    return parsed;
  } catch (error) {
    console.error(
      '창업 니즈 변경 내역 조회 실패:',
      error,
    );

    return [];
  }
}

/**
 * 최초 설정 여부
 */
export async function hasStartupNeeds() {
  const needs =
    await getStartupNeeds();

  return !!needs;
}