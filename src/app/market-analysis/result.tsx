import type { Industry, Region } from '@/data/mockMarketAnalysisData';
import { getMarketAnalysisResult } from '@/data/mockMarketAnalysisData';
import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

export default function AnalysisResultScreen() {
  const {industry, region} = useLocalSearchParams<{
    industry: Industry;
    region: Region;
  }>();

  // 실제 API 연동 시에는 이 한 줄만 fetch 호출로 교체하면 됩니다.
  const result = getMarketAnalysisResult(industry, region);

  const rows: {label: string; value: string}[] = [
    {label: '유동인구', value: result.floatingPopulation},
    {label: '경쟁업체 수', value: `${result.competitorCount}개`},
    {label: '추정매출', value: result.estimatedRevenue},
    {label: '주요 연령층', value: result.mainAgeGroup},
    {label: '경쟁도', value: result.competitionLevel},
  ];

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{`${region} · ${industry} 분석 결과`}</Text>

      <View style={styles.scoreBox}>
        <Text style={styles.scoreLabel}>적합도 점수</Text>
        <Text style={styles.scoreValue}>{`${result.suitabilityScore}점`}</Text>
      </View>

      <View style={styles.table}>
        {rows.map(row => (
          <View key={row.label} style={styles.row}>
            <Text style={styles.rowLabel}>{row.label}</Text>
            <Text style={styles.rowValue}>{row.value}</Text>
          </View>
        ))}
      </View>

      <View style={styles.reasonBox}>
        <Text style={styles.reasonTitle}>추천 이유</Text>
        {result.recommendationReasons.map((reason, index) => (
          <Text key={index} style={styles.reasonItem}>
            {`·  ${reason}`}
          </Text>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {padding: 20, paddingBottom: 40, backgroundColor: '#FFFFFF'},
  title: {fontSize: 20, fontWeight: '700', marginTop: 12, marginBottom: 20},
  scoreBox: {
    alignItems: 'center',
    backgroundColor: '#EAF2FF',
    borderRadius: 12,
    paddingVertical: 20,
    marginBottom: 20,
  },
  scoreLabel: {fontSize: 13, color: '#4A6FA5', marginBottom: 6},
  scoreValue: {fontSize: 32, fontWeight: '800', color: '#1D4ED8'},
  table: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  rowLabel: {fontSize: 14, color: '#6B6B6B'},
  rowValue: {fontSize: 14, fontWeight: '600', color: '#1A1A1A'},
  reasonBox: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
  },
  reasonTitle: {fontSize: 15, fontWeight: '700', marginBottom: 10},
  reasonItem: {fontSize: 13, color: '#3A3A3A', lineHeight: 20, marginBottom: 4},
});
