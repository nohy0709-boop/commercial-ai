import type { EventName, OperatingField } from '@/data/mockShortTermData';
import { getShortTermResult } from '@/data/mockShortTermData';
import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

export default function ShortTermSuitabilityResultScreen() {
  const {field, eventName} = useLocalSearchParams<{
    field: OperatingField;
    eventName: EventName;
  }>();
  const result = getShortTermResult(field, eventName);

  const rows: {label: string; value: string}[] = [
    {label: '예상 유동인구', value: result.expectedFootfall},
    {label: '예상 경쟁 부스 수', value: `${result.competitorBoothCount}개`},
    {label: '예상 수익', value: result.estimatedRevenue},
    {label: '주요 방문객 연령층', value: result.mainVisitorAgeGroup},
    {label: '경쟁도', value: result.competitionLevel},
    {label: '행사 지역', value: result.eventRegion},
    {label: '운영 기간', value: result.eventPeriod},
  ];

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{`${eventName} · ${field} 적합성 분석`}</Text>

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
            {`· ${reason}`}
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