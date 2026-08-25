import { COLORS } from '@/constants/colors';
import { sejongAreas } from '@/constants/sejongAreas';
import type { ScoredCommercialAnalysisResult } from '@/services/commercialAnalysis';
import {
  analyzeCommercialArea,
  calculateSuitabilityScores,
} from '@/services/commercialAnalysis';
import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

type RankedResult = ScoredCommercialAnalysisResult & {
  rank: number;
};

const delay = (ms: number) =>
  new Promise(resolve => setTimeout(resolve, ms));

export default function ResultScreen() {
  const {
    businessName,
    lclsCode,
    mclsCode,
    sclsCode,
    areas,
  } = useLocalSearchParams<{
    businessName: string;
    lclsCode: string;
    mclsCode: string;
    sclsCode: string;
    areas: string;
  }>();

  const [results, setResults] = useState<RankedResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const selectedAreaNames = (areas ?? '')
      .split(',')
      .filter(Boolean);

    const targets = sejongAreas.filter(area =>
      selectedAreaNames.includes(area.name),
    );

    const run = async () => {
      try {
        setLoading(true);
        setErrorMessage('');
        setResults([]);

        const analysisResults: ScoredCommercialAnalysisResult[] = [];

        // API 요청 과다(429) 방지를 위해 지역별로 순차 요청
        for (const area of targets) {
          try {
            const result = await analyzeCommercialArea(
              area.name,
              area.code,
              businessName,
              lclsCode,
              mclsCode || undefined,
              sclsCode || undefined,
            );

            analysisResults.push(
              result as ScoredCommercialAnalysisResult,
            );

            await delay(600);
          } catch (error) {
            console.error(
              `${area.name} 분석 실패`,
              error,
            );

            if (
              error instanceof Error &&
              error.message.includes('429')
            ) {
              await delay(2000);
            }
          }
        }

        if (analysisResults.length === 0) {
          setErrorMessage(
            '분석 결과를 가져오지 못했습니다. 잠시 후 다시 시도해주세요.',
          );
          return;
        }

        const scoredResults =
          calculateSuitabilityScores(analysisResults);

        setResults(
          scoredResults.map((item, index) => ({
            ...item,
            rank: index + 1,
          })),
        );
      } catch (error) {
        console.error('상권 분석 오류:', error);

        setErrorMessage(
          error instanceof Error
            ? error.message
            : '상권 분석 중 오류가 발생했습니다.',
        );
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [
    businessName,
    lclsCode,
    mclsCode,
    sclsCode,
    areas,
  ]);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.headerSection}>
        <Text style={styles.smallTitle}>
          지역별 적합도 분석
        </Text>

        <Text style={styles.title}>
          {businessName
            ? `${businessName} 추천 지역`
            : '추천 지역'}
        </Text>

        <Text style={styles.description}>
          선택한 업종과 세종시 상권 데이터를 바탕으로
          지역별 적합도를 분석했어요.
        </Text>
      </View>

      {loading && (
        <View style={styles.loadingBox}>
          <ActivityIndicator
            size="large"
            color={COLORS.primary}
          />

          <Text style={styles.loadingText}>
            상권 데이터를 분석하는 중...
          </Text>
        </View>
      )}

      {!loading && errorMessage !== '' && (
        <View style={styles.errorBox}>
          <Text style={styles.errorTitle}>
            분석 결과를 불러오지 못했어요
          </Text>

          <Text style={styles.error}>
            {errorMessage}
          </Text>
        </View>
      )}

      {!loading &&
        errorMessage === '' &&
        results.map(item => (
          <View
            key={item.areaName}
            style={[
              styles.card,
              item.rank === 1 && styles.topCard,
            ]}
          >
            <View style={styles.cardHeader}>
              <View style={styles.rankBadge}>
                <Text style={styles.rank}>
                  {item.rank}위
                </Text>
              </View>

              <Text style={styles.name}>
                {item.areaName}
              </Text>

              <Text style={styles.score}>
                {item.suitabilityScore}
                <Text style={styles.scoreUnit}>
                  점
                </Text>
              </Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.dataRow}>
              <Text style={styles.dataLabel}>
                유동인구
              </Text>

              <Text style={styles.dataValue}>
                {item.floatingPopulation.toLocaleString()}명
              </Text>
            </View>

            <View style={styles.dataRow}>
              <Text style={styles.dataLabel}>
                {businessName} 점포 수
              </Text>

              <Text style={styles.dataValue}>
                {item.storeCount}개
              </Text>
            </View>

            <View style={styles.dataRow}>
              <Text style={styles.dataLabel}>
                경쟁밀도
              </Text>

              <Text style={styles.dataValue}>
                {item.competitionDensity.toFixed(2)}
              </Text>
            </View>

            <View style={styles.dataRow}>
              <Text style={styles.dataLabel}>
                점포당 카드소비
              </Text>

              <Text style={styles.dataValue}>
                {Math.round(
                  item.averageSalesPerStore,
                ).toLocaleString()}
                원
              </Text>
            </View>
          </View>
        ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  container: {
    padding: 20,
    paddingBottom: 40,
    backgroundColor: COLORS.background,
  },

  headerSection: {
    marginTop: 10,
    marginBottom: 22,
  },

  smallTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.primary,
    marginBottom: 6,
  },

  title: {
    fontSize: 25,
    fontWeight: '900',
    color: COLORS.text,
    marginBottom: 8,
  },

  description: {
    fontSize: 13,
    lineHeight: 20,
    color: COLORS.textSecondary,
  },

  loadingBox: {
    marginTop: 40,
    paddingVertical: 30,
    alignItems: 'center',
    gap: 12,
  },

  loadingText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },

  errorBox: {
    padding: 18,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F4CCCC',
    backgroundColor: '#FFF7F7',
  },

  errorTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 6,
  },

  error: {
    fontSize: 13,
    lineHeight: 19,
    color: '#D14343',
  },

  card: {
    padding: 18,
    marginBottom: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },

  topCard: {
    borderColor: COLORS.primary,
    backgroundColor: '#F1FFF5',
  },

  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  rankBadge: {
    paddingVertical: 5,
    paddingHorizontal: 9,
    borderRadius: 12,
    backgroundColor: COLORS.lime,
    marginRight: 9,
  },

  rank: {
    fontSize: 12,
    fontWeight: '900',
    color: COLORS.primary,
  },

  name: {
    flex: 1,
    fontSize: 17,
    fontWeight: '900',
    color: COLORS.text,
  },

  score: {
    fontSize: 24,
    fontWeight: '900',
    color: COLORS.primary,
  },

  scoreUnit: {
    fontSize: 13,
    fontWeight: '800',
  },

  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 15,
  },

  dataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },

  dataLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },

  dataValue: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.text,
  },
});