import type { Region } from '@/data/mockMarketAnalysisData';
import { ALL_REGIONS } from '@/data/mockMarketAnalysisData';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// 실제로는 주소 입력 → Geocoding API로 좌표 변환하는 기능이 필요하지만,
// 아직 실제 API 연동 전이라 우선 기존 지역 3개 중에서 고르는 방식으로 대체합니다.
// 보유하신 장소가 여러 곳일 수 있어 여러 개 선택 가능하게 만들었습니다.
export default function LocationRecommendScreen() {
  const router = useRouter();
  const [selectedRegions, setSelectedRegions] = useState<Region[]>([]);

  const toggleRegion = (region: Region) => {
    setSelectedRegions(prev =>
      prev.includes(region) ? prev.filter(r => r !== region) : [...prev, region],
    );
  };

  const handleAnalyze = () => {
    if (selectedRegions.length === 0) {
      return;
    }
    router.push({
      pathname: '/market-analysis/location-recommend-result',
      params: {regions: selectedRegions.join(',')},
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>보유하신 장소(지역)를 선택해주세요 (여러 개 가능)</Text>

      <FlatList
        data={ALL_REGIONS}
        keyExtractor={item => item}
        renderItem={({item}) => {
          const selected = selectedRegions.includes(item);
          return (
            <TouchableOpacity
              style={[styles.item, selected && styles.itemSelected]}
              activeOpacity={0.7}
              onPress={() => toggleRegion(item)}>
              <Text style={[styles.itemText, selected && styles.itemTextSelected]}>
                {item}
              </Text>
              {selected && <Text style={styles.checkMark}>✓</Text>}
            </TouchableOpacity>
          );
        }}
      />

      <TouchableOpacity
        style={[
          styles.analyzeButton,
          selectedRegions.length === 0 && styles.analyzeButtonDisabled,
        ]}
        activeOpacity={0.7}
        disabled={selectedRegions.length === 0}
        onPress={handleAnalyze}>
        <Text style={styles.analyzeButtonText}>
          {`선택한 ${selectedRegions.length}개 장소 분석하기`}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, padding: 20, backgroundColor: '#FFFFFF'},
  header: {fontSize: 18, fontWeight: '700', marginTop: 12, marginBottom: 20},
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingVertical: 18,
    paddingHorizontal: 16,
    marginBottom: 12,
    backgroundColor: '#F8F9FA',
  },
  itemSelected: {
    borderColor: '#1D4ED8',
    backgroundColor: '#EAF2FF',
  },
  itemText: {fontSize: 16, fontWeight: '600', color: '#1A1A1A'},
  itemTextSelected: {color: '#1D4ED8'},
  checkMark: {fontSize: 16, fontWeight: '700', color: '#1D4ED8'},
  analyzeButton: {
    marginTop: 8,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#1D4ED8',
    alignItems: 'center',
  },
  analyzeButtonDisabled: {
    backgroundColor: '#C6D3EE',
  },
  analyzeButtonText: {fontSize: 16, fontWeight: '700', color: '#FFFFFF'},
});