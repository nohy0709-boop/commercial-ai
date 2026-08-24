import { useRouter } from 'expo-router';
import React from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type MenuKey = 'fieldToEvent' | 'eventAnalysis' | 'suitability';

const MENU_ITEMS: {key: MenuKey; title: string; description: string}[] = [
  {
    key: 'fieldToEvent',
    title: '운영 분야 기반 행사/지역 추천',
    description: '운영하려는 분야를 고르면 어울리는 행사를 추천해드려요',
  },
  {
    key: 'eventAnalysis',
    title: '특정 행사/지역 기반 상권 분석',
    description: '행사나 지역을 고르면 주변 상권을 분석해드려요',
  },
  {
    key: 'suitability',
    title: '운영 분야 + 행사 적합성 분석',
    description: '선택한 분야와 행사의 적합도를 분석해드려요',
  },
];

export default function ShortTermMainScreen() {
  const router = useRouter();

  const handlePress = (key: MenuKey) => {
    if (key === 'fieldToEvent') {
      router.push('/short-term-analysis/field');
      return;
    }
    // 다음 단계에서 구현 예정
    Alert.alert('준비 중', '해당 기능은 아직 준비 중입니다.');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>단기 상권 분석</Text>

      {MENU_ITEMS.map(item => (
        <TouchableOpacity
          key={item.key}
          style={styles.card}
          activeOpacity={0.7}
          onPress={() => handlePress(item.key)}>
          <Text style={styles.cardTitle}>{item.title}</Text>
          <Text style={styles.cardDescription}>{item.description}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, padding: 20, backgroundColor: '#FFFFFF'},
  header: {fontSize: 24, fontWeight: '700', marginTop: 12, marginBottom: 24},
  card: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 16,
    marginBottom: 14,
    backgroundColor: '#F8F9FA',
  },
  cardTitle: {fontSize: 17, fontWeight: '600', marginBottom: 6, color: '#1A1A1A'},
  cardDescription: {fontSize: 13, color: '#6B6B6B'},
});