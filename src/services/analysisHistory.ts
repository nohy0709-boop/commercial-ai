import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'analysis_history';

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

export async function getAnalysisHistory(): Promise<
  AnalysisHistoryItem[]
> {
  try {
    const raw =
      await AsyncStorage.getItem(
        STORAGE_KEY,
      );

    if (!raw) {
      return [];
    }

    const parsed =
      JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      return [];
    }

    const histories: AnalysisHistoryItem[] =
      parsed.map(
        (
          item: AnalysisHistoryItem,
        ) => ({
          ...item,

          isFavorite:
            item.isFavorite ??
            false,
        }),
      );

    histories.sort(
      (a, b) =>
        new Date(
          b.createdAt,
        ).getTime() -
        new Date(
          a.createdAt,
        ).getTime(),
    );

    return histories;
  } catch (error) {
    console.error(
      '분석 기록 조회 실패:',
      error,
    );

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
    const histories =
      await getAnalysisHistory();

    const newItem: AnalysisHistoryItem =
      {
        ...data,

        id:
          `${Date.now()}-${Math.random()
            .toString(36)
            .slice(2, 8)}`,

        createdAt:
          new Date().toISOString(),

        isFavorite:
          data.isFavorite ??
          false,
      };

    const updated =
      [
        newItem,
        ...histories,
      ];

    await AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(
        updated,
      ),
    );

    return newItem;
  } catch (error) {
    console.error(
      '분석 기록 저장 실패:',
      error,
    );

    throw error;
  }
}

export async function deleteAnalysis(
  id: string,
): Promise<void> {
  try {
    const histories =
      await getAnalysisHistory();

    const updated =
      histories.filter(
        item =>
          item.id !== id,
      );

    await AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(
        updated,
      ),
    );
  } catch (error) {
    console.error(
      '분석 기록 삭제 실패:',
      error,
    );

    throw error;
  }
}

export async function toggleAnalysisFavorite(
  id: string,
): Promise<AnalysisHistoryItem | null> {
  try {
    const histories =
      await getAnalysisHistory();

    let changedItem:
      | AnalysisHistoryItem
      | null = null;

    const updated =
      histories.map(
        item => {
          if (
            item.id !==
            id
          ) {
            return item;
          }

          changedItem =
            {
              ...item,

              isFavorite:
                !(
                  item.isFavorite ??
                  false
                ),
            };

          return changedItem;
        },
      );

    await AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(
        updated,
      ),
    );

    return changedItem;
  } catch (error) {
    console.error(
      '찜 상태 변경 실패:',
      error,
    );

    throw error;
  }
}

export async function setAnalysisFavorite(
  id: string,
  isFavorite: boolean,
): Promise<AnalysisHistoryItem | null> {
  try {
    const histories =
      await getAnalysisHistory();

    let changedItem:
      | AnalysisHistoryItem
      | null = null;

    const updated =
      histories.map(
        item => {
          if (
            item.id !==
            id
          ) {
            return item;
          }

          changedItem =
            {
              ...item,
              isFavorite,
            };

          return changedItem;
        },
      );

    await AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(
        updated,
      ),
    );

    return changedItem;
  } catch (error) {
    console.error(
      '찜 상태 저장 실패:',
      error,
    );

    throw error;
  }
}

export async function getFavoriteAnalyses(): Promise<
  AnalysisHistoryItem[]
> {
  try {
    const histories =
      await getAnalysisHistory();

    return histories.filter(
      item =>
        item.isFavorite ===
        true,
    );
  } catch (error) {
    console.error(
      '찜한 분석 조회 실패:',
      error,
    );

    return [];
  }
}

export async function getAnalysisById(
  id: string,
): Promise<
  AnalysisHistoryItem | null
> {
  try {
    const histories =
      await getAnalysisHistory();

    return (
      histories.find(
        item =>
          item.id ===
          id,
      ) ??
      null
    );
  } catch (error) {
    console.error(
      '분석 기록 단건 조회 실패:',
      error,
    );

    return null;
  }
}

export async function clearAnalysisHistory(): Promise<void> {
  try {
    await AsyncStorage.removeItem(
      STORAGE_KEY,
    );
  } catch (error) {
    console.error(
      '분석 기록 전체 삭제 실패:',
      error,
    );

    throw error;
  }
}