import { sejongAreas } from '@/constants/sejongAreas';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function RegionSelectionScreen() {
  const router = useRouter();
  const {businessName, lclsCode, mclsCode, sclsCode} = useLocalSearchParams<{
    businessName: string;
    lclsCode: string;
    mclsCode: string;
    sclsCode: string;
  }>();
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);

  const toggleArea = (name: string) => {
    setSelectedAreas(prev =>
      prev.includes(name) ? prev.filter(a => a !== name) : [...prev, name],
    );
  };

  const handleAnalyze = () => {
    if (selectedAreas.length === 0) {
      return;
    }
    router.push({
      pathname: '/market-analysis/region-result',
      params: {
        businessName,
        lclsCode,
        mclsCode,
        sclsCode,
        areas: selectedAreas.join(','),
      },
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>
        {`'${businessName}' 업종을 분석할 지역을 선택해주세요 (여러 개 가능)`}
      </Text>

      <FlatList
        data={sejongAreas}
        keyExtractor={item => item.code}
        renderItem={({item}) => {
          const selected = selectedAreas.includes(item.name);
          return (
            <TouchableOpacity
              style={[styles.item, selected && styles.itemSelected]}
              activeOpacity={0.7}
              onPress={() => toggleArea(item.name)}>
              <Text style={[styles.itemText, selected && styles.itemTextSelected]}>
                {item.name}
              </Text>
              {selected && <Text style={styles.checkMark}>✓</Text>}
            </TouchableOpacity>
          );
        }}
      />

      <TouchableOpacity
        style={[
          styles.analyzeButton,
          selectedAreas.length === 0 && styles.analyzeButtonDisabled,
        ]}
        activeOpacity={0.7}
        disabled={selectedAreas.length === 0}
        onPress={handleAnalyze}>
        <Text style={styles.analyzeButtonText}>
          {`선택한 ${selectedAreas.length}개 지역 분석하기`}
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