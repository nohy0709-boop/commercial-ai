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

export default function RegionResultScreen() {
  const {businessName, lclsCode, mclsCode, sclsCode, areas} =
    useLocalSearchParams<{
      businessName: string;
      lclsCode: string;
      mclsCode: string;
      sclsCode: string;
      areas: string;
    }>();

  const [results, setResults] = useState<ScoredCommercialAnalysisResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const selectedAreaNames = areas.split(',');
    const targets = sejongAreas.filter(area =>
      selectedAreaNames.includes(area.name),
    );

    const run = async () => {
      try {
        setLoading(true);
        setErrorMessage('');

        const analysisResults = await Promise.all(
          targets.map(area =>
            analyzeCommercialArea(
              area.name,
              area.code,
              businessName,
              lclsCode,
              mclsCode || undefined,
              sclsCode || undefined,
            ),
          ),
        );

        setResults(calculateSuitabilityScores(analysisResults));
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
    // areas, businessName 등이 바뀔 때마다 다시 분석합니다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [areas, businessName, lclsCode, mclsCode, sclsCode]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{`'${businessName}' 지역별 적합도 순위`}</Text>

      {loading && (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" />
          <Text style={styles.loadingText}>상권 데이터를 분석하는 중...</Text>
        </View>
      )}

      {!loading && errorMessage !== '' && (
        <Text style={styles.error}>{errorMessage}</Text>
      )}

      {!loading &&
        errorMessage === '' &&
        results.map((item, index) => (
          <View key={item.areaName} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.rank}>{`${index + 1}위`}</Text>
              <Text style={styles.name}>{item.areaName}</Text>
              <Text style={styles.score}>{`${item.suitabilityScore}점`}</Text>
            </View>
            <Text style={styles.metaLine}>
              {`유동인구 ${item.floatingPopulation.toLocaleString()}명 · ${businessName} ${item.storeCount}개`}
            </Text>
            <Text style={styles.metaLine}>
              {`경쟁밀도 ${item.competitionDensity.toFixed(2)} · 점포당 카드소비 ${Math.round(
                item.averageSalesPerStore,
              ).toLocaleString()}원`}
            </Text>
          </View>
        ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {padding: 20, paddingBottom: 40, backgroundColor: '#FFFFFF'},
  title: {fontSize: 20, fontWeight: '700', marginTop: 12, marginBottom: 20},
  loadingBox: {marginTop: 30, alignItems: 'center', gap: 10},
  loadingText: {fontSize: 14, color: '#6B6B6B'},
  error: {color: '#D14343', fontSize: 14, marginTop: 12},
  card: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    backgroundColor: '#F8F9FA',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  rank: {fontSize: 14, fontWeight: '700', color: '#1D4ED8', marginRight: 8},
  name: {fontSize: 16, fontWeight: '700', color: '#1A1A1A', flex: 1},
  score: {fontSize: 14, fontWeight: '700', color: '#1D4ED8'},
  metaLine: {fontSize: 12, color: '#8A8A8A', marginBottom: 4},
});