import type { EventName } from '@/data/mockShortTermData';
import { ALL_FIELDS, getRankedShortTermResults } from '@/data/mockShortTermData';
import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

export default function EventRecommendResultScreen() {
  const {events} = useLocalSearchParams<{events: string}>();
  const selectedEvents = events.split(',') as EventName[];

  // 선택한 모든 행사 x 모든 운영 분야의 전체 조합을 만들어서 점수 순으로 정렬합니다.
  const combos = selectedEvents.flatMap(eventName =>
    ALL_FIELDS.map(field => ({field, eventName})),
  );
  const results = getRankedShortTermResults(combos);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>선택한 행사 운영 분야 추천 순위</Text>

      {results.map((item, index) => (
        <View key={`${item.eventName}-${item.field}`} style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.rank}>{`${index + 1}위`}</Text>
            <Text style={styles.name}>{`${item.eventName} · ${item.field}`}</Text>
            <Text style={styles.score}>{`${item.suitabilityScore}점`}</Text>
          </View>
          <Text style={styles.metaLine}>{`${item.eventRegion} · ${item.eventPeriod}`}</Text>
          <Text style={styles.metaLine}>{`예상 유동인구 ${item.expectedFootfall}`}</Text>
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
  rank: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1D4ED8',
    marginRight: 8,
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A1A',
    flex: 1,
  },
  score: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  metaLine: {
    fontSize: 12,
    color: '#8A8A8A',
    marginBottom: 2,
  },
  reason: {
    fontSize: 13,
    color: '#6B6B6B',
    lineHeight: 19,
    marginTop: 6,
  },
});