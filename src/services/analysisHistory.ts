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
}

/**
 * 분석 기록 전체 불러오기
 */
export async function getAnalysisHistory(): Promise<
  AnalysisHistoryItem[]
> {
  try {
    const savedData =
      await AsyncStorage.getItem(
        STORAGE_KEY,
      );

    if (!savedData) {
      return [];
    }

    return JSON.parse(savedData);
  } catch (error) {
    console.error(
      '분석 기록 불러오기 실패:',
      error,
    );

    return [];
  }
}

/**
 * 분석 결과 저장
 */
export async function saveAnalysis(
  data: Omit<
    AnalysisHistoryItem,
    'id' | 'createdAt'
  >,
) {
  try {
    const currentHistory =
      await getAnalysisHistory();

    const newItem: AnalysisHistoryItem = {
      ...data,

      id: Date.now().toString(),

      createdAt:
        new Date().toISOString(),
    };

    const updatedHistory = [
      newItem,
      ...currentHistory,
    ];

    await AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(
        updatedHistory,
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

/**
 * 분석 기록 삭제
 */
export async function deleteAnalysis(
  id: string,
) {
  try {
    const currentHistory =
      await getAnalysisHistory();

    const updatedHistory =
      currentHistory.filter(
        item => item.id !== id,
      );

    await AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(
        updatedHistory,
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