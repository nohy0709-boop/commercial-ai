import type { Region } from '@/data/mockMarketAnalysisData';
import { useRouter } from 'expo-router';
import React from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// 실제로는 주소 입력 → Geocoding API로 좌표 변환하는 기능이 필요하지만,
// 아직 실제 API 연동 전이라 우선 기존 지역 3개 중에서 고르는 방식으로 대체합니다.
const REGIONS: Region[] = ['성수동', '건대입구', '왕십리'];

export default function LocationRecommendScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.header}>보유하신 장소(지역)를 선택해주세요</Text>

      <FlatList
        data={REGIONS}
        keyExtractor={item => item}
        renderItem={({item}) => (
          <TouchableOpacity
            style={styles.item}
            activeOpacity={0.7}
            onPress={() =>
              router.push({
                pathname: '/market-analysis/location-recommend-result',
                params: {region: item},
              })
            }>
            <Text style={styles.itemText}>{item}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, padding: 20, backgroundColor: '#FFFFFF'},
  header: {fontSize: 20, fontWeight: '700', marginTop: 12, marginBottom: 20},
  item: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingVertical: 18,
    paddingHorizontal: 16,
    marginBottom: 12,
    backgroundColor: '#F8F9FA',
  },
  itemText: {fontSize: 16, fontWeight: '600', color: '#1A1A1A'},
});