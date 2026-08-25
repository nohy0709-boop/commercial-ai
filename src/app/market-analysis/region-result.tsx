import type { Industry, Region } from '@/data/mockMarketAnalysisData';
import { getRankedResults } from '@/data/mockMarketAnalysisData';
import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

export default function RegionResultScreen() {
  const {industry, regions} = useLocalSearchParams<{
    industry: Industry;
    regions: string;
  }>();
  const selectedRegions = regions.split(',') as Region[];
  const combos = selectedRegions.map(region => ({industry, region}));
  const results = getRankedResults(combos);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{`'${industry}' 지역별 적합도 순위`}</Text>

      {results.map((item, index) => (
        <View key={item.region} style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.rank}>{`${index + 1}위`}</Text>
            <Text style={styles.name}>{item.region}</Text>
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