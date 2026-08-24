import type { Region } from '@/data/mockMarketAnalysisData';
import { getIndustryRecommendationsForRegion } from '@/data/mockMarketAnalysisData';
import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

export default function LocationRecommendResultScreen() {
  const {region} = useLocalSearchParams<{region: Region}>();
  const recommendations = getIndustryRecommendationsForRegion(region);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{`${region} 업종 추천 순위`}</Text>

      {recommendations.map((item, index) => (
        <View key={item.industry} style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.rank}>{`${index + 1}위`}</Text>
            <Text style={styles.industryName}>{item.industry}</Text>
            <Text style={styles.score}>{`${item.suitabilityScore}점`}</Text>
          </View>
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
    marginBottom: 8,
  },
  rank: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1D4ED8',
    marginRight: 8,
  },
  industryName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
    flex: 1,
  },
  score: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  reason: {
    fontSize: 13,
    color: '#6B6B6B',
    lineHeight: 19,
  },
});