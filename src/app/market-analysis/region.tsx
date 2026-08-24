import type { Industry, Region } from '@/data/mockMarketAnalysisData';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const REGIONS: Region[] = ['성수동', '건대입구', '왕십리'];

export default function RegionSelectionScreen() {
  const router = useRouter();
  // 이전 화면(industry.tsx)에서 router.push할 때 넘겨준 값을 여기서 읽습니다.
  const {industry} = useLocalSearchParams<{industry: Industry}>();

  return (
    <View style={styles.container}>
      <Text style={styles.header}>{`'${industry}' 업종의 지역을 선택해주세요`}</Text>

      <FlatList
        data={REGIONS}
        keyExtractor={item => item}
        renderItem={({item}) => (
          <TouchableOpacity
            style={styles.item}
            activeOpacity={0.7}
            onPress={() =>
              router.push({
                pathname: '/market-analysis/result',
                params: {industry, region: item},
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
