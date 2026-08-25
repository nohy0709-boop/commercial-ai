import type { Region } from '@/data/mockMarketAnalysisData';
import { ALL_INDUSTRIES, getRankedResults } from '@/data/mockMarketAnalysisData';
import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

export default function LocationRecommendResultScreen() {
  const {regions} = useLocalSearchParams<{regions: string}>();
  const selectedRegions = regions.split(',') as Region[];

  // 선택한 모든 장소 x 모든 업종의 전체 조합을 만들어서 점수 순으로 정렬합니다.
  const combos = selectedRegions.flatMap(region =>
    ALL_INDUSTRIES.map(industry => ({industry, region})),
  );
  const results = getRankedResults(combos);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>선택한 장소 업종 추천 순위</Text>

      {results.map((item, index) => (
        <View key={`${item.region}-${item.industry}`} style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.rank}>{`${index + 1}위`}</Text>
            <Text style={styles.name}>{`${item.region} · ${item.industry}`}</Text>
            <Text style={styles.score}>{`${item.suitabilityScore}점`}</Text>
          </View>
          <Text style={styles.metaLine}>
            {`유동인구 ${item.floatingPopulation} · 경쟁업체 ${item.competitorCount}개`}
          </Text>
          <Text style={styles.reason}>{item.recommendationReasons[0]}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {padding: 20, paddingBottom: 40, backgroundColor: '#FFFFFF'},
  title: {fontSize: 20, fontWeight: '700', marginTop: 12, marginBottom: 20},
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
  reason: {fontSize: 13, color: '#6B6B6B', lineHeight: 19},
});