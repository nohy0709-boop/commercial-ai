import { useRouter } from 'expo-router';
import React from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type MenuKey = 'industryToLocation' | 'locationToIndustry' | 'suitability';

const MENU_ITEMS: {key: MenuKey; title: string; description: string}[] = [
  {
    key: 'industryToLocation',
    title: '업종 기반 입지 추천',
    description: '원하는 업종을 고르면 어울리는 지역을 추천해드려요',
  },
  {
    key: 'locationToIndustry',
    title: '보유 장소 기반 업종 추천',
    description: '보유하신 장소에 어울리는 업종을 추천해드려요',
  },
  {
    key: 'suitability',
    title: '업종+입지 적합성 분석',
    description: '선택한 업종과 입지의 적합도를 분석해드려요',
  },
];

export default function MarketAnalysisMainScreen() {
  const router = useRouter();

  const handlePress = (key: MenuKey) => {
    if (key === 'industryToLocation') {
      router.push('/market-analysis/industry');
      return;
    }
    // 이번 작업 범위에는 포함되지 않은 메뉴라서 임시 안내만 띄웁니다.
    Alert.alert('준비 중', '해당 기능은 아직 준비 중입니다.');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>장기 상권 분석</Text>

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
